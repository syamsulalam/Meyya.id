export async function onRequestPost(context: any) {
  const { env, params } = context;
  const id = params.id;

  try {
    await env.MEYYA_DB.prepare("UPDATE orders SET status = 'processing' WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true, message: 'Order marked as paid' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
