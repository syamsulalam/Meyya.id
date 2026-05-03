export async function onRequestGet(context: any) {
  const { env, request, params } = context;
  const rawPath = params.path || [];
  const pathArray = Array.isArray(rawPath) ? rawPath : [rawPath];
  const pathString = pathArray.map((part: string) => encodeURIComponent(part)).join('/');

  const url = new URL(request.url);
  const search = url.search;
  const cacheKey = `${pathString}${search}`;
  const targetUrl = `https://use.api.co.id/regional/indonesia/${pathString}${search}`;

  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=86400',
  };

  try {
    await env.MEYYA_DB.prepare(`
      CREATE TABLE IF NOT EXISTS region_cache (
        endpoint TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const cached = await env.MEYYA_DB.prepare('SELECT payload FROM region_cache WHERE endpoint = ?').bind(cacheKey).first();
    if (cached?.payload) {
      return new Response(cached.payload, {
        headers: jsonHeaders,
        status: 200,
      });
    }

    if (!env.API_CO_ID_KEY) {
      return new Response(JSON.stringify({
        error: 'API_CO_ID_KEY belum dikonfigurasi. Regional data belum bisa di-cache dari api.co.id.',
        debug: { endpoint: `/api/regions/${pathString}`, target: targetUrl }
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-api-co-id': env.API_CO_ID_KEY
      }
    });

    const data = await response.json();
    const payload = JSON.stringify(data);

    if (response.ok) {
      await env.MEYYA_DB.prepare(`
        INSERT INTO region_cache (endpoint, payload, cached_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(endpoint) DO UPDATE SET payload = excluded.payload, cached_at = CURRENT_TIMESTAMP
      `).bind(cacheKey, payload).run();
    }

    return new Response(payload, {
      headers: jsonHeaders,
      status: response.status,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
      debug: {
        endpoint: `/api/regions/${pathString}`,
        target: targetUrl,
        phase: 'regional-cache-fetch',
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
