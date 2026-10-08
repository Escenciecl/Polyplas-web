import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

export const dynamic = "force-static";

/**
 * robots.txt
 * En Cloudflare Pages, solo la rama "main" es producción. Las vistas previas de otras
 * ramas bloquean la indexación. (La URL técnica *.pages.dev además envía noindex vía _headers.)
 */
export default function robots(): MetadataRoute.Robots {
  const branch = process.env.CF_PAGES_BRANCH;
  const isPreview = (branch && branch !== "main") || process.env.NEXT_PUBLIC_NOINDEX === "1";
  if (isPreview) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/buscar/", "/cuenta/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
