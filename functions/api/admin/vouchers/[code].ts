export async function onRequestDelete(context: any) {
  const { env, params } = context;

  try {
    const code = params.code;
    await env.MEYYA_DB.prepare(`DELETE FROM vouchers WHERE code = ?`).bind(code).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
