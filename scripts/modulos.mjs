/**
 * Arma el sitio a partir de los módulos de content/modulos/.
 *
 *   content/modulos/
 *     01-inicio/
 *       _pagina.json       URL, título y descripción para Google, datos estructurados
 *       _estructura.html   esqueleto de Elementor con <!--MODULO:archivo--> (no hace falta tocarlo)
 *       01-buscador.html   ← módulos: HTML + <style> + <script>, igual que en Elementor
 *       02-menu.html
 *       ...
 *
 * - Reemplazar un módulo: subir un archivo con el MISMO nombre.
 * - Agregar un módulo nuevo: subir un archivo nuevo (ej. 09-promocion.html); aparece al final de la página.
 * - Quitar un módulo: borrar el archivo.
 *
 * Genera (no se editan a mano, están en .gitignore):
 *   content/_generado/html/*.html, content/_generado/pages.json, content/_generado/site.json
 *   public/legacy/m/*.js  (los <script> separados para que la página cargue más rápido)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const MOD = path.join(ROOT, "content/modulos");
const GEN = path.join(ROOT, "content/_generado");
const JS_DIR = path.join(ROOT, "public/legacy/m");

fs.rmSync(GEN, { recursive: true, force: true });
fs.rmSync(JS_DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(GEN, "html"), { recursive: true });
fs.mkdirSync(JS_DIR, { recursive: true });

const ORIGIN = "https://polyplas.cl";
const read = (p) => fs.readFileSync(p, "utf8");

function saveJs(code) {
  const body = code.trim().replaceAll(`${ORIGIN}/wp-content/`, "/wp-content/");
  const h = crypto.createHash("md5").update(body).digest("hex").slice(0, 10);
  const file = path.join(JS_DIR, `${h}.js`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, body + "\n");
  return `/legacy/m/${h}.js`;
}

/** Saca los <script> ejecutables (deja los de datos para Google) y devuelve [html, scripts] */
function extractScripts(html) {
  const scripts = [];
  const out = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (full, attrs, code) => {
    if (/type\s*=\s*["']?application\/ld\+json/i.test(attrs)) return full;
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (src) {
      scripts.push(src[1].replace(ORIGIN, ""));
      return "";
    }
    if (code.trim()) scripts.push(saveJs(code));
    return "";
  });
  return [out, scripts];
}

function moduleFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

/** Une el esqueleto con los módulos de la carpeta */
function assemble(dir) {
  const files = moduleFiles(dir);
  const estructuraPath = path.join(dir, "_estructura.html");
  let html = fs.existsSync(estructuraPath) ? read(estructuraPath) : "";
  const used = new Set();
  html = html.replace(/<!--MODULO:([^>]+?)-->/g, (_, name) => {
    const f = path.join(dir, name.trim());
    if (!fs.existsSync(f)) return ""; // módulo borrado
    used.add(name.trim());
    return read(f);
  });
  // Módulos nuevos que no estaban en el esqueleto: van al final, en orden
  const nuevos = files.filter((f) => !used.has(f));
  if (nuevos.length) {
    html += nuevos
      .map((f) => `\n<div class="pp-modulo" data-modulo="${f}">\n${read(path.join(dir, f))}\n</div>`)
      .join("");
  }
  return html;
}

const keyFor = (url) =>
  url === "/" ? "home" : url === "/esta-pagina-no-existe-404/" ? "404" : url.replace(/^\/|\/$/g, "").replace(/\//g, "__");

const sitio = JSON.parse(read(path.join(ROOT, "content/sitio.json")));
const site = {
  gtmId: sitio.gtmId,
  headScripts: [saveJs(sitio.gtm4wpScript)],
  bodyScripts: [],
  headerScripts: [],
  footerScripts: [],
  businessJsonLd: sitio.datosGoogleNegocio,
};
const pages = {};
let count = 0;

for (const folder of fs.readdirSync(MOD).sort()) {
  const dir = path.join(MOD, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  const cfgPath = path.join(dir, "_pagina.json");
  if (!fs.existsSync(cfgPath)) {
    console.warn(`[modulos] ${folder}: falta _pagina.json, se omite`);
    continue;
  }
  const cfg = JSON.parse(read(cfgPath));
  const [html, scripts] = extractScripts(assemble(dir));
  count += moduleFiles(dir).length;

  if (cfg.global) {
    const target = { cabecera: "_header", pie: "_footer", flotantes: "_widgets" }[cfg.global];
    fs.writeFileSync(path.join(GEN, "html", `${target}.html`), html);
    if (cfg.global === "cabecera") site.headerScripts = scripts;
    if (cfg.global === "pie") site.footerScripts = scripts;
    if (cfg.global === "flotantes") site.bodyScripts = scripts;
    continue;
  }

  const key = keyFor(cfg.url);
  fs.writeFileSync(path.join(GEN, "html", `${key}.html`), html);
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
  if (h1.length !== 1) console.warn(`[modulos] ${folder}: tiene ${h1.length} títulos H1 (lo ideal para Google es 1)`);
  pages[cfg.url] = {
    key,
    folder,
    type: cfg.tipo,
    meta: {
      title: cfg.titulo,
      description: cfg.descripcion,
      robots: cfg.robots,
      canonical: cfg.canonical,
      og: cfg.og || {},
      published: cfg.publicado,
      modified: cfg.modificado,
    },
    jsonLd: cfg.datosGoogle || [],
    dataLayer: cfg.dataLayer ? saveJs(cfg.dataLayer) : null,
    scripts,
    css: cfg.css || [],
    h1,
  };
}

fs.writeFileSync(path.join(GEN, "pages.json"), JSON.stringify(pages, null, 1));
fs.writeFileSync(path.join(GEN, "site.json"), JSON.stringify(site, null, 1));
console.log(`Módulos: ${count} archivos → ${Object.keys(pages).length} páginas armadas.`);
