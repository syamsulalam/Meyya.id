export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    const { code, cart_subtotal } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Kode voucher kosong' }), { status: 400 });
    }

    const voucher = await env.MEYYA_DB.prepare('SELECT * FROM vouchers WHERE code = ?').bind(code).first();

    if (!voucher) {
      return new Response(JSON.stringify({ error: 'Voucher tidak valid' }), { status: 404 });
    }

    // Check dates (simplified for this MVP)
    const now = new Date();
    if (voucher.valid_until && new Date(voucher.valid_until) < now) {
       return new Response(JSON.stringify({ error: 'Voucher sudah kadaluarsa' }), { status: 400 });
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
       return new Response(JSON.stringify({ error: 'Kuota voucher telah habis' }), { status: 400 });
    }

    // Check min purchase
    if (voucher.min_purchase && cart_subtotal < voucher.min_purchase) {
       return new Response(JSON.stringify({ error: `Minimal belanja Rp ${voucher.min_purchase.toLocaleString('id-ID')}` }), { status: 400 });
    }

    let discountAmount = 0;
    if (voucher.discount_type === 'FIXED') {
       discountAmount = voucher.discount_value;
    } else if (voucher.discount_type === 'PERCENTAGE') {
       discountAmount = (voucher.discount_value / 100) * cart_subtotal;
       if (voucher.max_discount && discountAmount > voucher.max_discount) {
           discountAmount = voucher.max_discount;
       }
    } else if (voucher.discount_type === 'FREE_SHIPPING') {
       // Typically handled on client by making shipping 0 up to max_discount
       discountAmount = voucher.discount_value; // Assuming value means flat free shipping cut
    }

    return new Response(JSON.stringify({ 
      success: true, 
      code: voucher.code, 
      discount: discountAmount,
      type: voucher.discount_type
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
