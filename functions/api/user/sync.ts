import { upsertSelfSyncedUser } from '../_users';

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
    await upsertSelfSyncedUser(env, { clerk_id, email, first_name, last_name, phone_wa });

    return new Response(JSON.stringify({ success: true, message: 'User synchronized' }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
