/**
 * Genera los archivos de configuración de Cloudflare Pages antes de cada build:
 *  - public/_redirects : redirecciones 301 de URLs antiguas de WordPress
 *  - public/_headers   : caché de imágenes/scripts y noindex en *.pages.dev
 * Se ejecuta solo con `npm run build` (script "prebuild" en package.json).
 */
import fs from "node:fs";

const map = JSON.parse(fs.readFileSync("content/redirects.json", "utf8"));

// 1) Redirecciones exactas (productos, etiquetas, categorías vacías, enlaces rotos)
const exact = map.map((r) => `${r.source} ${r.destination} 301`);

// 2) Reglas genéricas para restos de WordPress
const generic = [
  "/feed/ /blog/ 301",
  "/feed /blog/ 301",
  "/comments/feed/ /blog/ 301",
  "/categoria-producto/:slug/feed/ /categoria-producto/:slug/ 301",
  "/author/* /nosotros/ 301",
  "/category/* /blog/ 301",
  "/tienda/ / 301",
  "/carrito/ / 301",
  "/finalizar-compra/ / 301",
  "/mi-cuenta/ /contacto/ 301",
  "/producto/* / 301",
  // paginación y etiquetas antiguas de WordPress
  "/blog/page/* /blog/ 301",
  "/page/* / 301",
  "/categoria-producto/:slug/page/* /categoria-producto/:slug/ 301",
  "/tag/* /blog/ 301",
  "/sitemap.rss /sitemap.xml 301",
  "/etiqueta-producto/* / 301",
  "/:slug/feed/ /:slug/ 301",
  // accesos antiguos a cPanel y correo (ahora en sus subdominios)
  "/webmail https://webmail.polyplas.cl/ 302",
  "/webmail/* https://webmail.polyplas.cl/ 302",
  "/cpanel https://cpanel.polyplas.cl/ 302",
  "/cpanel/* https://cpanel.polyplas.cl/ 302",
  "/whm https://whm.polyplas.cl/ 302",
  "/wp-admin https://cpanel.polyplas.cl/ 302",
  "/wp-admin/* https://cpanel.polyplas.cl/ 302",
  "/wp-login.php https://cpanel.polyplas.cl/ 302",
  // sitemaps antiguos de AIOSEO / WordPress -> sitemap nuevo
  "/sitemap_index.xml /sitemap.xml 301",
  "/post-sitemap.xml /sitemap.xml 301",
  "/page-sitemap.xml /sitemap.xml 301",
  "/product-sitemap.xml /sitemap.xml 301",
  "/category-sitemap.xml /sitemap.xml 301",
  "/product_cat-sitemap.xml /sitemap.xml 301",
  "/product_tag-sitemap.xml /sitemap.xml 301",
  "/wp-sitemap.xml /sitemap.xml 301",
];

fs.writeFileSync(
  "public/_redirects",
  ["# Generado por scripts/cloudflare.mjs — no editar a mano", ...exact, ...generic, ""].join("\n"),
);

// Cabeceras
const headers = `# Generado por scripts/cloudflare.mjs — no editar a mano
# La URL técnica *.pages.dev nunca debe aparecer en Google (evita contenido duplicado)
https://:project.pages.dev/*
  X-Robots-Tag: noindex

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/wp-content/uploads/*
  Cache-Control: public, max-age=31536000, immutable

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Scripts de los módulos: el nombre incluye un hash del contenido, así que pueden cachearse un año
/legacy/m/*
  Cache-Control: public, max-age=31536000, immutable

# Copia de respaldo del HTML de cada página (la usa el propio sitio; no debe aparecer en Google)
/legacy/h/*
  X-Robots-Tag: noindex
  Cache-Control: public, max-age=31536000, immutable

/legacy/shim.js
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/legacy/gtm.js
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
`;
fs.writeFileSync("public/_headers", headers);

console.log(`Cloudflare: ${exact.length + generic.length} redirecciones y cabeceras generadas.`);
