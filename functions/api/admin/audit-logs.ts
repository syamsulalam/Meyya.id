import { ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);

  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?
    `).bind(limit).all();
    return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
