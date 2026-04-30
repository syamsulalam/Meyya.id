export async function onRequestPut(context: any) {
  try {
    const { env, request, params } = context;
    const body = await request.json();
    const { name, slug, image_url } = body;
    const id = params.id;

    await env.MEYYA_DB.prepare(`
      UPDATE categories SET name = ?, slug = ?, image_url = ? WHERE id = ?
    `).bind(name, slug, image_url, id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  try {
    const { env, params } = context;
    const id = params.id;

    await env.MEYYA_DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
