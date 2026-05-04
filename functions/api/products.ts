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

      const images = await env.MEYYA_DB.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC').bind(p.id).all();
      p.images = images.results || [];
      if (p.images.length > 0) {
        const primary = p.images.find((img: any) => img.is_primary === 1) || p.images[0];
        p.image_url = primary.image_url || p.image_url;
      }

      const variants = await env.MEYYA_DB.prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY color_name ASC, size_name ASC, option_label ASC').bind(p.id).all();
      p.variants = hydrateVariants(variants.results || []);

      const related = await env.MEYYA_DB.prepare(`
        SELECT rp.id, rp.name, rp.slug, rp.image_url, rp.base_price
        FROM product_related rel
        JOIN products rp ON rp.id = rel.related_product_id
        WHERE rel.product_id = ? AND rp.deleted_at IS NULL
        ORDER BY rel.sort_order ASC
      `).bind(p.id).all();
      p.related_products = related.results || [];
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
    const { name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, is_active, is_preorder, colors, sizes, attributes, images, variants, meta_title, meta_description, canonical_slug, og_image_url, low_stock_threshold } = body;
    const cleanVariants = sanitizeVariants(variants);
    const normalizedStock = is_preorder ? 0 : (cleanVariants.length > 0
      ? cleanVariants.reduce((sum: number, variant: any) => sum + (variant.is_active ? Number(variant.stock || 0) : 0), 0)
      : Number(stock || 0));
    
    const info = await env.MEYYA_DB.prepare(
      'INSERT INTO products (name, category_id, slug, description, image_url, base_price, production_cost, weight, stock, last_stock_update, is_active, is_preorder, meta_title, meta_description, canonical_slug, og_image_url, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, category_id, slug, description, image_url, base_price, production_cost, weight, normalizedStock, is_active, is_preorder || 0, meta_title || null, meta_description || null, canonical_slug || slug || null, og_image_url || image_url || null, Number(low_stock_threshold || 5)).run();
    
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

    const cleanImages = sanitizeImages(images, image_url);
    if (cleanImages.length > 0) {
      await env.MEYYA_DB.batch(cleanImages.map((img: any, index: number) =>
        env.MEYYA_DB.prepare('INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, color_name) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(lastRowId, img.image_url, img.alt_text || name, index, img.is_primary ? 1 : 0, img.color_name || null)
      ));
    }

    if (cleanVariants.length > 0) {
      await env.MEYYA_DB.batch(cleanVariants.map((variant: any) =>
        env.MEYYA_DB.prepare('INSERT INTO product_variants (product_id, color_name, size_name, option_signature, option_label, sku, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(lastRowId, variant.color_name, variant.size_name, variant.option_signature, variant.option_label, variant.sku || null, variant.stock, variant.is_active ? 1 : 0)
      ));
    }

    if (normalizedStock !== 0) {
      await env.MEYYA_DB.prepare(`
        INSERT INTO stock_movements (product_id, change_qty, reason, note)
        VALUES (?, ?, 'INITIAL_STOCK', ?)
      `).bind(lastRowId, normalizedStock, 'Produk dibuat').run();
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

function sanitizeImages(images: any, fallbackImageUrl?: string) {
  const source = Array.isArray(images) ? images : [];
  const clean = source
    .map((img: any) => ({
      image_url: String(img?.image_url || '').trim(),
      alt_text: String(img?.alt_text || '').trim(),
      color_name: String(img?.color_name || '').trim(),
      is_primary: Boolean(img?.is_primary),
    }))
    .filter((img: any) => img.image_url);

  if (clean.length === 0 && fallbackImageUrl) {
    clean.push({ image_url: fallbackImageUrl, alt_text: '', color_name: '', is_primary: true });
  }
  if (!clean.some((img: any) => img.is_primary) && clean.length > 0) clean[0].is_primary = true;
  return clean;
}

function sanitizeVariants(variants: any) {
  if (!Array.isArray(variants)) return [];
  return variants
    .map((variant: any) => {
      const colorName = String(variant?.color_name || '').trim() || 'Standar';
      const sizeName = String(variant?.size_name || '').trim() || 'Semua Ukuran';
      const optionValues = normalizeOptionValues(variant?.option_values, colorName, sizeName);
      return {
        color_name: colorName,
        size_name: sizeName,
        option_signature: canonicalOptionSignature(optionValues),
        option_label: buildOptionLabel(optionValues),
        sku: String(variant?.sku || '').trim(),
        stock: Number(variant?.stock || 0),
        is_active: variant?.is_active !== false && variant?.is_active !== 0,
      };
    })
    .filter((variant: any) => variant.option_signature || variant.color_name || variant.size_name);
}

function hydrateVariants(variants: any[]) {
  return variants.map((variant: any) => {
    const optionValues = parseOptionSignature(variant.option_signature) || normalizeOptionValues(null, variant.color_name, variant.size_name);
    return {
      ...variant,
      option_values: optionValues,
      option_label: variant.option_label || buildOptionLabel(optionValues),
    };
  });
}

function normalizeOptionValues(input: any, colorName?: string, sizeName?: string) {
  const values: Record<string, string> = {};
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    for (const [key, value] of Object.entries(input)) {
      const cleanKey = String(key).trim();
      const cleanValue = String(value ?? '').trim();
      if (cleanKey && cleanValue) values[cleanKey] = cleanValue;
    }
  }
  if (colorName && colorName !== 'Standar' && !values.Warna) values.Warna = colorName;
  if (sizeName && sizeName !== 'Semua Ukuran' && !values.Ukuran) values.Ukuran = sizeName;
  return values;
}

function canonicalOptionSignature(values: Record<string, string>) {
  const sorted = Object.keys(values).sort().reduce((acc: Record<string, string>, key) => {
    acc[key] = values[key];
    return acc;
  }, {});
  return Object.keys(sorted).length > 0 ? JSON.stringify(sorted) : '';
}

function buildOptionLabel(values: Record<string, string>) {
  return Object.entries(values).map(([key, value]) => `${key}: ${value}`).join(' / ') || 'Standar';
}

function parseOptionSignature(signature: any) {
  if (!signature || typeof signature !== 'string') return null;
  try {
    return normalizeOptionValues(JSON.parse(signature));
  } catch {
    return null;
  }
}
