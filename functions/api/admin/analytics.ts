import { ensureCommerceSchema } from '../_commerce';

export async function onRequestGet({ env, request }: any) {
  try {
    await ensureCommerceSchema(env);
    const url = new URL(request.url);
    const days = clampDays(url.searchParams.get('days'), 7, 90, 14);
    const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

    const { results: eventRows } = await env.MEYYA_DB.prepare(`
      SELECT event_type, SUM(event_count) AS events, SUM(unique_users) AS users
      FROM analytics_daily_metrics
      WHERE metric_date >= ?
      GROUP BY event_type
      ORDER BY events DESC
      LIMIT 12
    `).bind(since).all();

    const { results: sourceRows } = await env.MEYYA_DB.prepare(`
      SELECT COALESCE(NULLIF(source, ''), 'unknown') AS source, SUM(event_count) AS events, SUM(unique_users) AS users
      FROM analytics_daily_metrics
      WHERE metric_date >= ?
      GROUP BY COALESCE(NULLIF(source, ''), 'unknown')
      ORDER BY events DESC
      LIMIT 8
    `).bind(since).all();

    const { results: campaignRows } = await env.MEYYA_DB.prepare(`
      SELECT COALESCE(NULLIF(campaign, ''), '(none)') AS campaign, SUM(event_count) AS events, SUM(unique_users) AS users
      FROM analytics_daily_metrics
      WHERE metric_date >= ? AND COALESCE(campaign, '') != ''
      GROUP BY campaign
      ORDER BY events DESC
      LIMIT 8
    `).bind(since).all();

    const { results: deviceRows } = await env.MEYYA_DB.prepare(`
      SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS device_type, SUM(event_count) AS events, SUM(unique_users) AS users
      FROM analytics_daily_metrics
      WHERE metric_date >= ?
      GROUP BY COALESCE(NULLIF(device_type, ''), 'unknown')
      ORDER BY events DESC
      LIMIT 6
    `).bind(since).all();

    const { results: dailyRows } = await env.MEYYA_DB.prepare(`
      SELECT metric_date, SUM(event_count) AS events, SUM(unique_users) AS users
      FROM analytics_daily_metrics
      WHERE metric_date >= ?
      GROUP BY metric_date
      ORDER BY metric_date ASC
    `).bind(since).all();

    return json({
      days,
      since,
      eventsByType: eventRows || [],
      topSources: sourceRows || [],
      topCampaigns: campaignRows || [],
      devices: deviceRows || [],
      daily: dailyRows || [],
      source: 'analytics_daily_metrics',
    });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal membaca analytics aggregate' }, 500);
  }
}

function clampDays(value: any, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(numberValue)));
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
