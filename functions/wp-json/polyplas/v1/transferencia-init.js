/**
 * POST /wp-json/polyplas/v1/transferencia-init
 * Pedido con pago por transferencia bancaria:
 *  1. Verifica el total con los precios y el stock del CRM (igual que Webpay).
 *  2. Lo registra en el CRM de Supabase como "transferencia pendiente".
 *  3. Envía al cliente (y copia a ventas) el detalle con los datos de la cuenta.
 * Devuelve { ok, orden, total } para mostrar la pantalla final con los datos para transferir.
 */
import { json, enviarComprobante } from "../../../_lib/webpay.js";
import { verificarTotal } from "../../../_lib/precios.js";
import { ordenTransferencia, cuentaHtml, registrarTransferenciaEnSupabase } from "../../../_lib/transferencia.js";

const GA4_STREAM = "HTFZ3XVZZP";
function gaDesdeCookies(cookie) {
  const get = (name) => {
    const m = String(cookie || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    try { return m ? decodeURIComponent(m[1]) : ""; } catch { return m ? m[1] : ""; }
  };
  const partes = get("_ga").split(".");
  if (partes.length < 4 || !/^\d+$/.test(partes[partes.length - 2])) return null;
  const clientId = partes.slice(-2).join(".");
  const s = get("_ga_" + GA4_STREAM);
  let sessionId = "";
  let m = s.match(/^GS2\.\d+\.s(\d+)/);
  if (m) sessionId = m[1];
  else if ((m = s.match(/^GS1\.\d+\.(\d+)\./))) sessionId = m[1];
  return { client_id: clientId, session_id: sessionId };
}
function gaItems(items) {
  return (Array.isArray(items) ? items : []).slice(0, 50).map((it, i) => {
    it = it || {};
    const qty = Math.max(1, Math.trunc(Number(it.qty) || 1));
    const sub = Number(it.subtotal) || 0;
    let id = String(it.sku || "SIN_SKU");
    if (/^REC_/.test(id)) id = "RECEP_" + id.slice(4);
    return { item_id: id.slice(0, 100), item_name: String(it.nombre || "").slice(0, 100), item_brand: "Polyplas", price: Math.round(Number(it.precio_unit) || sub / qty || 0), quantity: qty, index: i };
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
  let p;
  try {
    p = await request.json();
  } catch {
    return json({ code: "bad_request", message: "JSON inválido" }, 400);
  }

  const total = Math.trunc(Number(p.total) || 0);
  if (total <= 0) return json({ code: "invalid_amount", message: "Monto invalido" }, 400);
  const c = p.client || {};
  if (!(c.nombre || c.razon) || !c.email) return json({ code: "verificacion", message: "Faltan tus datos de contacto." }, 400);

  // Mismo control que Webpay: el total debe calzar con los precios vigentes del CRM
  const verif = await verificarTotal(p.items, total);
  if (!verif.ok) {
    console.log("[Polyplas transferencia] Pedido rechazado por verificación:", verif.detalle);
    return json({ code: verif.code, message: verif.message }, 409);
  }

  const items = Array.isArray(p.items) ? p.items : [];
  const itemsClean = items.map((it) => {
    if (!it || !it.calcInfo) return it;
    const { pngsB64, svgs, ...rest } = it.calcInfo; // eslint-disable-line no-unused-vars
    return { ...it, calcInfo: rest };
  });

  const ga = gaDesdeCookies(request.headers.get("Cookie") || "");
  const orden = ordenTransferencia();
  const order = {
    orden,
    buy_order: orden,
    total,
    client: c,
    items: itemsClean,
    items_full: items,
    entrega: String(p.entrega || "").slice(0, 200),
    verificado: verif.verificado,
    terms_accepted: !!p.terms_accepted,
    ga,
    ga_items: gaItems(itemsClean),
  };

  // El CRM es lo importante: si no se pudo registrar, se avisa al cliente para que no transfiera a ciegas
  try {
    await registrarTransferenciaEnSupabase(order);
  } catch (e) {
    return json({ code: "crm", message: "No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp al +56 9 4208 6751." }, 502);
  }

  // Correo con los datos de la cuenta (cliente + copia a ventas) en segundo plano
  const tbk = { buy_order: orden, amount: total, authorization_code: "" };
  waitUntil(
    Promise.resolve(
      enviarComprobante(env, order, tbk, {
        pendiente: true,
        extraHtml: cuentaHtml(orden, total),
        asunto: `Tu pedido Polyplas ${orden} - Datos para transferir`,
        prefijoVentas: "[TRANSFERENCIA PENDIENTE]",
      }),
    ).catch((e) => console.log("[Polyplas transferencia] Error correo", String(e))),
  );

  return json({ ok: true, orden, total });
}

export const onRequest = () => json({ code: "method", message: "Usa POST" }, 405);
