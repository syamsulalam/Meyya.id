import { ensureVoucherSchema, getBirthdayClaimStatus, hasBirthdayVoucherClaimThisYear, parseApplicableProductIds } from '../_vouchers';

export async function onRequestGet(context: any) {
  const { env, data } = context;
  const clerkId = data?.clerkId;

  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureVoucherSchema(env);
    const user = await env.MEYYA_DB.prepare('SELECT birth_date FROM users WHERE clerk_id = ?').bind(clerkId).first();
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
    `).bind(clerkId).all();

    const now = new Date();
    const birthdayAlreadyClaimed = await hasBirthdayVoucherClaimThisYear(env, clerkId, now);
    const vouchers = (results || []).filter((voucher: any) => {
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
      applicableProductIds: parseApplicableProductIds(voucher.applicableProductIds),
    }));

    return new Response(JSON.stringify(vouchers), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
