/**
 * POST /wp-json/polyplas/v1/eliminar-cuenta   (Authorization: Bearer <token de la sesión>)
 * Body: { confirmacion: "ELIMINAR" }
 *
 * El cliente elimina su propia cuenta desde Mi cuenta (Ley 21.719, derecho de supresión).
 *  1. Valida la sesión contra Supabase (nunca se confía en un id enviado por el navegador).
 *  2. No permite eliminar cuentas del equipo (perderían el acceso al panel).
 *  3. Deja constancia en solicitudes_derechos (supresión, respondida al instante, autoservicio).
 *  4. Borra el usuario en Supabase Auth → se borra su fila en "clientes" (cascade).
 *     Las compras NO se borran: quedan sin cuenta (user_id = null) porque las ventas
 *     deben conservarse por obligación tributaria.
 *  5. Envía confirmación al cliente y aviso al correo de privacidad.
 */
import { usuarioDesdeToken } from "../../../_lib/webpay.js";
import {
  ORIGENES_PERMITIDOS, CORREO_PRIVACIDAD_DEFECTO, llave, insertar, enviarCorreo, esc,
} from "../../../_lib/privacidad.js";

const SUPABASE = "https://gdrkscedvkjtcvexnhzg.supabase.co";

const responder = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

export async function onRequestPost({ request, env }) {
  const o = request.headers.get("Origin") || "";
  if (o && !ORIGENES_PERMITIDOS.includes(o)) return responder({ ok: false }, 403);

  let p;
  try { p = await request.json(); } catch { return responder({ ok: false, message: "JSON inválido" }, 400); }
  if (!p || String(p.confirmacion || "").trim().toUpperCase() !== "ELIMINAR") {
    return responder({ ok: false, message: "Falta la confirmación" }, 400);
  }

  const usuario = await usuarioDesdeToken(request);
  if (!usuario) return responder({ ok: false, message: "Tu sesión expiró. Vuelve a ingresar e intenta de nuevo." }, 401);

  try {
    const k = llave(env);
    const h = { apikey: k, Authorization: `Bearer ${k}` };

    // Cuentas del equipo: no se eliminan desde aquí
    const eq = await fetch(`${SUPABASE}/rest/v1/equipo?user_id=eq.${usuario.id}&select=user_id`, { headers: h });
    if (eq.ok && (await eq.json()).length) {
      return responder({ ok: false, message: "Esta cuenta es del equipo Polyplas y no se puede eliminar desde aquí." }, 403);
    }

    // Nombre para la constancia y el correo
    let nombre = "";
    const cl = await fetch(`${SUPABASE}/rest/v1/clientes?id=eq.${usuario.id}&select=nombre`, { headers: h });
    if (cl.ok) nombre = String(((await cl.json())[0] || {}).nombre || "").slice(0, 120);
    const email = String(usuario.email || "").toLowerCase().slice(0, 160);

    // 1) Constancia (antes de borrar, para que quede aunque falle lo demás)
    const folio = "DER-" + crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    const ahora = new Date();
    await insertar(env, "solicitudes_derechos", {
      folio,
      nombre: nombre || email.split("@")[0] || "Cliente",
      email,
      derecho: "supresion",
      detalle: "Eliminó su cuenta desde Mi cuenta (autoservicio). Se borró la cuenta y sus datos de perfil; las compras se conservan sin cuenta por obligación tributaria.",
      plazo_respuesta: new Date(ahora.getTime() + 30 * 864e5).toISOString().slice(0, 10),
      estado: "respondida",
      identidad_verificada: true,
      respondida_en: ahora.toISOString(),
      respuesta: "Cuenta eliminada al instante por el titular con su sesión iniciada.",
      responsable: "autoservicio",
    });

    // 2) Borrar el usuario (clientes se borra en cascada; compras quedan con user_id = null)
    const del = await fetch(`${SUPABASE}/auth/v1/admin/users/${usuario.id}`, { method: "DELETE", headers: h });
    if (!del.ok) throw new Error(`auth delete ${del.status} ${(await del.text()).slice(0, 200)}`);

    // 3) Correos (si fallan, la cuenta ya está eliminada igual)
    const privacidad = String(env.CORREO_PRIVACIDAD || CORREO_PRIVACIDAD_DEFECTO).trim();
    if (email) {
      await enviarCorreo(env, {
        to: email,
        replyTo: privacidad,
        subject: `Eliminamos tu cuenta · Polyplas (${folio})`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5">
          <p>Hola${nombre ? " " + esc(nombre) : ""}:</p>
          <p>Eliminamos tu cuenta de polyplas.cl como pediste. Folio: <b>${folio}</b>.</p>
          <p>Borramos tu acceso y los datos de tu perfil. Los registros de tus compras se conservan solo para cumplir obligaciones tributarias (boletas y facturas).</p>
          <p>Puedes volver a comprar o crear una cuenta cuando quieras. Si no fuiste tú, responde este correo.</p>
          <p>Polyplas</p></div>`,
      });
    }
    await enviarCorreo(env, {
      to: privacidad,
      subject: `Cuenta eliminada por el cliente ${folio}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
        <p>Un cliente eliminó su cuenta desde Mi cuenta (Ley 21.719, supresión).</p>
        <p>Folio <b>${folio}</b> · ${esc(email)}. Ya quedó registrada como respondida en solicitudes_derechos.</p>
        <p>Si el correo está en la lista de ofertas de Brevo, revisar si también pidió dejar de recibirlas.</p></div>`,
    });

    return responder({ ok: true, folio });
  } catch (e) {
    console.log("[Polyplas cuentas] eliminar-cuenta", String(e));
    return responder({ ok: false, message: "No pudimos eliminar tu cuenta. Intenta de nuevo o escríbenos." }, 502);
  }
}

export const onRequest = () => responder({ ok: false, message: "Usa POST" }, 405);
