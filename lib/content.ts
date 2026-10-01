import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import cardsJson from "@/content/blog-cards.json";

export const SITE_URL = "https://polyplas.cl";

export type PageType = "page" | "post" | "category" | "notfound" | "markdown";

export interface PageMeta {
  title: string;
  description: string | null;
  robots: string | null;
  canonical: string | null;
  og: Record<string, string | null>;
  published: string | null;
  modified: string | null;
}

export interface PageEntry {
  key: string;
  type: PageType;
  meta: PageMeta;
  jsonLd: string[];
  dataLayer: string | null;
  scripts: string[];
  css: string[];
  h1: string[];
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const GEN_DIR = path.join(CONTENT_DIR, "_generado");
const readGen = (f: string) => JSON.parse(fs.readFileSync(path.join(GEN_DIR, f), "utf8"));

/* Generados por scripts/modulos.mjs a partir de content/modulos/ (npm run build / npm run dev) */
const pagesJson = readGen("pages.json");
const siteJson = readGen("site.json");

export const site = siteJson as {
  gtmId: string | null;
  headScripts: string[];
  bodyScripts: string[];
  headerScripts: string[];
  footerScripts: string[];
  businessJsonLd: string | null;
};

const NOT_FOUND_PATH = "/esta-pagina-no-existe-404/";
const MD_DIR = path.join(CONTENT_DIR, "blog");

const legacyPages = pagesJson as Record<string, PageEntry>;

/* ------------------------------------------------------------------ Markdown */
export interface MarkdownPost {
  path: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  html: string;
}

export function getMarkdownPosts(): MarkdownPost[] {
  if (!fs.existsSync(MD_DIR)) return [];
  return fs
    .readdirSync(MD_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(MD_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const slug = (data.slug as string) ?? file.replace(/\.md$/, "");
      return {
        path: `/${slug}/`,
        title: String(data.title ?? slug),
        description: String(data.description ?? ""),
        date: new Date(data.date ?? Date.now()).toISOString(),
        image: data.image as string | undefined,
        html: marked.parse(content, { async: false }) as string,
      };
    });
}

/* ------------------------------------------------------------------ Registro */
export function getAllPaths(): string[] {
  return [
    ...Object.keys(legacyPages).filter((p) => p !== NOT_FOUND_PATH),
    ...getMarkdownPosts().map((p) => p.path),
  ];
}

export function getPage(p: string): PageEntry | undefined {
  if (p === NOT_FOUND_PATH) return undefined;
  return legacyPages[p];
}

export function getNotFoundPage(): PageEntry {
  return legacyPages[NOT_FOUND_PATH];
}

export function readHtml(key: string): string {
  return fs.readFileSync(path.join(GEN_DIR, "html", `${key}.html`), "utf8");
}

export interface BlogCard {
  path: string;
  title: string;
  image: string | null;
  srcset: string | null;
  alt: string;
  date: string;
  dateLabel: string;
}

const dateFmt = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric" });
const originalCards = cardsJson as Record<
  string,
  { title: string; dateLabel: string; image: string | null; srcset: string | null; alt: string }
>;

/** Tarjetas del blog: artículos migrados + artículos nuevos en Markdown, más reciente primero. */
export function getBlogCards(): BlogCard[] {
  const legacy: BlogCard[] = Object.entries(legacyPages)
    .filter(([, e]) => e.type === "post")
    .map(([p, e]) => {
      const c = originalCards[p];
      const date = e.meta.published ?? e.meta.modified ?? "2024-01-01";
      return {
        path: p,
        title: c?.title ?? e.h1[0] ?? e.meta.title,
        image: c?.image ?? e.meta.og.image?.replace(SITE_URL, "") ?? null,
        srcset: c?.srcset ?? null,
        alt: c?.alt || c?.title || e.h1[0] || "",
        date,
        dateLabel: c?.dateLabel ?? dateFmt.format(new Date(date)),
      };
    });
  const md: BlogCard[] = getMarkdownPosts().map((m) => ({
    path: m.path,
    title: m.title,
    image: m.image ?? null,
    srcset: null,
    alt: m.title,
    date: m.date,
    dateLabel: dateFmt.format(new Date(m.date)),
  }));
  return [...legacy, ...md].sort((a, b) => b.date.localeCompare(a.date));
}

/** Páginas indexables (para sitemap.xml). */
export function getSitemapEntries() {
  const legacy = Object.entries(legacyPages)
    .filter(([p, e]) => p !== NOT_FOUND_PATH && !(e.meta.robots ?? "").includes("noindex"))
    .map(([p, e]) => ({
      url: SITE_URL + p,
      lastModified: e.meta.modified ?? e.meta.published ?? undefined,
      priority: p === "/" ? 1 : e.type === "category" ? 0.9 : e.type === "post" ? 0.6 : 0.7,
    }));
  const md = getMarkdownPosts().map((m) => ({
    url: SITE_URL + m.path,
    lastModified: m.date,
    priority: 0.6,
  }));
  return [...legacy, ...md];
}
