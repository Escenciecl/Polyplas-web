/**
 * Ley 21.719 · utilidades de privacidad del servidor (Cloudflare Pages Functions)
 *
 *  - registrarOfertas(): guarda el consentimiento para recibir ofertas por correo
 *    (tabla consentimientos_ofertas) y, si está configurado, agrega el contacto a la lista
 *    de Brevo "con consentimiento" (BREVO_LISTA_OFERTAS).
 *  - registrarSolicitud(): guarda una solicitud de derechos (acceso, rectificación, supresión,
 *    oposición, portabilidad, bloqueo) en solicitudes_derechos y avisa por correo.
 *
 * Variables en Cloudflare Pages:
 *   SUPABASE_SERVICE_KEY  (secreto, ya existe)  las tablas no aceptan la llave pública
 *   BREVO_API_KEY         (secreto, ya existe)  correos y lista de Brevo
 *   BREVO_LISTA_OFERTAS   (opcional)            id numérico de la lista "Ofertas · con consentimiento"
 *   CORREO_PRIVACIDAD     (opcional)            por defecto polyplaschile@gmail.com
 */
const SUPABASE_REST = "https://gdrkscedvkjtcvexnhzg.supabase.co/rest/v1";
export const CORREO_PRIVACIDAD_DEFECTO = "polyplaschile@gmail.com";
export const VERSION_TEXTO_OFERTAS = 1;
export const TEXTO_OFERTAS =
  "Quiero recibir ofertas y novedades de Polyplas por correo. Puedo darme de baja cuando quiera.";

const ORIGENES = ["checkout", "cuenta", "b2b_pop", "b2b_letreros", "b2b_mayor"];
const DERECHOS = ["acceso", "rectificacion", "supresion", "oposicion", "portabilidad", "bloqueo", "otro"];
const NOMBRE_DERECHO = {
  acceso: "Acceso (saber qué datos tienen de mí)",
  rectificacion: "Rectificación (corregir mis datos)",
  supresion: "Supresión (borrar mis datos)",
  oposicion: "Oposición (dejar de usar mis datos para un fin, por ejemplo publicidad)",
  portabilidad: "Portabilidad (recibir mis datos en un archivo)",
  bloqueo: "Bloqueo (suspender temporalmente el uso de mis datos)",
  otro: "Otra consulta sobre mis datos",
};

export const ORIGENES_PERMITIDOS = ["https://polyplas.cl", "https://www.polyplas.cl"];

const limpiar = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
export const correoValido = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function llave(env) {
  const k = String(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SECRET_KEY || "").trim();
  if (!k) throw new Error("Falta SUPABASE_SERVICE_KEY");
  return k;
}

async function insertar(env, tabla, fila) {
  const k = llave(env);
  const r = await fetch(`${SUPABASE_REST}/${tabla}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(fila),
  });
  if (!r.ok) throw new Error(`${tabla} ${r.status} ${(await r.text()).slice(0, 200)}`);
}

async function enviarCorreo(env, { to, subject, html, replyTo }) {
  const key = String(env.BREVO_API_KEY || "").trim();
  if (!key) return { ok: false, detail: "Falta BREVO_API_KEY" };
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: (env.MAIL_FROM_NAME || "Polyplas").trim(), email: (env.MAIL_FROM_EMAIL || "ventas@polyplas.cl").trim() },
      to: [{ email: to }],
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      subject,
      htmlContent: html,
    }),
  });
  return { ok: r.ok, detail: r.ok ? "" : (await r.text()).slice(0, 200) };
}

/** Consentimiento para ofertas. Devuelve { ok, brevo } */
export async function registrarOfertas(env, datos) {
  const email = limpiar(datos.email, 160).toLowerCase();
  const nombre = limpiar(datos.nombre, 120);
  const origen = ORIGENES.includes(datos.origen) ? datos.origen : null;
  if (!correoValido(email) || !origen) return { ok: false, error: "datos" };

  await insertar(env, "consentimientos_ofertas", {
    email,
    nombre: nombre || null,
    origen,
    texto: TEXTO_OFERTAS,
    version: VERSION_TEXTO_OFERTAS,
    pagina: limpiar(datos.pagina, 200) || null,
  });

  // Lista de Brevo "con consentimiento" (solo si está configurada)
  let brevo = "sin_lista";
  const lista = parseInt(String(env.BREVO_LISTA_OFERTAS || ""), 10);
  const key = String(env.BREVO_API_KEY || "").trim();
  if (lista && key) {
    const r = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        email,
        listIds: [lista],
        updateEnabled: true,
        attributes: { ...(nombre ? { NOMBRE: nombre } : {}), OPTIN_FECHA: new Date().toISOString().slice(0, 10), OPTIN_ORIGEN: origen },
      }),
    });
    brevo = r.ok ? "ok" : "error " + r.status;
    // Si la cuenta de Brevo no tiene esos atributos creados, se agrega igual a la lista sin ellos
    if (!r.ok) {
      const r2 = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email, listIds: [lista], updateEnabled: true }),
      });
      brevo = r2.ok ? "ok_sin_atributos" : "error " + r2.status;
    }
  }
  return { ok: true, brevo };
}

/** Solicitud de derechos. Devuelve { ok, folio, plazo } */
export async function registrarSolicitud(env, datos) {
  const nombre = limpiar(datos.nombre, 120);
  const email = limpiar(datos.email, 160).toLowerCase();
  const rut = limpiar(datos.rut, 20);
  const telefono = limpiar(datos.telefono, 30);
  const derecho = DERECHOS.includes(datos.derecho) ? datos.derecho : null;
  const detalle = limpiar(datos.detalle, 2000);
  if (!nombre || !correoValido(email) || !derecho) return { ok: false, error: "datos" };

  const folio = "DER-" + crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  const recibida = new Date();
  const plazo = new Date(recibida.getTime() + 30 * 864e5);
  const plazoTxt = plazo.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" });

  await insertar(env, "solicitudes_derechos", {
    folio,
    nombre,
    email,
    rut: rut || null,
    telefono: telefono || null,
    derecho,
    detalle: detalle || null,
    plazo_respuesta: plazo.toISOString().slice(0, 10),
  });

  const destino = String(env.CORREO_PRIVACIDAD || CORREO_PRIVACIDAD_DEFECTO).trim();
  const fila = (k, v) => `<tr><td style="padding:6px 10px;color:#555">${esc(k)}</td><td style="padding:6px 10px"><b>${esc(v || "—")}</b></td></tr>`;
  const avisoInterno = await enviarCorreo(env, {
    to: destino,
    replyTo: email,
    subject: `Solicitud de derechos ${folio} · responder antes del ${plazoTxt}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <p><b>Nueva solicitud de derechos sobre datos personales (Ley 21.719).</b></p>
      <table style="border-collapse:collapse">${fila("Folio", folio)}${fila("Derecho", NOMBRE_DERECHO[derecho])}${fila("Nombre", nombre)}${fila("Correo", email)}${fila("RUT", rut)}${fila("Teléfono", telefono)}${fila("Detalle", detalle)}${fila("Plazo legal de respuesta", plazoTxt)}</table>
      <p>Pasos: 1) confirmar la identidad (el correo debe coincidir con el de sus compras o pedir respaldo), 2) buscar a la persona en el CRM, Supabase, Brevo, Google Sheets y correos, 3) responder desde este correo, 4) marcar la solicitud como respondida en Supabase (tabla solicitudes_derechos).</p>
    </div>`,
  });
  const acuse = await enviarCorreo(env, {
    to: email,
    replyTo: destino,
    subject: `Recibimos tu solicitud ${folio} · Polyplas`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5">
      <p>Hola ${esc(nombre)}:</p>
      <p>Recibimos tu solicitud de <b>${esc(NOMBRE_DERECHO[derecho])}</b> con el folio <b>${folio}</b>.</p>
      <p>Te responderemos a más tardar el <b>${plazoTxt}</b> (30 días corridos, como indica la Ley 21.719). Si necesitamos confirmar tu identidad, te escribiremos a este correo.</p>
      <p>Si tienes dudas, responde este mensaje o escríbenos a ${esc(destino)}.</p>
      <p>Polyplas</p></div>`,
  });
  return { ok: true, folio, plazo: plazoTxt, correos: { interno: avisoInterno.ok, acuse: acuse.ok } };
}
