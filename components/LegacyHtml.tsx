/**
 * Renderiza en el servidor el HTML que venía de Elementor.
 * Todo el contenido queda dentro del HTML inicial (lo que Google lee), sin depender de JavaScript.
 * `display: contents` evita que este contenedor altere el diseño original.
 */
export default function LegacyHtml({ html, id }: { html: string; id?: string }) {
  return <div id={id} style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}
