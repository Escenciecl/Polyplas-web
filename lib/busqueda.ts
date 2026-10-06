/** Reglas del buscador (mismas que tenía el sitio en WordPress). */
export const DESTINOS = {
  policarbonato: "/categoria-producto/policarbonato-compacto/",
  petg: "/categoria-producto/planchas-petg/",
  pet: "/categoria-producto/planchas-pet/",
  cupulas: "/categoria-producto/cupulas/",
  receptaculos: "/categoria-producto/receptaculos/",
  cascos: "/categoria-producto/cascos-de-tinas/",
  tinas: "/categoria-producto/tinas-de-hidromasaje/",
  acrilico: "/categoria-producto/planchas-acrilico/",
} as const;

export const REGLAS: { destino: keyof typeof DESTINOS; keys: string[] }[] = [
  { destino: "policarbonato", keys: ["policarbonato"] },
  { destino: "petg", keys: ["petg"] },
  { destino: "pet", keys: ["pet"] },
  { destino: "cupulas", keys: ["cupula", "domo", "claraboya", "lucarna", "cubierta de techo"] },
  { destino: "receptaculos", keys: ["receptaculo", "plato de ducha", "mampara", "base de ducha"] },
  { destino: "cascos", keys: ["casco"] },
  { destino: "tinas", keys: ["tina", "hidromasaje", "jacuzzi", "jacuzzy", "jacuzy", "spa", "banera"] },
  { destino: "acrilico", keys: ["acrilic", "plancha", "lamina", "pmma", "plexiglas", "metacrilato"] },
];

export const SUGERENCIAS = [
  { label: "Planchas de acrílico", url: DESTINOS.acrilico, tag: "Categoría" },
  { label: "Cúpulas de acrílico", url: DESTINOS.cupulas, tag: "Categoría" },
  { label: "Tinas de hidromasaje", url: DESTINOS.tinas, tag: "Categoría" },
  { label: "Cascos de tinas", url: DESTINOS.cascos, tag: "Categoría" },
  { label: "Receptáculos de ducha", url: DESTINOS.receptaculos, tag: "Categoría" },
  { label: "Policarbonato compacto", url: DESTINOS.policarbonato, tag: "Categoría" },
  { label: "Planchas PET", url: DESTINOS.pet, tag: "Categoría" },
  { label: "Planchas PETG", url: DESTINOS.petg, tag: "Categoría" },
  { label: "Guía de acrílicos", url: "/guia-de-acrilicos/", tag: "Guía" },
  { label: "Guía para comprar tu tina", url: "/guia-para-comprar-tina-de-hidromasaje-en-chile/", tag: "Guía" },
  { label: "Blog técnico", url: "/blog/", tag: "Blog" },
];

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

export function resolver(q: string): string | null {
  const n = norm(q);
  if (!n) return null;
  for (const r of REGLAS) if (r.keys.some((k) => n.includes(k))) return DESTINOS[r.destino];
  return null;
}

export function sugerir(q: string) {
  const n = norm(q);
  if (!n) return SUGERENCIAS;
  const porTexto = SUGERENCIAS.filter((s) => norm(s.label).includes(n));
  const destino = resolver(q);
  const extra = destino ? SUGERENCIAS.filter((s) => s.url === destino && !porTexto.includes(s)) : [];
  const out = [...extra, ...porTexto];
  return out.length ? out : SUGERENCIAS;
}
