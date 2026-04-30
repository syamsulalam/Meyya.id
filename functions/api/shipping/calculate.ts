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

    const origin_village_code = settings.origin_village_code;
    const active_couriers = JSON.parse(settings.active_couriers || '["JNE", "SICEPAT", "JNT"]'); // uppercase check

    // 2. Fetch from api.co.id
    const apiUrl = `https://use.api.co.id/expedition/shipping-cost?origin_village_code=${origin_village_code}&destination_village_code=${destination_village_code}&weight=${weight}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-co-id': env.API_CO_ID_KEY || '',
      }
    });

    if (!apiResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to calculate shipping from API' }), { status: 502 });
    }
    
    const data = await apiResponse.json();

    if (!data.results || !data.results.length) {
       return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Filter couriers based on admin settings active couriers
    // Notice: usually API returns courier generic like "JNE", "SICEPAT", etc.
    const filteredResults = data.results.filter((c: any) => {
        // filter out zero price
        if (!c.price || c.price === 0) return false;
        
        // filter out inactive couriers
        return active_couriers.some((active: string) => c.courier_name.toUpperCase().includes(active.toUpperCase()));
    });

    return new Response(JSON.stringify({ results: filteredResults }), {
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
