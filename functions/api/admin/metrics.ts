export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const timeline = url.searchParams.get('timeline') || 'all'; // 'today', 'month', 'all'

  try {
    let dateFilter = '';
    let userDateFilter = '';
    
    if (timeline === 'today') {
       dateFilter = " WHERE date(created_at) = date('now')";
       userDateFilter = " WHERE date(joined_at) = date('now')";
    } else if (timeline === 'month') {
       dateFilter = " WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')";
       userDateFilter = " WHERE strftime('%Y-%m', joined_at) = strftime('%Y-%m', 'now')";
    }

    const { results: orders } = await env.MEYYA_DB.prepare(`SELECT status, total_paid, subtotal, shipping_cost, created_at FROM orders${dateFilter}`).all();
    
    const { results: usersCount } = await env.MEYYA_DB.prepare(`SELECT count(*) as total FROM users${userDateFilter}`).all();
    const { results: productsCount } = await env.MEYYA_DB.prepare(`SELECT count(*) as total FROM products`).all();
    const { results: categoriesCount } = await env.MEYYA_DB.prepare(`SELECT count(*) as total FROM categories`).all();

    // In a real app we would compute COGS (HPP) to get profit. Let's assume Profit is ~30% of total_paid for mock purposes when HPP isn't available
    const totalRevenue = orders
      .filter((o: any) => o.status === 'PAID' || o.status === 'SHIPPED' || o.status === 'COMPLETED' || o.status === 'SELESAI' || o.status === 'PROCESSING')
      .reduce((sum: number, o: any) => sum + (o.total_paid || 0), 0);

    const totalProfit = totalRevenue * 0.3; // 30% margin assumption

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length;

    return new Response(JSON.stringify({
      totalRevenue,
      totalProfit,
      totalOrders,
      pendingOrders,
      totalUsers: usersCount[0]?.total || 0,
      totalProducts: productsCount[0]?.total || 0,
      totalCategories: categoriesCount[0]?.total || 0,
      rawOrders: orders // to help with sparkline charts
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
