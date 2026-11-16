"use client";

import { useCallback, useEffect, useState } from "react";
import { FormularioCuenta } from "@/components/site/Cuenta";
import { RUTA_CUENTA, mensajeError, sb } from "@/lib/cuenta";

type Item = { nombre?: string; qty?: number; subtotal?: number; tipo?: string; dim?: string; color?: string; espesor?: string; precio?: number };
type Compra = { id: string; orden: string; total: number; entrega: string | null; items: Item[] | null; estado: string; creado_en: string };
type Cliente = { email: string; nombre: string; telefono: string };

const clp = (n: number) => "$" + Math.round(n || 0).toLocaleString("es-CL");
// Pedidos antiguos del cotizador no traen "nombre": se arma con tipo, medida, color y espesor.
const nombreItem = (it: Item) => it.nombre || [it.tipo, it.dim, it.color, it.espesor].filter(Boolean).join(" · ") || "Producto";
const subtotalItem = (it: Item) => it.subtotal || (it.precio || 0) * (it.qty || 1);
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

export default function PanelCuenta() {
  const [estado, setEstado] = useState<"cargando" | "fuera" | "dentro">("cargando");
  const [cliente, setCliente] = useState<Cliente>({ email: "", nombre: "", telefono: "" });
  const [compras, setCompras] = useState<Compra[] | null>(null);
  const [recuperar, setRecuperar] = useState(false);
  const [errorEnlace, setErrorEnlace] = useState("");
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");

  const cargar = useCallback(async () => {
    const c = await sb();
    // getSession espera a que termine el regreso desde el enlace del correo (?code=...)
    const { data } = await c.auth.getSession();
    const user = data.session?.user;
    if (!user) return setEstado("fuera");
    const meta = (user.user_metadata || {}) as Record<string, string>;
    setCliente({ email: user.email || "", nombre: meta.nombre || meta.full_name || meta.name || "", telefono: "" });
    setEstado("dentro");
    // Suma a la cuenta las compras hechas antes como invitado con el mismo correo (solo con correo confirmado).
    try {
      const { data: nuevas } = await c.rpc("pp_vincular_mis_compras");
      if (typeof nuevas === "number" && nuevas > 0) {
        setAviso(nuevas === 1 ? "Encontramos 1 compra anterior hecha con tu correo y la sumamos a tu cuenta." : `Encontramos ${nuevas} compras anteriores hechas con tu correo y las sumamos a tu cuenta.`);
      }
    } catch { /* si falla, se muestran las compras que ya estaban */ }
    const [perfil, lista] = await Promise.all([
      c.from("clientes").select("nombre, telefono").eq("id", user.id).maybeSingle(),
      c.from("compras").select("id, orden, total, entrega, items, estado, creado_en").order("creado_en", { ascending: false }),
    ]);
    const pf = perfil.data;
    if (pf) setCliente((v) => ({ ...v, nombre: pf.nombre || v.nombre, telefono: pf.telefono || "" }));
    setCompras((lista.data as Compra[] | null) ?? []);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("recuperar")) setRecuperar(true);
    if (q.get("error_description") || q.get("error")) setErrorEnlace("El enlace no es válido o ya venció. Pide uno nuevo.");
    cargar()
      .catch(() => setEstado("fuera"))
      .finally(() => {
        // limpia ?code= y otros parámetros de la dirección
        if (window.location.search) window.history.replaceState(null, "", RUTA_CUENTA);
      });
  }, [cargar]);

  const guardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setAviso("");
    setError("");
    const c = await sb();
    const { data } = await c.auth.getSession();
    const id = data.session?.user.id;
    const r = id
      ? await c.from("clientes").update({ nombre: cliente.nombre.trim(), telefono: cliente.telefono.trim() }).eq("id", id)
      : { error: { message: "sin sesión" } };
    setGuardando(false);
    if (r.error) setError("No pudimos guardar tus datos. Intenta de nuevo.");
    else setAviso("Datos guardados.");
  };

  const cambiarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAviso("");
    if (nuevaClave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    setGuardando(true);
    const { error } = await (await sb()).auth.updateUser({ password: nuevaClave });
    setGuardando(false);
    if (error) return setError(mensajeError(error));
    setNuevaClave("");
    setRecuperar(false);
    setAviso("Tu contraseña fue actualizada.");
  };

  const salir = async () => {
    await (await sb()).auth.signOut();
    window.location.assign("/");
  };

  if (estado === "cargando") {
    return <section className="pp-cuenta"><p className="pp-cuenta__cargando">Cargando tu cuenta…</p></section>;
  }

  if (estado === "fuera") {
    return (
      <section className="pp-cuenta pp-cuenta--form">
        {errorEnlace && <p className="pp-auth__msg pp-auth__msg--error" role="alert">{errorEnlace}</p>}
        <div className="pp-cuenta__tarjeta">
          <FormularioCuenta inicial="ingreso" onListo={cargar} />
        </div>
      </section>
    );
  }

  return (
    <section className="pp-cuenta">
      <header className="pp-cuenta__cab">
        <div>
          <h1>Hola{cliente.nombre ? `, ${cliente.nombre.split(" ")[0]}` : ""}</h1>
          <p>{cliente.email}</p>
        </div>
        <button type="button" className="pp-btn pp-btn--ghost" onClick={salir}>Cerrar sesión</button>
      </header>

      {error && <p className="pp-auth__msg pp-auth__msg--error" role="alert">{error}</p>}
      {aviso && <p className="pp-auth__msg pp-auth__msg--ok" role="status">{aviso}</p>}

      {recuperar && (
        <form className="pp-cuenta__tarjeta" onSubmit={cambiarClave}>
          <h2>Crea tu nueva contraseña</h2>
          <label className="pp-campo">
            <span>Nueva contraseña</span>
            <input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} autoComplete="new-password" minLength={8} required />
            <small>Mínimo 8 caracteres.</small>
          </label>
          <button type="submit" className="pp-btn pp-btn--primary" disabled={guardando}>Guardar contraseña</button>
        </form>
      )}

      <div className="pp-cuenta__cols">
        <div className="pp-cuenta__tarjeta">
          <h2>Mis compras</h2>
          {compras === null && <p className="pp-cuenta__vacio">Cargando…</p>}
          {compras?.length === 0 && (
            <p className="pp-cuenta__vacio">
              Aún no tienes compras guardadas. Aquí aparecerán las compras que hagas con este correo, también las que pagues sin iniciar sesión.
            </p>
          )}
          <ul className="pp-compras">
            {compras?.map((c) => (
              <li key={c.id}>
                <div className="pp-compras__cab">
                  <b>Pedido {c.orden}</b>
                  <span>{fecha(c.creado_en)}</span>
                  <strong>{clp(c.total)}</strong>
                </div>
                <ul>
                  {(c.items || []).map((it, i) => (
                    <li key={i}>
                      <span>{nombreItem(it)} × {it.qty || 1}</span>
                      <span>{clp(subtotalItem(it))}</span>
                    </li>
                  ))}
                </ul>
                {c.entrega && <p>Entrega: {c.entrega}</p>}
              </li>
            ))}
          </ul>
        </div>

        <form className="pp-cuenta__tarjeta" onSubmit={guardarDatos}>
          <h2>Mis datos</h2>
          <label className="pp-campo">
            <span>Nombre</span>
            <input type="text" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} autoComplete="name" maxLength={80} />
          </label>
          <label className="pp-campo">
            <span>Teléfono</span>
            <input type="tel" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} autoComplete="tel" maxLength={20} placeholder="+56 9 1234 5678" />
          </label>
          <label className="pp-campo">
            <span>Correo</span>
            <input type="email" value={cliente.email} disabled />
          </label>
          <button type="submit" className="pp-btn pp-btn--primary" disabled={guardando}>Guardar</button>
          {!recuperar && (
            <button type="button" className="pp-cuenta__link" onClick={() => setRecuperar(true)}>Cambiar contraseña</button>
          )}
        </form>
      </div>
    </section>
  );
}
