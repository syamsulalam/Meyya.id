import { auditLog, ensureCommerceSchema } from './_commerce';

export async function onRequestGet(context: any) {
  const { env, data } = context;
  const clerkId = data?.clerkId;
  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT * FROM return_requests WHERE clerk_id = ? ORDER BY created_at DESC
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
    const orderId = String(body.order_id || '');
    const type = String(body.type || 'RETURN').toUpperCase();
    const reason = String(body.reason || '').trim();

    if (!orderId || !reason) return new Response(JSON.stringify({ error: 'Order and reason are required' }), { status: 400 });
    if (!['RETURN', 'EXCHANGE'].includes(type)) return new Response(JSON.stringify({ error: 'Invalid request type' }), { status: 400 });

    const order = await env.MEYYA_DB.prepare(`
      SELECT id FROM orders WHERE id = ? AND clerk_id = ? AND status IN ('COMPLETED', 'SELESAI')
    `).bind(orderId, clerkId).first();
    if (!order) return new Response(JSON.stringify({ error: 'Return/exchange is available after order completion' }), { status: 400 });

    await env.MEYYA_DB.prepare(`
      INSERT INTO return_requests (order_id, clerk_id, type, reason)
      VALUES (?, ?, ?, ?)
    `).bind(orderId, clerkId, type, reason).run();

    await auditLog(env, clerkId, 'CREATE_RETURN_REQUEST', 'order', orderId, { type });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
