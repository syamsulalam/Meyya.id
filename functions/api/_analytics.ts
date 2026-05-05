type AnalyticsFields = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  deviceType: string | null;
  pagePath: string | null;
  referrer: string | null;
  sessionId: string | null;
  anonymousId: string | null;
  metadataJson: string;
};

export function normalizeAnalyticsEvent(body: any, request: Request, defaults: Record<string, any> = {}): AnalyticsFields {
  const metadata = body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {};
  const analytics = metadata.analytics && typeof metadata.analytics === 'object' && !Array.isArray(metadata.analytics)
    ? metadata.analytics
    : {};
  const cf = (request as any).cf || {};
  const headers = request.headers;

  const source = cleanText(body.source ?? analytics.source ?? metadata.source ?? defaults.source, 80);
  const medium = cleanText(body.medium ?? analytics.medium ?? metadata.medium ?? defaults.medium, 80);
  const campaign = cleanText(body.campaign ?? analytics.campaign ?? metadata.campaign ?? body.campaign_tag ?? defaults.campaign, 120);
  const deviceType = cleanText(body.device_type ?? analytics.device_type ?? metadata.device_type, 40);
  const pagePath = cleanText(body.page_path ?? analytics.page_path ?? metadata.page_path, 240);
  const referrer = cleanText(body.referrer ?? analytics.referrer ?? metadata.referrer ?? headers.get('referer'), 500);
  const sessionId = cleanText(body.session_id ?? analytics.session_id ?? metadata.session_id, 120);
  const anonymousId = cleanText(body.anonymous_id ?? analytics.anonymous_id ?? metadata.anonymous_id, 120);

  return {
    source,
    medium,
    campaign,
    deviceType,
    pagePath,
    referrer,
    sessionId,
    anonymousId,
    metadataJson: JSON.stringify({
      ...metadata,
      analytics: {
        ...analytics,
        source,
        medium,
        campaign,
        device_type: deviceType,
        page_path: pagePath,
        referrer,
        session_id: sessionId,
        anonymous_id: anonymousId,
        country: cleanText(headers.get('cf-ipcountry') || cf.country, 8),
        colo: cleanText(cf.colo, 16),
      },
    }),
  };
}

export function cleanText(value: any, maxLength = 160) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

export async function updateAnalyticsAggregates(env: any, clerkId: string | null, eventType: string, analytics: AnalyticsFields) {
  const metricDate = new Date().toISOString().slice(0, 10);
  const source = analytics.source || '';
  const medium = analytics.medium || '';
  const campaign = analytics.campaign || '';
  const deviceType = analytics.deviceType || '';
  const pagePath = analytics.pagePath || '';

  await env.MEYYA_DB.prepare(`
    INSERT INTO analytics_daily_metrics (
      metric_date, event_type, source, medium, campaign, device_type, page_path, event_count, unique_users, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(metric_date, event_type, source, medium, campaign, device_type, page_path)
    DO UPDATE SET
      event_count = event_count + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(metricDate, eventType, source, medium, campaign, deviceType, pagePath).run();

  if (clerkId) {
    const result = await env.MEYYA_DB.prepare(`
      INSERT OR IGNORE INTO analytics_daily_metric_users (
        metric_date, event_type, source, medium, campaign, device_type, page_path, clerk_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(metricDate, eventType, source, medium, campaign, deviceType, pagePath, clerkId).run();

    if (Number(result?.meta?.changes || 0) > 0) {
      await env.MEYYA_DB.prepare(`
        UPDATE analytics_daily_metrics
        SET unique_users = unique_users + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE metric_date = ?
          AND event_type = ?
          AND source = ?
          AND medium = ?
          AND campaign = ?
          AND device_type = ?
          AND page_path = ?
      `).bind(metricDate, eventType, source, medium, campaign, deviceType, pagePath).run();
    }

    await updateUserEventSummary(env, clerkId, eventType, analytics);
  }
}

async function updateUserEventSummary(env: any, clerkId: string, eventType: string, analytics: AnalyticsFields) {
  const isCart = eventType === 'CART_UPDATED';
  const isProductView = eventType === 'PRODUCT_VIEW';
  const isCheckout = eventType === 'CHECKOUT_STARTED';
  const isCampaignTouch = eventType === 'CAMPAIGN_TOUCH';
  const isSearch = eventType === 'SEARCH_PERFORMED';
  const isVoucherApply = eventType === 'VOUCHER_APPLIED';

  await env.MEYYA_DB.prepare(`
    INSERT INTO user_event_summaries (
      clerk_id, last_event_at, last_event_type, last_source, last_medium, last_campaign, last_device_type,
      last_page_path, last_referrer, last_cart_at, last_product_view_at, last_checkout_at,
      campaign_touch_count, search_count, voucher_apply_count, updated_at
    )
    VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(clerk_id) DO UPDATE SET
      last_event_at = CURRENT_TIMESTAMP,
      last_event_type = excluded.last_event_type,
      last_source = excluded.last_source,
      last_medium = excluded.last_medium,
      last_campaign = excluded.last_campaign,
      last_device_type = excluded.last_device_type,
      last_page_path = excluded.last_page_path,
      last_referrer = excluded.last_referrer,
      last_cart_at = COALESCE(excluded.last_cart_at, user_event_summaries.last_cart_at),
      last_product_view_at = COALESCE(excluded.last_product_view_at, user_event_summaries.last_product_view_at),
      last_checkout_at = COALESCE(excluded.last_checkout_at, user_event_summaries.last_checkout_at),
      campaign_touch_count = user_event_summaries.campaign_touch_count + excluded.campaign_touch_count,
      search_count = user_event_summaries.search_count + excluded.search_count,
      voucher_apply_count = user_event_summaries.voucher_apply_count + excluded.voucher_apply_count,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    clerkId,
    eventType,
    analytics.source,
    analytics.medium,
    analytics.campaign,
    analytics.deviceType,
    analytics.pagePath,
    analytics.referrer,
    isCart ? new Date().toISOString() : null,
    isProductView ? new Date().toISOString() : null,
    isCheckout ? new Date().toISOString() : null,
    isCampaignTouch ? 1 : 0,
    isSearch ? 1 : 0,
    isVoucherApply ? 1 : 0
  ).run();
}
