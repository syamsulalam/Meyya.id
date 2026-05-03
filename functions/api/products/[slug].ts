import { auditLog, ensureCommerceSchema } from '../_commerce';

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
  const { env, request } = context;
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop(); 

  try {
    await ensureCommerceSchema(env);
    await env.MEYYA_DB.prepare(`
      DELETE FROM product_attributes
      WHERE TRIM(COALESCE(attribute_name, '')) = ''
        OR TRIM(COALESCE(attribute_value, '')) = ''
    `).run();

    const p = await env.MEYYA_DB.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.slug = ? AND p.deleted_at IS NULL
    `).bind(slug).first();

    if (!p) {
      return new Response(JSON.stringify({ error: 'Data tidak ditemukan' }), { status: 404 });
    }

    const colors = await env.MEYYA_DB.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').bind(p.id).all();
    p.colors = colors.results;

    const sizes = await env.MEYYA_DB.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').bind(p.id).all();
    p.sizes = sizes.results;

    const attrs = await env.MEYYA_DB.prepare('SELECT attribute_name, attribute_value FROM product_attributes WHERE product_id = ?').bind(p.id).all();
    p.attributes = sanitizeProductAttributes(attrs.results);

    const reviews = await env.MEYYA_DB.prepare(`
      SELECT rating, review_text, created_at
      FROM product_reviews
      WHERE product_id = ? AND status = 'PUBLISHED'
      ORDER BY created_at DESC LIMIT 20
    `).bind(p.id).all();
    p.reviews = reviews.results || [];
    p.review_count = p.reviews.length;
    p.rating_average = p.reviews.length ? p.reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / p.reviews.length : 0;

    const related = await env.MEYYA_DB.prepare(`
      SELECT rp.* FROM products rp
      LEFT JOIN product_related rel ON rel.related_product_id = rp.id AND rel.product_id = ?
      WHERE rp.deleted_at IS NULL AND rp.is_active = 1 AND rp.id != ?
        AND (rel.product_id IS NOT NULL OR rp.category_id = ?)
      ORDER BY CASE WHEN rel.product_id IS NOT NULL THEN 0 ELSE 1 END, rel.sort_order ASC, rp.created_at DESC
      LIMIT 4
    `).bind(p.id, p.id, p.category_id).all();
    p.related_products = related.results || [];

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
    const { env, request, params, data } = context;
    await ensureCommerceSchema(env);
    const body = await request.json();
    const { name, category_id, slug: productSlug, description, image_url, base_price, production_cost, weight, stock, is_active, is_preorder, colors, sizes, attributes, meta_title, meta_description, canonical_slug, og_image_url, low_stock_threshold } = body;
    
    // In CF Pages, params is populated from the filename [xyz].ts
    // If it's not defined we fallback to URL parsing
    const id = params?.slug || new URL(request.url).pathname.split('/').pop();
    
    // Update basic fields
    await env.MEYYA_DB.prepare(
      'UPDATE products SET name = ?, category_id = ?, slug = ?, description = ?, image_url = ?, base_price = ?, production_cost = ?, weight = ?, is_active = ?, is_preorder = ?, meta_title = ?, meta_description = ?, canonical_slug = ?, og_image_url = ?, low_stock_threshold = ? WHERE id = ?'
    ).bind(name, category_id, productSlug, description, image_url, base_price, production_cost, weight, is_active, is_preorder || 0, meta_title || null, meta_description || null, canonical_slug || productSlug || null, og_image_url || image_url || null, Number(low_stock_threshold || 5), id).run();

    // Handle stock update
    const currentProduct = await env.MEYYA_DB.prepare('SELECT stock FROM products WHERE id = ?').bind(id).first();
    if (currentProduct && currentProduct.stock !== stock) {
      await env.MEYYA_DB.prepare('UPDATE products SET stock = ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?').bind(stock, id).run();
      await env.MEYYA_DB.prepare(`
        INSERT INTO stock_movements (product_id, change_qty, reason, note)
        VALUES (?, ?, 'MANUAL_ADJUSTMENT', ?)
      `).bind(id, Number(stock || 0) - Number(currentProduct.stock || 0), 'Admin product form update').run();
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
    
    if (sizes) {
      await env.MEYYA_DB.prepare('DELETE FROM product_sizes WHERE product_id = ?').bind(id).run();
      if (sizes.length > 0) {
        const sizeStmts = sizes.map((s: string) => 
          env.MEYYA_DB.prepare('INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)')
            .bind(id, s)
        );
        await env.MEYYA_DB.batch(sizeStmts);
      }
    }
    
    if (attributes) {
      await env.MEYYA_DB.prepare('DELETE FROM product_attributes WHERE product_id = ?').bind(id).run();
      const cleanAttributes = sanitizeProductAttributes(attributes);
      if (cleanAttributes.length > 0) {
        const attrStmts = cleanAttributes.map((a: any) =>
          env.MEYYA_DB.prepare('INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)')
            .bind(id, a.attribute_name, a.attribute_value)
        );
        await env.MEYYA_DB.batch(attrStmts);
      }
    }

    await auditLog(env, data?.clerkId || null, 'UPDATE_PRODUCT', 'product', String(id), { name, slug: productSlug });

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
    const { env, request, params, data } = context;
    await ensureCommerceSchema(env);
    const id = params?.slug || new URL(request.url).pathname.split('/').pop();

    await env.MEYYA_DB.prepare('UPDATE products SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    await auditLog(env, data?.clerkId || null, 'SOFT_DELETE_PRODUCT', 'product', String(id), {});

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
