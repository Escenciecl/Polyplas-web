/**
 * GET/POST /wp-json/polyplas/v1/webpay-return
 * Transbank devuelve aquí al cliente. Se confirma el pago (commit), se envía el comprobante,
 * se registra en Supabase y se redirige a /gracias/ con los mismos parámetros que WordPress:
 *   ?pp_pago=aprobado&orden=...&monto=...&auth=...   |   ?pp_pago=rechazado   |   ?pp_pago=cancelado
 */
import { enviarComprobante, registrarCompraEnCuenta, registrarEnSupabase, registrarRechazoEnSupabase, tbkRequest } from "../../../_lib/webpay.js";

async function readParams(request) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  if (request.method === "POST") {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const [k, v] of form) if (typeof v === "string") params.set(k, v);
    }
  }
  return params;
}

function redirect(base, query) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
  return Response.redirect(u.toString(), 302);
}

export async function onRequest({ request, env, waitUntil }) {
  const origin = new URL(request.url).origin;
  const home = `${origin}/`;
  const p = await readParams(request);
  const tokenWs = p.get("token_ws") || "";

  // Pago anulado por el cliente o timeout: llega TBK_TOKEN sin token_ws
  if (!tokenWs) {
    const tbkToken = p.get("TBK_TOKEN") || "";
    let returnPage = home;
    if (tbkToken && env.ORDERS) {
      const raw = await env.ORDERS.get(`order:${tbkToken}`);
      if (raw) returnPage = JSON.parse(raw).return_page || home;
      await env.ORDERS.delete(`order:${tbkToken}`);
    }
    return redirect(returnPage, { pp_pago: "cancelado" });
  }

  const raw = env.ORDERS ? await env.ORDERS.get(`order:${tokenWs}`) : null;
  const order = raw ? JSON.parse(raw) : { client: {}, items: [], entrega: "" };
  const returnPage = order.return_page || `${origin}/gracias/`;
  if (env.ORDERS) await env.ORDERS.delete(`order:${tokenWs}`);

  const result = await tbkRequest(env, "PUT", `/transactions/${encodeURIComponent(tokenWs)}`);

  if (Number(result.response_code) === 0 && result.status === "AUTHORIZED") {
    const tbk = {
      buy_order: result.buy_order || "",
      amount: Math.trunc(Number(result.amount) || 0),
      authorization_code: result.authorization_code || "",
    };
    // Correo y CRM corren en segundo plano: el cliente no espera
    waitUntil(
      Promise.allSettled([enviarComprobante(env, order, tbk), registrarEnSupabase(order, tbk), registrarCompraEnCuenta(env, order, tbk)]).then((r) =>
        r.forEach((x) => x.status === "rejected" && console.log("[Polyplas] post-pago", x.reason)),
      ),
    );
    // Compra a Google Analytics desde el servidor (ver enviarCompraGA4 al final del archivo)
    const gaOk = await enviarCompraGA4(env, order, tbk);
    const q = { pp_pago: "aprobado", orden: tbk.buy_order, monto: tbk.amount, auth: tbk.authorization_code };
    if (gaOk) q.ga_srv = 1;
    return redirect(returnPage, q);
  }

  console.log("[Polyplas Webpay] Pago rechazado", JSON.stringify(result));
  waitUntil(
    registrarRechazoEnSupabase(order, result).catch((e) =>
      console.log("[Polyplas] error registrando rechazo", e),
    ),
  );
  return redirect(returnPage, { pp_pago: "rechazado" });
}

/* ── Google Analytics 4: la compra se registra desde el servidor ──────────
 * Así queda medida aunque la persona vuelva de Webpay en otro navegador (app del banco)
 * o cierre la página antes de que cargue Analytics. Usa la visita guardada en webpay-init.js.
 * Requiere el secreto GA4_API_SECRET en Cloudflare; sin él no hace nada y todo sigue como antes.
 * Si se envía, la redirección lleva ga_srv=1 y Tag Manager no vuelve a mandar la compra a GA4
 * (Google Ads y Meta siguen recibiéndola desde el navegador). */
async function enviarCompraGA4(env, order, tbk) {
  const ga = order && order.ga;
  if (!env.GA4_API_SECRET || !ga || !ga.client_id) return false;
  const params = {
    transaction_id: tbk.buy_order,
    currency: "CLP",
    value: tbk.amount,
    items: Array.isArray(order.ga_items) ? order.ga_items : [],
    origen_compra: "servidor",
    engagement_time_msec: 1,
  };
  if (ga.session_id) params.session_id = ga.session_id;
  const url =
    "https://www.google-analytics.com/mp/collect?measurement_id=" +
    encodeURIComponent(env.GA4_MEASUREMENT_ID || "G-HTFZ3XVZZP") +
    "&api_secret=" +
    encodeURIComponent(env.GA4_API_SECRET);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ client_id: ga.client_id, events: [{ name: "purchase", params }] }),
      signal: ctrl.signal,
    });
    return r.ok;
  } catch (e) {
    console.log("[Polyplas GA4] no se pudo enviar la compra", String(e));
    return false;
  } finally {
    clearTimeout(timer);
  }
}
