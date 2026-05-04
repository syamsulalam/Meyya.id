import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureCommerceSchema(env);
    const { results: vouchers } = await env.MEYYA_DB.prepare(`
      SELECT * FROM vouchers ORDER BY valid_until IS NULL DESC, valid_until DESC
    `).all();
    const now = new Date();

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
      isActive: (!v.valid_from || new Date(v.valid_from) <= now) && (!v.valid_until || new Date(v.valid_until) >= now),
      targetUserRole: v.target_user_role || 'ALL',
      targetClerkId: v.target_clerk_id || '',
      targetSegment: v.target_segment || ''
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
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const { code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, usage_limit, target_user_role, target_clerk_id, target_segment } = body;
    
    await env.MEYYA_DB.prepare(`
      INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, usage_limit, used_count, target_user_role, target_clerk_id, target_segment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        discount_type = excluded.discount_type,
        discount_value = excluded.discount_value,
        min_purchase = excluded.min_purchase,
        max_discount = excluded.max_discount,
        valid_from = excluded.valid_from,
        valid_until = excluded.valid_until,
        usage_limit = excluded.usage_limit,
        target_user_role = excluded.target_user_role,
        target_clerk_id = excluded.target_clerk_id,
        target_segment = excluded.target_segment
    `).bind(code, discount_type, discount_value, min_purchase || 0, max_discount, valid_from, valid_until, usage_limit || 0, target_user_role || 'ALL', target_clerk_id || null, target_segment || null).run();

    await auditLog(env, data?.clerkId || null, 'UPSERT_VOUCHER', 'voucher', code, { target_user_role, target_clerk_id, target_segment });

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
