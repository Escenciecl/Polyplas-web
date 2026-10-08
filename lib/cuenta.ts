/**
 * Cuentas de clientes (Supabase Auth): ingreso con Google o con correo y contraseña.
 *
 * - La librería de Supabase se descarga solo cuando hace falta (no frena la carga de la página).
 * - La sesión se guarda con una llave propia ("pp-cuenta-auth") para NO mezclarse con el chat y
 *   los cotizadores, que siguen funcionando como visitante anónimo igual que antes.
 * - Las contraseñas las guarda Supabase cifradas; el sitio nunca las ve ni las almacena.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const SB_URL = "https://gdrkscedvkjtcvexnhzg.supabase.co";
// Llave pública (publishable): la misma que ya usa el chat en el navegador.
const SB_KEY = "sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc";
const STORAGE_KEY = "pp-cuenta-auth";
export const EVENTO_CUENTA = "pp-cuenta";
export const RUTA_CUENTA = "/cuenta/";

export type UsuarioBasico = { id: string; email: string; nombre: string };

let cliente: Promise<SupabaseClient> | null = null;

export function sb(): Promise<SupabaseClient> {
  return (cliente ??= import("@supabase/supabase-js").then(({ createClient }) => {
    const c = createClient(SB_URL, SB_KEY, {
      auth: { storageKey: STORAGE_KEY, flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    c.auth.onAuthStateChange(() => window.dispatchEvent(new Event(EVENTO_CUENTA)));
    return c;
  }));
}

const nombreDe = (meta: Record<string, unknown> | undefined, email: string) =>
  String(meta?.nombre || meta?.full_name || meta?.name || email.split("@")[0] || "");

/** Lee la sesión guardada sin descargar la librería (para pintar la cabecera al instante). */
export function usuarioGuardado(): UsuarioBasico | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const u = raw ? JSON.parse(raw)?.user : null;
    if (!u?.id) return null;
    return { id: u.id, email: u.email || "", nombre: nombreDe(u.user_metadata, u.email || "") };
  } catch {
    return null;
  }
}

/**
 * Al pagar, adjunta la sesión del cliente al pedido (/webpay-init) para que la compra quede
 * guardada en su cuenta. Funciona con el carrito y con todos los cotizadores, sin tocarlos.
 */
export function vincularPagoConCuenta() {
  const w = window as unknown as { __ppPagoCuenta?: boolean };
  if (w.__ppPagoCuenta) return;
  w.__ppPagoCuenta = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/wp-json/polyplas/v1/webpay-init") && usuarioGuardado()) {
        const { data } = await (await sb()).auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          const headers = new Headers(init?.headers);
          headers.set("Authorization", `Bearer ${token}`);
          return original(input, { ...init, headers });
        }
      }
    } catch {
      /* si algo falla, el pago sigue igual (solo no queda asociado a la cuenta) */
    }
    return original(input, init);
  };
}

/** Mensajes de Supabase en español. */
export function mensajeError(e: { message?: string; code?: string } | null | undefined): string {
  const m = (e?.message || "").toLowerCase();
  const c = e?.code || "";
  if (c === "invalid_credentials" || m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (c === "email_not_confirmed" || m.includes("not confirmed")) return "Aún no confirmas tu correo. Revisa tu bandeja de entrada.";
  if (c === "user_already_exists" || m.includes("already registered")) return "Ya existe una cuenta con ese correo. Ingresa con tu contraseña.";
  if (c === "weak_password" || m.includes("password should")) return "La contraseña es muy débil. Usa al menos 8 caracteres.";
  if (c === "same_password") return "La nueva contraseña debe ser distinta a la anterior.";
  if (c.includes("rate_limit") || m.includes("rate limit") || m.includes("security purposes")) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  if (m.includes("provider is not enabled")) return "El ingreso con Google aún no está activado.";
  return "No pudimos completar la acción. Intenta de nuevo.";
}
