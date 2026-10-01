/** GET /diagrama/<id>.png — imagen del diagrama de corte que aparece en el correo del comprobante. */
export async function onRequestGet({ params, env }) {
  const id = String(params.id || "").replace(/\.png$/, "");
  if (!/^[a-f0-9]{32}$/.test(id) || !env.ORDERS) return new Response("No encontrado", { status: 404 });
  const img = await env.ORDERS.get(`img:${id}`, "arrayBuffer");
  if (!img) return new Response("No encontrado", { status: 404 });
  return new Response(img, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex",
    },
  });
}
