import { ensureCommerceSchema, expirePendingOrders } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const timeline = url.searchParams.get('timeline') || 'all'; // 'today', 'month', 'all'

  try {
    await ensureCommerceSchema(env);
    await expirePendingOrders(env);
    let dateFilter = '';
    let userDateFilter = '';
    
    if (timeline === 'today') {
       dateFilter = " WHERE date(created_at) = date('now')";
       userDateFilter = " WHERE date(joined_at) = date('now')";
    } else if (timeline === 'month') {
       dateFilter = " WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')";
       userDateFilter = " WHERE strftime('%Y-%m', joined_at) = strftime('%Y-%m', 'now')";
    }

    const { results: orders } = await env.MEYYA_DB.prepare(`
      SELECT o.id, o.status, o.total_paid, o.subtotal, o.shipping_cost, o.created_at,
      COALESCE(SUM((oi.price_at_purchase - COALESCE(oi.hpp_at_purchase, oi.price_at_purchase * 0.7)) * oi.quantity), 0) as profit
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${dateFilter ? dateFilter.replace('created_at', 'o.created_at') : ''}
      GROUP BY o.id
    `).all();
    
    const { results: usersCount } = await env.MEYYA_DB.prepare(`SELECT count(*) as total FROM users${userDateFilter}`).all();
    const { results: productsCount } = await env.MEYYA_DB.prepare(`SELECT count(*) as total FROM products WHERE deleted_at IS NULL`).all();
    const { results: categoriesCount } = await env.MEYYA_DB.prepare(`SELECT count(*) as total FROM categories WHERE deleted_at IS NULL`).all();
    const { results: lowStockProducts } = await env.MEYYA_DB.prepare(`
      SELECT id, name, stock, low_stock_threshold
      FROM products
      WHERE deleted_at IS NULL AND is_active = 1 AND is_preorder != 1 AND stock <= COALESCE(low_stock_threshold, 5)
      ORDER BY stock ASC, name ASC
      LIMIT 10
    `).all();
    const { results: productMargins } = await env.MEYYA_DB.prepare(`
      SELECT oi.product_id, oi.product_name,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.price_at_purchase * oi.quantity) AS revenue,
        SUM((oi.price_at_purchase - COALESCE(oi.hpp_at_purchase, oi.price_at_purchase * 0.7)) * oi.quantity) AS profit
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'SELESAI')
      GROUP BY oi.product_id, oi.product_name
      ORDER BY profit DESC
      LIMIT 8
    `).all();
    const { results: categoryMargins } = await env.MEYYA_DB.prepare(`
      SELECT c.name AS category_name,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.price_at_purchase * oi.quantity) AS revenue,
        SUM((oi.price_at_purchase - COALESCE(oi.hpp_at_purchase, oi.price_at_purchase * 0.7)) * oi.quantity) AS profit
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'SELESAI')
      GROUP BY c.id, c.name
      ORDER BY profit DESC
      LIMIT 8
    `).all();

    const validOrders = orders.filter((o: any) => o.status === 'PAID' || o.status === 'SHIPPED' || o.status === 'COMPLETED' || o.status === 'SELESAI' || o.status === 'PROCESSING');

    const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.total_paid || 0), 0);
    const totalProfit = validOrders.reduce((sum: number, o: any) => sum + (o.profit || 0), 0);

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
      lowStockProducts,
      productMargins,
      categoryMargins,
      rawOrders: orders // to help with sparkline charts
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
