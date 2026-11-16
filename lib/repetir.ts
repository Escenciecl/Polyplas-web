/**
 * "Repetir pedido": vuelve a poner en el carro los productos de una compra anterior,
 * con las mismas cantidades y medidas de corte.
 *
 * - Usa el carro global del sitio (window.ppGlobalCartAdd / ppGCOpen, módulo 04-carrito-y-pago).
 * - El precio y el stock son SIEMPRE los de hoy: el carro los actualiza desde el CRM al abrirse
 *   (gcSyncCRM) y el servidor los vuelve a verificar antes de pagar (functions/_lib/precios.js).
 * - Lo que no se puede repetir (sin stock, ya no se vende o pedido antiguo sin código de producto)
 *   se informa para pedirlo por WhatsApp.
 */

import { prepararDatosPago } from "@/lib/cuenta";

export type ItemCompra = {
  sku?: string;
  nombre?: string;
  qty?: number;
  precio_unit?: number;
  corte_costo?: number;
  subtotal?: number;
  corteMode?: string;
  tieneRecargo?: boolean;
  corteInstrucciones?: string;
  corteMedidas?: unknown;
  calcInfo?: unknown;
  embalaje?: boolean;
  flujo?: string;
  tipo?: string;
  dim?: string;
  color?: string;
  espesor?: string;
  precio?: number;
};

type FilaCRM = { precio?: number; cantidad?: number | null };
type Ventana = Window & {
  ppGlobalCartAdd?: (item: Record<string, unknown>) => void;
  ppGCOpen?: () => void;
  ppCRM?: { get: (clave: string) => FilaCRM | null | undefined };
  ppCRMActualizar?: () => Promise<unknown>;
  dataLayer?: object[];
};

/** Mismo valor que EMBALAJE_TINA (functions/_lib/precios.js). */
const EMBALAJE_TINA = 90000;

/** Misma traducción sku → clave del CRM que el carrito (gcClaveCRM) y el servidor (claveCRM). */
export function claveCRM(sku?: string): string {
  const s = String(sku || "");
  if (s === "DUCHA_columna_inox") return "DUCHAS|columna";
  if (s === "MAMPARA_ducha_vidrio") return "MAMPARAS|vidrio";
  if (s === "TINA_faldon_kuyen" || s === "CASCO_faldon_kuyen") return "TINAS|kuyen_faldon";
  const m = /^(CUP|REC|CASCO|TINA)_(.+)$/.exec(s);
  if (m) return ({ CUP: "CUPULAS", REC: "RECEPTACULOS", CASCO: "CASCOS", TINA: "TINAS" } as Record<string, string>)[m[1]] + "|" + m[2];
  const p = s.split("_");
  if (p.length >= 4) {
    const tipo = p[0], dim = p[1], esp = p[p.length - 1], color = p.slice(2, -1).join("_");
    if (tipo === "AA" || tipo === "PA") return `${tipo}|${dim}|${color}|${esp}`;
    if (tipo === "PET") return `SIN_MATERIAL|${dim}_pet|clear|${esp}`;
    if (tipo === "PETG") return `SIN_MATERIAL|${dim}_petg|clear|${esp}`;
    if (tipo === "PC") return `SIN_MATERIAL|${dim}_pc|clear|${esp}`;
  }
  return "";
}

/** Módulo del carrito (etiqueta que se ve sobre el nombre del producto). */
function moduloDe(sku: string): string {
  if (sku === "DUCHA_columna_inox") return "duchas";
  if (sku === "MAMPARA_ducha_vidrio") return "mamparas";
  const pre = sku.split("_")[0];
  return ({ AA: "acrilico", PA: "acrilico", PET: "pet", PETG: "petg", PC: "pc", CUP: "cupulas", REC: "receptaculos", TINA: "tinas", CASCO: "cascos" } as Record<string, string>)[pre] || "";
}

export const nombreItem = (it: ItemCompra) => it.nombre || [it.tipo, it.dim, it.color, it.espesor].filter(Boolean).join(" · ") || "Producto";

/** Líneas que el carrito arma solo al pagar: no se repiten como productos. */
const esLineaAutomatica = (it: ItemCompra) => it.sku === "DESPACHO" || it.sku === "EMBALAJE";

/** ¿Tiene algo que se pueda volver a poner en el carro? (sin consultar stock) */
export function sePuedeRepetir(items: ItemCompra[] | null | undefined): boolean {
  return (items || []).some((it) => !esLineaAutomatica(it) && !!claveCRM(it.sku));
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera a que el carro del sitio esté listo (se carga con los scripts de la página). */
async function carroListo(w: Ventana): Promise<boolean> {
  for (let i = 0; i < 40; i++) {
    if (typeof w.ppGlobalCartAdd === "function" && typeof w.ppGCOpen === "function") return true;
    await esperar(150);
  }
  return false;
}

export type ResultadoRepetir = { agregados: number; faltan: string[]; sinCarro?: boolean };

export async function repetirCompra(orden: string, items: ItemCompra[] | null | undefined, cliente?: unknown): Promise<ResultadoRepetir> {
  const w = window as Ventana;
  // Los datos del pago serán los de ESTE pedido (se pueden cambiar en "Datos y envío")
  if (cliente) await prepararDatosPago({ orden, cliente });
  if (!(await carroListo(w))) return { agregados: 0, faltan: [], sinCarro: true };

  // Precio y stock de hoy (si el CRM no responde, el carro y el servidor igual los revisan)
  try {
    if (typeof w.ppCRMActualizar === "function") await w.ppCRMActualizar();
  } catch { /* sigue */ }

  let agregados = 0;
  const faltan: string[] = [];
  (items || []).forEach((it, i) => {
    if (esLineaAutomatica(it)) return;
    const sku = String(it.sku || "");
    const clave = claveCRM(sku);
    const fila = clave && w.ppCRM ? w.ppCRM.get(clave) : undefined;
    // Sin código de producto, ya no está en el CRM o sin stock → no se agrega
    if (!clave || (w.ppCRM && (!fila || !(Number(fila.precio) > 0) || fila.cantidad === 0))) {
      faltan.push(`${nombreItem(it)} × ${it.qty || 1}`);
      return;
    }
    const qty = Math.max(1, Math.round(Number(it.qty) || 1));
    const precio = Number(it.precio_unit) || Number(fila?.precio) || 0;
    const corte = Number(it.corte_costo) || 0;
    w.ppGlobalCartAdd!({
      ...it,
      // id fijo por pedido y línea: si se aprieta dos veces, no se duplica
      gid: `rep-${orden}-${i}`,
      sku,
      module: moduloDe(sku),
      qty,
      precio_unit: precio,
      corte_costo: corte,
      embalaje_unit: it.embalaje ? EMBALAJE_TINA : undefined,
      subtotal: precio * qty + corte + (it.embalaje ? EMBALAJE_TINA * qty : 0),
      agotado: false,
      repetido_de: orden,
    });
    agregados++;
  });

  try {
    (w.dataLayer = w.dataLayer || []).push({ event: "repetir_pedido", orden_original: orden, items_repetidos: agregados, items_no_disponibles: faltan.length });
  } catch { /* sin medición */ }

  // Abre el carro: ahí se actualizan precio y stock y el cliente va directo a pagar
  if (agregados > 0) w.ppGCOpen!();
  return { agregados, faltan };
}

/** WhatsApp con el pedido listo (botón, no enlace: GTM reescribe los enlaces wa.me). */
export function whatsappRepetir(orden: string, faltan: string[]) {
  const msg =
    `Hola Polyplas, quiero repetir mi pedido ${orden}.` +
    (faltan.length ? `\n\nEstos productos no se pudieron agregar al carro:\n• ${faltan.join("\n• ")}` : "");
  const url = "https://wa.me/56942086751?text=" + encodeURIComponent(msg);
  let v: Window | null = null;
  try {
    v = window.open(url, "_blank");
    if (v) v.opener = null;
  } catch { /* bloqueado */ }
  if (!v) window.location.href = url;
}

/** Pedido a repetir que llegó por el enlace del correo (?repetir=ORDEN): dura 7 días en este navegador. */
const LLAVE = "pp_repetir";
export function guardarPendiente(orden: string) {
  try { localStorage.setItem(LLAVE, JSON.stringify({ orden, t: Date.now() })); } catch { /* sin almacenamiento */ }
}
export function leerPendiente(): string {
  try {
    const d = JSON.parse(localStorage.getItem(LLAVE) || "null");
    if (d && d.orden && Date.now() - (d.t || 0) < 7 * 864e5) return String(d.orden);
    localStorage.removeItem(LLAVE);
  } catch { /* sin almacenamiento */ }
  return "";
}
export function borrarPendiente() {
  try { localStorage.removeItem(LLAVE); } catch { /* sin almacenamiento */ }
}

/** ¿Siguen en el carro los productos que se agregaron al repetir este pedido? */
export function quedanEnCarro(orden: string): boolean {
  try {
    const d = JSON.parse(localStorage.getItem("pp_global_cart") || "null");
    const items = (Array.isArray(d) ? d : d?.items) || [];
    return items.some((i: { gid?: string }) => String(i.gid || "").startsWith(`rep-${orden}-`));
  } catch {
    return false;
  }
}
