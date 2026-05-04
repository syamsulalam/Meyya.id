import { ensureCommerceSchema } from '../_commerce';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json().catch(() => ({}));
    const eventType = String(body.event_type || '').trim().toUpperCase();
    const targetClerkId = String(body.target_clerk_id || '').trim();
    if (!eventType || !targetClerkId) {
      return new Response(JSON.stringify({ error: 'event_type and target_clerk_id are required' }), { status: 400 });
    }

    await env.MEYYA_DB.prepare(`
      INSERT INTO user_events (clerk_id, event_type, product_id, order_id, campaign_tag, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      targetClerkId,
      eventType,
      body.product_id ? Number(body.product_id) : null,
      body.order_id || null,
      body.campaign_tag || null,
      JSON.stringify({
        ...(body.metadata || {}),
        actor_clerk_id: data?.clerkId || null,
      })
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
