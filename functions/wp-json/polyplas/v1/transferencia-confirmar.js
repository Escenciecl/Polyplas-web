/**
 * POST /wp-json/polyplas/v1/transferencia-confirmar   { id: "<id de la conversación en el CRM>" }
 * Lo llama el panel CRM al apretar "Cerrar venta" en un pedido pagado por transferencia.
 * Envía al cliente (y copia a ventas) el correo "Transferencia recibida".
 *
 * El panel no tiene inicio de sesión real, así que aquí NO se confía en lo que manda:
 * se lee el pedido en Supabase y solo se envía si de verdad es una transferencia, ya tiene
 * "Cerrar venta" y todavía no se había avisado (un pedido = un solo correo).
 */
import { json, enviarComprobante, clp } from "../../../_lib/webpay.js";
import { leerPedidoCRM, marcarTransferenciaRecibida, notaCRM } from "../../../_lib/transferencia.js";

const ORIGENES = ["https://escenciecl.github.io", "https://polyplas.cl", "https://www.polyplas.cl"];
function cors(request) {
  const o = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGENES.includes(o) ? o : ORIGENES[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
const responder = (request, data, status = 200) => {
  const r = json(data, status);
  for (const [k, v] of Object.entries(cors(request))) r.headers.set(k, v);
  return r;
};

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  let p;
  try { p = await request.json(); } catch { return responder(request, { ok: false, message: "JSON inválido" }, 400); }
  const id = String((p && p.id) || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return responder(request, { ok: false, message: "Pedido no válido" }, 400);

  let conv;
  try { conv = await leerPedidoCRM(id); } catch { return responder(request, { ok: false, message: "No se pudo leer el CRM" }, 502); }
  const md = (conv && conv.metadata) || {};
  if (!conv || md.source !== "transferencia") return responder(request, { ok: false, message: "No es un pedido por transferencia" }, 404);
  if (md.venta_cerrada !== true) return responder(request, { ok: false, message: "La venta aún no está cerrada" }, 409);
  if (md.confirmacion_enviada) return responder(request, { ok: true, yaEnviado: true, message: "El correo ya se había enviado" });

  let toca;
  try { toca = await marcarTransferenciaRecibida(conv); } catch (e) {
    console.log("[Polyplas transferencia] No se pudo marcar como recibida", String(e));
    return responder(request, { ok: false, message: "No se pudo actualizar el CRM" }, 502);
  }
  if (!toca) return responder(request, { ok: true, yaEnviado: true, message: "El correo ya se había enviado" });

  const orden = md.transferencia_orden || "";
  const order = {
    buy_order: orden,
    client: { tipo: md.tipo_cliente, nombre: md.nombre, razon: md.razon_social, rut: md.rut, giro: md.giro, email: md.email || conv.client_email, tel: md.phone, dir: md.dir, ciudad: md.ciudad, region: md.region },
    items: md.items || [],
    entrega: md.entrega || "",
  };
  const tbk = { buy_order: orden, amount: Math.trunc(Number(md.total) || 0), authorization_code: "" };
  const envio = Promise.resolve(
    enviarComprobante(env, order, tbk, {
      medioPago: "Transferencia",
      intro: "Recibimos tu transferencia y tu pago est&aacute; confirmado. Tu pedido ya est&aacute; en preparaci&oacute;n.",
      asunto: `Transferencia recibida - Pedido Polyplas ${orden}`,
      prefijoVentas: "[TRANSFERENCIA RECIBIDA]",
    }),
  ).catch((e) => console.log("[Polyplas transferencia] Error correo confirmación", String(e)));
  waitUntil(Promise.all([
    envio,
    notaCRM(id, `✅ TRANSFERENCIA RECIBIDA\nPedido ${orden} · ${clp(tbk.amount)}\nSe envió el correo de confirmación a ${order.client.email || "(sin correo)"} y copia a ventas.`).catch(() => {}),
  ]));
  return responder(request, { ok: true, enviadoA: order.client.email || "" });
}

export const onRequest = ({ request }) => responder(request, { ok: false, message: "Usa POST" }, 405);
