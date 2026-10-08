/**
 * POST /wp-json/polyplas/v1/webpay-init
 * Misma dirección y mismo formato que tenía WordPress, así las páginas no cambian.
 * Crea la transacción en Transbank y guarda el pedido 30 minutos en KV.
 */
import { json, randomOrder, tbkRequest, tbkMissing, usuarioDesdeToken } from "../../../_lib/webpay.js";

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
      return_page: returnPage,
    }),
    { expirationTtl: 60 * 30 },
  );

  return json({ token: result.token, url: result.url });
}

export const onRequest = () => json({ code: "method", message: "Usa POST" }, 405);
