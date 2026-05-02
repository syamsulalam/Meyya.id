export async function onRequestGet(context: any) {
  const { env, params } = context;
  const clerk_id = params.clerk_id;
  try {
    const { results } = await env.MEYYA_DB.prepare(
      `SELECT * FROM user_addresses WHERE user_id = ?`
    ).bind(clerk_id).all();
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { env, params, request } = context;
  const clerk_id = params.clerk_id;
  try {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    await env.MEYYA_DB.prepare(
      `INSERT INTO user_addresses (id, user_id, label, icon, recipient_name, recipient_phone, province_code, province_name, regency_code, regency_name, district_code, district_name, village_code, village_name, street_address, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, clerk_id, body.label, body.icon || '🏠', body.recipient_name, body.recipient_phone,
      body.province_code, body.province_name, body.regency_code, body.regency_name,
      body.district_code, body.district_name, body.village_code, body.village_name,
      body.street_address, body.is_default ? 1 : 0
    ).run();

    if (body.is_default) {
      // Clear other defaults
      await env.MEYYA_DB.prepare(`UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND id != ?`).bind(clerk_id, id).run();
    }

    return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
