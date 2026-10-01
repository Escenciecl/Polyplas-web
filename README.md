# Polyplas: sitio en Next.js

Migración de **polyplas.cl** desde WordPress + Elementor a **Next.js 15 (App Router, React 19)**.
Todas las páginas se generan como HTML estático en el build: más rápido, sin base de datos y sin plugins.
Se publica **gratis** en **Cloudflare Pages** (plan Free, permite uso comercial).

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # genera la carpeta out/ (sitio estático) + _redirects y _headers
npm start          # sirve out/ localmente
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
  modulos/                UNA CARPETA POR PÁGINA, un archivo .html por módulo (ver LEEME.md)
  sitio.json              Google Tag Manager y datos del negocio para Google
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
4. Haz commit y push: Cloudflare Pages publica solo. El artículo aparece en `/blog/` y en el `sitemap.xml`.

## Editar una página existente

Todo el contenido está en **`content/modulos/`**: una carpeta por página y un archivo por módulo
(ver `content/modulos/LEEME.md`). El título y la descripción para Google están en `_pagina.json`
de cada carpeta. `scripts/modulos.mjs` arma las páginas en cada build.

## Cloudflare Pages (configuración)

| Campo | Valor |
|---|---|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Variable de entorno | `NODE_VERSION` = `22` |

- `public/_redirects` y `public/_headers` se generan solos en cada build (`scripts/cloudflare.mjs`).
  Para agregar una redirección, edita `content/redirects.json`.
- La URL técnica `*.pages.dev` envía `noindex`, así Google solo indexa `polyplas.cl`.

## Checklist de lanzamiento (sin perder SEO)

1. **Antes de cambiar el DNS**: revisar la URL `*.pages.dev`
   (formularios, carrito, chat, cotizadores de cada categoría).
2. En Cloudflare Pages → Custom domains: agregar `polyplas.cl` y `www.polyplas.cl`.
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

## Pagos Webpay Plus y correos (Cloudflare Pages Functions)

Reemplazan el código que estaba en `functions.php` de WordPress, en **las mismas direcciones**:

- `functions/wp-json/polyplas/v1/webpay-init.js`: crea la transacción en Transbank.
- `functions/wp-json/polyplas/v1/webpay-return.js`: confirma el pago, envía el comprobante
  (cliente + ventas@polyplas.cl) y registra el pedido en Supabase; redirige a `/gracias/`.
- `functions/_lib/webpay.js`: plantilla del correo, Supabase y helpers.

Configuración en Cloudflare Pages → Settings:

| Tipo | Nombre | Valor |
|---|---|---|
| Texto | `TBK_COMMERCE_CODE` | código de comercio Webpay Plus |
| **Secreto** | `TBK_SECRET` | llave secreta de Transbank (la ingresa la dueña) |
| **Secreto** | `RESEND_API_KEY` | API key de resend.com (correos, plan gratis) |
| KV binding | `ORDERS` | namespace `polyplas-orders` |

> **Nota de seguridad:** el monto a cobrar lo calcula el navegador (igual que en WordPress).
> Si el total pagado no calza con la suma de productos, el correo a ventas llega con un aviso
> rojo "REVISAR ANTES DE DESPACHAR". Mejora pendiente: validar precios en el servidor.
