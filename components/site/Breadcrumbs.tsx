import Link from "next/link";

/** Migas de pan visibles (los datos para Google ya vienen en el JSON-LD de cada página). */
export default function Breadcrumbs({ items }: { items: { texto: string; enlace?: string }[] }) {
  return (
    <nav className="pp-container pp-crumbs" aria-label="Estás aquí">
      <ol>
        {items.map((it, i) => (
          <li key={i}>
            {it.enlace && i < items.length - 1 ? (
              <Link href={it.enlace}>{it.texto}</Link>
            ) : (
              <span aria-current="page">{it.texto}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
