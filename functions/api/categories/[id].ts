import { auditLog, ensureCommerceSchema } from '../_commerce';

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

export async function onRequestPut(context: any) {
  try {
    const { env, request, params, data } = context;
    await ensureCommerceSchema(env);
    const body = await request.json();
    const { name, slug, image_url, has_colors, has_sizes, attributes } = body;
    const id = params.id;

    await env.MEYYA_DB.prepare(`
      UPDATE categories SET name = ?, slug = ?, image_url = ?, has_colors = ?, has_sizes = ? WHERE id = ?
    `).bind(name, slug, image_url, has_colors ? 1 : 0, has_sizes ? 1 : 0, id).run();

    if (attributes) {
      await env.MEYYA_DB.prepare('DELETE FROM category_attributes WHERE category_id = ?').bind(id).run();
      
      const cleanAttributes = sanitizeAttributes(attributes);
      if (cleanAttributes.length > 0) {
        const insertStmts = cleanAttributes.map((attr: any) =>
          env.MEYYA_DB.prepare('INSERT INTO category_attributes (category_id, name, options) VALUES (?, ?, ?)')
            .bind(id, attr.name, JSON.stringify(attr.options || []))
        );
        await env.MEYYA_DB.batch(insertStmts);
      }
    }

    await auditLog(env, data?.clerkId || null, 'UPDATE_CATEGORY', 'category', String(id), { name, slug });

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
    const { env, params, data } = context;
    await ensureCommerceSchema(env);
    const id = params.id;

    await env.MEYYA_DB.prepare('UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    await auditLog(env, data?.clerkId || null, 'SOFT_DELETE_CATEGORY', 'category', String(id), {});

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
