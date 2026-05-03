export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerk_id = data?.clerkId;
  
  if (!clerk_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      address_snapshot, 
      payment_method = 'TRANSFER',
      destination_village_code,
      weight,
      courier_code,
      courier_name,
      courier_service,
      shipping_price,
      order_bump = 0, 
      voucher_code, 
      note, 
      items 
    } = body;
    
    // server-side generation of unique code
    const unique_code = Math.floor(Math.random() * 900) + 100;
    
    if (!items || !items.length) {
      return new Response(JSON.stringify({ error: 'Missing requirements' }), { status: 400 });
    }

    if (payment_method !== 'TRANSFER') {
      return new Response(JSON.stringify({ error: 'Payment method is not available' }), { status: 400 });
    }

    const paymentSettings = await env.MEYYA_DB.prepare('SELECT transfer_admin_fee FROM payment_settings WHERE id = 1').first();
    const finalAdminFee = Number(paymentSettings?.transfer_admin_fee || 0);

    const productIds = items.map((i: any) => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const productsRes = await env.MEYYA_DB.prepare(`SELECT id, base_price, production_cost, is_active, is_preorder, stock FROM products WHERE id IN (${placeholders})`).bind(...productIds).all();
    const dbProducts = productsRes.results;

    let calculatedSubtotal = 0;
    
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return new Response(JSON.stringify({ error: `Invalid quantity for product ${item.product_name}` }), { status: 400 });
      }

      const dbProd = dbProducts.find((p: any) => p.id === item.product_id);
      if (!dbProd) {
        return new Response(JSON.stringify({ error: `Product ${item.product_name} not found` }), { status: 400 });
      }
      if (dbProd.is_active !== 1) {
        return new Response(JSON.stringify({ error: `Product ${item.product_name} is no longer available` }), { status: 400 });
      }
      if (dbProd.is_preorder !== 1 && dbProd.stock < item.quantity) {
        return new Response(JSON.stringify({ error: `Not enough stock for product ${item.product_name}` }), { status: 400 });
      }
      
      // Override price and calculate subtotal
      item.price = dbProd.base_price;
      item.production_cost = dbProd.production_cost || 0;
      calculatedSubtotal += (item.price * item.quantity);
    }

    const finalShippingCost = await resolveShippingCost(env, {
      destination_village_code,
      weight,
      courier_code,
      courier_name,
      courier_service,
      shipping_price
    });

    let finalDiscountAmount = 0;
    
    if (voucher_code) {
        const voucher = await env.MEYYA_DB.prepare('SELECT * FROM vouchers WHERE code = ?').bind(voucher_code).first();
        if (voucher) {
            const now = new Date();
            const valid = (!voucher.valid_from || new Date(voucher.valid_from) <= now) &&
                          (!voucher.valid_until || new Date(voucher.valid_until) >= now) &&
                          (!voucher.usage_limit || voucher.used_count < voucher.usage_limit) &&
                          (!voucher.min_purchase || calculatedSubtotal >= voucher.min_purchase);
                          
            if (valid) {
                 // role check can be simple string match or handled later
                 if (voucher.discount_type === 'FIXED') {
                     finalDiscountAmount = voucher.discount_value;
                 } else if (voucher.discount_type === 'PERCENTAGE') {
                     finalDiscountAmount = (voucher.discount_value / 100) * calculatedSubtotal;
                     if (voucher.max_discount && finalDiscountAmount > voucher.max_discount) {
                         finalDiscountAmount = voucher.max_discount;
                     }
                 } else if (voucher.discount_type === 'FREE_SHIPPING') {
                     finalDiscountAmount = Math.min(finalShippingCost, voucher.discount_value || finalShippingCost);
                 }
            } else {
                 return new Response(JSON.stringify({ error: `Voucher ${voucher_code} is invalid or expired` }), { status: 400 });
            }
        } else {
            return new Response(JSON.stringify({ error: `Voucher ${voucher_code} not found` }), { status: 400 });
        }
    }

    const finalOrderBump = order_bump ? 29000 : 0;

    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const total_paid = calculatedSubtotal + finalShippingCost + finalAdminFee + finalOrderBump + unique_code - finalDiscountAmount;

    await env.MEYYA_DB.prepare(`
      INSERT INTO orders (id, clerk_id, address_snapshot, status, payment_method, subtotal, shipping_cost, admin_fee, order_bump, unique_code, discount_amount, total_paid, voucher_code, note)
      VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, clerk_id, address_snapshot, payment_method, 
      calculatedSubtotal, finalShippingCost, finalAdminFee, finalOrderBump, unique_code, finalDiscountAmount, total_paid, voucher_code || null, note || null
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

async function resolveShippingCost(env: any, quote: any) {
  const weight = Number(quote.weight || 0);
  if (!quote.destination_village_code || !weight || weight <= 0) {
    throw new Error('Missing shipping destination or weight');
  }

  const settings = await env.MEYYA_DB.prepare('SELECT origin_village_code, active_couriers FROM shipping_settings WHERE id = 1').first();
  if (!settings || !settings.origin_village_code) {
    throw new Error('Shipping origin not configured');
  }

  const apiResponse = await fetch(`https://use.api.co.id/expedition/shipping-cost?origin_village_code=${settings.origin_village_code}&destination_village_code=${quote.destination_village_code}&weight=${weight}`, {
    method: 'GET',
    headers: { 'x-api-co-id': env.API_CO_ID_KEY || '' }
  });

  if (!apiResponse.ok) {
    throw new Error('Failed to validate shipping cost');
  }

  const apiData = await apiResponse.json();
  const activeCouriers = JSON.parse(settings.active_couriers || '["JNE", "SICEPAT", "JNT"]');
  const selectedPrice = Number(quote.shipping_price || 0);
  const selectedCode = String(quote.courier_code || '').toUpperCase();
  const selectedName = String(quote.courier_name || '').toUpperCase();
  const selectedService = String(quote.courier_service || '').toUpperCase();

  const candidates = (apiData.results || []).filter((option: any) => {
    const optionName = String(option.courier_name || '').toUpperCase();
    const optionCode = String(option.courier_code || '').toUpperCase();
    const optionService = String(option.service || option.service_name || option.courier_service || '').toUpperCase();
    const isActive = activeCouriers.some((active: string) => optionName.includes(active.toUpperCase()));
    if (!isActive || !option.price || option.price <= 0) return false;
    if (selectedCode && optionCode && selectedCode !== optionCode) return false;
    if (selectedName && optionName && selectedName !== optionName) return false;
    if (selectedService && optionService && selectedService !== optionService) return false;
    if (selectedPrice && Number(option.price) !== selectedPrice) return false;
    return true;
  });

  if (candidates.length !== 1) {
    throw new Error('Selected shipping option is no longer valid');
  }

  return Number(candidates[0].price);
}

export async function onRequestGet(context: any) {
    const { env, data } = context;
    const clerk_id = data?.clerkId;

    if (!clerk_id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    try {
        const query = 'SELECT * FROM orders WHERE clerk_id = ? ORDER BY created_at DESC';
        const stmt = env.MEYYA_DB.prepare(query).bind(clerk_id);
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
