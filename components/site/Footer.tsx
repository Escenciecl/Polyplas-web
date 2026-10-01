import Link from "next/link";
import pie from "@/content/sitio/pie.json";

const RedIcono = ({ red }: { red: string }) =>
  red === "facebook" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z" /></svg>
  ) : red === "instagram" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /></svg>
  );

const nombreRed = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

export default function Footer() {
  const c = pie.contacto;
  return (
    <footer className="pp-footer">
      <div className="pp-container pp-footer__grid">
        <div className="pp-footer__brand">
          <Link href="/" className="pp-footer__logo" aria-label="Polyplas, ir al inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wp-content/uploads/2022/07/marca-polyplas-1.svg" alt="Polyplas" width={170} height={52} loading="lazy" />
          </Link>
          <p>{pie.descripcion}</p>
          <div className="pp-footer__social">
            {pie.redes.map((r) => (
              <a key={r.red} href={r.enlace} target="_blank" rel="noopener" aria-label={`Polyplas en ${nombreRed(r.red)}`}>
                <RedIcono red={r.red} />
              </a>
            ))}
          </div>
        </div>

        {pie.columnas.map((col) => (
          <nav key={col.titulo} className="pp-footer__col" aria-label={col.titulo}>
            <h2>{col.titulo}</h2>
            <ul>
              {col.enlaces.map((e) => (
                <li key={e.enlace}>
                  <Link href={e.enlace}>{e.texto}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="pp-footer__col pp-footer__contact">
          <h2>{c.titulo}</h2>
          <ul>
            <li>
              <span>WhatsApp</span>
              <a href={c.whatsapp.enlace} target="_blank" rel="noopener">{c.whatsapp.texto}</a>
            </li>
            <li>
              <span>Oficina</span>
              <a href={c.oficina.enlace}>{c.oficina.texto}</a>
            </li>
            <li>
              <span>Correo</span>
              <a href={`mailto:${c.email}`}>{c.email}</a>
            </li>
            <li>
              <span>Dirección</span>
              <a href={c.mapa} target="_blank" rel="noopener">{c.direccion}</a>
            </li>
            <li>
              <span>Horario</span>
              {c.horarios.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </li>
          </ul>
        </div>
      </div>

      <div className="pp-container pp-footer__pay">
        <div>
          <strong>{pie.pagos.titulo}</strong>
          <p>{pie.pagos.texto}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pie.pagos.imagen} alt="Webpay Transbank" width={150} height={40} loading="lazy" />
      </div>

      <div className="pp-footer__bottom">
        <div className="pp-container">
          © {new Date().getFullYear()} {pie.copyright}
        </div>
      </div>
    </footer>
  );
}
