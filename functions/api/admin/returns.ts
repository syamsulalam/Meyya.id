import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT rr.*, u.email, COALESCE(u.first_name || ' ' || u.last_name, u.email) AS customer_name
      FROM return_requests rr
      LEFT JOIN users u ON u.clerk_id = rr.clerk_id
      ORDER BY rr.created_at DESC
    `).all();
    return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPut(context: any) {
  const { env, request, data } = context;
  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || '').toUpperCase();
    if (!id || !['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid return request update' }), { status: 400 });
    }

    await env.MEYYA_DB.prepare(`
      UPDATE return_requests SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, body.admin_note || null, id).run();

    await auditLog(env, data?.clerkId || null, 'UPDATE_RETURN_REQUEST', 'return_request', String(id), { status });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
