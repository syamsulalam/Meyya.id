import { debugErrorResponse, jsonResponse } from '../../../_debug';

export async function onRequestGet(context: any) {
  const { env, params } = context;
  const clerkId = params.clerk_id;

  try {
    const { results: orders } = await env.MEYYA_DB.prepare(`
      SELECT
        o.*,
        COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.clerk_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 25
    `).bind(clerkId).all();

    if (!orders.length) {
      return jsonResponse([]);
    }

    const orderIds = orders.map((order: any) => order.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const { results: items } = await env.MEYYA_DB.prepare(`
      SELECT *
      FROM order_items
      WHERE order_id IN (${placeholders})
      ORDER BY id ASC
    `).bind(...orderIds).all();

    const itemsByOrder = items.reduce((acc: Record<string, any[]>, item: any) => {
      acc[item.order_id] = acc[item.order_id] || [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    return jsonResponse(orders.map((order: any) => ({
      ...order,
      items: itemsByOrder[order.id] || []
    })));
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/users/:clerk_id/orders',
      method: 'GET',
      phase: 'select-admin-user-orders',
      clerk_id: clerkId,
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}
