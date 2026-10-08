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
    return redirect(returnPage, { pp_pago: "aprobado", orden: tbk.buy_order, monto: tbk.amount, auth: tbk.authorization_code });
  }

  console.log("[Polyplas Webpay] Pago rechazado", JSON.stringify(result));
  waitUntil(
    registrarRechazoEnSupabase(order, result).catch((e) =>
      console.log("[Polyplas] error registrando rechazo", e),
    ),
  );
  return redirect(returnPage, { pp_pago: "rechazado" });
}
