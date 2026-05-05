const API_CO_MONTHLY_FREE_LIMIT = 3000;

export async function ensureExternalApiUsageSchema(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS external_api_usage_monthly (
      provider TEXT NOT NULL,
      product TEXT NOT NULL,
      period_ym TEXT NOT NULL,
      calls INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (provider, product, period_ym)
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS shipping_quote_cache (
      cache_key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function trackExternalApiCall(env: any, provider: string, product: string) {
  await ensureExternalApiUsageSchema(env);
  const period = currentPeriod();
  await env.MEYYA_DB.prepare(`
    INSERT INTO external_api_usage_monthly (provider, product, period_ym, calls, updated_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(provider, product, period_ym) DO UPDATE SET
      calls = calls + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(provider, product, period).run();
}

export async function getExternalApiUsageSummary(env: any) {
  await ensureExternalApiUsageSchema(env);
  const period = currentPeriod();
  const { results } = await env.MEYYA_DB.prepare(`
    SELECT provider, product, period_ym, calls, updated_at
    FROM external_api_usage_monthly
    WHERE period_ym = ?
    ORDER BY provider ASC, product ASC
  `).bind(period).all();

  const usage = productDefaults().map((item) => {
    const row = (results || []).find((candidate: any) => candidate.provider === item.provider && candidate.product === item.product);
    const calls = Number(row?.calls || 0);
    return {
      ...item,
      period,
      calls,
      limit: item.limit,
      remaining: Math.max(0, item.limit - calls),
      percentage: Math.min(100, Math.round((calls / item.limit) * 100)),
      updated_at: row?.updated_at || null,
    };
  });

  return {
    period,
    usage,
    strategy: [
      'Regional API di-cache 30 hari per endpoint di D1.',
      'Ongkir di-cache per origin, destination, weight, dan kurir aktif selama 6 jam.',
      'Free Tier panel menghitung miss yang benar-benar memanggil API.CO.ID.',
    ],
  };
}

export async function getCachedShippingQuote(env: any, cacheKey: string) {
  await ensureExternalApiUsageSchema(env);
  const row = await env.MEYYA_DB.prepare(`
    SELECT payload
    FROM shipping_quote_cache
    WHERE cache_key = ? AND datetime(cached_at) >= datetime('now', '-6 hours')
  `).bind(cacheKey).first();
  if (!row?.payload) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

export async function setCachedShippingQuote(env: any, cacheKey: string, payload: any) {
  await ensureExternalApiUsageSchema(env);
  await env.MEYYA_DB.prepare(`
    INSERT INTO shipping_quote_cache (cache_key, payload, cached_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(cache_key) DO UPDATE SET
      payload = excluded.payload,
      cached_at = CURRENT_TIMESTAMP
  `).bind(cacheKey, JSON.stringify(payload)).run();
}

export function buildShippingQuoteCacheKey(options: {
  originVillageCode: string;
  destinationVillageCode: string;
  weight: number;
  activeCouriers: any[];
}) {
  const couriers = [...(options.activeCouriers || [])].map((value) => String(value).toUpperCase()).sort().join(',');
  return [
    'api-co-shipping',
    options.originVillageCode,
    options.destinationVillageCode,
    Math.max(1, Math.ceil(Number(options.weight || 1))),
    couriers,
  ].join(':');
}

function productDefaults() {
  return [
    {
      provider: 'api.co.id',
      product: 'regional',
      label: 'API.CO.ID Regional',
      limit: API_CO_MONTHLY_FREE_LIMIT,
      rpsLimit: 20,
      note: 'Free 3.000 hits/bulan; cache wilayah D1 30 hari menekan hit eksternal.',
    },
    {
      provider: 'api.co.id',
      product: 'expedition_shipping_cost',
      label: 'API.CO.ID Ongkir',
      limit: API_CO_MONTHLY_FREE_LIMIT,
      rpsLimit: 20,
      note: 'Free 3.000 hits/bulan; quote ongkir di-cache 6 jam.',
    },
  ];
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}
