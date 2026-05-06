import { auditLog, ensureCommerceSchema } from '../_commerce';
import { ensureVoucherSchema } from '../_vouchers';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT *
      FROM coupon_campaigns
      ORDER BY
        CASE key
          WHEN 'MEYYAWELCOME' THEN 1
          WHEN 'BDAYGIFT' THEN 2
          WHEN 'MEYYABDAY' THEN 3
          WHEN 'REVIEWSPIN' THEN 4
          ELSE 99
        END,
        key ASC
    `).all();

    return json(results || []);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPut(context: any) {
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const body = await request.json();
    const key = String(body.key || '').trim().toUpperCase();
    if (!key) return json({ error: 'Campaign key wajib diisi' }, 400);

    const existing = await env.MEYYA_DB.prepare('SELECT * FROM coupon_campaigns WHERE key = ?').bind(key).first();
    if (!existing) return json({ error: 'Campaign tidak ditemukan' }, 404);

    const metadata = body.metadata !== undefined ? JSON.stringify(body.metadata || {}) : undefined;
    await env.MEYYA_DB.prepare(`
      UPDATE coupon_campaigns
      SET
        enabled = COALESCE(?, enabled),
        title = COALESCE(NULLIF(?, ''), title),
        description = COALESCE(NULLIF(?, ''), description),
        discount_type = COALESCE(NULLIF(?, ''), discount_type),
        discount_value = COALESCE(?, discount_value),
        min_purchase = COALESCE(?, min_purchase),
        max_discount = ?,
        expires_in_days = COALESCE(?, expires_in_days),
        usage_limit_per_user = COALESCE(?, usage_limit_per_user),
        requires_verified_wa = COALESCE(?, requires_verified_wa),
        risk_block_threshold = COALESCE(?, risk_block_threshold),
        birthday_claim_window_days = COALESCE(?, birthday_claim_window_days),
        metadata = COALESCE(?, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `).bind(
      body.enabled === undefined ? null : (body.enabled ? 1 : 0),
      body.title || '',
      body.description || '',
      body.discount_type || '',
      body.discount_value === undefined ? null : Number(body.discount_value || 0),
      body.min_purchase === undefined ? null : Number(body.min_purchase || 0),
      body.max_discount === undefined ? existing.max_discount : (body.max_discount === null ? null : Number(body.max_discount || 0)),
      body.expires_in_days === undefined ? null : Number(body.expires_in_days || 0),
      body.usage_limit_per_user === undefined ? null : Number(body.usage_limit_per_user || 0),
      body.requires_verified_wa === undefined ? null : (body.requires_verified_wa ? 1 : 0),
      body.risk_block_threshold === undefined ? null : Number(body.risk_block_threshold || 0),
      body.birthday_claim_window_days === undefined ? null : Number(body.birthday_claim_window_days || 0),
      metadata === undefined ? null : metadata,
      key
    ).run();

    if (['MEYYAWELCOME', 'BDAYGIFT', 'MEYYABDAY'].includes(key)) {
      await env.MEYYA_DB.prepare(`
        UPDATE vouchers
        SET
          discount_type = (SELECT discount_type FROM coupon_campaigns WHERE key = ?),
          discount_value = (SELECT discount_value FROM coupon_campaigns WHERE key = ?),
          min_purchase = (SELECT min_purchase FROM coupon_campaigns WHERE key = ?),
          max_discount = (SELECT max_discount FROM coupon_campaigns WHERE key = ?),
          birthday_claim_window_days = (SELECT birthday_claim_window_days FROM coupon_campaigns WHERE key = ?)
        WHERE code = ?
      `).bind(key, key, key, key, key, key).run();
    }

    await auditLog(env, data?.clerkId || null, 'UPDATE_COUPON_CAMPAIGN', 'coupon_campaign', key, body);

    return json({ success: true, key });
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
