export async function onRequestDelete(context: any) {
  const { env, params, data } = context;
  const address_id = params.address_id;
  const clerk_id = params.clerk_id;
  const reqClerkId = data?.clerkId;
  
  if (!reqClerkId || clerk_id !== reqClerkId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    await env.MEYYA_DB.prepare(
      `DELETE FROM user_addresses WHERE id = ? AND user_id = ?`
    ).bind(address_id, clerk_id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
