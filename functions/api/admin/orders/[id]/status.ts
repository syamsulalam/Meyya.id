import { auditLog, cancelOrderAndReleaseReservations, ensureCommerceSchema, expirePendingOrders } from '../../../_commerce';

export async function onRequestPut(context: any) {
  const { env, params, request, data } = context;
  const id = params.id;

  try {
    await ensureCommerceSchema(env);
    await expirePendingOrders(env);

    const body = await request.json();
    const status = String(body.status || '').toUpperCase();
    const allowed = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid order status' }), { status: 400 });
    }

    const order = await env.MEYYA_DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    if (!order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });

    if (status === 'CANCELLED') {
      await cancelOrderAndReleaseReservations(env, id, 'ADMIN_CANCELLED');
    } else {
      await env.MEYYA_DB.prepare(`
        UPDATE orders
        SET status = ?,
            tracking_number = COALESCE(?, tracking_number),
            tracking_courier = COALESCE(?, tracking_courier),
            shipped_at = CASE WHEN ? = 'SHIPPED' THEN CURRENT_TIMESTAMP ELSE shipped_at END,
            completed_at = CASE WHEN ? = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = ?
      `).bind(
        status,
        body.tracking_number || null,
        body.tracking_courier || null,
        status,
        status,
        id
      ).run();

      if (status === 'COMPLETED') {
        await env.MEYYA_DB.prepare("UPDATE inventory_reservations SET status = 'CONSUMED' WHERE order_id = ? AND status = 'ACTIVE'").bind(id).run();
      }
    }

    await auditLog(env, data?.clerkId || null, 'UPDATE_ORDER_STATUS', 'order', id, { status, tracking_number: body.tracking_number, tracking_courier: body.tracking_courier });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
