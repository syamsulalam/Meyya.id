import { ensureUsersSchema } from '../_users';
import { jsonResponse } from '../_debug';
import { getSupportWhatsapp, normalizePhone } from '../_appSettings';

export async function onRequestPost(context: any) {
  const { env, data } = context;
  const clerkId = data?.clerkId;

  if (!clerkId) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    await ensureUsersSchema(env);

    const user = await env.MEYYA_DB.prepare(`
      SELECT clerk_id, email, first_name, last_name, phone_wa, phone_wa_verified_at
      FROM users
      WHERE clerk_id = ?
      LIMIT 1
    `).bind(clerkId).first();

    if (!user) {
      return jsonResponse({ error: 'Simpan profil terlebih dahulu sebelum verifikasi nomor WhatsApp.' }, 400);
    }

    const phoneDigits = normalizePhone(user.phone_wa);
    if (!phoneDigits) {
      return jsonResponse({ error: 'Isi dan simpan nomor WhatsApp terlebih dahulu.' }, 400);
    }

    if (user.phone_wa_verified_at) {
      return jsonResponse({
        verified: true,
        phone_wa_verified_at: user.phone_wa_verified_at,
      });
    }

    const code = `MEYYA-WA-${randomCode(6)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Pelanggan Meyya';
    const email = user.email || '-';
    const supportPhone = await getSupportWhatsapp(env);
    const message = [
      'VERIFIKASI NOMOR WHATSAPP MEYYA.ID',
      `Kode: ${code}`,
      `Nama: ${name}`,
      `Email: ${email}`,
      `Nomor akun: +${phoneDigits}`,
      '',
      'Saya mengirim pesan ini sendiri untuk memverifikasi nomor WhatsApp saya di Meyya.id. Mohon jangan mengubah isi pesan ini.'
    ].join('\n');
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${supportPhone}&text=${encodeURIComponent(message)}`;

    await env.MEYYA_DB.prepare(`
      UPDATE users
      SET
        phone_wa_verification_code = ?,
        phone_wa_verification_requested_at = CURRENT_TIMESTAMP,
        phone_wa_verification_expires_at = ?
      WHERE clerk_id = ?
    `).bind(code, expiresAt, clerkId).run();

    return jsonResponse({
      verified: false,
      code,
      expires_at: expiresAt,
      whatsapp_url: whatsappUrl,
      support_whatsapp: supportPhone,
      message,
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Gagal membuat verifikasi WhatsApp.' }, 500);
  }
}

function randomCode(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}
