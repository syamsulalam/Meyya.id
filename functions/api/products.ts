import { auditLog, ensureCommerceSchema } from './_commerce';

function sanitizeProductAttributes(attributes: any): { attribute_name: string; attribute_value: string }[] {
  if (!Array.isArray(attributes)) return [];

  return attributes
    .map((attr: any) => ({
      attribute_name: String(attr?.attribute_name || '').trim(),
      attribute_value: String(attr?.attribute_value || '').trim(),
    }))
    .filter((attr) => attr.attribute_name && attr.attribute_value);
}

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureCommerceSchema(env);
    await env.MEYYA_DB.prepare(`
      DELETE FROM product_attributes
      WHERE TRIM(COALESCE(attribute_name, '')) = ''
        OR TRIM(COALESCE(attribute_value, '')) = ''
    `).run();

    const { results: products } = await env.MEYYA_DB.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1 AND p.deleted_at IS NULL
    `).all();

    for (const p of products) {
      const colors = await env.MEYYA_DB.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').bind(p.id).all();
      p.colors = colors.results;

      const sizes = await env.MEYYA_DB.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').bind(p.id).all();
      p.sizes = sizes.results;
      
      const attrs = await env.MEYYA_DB.prepare('SELECT attribute_name, attribute_value FROM product_attributes WHERE product_id = ?').bind(p.id).all();
      p.attributes = sanitizeProductAttributes(attrs.results);
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
    const { env, request, data } = context;
    await ensureCommerceSchema(env);
    const body = await request.json();
    const { name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, is_preorder, colors, sizes, attributes, meta_title, meta_description, canonical_slug, og_image_url, low_stock_threshold } = body;
    
    const info = await env.MEYYA_DB.prepare(
      'INSERT INTO products (name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, last_stock_update, is_active, is_preorder, meta_title, meta_description, canonical_slug, og_image_url, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, is_preorder || 0, meta_title || null, meta_description || null, canonical_slug || slug || null, og_image_url || image_url || null, Number(low_stock_threshold || 5)).run();
    
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
    
    const cleanAttributes = sanitizeProductAttributes(attributes);
    if (cleanAttributes.length > 0) {
      const attrStmts = cleanAttributes.map((a: any) =>
        env.MEYYA_DB.prepare('INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)')
          .bind(lastRowId, a.attribute_name, a.attribute_value)
      );
      await env.MEYYA_DB.batch(attrStmts);
    }

    if (Number(stock || 0) !== 0) {
      await env.MEYYA_DB.prepare(`
        INSERT INTO stock_movements (product_id, change_qty, reason, note)
        VALUES (?, ?, 'INITIAL_STOCK', ?)
      `).bind(lastRowId, Number(stock || 0), 'Produk dibuat').run();
    }

    await auditLog(env, data?.clerkId || null, 'CREATE_PRODUCT', 'product', String(lastRowId), { name, slug });
    
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

