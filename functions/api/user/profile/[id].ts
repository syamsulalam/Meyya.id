export async function onRequestGet(context: any) {
  const { env, request, params } = context;
  const id = params.id;

  try {
    const user = await env.MEYYA_DB.prepare('SELECT * FROM users WHERE clerk_id = ?').bind(id).first();
    const addresses = await env.MEYYA_DB.prepare('SELECT * FROM user_addresses WHERE user_id = ?').bind(id).all();

    return new Response(JSON.stringify({ 
      user: user || {}, 
      addresses: addresses.results || [] 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPut(context: any) {
  const { env, request, params } = context;
  const id = params.id;

  try {
    const body = await request.json();

    // Update user info
    if (body.name || body.phone_wa !== undefined) {
      // In the frontend sometimes it might pass first_name via name
      await env.MEYYA_DB.prepare(`
         UPDATE users SET first_name = ?, phone_wa = ? WHERE clerk_id = ?
      `).bind(body.name || '', body.phone_wa || '', id).run();
    }

    if (body.address) {
      const a = body.address;
      const existing = await env.MEYYA_DB.prepare('SELECT id FROM user_addresses WHERE user_id = ? LIMIT 1').bind(id).first();
      
      if (existing) {
        await env.MEYYA_DB.prepare(`
          UPDATE user_addresses 
          SET recipient_name = ?, recipient_phone = ?, 
              province_code = ?, province_name = ?, 
              regency_code = ?, regency_name = ?, 
              district_code = ?, district_name = ?, 
              village_code = ?, village_name = ?, 
              postal_code = '', street_address = ?
          WHERE user_id = ?
        `).bind(
          body.name || '', body.phone_wa || '',
          a.province_code, a.province_name,
          a.regency_code, a.regency_name,
          a.district_code, a.district_name,
          a.village_code, a.village_name,
          a.street_address,
          id
        ).run();
      } else {
        await env.MEYYA_DB.prepare(`
          INSERT INTO user_addresses (
            user_id, recipient_name, recipient_phone,
            province_code, province_name, regency_code, regency_name,
            district_code, district_name, village_code, village_name,
            postal_code, street_address, is_primary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
          id, body.name || '', body.phone_wa || '',
          a.province_code, a.province_name, a.regency_code, a.regency_name,
          a.district_code, a.district_name, a.village_code, a.village_name,
          '', a.street_address
        ).run();
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Profile updated' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
