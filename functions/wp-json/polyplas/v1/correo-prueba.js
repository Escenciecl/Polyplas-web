/**
 * POST /wp-json/polyplas/v1/correo-prueba
 * Envía un comprobante de PRUEBA solo a ventas@polyplas.cl (nunca a otra dirección)
 * para verificar que el envío de correos funciona sin tener que comprar.
 */
import { json, enviarComprobante } from "../../../_lib/webpay.js";

export async function onRequestPost({ env }) {
  const order = {
    buy_order: "PRUEBA",
    client: { nombre: "Prueba de correo" }, // sin email de cliente: solo llega a ventas
    items: [
      {
        tipo: "Plancha acrílico", dim: "122 × 244 cm", color: "Transparente", espesor: "3mm", qty: 1, subtotal: 1000,
        corteMode: "distintos",
        corteMedidas: { items: [{ medidas: [{ ancho: 60, alto: 120, qty: 2 }, { ancho: 40, alto: 50, qty: 3 }] }] },
      },
    ],
    entrega: "Prueba",
  };
  const tbk = { buy_order: "PRUEBA-" + Date.now().toString().slice(-6), amount: 1000, authorization_code: "000000" };
  const r = await enviarComprobante(env, order, tbk);
  if (!r) return json({ ok: false, message: "Falta BREVO_API_KEY" }, 503);
  const res = r.map((x) => (x.status === "fulfilled" ? x.value : { ok: false, detail: String(x.reason).slice(0, 200) }));
  return json({ ok: res.every((x) => x.ok), resultados: res.map(({ ok, status, detail }) => ({ ok, status, detail })) });
}

export const onRequest = () => json({ code: "method", message: "Usa POST" }, 405);
