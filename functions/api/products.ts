export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    // Ambil data produk menggunakan JOIN untuk dapet kategori
    const { results: products } = await env.MEYYA_DB.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE is_active = 1
    `).all();

    // Loop satu per satu untuk narik data arrays (Colors and Sizes)
    // Di SQLite D1 kita juga bisa mengakali pake json_group_array kalau mau single query, 
    // tapi ini loop sederhana karena dataset umumnya lumayan kecil per pagination.
    for (const p of products) {
      const colors = await env.MEYYA_DB.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').bind(p.id).all();
      p.colors = colors.results;

      const sizes = await env.MEYYA_DB.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').bind(p.id).all();
      p.sizes = sizes.results;
    }

    return new Response(JSON.stringify(products), {
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
