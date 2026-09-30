/** Datos estructurados (schema.org). Se envían tal cual en el HTML del servidor. */
export default function JsonLd({ data }: { data: string | object }) {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      // Evita que un "</script>" dentro del JSON cierre la etiqueta
      dangerouslySetInnerHTML={{ __html: json.replace(/<\/script/gi, "<\\/script") }}
    />
  );
}
