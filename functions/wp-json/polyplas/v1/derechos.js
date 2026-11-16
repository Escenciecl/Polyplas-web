/**
 * POST /wp-json/polyplas/v1/derechos   { nombre, email, rut, telefono, derecho, detalle, sitio_web }
 * Formulario "Ejercer mis derechos" (Ley 21.719: acceso, rectificación, supresión, oposición,
 * portabilidad y bloqueo). Guarda la solicitud con folio y plazo de 30 días, avisa al correo de
 * privacidad y envía un acuse de recibo a la persona.
 */
import { registrarSolicitud, ORIGENES_PERMITIDOS } from "../../../_lib/privacidad.js";

const responder = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

export async function onRequestPost({ request, env }) {
  const o = request.headers.get("Origin") || "";
  if (o && !ORIGENES_PERMITIDOS.includes(o)) return responder({ ok: false }, 403);
  let p;
  try { p = await request.json(); } catch { return responder({ ok: false, message: "JSON inválido" }, 400); }
  if (p && p.sitio_web) return responder({ ok: true, folio: "DER-000000" }); // campo trampa para bots
  try {
    const r = await registrarSolicitud(env, p || {});
    return responder(r, r.ok ? 200 : 400);
  } catch (e) {
    console.log("[Polyplas privacidad] derechos", String(e));
    return responder({ ok: false, message: "No se pudo registrar" }, 502);
  }
}

export const onRequest = () => responder({ ok: false, message: "Usa POST" }, 405);
