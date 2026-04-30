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

export async function onRequestPut(context: any) {
  try {
    const { env, request, params } = context;
    const body = await request.json();
    const { name, category_id, slug: productSlug, description, image_url, base_price, production_cost, weight, stock, is_active, colors } = body;
    
    // In CF Pages, params is populated from the filename [xyz].ts
    // If it's not defined we fallback to URL parsing
    const id = params?.slug || new URL(request.url).pathname.split('/').pop();
    
    // Update basic fields
    await env.MEYYA_DB.prepare(
      'UPDATE products SET name = ?, category_id = ?, slug = ?, description = ?, image_url = ?, base_price = ?, production_cost = ?, weight = ?, is_active = ? WHERE id = ?'
    ).bind(name, category_id, productSlug, description, image_url, base_price, production_cost, weight, is_active, id).run();

    // Handle stock update
    const currentProduct = await env.MEYYA_DB.prepare('SELECT stock FROM products WHERE id = ?').bind(id).first();
    if (currentProduct && currentProduct.stock !== stock) {
      await env.MEYYA_DB.prepare('UPDATE products SET stock = ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?').bind(stock, id).run();
    }
    
    // Re-insert colors (delete then insert)
    if (colors) {
      await env.MEYYA_DB.prepare('DELETE FROM product_colors WHERE product_id = ?').bind(id).run();
      if (colors.length > 0) {
        const colorStmts = colors.map((c: any) => 
          env.MEYYA_DB.prepare('INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (?, ?, ?)')
            .bind(id, c.color_name, c.hex_code)
        );
        await env.MEYYA_DB.batch(colorStmts);
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
    const { env, request, params } = context;
    const id = params?.slug || new URL(request.url).pathname.split('/').pop();

    await env.MEYYA_DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
