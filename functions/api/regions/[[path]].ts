export async function onRequestGet(context: any) {
  const { env, request, params } = context;
  const pathArray = params.path || []; // array of path segments
  const pathString = pathArray.join('/'); // e.g. "provinces" or "provinces/11/regencies"
  
  const url = new URL(request.url);
  const search = url.search; // e.g. "?size=100"

  const targetUrl = `https://use.api.co.id/regions/${pathString}${search}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-api-co-id': env.API_CO_ID_KEY || ''
      }
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
