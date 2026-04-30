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
       await env.MEYYA_DB.prepare(`
         UPDATE users SET first_name = ?, phone_wa = ? WHERE clerk_id = ?
       `).bind(body.name || '', body.phone_wa || '', id).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Profile updated' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
