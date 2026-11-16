"use client";

import { useCallback, useEffect, useState } from "react";
import { FormularioCuenta } from "@/components/site/Cuenta";
import { RUTA_CUENTA, mensajeError, sb } from "@/lib/cuenta";
import {
  borrarPendiente, guardarPendiente, leerPendiente, nombreItem, repetirCompra, sePuedeRepetir, whatsappRepetir,
  type ItemCompra as Item, type ResultadoRepetir,
} from "@/lib/repetir";

type Compra = { id: string; orden: string; total: number; entrega: string | null; items: Item[] | null; estado: string; creado_en: string; cliente?: Record<string, unknown> | null };
type Cliente = { email: string; nombre: string; telefono: string };

const clp = (n: number) => "$" + Math.round(n || 0).toLocaleString("es-CL");
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
  // Repetir pedido
  const [pendiente, setPendiente] = useState("");
  const [repitiendo, setRepitiendo] = useState("");
  const [resultado, setResultado] = useState<(ResultadoRepetir & { orden: string }) | null>(null);

  const repetir = useCallback(async (c: Compra) => {
    setRepitiendo(c.orden);
    setResultado(null);
    const r = await repetirCompra(c.orden, c.items, c.cliente);
    setRepitiendo("");
    setResultado({ ...r, orden: c.orden });
  }, []);

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
      c.from("compras").select("id, orden, total, entrega, items, estado, creado_en, cliente").order("creado_en", { ascending: false }),
    ]);
    const pf = perfil.data;
    if (pf) setCliente((v) => ({ ...v, nombre: pf.nombre || v.nombre, telefono: pf.telefono || "" }));
    setCompras((lista.data as Compra[] | null) ?? []);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("recuperar")) setRecuperar(true);
    // Enlace "Repetir este pedido" del correo: se recuerda aunque primero tenga que ingresar o crear la cuenta
    const rep = (q.get("repetir") || "").trim().slice(0, 40);
    if (rep) guardarPendiente(rep);
    setPendiente(leerPendiente());
    if (q.get("error_description") || q.get("error")) setErrorEnlace("El enlace no es válido o ya venció. Pide uno nuevo.");
    cargar()
      .catch(() => setEstado("fuera"))
      .finally(() => {
        // limpia ?code= y otros parámetros de la dirección
        if (window.location.search) window.history.replaceState(null, "", RUTA_CUENTA);
      });
  }, [cargar]);

  // Con la cuenta abierta y las compras cargadas, se repite el pedido que venía del correo
  useEffect(() => {
    if (!pendiente || estado !== "dentro" || compras === null) return;
    const c = compras.find((x) => x.orden === pendiente);
    borrarPendiente();
    setPendiente("");
    if (c) repetir(c);
    else setError(`No encontramos el pedido ${pendiente} en esta cuenta. Si lo compraste con otro correo, ingresa con ese correo o escríbenos por WhatsApp.`);
  }, [pendiente, estado, compras, repetir]);

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
        {pendiente && (
          <p className="pp-auth__msg pp-auth__msg--ok" role="status">
            Para repetir tu pedido <b>{pendiente}</b>, ingresa o crea tu cuenta con el correo que usaste en esa compra.
          </p>
        )}
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

      {resultado && <AvisoRepetir r={resultado} />}

      {compras && compras.length > 0 && (
        <div className="pp-cuenta__tarjeta pp-ultimo">
          <div className="pp-ultimo__info">
            <p className="pp-ultimo__eyebrow">Tu último pedido · {fecha(compras[0].creado_en)}</p>
            <h2>{resumenItems(compras[0].items)}</h2>
            <p className="pp-ultimo__nota">Se agrega a tu carro con el precio y stock de hoy. Puedes cambiarlo antes de pagar.</p>
          </div>
          <BotonRepetir c={compras[0]} repitiendo={repitiendo} onRepetir={repetir} grande />
        </div>
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
                <BotonRepetir c={c} repitiendo={repitiendo} onRepetir={repetir} />
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

/** "Plancha AA 100×200 · 3 mm y 2 productos más" */
function resumenItems(items: Item[] | null): string {
  const lista = (items || []).filter((it) => it.sku !== "DESPACHO" && it.sku !== "EMBALAJE");
  if (!lista.length) return "Pedido";
  const primero = `${nombreItem(lista[0])}${(lista[0].qty || 1) > 1 ? ` × ${lista[0].qty}` : ""}`;
  return lista.length > 1 ? `${primero} y ${lista.length - 1} producto${lista.length > 2 ? "s" : ""} más` : primero;
}

function BotonRepetir({ c, repitiendo, onRepetir, grande = false }: { c: Compra; repitiendo: string; onRepetir: (c: Compra) => void; grande?: boolean }) {
  if (!sePuedeRepetir(c.items)) {
    // Pedidos antiguos sin código de producto: se piden por WhatsApp con el número de pedido
    return (
      <button type="button" className={`pp-btn pp-btn--ghost pp-repetir${grande ? " pp-repetir--grande" : ""}`} onClick={() => whatsappRepetir(c.orden, (c.items || []).map((it) => `${nombreItem(it)} × ${it.qty || 1}`))}>
        Repetir por WhatsApp
      </button>
    );
  }
  const ocupado = repitiendo === c.orden;
  return (
    <button
      type="button"
      className={`pp-btn pp-btn--primary pp-repetir${grande ? " pp-repetir--grande" : ""}`}
      onClick={() => onRepetir(c)}
      disabled={!!repitiendo}
      aria-busy={ocupado}
      aria-label={`Repetir pedido ${c.orden}`}
    >
      {ocupado ? "Agregando al carro…" : "Repetir pedido"}
    </button>
  );
}

function AvisoRepetir({ r }: { r: ResultadoRepetir & { orden: string } }) {
  const abrirCarro = () => (window as unknown as { ppGCOpen?: () => void }).ppGCOpen?.();
  if (r.sinCarro) {
    return <p className="pp-auth__msg pp-auth__msg--error" role="alert">No pudimos abrir el carro. Recarga la página e intenta de nuevo.</p>;
  }
  if (!r.agregados) {
    return (
      <div className="pp-auth__msg pp-auth__msg--error pp-repetir__aviso" role="alert">
        <span>Los productos del pedido {r.orden} no están disponibles hoy para comprar en línea.</span>
        <button type="button" className="pp-cuenta__link" onClick={() => whatsappRepetir(r.orden, r.faltan)}>Pedirlos por WhatsApp</button>
      </div>
    );
  }
  return (
    <div className="pp-auth__msg pp-auth__msg--ok pp-repetir__aviso" role="status">
      <span>
        ✓ Agregamos {r.agregados} producto{r.agregados > 1 ? "s" : ""} del pedido {r.orden} a tu carro.
        {r.faltan.length > 0 && <> No están disponibles hoy: {r.faltan.join(", ")}.</>}
      </span>
      <span className="pp-repetir__acciones">
        <button type="button" className="pp-cuenta__link" onClick={abrirCarro}>Ver carro y pagar</button>
        {r.faltan.length > 0 && <button type="button" className="pp-cuenta__link" onClick={() => whatsappRepetir(r.orden, r.faltan)}>Pedir lo que falta por WhatsApp</button>}
      </span>
    </div>
  );
}
