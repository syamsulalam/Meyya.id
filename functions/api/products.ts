export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    // Ambil data produk menggunakan JOIN untuk dapet kategori
    const { results: products } = await env.MEYYA_DB.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
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

export async function onRequestPost(context: any) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, colors } = body;
    
    const info = await env.MEYYA_DB.prepare(
      'INSERT INTO products (name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, last_stock_update, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)'
    ).bind(name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active).run();
    
    // NOTE: last_row_id is the primary key of the last inserted row
    const lastRowId = info.meta.last_row_id;
    
    if (colors && colors.length > 0) {
      // In Cloudflare D1 batching makes more sense
      const colorStmts = colors.map((c: any) => 
        env.MEYYA_DB.prepare('INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (?, ?, ?)')
          .bind(lastRowId, c.color_name, c.hex_code)
      );
      await env.MEYYA_DB.batch(colorStmts);
    }
    
    return new Response(JSON.stringify({ id: lastRowId }), {
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
