import { ensureCommerceSchema } from '../_commerce';
import { ensureVoucherSchema } from '../_vouchers';

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const decision = String(url.searchParams.get('decision') || '').toUpperCase();
  const decisionFilter = ['ALLOW', 'BLOCK'].includes(decision) ? decision : '';

  try {
    await ensureCommerceSchema(env);
    await ensureVoucherSchema(env);
    const query = `
      SELECT
        crl.*,
        u.email,
        TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS customer_name,
        u.phone_wa,
        u.phone_wa_verified_at,
        ce.id AS active_welcome_entitlement_id
      FROM coupon_claim_risk_logs crl
      LEFT JOIN users u ON u.clerk_id = crl.clerk_id
      LEFT JOIN (
        SELECT clerk_id, MAX(id) AS id
        FROM coupon_entitlements
        WHERE campaign_key = 'MEYYAWELCOME'
          AND status = 'AVAILABLE'
        GROUP BY clerk_id
      ) ce ON ce.clerk_id = crl.clerk_id
      ${decisionFilter ? 'WHERE crl.decision = ?' : ''}
      ORDER BY crl.created_at DESC
      LIMIT 100
    `;
    const { results } = decisionFilter
      ? await env.MEYYA_DB.prepare(query).bind(decisionFilter).all()
      : await env.MEYYA_DB.prepare(query).all();

    return json((results || []).map((row: any) => ({
      ...row,
      reasons: parseJson(row.reasons, []),
      signal_summary: parseJson(row.signal_summary, {}),
    })));
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

function parseJson(value: any, fallback: any) {
  try {
    return value ? JSON.parse(String(value)) : fallback;
  } catch {
    return fallback;
  }
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
