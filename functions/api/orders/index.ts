import { auditLog, cancelOrderAndReleaseReservations, ensureCommerceSchema, expirePendingOrders } from '../_commerce';
import { validateCartStock } from '../_cartValidation';
import {
  buildShippingQuoteCacheKey,
  getCachedShippingQuote,
  setCachedShippingQuote,
  trackExternalApiCall,
} from '../_externalApiUsage';
import { ensureVoucherSchema, validateVoucherForCart } from '../_vouchers';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerk_id = data?.clerkId;
  
  if (!clerk_id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    await expirePendingOrders(env);
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
    
    if (!items || !items.length) {
      return new Response(JSON.stringify({ error: 'Missing requirements' }), { status: 400 });
    }

    if (payment_method !== 'TRANSFER') {
      return new Response(JSON.stringify({ error: 'Payment method is not available' }), { status: 400 });
    }

    const stockValidation = await validateCartStock(env, items);
    if (!stockValidation.valid) {
      return new Response(JSON.stringify({
        error: stockValidation.unavailableItems[0]?.message || 'Beberapa produk di keranjang sudah tidak tersedia.',
        unavailableItems: stockValidation.unavailableItems,
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 409,
      });
    }

    // server-side generation of unique code
    const unique_code = Math.floor(Math.random() * 900) + 100;

    const paymentSettings = await env.MEYYA_DB.prepare('SELECT transfer_admin_fee, payment_expiry_minutes FROM payment_settings WHERE id = 1').first();
    const finalAdminFee = Number(paymentSettings?.transfer_admin_fee || 0);
    const expiryMinutes = Number(paymentSettings?.payment_expiry_minutes || 1440);

    const productIds = items.map((i: any) => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const productsRes = await env.MEYYA_DB.prepare(`SELECT id, base_price, production_cost, is_active, is_preorder, stock, deleted_at FROM products WHERE id IN (${placeholders})`).bind(...productIds).all();
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
      if (dbProd.is_active !== 1 || dbProd.deleted_at) {
        return new Response(JSON.stringify({ error: `Product ${item.product_name} is no longer available` }), { status: 400 });
      }
      if (dbProd.is_preorder !== 1 && dbProd.stock < item.quantity) {
        return new Response(JSON.stringify({ error: `Not enough stock for product ${item.product_name}` }), { status: 400 });
      }

      if (item.variant_id) {
        const variant = await env.MEYYA_DB.prepare(`
          SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1
        `).bind(item.variant_id, item.product_id).first();
        if (!variant) {
          return new Response(JSON.stringify({ error: `Selected variant for ${item.product_name} is not available` }), { status: 400 });
        }
        if (dbProd.is_preorder !== 1 && Number(variant.stock || 0) < item.quantity) {
          return new Response(JSON.stringify({ error: `Not enough stock for ${item.product_name} variant` }), { status: 400 });
        }
        item.color = variant.color_name || item.color;
        item.size = variant.size_name || item.size;
        item.variant_options = variant.option_signature || item.variant_options || null;
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
    let voucherValidation: any = null;
    
    if (voucher_code) {
        const voucher = await env.MEYYA_DB.prepare('SELECT * FROM vouchers WHERE code = ?').bind(voucher_code).first();
        if (voucher) {
            voucherValidation = await validateVoucherForCart(env, voucher, {
              clerkId: clerk_id,
              cartSubtotal: calculatedSubtotal,
              cartItems: items,
              shippingCost: finalShippingCost,
            });
            if (!voucherValidation.valid) {
                 return new Response(JSON.stringify({ error: voucherValidation.error || `Voucher ${voucher_code} is invalid or expired` }), { status: 400 });
            }
            finalDiscountAmount = voucherValidation.discountAmount;
        } else {
            return new Response(JSON.stringify({ error: `Voucher ${voucher_code} not found` }), { status: 400 });
        }
    }

    const finalOrderBump = order_bump ? 29000 : 0;

    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const total_paid = calculatedSubtotal + finalShippingCost + finalAdminFee + finalOrderBump + unique_code - finalDiscountAmount;
    const paymentExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    await env.MEYYA_DB.prepare(`
      INSERT INTO orders (id, clerk_id, address_snapshot, status, payment_method, subtotal, shipping_cost, admin_fee, order_bump, unique_code, discount_amount, total_paid, voucher_code, note, payment_expires_at)
      VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, clerk_id, address_snapshot, payment_method, 
      calculatedSubtotal, finalShippingCost, finalAdminFee, finalOrderBump, unique_code, finalDiscountAmount, total_paid, voucher_code || null, note || null, paymentExpiresAt
    ).run();

    // Insert order items
    // Since Cloudflare D1 supports batching
    const statements = items.map((item: any) => {
      const { product_id, product_name, variant_id, variant_options, color, size, quantity, price, production_cost } = item;
      return env.MEYYA_DB.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, variant_id, variant_options, color_name, size_name, quantity, price_at_purchase, hpp_at_purchase)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(orderId, product_id, product_name, variant_id || null, normalizeVariantOptions(variant_options), color, size, quantity, price, production_cost);
    });

    await env.MEYYA_DB.batch(statements);

    if (voucher_code) {
      try {
        await env.MEYYA_DB.batch([
          env.MEYYA_DB.prepare(`
            INSERT INTO voucher_usages (voucher_code, clerk_id, order_id, usage_type, claim_year)
            VALUES (?, ?, ?, ?, ?)
          `).bind(
            voucher_code,
            clerk_id,
            orderId,
            voucherValidation?.isBirthdayVoucher ? 'BIRTHDAY' : null,
            voucherValidation?.birthdayClaimYear || null
          ),
          env.MEYYA_DB.prepare(`UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?`).bind(voucher_code)
        ]);
      } catch (error: any) {
        await env.MEYYA_DB.prepare("UPDATE orders SET status = 'CANCELLED' WHERE id = ?").bind(orderId).run();
        const message = String(error?.message || '').toLowerCase().includes('unique')
          ? 'Voucher birthday hanya bisa diklaim 1x per tahun'
          : 'Gagal mencatat penggunaan voucher';
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }
    }

    const reservationStatements: any[] = [];
    const stockStatements: any[] = [];
    const movementStatements: any[] = [];
    for (const item of items) {
      const dbProd = dbProducts.find((p: any) => p.id === item.product_id);
      if (dbProd?.is_preorder === 1) continue;
      stockStatements.push(
        env.MEYYA_DB.prepare("UPDATE products SET stock = stock - ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ? AND stock >= ?")
          .bind(item.quantity, item.product_id, item.quantity)
      );
      if (item.variant_id) {
        stockStatements.push(
          env.MEYYA_DB.prepare("UPDATE product_variants SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stock >= ?")
            .bind(item.quantity, item.variant_id, item.quantity)
        );
      }
      reservationStatements.push(
        env.MEYYA_DB.prepare("INSERT INTO inventory_reservations (order_id, product_id, variant_id, quantity, expires_at) VALUES (?, ?, ?, ?, ?)")
          .bind(orderId, item.product_id, item.variant_id || null, item.quantity, paymentExpiresAt)
      );
      movementStatements.push(
        env.MEYYA_DB.prepare("INSERT INTO stock_movements (product_id, order_id, change_qty, reason, note) VALUES (?, ?, ?, 'RESERVED', ?)")
          .bind(item.product_id, orderId, -item.quantity, 'Reserved for pending payment')
      );
    }

    if (stockStatements.length > 0) {
      const stockResults = await env.MEYYA_DB.batch(stockStatements);
      if (stockResults.some((result: any) => result.meta?.changes === 0)) {
        let resultIndex = 0;
        const restoreStatements = items
          .filter((item: any) => {
            const dbProd = dbProducts.find((p: any) => p.id === item.product_id);
            return dbProd?.is_preorder !== 1;
          })
          .flatMap((item: any) => {
            const restores = [];
            const productResult = stockResults[resultIndex++];
            if (productResult?.meta?.changes > 0) {
              restores.push(env.MEYYA_DB.prepare("UPDATE products SET stock = stock + ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?").bind(item.quantity, item.product_id));
            }
            if (item.variant_id) {
              const variantResult = stockResults[resultIndex++];
              if (variantResult?.meta?.changes > 0) {
                restores.push(env.MEYYA_DB.prepare("UPDATE product_variants SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(item.quantity, item.variant_id));
              }
            }
            return restores;
          });
        if (restoreStatements.length > 0) await env.MEYYA_DB.batch(restoreStatements);
        await env.MEYYA_DB.prepare("UPDATE orders SET status = 'CANCELLED' WHERE id = ?").bind(orderId).run();
        if (voucher_code) {
          await env.MEYYA_DB.batch([
            env.MEYYA_DB.prepare("DELETE FROM voucher_usages WHERE order_id = ?").bind(orderId),
            env.MEYYA_DB.prepare("UPDATE vouchers SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END WHERE code = ?").bind(voucher_code)
          ]);
        }
        return new Response(JSON.stringify({ error: 'Some items are no longer available. Please refresh your cart.' }), { status: 409 });
      }
      await env.MEYYA_DB.batch([...reservationStatements, ...movementStatements]);
    }

    await env.MEYYA_DB.prepare(`
      UPDATE user_cart_snapshots
      SET status = 'CONVERTED',
          converted_order_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ?
    `).bind(orderId, clerk_id).run();

    await auditLog(env, clerk_id, 'CREATE_ORDER', 'order', orderId, { total_paid, item_count: items.length });

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

function normalizeVariantOptions(value: any) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || Array.isArray(value)) return null;

  const clean = Object.keys(value).sort().reduce((acc: Record<string, string>, key) => {
    const cleanKey = String(key).trim();
    const cleanValue = String(value[key] ?? '').trim();
    if (cleanKey && cleanValue) acc[cleanKey] = cleanValue;
    return acc;
  }, {});

  return Object.keys(clean).length > 0 ? JSON.stringify(clean) : null;
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

  const activeCouriers = JSON.parse(settings.active_couriers || '["JNE", "SICEPAT", "JNT"]');
  const cacheKey = buildShippingQuoteCacheKey({
    originVillageCode: settings.origin_village_code,
    destinationVillageCode: quote.destination_village_code,
    weight,
    activeCouriers,
  });
  let apiData = await getCachedShippingQuote(env, cacheKey);
  if (!apiData) {
    const apiResponse = await fetch(`https://use.api.co.id/expedition/shipping-cost?origin_village_code=${settings.origin_village_code}&destination_village_code=${quote.destination_village_code}&weight=${weight}`, {
      method: 'GET',
      headers: { 'x-api-co-id': env.API_CO_ID_KEY || '' }
    });

    if (!apiResponse.ok) {
      throw new Error('Failed to validate shipping cost');
    }

    apiData = await apiResponse.json();
    await trackExternalApiCall(env, 'api.co.id', 'expedition_shipping_cost');
    await setCachedShippingQuote(env, cacheKey, { results: apiData.results || [] });
  }
  const selectedPrice = Number(quote.shipping_price || 0);
  const selectedCode = String(quote.courier_code || '').toUpperCase();
  const selectedName = String(quote.courier_name || '').toUpperCase();
  const selectedService = String(quote.courier_service || '').toUpperCase();

  const candidates = (apiData?.results || []).filter((option: any) => {
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
        await ensureCommerceSchema(env);
        await expirePendingOrders(env);
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
