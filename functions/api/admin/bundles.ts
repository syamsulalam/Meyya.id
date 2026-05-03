import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const { results: bundles } = await env.MEYYA_DB.prepare('SELECT * FROM product_bundles ORDER BY created_at DESC').all();
    for (const bundle of bundles || []) {
      const { results: items } = await env.MEYYA_DB.prepare(`
        SELECT bi.*, p.name, p.slug FROM product_bundle_items bi
        JOIN products p ON p.id = bi.product_id
        WHERE bi.bundle_id = ?
      `).bind(bundle.id).all();
      bundle.items = items || [];
    }
    return new Response(JSON.stringify(bundles || []), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!body.name || !body.slug || !body.bundle_price || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Name, slug, price, and items are required' }), { status: 400 });
    }

    const info = await env.MEYYA_DB.prepare(`
      INSERT INTO product_bundles (name, slug, description, image_url, bundle_price, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(body.name, body.slug, body.description || null, body.image_url || null, Number(body.bundle_price), body.is_active === false ? 0 : 1).run();

    const bundleId = info.meta.last_row_id;
    const statements = items
      .filter((item: any) => item.product_id)
      .map((item: any) => env.MEYYA_DB.prepare(`
        INSERT INTO product_bundle_items (bundle_id, product_id, quantity) VALUES (?, ?, ?)
      `).bind(bundleId, Number(item.product_id), Number(item.quantity || 1)));
    if (statements.length) await env.MEYYA_DB.batch(statements);

    await auditLog(env, data?.clerkId || null, 'CREATE_BUNDLE', 'bundle', String(bundleId), { name: body.name });

    return new Response(JSON.stringify({ id: bundleId }), { headers: { 'Content-Type': 'application/json' }, status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
