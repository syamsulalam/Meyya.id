export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    const { results: categories } = await env.MEYYA_DB.prepare(`
      SELECT c.*, COUNT(p.id) as count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id
    `).all();

    for (const c of categories) {
      const { results: attrs } = await env.MEYYA_DB.prepare('SELECT * FROM category_attributes WHERE category_id = ?').bind(c.id).all();
      c.attributes = attrs;
    }

    return new Response(JSON.stringify(categories || []), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { name, slug, image_url, has_colors, has_sizes, attributes } = body;

    const info = await env.MEYYA_DB.prepare(`
      INSERT INTO categories (name, slug, image_url, has_colors, has_sizes) VALUES (?, ?, ?, ?, ?)
    `).bind(name, slug, image_url, has_colors ? 1 : 0, has_sizes ? 1 : 0).run();

    const newCatId = info.meta.last_row_id;

    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      const insertStmts = attributes.map((attr: any) => 
        env.MEYYA_DB.prepare('INSERT INTO category_attributes (category_id, name, options) VALUES (?, ?, ?)')
          .bind(newCatId, attr.name, JSON.stringify(attr.options || []))
      );
      await env.MEYYA_DB.batch(insertStmts);
    }

    return new Response(JSON.stringify({ id: newCatId }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

