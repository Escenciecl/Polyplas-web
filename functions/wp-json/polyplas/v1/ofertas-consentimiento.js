/**
 * POST /wp-json/polyplas/v1/ofertas-consentimiento   { email, nombre, origen, pagina, sitio_web }
 * Registra que la persona MARCÓ la casilla "Quiero recibir ofertas" (Ley 21.719: consentimiento
 * libre, específico e informado; la casilla siempre parte desmarcada). Lo llaman el checkout,
 * la creación de cuenta y los formularios B2B, solo cuando la casilla está marcada.
 */
import { registrarOfertas, ORIGENES_PERMITIDOS } from "../../../_lib/privacidad.js";

const responder = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

export async function onRequestPost({ request, env }) {
  const o = request.headers.get("Origin") || "";
  if (o && !ORIGENES_PERMITIDOS.includes(o)) return responder({ ok: false }, 403);
  let p;
  try { p = await request.json(); } catch { return responder({ ok: false, message: "JSON inválido" }, 400); }
  if (p && p.sitio_web) return responder({ ok: true }); // campo trampa para bots
  try {
    const r = await registrarOfertas(env, p || {});
    return responder(r, r.ok ? 200 : 400);
  } catch (e) {
    console.log("[Polyplas privacidad] ofertas", String(e));
    return responder({ ok: false, message: "No se pudo registrar" }, 502);
  }
}

export const onRequest = () => responder({ ok: false, message: "Usa POST" }, 405);
