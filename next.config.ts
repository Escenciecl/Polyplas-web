import type { NextConfig } from "next";
import redirectMap from "./content/redirects.json";

/**
 * Redirecciones 301 permanentes.
 * - Mapa exacto de cada URL antigua (productos, etiquetas, categorías vacías) -> su página actual.
 * - Reglas genéricas para restos de WordPress (feeds, productos/etiquetas futuras desconocidas).
 */
const exact = (redirectMap as { source: string; destination: string }[]).map((r) => ({
  source: r.source,
  destination: r.destination,
  statusCode: 301 as const,
}));

const generic = [
  // feeds RSS de WordPress
  { source: "/feed/", destination: "/blog/", statusCode: 301 as const },
  { source: "/comments/feed/", destination: "/blog/", statusCode: 301 as const },
  { source: "/categoria-producto/:slug/feed/", destination: "/categoria-producto/:slug/", statusCode: 301 as const },
  { source: "/:slug/feed/", destination: "/:slug/", statusCode: 301 as const },
  // páginas de WordPress/WooCommerce que ya no existen
  { source: "/author/:slug/", destination: "/nosotros/", statusCode: 301 as const },
  { source: "/category/:slug/", destination: "/blog/", statusCode: 301 as const },
  { source: "/tienda/", destination: "/", statusCode: 301 as const },
  { source: "/carrito/", destination: "/", statusCode: 301 as const },
  { source: "/finalizar-compra/", destination: "/", statusCode: 301 as const },
  { source: "/mi-cuenta/", destination: "/contacto/", statusCode: 301 as const },
  // cualquier producto o etiqueta no listado arriba
  { source: "/producto/:slug/", destination: "/", statusCode: 301 as const },
  { source: "/etiqueta-producto/:slug/", destination: "/", statusCode: 301 as const },
];

const nextConfig: NextConfig = {
  // Todas las URLs del sitio terminan en "/", igual que en WordPress
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return [...exact, ...generic];
  },
  async headers() {
    return [
      {
        source: "/wp-content/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/legacy/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
