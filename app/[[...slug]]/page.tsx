import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegacyHtml from "@/components/LegacyHtml";
import LegacyScripts from "@/components/LegacyScripts";
import { blogListHtml } from "@/components/BlogList";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import {
  getAllPaths,
  getBlogCards,
  getMarkdownPosts,
  getPage,
  readHtml,
  readPublicCss,
  SITE_URL,
  type PageEntry,
} from "@/lib/content";
import { buildMetadata, markdownMetadata } from "@/lib/seo";
import { scriptsFor } from "@/lib/scripts";

// Todas las páginas se generan como HTML estático al hacer build (máxima velocidad).
export const dynamicParams = false;

type Params = { slug?: string[] };

const toPath = (slug?: string[]) => (slug?.length ? `/${slug.join("/")}/` : "/");

export function generateStaticParams(): Params[] {
  return getAllPaths().map((p) => ({ slug: p.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = toPath((await params).slug);
  const entry = getPage(p);
  if (entry) return buildMetadata(p, entry);
  const md = getMarkdownPosts().find((m) => m.path === p);
  return md ? markdownMetadata(md) : {};
}

/**
 * Estilos propios de la página (los pequeños post-XXXX.css de Elementor).
 * Si el archivo está en el sitio se escribe dentro del HTML, así no hay una descarga extra
 * que bloquee el primer pintado; los externos se siguen enlazando.
 */
function PageCss({ entry }: { entry: PageEntry }) {
  return (
    <>
      {entry.css.map((href) => {
        const css = readPublicCss(href);
        return css !== null ? (
          <style key={href} href={href} precedence="page">
            {css}
          </style>
        ) : (
          <link key={href} rel="stylesheet" href={href} precedence="page" />
        );
      })}
    </>
  );
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = toPath((await params).slug);
  const entry = getPage(p);

  // Artículo nuevo escrito en Markdown (content/blog/*.md)
  if (!entry) {
    const md = getMarkdownPosts().find((m) => m.path === p);
    if (!md) notFound();
    return (
      <>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: md.title,
            description: md.description,
            datePublished: md.date,
            image: md.image ? SITE_URL + md.image : undefined,
            mainEntityOfPage: SITE_URL + md.path,
            author: { "@type": "Organization", name: "Polyplas", url: SITE_URL },
            publisher: { "@id": `${SITE_URL}/#organization` },
          }}
        />
        <article className="pp-md-post">
          <h1>{md.title}</h1>
          <p className="pp-md-date">
            <time dateTime={md.date}>
              {new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(new Date(md.date))}
            </time>
          </p>
          <div className="pp-md-body" dangerouslySetInnerHTML={{ __html: md.html }} />
        </article>
        <LegacyScripts scripts={scriptsFor()} />
      </>
    );
  }

  const html = readHtml(entry.key).replace("<!--BLOG_LIST-->", () => blogListHtml(getBlogCards()));

  return (
    <>
      <PageCss entry={entry} />
      {entry.jsonLd.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}
      {entry.type === "post" && (
        <Breadcrumbs items={[{ texto: "Inicio", enlace: "/" }, { texto: "Blog", enlace: "/blog/" }, { texto: entry.h1[0] ?? entry.meta.title }]} />
      )}
      <LegacyHtml html={html} />
      <LegacyScripts scripts={scriptsFor(entry)} />
    </>
  );
}
