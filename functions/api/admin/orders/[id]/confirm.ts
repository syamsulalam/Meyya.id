export async function onRequestPost(context: any) {
  const { env, params } = context;
  const id = params.id;

  try {
    const orderResult = await env.MEYYA_DB.prepare("SELECT status FROM orders WHERE id = ?").bind(id).first();
    if (!orderResult) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }
    if (orderResult.status !== 'PENDING') {
      return new Response(JSON.stringify({ error: 'Order is not in PENDING status' }), { status: 400 });
    }

    const orderItemsResult = await env.MEYYA_DB.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").bind(id).all();
    const items = orderItemsResult.results;

    // Pre-check stocks
    const productIds = items.map((i: any) => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const productsRes = await env.MEYYA_DB.prepare(`SELECT id, is_preorder, stock FROM products WHERE id IN (${placeholders})`).bind(...productIds).all();
    
    for (const item of items) {
      const p = productsRes.results.find((prod: any) => prod.id === item.product_id);
      if (!p) {
        return new Response(JSON.stringify({ error: `Product not found` }), { status: 400 });
      }
      if (p.is_preorder !== 1 && p.stock < item.quantity) {
        return new Response(JSON.stringify({ error: `Not enough stock for product ID ${item.product_id}` }), { status: 400 });
      }
    }

    // Try to update status atomically
    const statusUpdate = await env.MEYYA_DB.prepare("UPDATE orders SET status = 'PROCESSING' WHERE id = ? AND status = 'PENDING'").bind(id).run();
    
    if (statusUpdate.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Already processing or invalid state' }), { status: 400 });
    }

    // Perform decrements since we verified it
    const updates = items.map((item: any) => {
       return env.MEYYA_DB.prepare("UPDATE products SET stock = stock - ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ? AND (is_preorder = 1 OR stock >= ?)").bind(item.quantity, item.product_id, item.quantity);
    });

    if (updates.length > 0) {
      await env.MEYYA_DB.batch(updates);
    }

    return new Response(JSON.stringify({ success: true, message: 'Order marked as paid' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
