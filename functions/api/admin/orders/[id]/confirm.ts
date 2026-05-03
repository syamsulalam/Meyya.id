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

    const updates = items.map((item: any) => {
       return env.MEYYA_DB.prepare("UPDATE products SET stock = stock - ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?").bind(item.quantity, item.product_id);
    });

    updates.push(
      env.MEYYA_DB.prepare("UPDATE orders SET status = 'PROCESSING' WHERE id = ? AND status = 'PENDING'").bind(id)
    );

    await env.MEYYA_DB.batch(updates);

    return new Response(JSON.stringify({ success: true, message: 'Order marked as paid' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
