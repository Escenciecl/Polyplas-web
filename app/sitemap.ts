import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/content";

/**
 * sitemap.xml: solo URLs canónicas que responden 200 e indexables.
 * (El de WordPress incluía 51 URLs que redirigían: productos y etiquetas.)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries().map((e) => ({
    url: e.url,
    lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
    priority: e.priority,
  }));
}
