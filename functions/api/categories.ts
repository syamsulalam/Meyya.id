export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    const { results: categories } = await env.MEYYA_DB.prepare(`
      SELECT c.*, COUNT(p.id) as count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id
    `).all();

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
    const { name, slug, image_url } = body;

    const info = await env.MEYYA_DB.prepare(`
      INSERT INTO categories (name, slug, image_url) VALUES (?, ?, ?)
    `).bind(name, slug, image_url).run();

    return new Response(JSON.stringify({ id: info.meta.last_row_id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
