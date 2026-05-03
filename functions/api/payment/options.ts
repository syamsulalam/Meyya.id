export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await env.MEYYA_DB.prepare(`
      CREATE TABLE IF NOT EXISTS payment_bank_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        account_holder TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.MEYYA_DB.prepare(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY,
        qris_image_url TEXT,
        qris_is_active INTEGER DEFAULT 0,
        transfer_instruction TEXT,
        payment_expiry_minutes INTEGER DEFAULT 1440,
        transfer_admin_fee INTEGER DEFAULT 0,
        qris_admin_fee INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.MEYYA_DB.prepare(`
      INSERT OR IGNORE INTO payment_settings (id, transfer_instruction)
      VALUES (1, 'Silakan transfer tepat sesuai nominal hingga 3 digit terakhir. Verifikasi manual dilakukan dalam 1x24 jam kerja.')
    `).run();

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
