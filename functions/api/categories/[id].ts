export async function onRequestPut(context: any) {
  try {
    const { env, request, params } = context;
    const body = await request.json();
    const { name, slug, image_url, has_colors, has_sizes, attributes } = body;
    const id = params.id;

    await env.MEYYA_DB.prepare(`
      UPDATE categories SET name = ?, slug = ?, image_url = ?, has_colors = ?, has_sizes = ? WHERE id = ?
    `).bind(name, slug, image_url, has_colors ? 1 : 0, has_sizes ? 1 : 0, id).run();

    if (attributes) {
      await env.MEYYA_DB.prepare('DELETE FROM category_attributes WHERE category_id = ?').bind(id).run();
      
      if (Array.isArray(attributes) && attributes.length > 0) {
        const insertStmts = attributes.map((attr: any) => 
          env.MEYYA_DB.prepare('INSERT INTO category_attributes (category_id, name, options) VALUES (?, ?, ?)')
            .bind(id, attr.name, JSON.stringify(attr.options || []))
        );
        await env.MEYYA_DB.batch(insertStmts);
      }
    }

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
