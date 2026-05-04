import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    await ensureRegionCacheTable(env);
    const stats = await env.MEYYA_DB.prepare(`
      SELECT COUNT(*) AS total, MAX(cached_at) AS last_cached_at, MIN(cached_at) AS oldest_cached_at FROM region_cache
    `).first();
    const { results: endpoints } = await env.MEYYA_DB.prepare(`
      SELECT endpoint, cached_at
      FROM region_cache
      ORDER BY cached_at DESC
      LIMIT 50
    `).all();
    const now = Date.now();
    const formattedEndpoints = (endpoints || []).map((row: any) => {
      const cachedAt = new Date(row.cached_at);
      const ageHours = Number.isNaN(cachedAt.getTime()) ? null : Math.floor((now - cachedAt.getTime()) / 3600000);
      const ttlDays = 30;
      return {
        endpoint: row.endpoint,
        cached_at: row.cached_at,
        age_hours: ageHours,
        ttl_days: ttlDays,
        expires_at: Number.isNaN(cachedAt.getTime()) ? null : new Date(cachedAt.getTime() + ttlDays * 86400000).toISOString(),
        status: ageHours === null ? 'UNKNOWN' : ageHours >= ttlDays * 24 ? 'STALE' : ageHours >= (ttlDays * 24) - 48 ? 'EXPIRING_SOON' : 'FRESH',
      };
    });

    return new Response(JSON.stringify({
      ...(stats || { total: 0 }),
      ttl_days: 30,
      endpoints: formattedEndpoints,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { env, data } = context;
  try {
    await ensureCommerceSchema(env);
    await ensureRegionCacheTable(env);
    await env.MEYYA_DB.prepare('DELETE FROM region_cache').run();
    await auditLog(env, data?.clerkId || null, 'CLEAR_REGION_CACHE', 'region_cache', 'all', {});
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

async function ensureRegionCacheTable(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS region_cache (
      endpoint TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
