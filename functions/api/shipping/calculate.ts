import {
  buildShippingQuoteCacheKey,
  getCachedShippingQuote,
  setCachedShippingQuote,
  trackExternalApiCall,
} from '../_externalApiUsage';

export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    const { destination_village_code, weight } = await request.json();

    if (!destination_village_code || !weight) {
      return new Response(JSON.stringify({ error: 'Missing destination_village_code or weight' }), { status: 400 });
    }

    // 1. Get Origin and Active Couriers from DB
    const settings = await env.MEYYA_DB.prepare('SELECT origin_village_code, active_couriers FROM shipping_settings WHERE id = 1').first();
    
    if (!settings || !settings.origin_village_code) {
      return new Response(JSON.stringify({ error: 'Shipping origin not configured' }), { status: 500 });
    }

    if (!env.API_CO_ID_KEY) {
      return new Response(JSON.stringify({ error: 'Shipping API key is not configured' }), { status: 500 });
    }

    const origin_village_code = settings.origin_village_code;
    const active_couriers = JSON.parse(settings.active_couriers || '["JNE", "SICEPAT", "JNT"]'); // uppercase check
    const normalizedWeight = Math.max(1, Math.ceil(Number(weight || 1)));
    const cacheKey = buildShippingQuoteCacheKey({
      originVillageCode: origin_village_code,
      destinationVillageCode: destination_village_code,
      weight: normalizedWeight,
      activeCouriers: active_couriers,
    });

    const cached = await getCachedShippingQuote(env, cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300' },
        status: 200,
      });
    }

    // 2. Fetch from api.co.id
    const apiUrl = `https://use.api.co.id/expedition/shipping-cost?origin_village_code=${origin_village_code}&destination_village_code=${destination_village_code}&weight=${normalizedWeight}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-co-id': env.API_CO_ID_KEY || '',
      }
    });

    if (!apiResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to calculate shipping from API' }), { status: 502 });
    }
    await trackExternalApiCall(env, 'api.co.id', 'expedition_shipping_cost');
    
    const data = await apiResponse.json();

    if (!data.results || !data.results.length) {
       const emptyPayload = { results: [] };
       await setCachedShippingQuote(env, cacheKey, emptyPayload);
       return new Response(JSON.stringify(emptyPayload), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Filter couriers based on admin settings active couriers
    // Notice: usually API returns courier generic like "JNE", "SICEPAT", etc.
    const filteredResults = data.results.filter((c: any) => {
        // filter out zero price
        if (!c.price || c.price === 0) return false;
        
        // filter out inactive couriers
        return active_couriers.some((active: string) => c.courier_name.toUpperCase().includes(active.toUpperCase()));
    });

    const payload = { results: filteredResults };
    await setCachedShippingQuote(env, cacheKey, payload);

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
