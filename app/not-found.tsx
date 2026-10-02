import type { Metadata } from "next";
import LegacyHtml from "@/components/LegacyHtml";
import LegacyScripts from "@/components/LegacyScripts";
import { getNotFoundPage, readHtml, readPublicCss } from "@/lib/content";
import { scriptsFor } from "@/lib/scripts";

export const metadata: Metadata = {
  title: { absolute: "Página no encontrada | Polyplas" },
  robots: { index: false, follow: true },
};

/** Página 404 (misma plantilla de Elementor que tenía WordPress). Responde con estado HTTP 404. */
export default function NotFound() {
  const entry = getNotFoundPage();
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
      <LegacyHtml html={readHtml(entry.key)} />
      <LegacyScripts scripts={scriptsFor(entry)} />
    </>
  );
}
