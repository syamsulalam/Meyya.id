export async function onRequestGet(context: any) {
  const { env, params } = context;
  const id = params.id;

  try {
    const order = await env.MEYYA_DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    const items = await env.MEYYA_DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(id).all();
    
    return new Response(JSON.stringify({ ...order, items: items.results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
