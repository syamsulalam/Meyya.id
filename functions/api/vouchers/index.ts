export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const vouchersRes = await env.MEYYA_DB.prepare(`
      SELECT code, name, type, value, minPurchase, maxDiscount, targetUserRole, startDate, endDate 
      FROM vouchers 
      WHERE isActive = 1 AND (usageLimit = 0 OR usedCount < usageLimit) AND endDate >= CURRENT_DATE
    `).all();
    
    return new Response(JSON.stringify(vouchersRes.results), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
