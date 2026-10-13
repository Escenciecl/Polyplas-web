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
    /** true si la página viene de un pago (lo define public/legacy/shim.js) */
    __ppUrgent?: boolean;
  }
}

/**
 * Inserta un script. Con `async = false` el navegador descarga varios a la vez
 * pero los ejecuta en el mismo orden en que se insertaron.
 */
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

/**
 * Google Tag Manager (y todo lo que carga: Analytics, píxeles, etc.) es lo más pesado del sitio.
 * Se carga cuando la página ya terminó de cargar y el navegador está desocupado (normalmente 2 a 4 s),
 * con `window.__ppWhenIdle` (definido en public/legacy/shim.js).
 * Antes se cargaba con la primera interacción del visitante: eso hacía que GTM corriera justo cuando
 * la persona tocaba la pantalla (INP lento en móvil) y las visitas que se iban sin interactuar no se medían.
 * Los eventos que se registren antes quedan en `dataLayer` y GTM los procesa al cargar.
 * Si la página viene de un pago (/gracias/, ?pp_pago=…) se carga de inmediato para registrar la compra.
 */
const DEFERRED = (src: string) => src === "/legacy/gtm.js";

declare global {
  interface Window {
    __ppWhenIdle?: (fn: () => void) => void;
  }
}

function whenIdle(fn: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };
  if (window.__ppWhenIdle) window.__ppWhenIdle(run);
  else window.setTimeout(run, 4000);
  return () => {
    cancelled = true;
  };
}

export default function LegacyScripts({ scripts }: { scripts: string[] }) {
  useEffect(() => {
    let cancelled = false;
    const urgent = !!window.__ppUrgent || /^\/gracias(\/|$)/.test(window.location.pathname);
    const now = urgent ? scripts : scripts.filter((s) => !DEFERRED(s));
    const later = urgent ? [] : scripts.filter(DEFERRED);
    // Todos se piden de una vez (descarga en paralelo) y se ejecutan en orden.
    // (si el HTML heredado se está recuperando —caso raro—, primero se espera a que esté en la página)
    Promise.all(window.__ppHtmlPending ?? [])
      .then(() => (cancelled ? [] : Promise.all(now.map(load))))
      .then(() => {
        if (cancelled) return;
        // Algunos scripts esperan estos eventos; ya ocurrieron, así que los re-emitimos una vez.
        document.dispatchEvent(new Event("pp:legacy-ready"));
      });
    const stop = later.length
      ? whenIdle(() => {
          later.forEach((src) => void load(src));
        })
      : () => {};
    return () => {
      cancelled = true;
      stop();
    };
  }, [scripts]);
  return null;
}
