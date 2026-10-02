import { site, type PageEntry } from "@/lib/content";

/**
 * Orden de ejecución idéntico al de WordPress:
 * dataLayer (GTM4WP) -> datos de la página -> Google Tag Manager -> configuración Polyplas
 * -> widgets globales (chat, carrito, cookies) -> menú del header -> scripts de la página -> footer.
 */
export function scriptsFor(entry?: PageEntry): string[] {
  const [gtm4wp, ...restHead] = site.headScripts;
  return [
    "/legacy/pp-track.js", // marcaje de ecommerce centralizado: debe ir antes que todo lo demás
    gtm4wp,
    ...(entry?.dataLayer ? [entry.dataLayer] : []),
    ...(site.gtmId ? ["/legacy/gtm.js"] : []),
    ...restHead,
    ...site.bodyScripts,
    ...site.headerScripts,
    ...(entry?.scripts ?? []),
    ...site.footerScripts,
  ].filter(Boolean);
}
