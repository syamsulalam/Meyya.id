export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const vouchersRes = await env.MEYYA_DB.prepare(`
      SELECT 
        code, 
        code AS name, 
        discount_type AS type, 
        discount_value AS value, 
        min_purchase AS minPurchase, 
        max_discount AS maxDiscount, 
        target_user_role AS targetUserRole, 
        valid_from AS startDate, 
        valid_until AS endDate 
      FROM vouchers 
      WHERE (usage_limit = 0 OR used_count < usage_limit) 
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
    `).all();
    
    return new Response(JSON.stringify(vouchersRes.results), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
