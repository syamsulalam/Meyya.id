import { auditLog, ensureCommerceSchema } from '../_commerce';
import { ensureVoucherSchema } from '../_vouchers';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT *
      FROM wheel_prizes
      ORDER BY
        CASE key
          WHEN 'SHIP5_NO_MIN' THEN 1
          WHEN 'SMALL_FIXED' THEN 2
          WHEN 'SHIP10_MIN' THEN 3
          WHEN 'REVIEW_MAX20_LAST_ORDER' THEN 4
          WHEN 'FREE_PRODUCT_10_LAST_ORDER' THEN 5
          WHEN 'TRY_AGAIN' THEN 99
          ELSE 50
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
    if (!key) return json({ error: 'Prize key wajib diisi' }, 400);

    const existing = await env.MEYYA_DB.prepare('SELECT * FROM wheel_prizes WHERE key = ?').bind(key).first();
    if (!existing) return json({ error: 'Prize tidak ditemukan' }, 404);

    const metadata = body.metadata !== undefined ? JSON.stringify(body.metadata || {}) : undefined;
    await env.MEYYA_DB.prepare(`
      UPDATE wheel_prizes
      SET
        label = COALESCE(NULLIF(?, ''), label),
        enabled = COALESCE(?, enabled),
        voucher_code = ?,
        discount_type = COALESCE(NULLIF(?, ''), discount_type),
        discount_value = COALESCE(?, discount_value),
        min_purchase = COALESCE(?, min_purchase),
        max_discount_formula = ?,
        min_purchase_formula = ?,
        weight_first_spin = COALESCE(?, weight_first_spin),
        weight_repeat_spin = COALESCE(?, weight_repeat_spin),
        expires_in_days = COALESCE(?, expires_in_days),
        metadata = COALESCE(?, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `).bind(
      body.label || '',
      body.enabled === undefined ? null : (body.enabled ? 1 : 0),
      body.voucher_code === undefined ? existing.voucher_code : (body.voucher_code ? String(body.voucher_code).toUpperCase() : null),
      body.discount_type || '',
      body.discount_value === undefined ? null : Number(body.discount_value || 0),
      body.min_purchase === undefined ? null : Number(body.min_purchase || 0),
      body.max_discount_formula === undefined ? existing.max_discount_formula : (body.max_discount_formula || null),
      body.min_purchase_formula === undefined ? existing.min_purchase_formula : (body.min_purchase_formula || null),
      body.weight_first_spin === undefined ? null : Number(body.weight_first_spin || 0),
      body.weight_repeat_spin === undefined ? null : Number(body.weight_repeat_spin || 0),
      body.expires_in_days === undefined ? null : Number(body.expires_in_days || 0),
      metadata === undefined ? null : metadata,
      key
    ).run();

    const updated = await env.MEYYA_DB.prepare('SELECT * FROM wheel_prizes WHERE key = ?').bind(key).first();
    if (updated?.voucher_code && updated.discount_type !== 'NONE') {
      await env.MEYYA_DB.prepare(`
        INSERT INTO vouchers (code, discount_type, discount_value, min_purchase, usage_limit, used_count, target_user_role, target_segment, requires_entitlement, source_campaign_key)
        VALUES (?, ?, ?, ?, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN')
        ON CONFLICT(code) DO UPDATE SET
          discount_type = excluded.discount_type,
          discount_value = excluded.discount_value,
          min_purchase = excluded.min_purchase,
          requires_entitlement = 1,
          source_campaign_key = 'REVIEWSPIN'
      `).bind(
        updated.voucher_code,
        updated.discount_type,
        Number(updated.discount_value || 0),
        Number(updated.min_purchase || 0)
      ).run();
    }

    await auditLog(env, data?.clerkId || null, 'UPDATE_WHEEL_PRIZE', 'wheel_prize', key, body);

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
