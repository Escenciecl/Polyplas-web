"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { norm, resolver, sugerir } from "@/lib/busqueda";
import type { ItemMenu } from "./Header";

type Enlace = { texto: string; enlace: string };

const activo = (path: string, item: ItemMenu) =>
  item.enlace === path || (item.submenu ?? []).some((s) => s.enlace === path);

/* ------------------------------------------------------------------ Buscador */
export function BuscadorCabecera({ placeholder }: { placeholder: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const router = useRouter();
  const listId = useId();
  const box = useRef<HTMLFormElement>(null);
  const items = sugerir(q);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const ir = (url: string) => {
    const w = window as unknown as { dataLayer?: unknown[] };
    (w.dataLayer ??= []).push({ event: "busqueda_interna", search_term: norm(q), search_destino: url, search_match: resolver(q) ? "si" : "no" });
    setOpen(false);
    router.push(url);
  };

  return (
    <form
      ref={box}
      className="pp-search"
      role="search"
      action="/buscar/"
      onSubmit={(e) => {
        e.preventDefault();
        if (idx >= 0 && items[idx]) return ir(items[idx].url);
        ir(resolver(q) ?? `/buscar/?s=${encodeURIComponent(q)}`);
      }}
    >
      <input
        type="search"
        name="s"
        value={q}
        placeholder={placeholder}
        aria-label="Buscar productos"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setIdx(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") (e.preventDefault(), setIdx((i) => Math.min(i + 1, items.length - 1)));
          if (e.key === "ArrowUp") (e.preventDefault(), setIdx((i) => Math.max(i - 1, -1)));
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button type="submit" aria-label="Buscar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
      </button>
      {open && (
        <ul className="pp-search__list" id={listId} role="listbox">
          {items.map((s, i) => (
            <li key={s.url} role="option" aria-selected={i === idx}>
              <button type="button" className={i === idx ? "is-active" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => ir(s.url)}>
                <span>{s.label}</span>
                <small>{s.tag}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ Menú */
export function HeaderInteractivo({ menu, telefono, whatsapp }: { menu: ItemMenu[]; telefono: Enlace; whatsapp: Enlace }) {
  const path = usePathname() || "/";
  const [drawer, setDrawer] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);

  // Sombra al hacer scroll
  useEffect(() => {
    const h = document.getElementById("pp-header");
    const onScroll = () => h?.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("pp-no-scroll", drawer);
  }, [drawer]);

  useEffect(() => {
    setDrawer(false);
    setAbierto(null);
  }, [path]);

  return (
    <>
      <nav className="pp-nav" aria-label="Menú principal">
        <div className="pp-container pp-nav__in">
          <button className="pp-burger" aria-label="Abrir menú" aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <i className="pp-burger__icon"><span /><span /><span /></i>
            <em>Menú</em>
          </button>
          <ul className="pp-nav__list">
            {menu.map((item) => (
              <li key={item.texto} className={`pp-nav__item${item.submenu ? " has-sub" : ""}${activo(path, item) ? " is-current" : ""}`}>
                <Link href={item.enlace} className="pp-nav__link" aria-haspopup={item.submenu ? "true" : undefined}>
                  {item.texto}
                  {item.submenu && (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="pp-caret"><path d="m6 9 6 6 6-6" /></svg>
                  )}
                </Link>
                {item.submenu && (
                  <div className="pp-mega">
                    <ul>
                      {item.submenu.map((s) => (
                        <li key={s.enlace}>
                          <Link href={s.enlace} className={s.enlace === path ? "is-current" : ""}>
                            <strong>{s.texto}</strong>
                            {s.detalle && <span>{s.detalle}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Menú móvil */}
      <div className={`pp-drawer${drawer ? " is-open" : ""}`} aria-hidden={!drawer}>
        <div className="pp-drawer__bg" onClick={() => setDrawer(false)} />
        <aside className="pp-drawer__panel" role="dialog" aria-label="Menú">
          <div className="pp-drawer__head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wp-content/uploads/2022/07/marca-polyplas-1.svg" alt="Polyplas" width={140} height={44} />
            <button aria-label="Cerrar menú" onClick={() => setDrawer(false)}>×</button>
          </div>
          <ul className="pp-drawer__list">
            {menu.map((item) =>
              item.submenu ? (
                <li key={item.texto}>
                  <button className="pp-drawer__toggle" aria-expanded={abierto === item.texto} onClick={() => setAbierto(abierto === item.texto ? null : item.texto)}>
                    {item.texto}
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {abierto === item.texto && (
                    <ul>
                      {item.submenu.map((s) => (
                        <li key={s.enlace}>
                          <Link href={s.enlace}>{s.texto}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={item.texto}>
                  <Link href={item.enlace} className={item.enlace === path ? "is-current" : ""}>
                    {item.texto}
                  </Link>
                </li>
              ),
            )}
          </ul>
          <div className="pp-drawer__foot">
            <a className="pp-btn pp-btn--whatsapp" href={whatsapp.enlace} target="_blank" rel="noopener">
              Escríbenos por {whatsapp.texto}
            </a>
            <a className="pp-btn pp-btn--ghost" href={telefono.enlace}>
              Llamar {telefono.texto}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
