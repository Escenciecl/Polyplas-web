"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    /** HTML heredado que todavía se está recuperando; LegacyScripts espera a que termine */
    __ppHtmlPending?: Promise<void>[];
  }
}

/**
 * Contenedor del HTML heredado (ver LegacyHtml.tsx).
 * - En el servidor escribe el HTML completo.
 * - En el navegador NO lo vuelve a recibir: conserva tal cual lo que llegó en la página
 *   (`suppressHydrationWarning` + `__html: ""` es el patrón de React para contenido estático).
 * - Si alguna vez se monta sin ese HTML (navegación interna o re-dibujo), lo recupera de
 *   /legacy/h/<clave>.txt antes de que se ejecuten los scripts de la página.
 * `display: contents` evita que este contenedor altere el diseño original.
 */
// Debe ser SIEMPRE el mismo objeto: si cambiara en cada render, React volvería a escribir el
// contenedor (vaciándolo) y se perderían el HTML y lo que los scripts hayan montado encima.
const KEEP = { __html: "" };

export default function LegacyHtmlClient({ k, id }: { k: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner =
    typeof window === "undefined"
      ? { __html: (globalThis as { __ppLegacyHtml?: Map<string, string> }).__ppLegacyHtml?.get(k) ?? "" }
      : KEEP;

  useEffect(() => {
    const el = ref.current;
    if (!el || el.childNodes.length > 0) return; // lo normal: el HTML ya vino del servidor
    let cancelled = false;
    const p = fetch(`/legacy/h/${k}.txt`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((text) => {
        if (cancelled || !ref.current || ref.current.childNodes.length > 0) return;
        ref.current.innerHTML = text;
        // los <script data-pp-inline> no se ejecutan al insertarlos como texto: se recrean
        ref.current.querySelectorAll("script[data-pp-inline]").forEach((old) => {
          const s = document.createElement("script");
          s.textContent = old.textContent;
          old.replaceWith(s);
        });
        // si la URL apunta a una sección (#ancla), ahora que el contenido existe se va hasta ella
        const hash = decodeURIComponent(window.location.hash.slice(1));
        if (hash) document.getElementById(hash)?.scrollIntoView();
      })
      .catch(() => {});
    (window.__ppHtmlPending ??= []).push(p);
    return () => {
      cancelled = true;
    };
  }, [k]);

  return (
    <div
      ref={ref}
      id={id}
      data-pp-html={k}
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={inner}
    />
  );
}
