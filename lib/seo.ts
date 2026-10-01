import type { Metadata } from "next";
import { SITE_URL, type MarkdownPost, type PageEntry } from "@/lib/content";

function parseRobots(robots: string | null): Metadata["robots"] {
  const r = (robots ?? "").toLowerCase();
  return {
    index: !r.includes("noindex"),
    follow: !r.includes("nofollow"),
    googleBot: {
      index: !r.includes("noindex"),
      follow: !r.includes("nofollow"),
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

/** Metadatos de cada página: mismos títulos, descripciones y canonicals que tenía AIOSEO. */
export function buildMetadata(path: string, e: PageEntry): Metadata {
  const m = e.meta;
  const og = m.og;
  const image = og.image
    ? [
        {
          url: og.image,
          width: og["image:width"] ? Number(og["image:width"]) : undefined,
          height: og["image:height"] ? Number(og["image:height"]) : undefined,
        },
      ]
    : undefined;
  const isArticle = e.type === "post";
  return {
    title: { absolute: m.title },
    description: m.description ?? undefined,
    alternates: { canonical: m.canonical ?? path },
    robots: parseRobots(m.robots),
    openGraph: {
      type: isArticle ? "article" : "website",
      locale: "es_CL",
      siteName: "Polyplas",
      url: SITE_URL + (m.canonical ?? path),
      title: og.title ?? m.title,
      description: og.description ?? m.description ?? undefined,
      images: image,
      ...(isArticle
        ? { publishedTime: m.published ?? undefined, modifiedTime: m.modified ?? undefined }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: og.title ?? m.title,
      description: og.description ?? m.description ?? undefined,
      images: og.image ? [og.image] : undefined,
    },
  };
}

export function markdownMetadata(md: MarkdownPost): Metadata {
  return {
    title: { absolute: `${md.title} | Polyplas` },
    description: md.description,
    alternates: { canonical: md.path },
    openGraph: {
      type: "article",
      locale: "es_CL",
      siteName: "Polyplas",
      url: SITE_URL + md.path,
      title: md.title,
      description: md.description,
      publishedTime: md.date,
      images: md.image ? [{ url: md.image }] : undefined,
    },
    twitter: { card: "summary_large_image", title: md.title, description: md.description },
  };
}
