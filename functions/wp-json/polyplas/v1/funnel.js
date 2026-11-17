/**
 * POST /wp-json/polyplas/v1/funnel   { v, filas: [{ canal, campana, linea, paso, sesiones, eventos, valor }] }
 * Funnel anónimo (Ley 21.719): suma totales por día en Supabase (tabla funnel_diario).
 * No guarda IP, cookies ni identificadores. Lo envía 07-medicion-propia.html con sendBeacon.
 */
import { ORIGENES_PERMITIDOS } from "../../../_lib/privacidad.js";

const RPC = "https://gdrkscedvkjtcvexnhzg.supabase.co/rest/v1/rpc/funnel_sumar";
const PASOS = new Set([
  "visita", "vio_listado", "eligio_producto", "vio_producto", "agrego_carro", "vio_carro",
  "inicio_compra", "eligio_entrega", "eligio_pago", "compro", "pedido_transferencia",
  "lead_b2b", "cotizacion", "contacto_chat",
]);
const CANALES = new Set(["google_ads", "meta_ads", "bing_ads", "otros_ads", "email", "organico", "social", "referido", "directo", "venta_asistida", "carro_compartido"]);
const limpio = (v, n) => String(v == null ? "" : v).replace(/[^\p{L}\p{N} ._\-|/+]/gu, "").trim().slice(0, n);
const entero = (v, max) => Math.min(max, Math.max(0, Math.trunc(Number(v) || 0)));

export async function onRequestPost({ request, env, waitUntil }) {
  const origen = request.headers.get("Origin") || "";
  if (origen && !ORIGENES_PERMITIDOS.includes(origen) && !/^https:\/\/[a-z0-9-]+\.polyplas-web\.pages\.dev$/.test(origen)) return new Response(null, { status: 403 });

  let p;
  try {
    const txt = await request.text();
    if (txt.length > 20000) return new Response(null, { status: 413 });
    p = JSON.parse(txt);
  } catch {
    return new Response(null, { status: 400 });
  }
  const filas = (Array.isArray(p && p.filas) ? p.filas : [])
    .slice(0, 40)
    .filter((f) => f && PASOS.has(f.paso))
    .map((f) => ({
      canal: CANALES.has(f.canal) ? f.canal : "directo",
      campana: limpio(f.campana, 80),
      linea: limpio(f.linea, 60).toLowerCase(),
      paso: f.paso,
      sesiones: entero(f.sesiones, 1),
      eventos: entero(f.eventos, 50),
      valor: ["compro", "pedido_transferencia", "eligio_pago"].includes(f.paso) ? entero(f.valor, 100000000) : 0,
    }));
  if (!filas.length) return new Response(null, { status: 204 });

  const k = String(env.SUPABASE_SERVICE_KEY || "").trim();
  if (!k) return new Response(null, { status: 204 });
  const guardar = fetch(RPC, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_filas: filas }),
  }).then(async (r) => {
    if (!r.ok) console.log("[Polyplas funnel] Supabase", r.status, (await r.text()).slice(0, 200));
  }).catch((e) => console.log("[Polyplas funnel]", e && e.message));
  if (waitUntil) waitUntil(guardar);
  else await guardar;
  return new Response(null, { status: 204 });
}

export const onRequest = () => new Response(null, { status: 405 });
