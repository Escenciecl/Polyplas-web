"use client";

// Botones de la cabecera (carrito y cuenta) y formulario de ingreso / registro.
import { useEffect, useState } from "react";
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

export function AccionesCabecera() {
  const usuario = useUsuario();
  const cantidad = useCantidadCarrito();
  const [modal, setModal] = useState(false);

  useEffect(() => {
    vincularPagoConCuenta();
  }, []);

  useEffect(() => {
    if (!modal) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setModal(false);
    document.addEventListener("keydown", esc);
    document.documentElement.classList.add("pp-no-scroll");
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.classList.remove("pp-no-scroll");
    };
  }, [modal]);

  const abrirCarrito = () => (window as unknown as { ppGCOpen?: () => void }).ppGCOpen?.();
  const enCuenta = typeof window !== "undefined" && window.location.pathname.startsWith(RUTA_CUENTA);

  return (
    <div className="pp-mainbar__actions">
      <button type="button" className="pp-accion" onClick={abrirCarrito} aria-label={`Ver carrito, ${cantidad} producto(s)`}>
        <span className="pp-accion__icono">
          {IconoCarrito}
          {cantidad > 0 && <i className="pp-accion__num">{cantidad}</i>}
        </span>
        <span className="pp-accion__txt">Carrito</span>
      </button>

      {usuario ? (
        <a className="pp-btn pp-btn--cta pp-btn--cuenta" href={RUTA_CUENTA} title={usuario.email}>
          {IconoUsuario}
          <span>Mi cuenta</span>
        </a>
      ) : (
        <button
          type="button"
          className="pp-btn pp-btn--cta pp-btn--cuenta"
          onClick={() => (enCuenta ? document.getElementById("pp-auth-email")?.focus() : setModal(true))}
        >
          {IconoUsuario}
          <span>Crear cuenta</span>
        </button>
      )}

      {modal && !usuario && (
        <div className="pp-modal" role="dialog" aria-modal="true" aria-label="Crear cuenta o ingresar">
          <div className="pp-modal__bg" onClick={() => setModal(false)} />
          <div className="pp-modal__caja">
            <button type="button" className="pp-modal__cerrar" aria-label="Cerrar" onClick={() => setModal(false)}>×</button>
            <FormularioCuenta inicial="registro" onListo={() => setModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

type Modo = "registro" | "ingreso" | "recuperar";

export function FormularioCuenta({ inicial = "ingreso", onListo }: { inicial?: Modo; onListo?: () => void }) {
  const [modo, setModo] = useState<Modo>(inicial);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    setError("");
    setAviso("");
  }, [modo]);

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
        if (error) return setError(mensajeError(error));
        // Supabase no revela si el correo ya existe: devuelve un usuario sin identidades
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          return setError("Ya existe una cuenta con ese correo. Ingresa con tu contraseña.");
        }
        if (!data.session) {
          setClave("");
          return setAviso("¡Listo! Te enviamos un correo para confirmar tu cuenta. Ábrelo y haz clic en el enlace.");
        }
        return onListo?.();
      }
      const { error } = await auth.signInWithPassword({ email: email.trim(), password: clave });
      if (error) return setError(mensajeError(error));
      onListo?.();
    } catch {
      setError("No pudimos conectar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  };

  const titulo = modo === "registro" ? "Crea tu cuenta" : modo === "ingreso" ? "Ingresa a tu cuenta" : "Recuperar contraseña";

  return (
    <div className="pp-auth">
      <h2 className="pp-auth__titulo">{titulo}</h2>
      {modo !== "recuperar" && <p className="pp-auth__bajada">Guarda tus compras y revisa tus pedidos cuando quieras.</p>}

      <form onSubmit={enviar}>
        {modo === "registro" && (
          <label className="pp-campo">
            <span>Nombre</span>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required maxLength={80} />
          </label>
        )}
        <label className="pp-campo">
          <span>Correo</span>
          <input id="pp-auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        {modo !== "recuperar" && (
          <label className="pp-campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete={modo === "registro" ? "new-password" : "current-password"}
              minLength={modo === "registro" ? 8 : undefined}
              required
            />
            {modo === "registro" && <small>Mínimo 8 caracteres.</small>}
          </label>
        )}

        {error && <p className="pp-auth__msg pp-auth__msg--error" role="alert">{error}</p>}
        {aviso && <p className="pp-auth__msg pp-auth__msg--ok" role="status">{aviso}</p>}

        <button type="submit" className="pp-btn pp-btn--primary pp-auth__enviar" disabled={ocupado}>
          {ocupado ? "Un momento…" : modo === "registro" ? "Crear cuenta" : modo === "ingreso" ? "Ingresar" : "Enviar enlace"}
        </button>
      </form>

      <div className="pp-auth__pie">
        {modo === "registro" && (
          <p>¿Ya tienes cuenta? <button type="button" onClick={() => setModo("ingreso")}>Ingresar</button></p>
        )}
        {modo === "ingreso" && (
          <>
            <p><button type="button" onClick={() => setModo("recuperar")}>Olvidé mi contraseña</button></p>
            <p>¿No tienes cuenta? <button type="button" onClick={() => setModo("registro")}>Crear cuenta</button></p>
          </>
        )}
        {modo === "recuperar" && (
          <p><button type="button" onClick={() => setModo("ingreso")}>← Volver a ingresar</button></p>
        )}
        {modo === "registro" && (
          <p className="pp-auth__legal">Al crear tu cuenta aceptas nuestra <a href="/politica-de-privacidad-de-datos/">política de privacidad</a>.</p>
        )}
      </div>
    </div>
  );
}
