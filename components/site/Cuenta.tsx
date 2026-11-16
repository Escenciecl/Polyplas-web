"use client";

// Botones de la cabecera (carrito y cuenta) y formulario de ingreso / registro.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EVENTO_CUENTA, RUTA_CUENTA, mensajeError, sb, usuarioGuardado, vincularPagoConCuenta, type UsuarioBasico } from "@/lib/cuenta";

const IconoCarrito = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" /></svg>
);
const IconoUsuario = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);

/** Sesión actual (leída del navegador; se actualiza al ingresar o salir). */
export function useUsuario(): UsuarioBasico | null {
  const [u, setU] = useState<UsuarioBasico | null>(null);
  useEffect(() => {
    const leer = () => setU(usuarioGuardado());
    leer();
    window.addEventListener(EVENTO_CUENTA, leer);
    window.addEventListener("storage", leer);
    return () => {
      window.removeEventListener(EVENTO_CUENTA, leer);
      window.removeEventListener("storage", leer);
    };
  }, []);
  return u;
}

/** Cantidad de productos: se copia del contador del carrito del sitio (#ppGC-badge). */
function useCantidadCarrito(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let obs: MutationObserver | null = null;
    let intento = 0;
    let timer: ReturnType<typeof setTimeout>;
    const conectar = () => {
      const badge = document.getElementById("ppGC-badge");
      if (!badge) {
        if (intento++ < 20) timer = setTimeout(conectar, 500);
        return;
      }
      const leer = () => setN(parseInt(badge.textContent || "0", 10) || 0);
      leer();
      obs = new MutationObserver(leer);
      obs.observe(badge, { childList: true, characterData: true, subtree: true });
    };
    conectar();
    return () => {
      clearTimeout(timer);
      obs?.disconnect();
    };
  }, []);
  return n;
}

/** Total del carrito en CLP — se actualiza vía evento ppGCCartUpdate del módulo de carrito. */
function useTotalCarrito(): number {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ count: number; total: number }>;
      setTotal(ce.detail?.total ?? 0);
    };
    window.addEventListener("ppGCCartUpdate", handler);
    // Leer valor inicial desde localStorage si ya hay un carrito activo.
    try {
      const raw = localStorage.getItem("pp_global_cart");
      if (raw) {
        const data = JSON.parse(raw) as { items?: Array<{ subtotal?: number }> };
        const items = data?.items ?? [];
        setTotal(items.reduce((s, i) => s + (i.subtotal ?? 0), 0));
      }
    } catch { /* sin carrito */ }
    return () => window.removeEventListener("ppGCCartUpdate", handler);
  }, []);
  return total;
}

const fmtCLP = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CL");

export function AccionesCabecera() {
  const usuario = useUsuario();
  const cantidad = useCantidadCarrito();
  const total = useTotalCarrito();
  const [modal, setModal] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    vincularPagoConCuenta();
  }, []);

  // Accesibilidad del modal: Escape cierra, el foco queda dentro (Tab y Shift+Tab dan la vuelta)
  // y al cerrar vuelve al botón "Ingresar".
  useEffect(() => {
    if (!modal) return;
    const boton = botonRef.current;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setModal(false);
      if (e.key !== "Tab" || !cajaRef.current) return;
      const focos = Array.from(
        cajaRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      if (!focos.length) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", teclas);
    document.documentElement.classList.add("pp-no-scroll");
    return () => {
      document.removeEventListener("keydown", teclas);
      document.documentElement.classList.remove("pp-no-scroll");
      boton?.focus();
    };
  }, [modal]);

  const abrirCarrito = () => (window as unknown as { ppGCOpen?: () => void }).ppGCOpen?.();
  const enCuenta = typeof window !== "undefined" && window.location.pathname.startsWith(RUTA_CUENTA);

  return (
    <div className="pp-mainbar__actions">
      <button type="button" className="pp-accion" onClick={abrirCarrito} aria-label={`Ver carrito, ${cantidad} producto(s)${total > 0 ? ", total " + fmtCLP(total) : ""}`}>
        <span className="pp-accion__icono">
          {IconoCarrito}
          {cantidad > 0 && <i className="pp-accion__num">{cantidad}</i>}
        </span>
        <span className="pp-accion__txt">
          Carrito
          {total > 0 && <span className="pp-accion__total">{fmtCLP(total)}</span>}
        </span>
      </button>

      {usuario ? (
        <a className="pp-btn pp-btn--primary pp-btn--cuenta" href={RUTA_CUENTA} aria-label={`Mi cuenta (${usuario.email})`}>
          {IconoUsuario}
          <span>Mi cuenta</span>
        </a>
      ) : (
        <button
          ref={botonRef}
          type="button"
          className="pp-btn pp-btn--primary pp-btn--cuenta"
          aria-haspopup="dialog"
          aria-label="Ingresar o crear cuenta"
          onClick={() => (enCuenta ? document.getElementById("pp-auth-email")?.focus() : setModal(true))}
        >
          {IconoUsuario}
          <span>Ingresar</span>
        </button>
      )}

      {/* Se dibuja directo en <body> para quedar sobre la cabecera, el aviso de cookies y las pestañas laterales */}
      {modal && !usuario && createPortal(
        <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="pp-auth-titulo">
          <div className="pp-modal__bg" onClick={() => setModal(false)} />
          <div className="pp-modal__caja" ref={cajaRef}>
            <button type="button" className="pp-modal__cerrar" aria-label="Cerrar" onClick={() => setModal(false)}>×</button>
            <FormularioCuenta inicial="ingreso" onListo={() => setModal(false)} enfocar />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

type Modo = "registro" | "ingreso" | "recuperar";

const dl = (o: Record<string, unknown>) => {
  try {
    const w = window as unknown as { dataLayer?: object[] };
    (w.dataLayer = w.dataLayer || []).push(o);
  } catch { /* sin medición */ }
};

export function FormularioCuenta({ inicial = "ingreso", onListo, enfocar = false }: { inicial?: Modo; onListo?: () => void; enfocar?: boolean }) {
  const [modo, setModo] = useState<Modo>(inicial);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [ofertas, setOfertas] = useState(false); // Ley 21.719: opcional y desmarcada
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const primeraVez = useRef(true);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      if (enfocar) emailRef.current?.focus();
      return;
    }
    // Al cambiar de pestaña se conserva el correo y el foco va al primer campo vacío
    if (modo === "registro" && !nombre) nombreRef.current?.focus();
    else emailRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  const cambiar = (m: Modo, conservarMensaje = false) => {
    if (!conservarMensaje) {
      setError("");
      setAviso("");
    }
    setModo(m);
  };

  const destino = () => `${window.location.origin}${RUTA_CUENTA}`;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      const auth = (await sb()).auth;
      if (modo === "recuperar") {
        const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: `${destino()}?recuperar=1` });
        if (error) return setError(mensajeError(error));
        return setAviso("Si el correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Ábrelo en este mismo navegador.");
      }
      if (modo === "registro") {
        if (clave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
        const { data, error } = await auth.signUp({
          email: email.trim(),
          password: clave,
          options: { data: { nombre: nombre.trim() }, emailRedirectTo: destino() },
        });
        if (error) {
          const m = mensajeError(error);
          if (m.startsWith("Ya existe")) {
            setError("Ya tienes una cuenta con este correo. Ingresa con tu contraseña.");
            return cambiar("ingreso", true);
          }
          return setError(m);
        }
        // Supabase no revela si el correo ya existe: devuelve un usuario sin identidades
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setClave("");
          setError("Ya tienes una cuenta con este correo. Ingresa con tu contraseña.");
          return cambiar("ingreso", true);
        }
        // Consentimiento para ofertas: solo si marcó la casilla (queda registrado con fecha y texto)
        if (ofertas) {
          fetch("/wp-json/polyplas/v1/ofertas-consentimiento", {
            method: "POST",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), nombre: nombre.trim(), origen: "cuenta", pagina: window.location.pathname }),
          }).catch(() => {});
        }
        dl({ event: "sign_up", method: "email", origen_cuenta: "cabecera" });
        if (!data.session) {
          setClave("");
          return setAviso("¡Listo! Te enviamos un correo para confirmar tu cuenta. Ábrelo y haz clic en el enlace.");
        }
        return onListo?.();
      }
      const { error } = await auth.signInWithPassword({ email: email.trim(), password: clave });
      if (error) return setError(mensajeError(error));
      dl({ event: "login", method: "email" });
      onListo?.();
    } catch {
      setError("No pudimos conectar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  };

  const titulo = modo === "registro" ? "Crea tu cuenta" : modo === "ingreso" ? "Ingresa a tu cuenta" : "Recupera tu contraseña";
  const ayudaClave = `${id}-ayuda-clave`;
  const idMsg = `${id}-msg`;
  const tabs: { m: Modo; texto: string }[] = [
    { m: "ingreso", texto: "Ingresar" },
    { m: "registro", texto: "Crear cuenta" },
  ];
  const teclasTabs = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const sig: Modo = modo === "ingreso" ? "registro" : "ingreso";
    cambiar(sig);
    requestAnimationFrame(() => document.getElementById(`${id}-tab-${sig}`)?.focus());
  };

  return (
    <div className="pp-auth">
      {modo !== "recuperar" && (
        <div className="pp-auth__tabs" role="tablist" aria-label="Elige una opción" onKeyDown={teclasTabs}>
          {tabs.map((t) => (
            <button
              key={t.m}
              id={`${id}-tab-${t.m}`}
              type="button"
              role="tab"
              aria-selected={modo === t.m}
              aria-controls={`${id}-panel`}
              tabIndex={modo === t.m ? 0 : -1}
              className="pp-auth__tab"
              onClick={() => cambiar(t.m)}
            >
              {t.texto}
            </button>
          ))}
        </div>
      )}

      <div id={`${id}-panel`} role={modo !== "recuperar" ? "tabpanel" : undefined} aria-labelledby={modo !== "recuperar" ? `${id}-tab-${modo}` : undefined}>
        <h2 className="pp-auth__titulo" id="pp-auth-titulo">{titulo}</h2>
        <p className="pp-auth__bajada">
          {modo === "ingreso" && "Revisa tus compras y tus datos."}
          {modo === "registro" && "Todas tus compras en un solo lugar, también las que ya hiciste con tu correo."}
          {modo === "recuperar" && "Te enviaremos un enlace a tu correo para crear una contraseña nueva."}
        </p>

        <form onSubmit={enviar} noValidate={false} aria-describedby={error || aviso ? idMsg : undefined}>
          {modo === "registro" && (
            <label className="pp-campo">
              <span>Nombre</span>
              <input ref={nombreRef} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required maxLength={80} />
            </label>
          )}
          <label className="pp-campo">
            <span>Correo</span>
            <input
              ref={emailRef}
              id="pp-auth-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={modo === "registro" ? "email" : "username"}
              aria-invalid={!!error || undefined}
              required
            />
          </label>
          {modo !== "recuperar" && (
            <div className="pp-campo">
              <label htmlFor={`${id}-clave`}><span>Contraseña</span></label>
              <div className="pp-campo__clave">
                <input
                  id={`${id}-clave`}
                  type={verClave ? "text" : "password"}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete={modo === "registro" ? "new-password" : "current-password"}
                  minLength={modo === "registro" ? 8 : undefined}
                  aria-describedby={modo === "registro" ? ayudaClave : undefined}
                  aria-invalid={!!error || undefined}
                  required
                />
                <button type="button" className="pp-campo__ver" aria-pressed={verClave} onClick={() => setVerClave((v) => !v)}>
                  {verClave ? "Ocultar" : "Mostrar"}
                  <span className="pp-sr"> contraseña</span>
                </button>
              </div>
              {modo === "registro" && <small id={ayudaClave}>Mínimo 8 caracteres.</small>}
              {modo === "ingreso" && (
                <button type="button" className="pp-auth__olvide" onClick={() => cambiar("recuperar")}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          )}
          {modo === "registro" && (
            <label className="pp-campo pp-campo--check">
              <input type="checkbox" checked={ofertas} onChange={(e) => setOfertas(e.target.checked)} />
              <span>Quiero recibir ofertas y novedades de Polyplas por correo <small>(opcional · puedo darme de baja cuando quiera)</small></span>
            </label>
          )}

          <div id={idMsg}>
            {error && <p className="pp-auth__msg pp-auth__msg--error" role="alert">{error}</p>}
            {aviso && <p className="pp-auth__msg pp-auth__msg--ok" role="status">{aviso}</p>}
          </div>

          <button type="submit" className="pp-btn pp-btn--primary pp-auth__enviar" disabled={ocupado} aria-busy={ocupado}>
            {ocupado ? "Un momento…" : modo === "registro" ? "Crear cuenta" : modo === "ingreso" ? "Ingresar" : "Enviar enlace"}
          </button>
        </form>

        <div className="pp-auth__pie">
          {modo === "ingreso" && (
            <p>¿Primera vez? <button type="button" onClick={() => cambiar("registro")}>Crea tu cuenta</button></p>
          )}
          {modo === "registro" && (
            <p>¿Ya tienes cuenta? <button type="button" onClick={() => cambiar("ingreso")}>Ingresa aquí</button></p>
          )}
          {modo === "recuperar" && (
            <p><button type="button" onClick={() => cambiar("ingreso")}>← Volver a ingresar</button></p>
          )}
          {modo === "registro" && (
            <p className="pp-auth__legal">Usamos tus datos para gestionar tu cuenta y tus compras, como explica nuestra <a href="/politica-de-privacidad-de-datos/">política de privacidad</a>.</p>
          )}
        </div>
      </div>
    </div>
  );
}
