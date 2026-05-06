import { auditLog, ensureCommerceSchema } from '../_commerce';
import { ensureVoucherSchema, parseApplicableProductIds, stringifyApplicableProductIds } from '../_vouchers';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
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
      targetSegment: v.target_segment || '',
      birthdayClaimWindowDays: Number(v.birthday_claim_window_days || 0),
      applicableProductIds: parseApplicableProductIds(v.applicable_product_ids),
      requiresEntitlement: Number(v.requires_entitlement || 0) === 1,
      sourceCampaignKey: v.source_campaign_key || ''
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
    await ensureVoucherSchema(env);
    const body = await request.json();
    const { code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, usage_limit, target_user_role, target_clerk_id, target_segment } = body;
    const birthdayWindow = Number(body.birthday_claim_window_days || 0);
    const targetRole = String(target_user_role || 'ALL').toUpperCase();
    const segment = String(target_segment || '').toUpperCase();
    if ((targetRole === 'BIRTHDAY' || segment === 'BIRTHDAY') && birthdayWindow < 1) {
      return new Response(JSON.stringify({ error: 'Voucher birthday wajib punya window klaim minimal 1 hari.' }), { status: 400 });
    }
    const applicableProductIds = stringifyApplicableProductIds(body.applicable_product_ids);
    
    await env.MEYYA_DB.prepare(`
      INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, usage_limit, used_count, target_user_role, target_clerk_id, target_segment, birthday_claim_window_days, applicable_product_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
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
        target_segment = excluded.target_segment,
        birthday_claim_window_days = excluded.birthday_claim_window_days,
        applicable_product_ids = excluded.applicable_product_ids
    `).bind(code, discount_type, discount_value, min_purchase || 0, max_discount, valid_from, valid_until, usage_limit || 0, target_user_role || 'ALL', target_clerk_id || null, target_segment || null, birthdayWindow || null, applicableProductIds).run();

    await env.MEYYA_DB.prepare(`
      UPDATE coupon_campaigns
      SET
        discount_type = ?,
        discount_value = ?,
        min_purchase = ?,
        max_discount = ?,
        expires_in_days = CASE
          WHEN ? IS NOT NULL THEN CAST(MAX(1, julianday(?) - julianday('now')) AS INTEGER)
          ELSE expires_in_days
        END,
        birthday_claim_window_days = COALESCE(?, birthday_claim_window_days),
        updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `).bind(
      discount_type,
      discount_value,
      min_purchase || 0,
      max_discount,
      valid_until,
      valid_until,
      birthdayWindow || null,
      code
    ).run();
    await env.MEYYA_DB.prepare(`
      UPDATE vouchers
      SET requires_entitlement = 1, source_campaign_key = ?
      WHERE code = ? AND EXISTS (SELECT 1 FROM coupon_campaigns WHERE key = ?)
    `).bind(code, code, code).run();

    await auditLog(env, data?.clerkId || null, 'UPSERT_VOUCHER', 'voucher', code, { target_user_role, target_clerk_id, target_segment, birthday_claim_window_days: birthdayWindow, applicable_product_ids: body.applicable_product_ids });

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
