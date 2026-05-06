import { auditLog, ensureCommerceSchema } from '../_commerce';
import { ensureVoucherSchema, issueCouponEntitlement } from '../_vouchers';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const body = await request.json();
    const action = String(body.action || '').toUpperCase();

    if (action === 'ISSUE') {
      const campaignKey = String(body.campaign_key || 'MEYYAWELCOME').trim().toUpperCase();
      const clerkId = String(body.clerk_id || '').trim();
      if (!clerkId) return json({ error: 'clerk_id wajib diisi' }, 400);

      const campaign = await env.MEYYA_DB.prepare('SELECT * FROM coupon_campaigns WHERE key = ?').bind(campaignKey).first();
      if (!campaign) return json({ error: 'Campaign tidak ditemukan' }, 404);

      const expiresInDays = Number(body.expires_in_days ?? campaign.expires_in_days ?? 14);
      const validUntil = expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;
      const sourceId = String(body.source_id || `ADMIN-${Date.now()}`);
      const entitlement = await issueCouponEntitlement(env, {
        campaignKey,
        voucherCode: String(body.voucher_code || campaignKey).toUpperCase(),
        clerkId,
        sourceType: String(body.source_type || 'ADMIN_OVERRIDE').toUpperCase(),
        sourceId,
        discountType: String(body.discount_type || campaign.discount_type || 'PERCENTAGE').toUpperCase(),
        discountValue: Number(body.discount_value ?? campaign.discount_value ?? 0),
        minPurchase: Number(body.min_purchase ?? campaign.min_purchase ?? 0),
        maxDiscount: body.max_discount !== undefined ? Number(body.max_discount || 0) : (campaign.max_discount === null || campaign.max_discount === undefined ? null : Number(campaign.max_discount)),
        validFrom: new Date().toISOString(),
        validUntil,
        applicableProductIds: Array.isArray(body.applicable_product_ids) ? body.applicable_product_ids.map(Number).filter(Number.isFinite) : [],
        metadata: {
          admin_override: true,
          reason: String(body.reason || '').slice(0, 300),
          issued_by: data?.clerkId || null,
        },
      });

      await auditLog(env, data?.clerkId || null, 'ISSUE_COUPON_ENTITLEMENT', 'coupon_entitlement', entitlement?.id || campaignKey, {
        campaign_key: campaignKey,
        target_clerk_id: clerkId,
        reason: body.reason || '',
      });

      return json({ success: true, entitlement });
    }

    if (action === 'REVOKE') {
      const entitlementId = String(body.entitlement_id || '').trim();
      if (!entitlementId) return json({ error: 'entitlement_id wajib diisi' }, 400);

      const result = await env.MEYYA_DB.prepare(`
        UPDATE coupon_entitlements
        SET status = 'REVOKED',
            metadata = json_set(COALESCE(metadata, '{}'), '$.revoked_reason', ?, '$.revoked_by', ?)
        WHERE id = ?
          AND status = 'AVAILABLE'
      `).bind(String(body.reason || '').slice(0, 300), data?.clerkId || null, entitlementId).run();

      await auditLog(env, data?.clerkId || null, 'REVOKE_COUPON_ENTITLEMENT', 'coupon_entitlement', entitlementId, {
        reason: body.reason || '',
        changes: Number(result?.meta?.changes || 0),
      });

      return json({ success: true, changes: Number(result?.meta?.changes || 0) });
    }

    return json({ error: 'Action tidak valid' }, 400);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
