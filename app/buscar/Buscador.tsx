"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Mismas reglas que el buscador del header del sitio actual
const DESTINOS = {
  policarbonato: "/categoria-producto/policarbonato-compacto/",
  petg: "/categoria-producto/planchas-petg/",
  pet: "/categoria-producto/planchas-pet/",
  cupulas: "/categoria-producto/cupulas/",
  receptaculos: "/categoria-producto/receptaculos/",
  cascos: "/categoria-producto/cascos-de-tinas/",
  tinas: "/categoria-producto/tinas-de-hidromasaje/",
  acrilico: "/categoria-producto/planchas-acrilico/",
} as const;

const REGLAS: { destino: keyof typeof DESTINOS; keys: string[] }[] = [
  { destino: "policarbonato", keys: ["policarbonato"] },
  { destino: "petg", keys: ["petg"] },
  { destino: "pet", keys: ["pet"] },
  { destino: "cupulas", keys: ["cupula", "domo", "claraboya", "cubierta de techo"] },
  { destino: "receptaculos", keys: ["receptaculo", "plato de ducha", "mampara", "base de ducha"] },
  { destino: "cascos", keys: ["casco"] },
  { destino: "tinas", keys: ["tina", "hidromasaje", "jacuzzi", "jacuzzy", "jacuzy", "spa", "banera"] },
  { destino: "acrilico", keys: ["acrilic", "plancha", "lamina", "pmma", "plexiglas", "metacrilato"] },
];

const SUGERENCIAS = [
  { label: "Planchas de Acrílico", url: DESTINOS.acrilico },
  { label: "Cúpulas de Acrílico", url: DESTINOS.cupulas },
  { label: "Tinas de Hidromasaje", url: DESTINOS.tinas },
  { label: "Cascos de Tinas", url: DESTINOS.cascos },
  { label: "Receptáculos de Ducha", url: DESTINOS.receptaculos },
  { label: "Policarbonato Compacto", url: DESTINOS.policarbonato },
  { label: "Planchas PET", url: DESTINOS.pet },
  { label: "Planchas PETG", url: DESTINOS.petg },
  { label: "Guía de Acrílicos", url: "/guia-de-acrilicos/" },
  { label: "Guía para comprar tu Tina", url: "/guia-para-comprar-tina-de-hidromasaje-en-chile/" },
  { label: "Blog", url: "/blog/" },
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

function resolver(q: string): string | null {
  const n = norm(q);
  if (!n) return null;
  for (const r of REGLAS) if (r.keys.some((k) => n.includes(k))) return DESTINOS[r.destino];
  return null;
}

export default function Buscador() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("s") ?? "";
  const destino = resolver(q);

  useEffect(() => {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    if (q) w.dataLayer.push({ event: "busqueda_interna", search_term: norm(q), search_destino: destino, search_match: destino ? "si" : "no" });
    if (destino) router.replace(destino);
  }, [q, destino, router]);

  return (
    <section className="pp-buscar">
      <h1>{q ? `Resultados para “${q}”` : "Buscar productos"}</h1>
      <form action="/buscar/" method="get" role="search">
        <input type="search" name="s" defaultValue={q} placeholder="¿Qué estás buscando?" aria-label="Buscar" />
        <button type="submit">Buscar</button>
      </form>
      {destino ? (
        <p>Te estamos llevando a la categoría…</p>
      ) : (
        <>
          <p>{q ? "No encontramos una coincidencia exacta. Revisa nuestras categorías:" : "Categorías y guías:"}</p>
          <ul>
            {SUGERENCIAS.map((s) => (
              <li key={s.url}>
                <a href={s.url}>{s.label}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
