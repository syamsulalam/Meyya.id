import { ensureCommerceSchema } from './_commerce';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId || null;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json().catch(() => ({}));
    const eventType = String(body.event_type || '').trim().toUpperCase();
    if (!eventType) {
      return new Response(JSON.stringify({ error: 'event_type is required' }), { status: 400 });
    }

    await env.MEYYA_DB.prepare(`
      INSERT INTO user_events (clerk_id, event_type, product_id, order_id, campaign_tag, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      clerkId,
      eventType,
      body.product_id ? Number(body.product_id) : null,
      body.order_id || null,
      body.campaign_tag || null,
      JSON.stringify(body.metadata || {})
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
