import { ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env, data } = context;
  const clerkId = data?.clerkId;
  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT w.product_id, p.*
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ? AND p.deleted_at IS NULL
      ORDER BY w.created_at DESC
    `).bind(clerkId).all();
    return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;
  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const productIds = Array.isArray(body.product_ids)
      ? body.product_ids.map((id: any) => Number(id)).filter(Boolean)
      : [Number(body.product_id)].filter(Boolean);

    if (productIds.length === 0) return new Response(JSON.stringify({ error: 'No product id provided' }), { status: 400 });

    const statements = productIds.map((productId: number) =>
      env.MEYYA_DB.prepare(`
        INSERT INTO wishlists (user_id, product_id, created_at)
        SELECT ?, ?, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?)
      `).bind(clerkId, productId, clerkId, productId)
    );
    await env.MEYYA_DB.batch(statements);

    return onRequestGet(context);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;
  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    const url = new URL(request.url);
    const productId = Number(url.searchParams.get('product_id'));
    if (!productId) return new Response(JSON.stringify({ error: 'product_id is required' }), { status: 400 });

    await env.MEYYA_DB.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').bind(clerkId, productId).run();
    return onRequestGet(context);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
