import { ensureUsersSchema, getUsersDebugInfo } from '../_users';
import { debugErrorResponse, jsonResponse } from '../_debug';

export async function onRequestGet(context: any) {
  const { env } = context;
  let phase = 'ensure-users-schema';

  try {
    await ensureUsersSchema(env);

    phase = 'select-admin-users';
    const { results: users } = await env.MEYYA_DB.prepare(`
      SELECT
        u.clerk_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.phone_wa,
        u.last_login_at,
        u.joined_at,
        COUNT(o.id) AS orders,
        COALESCE(SUM(CASE WHEN o.status IN ('PAID', 'SHIPPED', 'COMPLETED', 'SELESAI', 'PROCESSING') THEN o.total_paid ELSE 0 END), 0) AS ltv,
        MAX(o.created_at) AS last_order_date,
        SUM(CASE WHEN o.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PENDING' THEN o.total_paid ELSE 0 END), 0) AS pending_amount
      FROM users u
      LEFT JOIN orders o ON u.clerk_id = o.clerk_id
      GROUP BY u.clerk_id
      ORDER BY u.joined_at DESC
    `).all();

    phase = 'select-admin-user-size-stats';
    const { results: sizeRows } = await env.MEYYA_DB.prepare(`
      SELECT o.clerk_id, oi.size_name, SUM(oi.quantity) AS total_quantity
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.size_name IS NOT NULL AND oi.size_name != ''
      GROUP BY o.clerk_id, oi.size_name
      ORDER BY o.clerk_id ASC, total_quantity DESC
    `).all();

    phase = 'select-admin-user-day-stats';
    const { results: dayRows } = await env.MEYYA_DB.prepare(`
      SELECT clerk_id, strftime('%w', created_at) AS day_index, COUNT(*) AS total_orders
      FROM orders
      WHERE created_at IS NOT NULL
      GROUP BY clerk_id, day_index
      ORDER BY clerk_id ASC, total_orders DESC
    `).all();

    phase = 'select-admin-user-voucher-stats';
    const { results: voucherRows } = await env.MEYYA_DB.prepare(`
      SELECT clerk_id, COUNT(*) AS voucher_count
      FROM voucher_usages
      GROUP BY clerk_id
    `).all();

    phase = 'select-admin-user-wishlist-stats';
    const { results: wishlistRows } = await env.MEYYA_DB.prepare(`
      SELECT user_id AS clerk_id, COUNT(*) AS wishlist_count
      FROM wishlists
      GROUP BY user_id
    `).all();

    const favoriteSize = firstByClerkId(sizeRows, 'size_name');
    const favoriteDay = firstByClerkId(dayRows, 'day_index');
    const voucherCounts = numberByClerkId(voucherRows, 'voucher_count');
    const wishlistCounts = numberByClerkId(wishlistRows, 'wishlist_count');
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const enrichedUsers = users.map((u: any) => ({
      id: u.clerk_id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name',
      email: u.email,
      phone_wa: u.phone_wa,
      status: u.role === 'admin' ? 'Admin' : 'Regular',
      statusColor: u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800',
      orders: u.orders,
      ltv: u.ltv,
      lastActive: u.last_order_date || u.last_login_at || u.joined_at,
      joinDate: u.joined_at,
      aov: u.orders > 0 ? (u.ltv / u.orders) : 0,
      pendingOrders: u.pending_orders || 0,
      pendingAmount: u.pending_amount || 0,
      returnRate: '-',
      favoriteDay: favoriteDay[u.clerk_id] !== undefined ? dayNames[Number(favoriteDay[u.clerk_id])] : '-',
      size: favoriteSize[u.clerk_id] || '-',
      voucherCount: voucherCounts[u.clerk_id] || 0,
      wishlistCount: wishlistCounts[u.clerk_id] || 0
    }));

    return jsonResponse(enrichedUsers);
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/users',
      method: 'GET',
      phase,
      has_db_binding: Boolean(env.MEYYA_DB),
      d1: await getUsersDebugInfo(env),
    });
  }
}

function firstByClerkId(rows: any[] = [], valueKey: string) {
  const result: Record<string, any> = {};

  for (const row of rows) {
    if (row.clerk_id && result[row.clerk_id] === undefined) {
      result[row.clerk_id] = row[valueKey];
    }
  }

  return result;
}

function numberByClerkId(rows: any[] = [], valueKey: string) {
  const result: Record<string, number> = {};

  for (const row of rows) {
    if (row.clerk_id) {
      result[row.clerk_id] = Number(row[valueKey] || 0);
    }
  }

  return result;
}
