export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    const user = await request.json();

    if (!user || !user.clerk_id) {
       return new Response(JSON.stringify({ error: 'Missing clerk_id' }), { status: 400 });
    }

    const { clerk_id, email, first_name, last_name, phone_wa, role } = user;

    // We do ON CONFLICT to avoid errors on multiple syncs
    await env.MEYYA_DB.prepare(`
      INSERT INTO users (clerk_id, email, first_name, last_name, phone_wa, role)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(clerk_id) DO UPDATE SET
        email = COALESCE(NULLIF(excluded.email, ''), users.email),
        first_name = COALESCE(NULLIF(excluded.first_name, ''), users.first_name),
        last_name = COALESCE(NULLIF(excluded.last_name, ''), users.last_name),
        role = COALESCE(NULLIF(excluded.role, ''), users.role, 'customer')
    `).bind(clerk_id, email || '', first_name || '', last_name || '', phone_wa || '', role || '').run();

    return new Response(JSON.stringify({ success: true, message: 'User synchronized' }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
