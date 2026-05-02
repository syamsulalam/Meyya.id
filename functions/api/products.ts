export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const { results: products } = await env.MEYYA_DB.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
    `).all();

    for (const p of products) {
      const colors = await env.MEYYA_DB.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').bind(p.id).all();
      p.colors = colors.results;

      const sizes = await env.MEYYA_DB.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').bind(p.id).all();
      p.sizes = sizes.results.map((s: any) => s.size_name);
      
      const attrs = await env.MEYYA_DB.prepare('SELECT attribute_name, attribute_value FROM product_attributes WHERE product_id = ?').bind(p.id).all();
      p.attributes = attrs.results;
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
    const { name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, is_preorder, colors, sizes, attributes } = body;
    
    const info = await env.MEYYA_DB.prepare(
      'INSERT INTO products (name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, last_stock_update, is_active, is_preorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)'
    ).bind(name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, is_preorder || 0).run();
    
    // NOTE: last_row_id is the primary key of the last inserted row
    const lastRowId = info.meta.last_row_id;
    
    if (colors && colors.length > 0) {
      const colorStmts = colors.map((c: any) => 
        env.MEYYA_DB.prepare('INSERT INTO product_colors (product_id, color_name, hex_code) VALUES (?, ?, ?)')
          .bind(lastRowId, c.color_name, c.hex_code)
      );
      await env.MEYYA_DB.batch(colorStmts);
    }
    
    if (sizes && sizes.length > 0) {
      const sizeStmts = sizes.map((s: string) => 
        env.MEYYA_DB.prepare('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)')
          .bind(lastRowId, s)
      );
      await env.MEYYA_DB.batch(sizeStmts);
    }
    
    if (attributes && attributes.length > 0) {
      const attrStmts = attributes.map((a: any) => 
        env.MEYYA_DB.prepare('INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)')
          .bind(lastRowId, a.attribute_name, a.attribute_value)
      );
      await env.MEYYA_DB.batch(attrStmts);
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

