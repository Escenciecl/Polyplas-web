/**
 * Recorta los estilos heredados del tema + Elementor dejando solo las reglas que el sitio usa hoy.
 * Revisa TODAS las páginas armadas, los componentes y los scripts de los módulos, así que si mañana
 * un módulo nuevo usa una clase del tema, esa regla vuelve a incluirse sola en el siguiente build.
 *
 *   app/legacy/vendor.css, global-inline.css   (originales, no se tocan)
 *   → app/legacy/_generado/*.css               (lo que realmente se envía al navegador)
 *
 * Se ejecuta después de scripts/modulos.mjs ("prebuild" y "predev" en package.json).
 */
import fs from "node:fs";
import path from "node:path";
import { PurgeCSS } from "purgecss";

const SRC = "app/legacy";
const OUT = path.join(SRC, "_generado");
const files = ["vendor.css", "global-inline.css"];
fs.mkdirSync(OUT, { recursive: true });

const results = await new PurgeCSS().purge({
  content: [
    "content/_generado/html/*.html",
    "content/blog/*.md",
    "components/**/*.tsx",
    "app/**/*.tsx",
    "public/legacy/m/*.js",
  ],
  css: files.map((f) => path.join(SRC, f)),
  // clases que se ponen desde el código o según la página
  safelist: { standard: [/^pp-/, /^is-/, /^elementor-kit/, /^elementor-page/, "elementor-default"] },
  keyframes: false,
  variables: false,
  fontFace: false,
});

for (const r of results) {
  const name = path.basename(r.file);
  const antes = fs.statSync(r.file).size;
  fs.writeFileSync(path.join(OUT, name), r.css);
  console.log(`CSS: ${name} ${(antes / 1024).toFixed(0)} KB → ${(r.css.length / 1024).toFixed(0)} KB`);
}
