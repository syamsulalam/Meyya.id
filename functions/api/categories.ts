import { auditLog, ensureCommerceSchema } from './_commerce';

function parseOptions(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parseOptions(parsed);
  } catch {
    // Fall back to admin-entered comma/newline-separated text.
  }

  return value
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeAttributes(attributes: any): { name: string; options: string[] }[] {
  if (!Array.isArray(attributes)) return [];

  return attributes
    .map((attr: any) => ({
      name: String(attr?.name || '').trim(),
      options: parseOptions(attr?.options),
    }))
    .filter((attr) => attr.name && attr.options.length > 0);
}

export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    await ensureCommerceSchema(env);
    await env.MEYYA_DB.prepare(`
      DELETE FROM category_attributes
      WHERE TRIM(COALESCE(name, '')) = ''
        OR TRIM(COALESCE(options, '')) IN ('', '[]')
    `).run();

    const { results: categories } = await env.MEYYA_DB.prepare(`
      SELECT c.*, COUNT(p.id) as count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.is_active = 1
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
    `).all();

    for (const c of categories) {
      const { results: attrs } = await env.MEYYA_DB.prepare('SELECT * FROM category_attributes WHERE category_id = ?').bind(c.id).all();
      c.attributes = (attrs || [])
        .map((attr: any) => ({
          ...attr,
          name: String(attr.name || '').trim(),
          options: JSON.stringify(parseOptions(attr.options)),
        }))
        .filter((attr: any) => attr.name && parseOptions(attr.options).length > 0);
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
    const { env, request, data } = context;
    await ensureCommerceSchema(env);
    const body = await request.json();
    const { name, slug, image_url, has_colors, has_sizes, attributes } = body;

    const info = await env.MEYYA_DB.prepare(`
      INSERT INTO categories (name, slug, image_url, has_colors, has_sizes) VALUES (?, ?, ?, ?, ?)
    `).bind(name, slug, image_url, has_colors ? 1 : 0, has_sizes ? 1 : 0).run();

    const newCatId = info.meta.last_row_id;

    const cleanAttributes = sanitizeAttributes(attributes);
    if (cleanAttributes.length > 0) {
      const insertStmts = cleanAttributes.map((attr: any) =>
        env.MEYYA_DB.prepare('INSERT INTO category_attributes (category_id, name, options) VALUES (?, ?, ?)')
          .bind(newCatId, attr.name, JSON.stringify(attr.options || []))
      );
      await env.MEYYA_DB.batch(insertStmts);
    }

    await auditLog(env, data?.clerkId || null, 'CREATE_CATEGORY', 'category', String(newCatId), { name, slug });

    return new Response(JSON.stringify({ id: newCatId }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

