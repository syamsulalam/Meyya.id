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

    phase = 'select-admin-user-event-summaries';
    const { results: eventSummaryRows } = await env.MEYYA_DB.prepare(`
      SELECT
        clerk_id,
        last_event_at,
        last_event_type,
        last_source,
        last_medium,
        last_campaign,
        last_device_type,
        last_page_path,
        last_referrer,
        last_cart_at,
        last_product_view_at,
        last_checkout_at,
        campaign_touch_count,
        search_count,
        voucher_apply_count
      FROM user_event_summaries
    `).all();

    phase = 'select-admin-user-cart-snapshots';
    const { results: cartRows } = await env.MEYYA_DB.prepare(`
      SELECT clerk_id, item_count, subtotal, product_ids, items, status, last_event_at, converted_order_id
      FROM user_cart_snapshots
    `).all();

    const favoriteSize = firstByClerkId(sizeRows, 'size_name');
    const favoriteDay = firstByClerkId(dayRows, 'day_index');
    const voucherCounts = numberByClerkId(voucherRows, 'voucher_count');
    const wishlistCounts = numberByClerkId(wishlistRows, 'wishlist_count');
    const returnCounts = numberByClerkId(returnRows, 'return_count');
    const eventStats = eventSummariesByClerkId(eventSummaryRows);
    const cartSnapshots = cartSnapshotsByClerkId(cartRows);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const enrichedUsers = users.map((u: any) => {
      const events = eventStats[u.clerk_id] || {};
      const latestEvent = events.latestEvent || null;
      const cartSnapshot = cartSnapshots[u.clerk_id] || null;
      const birthday = getBirthdaySignal(u.birth_date);
      const lastCartAt = cartSnapshot?.lastEventAt || events.lastCartAt || null;
      const lastOrderDate = u.last_order_date || null;
      const cartAgeHours = lastCartAt ? Math.floor((Date.now() - new Date(lastCartAt).getTime()) / 3600000) : null;
      const hasOrderAfterCart = lastCartAt && lastOrderDate && new Date(lastOrderDate).getTime() >= new Date(lastCartAt).getTime();
      const hasActiveCartSnapshot = Boolean(cartSnapshot && cartSnapshot.status === 'ACTIVE' && cartSnapshot.itemCount > 0);
      const abandonedCart = Boolean(hasActiveCartSnapshot && lastCartAt && !hasOrderAfterCart && cartAgeHours !== null && cartAgeHours >= 4 && cartAgeHours <= 24 * 14);
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
        searchCount: events.searchCount || 0,
        voucherApplyCount: events.voucherApplyCount || 0,
        latestEvent,
        lastSource: latestEvent?.source || '-',
        lastMedium: latestEvent?.medium || '-',
        lastCampaign: latestEvent?.campaign || '-',
        lastDevice: latestEvent?.deviceType || '-',
        abandonedCart,
        cartAgeHours,
        cartSnapshot,
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

function cartSnapshotsByClerkId(rows: any[] = []) {
  const result: Record<string, any> = {};
  for (const row of rows) {
    if (!row.clerk_id) continue;
    result[row.clerk_id] = {
      itemCount: Number(row.item_count || 0),
      subtotal: Number(row.subtotal || 0),
      productIds: parseJson(row.product_ids, []),
      items: parseJson(row.items, []),
      status: row.status || 'ACTIVE',
      lastEventAt: row.last_event_at || null,
      convertedOrderId: row.converted_order_id || null,
    };
  }
  return result;
}

function parseJson(value: any, fallback: any) {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function eventSummariesByClerkId(rows: any[] = []) {
  const result: Record<string, any> = {};
  for (const row of rows) {
    if (!row.clerk_id) continue;
    result[row.clerk_id] = {
      lastCartAt: row.last_cart_at || null,
      lastProductViewAt: row.last_product_view_at || null,
      lastCheckoutAt: row.last_checkout_at || null,
      campaignTouchCount: Number(row.campaign_touch_count || 0),
      searchCount: Number(row.search_count || 0),
      voucherApplyCount: Number(row.voucher_apply_count || 0),
      latestEvent: {
        eventType: row.last_event_type || null,
        source: row.last_source || null,
        medium: row.last_medium || null,
        campaign: row.last_campaign || null,
        deviceType: row.last_device_type || null,
        pagePath: row.last_page_path || null,
        referrer: row.last_referrer || null,
        createdAt: row.last_event_at || null,
      },
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
