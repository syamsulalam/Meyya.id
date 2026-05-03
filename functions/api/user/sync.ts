import { upsertSelfSyncedUser } from '../_users';
import { debugErrorResponse, jsonResponse } from '../_debug';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerk_id = data?.clerkId;
  let receivedBodyKeys: string[] = [];

  if (!clerk_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const user = await request.json().catch(() => ({}));
    receivedBodyKeys = Object.keys(user || {});

    const { email, first_name, last_name, phone_wa } = user || {};

    // Self-sync must never accept clerk_id or role from the browser.
    await upsertSelfSyncedUser(env, { clerk_id, email, first_name, last_name, phone_wa });

    return jsonResponse({ success: true, message: 'User synchronized' });

  } catch (err: any) {
    return debugErrorResponse(err, 500, {
      endpoint: '/api/user/sync',
      method: 'POST',
      phase: 'self-sync-user',
      clerk_id,
      has_db_binding: Boolean(env.MEYYA_DB),
      received_body_keys: receivedBodyKeys,
    });
  }
}
