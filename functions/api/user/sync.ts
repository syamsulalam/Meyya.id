export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerk_id = data?.clerkId;

  if (!clerk_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const user = await request.json().catch(() => ({}));

    const { email, first_name, last_name, phone_wa } = user || {};

    // Self-sync must never accept clerk_id or role from the browser.
    await env.MEYYA_DB.prepare(`
      INSERT INTO users (clerk_id, email, first_name, last_name, phone_wa, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
      ON CONFLICT(clerk_id) DO UPDATE SET
        email = COALESCE(NULLIF(excluded.email, ''), users.email),
        first_name = COALESCE(NULLIF(excluded.first_name, ''), users.first_name),
        last_name = COALESCE(NULLIF(excluded.last_name, ''), users.last_name),
        phone_wa = COALESCE(NULLIF(excluded.phone_wa, ''), users.phone_wa)
    `).bind(clerk_id, email || '', first_name || '', last_name || '', phone_wa || '').run();

    return new Response(JSON.stringify({ success: true, message: 'User synchronized' }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
