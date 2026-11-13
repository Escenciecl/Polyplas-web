/**
 * Despacho en Santiago por zonas (aprobado por gerencia el 13-nov-2026).
 *
 * Mismas reglas que window.PP_ENTREGA en content/modulos/00-flotantes/04-carrito-y-pago.html.
 * Si se cambia algo aquí, hay que cambiarlo también allá (y al revés).
 *
 *  - Zona 1 (dentro de Américo Vespucio): $19.000
 *  - Zona 2 (fuera de Vespucio):          $30.000
 *  - Despacho gratis en ambas zonas desde $200.000 en productos.
 *  - Comunas que no están en ninguna zona: sin despacho (retiro en tienda o flete propio).
 */

export const UMBRAL_DESPACHO_GRATIS = 200000;

export const ZONAS_DESPACHO = [
  {
    id: 1,
    precio: 19000,
    comunas: [
      "Santiago", "Estación Central", "Independencia", "Recoleta", "Quinta Normal", "Providencia",
      "Ñuñoa", "Las Condes", "Vitacura", "La Reina", "Peñalolén", "Macul", "Conchalí", "Huechuraba",
      "Renca", "Lo Prado", "Cerro Navia", "Pudahuel", "Maipú", "Cerrillos", "San Miguel", "San Joaquín",
      "Pedro Aguirre Cerda", "Lo Espejo", "La Cisterna", "San Ramón", "La Granja", "El Bosque", "La Florida",
    ],
  },
  {
    id: 2,
    precio: 30000,
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
