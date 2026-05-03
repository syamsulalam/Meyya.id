import { ensureCommerceSchema } from './_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const { results: bundles } = await env.MEYYA_DB.prepare(`
      SELECT * FROM product_bundles WHERE is_active = 1 ORDER BY created_at DESC
    `).all();

    for (const bundle of bundles || []) {
      const { results: items } = await env.MEYYA_DB.prepare(`
        SELECT bi.*, p.name, p.slug, p.image_url, p.base_price
        FROM product_bundle_items bi
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
