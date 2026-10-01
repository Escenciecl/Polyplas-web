/**
 * Envío por SMTP directo al servidor de correo de cPanel (mail.polyplas.cl:465).
 * Se usa para la copia a ventas@polyplas.cl: como el correo se entrega "desde dentro"
 * del propio servidor, no pasa por el filtro antispam (RBL) que bloquea a Brevo.
 *
 * Variables en Cloudflare Pages:
 *   SMTP_PASS  (secreto)  contraseña de la cuenta ventas@polyplas.cl  ← la ingresa la dueña
 *   SMTP_USER  (opcional) por defecto ventas@polyplas.cl
 *   SMTP_HOST  (opcional) por defecto mail.polyplas.cl
 *   SMTP_PORT  (opcional) por defecto 465 (SSL)
 */
import { connect } from "cloudflare:sockets";

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64utf8(s) {
  const bytes = enc.encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const wrap76 = (b64) => b64.replace(/.{1,76}/g, "$&\r\n");
const encHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64utf8(s)}?=`);

/** Arma el mensaje MIME (todo en base64: sin problemas de líneas largas ni puntos). */
export function buildMime({ from, fromName, to, replyTo, subject, html, attachments = [] }) {
  const boundary = "pp_" + crypto.randomUUID().replace(/-/g, "");
  const domain = (from.split("@")[1] || "polyplas.cl").trim();
  const lines = [
    `From: ${encHeader(fromName)} <${from}>`,
    `To: <${to}>`,
    ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
    `Subject: ${encHeader(subject)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(b64utf8(html)),
  ];
  for (const a of attachments) {
    const type = a.name.endsWith(".pdf") ? "application/pdf" : a.name.endsWith(".png") ? "image/png" : "text/html; charset=UTF-8";
    lines.push(
      `--${boundary}`,
      `Content-Type: ${type}; name="${a.name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${a.name}"`,
      "",
      wrap76(a.content),
    );
  }
  lines.push(`--${boundary}--`, "");
  return lines.join("\r\n");
}

/** Envía un correo por SMTP con SSL (puerto 465) y AUTH LOGIN. Lanza error con la respuesta del servidor si falla. */
export async function smtpSend(env, msg) {
  const host = (env.SMTP_HOST || "mail.polyplas.cl").trim();
  const port = parseInt(env.SMTP_PORT || "465", 10);
  const user = (env.SMTP_USER || "ventas@polyplas.cl").trim();
  const pass = env.SMTP_PASS || "";
  if (!pass) throw new Error("Falta SMTP_PASS");

  const socket = connect({ hostname: host, port }, { secureTransport: "on", allowHalfOpen: false });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  let buf = "";

  const readReply = async () => {
    // Lee hasta una línea "NNN " (fin de respuesta multilínea)
    const deadline = Date.now() + 20000;
    for (;;) {
      const lines = buf.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) {
          const reply = lines.slice(0, i + 1).join("\n");
          buf = lines.slice(i + 1).join("\r\n");
          return { code: parseInt(lines[i].slice(0, 3), 10), text: reply };
        }
      }
      if (Date.now() > deadline) throw new Error("SMTP sin respuesta");
      const { value, done } = await reader.read();
      if (done) throw new Error("SMTP cerró la conexión: " + buf.slice(0, 200));
      buf += dec.decode(value, { stream: true });
    }
  };
  const send = (s) => writer.write(enc.encode(s + "\r\n"));
  const expect = async (cmd, ok, label) => {
    if (cmd !== null) await send(cmd);
    const r = await readReply();
    if (!ok.includes(r.code)) throw new Error(`SMTP ${label}: ${r.text.slice(0, 300)}`);
    return r;
  };

  try {
    await expect(null, [220], "saludo");
    await expect("EHLO polyplas.cl", [250], "EHLO");
    await expect("AUTH LOGIN", [334], "AUTH");
    await expect(btoa(user), [334], "usuario");
    await expect(btoa(pass), [235], "contraseña");
    await expect(`MAIL FROM:<${msg.envelopeFrom || user}>`, [250], "MAIL FROM");
    await expect(`RCPT TO:<${msg.to}>`, [250, 251], "RCPT TO");
    await expect("DATA", [354], "DATA");
    await writer.write(enc.encode(buildMime(msg) + "\r\n.\r\n"));
    await expect(null, [250], "envío");
    try { await send("QUIT"); } catch {}
  } finally {
    try { await writer.close(); } catch {}
    try { await socket.close(); } catch {}
  }
}
