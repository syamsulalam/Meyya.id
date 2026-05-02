export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    const user = await request.json();

    if (!user || !user.clerk_id) {
       return new Response(JSON.stringify({ error: 'Missing clerk_id' }), { status: 400 });
    }

    const { clerk_id, email, first_name, last_name, phone_wa } = user;

    // We do ON CONFLICT to avoid errors on multiple syncs
    await env.MEYYA_DB.prepare(`
      INSERT INTO users (clerk_id, email, first_name, last_name, phone_wa)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(clerk_id) DO UPDATE SET
        email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name
    `).bind(clerk_id, email || '', first_name || '', last_name || '', phone_wa || '').run();

    return new Response(JSON.stringify({ success: true, message: 'User synchronized' }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
