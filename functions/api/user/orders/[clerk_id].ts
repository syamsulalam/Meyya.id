export async function onRequestGet(context: any) {
  const { env, params, data } = context;
  const clerk_id = params.clerk_id;
  const reqClerkId = data?.clerkId;
  
  if (!reqClerkId || clerk_id !== reqClerkId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

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
