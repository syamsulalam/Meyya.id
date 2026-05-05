import { getContactWhatsapp, getSupportWhatsapp } from '../_appSettings';
import { jsonResponse } from '../_debug';

export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    return jsonResponse({
      contact_whatsapp: await getContactWhatsapp(env),
      support_whatsapp: await getSupportWhatsapp(env),
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Gagal membaca pengaturan publik.' }, 500);
  }
}
