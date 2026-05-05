import { getAppSetting, getContactWhatsapp, getSupportWhatsapp, normalizePhone, setAppSetting } from '../_appSettings';
import { auditLog } from '../_commerce';
import { jsonResponse } from '../_debug';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    return jsonResponse({
      support_whatsapp: await getSupportWhatsapp(env),
      contact_whatsapp: await getContactWhatsapp(env),
      contact_uses_support_whatsapp: (await getAppSetting(env, 'contact_uses_support_whatsapp', '1')) === '1',
      env_fallback_configured: Boolean(env.MEYYA_SUPPORT_WHATSAPP),
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Gagal membaca setting verifikasi.' }, 500);
  }
}

export async function onRequestPut(context: any) {
  const { env, request, data } = context;

  try {
    const body = await request.json();
    const supportWhatsapp = normalizePhone(body.support_whatsapp);
    const contactUsesSupportWhatsapp = body.contact_uses_support_whatsapp !== false;
    const contactWhatsapp = contactUsesSupportWhatsapp ? supportWhatsapp : normalizePhone(body.contact_whatsapp);
    if (!supportWhatsapp || supportWhatsapp.length < 10) {
      return jsonResponse({ error: 'Nomor WhatsApp verifikasi Meyya tidak valid.' }, 400);
    }
    if (!contactWhatsapp || contactWhatsapp.length < 10) {
      return jsonResponse({ error: 'Nomor WhatsApp kontak resmi tidak valid.' }, 400);
    }

    await setAppSetting(env, 'support_whatsapp', supportWhatsapp);
    await setAppSetting(env, 'contact_whatsapp', contactWhatsapp);
    await setAppSetting(env, 'contact_uses_support_whatsapp', contactUsesSupportWhatsapp ? '1' : '0');
    await auditLog(env, data?.clerkId || null, 'UPDATE_VERIFICATION_SETTINGS', 'app_settings', 'support_whatsapp', {
      support_whatsapp_suffix: supportWhatsapp.slice(-4),
      contact_whatsapp_suffix: contactWhatsapp.slice(-4),
      contact_uses_support_whatsapp: contactUsesSupportWhatsapp,
    });

    return jsonResponse({
      success: true,
      support_whatsapp: supportWhatsapp,
      contact_whatsapp: contactWhatsapp,
      contact_uses_support_whatsapp: contactUsesSupportWhatsapp,
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Gagal menyimpan setting verifikasi.' }, 500);
  }
}
