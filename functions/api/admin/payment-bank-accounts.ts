import { debugErrorResponse, jsonResponse } from '../_debug';

async function ensurePaymentBankSchema(env: any) {
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
}

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensurePaymentBankSchema(env);
    const { results } = await env.MEYYA_DB.prepare('SELECT * FROM payment_bank_accounts ORDER BY sort_order ASC, id ASC').all();
    return jsonResponse(results || []);
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/payment-bank-accounts',
      method: 'GET',
      phase: 'read-payment-bank-accounts',
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}

export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    await ensurePaymentBankSchema(env);
    const body = await request.json();

    if (!body.bank_name || !body.account_number || !body.account_holder) {
      return jsonResponse({ error: 'bank_name, account_number, and account_holder are required' }, 400);
    }

    const result = await env.MEYYA_DB.prepare(`
      INSERT INTO payment_bank_accounts (bank_name, account_number, account_holder, is_active, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      body.bank_name,
      body.account_number,
      body.account_holder,
      body.is_active ? 1 : 0,
      Number(body.sort_order || 0)
    ).run();

    return jsonResponse({ success: true, id: result.meta?.last_row_id });
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/payment-bank-accounts',
      method: 'POST',
      phase: 'create-payment-bank-account',
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}
