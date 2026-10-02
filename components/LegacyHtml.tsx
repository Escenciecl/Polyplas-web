import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import LegacyHtmlClient from "./LegacyHtmlClient";

/**
 * Renderiza en el servidor el HTML que venía de Elementor.
 * Todo el contenido queda dentro del HTML inicial (lo que Google lee), sin depender de JavaScript.
 *
 * Velocidad: antes este HTML viajaba DOS veces en cada página (una como HTML y otra dentro de los
 * datos internos de Next.js). Ahora viaja una sola vez: el componente del navegador recibe solo una
 * clave corta y conserva el HTML que ya llegó del servidor. Como plan B (si el navegador tuviera que
 * volver a dibujar la página) el mismo HTML queda guardado en /legacy/h/<clave>.txt.
 */
const store = ((globalThis as { __ppLegacyHtml?: Map<string, string> }).__ppLegacyHtml ??= new Map<string, string>());
const BACKUP_DIR = path.join(process.cwd(), "public/legacy/h");

export default function LegacyHtml({ html, id }: { html: string; id?: string }) {
  const k = crypto.createHash("md5").update(html).digest("hex").slice(0, 12);
  if (!store.has(k)) {
    store.set(k, html);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(path.join(BACKUP_DIR, `${k}.txt`), html);
  }
  return <LegacyHtmlClient key={k} k={k} id={id} />;
}
