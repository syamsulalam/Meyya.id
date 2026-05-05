import { ensureCommerceSchema } from '../_commerce';
import { cleanText, normalizeAnalyticsEvent, updateAnalyticsAggregates } from '../_analytics';

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
    const analytics = normalizeAnalyticsEvent({
      ...body,
      metadata: {
        ...(body.metadata || {}),
        actor_clerk_id: data?.clerkId || null,
      },
    }, request, { source: 'admin', medium: 'crm' });
    const campaignTag = cleanText(body.campaign_tag || analytics.campaign, 120);

    await env.MEYYA_DB.prepare(`
      INSERT INTO user_events (
        clerk_id, event_type, product_id, order_id, campaign_tag,
        source, medium, campaign, device_type, page_path, referrer, session_id, anonymous_id, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      targetClerkId,
      eventType,
      body.product_id ? Number(body.product_id) : null,
      cleanText(body.order_id, 120),
      campaignTag,
      analytics.source,
      analytics.medium,
      analytics.campaign,
      analytics.deviceType,
      analytics.pagePath,
      analytics.referrer,
      analytics.sessionId,
      analytics.anonymousId,
      analytics.metadataJson
    ).run();

    await updateAnalyticsAggregates(env, targetClerkId, eventType, analytics);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
