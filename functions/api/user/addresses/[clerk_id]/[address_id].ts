export async function onRequestDelete(context: any) {
  const { env, params } = context;
  const address_id = params.address_id;
  try {
    await env.MEYYA_DB.prepare(
      `DELETE FROM user_addresses WHERE id = ?`
    ).bind(address_id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch(e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
