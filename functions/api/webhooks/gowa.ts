import { ensureUsersSchema } from '../_users';
import { jsonResponse } from '../_debug';

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const configuredSecret = env.GOWA_WEBHOOK_SECRET || '';
  const providedSecret = request.headers.get('x-meyya-webhook-secret') ||
    request.headers.get('x-gowa-webhook-secret') ||
    url.searchParams.get('secret') ||
    '';

  if (configuredSecret && providedSecret !== configuredSecret) {
    return jsonResponse({ error: 'Invalid webhook secret' }, 401);
  }

  try {
    await ensureUsersSchema(env);
    const payload = await request.json();
    const event = String(payload?.event || payload?.type || '').toLowerCase();

    if (event && !['message', 'messages', 'message.received', 'incoming_message'].includes(event)) {
      return jsonResponse({ ignored: true, reason: 'unsupported_event', event });
    }

    const messagePayload = payload?.payload || payload?.message || payload;
    if (messagePayload?.is_from_me === true || messagePayload?.from_me === true) {
      return jsonResponse({ ignored: true, reason: 'from_me' });
    }

    const text = extractText(messagePayload);
    const code = text.match(/\bMEYYA-WA-[A-Z0-9]{6}\b/)?.[0] || '';
    if (!code) {
      return jsonResponse({ ignored: true, reason: 'verification_code_not_found' });
    }

    const senderJid = extractSender(messagePayload);
    const senderPhone = normalizePhone(senderJid);
    if (!senderPhone) {
      return jsonResponse({ ignored: true, reason: 'sender_phone_not_found' }, 400);
    }

    const user = await env.MEYYA_DB.prepare(`
      SELECT clerk_id, phone_wa, phone_wa_verification_expires_at
      FROM users
      WHERE phone_wa_verification_code = ?
      LIMIT 1
    `).bind(code).first();

    if (!user) {
      return jsonResponse({ verified: false, reason: 'code_not_found' }, 404);
    }

    const expectedPhone = normalizePhone(user.phone_wa);
    if (!expectedPhone || expectedPhone !== senderPhone) {
      return jsonResponse({
        verified: false,
        reason: 'sender_phone_mismatch',
        expected_suffix: expectedPhone.slice(-4),
        sender_suffix: senderPhone.slice(-4),
      }, 409);
    }

    const expiresAt = user.phone_wa_verification_expires_at ? new Date(user.phone_wa_verification_expires_at).getTime() : 0;
    if (expiresAt && expiresAt < Date.now()) {
      return jsonResponse({ verified: false, reason: 'code_expired' }, 410);
    }

    await env.MEYYA_DB.prepare(`
      UPDATE users
      SET
        phone_wa_verified_at = CURRENT_TIMESTAMP,
        phone_wa_verification_code = NULL,
        phone_wa_verification_expires_at = NULL
      WHERE clerk_id = ?
    `).bind(user.clerk_id).run();

    return jsonResponse({
      verified: true,
      clerk_id: user.clerk_id,
      phone_suffix: senderPhone.slice(-4),
      warning: configuredSecret ? undefined : 'GOWA_WEBHOOK_SECRET belum diset; set secret sebelum production webhook dibuka.',
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'GOWA webhook failed' }, 500);
  }
}

function extractText(value: any): string {
  if (!value || typeof value !== 'object') return '';
  const direct = value.text || value.body || value.content || value.message || value.conversation || value.caption;
  if (typeof direct === 'string') return direct;
  const nested = value.message?.conversation ||
    value.message?.extendedTextMessage?.text ||
    value.message?.text ||
    value.payload?.text ||
    value.payload?.body ||
    value.payload?.content;
  return typeof nested === 'string' ? nested : '';
}

function extractSender(value: any): string {
  if (!value || typeof value !== 'object') return '';
  const candidates = [
    value.sender_jid,
    value.senderJid,
    value.sender,
    value.from,
    value.phone,
    value.chat_jid,
    value.chatJid,
    value.key?.participant,
    value.key?.remoteJid,
    value.info?.sender,
    value.info?.chat,
  ];
  return String(candidates.find(Boolean) || '');
}

function normalizePhone(value: any) {
  const raw = String(value || '').split('@')[0];
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}
