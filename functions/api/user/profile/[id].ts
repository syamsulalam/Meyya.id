import { ensureUsersSchema, syncUserProfileToClerk } from '../../_users';

export async function onRequestGet(context: any) {
  const { env, request, params, data } = context;
  const id = params.id;
  const clerkId = data?.clerkId;

  if (!clerkId || clerkId !== id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    await ensureUsersSchema(env);
    const user = await env.MEYYA_DB.prepare('SELECT * FROM users WHERE clerk_id = ?').bind(id).first();
    const addresses = await env.MEYYA_DB.prepare('SELECT * FROM user_addresses WHERE user_id = ?').bind(id).all();

    let combinedUser = user || {};
    if (user && user.first_name) {
       combinedUser.name = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }

    return new Response(JSON.stringify({ 
      user: combinedUser, 
      addresses: addresses.results || [] 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPut(context: any) {
  const { env, request, params, data } = context;
  const id = params.id;
  const clerkId = data?.clerkId;

  if (!clerkId || clerkId !== id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  try {
    await ensureUsersSchema(env);
    const body = await request.json();

    // Split full name into first and last name
    let firstName = body.name || '';
    let lastName = '';
    
    if (firstName.includes(' ')) {
       const parts = firstName.split(' ');
       firstName = parts[0];
       lastName = parts.slice(1).join(' ');
    }

    // Update user info
    if (body.name !== undefined || body.phone_wa !== undefined || body.birth_date !== undefined) {
      const existing = await env.MEYYA_DB.prepare('SELECT birth_date, phone_wa FROM users WHERE clerk_id = ?').bind(id).first();
      const nextBirthDate = cleanBirthDate(body.birth_date);
      if (existing?.birth_date && nextBirthDate && existing.birth_date !== nextBirthDate) {
        return new Response(JSON.stringify({ error: 'Tanggal lahir sudah tersimpan dan tidak bisa diubah.' }), { status: 400 });
      }
      const nextPhoneWa = cleanPhoneWa(body.phone_wa);
      const existingPhoneWa = cleanPhoneWa(existing?.phone_wa);
      const phoneChanged = nextPhoneWa !== existingPhoneWa;
      await env.MEYYA_DB.prepare(`
         UPDATE users SET
           first_name = ?,
           last_name = ?,
           phone_wa = ?,
           phone_wa_verified_at = CASE WHEN ? THEN NULL ELSE phone_wa_verified_at END,
           phone_wa_verification_code = CASE WHEN ? THEN NULL ELSE phone_wa_verification_code END,
           phone_wa_verification_requested_at = CASE WHEN ? THEN NULL ELSE phone_wa_verification_requested_at END,
           phone_wa_verification_expires_at = CASE WHEN ? THEN NULL ELSE phone_wa_verification_expires_at END,
           birth_date = ?
         WHERE clerk_id = ?
      `).bind(
        firstName,
        lastName,
        nextPhoneWa,
        phoneChanged ? 1 : 0,
        phoneChanged ? 1 : 0,
        phoneChanged ? 1 : 0,
        phoneChanged ? 1 : 0,
        existing?.birth_date || nextBirthDate,
        id
      ).run();

      try {
        await syncUserProfileToClerk(env, id, {
          firstName,
          lastName,
          phoneWa: nextPhoneWa,
          phoneWaVerifiedAt: phoneChanged ? null : undefined,
        });
      } catch {
        // D1 remains the source of truth; Clerk metadata sync is best-effort.
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Profile updated' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function cleanBirthDate(value: any) {
  if (!value) return null;
  const clean = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
}

function cleanPhoneWa(value: any) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return `+${raw.slice(1).replace(/\D/g, '')}`;
  return raw.replace(/[^\d+]/g, '');
}
