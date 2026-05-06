import { ensureCommerceSchema, expirePendingOrders } from '../../_commerce';

export async function onRequestGet(context: any) {
  const { env, params, data } = context;
  const clerk_id = params.clerk_id;
  const reqClerkId = data?.clerkId;
  
  if (!reqClerkId || clerk_id !== reqClerkId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    await ensureCommerceSchema(env);
    await expirePendingOrders(env);
    const { results: orders } = await env.MEYYA_DB.prepare(
      `SELECT * FROM orders WHERE clerk_id = ? ORDER BY created_at DESC`
    ).bind(clerk_id).all();

    const { results: items } = await env.MEYYA_DB.prepare(`
      SELECT
        oi.*,
        p.slug AS product_slug,
        p.image_url AS product_image_url,
        pr.id AS review_id
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN product_reviews pr
        ON pr.order_id = oi.order_id
        AND pr.product_id = oi.product_id
        AND pr.clerk_id = ?
      WHERE oi.order_id IN (SELECT id FROM orders WHERE clerk_id = ?)
    `).bind(clerk_id, clerk_id).all();

    const formattedOrders = orders.map((order: any) => ({
      ...order,
      items: items.filter((item: any) => item.order_id === order.id)
    }));

    return new Response(JSON.stringify(formattedOrders), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
