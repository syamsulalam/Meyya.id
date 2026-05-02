export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const { results: vouchers } = await env.MEYYA_DB.prepare(`
      SELECT * FROM vouchers ORDER BY valid_until DESC
    `).all();

    const formatted = vouchers.map((v: any) => ({
      id: v.code,
      code: v.code,
      name: v.code, // assuming name is implicitly the code if not stored separately
      type: v.discount_type,
      value: v.discount_value,
      minPurchase: v.min_purchase,
      maxDiscount: v.max_discount,
      startDate: v.valid_from,
      endDate: v.valid_until,
      usageLimit: v.usage_limit,
      usedCount: v.used_count,
      isActive: new Date(v.valid_until) >= new Date(),
      targetUserRole: v.target_user_role || 'ALL'
    }));

    return new Response(JSON.stringify(formatted), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, usage_limit, target_user_role } = body;
    
    await env.MEYYA_DB.prepare(`
      INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, usage_limit, used_count, target_user_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).bind(code, discount_type, discount_value, min_purchase || 0, max_discount, valid_from, valid_until, usage_limit || 0, target_user_role || 'ALL').run();

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
