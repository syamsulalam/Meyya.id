import { debugErrorResponse, jsonResponse } from '../_debug';

async function ensurePaymentSchema(env: any) {
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
}

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensurePaymentSchema(env);
    const settings = await env.MEYYA_DB.prepare('SELECT * FROM payment_settings WHERE id = 1').first();
    return jsonResponse(settings || {});
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/payment-settings',
      method: 'GET',
      phase: 'read-payment-settings',
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}

export async function onRequestPut(context: any) {
  const { env, request } = context;

  try {
    await ensurePaymentSchema(env);
    const body = await request.json();

    await env.MEYYA_DB.prepare(`
      INSERT INTO payment_settings (
        id,
        qris_image_url,
        qris_is_active,
        transfer_instruction,
        payment_expiry_minutes,
        transfer_admin_fee,
        qris_admin_fee,
        updated_at
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        qris_image_url = excluded.qris_image_url,
        qris_is_active = excluded.qris_is_active,
        transfer_instruction = excluded.transfer_instruction,
        payment_expiry_minutes = excluded.payment_expiry_minutes,
        transfer_admin_fee = excluded.transfer_admin_fee,
        qris_admin_fee = excluded.qris_admin_fee,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      body.qris_image_url || '',
      body.qris_is_active ? 1 : 0,
      body.transfer_instruction || '',
      Number(body.payment_expiry_minutes || 1440),
      Number(body.transfer_admin_fee || 0),
      Number(body.qris_admin_fee || 0)
    ).run();

    const settings = await env.MEYYA_DB.prepare('SELECT * FROM payment_settings WHERE id = 1').first();
    return jsonResponse({ success: true, settings });
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/payment-settings',
      method: 'PUT',
      phase: 'update-payment-settings',
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}
