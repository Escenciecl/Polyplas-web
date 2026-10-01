/**
 * GET /admin/rechazos?key=ADMIN_KEY
 * Dashboard de pagos rechazados. Requiere la variable de entorno ADMIN_KEY en Cloudflare.
 */

const SUPABASE_URL = "https://gdrkscedvkjtcvexnhzg.supabase.co/rest/v1";
const SUPABASE_KEY = "sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc";

const TBK_CODES = {
  "-1": "Rechazo genérico",
  "-2": "Transacción ya reversada",
  "-3": "Error en transacción",
  "-4": "Rechazo sin comisión",
  "-5": "Error de tasa",
  "-6": "Excede cupo mensual",
  "-7": "Excede límite diario",
  "-8": "Rubro no autorizado",
  "1":  "Rechazo del banco",
  "2":  "Tarjeta bloqueada",
  "5":  "Rechazado por fraude",
  "6":  "Reintentos excedidos",
};

function tbkLabel(code) {
  const c = String(code ?? "");
  return TBK_CODES[c] ? `${c} — ${TBK_CODES[c]}` : c || "—";
}

function clp(n) {
  return "$ " + (parseInt(n) || 0).toLocaleString("es-CL");
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function html(rechazos) {
  const rows = rechazos.length === 0
    ? `<tr><td colspan="7" style="text-align:center;padding:32px;color:#888">Sin rechazos registrados</td></tr>`
    : rechazos.map((r) => {
        const m = r.metadata || {};
        const items = (m.items || []).map(
          (it) => `${it.tipo || it.nombre || ""}${it.dim ? " " + it.dim : ""}${it.espesor ? " " + it.espesor : ""} ×${parseInt(it.qty ?? 1)}`
        ).join("<br>");
        const badge = `<span style="background:#fee2e2;color:#991b1b;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap">${tbkLabel(m.tbk_response_code)}</span>`;
        return `<tr>
          <td style="white-space:nowrap">${formatDate(r.last_message_at)}</td>
          <td>${r.client_name || "—"}<br><small style="color:#888">${m.rut || ""}</small></td>
          <td><a href="mailto:${r.client_email || ""}" style="color:#1d4ed8">${r.client_email || "—"}</a><br><small style="color:#888">${m.phone || ""}</small></td>
          <td style="white-space:nowrap;font-weight:600">${clp(m.total)}</td>
          <td style="font-size:12px;color:#444">${items || "—"}</td>
          <td>${badge}</td>
          <td style="font-size:11px;color:#aaa">${m.tbk_buy_order || "—"}</td>
        </tr>`;
      }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Polyplas — Pagos Rechazados</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
  header { background: #004a99; color: #fff; padding: 20px 32px; display: flex; align-items: center; gap: 16px; }
  header h1 { font-size: 1.1rem; font-weight: 700; letter-spacing: 0.5px; }
  header span { background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 12px; font-size: 12px; }
  .wrap { padding: 28px 24px; max-width: 1280px; margin: 0 auto; }
  .stat-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { background: #fff; border-radius: 12px; padding: 18px 24px; flex: 1; min-width: 160px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 6px; }
  .stat-val { font-size: 1.8rem; font-weight: 700; color: #dc2626; }
  .stat-val.blue { color: #004a99; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 12px 14px; text-align: left; font-size: 11px;
       text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 13px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
  @media (max-width: 768px) {
    .wrap { padding: 16px 12px; }
    table { font-size: 12px; }
    th, td { padding: 10px 8px; }
  }
</style>
</head>
<body>
<header>
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
  <h1>Polyplas — Monitor de Pagos</h1>
  <span>Rechazos Transbank</span>
</header>
<div class="wrap">
  <div class="stat-row">
    <div class="stat">
      <div class="stat-label">Total rechazos</div>
      <div class="stat-val">${rechazos.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Monto no cobrado</div>
      <div class="stat-val blue">${clp(rechazos.reduce((s, r) => s + (parseInt((r.metadata || {}).total) || 0), 0))}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Última actualización</div>
      <div class="stat-val" style="font-size:1rem;margin-top:4px;color:#334155">${formatDate(new Date().toISOString())}</div>
    </div>
  </div>
  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Contacto</th>
          <th>Monto</th>
          <th>Productos</th>
          <th>Motivo</th>
          <th>Orden TBK</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>
</body>
</html>`;
}

export async function onRequest({ request, env }) {
  const key = new URL(request.url).searchParams.get("key") || "";
  const adminKey = env.ADMIN_KEY || "";

  if (!adminKey || key !== adminKey) {
    return new Response("Acceso no autorizado", { status: 401 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/conversations?metadata->>source=eq.order_rechazado&order=last_message_at.desc&limit=200&select=client_name,client_email,last_message_at,metadata`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );

  if (!res.ok) {
    return new Response("Error consultando Supabase: " + res.status, { status: 502 });
  }

  const rechazos = await res.json();
  return new Response(html(rechazos), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
