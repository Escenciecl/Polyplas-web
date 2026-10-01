# Módulos del sitio Polyplas

Cada carpeta es **una página** y cada archivo `.html` es **un módulo** de esa página
(lo mismo que pegabas en un widget HTML de Elementor: HTML + `<style>` + `<script>`).
Los módulos se muestran en orden según el número del nombre (01, 02, 03…).

| Carpeta | Página |
|---|---|
| `00-cabecera` | Logo, buscador y menú (todas las páginas) |
| `00-pie-de-pagina` | Pie de página (todas las páginas) |
| `00-flotantes` | Chat de Maca, "Cómo comprar online", cookies y carrito (todas las páginas) |
| `01-inicio` | polyplas.cl |
| `02-nosotros` | /nosotros/ |
| `03-contacto` | /contacto/ |
| `04-planchas-acrilico` … `10-tinas` | Categorías de productos |
| `11-guia-acrilicos`, `12-guia-tinas` | Guías |
| `13-blog` | /blog/ (el listado de artículos se arma solo) |
| `20-articulo-…` | Cada artículo del blog |
| `30-gracias` | Página después de pagar |
| `31-…`, `32-…` | Políticas |
| `99-pagina-404` | Página "no encontrada" |

## Cambiar un módulo

1. En GitHub entra a la carpeta de la página.
2. **Add file → Upload files** y arrastra tu archivo **con el mismo nombre** del que quieres reemplazar.
3. **Commit changes**. En ~2 minutos está publicado en el sitio.

También puedes abrir el archivo, presionar el lápiz ✏️ y editar el texto directamente.

## Agregar un módulo nuevo

Sube un archivo nuevo con un número, por ejemplo `09-promocion-verano.html`. Aparece al final de la página.

## Quitar un módulo

Abre el archivo y usa el menú **⋯ → Delete file**.

## Título y descripción para Google

Están en `_pagina.json` de cada carpeta: `"titulo"` y `"descripcion"`.
Cambia solo el texto entre comillas.

## No tocar

- `_estructura.html`: es el armazón de Elementor que ordena los módulos.
- No cambies `"url"` en `_pagina.json`: cambiaría la dirección de la página y se perdería posicionamiento en Google.
