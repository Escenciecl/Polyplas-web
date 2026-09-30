"use client";

import { useEffect } from "react";

/**
 * Carga, en orden y una sola vez, los scripts que el sitio tenía en WordPress
 * (chat, carrito/cotizador, banner de cookies, menús, configuradores de productos, etc.).
 * Se ejecutan después de que la página ya es visible, así no afectan la velocidad de carga.
 */
declare global {
  interface Window {
    __ppLoaded?: Set<string>;
  }
}

function load(src: string): Promise<void> {
  window.__ppLoaded ??= new Set();
  if (window.__ppLoaded.has(src)) return Promise.resolve();
  window.__ppLoaded.add(src);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => {
      console.warn("[polyplas] no se pudo cargar", src);
      resolve();
    };
    document.body.appendChild(s);
  });
}

export default function LegacyScripts({ scripts }: { scripts: string[] }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const src of scripts) {
        if (cancelled) return;
        await load(src);
      }
      // Algunos scripts esperan estos eventos; ya ocurrieron, así que los re-emitimos una vez.
      document.dispatchEvent(new Event("pp:legacy-ready"));
    })();
    return () => {
      cancelled = true;
    };
  }, [scripts]);
  return null;
}
