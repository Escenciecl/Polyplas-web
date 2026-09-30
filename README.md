# Polyplas: sitio en Next.js

Migración de **polyplas.cl** desde WordPress + Elementor a **Next.js 15 (App Router, React 19)**.
Todas las páginas se generan como HTML estático en el build: más rápido, sin base de datos y sin plugins.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # versión de producción local
```

## Estructura

```
app/
  layout.tsx              Header, footer, widgets globales (chat, carrito, cookies), fuentes, GTM
  [[...slug]]/page.tsx    Todas las páginas del sitio, con las mismas URLs que WordPress
  buscar/                 Reemplaza la búsqueda de WordPress (/?s=)
  not-found.tsx           Página 404
  sitemap.ts, robots.ts   sitemap.xml y robots.txt automáticos
  legacy/*.css            Estilos del tema y de Elementor (limpiados)
components/               LegacyHtml, LegacyScripts, BlogList, JsonLd
content/
  pages.json              Título, descripción, canonical, schema y scripts de cada URL
  html/*.html             Contenido de cada página (lo que se diseñó en Elementor)
  blog/*.md               Artículos nuevos del blog (Markdown)
  redirects.json          Redirecciones 301 de URLs antiguas
lib/                      Lectura de contenido, metadatos SEO, orden de scripts
public/
  wp-content/uploads/     Imágenes, en las MISMAS rutas que en WordPress (no se pierde Google Imágenes)
  legacy/js/              Scripts propios del sitio (chat Supabase, carrito, cotizadores, menú…)
```

## Publicar un artículo nuevo en el blog

1. Copia `content/blog/_plantilla.md` a `content/blog/mi-articulo.md` (sin el `_`).
2. Completa `title`, `description`, `date` e `image`, y escribe el texto.
3. Sube la imagen a `public/wp-content/uploads/...` (o a `public/blog/`).
4. Haz commit y push: Vercel publica solo. El artículo aparece en `/blog/` y en el `sitemap.xml`.

## Editar una página existente

El contenido está en `content/html/<página>.html` y los metadatos (title, description) en
`content/pages.json`. Para mejoras puntuales de títulos existe `META_OVERRIDES` en `lib/content.ts`.

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | el código de `google-site-verification` actual (opcional si Search Console ya está verificado por DNS) |
| `NEXT_PUBLIC_NOINDEX` | `1` solo en un entorno de pruebas con dominio propio |

En los *previews* de Vercel el `robots.txt` bloquea todo automáticamente; solo producción es indexable.

## Checklist de lanzamiento (sin perder SEO)

1. **Antes de cambiar el DNS**: desplegar en Vercel y revisar la URL `*.vercel.app`
   (formularios, carrito, chat, cotizadores de cada categoría).
2. En Vercel → Domains: agregar `polyplas.cl` y `www.polyplas.cl` (www redirige a la raíz).
3. Cambiar DNS al horario de menos tráfico. **Mantener WordPress** en un subdominio
   (ej. `antiguo.polyplas.cl`, con `noindex`) al menos 1 mes como respaldo.
4. En Google Search Console: enviar `https://polyplas.cl/sitemap.xml` y usar
   *Inspección de URLs* en la home y las 7 categorías.
5. Revisar diariamente durante 4–6 semanas: *Páginas → No indexadas* (404) y *Rendimiento*.
6. Web3Forms / Formspree / Google Apps Script / Supabase: si alguno restringe dominios
   de origen, verificar que `polyplas.cl` siga permitido (no cambia, pero confírmalo).

## Qué se mejoró respecto a WordPress

- Sitemap solo con URLs reales (antes tenía 51 URLs que redirigían).
- Un único H1 en todas las páginas (10 páginas no tenían).
- Menú "Cúpulas" apuntaba a una categoría vacía; enlaces internos rotos corregidos.
- Redirecciones 301 directas para productos y etiquetas antiguas (sin cadenas).
- Sin jQuery, WooCommerce, Elementor JS ni 50+ scripts del tema: carga mucho más liviana.
- Títulos mejorados en Nosotros, Contacto y políticas.
- Imágenes y fuentes con caché de 1 año.
