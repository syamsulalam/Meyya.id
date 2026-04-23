export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop(); // ambil parameter [slug] di baris URL

  try {
    const p = await env.MEYYA_DB.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.slug = ?
    `).bind(slug).first();

    if (!p) {
      return new Response(JSON.stringify({ error: 'Data tidak ditemukan' }), { status: 404 });
    }

    const colors = await env.MEYYA_DB.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').bind(p.id).all();
    p.colors = colors.results;

    const sizes = await env.MEYYA_DB.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').bind(p.id).all();
    p.sizes = sizes.results;

    return new Response(JSON.stringify(p), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
