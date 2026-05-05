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

    const { results: sourceTrendRows } = await env.MEYYA_DB.prepare(`
      SELECT metric_date, COALESCE(NULLIF(source, ''), 'unknown') AS label, SUM(event_count) AS events
      FROM analytics_daily_metrics
      WHERE metric_date >= ?
      GROUP BY metric_date, COALESCE(NULLIF(source, ''), 'unknown')
      ORDER BY metric_date ASC
    `).bind(since).all();

    const { results: campaignTrendRows } = await env.MEYYA_DB.prepare(`
      SELECT metric_date, COALESCE(NULLIF(campaign, ''), '(none)') AS label, SUM(event_count) AS events
      FROM analytics_daily_metrics
      WHERE metric_date >= ? AND COALESCE(campaign, '') != ''
      GROUP BY metric_date, COALESCE(NULLIF(campaign, ''), '(none)')
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
      sourceTrend: buildTrend(sourceTrendRows || [], sourceRows || [], days),
      campaignTrend: buildTrend(campaignTrendRows || [], campaignRows || [], days),
      conversionFunnel: buildConversionFunnel(eventRows || []),
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

function buildTrend(rows: any[], topRows: any[], days: number) {
  const dates = Array.from({ length: days }, (_, index) =>
    new Date(Date.now() - (days - 1 - index) * 86400000).toISOString().slice(0, 10)
  );
  const labels = topRows.slice(0, 4).map((row: any) => row.source || row.campaign || row.label).filter(Boolean);
  const rowMap = new Map<string, number>();
  for (const row of rows) {
    rowMap.set(`${row.metric_date}::${row.label}`, Number(row.events || 0));
  }

  return labels.map((label: string) => {
    const points = dates.map((date) => ({ date, events: rowMap.get(`${date}::${label}`) || 0 }));
    return {
      label,
      total: points.reduce((sum, point) => sum + point.events, 0),
      points,
    };
  }).filter((series: any) => series.total > 0);
}

function buildConversionFunnel(eventRows: any[]) {
  const eventsByType = new Map(eventRows.map((row: any) => [row.event_type, Number(row.events || 0)]));
  const steps = [
    { key: 'PRODUCT_VIEW', label: 'Lihat produk' },
    { key: 'CART_UPDATED', label: 'Masuk keranjang' },
    { key: 'CHECKOUT_STARTED', label: 'Mulai checkout' },
    { key: 'ORDER_CREATED', label: 'Order dibuat' },
  ];
  let previous = 0;
  const first = Number(eventsByType.get(steps[0].key) || 0);

  return steps.map((step, index) => {
    const events = Number(eventsByType.get(step.key) || 0);
    const previousRate = index === 0 || previous <= 0 ? 100 : Math.round((events / previous) * 100);
    const totalRate = first <= 0 ? 0 : Math.round((events / first) * 100);
    previous = events;
    return {
      ...step,
      events,
      previousRate: Math.max(0, Math.min(100, previousRate)),
      totalRate: Math.max(0, Math.min(100, totalRate)),
    };
  });
}
