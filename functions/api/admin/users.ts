import { ensureUsersSchema, getUsersDebugInfo } from '../_users';
import { debugErrorResponse, jsonResponse } from '../_debug';
import { ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  let phase = 'ensure-users-schema';

  try {
    await ensureUsersSchema(env);
    await ensureCommerceSchema(env);

    phase = 'select-admin-users';
    const { results: users } = await env.MEYYA_DB.prepare(`
      SELECT
        u.clerk_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.phone_wa,
        u.birth_date,
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

    phase = 'select-admin-user-return-stats';
    const { results: returnRows } = await env.MEYYA_DB.prepare(`
      SELECT clerk_id, COUNT(*) AS return_count
      FROM return_requests
      GROUP BY clerk_id
    `).all();

    phase = 'select-admin-user-event-stats';
    const { results: eventRows } = await env.MEYYA_DB.prepare(`
      SELECT
        clerk_id,
        MAX(CASE WHEN event_type = 'CART_UPDATED' THEN created_at ELSE NULL END) AS last_cart_at,
        MAX(CASE WHEN event_type = 'PRODUCT_VIEW' THEN created_at ELSE NULL END) AS last_product_view_at,
        MAX(CASE WHEN event_type = 'CHECKOUT_STARTED' THEN created_at ELSE NULL END) AS last_checkout_at,
        SUM(CASE WHEN event_type = 'CAMPAIGN_TOUCH' THEN 1 ELSE 0 END) AS campaign_touch_count
      FROM user_events
      WHERE clerk_id IS NOT NULL
      GROUP BY clerk_id
    `).all();

    const favoriteSize = firstByClerkId(sizeRows, 'size_name');
    const favoriteDay = firstByClerkId(dayRows, 'day_index');
    const voucherCounts = numberByClerkId(voucherRows, 'voucher_count');
    const wishlistCounts = numberByClerkId(wishlistRows, 'wishlist_count');
    const returnCounts = numberByClerkId(returnRows, 'return_count');
    const eventStats = eventRowsByClerkId(eventRows);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const enrichedUsers = users.map((u: any) => {
      const events = eventStats[u.clerk_id] || {};
      const birthday = getBirthdaySignal(u.birth_date);
      const lastCartAt = events.lastCartAt || null;
      const lastOrderDate = u.last_order_date || null;
      const cartAgeHours = lastCartAt ? Math.floor((Date.now() - new Date(lastCartAt).getTime()) / 3600000) : null;
      const hasOrderAfterCart = lastCartAt && lastOrderDate && new Date(lastOrderDate).getTime() >= new Date(lastCartAt).getTime();
      const abandonedCart = Boolean(lastCartAt && !hasOrderAfterCart && cartAgeHours !== null && cartAgeHours >= 4 && cartAgeHours <= 24 * 14);
      const orderCount = Number(u.orders || 0);
      const returnCount = returnCounts[u.clerk_id] || 0;

      return {
        id: u.clerk_id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name',
        email: u.email,
        phone_wa: u.phone_wa,
        birthDate: u.birth_date || null,
        birthday,
        status: u.role === 'admin' ? 'Admin' : 'Regular',
        statusColor: u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800',
        orders: orderCount,
        ltv: u.ltv,
        lastActive: u.last_order_date || events.lastProductViewAt || events.lastCartAt || u.last_login_at || u.joined_at,
        joinDate: u.joined_at,
        aov: orderCount > 0 ? (u.ltv / orderCount) : 0,
        pendingOrders: u.pending_orders || 0,
        pendingAmount: u.pending_amount || 0,
        returnRate: orderCount > 0 ? `${Math.round((returnCount / orderCount) * 100)}%` : '0%',
        returnCount,
        favoriteDay: favoriteDay[u.clerk_id] !== undefined ? dayNames[Number(favoriteDay[u.clerk_id])] : '-',
        size: favoriteSize[u.clerk_id] || '-',
        voucherCount: voucherCounts[u.clerk_id] || 0,
        wishlistCount: wishlistCounts[u.clerk_id] || 0,
        lastCartAt,
        lastProductViewAt: events.lastProductViewAt || null,
        lastCheckoutAt: events.lastCheckoutAt || null,
        campaignTouchCount: events.campaignTouchCount || 0,
        abandonedCart,
        cartAgeHours,
      };
    });

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

function eventRowsByClerkId(rows: any[] = []) {
  const result: Record<string, any> = {};
  for (const row of rows) {
    if (!row.clerk_id) continue;
    result[row.clerk_id] = {
      lastCartAt: row.last_cart_at || null,
      lastProductViewAt: row.last_product_view_at || null,
      lastCheckoutAt: row.last_checkout_at || null,
      campaignTouchCount: Number(row.campaign_touch_count || 0),
    };
  }
  return result;
}

function getBirthdaySignal(birthDate: string | null) {
  if (!birthDate) return null;
  const parts = String(birthDate).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const now = new Date();
  const currentYearBirthday = new Date(now.getFullYear(), parts[1] - 1, parts[2]);
  const nextBirthday = currentYearBirthday < startOfToday(now)
    ? new Date(now.getFullYear() + 1, parts[1] - 1, parts[2])
    : currentYearBirthday;
  const daysUntil = Math.ceil((nextBirthday.getTime() - startOfToday(now).getTime()) / 86400000);
  return {
    daysUntil,
    isThisMonth: nextBirthday.getMonth() === now.getMonth(),
    isToday: daysUntil === 0,
  };
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
