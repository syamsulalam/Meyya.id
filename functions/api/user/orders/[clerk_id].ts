export async function onRequestGet(context: any) {
  const { env, params } = context;
  const clerk_id = params.clerk_id;
  try {
    const { results: orders } = await env.MEYYA_DB.prepare(
      `SELECT * FROM orders WHERE clerk_id = ? ORDER BY created_at DESC`
    ).bind(clerk_id).all();

    const { results: items } = await env.MEYYA_DB.prepare(
      `SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE clerk_id = ?)`
    ).bind(clerk_id).all();

    const formattedOrders = orders.map((order: any) => ({
      ...order,
      items: items.filter((item: any) => item.order_id === order.id)
    }));

    return new Response(JSON.stringify(formattedOrders), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
