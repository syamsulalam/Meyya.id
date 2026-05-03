import { createClerkClient } from '@clerk/backend';

export async function onRequestPost(context: any) {
  const { env, data } = context;
  const clerkId = data?.clerkId;

  if (!clerkId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!env.CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is not configured for Clerk profile sync');
    return new Response(JSON.stringify({ error: 'Authentication is not configured' }), { status: 500 });
  }

  try {
    const user = await env.MEYYA_DB.prepare('SELECT first_name, last_name FROM users WHERE clerk_id = ?').bind(clerkId).first();

    if (!user || (!user.first_name && !user.last_name)) {
      return new Response(JSON.stringify({ error: 'No profile name to sync' }), { status: 400 });
    }

    const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    await clerkClient.users.updateUser(clerkId, {
      firstName: user.first_name || '',
      lastName: user.last_name || ''
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
