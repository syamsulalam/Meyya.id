import { auditLog, ensureCommerceSchema } from './_commerce';
import { ensureVoucherSchema } from './_vouchers';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;

  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
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
    const resolvedOrderId = orderId || order.id;

    const existingReview = await env.MEYYA_DB.prepare(`
      SELECT id
      FROM product_reviews
      WHERE product_id = ? AND clerk_id = ? AND order_id = ?
      LIMIT 1
    `).bind(productId, clerkId, resolvedOrderId).first();

    if (existingReview) {
      return new Response(JSON.stringify({ error: 'Produk dari order ini sudah pernah direview.' }), { status: 409 });
    }

    const insertResult = await env.MEYYA_DB.prepare(`
      INSERT INTO product_reviews (product_id, clerk_id, order_id, rating, review_text)
      VALUES (?, ?, ?, ?, ?)
    `).bind(productId, clerkId, resolvedOrderId, rating, reviewText || null).run();

    const reviewId = insertResult?.meta?.last_row_id || (await env.MEYYA_DB.prepare(`
      SELECT id
      FROM product_reviews
      WHERE product_id = ? AND clerk_id = ? AND order_id = ?
      ORDER BY id DESC
      LIMIT 1
    `).bind(productId, clerkId, resolvedOrderId).first())?.id;

    let spinEntitlementId: string | null = null;
    if (reviewId) {
      spinEntitlementId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
      await env.MEYYA_DB.prepare(`
        INSERT OR IGNORE INTO review_spin_entitlements (id, review_id, order_id, product_id, clerk_id, status, expires_at)
        VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?)
      `).bind(spinEntitlementId, reviewId, resolvedOrderId, productId, clerkId, expiresAt).run();
    }

    await auditLog(env, clerkId, 'CREATE_REVIEW', 'product', String(productId), { rating, order_id: resolvedOrderId, review_id: reviewId, spin_entitlement_id: spinEntitlementId });

    return new Response(JSON.stringify({ success: true, review_id: reviewId, spin_entitlement_id: spinEntitlementId }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
