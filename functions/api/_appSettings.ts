const DEFAULT_SUPPORT_WHATSAPP = '6281234567890';
const DEFAULT_CONTACT_WHATSAPP = '6281234567890';

export async function ensureAppSettingsSchema(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function getAppSetting(env: any, key: string, fallback = '') {
  await ensureAppSettingsSchema(env);
  const row = await env.MEYYA_DB.prepare('SELECT value FROM app_settings WHERE key = ?').bind(key).first();
  return row?.value || fallback;
}

export async function setAppSetting(env: any, key: string, value: string) {
  await ensureAppSettingsSchema(env);
  await env.MEYYA_DB.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `).bind(key, value).run();
}

export async function getSupportWhatsapp(env: any) {
  return normalizePhone(await getAppSetting(env, 'support_whatsapp', env.MEYYA_SUPPORT_WHATSAPP || DEFAULT_SUPPORT_WHATSAPP));
}

export async function getContactWhatsapp(env: any) {
  const usesSupport = await getAppSetting(env, 'contact_uses_support_whatsapp', '1');
  if (usesSupport === '1') return getSupportWhatsapp(env);
  return normalizePhone(await getAppSetting(env, 'contact_whatsapp', env.MEYYA_CONTACT_WHATSAPP || DEFAULT_CONTACT_WHATSAPP));
}

export function normalizePhone(value: any) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}
