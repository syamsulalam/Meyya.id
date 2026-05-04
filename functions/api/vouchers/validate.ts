import { ensureVoucherSchema, validateVoucherForCart } from '../_vouchers';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;

  try {
    await ensureVoucherSchema(env);
    const { code, cart_subtotal, cart_items, shipping_cost } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Kode voucher kosong' }), { status: 400 });
    }

    const voucher = await env.MEYYA_DB.prepare('SELECT * FROM vouchers WHERE code = ?').bind(code).first();

    if (!voucher) {
      return new Response(JSON.stringify({ error: 'Voucher tidak valid' }), { status: 404 });
    }

    const validation = await validateVoucherForCart(env, voucher, {
      clerkId,
      cartSubtotal: Number(cart_subtotal || 0),
      cartItems: cart_items,
      shippingCost: Number(shipping_cost || 0),
    });

    if (!validation.valid) {
       return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      code: voucher.code, 
      discount: validation.discountAmount,
      type: voucher.discount_type,
      applicable_product_ids: validation.applicableProductIds
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
