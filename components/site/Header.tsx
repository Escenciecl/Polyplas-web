import nav from "@/content/sitio/navegacion.json";
import { HeaderInteractivo, BuscadorCabecera } from "./HeaderClient";

export type ItemMenu = {
  texto: string;
  enlace: string;
  detalle?: string;
  submenu?: ItemMenu[];
  destacado?: { titulo: string; detalle: string; boton: string; enlace: string; imagen: string };
};

const Icono = {
  camion: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="17" r="1.8" /><circle cx="17" cy="17" r="1.8" /></svg>
  ),
  tarjeta: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></svg>
  ),
  tijera: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><path d="M8 8.5 20 18M8 15.5 20 6" /></svg>
  ),
  telefono: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.57 3.6a1 1 0 0 1-.25 1z" /></svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" /><path d="M8.8 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.6 1 1.4 1.8 2.5 2.4.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .5-.2 1.2-.9 1.6-.6.4-1.6.5-3.2-.2a9.4 9.4 0 0 1-4.2-4c-.7-1.3-.5-2.4-.2-3z" /></svg>
  ),
};

export default function Header() {
  const menu = nav.menu as ItemMenu[];
  return (
    <header className="pp-header" id="pp-header">
      <div className="pp-topbar">
        <div className="pp-container pp-topbar__in">
          <ul className="pp-topbar__msgs">
            {nav.barraSuperior.map((m) => (
              <li key={m}>
                <i className="pp-topbar__dot" aria-hidden="true" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pp-mainbar">
        <div className="pp-container pp-mainbar__in">
          <a href="/" className="pp-logo" aria-label="Polyplas, ir al inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wp-content/uploads/2022/07/marca-polyplas-1.svg" alt="Polyplas" width={180} height={56} />
          </a>
          <BuscadorCabecera placeholder={nav.buscador.placeholder} />
          <div className="pp-mainbar__actions">
            <a className="pp-wa pp-hide-sm" href={nav.whatsapp.enlace} target="_blank" rel="noopener">
              {Icono.whatsapp}
              <span>
                <small>Ventas por</small>
                <b>{nav.whatsapp.texto}</b>
              </span>
            </a>
            <a className="pp-btn pp-btn--cta" href={nav.botonPrincipal.enlace}>
              {nav.botonPrincipal.texto}
            </a>
          </div>
        </div>
      </div>

      <HeaderInteractivo menu={menu} telefono={nav.telefono} whatsapp={nav.whatsapp} enlaceDerecha={nav.enlaceDerecha} />
    </header>
  );
}
