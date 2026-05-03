import { ensureCommerceSchema, expirePendingOrders } from '../../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureCommerceSchema(env);
    await expirePendingOrders(env);
    const orders = await env.MEYYA_DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    const results = orders.results || [];

    // Optional: fetch items for each order
    const enrichedOrders = await Promise.all(results.map(async (o: any) => {
       const items = await env.MEYYA_DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(o.id).all();
       return { ...o, items: items.results || [] };
    }));

    return new Response(JSON.stringify(enrichedOrders), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
