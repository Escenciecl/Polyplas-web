"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Mismas reglas y sugerencias que el buscador del header (lib/busqueda.ts)
import { norm, resolver, SUGERENCIAS } from "@/lib/busqueda";

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
