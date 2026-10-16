/**
 * POST /wp-json/polyplas/v1/webpay-init
 * Misma dirección y mismo formato que tenía WordPress, así las páginas no cambian.
 * Crea la transacción en Transbank y guarda el pedido 30 minutos en KV.
 */
import { json, randomOrder, tbkRequest, tbkMissing, usuarioDesdeToken } from "../../../_lib/webpay.js";
import { verificarTotal } from "../../../_lib/precios.js";

export async function onRequestPost({ request, env }) {
  const missing = tbkMissing(env);
  if (missing.length) {
    return json({ code: "config", message: "Pagos no configurados", missing }, 503);
  }

  let p;
  try {
    p = await request.json();
  } catch {
    return json({ code: "bad_request", message: "JSON inválido" }, 400);
  }

  const total = Math.trunc(Number(p.total) || 0);
  if (total <= 0) return json({ code: "invalid_amount", message: "Monto invalido" }, 400);

  // El total lo calcula el navegador: se vuelve a calcular con los precios del CRM antes de cobrar
  const verif = await verificarTotal(p.items, total);
  if (!verif.ok) {
    console.log("[Polyplas Webpay] Pago rechazado por verificación:", verif.detalle);
    return json({ code: verif.code, message: verif.message }, 409);
  }

  const origin = new URL(request.url).origin;
  // Solo se permite volver a páginas de este mismo sitio
  let returnPage = `${origin}/gracias/`;
  try {
    const rp = new URL(p.return_page || "", origin);
    if (rp.hostname === new URL(origin).hostname || rp.hostname.endsWith("polyplas.cl")) {
      rp.protocol = new URL(origin).protocol;
      rp.host = new URL(origin).host;
      returnPage = rp.toString();
    }
  } catch {}

  const buyOrder = randomOrder();
  const result = await tbkRequest(env, "POST", "/transactions", {
    buy_order: buyOrder,
    session_id: `sess-${buyOrder}`,
    amount: total,
    return_url: `${origin}/wp-json/polyplas/v1/webpay-return`,
  });

  if (result._error || !result.token) {
    console.log("[Polyplas Webpay] Error al crear transaccion", JSON.stringify(result));
    // Detalle sin datos sensibles (Transbank solo devuelve un mensaje de error)
    const detail = String(result._error || result.error_message || "sin token").slice(0, 200);
    return json({ code: "tbk_error", message: "Error Transbank", status: result._status || null, detail }, 400);
  }

  const items = Array.isArray(p.items) ? p.items : [];
  // Versión liviana (sin imágenes) para Supabase; las imágenes solo se usan en el correo
  const itemsClean = items.map((it) => {
    if (!it || !it.calcInfo) return it;
    const { pngsB64, svgs, ...rest } = it.calcInfo; // eslint-disable-line no-unused-vars
    return { ...it, calcInfo: rest };
  });

  // Si el cliente tiene la sesión iniciada, la compra quedará guardada en su cuenta
  const usuario = await usuarioDesdeToken(request);

  // Visita de Google Analytics (para registrar la compra desde el servidor al volver de Webpay)
  const ga = gaDesdeCookies(request.headers.get("Cookie") || "");

  await env.ORDERS.put(
    `order:${result.token}`,
    JSON.stringify({
      buy_order: buyOrder,
      user_id: usuario ? usuario.id : null,
      total,
      client: p.client || {},
      items: itemsClean,
      items_full: items,
      entrega: String(p.entrega || "").slice(0, 200),
      verificado: verif.verificado,
      return_page: returnPage,
      ga,
      ga_items: gaItems(items),
    }),
    { expirationTtl: 60 * 30 },
  );

  return json({ token: result.token, url: result.url });
}

export const onRequest = () => json({ code: "method", message: "Usa POST" }, 405);

/* ── Google Analytics 4: datos de la visita para registrar la compra desde el servidor ──
 * Se leen las cookies de GA4 que el navegador envía con este pedido (mismo dominio).
 * Si la persona no aceptó Analytics (no hay cookie _ga), no se guarda nada y la compra
 * se mide solo desde el navegador, igual que antes. Ver webpay-return.js (enviarCompraGA4). */
const GA4_STREAM = "HTFZ3XVZZP";
function gaDesdeCookies(cookie) {
  const get = (name) => {
    const m = String(cookie || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    try { return m ? decodeURIComponent(m[1]) : ""; } catch { return m ? m[1] : ""; }
  };
  // _ga = GA1.1.<número>.<fecha>  →  client_id = "<número>.<fecha>"
  const partes = get("_ga").split(".");
  if (partes.length < 4 || !/^\d+$/.test(partes[partes.length - 2])) return null;
  const clientId = partes.slice(-2).join(".");
  // _ga_<ID> = GS2.1.s<session_id>$o<n>$…  (formato nuevo)  o  GS1.1.<session_id>.<n>.…  (antiguo)
  const s = get("_ga_" + GA4_STREAM);
  let sessionId = "";
  let m = s.match(/^GS2\.\d+\.s(\d+)/);
  if (m) sessionId = m[1];
  else if ((m = s.match(/^GS1\.\d+\.(\d+)\./))) sessionId = m[1];
  return { client_id: clientId, session_id: sessionId };
}

/* Artículos en formato GA4 (mismo item_id que el feed de Merchant Center) */
function gaItems(items) {
  return (Array.isArray(items) ? items : []).slice(0, 50).map((it, i) => {
    it = it || {};
    const qty = Math.max(1, Math.trunc(Number(it.qty) || 1));
    const sub = Number(it.subtotal) || 0;
    let id = String(it.sku || "SIN_SKU");
    if (/^REC_/.test(id)) id = "RECEP_" + id.slice(4);
    return {
      item_id: id.slice(0, 100),
      item_name: String(it.nombre || "").slice(0, 100),
      item_brand: "Polyplas",
      price: Math.round(Number(it.precio_unit) || sub / qty || 0),
      quantity: qty,
      index: i,
    };
  });
}
