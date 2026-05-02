export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const { results: users } = await env.MEYYA_DB.prepare(`
      SELECT * FROM users ORDER BY joined_at DESC
    `).all();

    // Calculate mock stats since we don't have enough data in SQLite yet
    const enrichedUsers = users.map((u: any) => ({
      id: u.clerk_id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'No Name',
      email: u.email,
      status: u.role === 'admin' ? 'Admin' : 'Regular',
      statusColor: u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800',
      orders: 0,
      ltv: 0,
      lastActive: u.last_login_at || u.joined_at,
      joinDate: u.joined_at,
      aov: 0,
      returnRate: '0%',
      favoriteDay: '-',
      size: '-'
    }));

    return new Response(JSON.stringify(enrichedUsers), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
