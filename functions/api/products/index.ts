export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results: products } = await env.MEYYA_DB.prepare(
      'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE is_active = 1'
    ).all();
    
    // Cloudflare D1 doesn't support nested queries inside map sequentially efficiently, but for a small dataset.
    // However, it's better to use batch or just loop with Promise.all.
    const enrichedProducts = await Promise.all(products.map(async (p) => {
      const [{ results: colors }, { results: sizes }] = await env.MEYYA_DB.batch([
        env.MEYYA_DB.prepare('SELECT color_name, hex_code FROM product_colors WHERE product_id = ?').bind(p.id),
        env.MEYYA_DB.prepare('SELECT size_name FROM product_sizes WHERE product_id = ?').bind(p.id)
      ]);
      
      return {
        ...p,
        colors,
        sizes: sizes.map(s => s.size_name),
        // we might also need to parse images
        images: JSON.parse(p.images_json || '[]')
      };
    }));
    
    return Response.json({ products: enrichedProducts });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
