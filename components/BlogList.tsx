import type { BlogCard } from "@/lib/content";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Listado del blog (antes era el widget "Posts" de Elementor Pro).
 * Usa las mismas clases CSS para verse igual, pero se genera solo con cada artículo nuevo.
 * Se devuelve como HTML porque va insertado dentro del HTML heredado de Elementor.
 */
export function blogListHtml(cards: BlogCard[]): string {
  const items = cards
    .map((c) => {
      const img = c.image
        ? `<a class="elementor-post__thumbnail__link" href="${esc(c.path)}" tabindex="-1"><div class="elementor-post__thumbnail"><img src="${esc(c.image)}"${
            c.srcset ? ` srcset="${esc(c.srcset)}"` : ""
          } sizes="(max-width: 767px) 100vw, 360px" alt="${esc(c.alt)}" width="300" height="300" loading="lazy" decoding="async"></div></a>`
        : "";
      return `<article class="elementor-post elementor-grid-item post type-post has-post-thumbnail" role="listitem"><div class="elementor-post__card">${img}<div class="elementor-post__text"><h3 class="elementor-post__title"><a href="${esc(
        c.path,
      )}">${esc(c.title)}</a></h3><div class="elementor-post__read-more-wrapper"><a class="elementor-post__read-more" href="${esc(
        c.path,
      )}" aria-label="Leer: ${esc(c.title)}" tabindex="-1"><time datetime="${esc(c.date)}">${esc(
        c.dateLabel,
      )}</time></a></div></div></div></article>`;
    })
    .join("");
  return `<div class="elementor-posts-container elementor-posts elementor-posts--skin-cards elementor-grid elementor-has-item-ratio" role="list">${items}</div>`;
}
