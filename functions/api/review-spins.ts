import { auditLog, ensureCommerceSchema } from './_commerce';
import { ensureVoucherSchema, getWhatsappVerificationStatus, issueCouponEntitlement } from './_vouchers';

export async function onRequestGet(context: any) {
  const { env, data } = context;
  const clerkId = data?.clerkId;
  if (!clerkId) return json({ error: 'Unauthorized' }, 401);

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const whatsapp = await getWhatsappVerificationStatus(env, clerkId);
    const { results: spins } = await env.MEYYA_DB.prepare(`
      SELECT rse.*, pr.rating, pr.review_text, p.name AS product_name, p.slug AS product_slug
      FROM review_spin_entitlements rse
      LEFT JOIN product_reviews pr ON pr.id = rse.review_id
      LEFT JOIN products p ON p.id = rse.product_id
      WHERE rse.clerk_id = ?
        AND rse.status = 'AVAILABLE'
        AND (rse.expires_at IS NULL OR datetime(rse.expires_at) >= datetime('now'))
      ORDER BY rse.created_at DESC
    `).bind(clerkId).all();

    const { results: recentResults } = await env.MEYYA_DB.prepare(`
      SELECT ws.*, wp.label AS prize_label, ce.voucher_code
      FROM wheel_spins ws
      LEFT JOIN wheel_prizes wp ON wp.key = ws.prize_key
      LEFT JOIN coupon_entitlements ce ON ce.id = ws.coupon_entitlement_id
      WHERE ws.clerk_id = ?
      ORDER BY ws.created_at DESC
      LIMIT 5
    `).bind(clerkId).all();

    return json({
      whatsappVerified: whatsapp.verified,
      available: spins || [],
      recent: recentResults || [],
    });
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPost(context: any) {
  const { env, request, data } = context;
  const clerkId = data?.clerkId;
  if (!clerkId) return json({ error: 'Unauthorized' }, 401);

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const whatsapp = await getWhatsappVerificationStatus(env, clerkId);
    if (!whatsapp.verified) {
      return json({ error: 'Verifikasi nomor WhatsApp diperlukan untuk spin hadiah review.' }, 400);
    }

    const body = await request.json();
    const entitlementId = String(body.entitlement_id || '').trim();
    if (!entitlementId) return json({ error: 'Spin entitlement wajib diisi' }, 400);

    const existingSpin = await env.MEYYA_DB.prepare(`
      SELECT ws.*, wp.label AS prize_label, ce.voucher_code
      FROM wheel_spins ws
      LEFT JOIN wheel_prizes wp ON wp.key = ws.prize_key
      LEFT JOIN coupon_entitlements ce ON ce.id = ws.coupon_entitlement_id
      WHERE ws.spin_entitlement_id = ? AND ws.clerk_id = ?
      LIMIT 1
    `).bind(entitlementId, clerkId).first();
    if (existingSpin) return json({ success: true, spin: existingSpin, alreadySpun: true });

    const spinEntitlement = await env.MEYYA_DB.prepare(`
      SELECT *
      FROM review_spin_entitlements
      WHERE id = ?
        AND clerk_id = ?
        AND status = 'AVAILABLE'
        AND (expires_at IS NULL OR datetime(expires_at) >= datetime('now'))
      LIMIT 1
    `).bind(entitlementId, clerkId).first();
    if (!spinEntitlement) return json({ error: 'Kesempatan spin tidak tersedia atau sudah dipakai' }, 404);

    const priorSpin = await env.MEYYA_DB.prepare('SELECT id FROM wheel_spins WHERE clerk_id = ? LIMIT 1').bind(clerkId).first();
    const isFirstSpin = !priorSpin;
    const prize = await choosePrize(env, isFirstSpin);
    if (!prize) return json({ error: 'Konfigurasi hadiah wheel belum tersedia' }, 500);

    let couponEntitlement: any = null;
    if (prize.voucher_code) {
      const lastOrder = await env.MEYYA_DB.prepare(`
        SELECT subtotal, total_paid
        FROM orders
        WHERE clerk_id = ? AND status IN ('COMPLETED', 'SELESAI')
        ORDER BY completed_at DESC, created_at DESC
        LIMIT 1
      `).bind(clerkId).first();
      const lastSubtotal = Math.max(0, Number(lastOrder?.subtotal || lastOrder?.total_paid || 0));
      const values = buildPrizeValues(prize, lastSubtotal);
      couponEntitlement = await issueCouponEntitlement(env, {
        campaignKey: 'REVIEWSPIN',
        voucherCode: prize.voucher_code,
        clerkId,
        sourceType: 'REVIEW_SPIN',
        sourceId: spinEntitlement.review_id,
        discountType: values.discountType,
        discountValue: values.discountValue,
        minPurchase: values.minPurchase,
        maxDiscount: values.maxDiscount,
        validFrom: new Date().toISOString(),
        validUntil: values.validUntil,
        metadata: {
          prize_key: prize.key,
          last_order_subtotal: lastSubtotal,
          label: prize.label,
        },
      });
    }

    const spinId = crypto.randomUUID();
    await env.MEYYA_DB.batch([
      env.MEYYA_DB.prepare(`
        INSERT INTO wheel_spins (id, spin_entitlement_id, clerk_id, review_id, prize_key, coupon_entitlement_id, is_first_spin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(spinId, entitlementId, clerkId, spinEntitlement.review_id, prize.key, couponEntitlement?.id || null, isFirstSpin ? 1 : 0),
      env.MEYYA_DB.prepare(`
        UPDATE review_spin_entitlements
        SET status = 'SPUN', spun_at = CURRENT_TIMESTAMP
        WHERE id = ? AND clerk_id = ?
      `).bind(entitlementId, clerkId)
    ]);

    await auditLog(env, clerkId, 'SPIN_REVIEW_REWARD', 'review_spin', entitlementId, {
      prize_key: prize.key,
      coupon_entitlement_id: couponEntitlement?.id || null,
      is_first_spin: isFirstSpin,
    });

    return json({
      success: true,
      spin: {
        id: spinId,
        prize_key: prize.key,
        prize_label: prize.label,
        voucher_code: couponEntitlement?.voucher_code || null,
        coupon_entitlement_id: couponEntitlement?.id || null,
        is_first_spin: isFirstSpin ? 1 : 0,
      },
    });
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

async function choosePrize(env: any, isFirstSpin: boolean) {
  const weightColumn = isFirstSpin ? 'weight_first_spin' : 'weight_repeat_spin';
  const { results } = await env.MEYYA_DB.prepare(`
    SELECT *
    FROM wheel_prizes
    WHERE enabled = 1
      AND ${weightColumn} > 0
    ORDER BY key ASC
  `).all();
  const prizes = results || [];
  const totalWeight = prizes.reduce((sum: number, prize: any) => sum + Number(prize[weightColumn] || 0), 0);
  if (totalWeight <= 0) return null;

  let cursor = Math.random() * totalWeight;
  for (const prize of prizes) {
    cursor -= Number(prize[weightColumn] || 0);
    if (cursor <= 0) return prize;
  }
  return prizes[prizes.length - 1] || null;
}

function buildPrizeValues(prize: any, lastSubtotal: number) {
  const discountType = String(prize.discount_type || 'FIXED').toUpperCase();
  let discountValue = Number(prize.discount_value || 0);
  let minPurchase = Number(prize.min_purchase || 0);
  let maxDiscount = null as number | null;

  if (prize.min_purchase_formula === 'LAST_ORDER_SUBTOTAL') {
    minPurchase = lastSubtotal;
  }
  if (prize.max_discount_formula === 'LAST_ORDER_SUBTOTAL_20_PERCENT') {
    maxDiscount = Math.floor(lastSubtotal * 0.2);
  }
  if (prize.max_discount_formula === 'LAST_ORDER_SUBTOTAL_10_PERCENT') {
    maxDiscount = Math.floor(lastSubtotal * 0.1);
    if (discountType === 'FIXED') discountValue = maxDiscount;
  }

  const expiresInDays = Number(prize.expires_in_days || 14);
  const validUntil = expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;
  return { discountType, discountValue, minPurchase, maxDiscount, validUntil };
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
