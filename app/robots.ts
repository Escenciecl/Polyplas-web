import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

/**
 * En producción permite todo salvo el buscador interno.
 * En cualquier otro entorno (previews de Vercel, staging) bloquea la indexación por completo.
 */
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
  if (!isProd || process.env.NEXT_PUBLIC_NOINDEX === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/buscar/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
