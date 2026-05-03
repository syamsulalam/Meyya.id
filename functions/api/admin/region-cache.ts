import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const stats = await env.MEYYA_DB.prepare(`
      SELECT COUNT(*) AS total, MAX(cached_at) AS last_cached_at FROM region_cache
    `).first();
    return new Response(JSON.stringify(stats || { total: 0 }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, data } = context;
  try {
    await ensureCommerceSchema(env);
    await env.MEYYA_DB.prepare('DELETE FROM region_cache').run();
    await auditLog(env, data?.clerkId || null, 'CLEAR_REGION_CACHE', 'region_cache', 'all', {});
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
