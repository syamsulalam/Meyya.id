import { ensureCommerceSchema } from './_commerce';
import { cleanText, normalizeAnalyticsEvent, updateAnalyticsAggregates } from './_analytics';

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
    const analytics = normalizeAnalyticsEvent(body, request);
    const campaignTag = cleanText(body.campaign_tag || analytics.campaign, 120);

    await env.MEYYA_DB.prepare(`
      INSERT INTO user_events (
        clerk_id, event_type, product_id, order_id, campaign_tag,
        source, medium, campaign, device_type, page_path, referrer, session_id, anonymous_id, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      clerkId,
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

    await updateAnalyticsAggregates(env, clerkId, eventType, analytics);

    if (clerkId && eventType === 'CART_UPDATED') {
      const snapshot = normalizeCartSnapshot(body.metadata?.cart_snapshot);
      if (snapshot) {
        await upsertCartSnapshot(env, clerkId, snapshot);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

function normalizeCartSnapshot(value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const items = Array.isArray(value.items)
    ? value.items.slice(0, 30).map((item: any) => ({
      product_id: Number(item.product_id || 0),
      variant_id: item.variant_id ? Number(item.variant_id) : null,
      product_name: String(item.product_name || '').slice(0, 120),
      quantity: Math.max(0, Number(item.quantity || 0)),
      price: Math.max(0, Number(item.price || 0)),
      color: String(item.color || '').slice(0, 80),
      size: String(item.size || '').slice(0, 80),
    })).filter((item: any) => item.product_id && item.quantity > 0)
    : [];
  const itemCount = Math.max(0, Number(value.item_count || items.reduce((sum: number, item: any) => sum + item.quantity, 0)));
  const subtotal = Math.max(0, Number(value.subtotal || items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)));
  const productIds = Array.from(new Set(items.map((item: any) => item.product_id)));
  return { items, itemCount, subtotal, productIds };
}

async function upsertCartSnapshot(env: any, clerkId: string, snapshot: any) {
  await env.MEYYA_DB.prepare(`
    INSERT INTO user_cart_snapshots (clerk_id, item_count, subtotal, product_ids, items, status, last_event_at, converted_order_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT(clerk_id) DO UPDATE SET
      item_count = excluded.item_count,
      subtotal = excluded.subtotal,
      product_ids = excluded.product_ids,
      items = excluded.items,
      status = excluded.status,
      last_event_at = CURRENT_TIMESTAMP,
      converted_order_id = NULL,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    clerkId,
    snapshot.itemCount,
    snapshot.subtotal,
    JSON.stringify(snapshot.productIds),
    JSON.stringify(snapshot.items),
    snapshot.itemCount > 0 ? 'ACTIVE' : 'EMPTY'
  ).run();
}
