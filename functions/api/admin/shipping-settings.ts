import { debugErrorResponse, jsonResponse } from '../_debug';

async function ensureShippingSchema(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS shipping_settings (
      id INTEGER PRIMARY KEY,
      origin_village_code TEXT,
      origin_village_name TEXT,
      active_couriers TEXT DEFAULT '["JNE","SICEPAT","JNT"]'
    )
  `).run();

  await env.MEYYA_DB.prepare(`
    INSERT OR IGNORE INTO shipping_settings (id, active_couriers)
    VALUES (1, '["JNE","SICEPAT","JNT"]')
  `).run();
}

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    await ensureShippingSchema(env);
    const settings = await env.MEYYA_DB.prepare('SELECT * FROM shipping_settings WHERE id = 1').first();
    return jsonResponse({
      ...(settings || {}),
      active_couriers: JSON.parse(settings?.active_couriers || '["JNE","SICEPAT","JNT"]'),
      api_key_configured: Boolean(env.API_CO_ID_KEY),
    });
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/shipping-settings',
      method: 'GET',
      phase: 'read-shipping-settings',
      has_db_binding: Boolean(env.MEYYA_DB),
      has_api_co_id_key: Boolean(env.API_CO_ID_KEY),
    });
  }
}

export async function onRequestPut(context: any) {
  const { env, request } = context;

  try {
    await ensureShippingSchema(env);
    const body = await request.json();
    const activeCouriers = Array.isArray(body.active_couriers) ? body.active_couriers : [];

    await env.MEYYA_DB.prepare(`
      INSERT INTO shipping_settings (id, origin_village_code, origin_village_name, active_couriers)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        origin_village_code = excluded.origin_village_code,
        origin_village_name = excluded.origin_village_name,
        active_couriers = excluded.active_couriers
    `).bind(
      body.origin_village_code || '',
      body.origin_village_name || '',
      JSON.stringify(activeCouriers)
    ).run();

    return jsonResponse({ success: true });
  } catch (error: any) {
    return debugErrorResponse(error, 500, {
      endpoint: '/api/admin/shipping-settings',
      method: 'PUT',
      phase: 'update-shipping-settings',
      has_db_binding: Boolean(env.MEYYA_DB),
      has_api_co_id_key: Boolean(env.API_CO_ID_KEY),
    });
  }
}
