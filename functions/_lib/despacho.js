/**
 * Despacho en Santiago por zonas (aprobado por gerencia el 13-nov-2026).
 *
 * Los montos y el prendido/apagado se administran en el CRM, sección "Despachos", y quedan en
 * pp_stock como filas de configuración (color y espesor 'na'):
 *   DESPACHO|zona1   precio = tarifa Zona 1 (dentro de Américo Vespucio)   cantidad 0 = apagado
 *   DESPACHO|zona2   precio = tarifa Zona 2 (fuera de Vespucio)            cantidad 0 = apagado
 *   DESPACHO|gratis  precio = monto mínimo del despacho gratis (Zona 1 y 2) cantidad 0 = apagado
 * Las comunas de cada zona están aquí y en window.PP_ENTREGA del carrito
 * (content/modulos/00-flotantes/04-carrito-y-pago.html): si se cambia una, cambiar la otra.
 * Comunas fuera de las zonas: sin despacho (retiro en tienda o flete propio).
 */

/** Respaldo si una fila no existe en el CRM (= lo publicado el 13-nov: solo despacho gratis desde $200.000). */
export const CONFIG_RESPALDO = {
  gratis: { activo: true, desde: 200000 },
  zonas: { 1: { activo: false, precio: 19000 }, 2: { activo: false, precio: 30000 } },
};

/**
 * Configuración vigente a partir de las filas del CRM.
 * @param {(clave: string) => ({ cantidad?: number|null, precio?: number|null } | null | undefined)} fila
 */
export function configDespacho(fila) {
  const leer = (clave, resp) => {
    const f = fila ? fila(clave) : null;
    if (!f) return { ...resp };
    const precio = Math.round(Number(f.precio) || 0);
    return { activo: Number(f.cantidad) !== 0, [resp.desde !== undefined ? "desde" : "precio"]: precio > 0 ? precio : (resp.desde ?? resp.precio) };
  };
  return {
    gratis: leer("DESPACHO|gratis", CONFIG_RESPALDO.gratis),
    zonas: { 1: leer("DESPACHO|zona1", CONFIG_RESPALDO.zonas[1]), 2: leer("DESPACHO|zona2", CONFIG_RESPALDO.zonas[2]) },
  };
}

export const ZONAS_DESPACHO = [
  {
    id: 1,
    comunas: [
      "Santiago", "Estación Central", "Independencia", "Recoleta", "Quinta Normal", "Providencia",
      "Ñuñoa", "Las Condes", "Vitacura", "La Reina", "Peñalolén", "Macul", "Conchalí", "Huechuraba",
      "Renca", "Lo Prado", "Cerro Navia", "Pudahuel", "Maipú", "Cerrillos", "San Miguel", "San Joaquín",
      "Pedro Aguirre Cerda", "Lo Espejo", "La Cisterna", "San Ramón", "La Granja", "El Bosque", "La Florida",
    ],
  },
  {
    id: 2,
    comunas: ["Puente Alto", "La Pintana", "San Bernardo", "Padre Hurtado", "Quilicura", "Lo Barnechea", "Lampa", "Colina"],
  },
];

const norm = (s) => String(s || "").trim().toLowerCase();

/** Zona de despacho de una comuna de la RM, o null si no tiene despacho. */
export function zonaDespacho(comuna) {
  const c = norm(comuna);
  if (!c) return null;
  return ZONAS_DESPACHO.find((z) => z.comunas.some((x) => norm(x) === c)) || null;
}

/* ── Medición ──────────────────────────────────────────────
 * El despacho viaja como línea DESPACHO en los ítems del pedido (para cobrarlo y verificarlo).
 * En GA4 / Google Ads la compra se informa con el valor de los productos y el despacho aparte
 * (parámetro estándar `shipping`), igual que antes del despacho pagado. */
// Sirve para ítems del pedido (sku) y para ítems ya convertidos a GA4 (item_id)
export const esDespacho = (it) => !!it && (it.sku === "DESPACHO" || it.item_id === "DESPACHO");
export function montoDespacho(items) {
  return (Array.isArray(items) ? items : []).filter(esDespacho)
    .reduce((s, it) => s + Math.round(Number(it.precio_unit) || 0) * Math.max(1, Math.trunc(Number(it.qty) || 1)), 0);
}
export const sinDespacho = (items) => (Array.isArray(items) ? items : []).filter((it) => !esDespacho(it));
