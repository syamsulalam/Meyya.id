import { auditLog, ensureCommerceSchema } from './_commerce';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;

  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const productId = Number(body.product_id);
    const rating = Number(body.rating);
    const reviewText = String(body.review_text || '').trim();
    const orderId = body.order_id ? String(body.order_id) : null;

    if (!productId || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Invalid review data' }), { status: 400 });
    }

    const order = orderId
      ? await env.MEYYA_DB.prepare(`
        SELECT o.id FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.id = ? AND o.clerk_id = ? AND oi.product_id = ? AND o.status IN ('COMPLETED', 'SELESAI')
      `).bind(orderId, clerkId, productId).first()
      : await env.MEYYA_DB.prepare(`
        SELECT o.id FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.clerk_id = ? AND oi.product_id = ? AND o.status IN ('COMPLETED', 'SELESAI')
        ORDER BY o.completed_at DESC, o.created_at DESC LIMIT 1
      `).bind(clerkId, productId).first();

    if (!order) return new Response(JSON.stringify({ error: 'Review tersedia setelah order produk ini selesai.' }), { status: 400 });

    await env.MEYYA_DB.prepare(`
      INSERT INTO product_reviews (product_id, clerk_id, order_id, rating, review_text)
      VALUES (?, ?, ?, ?, ?)
    `).bind(productId, clerkId, orderId || order.id, rating, reviewText || null).run();

    await auditLog(env, clerkId, 'CREATE_REVIEW', 'product', String(productId), { rating, order_id: orderId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
