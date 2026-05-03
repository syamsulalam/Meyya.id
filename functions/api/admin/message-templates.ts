import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare('SELECT * FROM message_templates ORDER BY key ASC').all();
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
    const key = String(body.key || '').trim();
    if (!key) return new Response(JSON.stringify({ error: 'Template key is required' }), { status: 400 });

    await env.MEYYA_DB.prepare(`
      INSERT INTO message_templates (key, channel, title, body, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET channel = excluded.channel, title = excluded.title, body = excluded.body, updated_at = CURRENT_TIMESTAMP
    `).bind(key, body.channel || 'WHATSAPP', body.title || key, body.body || '').run();

    await auditLog(env, data?.clerkId || null, 'UPSERT_MESSAGE_TEMPLATE', 'message_template', key, {});

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
