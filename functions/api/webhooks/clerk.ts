export async function onRequestPost(context: any) {
  const { env, request } = context;

  // Ideally, use svix to verify the signature:
  // const payload = await request.text();
  // const headers = Object.fromEntries(request.headers);
  // ... verification logic ...
  
  // For MVP, we'll parse the JSON payload directly:
  try {
    const body = await request.json();
    
    // Check if body is valid
    if (!body || !body.type || !body.data) {
      return new Response("Invalid payload", { status: 400 });
    }

    const { type, data } = body;

    // Handle user.created webhook from Clerk
    if (type === 'user.created') {
      const clerk_id = data.id;
      const email = data.email_addresses && data.email_addresses.length > 0
        ? data.email_addresses[0].email_address
        : '';
      const first_name = data.first_name || '';
      const last_name = data.last_name || '';
      const phone_wa = ''; // Optionally filled by user later

      await env.MEYYA_DB.prepare(`
        INSERT INTO users (clerk_id, email, first_name, last_name, phone_wa)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(clerk_id) DO UPDATE SET
          email = excluded.email,
          first_name = excluded.first_name,
          last_name = excluded.last_name
      `).bind(clerk_id, email, first_name, last_name, phone_wa).run();

      return new Response(JSON.stringify({ success: true, message: 'User created' }), { status: 200 });
    }

    // Handle user.updated webhook from Clerk
    if (type === 'user.updated') {
      const clerk_id = data.id;
      const email = data.email_addresses && data.email_addresses.length > 0
        ? data.email_addresses[0].email_address
        : '';
      const first_name = data.first_name || '';
      const last_name = data.last_name || '';

      await env.MEYYA_DB.prepare(`
        UPDATE users 
        SET email = ?, first_name = ?, last_name = ?
        WHERE clerk_id = ?
      `).bind(email, first_name, last_name, clerk_id).run();

      return new Response(JSON.stringify({ success: true, message: 'User updated' }), { status: 200 });
    }

    // Handle user.deleted webhook from Clerk
    if (type === 'user.deleted') {
      const clerk_id = data.id;
      await env.MEYYA_DB.prepare(`DELETE FROM users WHERE clerk_id = ?`).bind(clerk_id).run();
      return new Response(JSON.stringify({ success: true, message: 'User deleted' }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Unhandled type' }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
