import { Webhook } from 'svix';

export async function onRequestPost(context: any) {
  const { env, request } = context;

  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // If not configured, just proceed for dev, but log error
    console.error('Please add CLERK_WEBHOOK_SECRET to env');
  }

  const payloadString = await request.text();
  const svix_id = request.headers.get("svix-id");
  const svix_timestamp = request.headers.get("svix-timestamp");
  const svix_signature = request.headers.get("svix-signature");

  let body;
  if (WEBHOOK_SECRET && svix_id && svix_timestamp && svix_signature) {
    const wh = new Webhook(WEBHOOK_SECRET);
    try {
      body = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      return new Response("Invalid signature", { status: 400 });
    }
  } else {
    // Fallback if no secret provided in dev (not recommended for prod)
    if (WEBHOOK_SECRET) {
        return new Response("Missing signature headers", { status: 400 });
    }
    body = JSON.parse(payloadString);
  }

  try {
    if (!body || !body.type || !body.data) {
      return new Response("Invalid payload", { status: 400 });
    }

    const { type, data } = body;

    if (type === 'user.created') {
      const clerk_id = data.id;
      const email = data.email_addresses && data.email_addresses.length > 0
        ? data.email_addresses[0].email_address
        : '';
      const first_name = data.first_name || '';
      const last_name = data.last_name || '';
      const phone_wa = ''; 

      await env.MEYYA_DB.prepare(`
        INSERT INTO users (clerk_id, email, first_name, last_name, phone_wa, role)
        VALUES (?, ?, ?, ?, ?, 'customer')
        ON CONFLICT(clerk_id) DO UPDATE SET
          email = excluded.email,
          first_name = excluded.first_name,
          last_name = excluded.last_name
      `).bind(clerk_id, email, first_name, last_name, phone_wa).run();

      return new Response(JSON.stringify({ success: true, message: 'User created' }), { status: 200 });
    }

    if (type === 'user.updated') {
      const clerk_id = data.id;
      const email = data.email_addresses && data.email_addresses.length > 0
        ? data.email_addresses[0].email_address
        : '';
      const first_name = data.first_name || '';
      const last_name = data.last_name || '';

      await env.MEYYA_DB.prepare(`
        UPDATE users 
        SET 
          email = COALESCE(NULLIF(?, ''), email), 
          first_name = COALESCE(NULLIF(?, ''), first_name), 
          last_name = COALESCE(NULLIF(?, ''), last_name)
        WHERE clerk_id = ?
      `).bind(email, first_name, last_name, clerk_id).run();

      return new Response(JSON.stringify({ success: true, message: 'User updated' }), { status: 200 });
    }

    if (type === 'user.deleted') {
      const clerk_id = data.id;
      await env.MEYYA_DB.prepare(`
        UPDATE users
        SET role = 'deleted', first_name = 'Deleted', last_name = 'User'
        WHERE clerk_id = ?
      `).bind(clerk_id).run();
      return new Response(JSON.stringify({ success: true, message: 'User deleted (soft)' }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Unhandled type' }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
