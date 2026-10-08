"use client";

/**
 * Precios y stock del CRM en TODO el sitio.
 *
 * El CRM guarda precio, precio anterior y cantidad en la tabla pp_stock de Supabase.
 * Este componente la lee una vez por página y actualiza cualquier elemento del HTML marcado con:
 *
 *   data-crm-precio="TIPO|codigo"     → escribe el precio actual            ($479.990)
 *   data-crm-antes="TIPO|codigo"      → escribe el precio anterior tachado; se oculta si no hay
 *   data-crm-descuento="TIPO|codigo"  → escribe el descuento (-28%); se oculta si no hay
 *   data-crm-agotado="TIPO|codigo"    → se muestra solo cuando la cantidad es 0
 *   data-crm-bloquear="TIPO|codigo"   → botón que se desactiva cuando la cantidad es 0
 *   data-crm-desde="TIPO,TIPO2"       → el precio más bajo con stock de esos tipos
 *
 * La clave es la misma del CRM: tipo y código (ej. TINAS|vilcun, CUPULAS|54x54) o, en planchas,
 * tipo|medida|color|espesor (ej. AA|1800x1200|clear|3mm).
 * El precio escrito en el HTML es solo el respaldo que se ve mientras carga o si el CRM no tiene el dato.
 * Un producto nuevo solo necesita existir en el CRM y llevar estas marcas en su página.
 */
import { useEffect } from "react";

const SB_URL = "https://gdrkscedvkjtcvexnhzg.supabase.co";
const SB_KEY = "sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc";
const CACHE = "pp_crm_stock";
const VIGENCIA = 60_000; // 1 minuto

type Fila = { tipo: string; dim: string; color: string; espesor: string; cantidad: number | null; precio: number | null; precio_antes: number | null };
export type CrmApi = { get: (clave: string) => Fila | null; desde: (tipos: string) => number; filas: Fila[] };

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const clave4 = (k: string) => {
  const p = k.split("|").map((s) => s.trim());
  return p.length >= 4 ? p.slice(0, 4).join("|") : `${p[0]}|${p[1] ?? ""}|na|na`;
};
// Filas que no son productos (interruptores del CRM) o medidas de otros materiales guardadas bajo AA/PA
const noEsProducto = (f: Fila) => f.dim === "kuyen_faldon" || /_(pc|pet|petg)$/.test(f.dim);

function crearApi(filas: Fila[]): CrmApi {
  const mapa = new Map(filas.map((f) => [`${f.tipo}|${f.dim}|${f.color}|${f.espesor}`, f]));
  return {
    filas,
    get: (k) => mapa.get(clave4(k)) ?? null,
    desde: (tipos) => {
      const lista = tipos.split(",").map((t) => t.trim());
      const precios = filas
        .filter((f) => lista.includes(f.tipo) && !noEsProducto(f) && (f.precio ?? 0) > 0 && f.cantidad !== 0)
        .map((f) => f.precio as number);
      return precios.length ? Math.min(...precios) : 0;
    },
  };
}

function pintar(api: CrmApi) {
  const cada = (attr: string, fn: (el: HTMLElement, f: Fila | null, valor: string) => void) =>
    document.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((el) => {
      const valor = el.getAttribute(attr) || "";
      fn(el, valor ? api.get(valor) : null, valor);
    });

  cada("data-crm-precio", (el, f) => {
    if (f && (f.precio ?? 0) > 0) el.textContent = fmt(f.precio as number);
  });
  cada("data-crm-antes", (el, f) => {
    if (!f || !((f.precio ?? 0) > 0)) return; // sin dato del CRM: se deja el respaldo del HTML
    const hay = (f.precio_antes ?? 0) > (f.precio as number);
    el.hidden = !hay;
    if (hay) el.textContent = fmt(f.precio_antes as number);
  });
  cada("data-crm-descuento", (el, f) => {
    if (!f || !((f.precio ?? 0) > 0)) return;
    const antes = f.precio_antes ?? 0;
    const hay = antes > (f.precio as number);
    el.hidden = !hay;
    if (hay) el.textContent = "-" + Math.round(((antes - (f.precio as number)) / antes) * 100) + "%";
  });
  cada("data-crm-agotado", (el, f) => {
    if (f) el.hidden = f.cantidad !== 0;
  });
  cada("data-crm-bloquear", (el, f) => {
    if (!f) return;
    const agotado = f.cantidad === 0;
    (el as HTMLButtonElement).disabled = agotado;
    el.classList.toggle("is-agotado", agotado);
  });
  cada("data-crm-desde", (el, _f, tipos) => {
    const p = api.desde(tipos);
    if (p > 0) el.textContent = fmt(p);
  });
}

async function cargar(): Promise<Fila[]> {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE) || "null");
    if (c && Date.now() - c.t < VIGENCIA && Array.isArray(c.filas)) return c.filas;
  } catch {}
  const r = await fetch(`${SB_URL}/rest/v1/pp_stock?select=tipo,dim,color,espesor,cantidad,precio,precio_antes&limit=5000`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) throw new Error("pp_stock " + r.status);
  const filas = (await r.json()) as Fila[];
  try {
    sessionStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), filas }));
  } catch {}
  return filas;
}

export default function PreciosCrm() {
  useEffect(() => {
    let vivo = true;
    let api: CrmApi | null = null;
    const repintar = () => api && pintar(api);
    cargar()
      .then((filas) => {
        if (!vivo) return;
        api = crearApi(filas);
        (window as unknown as { ppCRM?: CrmApi }).ppCRM = api;
        pintar(api);
        document.dispatchEvent(new CustomEvent("pp:crm"));
        // los módulos heredados pueden insertar contenido un poco después
        setTimeout(repintar, 800);
        setTimeout(repintar, 2500);
      })
      .catch((e) => console.warn("[Polyplas] precios del CRM:", e));
    document.addEventListener("pp:legacy-ready", repintar);
    return () => {
      vivo = false;
      document.removeEventListener("pp:legacy-ready", repintar);
    };
  }, []);
  return null;
}
