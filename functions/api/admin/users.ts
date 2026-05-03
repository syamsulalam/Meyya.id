import { ensureUsersSchema, getUsersDebugInfo } from '../_users';
import { debugErrorResponse, jsonResponse } from '../_debug';

export async function onRequestGet(context: any) {
  const { env } = context;
  let phase = 'ensure-users-schema';

  try {
    await ensureUsersSchema(env);

    phase = 'select-admin-users';
    const { results: users } = await env.MEYYA_DB.prepare(`
      SELECT u.clerk_id, u.first_name, u.last_name, u.email, u.role, u.phone_wa, u.last_login_at, u.joined_at,
             COUNT(o.id) as orders,
             COALESCE(SUM(o.total_paid), 0) as ltv,
             MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.clerk_id = o.clerk_id AND o.status IN ('PAID', 'SHIPPED', 'COMPLETED', 'SELESAI', 'PROCESSING')
      GROUP BY u.clerk_id
      ORDER BY u.joined_at DESC
    `).all();

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
      returnRate: '0%', // Mock
      favoriteDay: '-', // Mock
      size: '-' // Mock 
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
