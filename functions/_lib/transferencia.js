/**
 * Pago por transferencia bancaria.
 * Los datos de la cuenta están aquí (servidor: correos) y en content/modulos/30-gracias (pantalla final).
 * Si cambian, actualizar los dos lugares.
 */
import { esc, clp } from "./webpay.js";

export const CUENTA = {
  titular: "POLYPLAS LTDA",
  rut: "78.844.390-0",
  banco: "Banco de Chile",
  tipo: "Cuenta Corriente",
  numero: "159-02784-05",
  email: "ventas@polyplas.cl",
  whatsapp: "+56 9 4208 6751",
  whatsappUrl: "https://wa.me/56942086751",
};

/** Número de pedido para transferencias: TR-XXXXXXXX (distinto de las órdenes Webpay PP-…) */
export function ordenTransferencia() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return "TR-" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Bloque HTML con los datos para transferir (correo al cliente y copia a ventas). */
export function cuentaHtml(orden, monto) {
  const fila = (k, v, fuerte) =>
    `<tr><td style="padding:8px 12px;font-size:0.8rem;color:#666;border-bottom:1px solid #dbe5f3;width:42%;">${esc(k)}</td>` +
    `<td style="padding:8px 12px;font-size:0.92rem;color:#1a1a2e;border-bottom:1px solid #dbe5f3;font-weight:${fuerte ? 700 : 600};">${esc(v)}</td></tr>`;
  return `
    <tr>
        <td style="padding:0 40px 24px;">
            <h2 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1.5px;color:#004a99;margin:0 0 12px;">Datos para transferir</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fb;border:1px solid #dbe5f3;border-radius:10px;overflow:hidden;">
                ${fila("Titular", CUENTA.titular)}
                ${fila("RUT", CUENTA.rut)}
                ${fila("Banco", CUENTA.banco)}
                ${fila("Tipo de cuenta", CUENTA.tipo)}
                ${fila("N° de cuenta", CUENTA.numero, true)}
                ${fila("Email", CUENTA.email)}
                ${fila("Monto a transferir", clp(monto), true)}
                ${fila("Mensaje / glosa", `Pedido ${orden}`, true)}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:#fff8e6;border-left:4px solid #f0a500;border-radius:0 10px 10px 0;">
                <tr><td style="padding:14px 18px;font-size:0.86rem;color:#5c4400;line-height:1.55;">
                    <strong>Importante:</strong> transfiere el monto exacto y escribe <strong>Pedido ${esc(orden)}</strong> en el mensaje de la transferencia.
                    Luego env&iacute;a el comprobante a <a href="mailto:${esc(CUENTA.email)}" style="color:#004a99;">${esc(CUENTA.email)}</a>
                    o por WhatsApp al <a href="${esc(CUENTA.whatsappUrl)}" style="color:#128c7e;font-weight:700;text-decoration:none;">${esc(CUENTA.whatsapp)}</a>.
                    Preparamos tu pedido apenas confirmemos el pago.
                </td></tr>
            </table>
        </td>
    </tr>`;
}

const SUPABASE_URL = "https://gdrkscedvkjtcvexnhzg.supabase.co/rest/v1";
// Llave pública (publishable): la misma que ya usa el sitio en el navegador.
const SUPABASE_KEY = "sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc";

/**
 * Registra el pedido por transferencia en el CRM (tabla conversations), PENDIENTE DE PAGO.
 * Usa source "transferencia" (no "order") para que el panel NO lo cuente como venta todavía:
 * cuando llegue la plata, en el panel se usa "Cerrar venta" y recién ahí suma a las ventas.
 */
export async function registrarTransferenciaEnSupabase(order) {
  const c = order.client || {};
  const nombre = c.nombre || c.razon || "";
  const convId = crypto.randomUUID();
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const metadata = {
    source: "transferencia",
    estado_pago: "pendiente",
    metodo_pago: "transferencia",
    transferencia_orden: order.orden,
    terms_accepted: !!order.terms_accepted,
    nombre,
    razon_social: c.razon || "",
    tipo_cliente: c.tipo || "",
    rut: c.rut || "",
    giro: c.giro || "",
    email: c.email || "",
    phone: c.tel || "",
    // Persona Natural manda la dirección de facturación en *_factura y deja dir/ciudad/region
    // para el despacho (vacíos si retira en tienda). Igual que el registro de Webpay del navegador,
    // se usa la de facturación como respaldo y además se guarda aparte para facturar.
    dir: c.dir || c.dir_factura || "",
    ciudad: c.ciudad || c.ciudad_factura || "",
    region: c.region || c.region_factura || "",
    dir_factura: c.dir_factura || c.dir || "",
    ciudad_factura: c.ciudad_factura || c.ciudad || "",
    region_factura: c.region_factura || c.region || "",
    entrega: order.entrega,
    total: order.total,
    items: order.items,
    verificado: order.verificado,
  };
  const r = await fetch(`${SUPABASE_URL}/conversations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: convId,
      client_name: nombre || "Sin nombre",
      client_email: c.email || "",
      unread_count: 1,
      last_message_at: new Date().toISOString(),
      metadata,
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    console.log("[Polyplas transferencia] Error al registrar en el CRM", r.status, txt);
    throw new Error("crm " + r.status);
  }
  const lineas = (order.items || []).map((it) => {
    const q = parseInt(it.qty ?? 1, 10) || 1;
    return `• ${it.nombre || [it.tipo, it.dim, it.color, it.espesor].filter(Boolean).join(" · ")} × ${q} → ${clp(it.subtotal || 0)}` +
      (it.corteInstrucciones ? `\n   Corte: ${it.corteInstrucciones}` : "");
  });
  const msg =
    "🏦 PEDIDO WEB · TRANSFERENCIA PENDIENTE\n" +
    `Pedido ${order.orden} — aún NO está pagado\n─────────────────\n` +
    lineas.join("\n") +
    "\n─────────────────\n" +
    `Entrega: ${order.entrega}   Total a transferir: ${clp(order.total)}\n` +
    "─────────────────\n" +
    `Cliente: ${nombre}  RUT: ${c.rut || ""}\n` +
    `Email: ${c.email || ""}  Tel: ${c.tel || ""}\n` +
    `Dirección facturación: ${c.dir_factura || c.dir || ""}, ${c.ciudad_factura || c.ciudad || ""}, ${c.region_factura || c.region || ""}\n` +
    (c.dir_factura && c.dir ? `Dirección despacho: ${c.dir}, ${c.ciudad || ""}, ${c.region || ""}\n` : "") +
    "─────────────────\n" +
    (order.verificado === false ? "⚠ El CRM no respondió al crear el pedido: revisa los precios antes de confirmar.\n" : "") +
    "Cuando llegue la transferencia a la cuenta, usa «Cerrar venta» para que cuente como venta.";
  await fetch(`${SUPABASE_URL}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ conversation_id: convId, sender: "client", content: msg }),
  });
  return convId;
}

/* ------------------------------------------------------------ confirmación del pago */
const sbHeaders = (extra = {}) => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

/** Lee el pedido (conversación) del CRM. */
export async function leerPedidoCRM(convId) {
  const r = await fetch(`${SUPABASE_URL}/conversations?id=eq.${encodeURIComponent(convId)}&select=id,client_name,client_email,metadata`, { headers: sbHeaders() });
  if (!r.ok) throw new Error("crm " + r.status);
  const filas = await r.json();
  return filas && filas[0] ? filas[0] : null;
}

/**
 * Marca el pedido como "transferencia recibida" SOLO si aún no se había avisado.
 * El filtro confirmacion_enviada=is.null hace que dos clics seguidos no manden dos correos:
 * el segundo no encuentra filas para actualizar.
 * Devuelve true si este llamado es el que debe enviar el correo.
 */
export async function marcarTransferenciaRecibida(conv) {
  const md = conv.metadata || {};
  const nuevo = { ...md, estado_pago: "pagado", confirmacion_enviada: new Date().toISOString() };
  const r = await fetch(
    `${SUPABASE_URL}/conversations?id=eq.${encodeURIComponent(conv.id)}&metadata->>confirmacion_enviada=is.null`,
    { method: "PATCH", headers: sbHeaders({ Prefer: "return=representation" }), body: JSON.stringify({ metadata: nuevo }) },
  );
  if (!r.ok) throw new Error("crm " + r.status + " " + (await r.text()).slice(0, 200));
  const filas = await r.json();
  return Array.isArray(filas) && filas.length > 0;
}

/** Deja una nota en la conversación del CRM (historial). */
export async function notaCRM(convId, texto) {
  await fetch(`${SUPABASE_URL}/messages`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({ conversation_id: convId, sender: "client", content: texto }),
  });
}
