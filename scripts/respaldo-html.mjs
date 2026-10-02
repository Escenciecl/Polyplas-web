/**
 * Después del build: asegura que el respaldo del HTML de cada página (public/legacy/h/*.txt,
 * creado por components/LegacyHtml.tsx mientras se generan las páginas) quede dentro de `out/`.
 */
import fs from "node:fs";
const SRC = "public/legacy/h";
const DST = "out/legacy/h";
if (fs.existsSync(SRC) && fs.existsSync("out")) {
  fs.mkdirSync(DST, { recursive: true });
  const files = fs.readdirSync(SRC);
  for (const f of files) fs.copyFileSync(`${SRC}/${f}`, `${DST}/${f}`);
  console.log(`Respaldo HTML: ${files.length} archivos en ${DST}`);
}
