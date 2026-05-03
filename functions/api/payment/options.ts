export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const banks = await env.MEYYA_DB.prepare('SELECT * FROM payment_bank_accounts WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const settings = await env.MEYYA_DB.prepare('SELECT * FROM payment_settings WHERE id = 1').first();

    return new Response(JSON.stringify({ 
      banks: banks.results || [], 
      settings: settings || {} 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
