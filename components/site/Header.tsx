import nav from "@/content/sitio/navegacion.json";
import { HeaderInteractivo, BuscadorCabecera } from "./HeaderClient";
import { AccionesCabecera } from "./Cuenta";

export type ItemMenu = {
  texto: string;
  enlace: string;
  detalle?: string;
  submenu?: ItemMenu[];
  destacado?: { titulo: string; detalle: string; boton: string; enlace: string; imagen: string };
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
          <AccionesCabecera />
        </div>
      </div>

      <HeaderInteractivo menu={menu} telefono={nav.telefono} whatsapp={nav.whatsapp} enlaceDerecha={nav.enlaceDerecha} />
    </header>
  );
}
