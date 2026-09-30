import type { NextConfig } from "next";

/**
 * Sitio 100% estático para Cloudflare Pages (plan gratuito).
 * `npm run build` genera la carpeta `out/` con todo el HTML listo.
 * Las redirecciones 301 y las cabeceras de caché se generan en `public/_redirects`
 * y `public/_headers` (ver scripts/cloudflare.mjs), que Cloudflare aplica en su servidor.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Todas las URLs del sitio terminan en "/", igual que en WordPress
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
