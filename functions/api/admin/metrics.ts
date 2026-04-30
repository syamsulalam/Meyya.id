export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const orders = await env.MEYYA_DB.prepare('SELECT status, total_paid, created_at FROM orders').all();
    const results = orders.results || [];

    const totalRevenue = results
      .filter((o: any) => o.status === 'PAID' || o.status === 'SHIPPED' || o.status === 'DELIVERED')
      .reduce((sum: number, o: any) => sum + (o.total_paid || 0), 0);

    const totalOrders = results.length;
    const pendingOrders = results.filter((o: any) => o.status === 'PENDING').length;

    return new Response(JSON.stringify({
      totalRevenue,
      totalOrders,
      pendingOrders
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
