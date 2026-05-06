import {
  ensureDefaultCouponEntitlementsForUser,
  ensureVoucherSchema,
  getBirthdayClaimStatus,
  getWhatsappVerificationStatus,
  hasBirthdayVoucherClaimThisYear,
  parseApplicableProductIds
} from '../_vouchers';

export async function onRequestGet(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;

  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureVoucherSchema(env);
    await ensureDefaultCouponEntitlementsForUser(env, clerkId, request);
    const whatsapp = await getWhatsappVerificationStatus(env, clerkId);
    const user = await env.MEYYA_DB.prepare('SELECT birth_date FROM users WHERE clerk_id = ?').bind(clerkId).first();
    const { results: entitlements } = await env.MEYYA_DB.prepare(`
      SELECT
        ce.id,
        ce.voucher_code AS code,
        ce.voucher_code AS name,
        ce.campaign_key AS campaignKey,
        ce.source_type AS sourceType,
        ce.discount_type AS type,
        ce.discount_value AS value,
        ce.min_purchase AS minPurchase,
        ce.max_discount AS maxDiscount,
        ce.applicable_product_ids AS entitlementApplicableProductIds,
        ce.valid_from AS startDate,
        ce.valid_until AS endDate,
        ce.metadata AS metadata,
        v.target_user_role AS targetUserRole,
        v.target_segment AS targetSegment,
        v.birthday_claim_window_days AS birthdayClaimWindowDays,
        v.applicable_product_ids AS applicableProductIds,
        1 AS isEntitlement
      FROM coupon_entitlements ce
      JOIN vouchers v ON v.code = ce.voucher_code
      WHERE ce.clerk_id = ?
        AND ce.status = 'AVAILABLE'
        AND (ce.valid_from IS NULL OR datetime(ce.valid_from) <= datetime('now'))
        AND (ce.valid_until IS NULL OR datetime(ce.valid_until) >= datetime('now'))
      ORDER BY ce.valid_until IS NULL ASC, ce.valid_until ASC, ce.created_at DESC
    `).bind(clerkId).all();

    const { results } = await env.MEYYA_DB.prepare(`
      SELECT
        id,
        code,
        code AS name,
        discount_type AS type,
        discount_value AS value,
        min_purchase AS minPurchase,
        max_discount AS maxDiscount,
        target_user_role AS targetUserRole,
        target_segment AS targetSegment,
        birthday_claim_window_days AS birthdayClaimWindowDays,
        applicable_product_ids AS applicableProductIds,
        valid_from AS startDate,
        valid_until AS endDate
      FROM vouchers
      WHERE (usage_limit = 0 OR used_count < usage_limit)
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (target_clerk_id IS NULL OR target_clerk_id = ?)
        AND COALESCE(requires_entitlement, 0) = 0
    `).bind(clerkId).all();

    const now = new Date();
    const birthdayAlreadyClaimed = await hasBirthdayVoucherClaimThisYear(env, clerkId, now);
    const publicVouchers = (results || []).filter((voucher: any) => {
      const targetRole = String(voucher.targetUserRole || 'ALL').toUpperCase();
      const segment = String(voucher.targetSegment || '').toUpperCase();
      const birthdayWindow = Number(voucher.birthdayClaimWindowDays || 0);
      const isBirthday = targetRole === 'BIRTHDAY' || segment === 'BIRTHDAY' || birthdayWindow > 0;
      if (!isBirthday) return true;
      if (birthdayAlreadyClaimed) return false;
      if (!user?.birth_date || birthdayWindow < 1) return false;
      return getBirthdayClaimStatus(user.birth_date, birthdayWindow, now).valid;
    }).map((voucher: any) => ({
      ...voucher,
      lockedReason: whatsapp.verified ? '' : 'Verifikasi WhatsApp diperlukan untuk memakai kupon/voucher',
      applicableProductIds: parseApplicableProductIds(voucher.applicableProductIds),
    }));
    const entitlementVouchers = (entitlements || []).map((voucher: any) => ({
      ...voucher,
      lockedReason: whatsapp.verified ? '' : 'Verifikasi WhatsApp diperlukan untuk memakai kupon/voucher',
      metadata: parseJson(voucher.metadata, {}),
      applicableProductIds: parseApplicableProductIds(voucher.entitlementApplicableProductIds || voucher.applicableProductIds),
    }));

    const vouchers = whatsapp.verified ? [...entitlementVouchers, ...publicVouchers] : [];

    return new Response(JSON.stringify(vouchers), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

function parseJson(value: any, fallback: any) {
  try {
    return value ? JSON.parse(String(value)) : fallback;
  } catch {
    return fallback;
  }
}
