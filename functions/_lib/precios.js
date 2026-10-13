/**
 * Verificación del total antes de crear el pago en Webpay.
 *
 * El carrito calcula el total en el navegador. Para que nadie pueda pagar menos
 * modificando la página, aquí se vuelve a calcular con los precios y el stock del CRM
 * (tabla pp_stock de Supabase) y se compara con el total que llegó.
 *
 * Reglas:
 *  - Cada producto se identifica por su `sku` (la misma clave que usa el carrito).
 *  - Precio = el del CRM (IVA incluido) × cantidad.
 *  - Corte a medida: el recargo solo puede ir de $0 al 10 % del valor de las planchas.
 *  - Embalaje de tinas: valor fijo por tina (EMBALAJE_TINA).
 *  - Producto sin stock, sin precio en el CRM o desconocido: el pago no se crea.
 *  - Si el CRM no responde, el pago sigue (no se pierde la venta) y el pedido queda
 *    marcado para revisión en el correo a ventas.
 */

const SUPABASE_URL = "https://gdrkscedvkjtcvexnhzg.supabase.co/rest/v1";
const SUPABASE_KEY = "sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc";

/** Embalaje obligatorio u opcional de cada tina (mismo valor que EMBALAJE_PRECIO en el módulo de tinas). */
export const EMBALAJE_TINA = 90000;

/** Misma traducción sku → clave del CRM que usa el carrito (gcClaveCRM). */
export function claveCRM(sku) {
  sku = String(sku || "");
  if (sku === "DUCHA_columna_inox") return "DUCHAS|columna";
  if (sku === "MAMPARA_ducha_vidrio") return "MAMPARAS|vidrio";
  if (sku === "TINA_faldon_kuyen" || sku === "CASCO_faldon_kuyen") return "TINAS|kuyen_faldon";
  let m = /^(CUP|REC|CASCO|TINA)_(.+)$/.exec(sku);
  if (m) return { CUP: "CUPULAS", REC: "RECEPTACULOS", CASCO: "CASCOS", TINA: "TINAS" }[m[1]] + "|" + m[2];
  const p = sku.split("_");
  if (p.length >= 4) {
    const tipo = p[0], dim = p[1], esp = p[p.length - 1], color = p.slice(2, -1).join("_");
    if (tipo === "AA" || tipo === "PA") return `${tipo}|${dim}|${color}|${esp}`;
    if (tipo === "PET") return `SIN_MATERIAL|${dim}_pet|clear|${esp}`;
    if (tipo === "PETG") return `SIN_MATERIAL|${dim}_petg|clear|${esp}`;
    if (tipo === "PC") return `SIN_MATERIAL|${dim}_pc|clear|${esp}`;
  }
  return "";
}

function claveFila(r) {
  const base = `${r.tipo}|${r.dim}`;
  return r.color && r.color !== "na" ? `${base}|${r.color}|${r.espesor}` : base;
}

async function leerStock() {
  const r = await fetch(`${SUPABASE_URL}/pp_stock?select=tipo,dim,color,espesor,cantidad,precio`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    cf: { cacheTtl: 0 },
  });
  if (!r.ok) throw new Error(`pp_stock ${r.status}`);
  const filas = await r.json();
  const mapa = new Map();
  for (const f of filas) mapa.set(claveFila(f), f);
  return mapa;
}

const entero = (v) => Math.round(Number(v) || 0);

/**
 * Devuelve { ok: true, verificado: true|false } o { ok: false, code, message, detalle }.
 * `verificado: false` = el CRM no respondió y no se pudo comprobar.
 */
export async function verificarTotal(items, total) {
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, code: "verificacion", message: "Tu carrito está vacío.", detalle: "sin items" };
  }

  let stock;
  try {
    stock = await leerStock();
  } catch (e) {
    console.log("[Polyplas Webpay] No se pudo leer pp_stock; el pago sigue sin verificar", String(e));
    return { ok: true, verificado: false };
  }

  let esperado = 0;
  let tinas = 0;
  let embalajes = 0;

  for (const it of items) {
    const qty = entero(it && it.qty);
    if (qty < 1 || qty > 999) {
      return { ok: false, code: "verificacion", message: "Revisa las cantidades de tu carrito.", detalle: `qty ${it && it.qty}` };
    }

    if (it.sku === "EMBALAJE") {
      embalajes += qty;
      esperado += EMBALAJE_TINA * qty;
      continue;
    }

    const clave = claveCRM(it.sku);
    const fila = clave ? stock.get(clave) : null;
    const precio = fila ? entero(fila.precio) : 0;
    if (!fila || precio <= 0) {
      return {
        ok: false,
        code: "verificacion",
        message: "No pudimos confirmar el precio de un producto. Escríbenos por WhatsApp al +56 9 4208 6751 y te ayudamos a completar la compra.",
        detalle: `sin precio en CRM: ${it.sku || "(sin sku)"} → ${clave || "?"}`,
      };
    }
    if (Number(fila.cantidad) === 0) {
      return {
        ok: false,
        code: "precio_cambio",
        message: "Un producto de tu carrito se quedó sin stock. Revisa tu carrito antes de pagar.",
        detalle: `sin stock: ${clave}`,
      };
    }

    if (clave.startsWith("TINAS|") && clave !== "TINAS|kuyen_faldon") tinas += qty;

    // Recargo por cortes distintos: como máximo el 10 % del valor de las planchas (más redondeo)
    let corte = entero(it.corte_costo);
    const corteMax = Math.round(precio * qty * 0.1) + qty + 2;
    if (corte < 0 || corte > corteMax) corte = corteMax;

    const emb = it.embalaje ? EMBALAJE_TINA * qty : 0;
    if (it.embalaje) embalajes += qty;

    esperado += precio * qty + corte + emb;
  }

  if (embalajes > tinas) {
    return { ok: false, code: "verificacion", message: "Revisa el embalaje de tu pedido.", detalle: `embalajes ${embalajes} > tinas ${tinas}` };
  }

  const tolerancia = 2 * items.length;
  if (Math.abs(entero(total) - esperado) > tolerancia) {
    return {
      ok: false,
      code: "precio_cambio",
      message: "Los precios de tu carrito se actualizaron. Revísalo antes de pagar.",
      detalle: `total ${entero(total)} ≠ esperado ${esperado}`,
    };
  }

  return { ok: true, verificado: true };
}
