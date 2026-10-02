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
fs.rmSync(path.join(ROOT, "public/legacy/h"), { recursive: true, force: true }); // respaldo de HTML (lo crea el build)
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
    // <script data-pp-inline>: se deja dentro del HTML para que corra apenas se lee la página
    // (solo para cosas mínimas que deben verse desde el primer pintado, como el aviso de cookies)
    if (/\bdata-pp-inline\b/i.test(attrs)) return full;
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

/**
 * Algunos módulos traen pegadas etiquetas de cabecera (<meta charset>, <meta viewport>, <title>).
 * Dentro del cuerpo de la página no sirven y dejan un segundo <title> que confunde a Google:
 * el título de cada página es el de su _pagina.json. Se quitan al compilar.
 * (Los <title> de los íconos SVG no se tocan: solo se quita el que viene junto a esos <meta>.)
 */
function stripHeadTags(html) {
  return html.replace(
    /(?:<meta\b[^>]*\b(?:charset|name=["']viewport["'])[^>]*>\s*)+(?:<title>[^<]*<\/title>\s*)?/gi,
    "",
  );
}

/* ───────────── Optimizaciones de velocidad (PageSpeed) ───────────── */

/**
 * Las tipografías ya están alojadas en el propio sitio (ver app/layout.tsx), así que los
 * `@import` / `<link>` a Google Fonts de los módulos solo frenan el primer pintado. Se quitan.
 */
function stripGoogleFonts(html) {
  return html
    .replace(/@import\s+url\(\s*['"]?https:\/\/fonts\.googleapis\.com[^)]*\)\s*;?/gi, "")
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.(googleapis|gstatic)\.com[^>]*>/gi, "");
}

/**
 * Font Awesome: en vez de descargar la hoja de estilos y la fuente completa desde un CDN externo
 * (bloquea el pintado ~1-2 s en móvil), cada <i class="fa-solid fa-xxx"></i> se reemplaza al
 * compilar por su SVG. Los módulos se siguen escribiendo igual que siempre.
 */
const FA_DIR = path.join(ROOT, "node_modules/@fortawesome/fontawesome-free");
const FA_STYLE = { "fa-solid": "solid", fas: "solid", fa: "solid", "fa-regular": "regular", far: "regular", "fa-brands": "brands", fab: "brands" };
let faAliases = null;
function faSvg(style, name) {
  let file = path.join(FA_DIR, "svgs", style, `${name}.svg`);
  if (!fs.existsSync(file)) {
    // nombres antiguos (ej. external-link-alt → up-right-from-square)
    if (!faAliases) {
      faAliases = {};
      const meta = JSON.parse(read(path.join(FA_DIR, "metadata/icon-families.json")));
      for (const [real, info] of Object.entries(meta)) for (const al of info.aliases?.names || []) faAliases[al] = real;
    }
    file = path.join(FA_DIR, "svgs", style, `${faAliases[name]}.svg`);
    if (!fs.existsSync(file)) return null;
  }
  return read(file).trim().replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}
/** Devuelve [html, quedanIconosSinResolver] */
function inlineFontAwesome(html) {
  let pendientes = false;
  const out = html.replace(/<i\b([^>]*\bclass=["']([^"']*)["'][^>]*)>\s*<\/i>/gi, (full, attrs, cls) => {
    const classes = cls.split(/\s+/);
    const styleCls = classes.find((c) => c in FA_STYLE);
    if (!styleCls) return full;
    const icon = classes.find((c) => c.startsWith("fa-") && !(c in FA_STYLE));
    const svg = icon && fs.existsSync(FA_DIR) ? faSvg(FA_STYLE[styleCls], icon.slice(3)) : null;
    if (!svg) {
      pendientes = true;
      return full;
    }
    const hidden = /aria-hidden/i.test(attrs) ? "" : ' aria-hidden="true"';
    return `<i${attrs.replace(/class=(["'])/i, "class=$1pp-fa ")}${hidden}>${svg}</i>`;
  });
  return [out, pendientes];
}
const isFontAwesomeCss = (href) => /font-?awesome/i.test(href);

/**
 * Fotos de las tarjetas de producto: en el celular se muestran chicas (90-210 px) pero el archivo
 * es de 1024 px. Si existen las versiones reducidas junto al original
 * (foto-320w.webp, foto-480w.webp, … según la lista RESPONSIVE) y su ancho real está anotado en
 * content/imagenes-anchos.json, se agrega `srcset` para que cada pantalla
 * descargue solo el tamaño que necesita. El `src` no cambia (el modal sigue usando la foto grande).
 * Para una foto nueva sin versiones reducidas simplemente se usa la original.
 */
// [clase de la imagen, anchos de las versiones reducidas, tamaño con que se muestra]
const RESPONSIVE = [
  ["pp-product-card-img", [320, 480, 640], "(max-width: 600px) 160px, (max-width: 900px) 210px, 280px"],
  ["pp-slide", [480, 720], "(max-width: 767px) 92vw, 390px"],
];
function responsiveCards(html) {
  for (const [cls, widths, sizes] of RESPONSIVE) {
    const re = new RegExp(`<img\\b[^>]*\\bclass="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, "gi");
    html = html.replace(re, (tag) => {
      if (/\bsrcset=/i.test(tag)) return tag;
      const src = tag.match(/\bsrc="(\/wp-content\/[^"]+)\.(webp|jpe?g|png)"/i);
      if (!src) return tag;
      const set = widths
        .filter((w) => fs.existsSync(path.join(ROOT, "public", `${src[1]}-${w}w.webp`)))
        .map((w) => `${src[1]}-${w}w.webp ${w}w`);
      if (!set.length) return tag;
      const full = fullWidth(`${src[1]}.${src[2]}`);
      if (full) set.push(`${src[1]}.${src[2]} ${full}w`);
      return tag.replace(/<img\b/i, `<img srcset="${set.join(", ")}" sizes="${sizes}"`);
    });
  }
  return html;
}
/** Ancho real de la foto original (lo anota scripts al crear las versiones reducidas) */
const ANCHOS = fs.existsSync(path.join(ROOT, "content/imagenes-anchos.json"))
  ? JSON.parse(read(path.join(ROOT, "content/imagenes-anchos.json")))
  : {};
function fullWidth(src) {
  return ANCHOS[src] || null;
}

function moduleFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

/** Lee un módulo; si empieza con un <title> suelto (propio de una página completa), lo quita */
const readModule = (f) => read(f).replace(/^\s*<title>[^<]*<\/title>\s*/i, "");

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
    return readModule(f);
  });
  // Módulos nuevos que no estaban en el esqueleto: van al final, en orden
  const nuevos = files.filter((f) => !used.has(f));
  if (nuevos.length) {
    html += nuevos
      .map((f) => `\n<div class="pp-modulo" data-modulo="${f}">\n${readModule(path.join(dir, f))}\n</div>`)
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
  const [rawHtml, scripts] = extractScripts(assemble(dir));
  const [html, faPendiente] = inlineFontAwesome(responsiveCards(stripGoogleFonts(stripHeadTags(rawHtml))));
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
    // La hoja de Font Awesome del CDN solo se mantiene si quedó algún ícono sin convertir a SVG
    css: (cfg.css || []).filter((href) => faPendiente || !isFontAwesomeCss(href)),
    h1,
  };
}

fs.writeFileSync(path.join(GEN, "pages.json"), JSON.stringify(pages, null, 1));
fs.writeFileSync(path.join(GEN, "site.json"), JSON.stringify(site, null, 1));
console.log(`Módulos: ${count} archivos → ${Object.keys(pages).length} páginas armadas.`);
