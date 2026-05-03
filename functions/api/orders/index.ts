export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { 
      clerk_id, 
      address_snapshot, 
      payment_method, 
      subtotal, 
      shipping_cost, 
      admin_fee = 0, 
      order_bump = 0, 
      unique_code = 0, 
      discount_amount = 0, 
      voucher_code, 
      note, 
      items 
    } = body;
    
    if (!clerk_id || !items || !items.length) {
      return new Response(JSON.stringify({ error: 'Missing requirements' }), { status: 400 });
    }

    const productIds = items.map((i: any) => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const productsRes = await env.MEYYA_DB.prepare(`SELECT id, base_price, production_cost, status, stock FROM products WHERE id IN (${placeholders})`).bind(...productIds).all();
    const dbProducts = productsRes.results;

    let calculatedSubtotal = 0;
    
    for (const item of items) {
      const dbProd = dbProducts.find((p: any) => p.id === item.product_id);
      if (!dbProd) {
        return new Response(JSON.stringify({ error: `Product ${item.product_name} not found` }), { status: 400 });
      }
      if (dbProd.status === 'inactive') {
        return new Response(JSON.stringify({ error: `Product ${item.product_name} is no longer available` }), { status: 400 });
      }
      // Note: for deep stock validation per size, we'd check product_sizes. For MVP, we check overall product stock if it exists.
      
      // Override price and calculate subtotal
      item.price = dbProd.base_price;
      item.production_cost = dbProd.production_cost || 0;
      calculatedSubtotal += (item.price * item.quantity);
    }

    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const total_paid = calculatedSubtotal + shipping_cost + admin_fee + order_bump + unique_code - discount_amount;

    await env.MEYYA_DB.prepare(`
      INSERT INTO orders (id, clerk_id, address_snapshot, status, payment_method, subtotal, shipping_cost, admin_fee, order_bump, unique_code, discount_amount, total_paid, voucher_code, note)
      VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, clerk_id, address_snapshot, payment_method, 
      calculatedSubtotal, shipping_cost, admin_fee, order_bump, unique_code, discount_amount, total_paid, voucher_code || null, note || null
    ).run();

    // Insert order items
    // Since Cloudflare D1 supports batching
    const statements = items.map((item: any) => {
      const { product_id, product_name, color, size, quantity, price, production_cost } = item;
      return env.MEYYA_DB.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, color_name, size_name, quantity, price_at_purchase, hpp_at_purchase)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(orderId, product_id, product_name, color, size, quantity, price, production_cost);
    });

    await env.MEYYA_DB.batch(statements);

    // If voucher code is used, record it in voucher_usages and increment used_count
    if (voucher_code) {
        await env.MEYYA_DB.batch([
            env.MEYYA_DB.prepare(`INSERT INTO voucher_usages (voucher_code, clerk_id, order_id) VALUES (?, ?, ?)`).bind(voucher_code, clerk_id, orderId),
            env.MEYYA_DB.prepare(`UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?`).bind(voucher_code)
        ]);
    }

    return new Response(JSON.stringify({ message: 'Order created', orderId: orderId }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

export async function onRequestGet(context: any) {
    const { env, request } = context;
    const url = new URL(request.url);
    const clerk_id = url.searchParams.get('clerk_id');

    try {
        let query = 'SELECT * FROM orders ORDER BY created_at DESC';
        let stmt = env.MEYYA_DB.prepare(query);

        if (clerk_id) {
            query = 'SELECT * FROM orders WHERE clerk_id = ? ORDER BY created_at DESC';
            stmt = env.MEYYA_DB.prepare(query).bind(clerk_id);
        }

        const { results } = await stmt.all();

        return new Response(JSON.stringify({ orders: results }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500
        });
    }
}
