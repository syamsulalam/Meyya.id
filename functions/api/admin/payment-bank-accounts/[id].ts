import { debugErrorResponse, jsonResponse } from '../../_debug';

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

export async function onRequestPut(context: any) {
  const { env, request, params } = context;

  try {
    await ensurePaymentBankSchema(env);
    const body = await request.json();

    await env.MEYYA_DB.prepare(`
      UPDATE payment_bank_accounts
      SET bank_name = ?, account_number = ?, account_holder = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.bank_name,
      body.account_number,
      body.account_holder,
      body.is_active ? 1 : 0,
      Number(body.sort_order || 0),
      params.id
    ).run();

    return jsonResponse({ success: true });
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/payment-bank-accounts/:id',
      method: 'PUT',
      phase: 'update-payment-bank-account',
      id: params.id,
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}

export async function onRequestDelete(context: any) {
  const { env, params } = context;

  try {
    await ensurePaymentBankSchema(env);
    await env.MEYYA_DB.prepare('DELETE FROM payment_bank_accounts WHERE id = ?').bind(params.id).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/payment-bank-accounts/:id',
      method: 'DELETE',
      phase: 'delete-payment-bank-account',
      id: params.id,
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}
