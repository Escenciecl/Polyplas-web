import { diagramasCorte, pdfCortes, bytesToB64 } from "./corte.js";
import { smtpSend } from "./smtp.js";
/**
 * Utilidades compartidas para Webpay Plus (Transbank), correo y Supabase.
 * Port directo de las funciones que estaban en functions.php de WordPress.
 *
 * Variables que se configuran en Cloudflare Pages → Settings → Variables and secrets:
 *   TBK_COMMERCE_CODE  (texto)   código de comercio Webpay Plus
 *   TBK_SECRET         (secreto) llave secreta Transbank  ← la ingresa la dueña, nunca va en el código
 *   TBK_API_BASE       (texto, opcional) por defecto producción v1.3
 *   BREVO_API_KEY      (secreto) para enviar correos con Brevo (recomendado; dominio ya verificado)
 *   RESEND_API_KEY     (secreto) alternativa a Brevo
 *   MAIL_FROM          (texto, opcional) por defecto "Polyplas <ventas@polyplas.cl>"
 *   MAIL_SALES         (texto, opcional) por defecto "ventas@polyplas.cl"
 * Binding KV: ORDERS  (guarda el pedido 30 minutos mientras el cliente paga)
 */

export const TBK_DEFAULT_BASE =
  "https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.3";

const SUPABASE_URL = "https://gdrkscedvkjtcvexnhzg.supabase.co/rest/v1";
// Llave pública (publishable): es la misma que ya está visible en el navegador.
const SUPABASE_KEY = "sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Lee la configuración de Transbank aceptando variantes de nombre (con o sin "PP_", espacios). */
export function tbkConfig(env) {
  const pick = (...names) => {
    for (const n of names) {
      const v = env[n];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    // nombres guardados con espacios u otra forma (ej. "TBK_SECRET ")
    for (const k of Object.keys(env)) {
      const norm = k.trim().toUpperCase().replace(/^PP_/, "");
      if (names.includes(norm) && typeof env[k] === "string" && env[k].trim()) return env[k].trim();
    }
    return "";
  };
  return {
    base: pick("TBK_API_BASE", "PP_TBK_API_BASE") || TBK_DEFAULT_BASE,
    code: pick("TBK_COMMERCE_CODE", "PP_TBK_COMMERCE_CODE", "TBK_CODE", "PP_TBK_CODE"),
    secret: pick("TBK_SECRET", "PP_TBK_SECRET", "TBK_API_KEY_SECRET"),
  };
}

/** Lista qué falta (solo nombres, nunca valores) para diagnosticar. */
export function tbkMissing(env) {
  const c = tbkConfig(env);
  const m = [];
  if (!c.code) m.push("TBK_COMMERCE_CODE");
  if (!c.secret) m.push("TBK_SECRET");
  if (!env.ORDERS) m.push("ORDERS (KV)");
  return m;
}

export async function tbkRequest(env, method, path, body) {
  const cfg = tbkConfig(env);
  const base = cfg.base;
  const res = await fetch(base + path, {
    method,
    headers: {
      "Tbk-Api-Key-Id": cfg.code,
      "Tbk-Api-Key-Secret": cfg.secret,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok && data && typeof data === "object") data._status = res.status;
    return data;
  } catch {
    return { _error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  }
}

export function randomOrder() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return "PP-" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/* ------------------------------------------------------------------ helpers HTML */
export const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const clp = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL").replace(/,/g, ".");

function filaDato(label, valor) {
  if (!valor) return "";
  return `
    <tr>
        <td style="padding:10px 12px;font-size:0.8rem;color:#888;border-bottom:1px solid #e8edf5;width:40%;">${esc(label)}</td>
        <td style="padding:10px 12px;font-size:0.88rem;color:#1a1a2e;border-bottom:1px solid #e8edf5;font-weight:500;">${esc(valor)}</td>
    </tr>`;
}

function corteHtml(item) {
  const mode = item.corteMode || "";
  if (!mode) return "";
  const iguales = mode === "iguales";
  const accent = iguales ? "#2563eb" : "#7c3aed";
  const bg = iguales ? "#eff6ff" : "#f5f3ff";
  const label = iguales ? "&#9986; Corte igual &mdash; GRATIS" : "&#9986; Cortes distintos &mdash; +10%";
  let body = "";
  const row = (q, txt) =>
    `<div style="font-size:12px;color:#1a1a2e;padding:3px 0;display:flex;gap:6px;align-items:baseline;"><span style="font-weight:700;color:${accent};min-width:20px;">${q}x</span><span>${txt}</span></div>`;
  const total = (pcs, sheets) =>
    `<div style="margin-top:7px;padding-top:6px;border-top:1px solid #e0d9f5;font-size:11px;color:#666;">Total: <strong style="color:${accent};">${pcs} ${pcs === 1 ? "pieza" : "piezas"}</strong> &nbsp;&middot;&nbsp; <strong style="color:${accent};">${sheets} ${sheets === 1 ? "plancha" : "planchas"}</strong></div>`;

  const ci = item.calcInfo || {};
  if (Array.isArray(ci.pieces) && ci.pieces.length) {
    const nsh = Math.max(1, parseInt(ci.Nsh ?? 1, 10) || 1);
    const tot = parseInt(ci.tot ?? 0, 10) || 0;
    for (const p of ci.pieces) {
      body += row(Math.max(1, parseInt(p.qty ?? 1, 10) || 1), `${Math.round((parseInt(p.w, 10) || 0) / 10)} &times; ${Math.round((parseInt(p.h, 10) || 0) / 10)} cm`);
    }
    if (tot > 0) body += total(tot, nsh);
  } else if (!iguales && item.corteMedidas && Array.isArray(item.corteMedidas.items) && item.corteMedidas.items.length) {
    const planks = item.corteMedidas.items;
    let pcs = 0;
    planks.forEach((plank, pi) => {
      const meds = (plank.medidas || []).filter((m) => m && m.ancho && m.alto);
      if (!meds.length) return;
      if (planks.length > 1)
        body += `<div style="font-size:10px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1px;margin:6px 0 3px;">Plancha ${pi + 1}</div>`;
      for (const m of meds) {
        const q = parseInt(m.qty, 10) > 0 ? parseInt(m.qty, 10) : 1;
        pcs += q;
        body += row(q, `${esc(m.ancho)} &times; ${esc(m.alto)} cm`);
      }
      if (plank.obs) body += `<div style="font-size:11px;color:#888;font-style:italic;margin-top:2px;">&#128203; ${esc(plank.obs)}</div>`;
    });
    if (pcs > 0) body += total(pcs, planks.length);
  } else if (item.corteInstrucciones) {
    body = `<div style="font-size:12px;color:#1a1a2e;padding:2px 0;">${esc(item.corteInstrucciones)}</div>`;
  }
  const mb = body ? "margin-bottom:6px;" : "";
  return `<div style="margin-top:8px;padding:8px 10px;background:${bg};border-left:3px solid ${accent};border-radius:0 5px 5px 0;"><div style="font-size:9px;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1px;${mb}">${label}</div>${body}</div>`;
}

/* ------------------------------------------------------------------ comprobante */
export function buildComprobanteHtml({ buyOrder, monto, auth, client, items, entrega, nSheets, inlineCid, imgUrl }) {
  const c = client || {};
  const tipo = c.tipo || "Persona Natural";
  const empresa = tipo === "Empresa";
  const nombre = empresa ? c.razon || "Empresa" : c.nombre || "Cliente";
  const montoFmt = clp(monto);

  let filas = "";
  for (const it of items || []) {
    const qty = parseInt(it.qty ?? 1, 10) || 1;
    const pu = parseInt(it.precio_unit ?? 0, 10) || 0;
    const cc = parseInt(it.corte_costo ?? 0, 10) || 0;
    const sub = it.subtotal != null ? parseInt(it.subtotal, 10) || 0 : it.precio != null ? (parseInt(it.precio, 10) || 0) * qty : pu * qty + cc;
    const desc = it.nombre ? esc(it.nombre) : esc([it.tipo, it.dim, it.color, it.espesor].filter(Boolean).join(" · "));
    filas += `
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e8edf5;font-size:0.88rem;color:#1a1a2e;">${desc}${corteHtml(it)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e8edf5;font-size:0.88rem;color:#1a1a2e;text-align:center;">${qty}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e8edf5;font-size:0.88rem;color:#004a99;text-align:right;font-weight:600;">${clp(sub)}</td>
        </tr>`;
  }

  let cliente = "";
  if (empresa) {
    cliente += filaDato("Razon social", nombre) + filaDato("Giro", c.giro) + filaDato("Contacto", c.contacto);
  } else {
    cliente += filaDato("Nombre", nombre);
  }
  cliente += filaDato("RUT", c.rut) + filaDato("Telefono", c.tel) + filaDato("Metodo de entrega", entrega);
  if (c.dir || c.ciudad) cliente += filaDato("Direccion", `${c.dir || ""}, ${c.ciudad || ""}, ${c.region || ""}`);

  const saludo = empresa ? `Estimados ${esc(nombre)}` : `Hola ${esc(nombre)}`;

  let imgs = "";
  if (imgUrl || inlineCid) {
    const src = imgUrl ? esc(imgUrl) : `cid:${esc(inlineCid)}`;
    imgs = `<img src="${src}" style="max-width:100%;height:auto;display:block;${nSheets > 1 ? "margin-bottom:12px;" : ""}" alt="Diagrama de corte plancha 1">`;
    if (nSheets > 1)
      imgs += `<p style="margin:0;font-size:0.8rem;color:#555;line-height:1.5;">Diagramas de las ${nSheets} planchas incluidos en el PDF adjunto (<strong>diagrama-cortes.pdf</strong>).</p>`;
  } else if (nSheets > 0) {
    imgs = `<p style="margin:0;font-size:0.8rem;color:#555;line-height:1.5;">${nSheets > 1 ? `Diagramas de las ${nSheets} planchas incluidos` : "Diagrama de corte incluido"} en el PDF adjunto (<strong>diagrama-cortes.pdf</strong>).</p>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4fb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fb;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,74,153,0.10);">
    <tr>
        <td style="background:#004a99;padding:32px 40px;text-align:center;">
            <img src="https://polyplas.cl/wp-content/uploads/2022/07/marca-polyplas-1.svg" alt="Polyplas" width="140" style="display:block;margin:0 auto 16px;">
            <div style="display:inline-block;background:#34a853;padding:6px 18px;border-radius:20px;">
                <span style="color:#ffffff;font-size:0.78rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;">&#10003; &nbsp;Pago aprobado</span>
            </div>
            <h1 style="color:#ffffff;font-size:1.5rem;margin:16px 0 4px;">Comprobante de compra</h1>
            <p style="color:rgba(255,255,255,0.7);margin:0;font-size:0.88rem;">Orden N&deg; ${esc(buyOrder)}</p>
        </td>
    </tr>
    <tr>
        <td style="padding:32px 40px 0;">
            <p style="font-size:1rem;color:#1a1a2e;margin:0 0 8px;">${saludo},</p>
            <p style="font-size:0.92rem;color:#555;margin:0;">Tu pago fue procesado correctamente. Aqu&iacute; tienes el detalle de tu compra.</p>
        </td>
    </tr>
    <tr>
        <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fb;border-radius:12px;overflow:hidden;">
                <tr><td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:1px;">Total pagado</td>
                            <td style="font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:1px;text-align:right;">C&oacute;digo autorizaci&oacute;n</td>
                        </tr>
                        <tr>
                            <td style="font-size:1.8rem;font-weight:700;color:#004a99;letter-spacing:1px;">${esc(montoFmt)}</td>
                            <td style="font-size:1rem;font-weight:600;color:#1a1a2e;text-align:right;">${esc(auth)}</td>
                        </tr>
                        <tr><td style="font-size:0.72rem;color:#888;padding-top:2px;">IVA incluido</td><td></td></tr>
                    </table>
                </td></tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding:0 40px 24px;">
            <h2 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1.5px;color:#004a99;margin:0 0 12px;">Productos</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8edf5;border-radius:10px;overflow:hidden;">
                <tr style="background:#f7f9fd;">
                    <th style="padding:10px 12px;font-size:0.75rem;color:#666;text-align:left;font-weight:600;">Descripci&oacute;n</th>
                    <th style="padding:10px 12px;font-size:0.75rem;color:#666;text-align:center;font-weight:600;">Cant.</th>
                    <th style="padding:10px 12px;font-size:0.75rem;color:#666;text-align:right;font-weight:600;">Subtotal</th>
                </tr>
                ${filas}
                <tr style="background:#f0f4fb;">
                    <td colspan="2" style="padding:12px;font-size:0.88rem;font-weight:700;color:#1a1a2e;">Total</td>
                    <td style="padding:12px;font-size:1rem;font-weight:700;color:#004a99;text-align:right;">${esc(montoFmt)}</td>
                </tr>
            </table>
        </td>
    </tr>
    ${imgs ? `<tr><td style="padding:0 40px 24px;"><h2 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1.5px;color:#004a99;margin:0 0 12px;">Diagrama de corte</h2><div style="border:1px solid #e8edf5;border-radius:10px;padding:16px;">${imgs}</div></td></tr>` : ""}
    <tr>
        <td style="padding:0 40px 24px;">
            <h2 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1.5px;color:#004a99;margin:0 0 12px;">Datos del cliente</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8edf5;border-radius:10px;overflow:hidden;">
                ${cliente}
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#e7f7ee;border-left:4px solid #25d366;border-radius:0 10px 10px 0;">
                <tr><td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:0.88rem;color:#1a1a2e;font-weight:700;">&#128242; &nbsp;&iquest;C&oacute;mo coordinar tu entrega?</p>
                    <p style="margin:0 0 10px;font-size:0.88rem;color:#1a1a2e;">Cont&aacute;ctanos por WhatsApp al <a href="https://wa.me/56942086751" style="color:#128c7e;font-weight:700;text-decoration:none;">+56 9 4208 6751</a>, adjuntando este comprobante para coordinar el d&iacute;a y hora de entrega.</p>
                    <p style="margin:0;font-size:0.82rem;color:#555;line-height:1.8;">
                        &#128552; &nbsp;<strong>Lunes a jueves:</strong> 9:00 a 18:00 hrs<br>
                        &#128552; &nbsp;<strong>Viernes:</strong> 9:00 a 17:00 hrs<br>
                        &#128308; &nbsp;<strong>S&aacute;bado, domingo y festivos:</strong> Cerrado
                    </p>
                </td></tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="background:#f7f9fd;padding:24px 40px;text-align:center;border-top:1px solid #e8edf5;">
            <p style="margin:0 0 8px;font-size:0.82rem;color:#555;">&iquest;Tienes dudas? Cont&aacute;ctanos</p>
            <p style="margin:0;font-size:0.82rem;">
                <a href="mailto:ventas@polyplas.cl" style="color:#004a99;text-decoration:none;">ventas@polyplas.cl</a>
                &nbsp;&middot;&nbsp;
                <a href="https://wa.me/56942086751" style="color:#004a99;text-decoration:none;">+56 9 4208 6751</a>
            </p>
            <p style="margin:16px 0 0;font-size:0.75rem;color:#aaa;">&copy; ${new Date().getFullYear()} Polyplas &middot; Santiago Concha 1525, Santiago</p>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Envía el comprobante al cliente y a ventas con Brevo (o Resend si es lo que está configurado). */
export async function enviarComprobante(env, order, tbk) {
  const brevoKey = (env.BREVO_API_KEY || "").trim();
  const resendKey = (env.RESEND_API_KEY || "").trim();
  if (!brevoKey && !resendKey) {
    console.log("[Polyplas] Sin BREVO_API_KEY ni RESEND_API_KEY: no se envía correo", order.buy_order);
    return;
  }
  const useBrevo = !!brevoKey;
  const site = (env.SITE_URL || "https://polyplas.cl").replace(/\/$/, "");

  // Diagramas de corte: PNG del navegador o dibujados aquí + PDF con todas las planchas
  let pngs = [];
  let pdf = null;
  try {
    pngs = await diagramasCorte(order.items_full || order.items);
    if (pngs.length) pdf = await pdfCortes(pngs);
  } catch (e) {
    console.log("[Polyplas] Error generando diagramas (el correo igual se envía)", String(e));
  }

  // Primera plancha visible en el cuerpo del correo: se publica como imagen (Brevo no admite CID)
  let imgUrl = null;
  if (pngs.length && env.ORDERS) {
    try {
      const id = crypto.randomUUID().replace(/-/g, "");
      await env.ORDERS.put(`img:${id}`, pngs[0], { expirationTtl: 60 * 60 * 24 * 365 });
      imgUrl = `${site}/diagrama/${id}.png`;
    } catch (e) {
      console.log("[Polyplas] No se pudo publicar el diagrama", String(e));
    }
  }

  const html = buildComprobanteHtml({
    buyOrder: tbk.buy_order,
    monto: tbk.amount,
    auth: tbk.authorization_code,
    client: order.client,
    items: order.items,
    entrega: order.entrega,
    nSheets: pngs.length,
    imgUrl,
  });

  // Adjuntos iguales a WordPress: comprobante HTML + diagrama-cortes.pdf
  const safeOrder = String(tbk.buy_order).replace(/[^A-Za-z0-9_-]/g, "");
  const adjuntos = [{ name: `comprobante-${safeOrder}.html`, content: bytesToB64(new TextEncoder().encode(html)) }];
  if (pdf) adjuntos.push({ name: "diagrama-cortes.pdf", content: bytesToB64(pdf) });

  const fromEmail = (env.MAIL_FROM_EMAIL || "ventas@polyplas.cl").trim();
  const fromName = (env.MAIL_FROM_NAME || "Polyplas").trim();
  const sales = (env.MAIL_SALES || "ventas@polyplas.cl").trim();
  const asunto = `Comprobante de compra Polyplas - ${tbk.buy_order}`;

  // Aviso interno si el total pagado no coincide con la suma de productos
  // (el total lo calcula el navegador; ver nota de seguridad en README).
  const suma = (order.items || []).reduce((a, it) => {
    const q = parseInt(it.qty ?? 1, 10) || 1;
    if (it.subtotal != null) return a + (parseInt(it.subtotal, 10) || 0);
    if (it.precio != null) return a + (parseInt(it.precio, 10) || 0) * q;
    return a + (parseInt(it.precio_unit ?? 0, 10) || 0) * q + (parseInt(it.corte_costo ?? 0, 10) || 0);
  }, 0);
  const alerta = suma > 0 && Math.abs(suma - tbk.amount) > Math.max(2000, tbk.amount * 0.35)
    ? `<p style="background:#fef2f2;border:2px solid #dc2626;color:#991b1b;padding:12px;font:14px Arial;margin:0 0 12px;">⚠ REVISAR ANTES DE DESPACHAR: el monto pagado (${clp(tbk.amount)}) no calza con la suma de productos (${clp(suma)}).</p>`
    : "";

  const send = (to, subject, body) => {
    const req = useBrevo
      ? fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: to }],
            replyTo: { email: sales },
            subject,
            htmlContent: body,
            attachment: adjuntos,
          }),
        })
      : fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject,
            html: body,
            reply_to: sales,
            attachments: adjuntos.map((x) => ({ filename: x.name, content: x.content })),
          }),
        });
    return req.then(async (r) => {
      const txt = await r.text();
      if (!r.ok) console.log("[Polyplas] Error correo", to, r.status, txt);
      return { to, ok: r.ok, status: r.status, detail: r.ok ? "" : txt.slice(0, 200) };
    });
  };

  // Copia a ventas: por el SMTP de cPanel si está configurado (el antispam del hosting bloquea a Brevo);
  // si falla, se intenta igual por Brevo.
  const sendSales = async () => {
    const subject = `[VENTA] ${asunto}`;
    const body = alerta + html;
    if (env.SMTP_PASS) {
      try {
        await smtpSend(env, { from: fromEmail, fromName, to: sales, replyTo: sales, subject, html: body, attachments: adjuntos });
        return { to: sales, ok: true, status: 250, detail: "smtp" };
      } catch (e) {
        console.log("[Polyplas] SMTP cPanel falló, se intenta por Brevo", String(e));
        const r = await send(sales, subject, body);
        return { ...r, detail: `smtp: ${String(e).slice(0, 200)} | brevo: ${r.ok ? "ok" : r.detail}` };
      }
    }
    return send(sales, subject, body);
  };
  const tasks = [sendSales()];
  const email = order.client && order.client.email;
  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) tasks.push(send(email, asunto, html));
  return Promise.allSettled(tasks);
}

/** Registra el pedido en el CRM de Supabase (igual que pp_registrar_en_supabase). */
export async function registrarEnSupabase(order, tbk) {
  const c = order.client || {};
  const nombre = c.nombre || c.razon || "";
  const convId = crypto.randomUUID();
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const metadata = {
    source: "order",
    nombre,
    razon_social: c.razon || "",
    tipo_cliente: c.tipo || "",
    rut: c.rut || "",
    giro: c.giro || "",
    email: c.email || "",
    phone: c.tel || "",
    dir: c.dir || "",
    ciudad: c.ciudad || "",
    region: c.region || "",
    entrega: order.entrega,
    total: tbk.amount,
    items: order.items,
    webpay_orden: tbk.buy_order,
    webpay_auth: tbk.authorization_code,
  };
  const r = await fetch(`${SUPABASE_URL}/conversations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: convId,
      client_name: nombre,
      client_email: c.email || "",
      unread_count: 1,
      last_message_at: new Date().toISOString(),
      metadata,
    }),
  });
  if (!r.ok) {
    console.log("[Polyplas Supabase] Error al registrar orden", r.status, await r.text());
    return;
  }
  const lineas = (order.items || []).map(
    (it) => `• ${it.tipo || it.nombre || ""} · ${it.dim || ""} · ${it.color || ""} · ${it.espesor || ""} × ${parseInt(it.qty ?? 1, 10) || 1}`,
  );
  const msg =
    "🛒 PEDIDO WEB\n─────────────────\n" +
    lineas.join("\n") +
    "\n─────────────────\n" +
    `Entrega: ${order.entrega}   Total: ${clp(tbk.amount)}\n` +
    "─────────────────\n" +
    `Cliente: ${nombre}  RUT: ${c.rut || ""}\n` +
    `Email: ${c.email || ""}  Tel: ${c.tel || ""}\n` +
    `Dirección: ${c.dir || ""}, ${c.ciudad || ""}, ${c.region || ""}`;
  await fetch(`${SUPABASE_URL}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ conversation_id: convId, sender: "client", content: msg }),
  });
}
