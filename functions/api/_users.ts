const USER_COLUMNS: Record<string, string> = {
  clerk_id: 'TEXT',
  email: 'TEXT',
  first_name: 'TEXT',
  last_name: 'TEXT',
  phone_wa: 'TEXT',
  role: 'TEXT',
  last_login_at: 'DATETIME',
  joined_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
};

export async function ensureUsersSchema(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      clerk_id TEXT PRIMARY KEY,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      phone_wa TEXT,
      role TEXT,
      last_login_at DATETIME,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const { results } = await env.MEYYA_DB.prepare('PRAGMA table_info(users)').all();
  const existingColumns = new Set((results || []).map((column: any) => column.name));

  for (const [name, definition] of Object.entries(USER_COLUMNS)) {
    if (!existingColumns.has(name)) {
      await env.MEYYA_DB.prepare(`ALTER TABLE users ADD COLUMN ${name} ${definition}`).run();
    }
  }
}

export async function upsertSelfSyncedUser(env: any, user: any) {
  await ensureUsersSchema(env);

  const clerkId = user.clerk_id;
  const existing = await env.MEYYA_DB.prepare('SELECT clerk_id FROM users WHERE clerk_id = ? LIMIT 1').bind(clerkId).first();

  if (existing) {
    await env.MEYYA_DB.prepare(`
      UPDATE users SET
        email = COALESCE(NULLIF(?, ''), email),
        first_name = COALESCE(NULLIF(?, ''), first_name),
        last_name = COALESCE(NULLIF(?, ''), last_name),
        phone_wa = COALESCE(NULLIF(?, ''), phone_wa),
        last_login_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ?
    `).bind(user.email || '', user.first_name || '', user.last_name || '', user.phone_wa || '', clerkId).run();
    return;
  }

  await env.MEYYA_DB.prepare(`
    INSERT INTO users (clerk_id, email, first_name, last_name, phone_wa, role, last_login_at)
    VALUES (?, ?, ?, ?, ?, 'customer', CURRENT_TIMESTAMP)
  `).bind(clerkId, user.email || '', user.first_name || '', user.last_name || '', user.phone_wa || '').run();
}

export async function markUserAsAdmin(env: any, clerkId: string, clerkUser?: any) {
  await ensureUsersSchema(env);

  const email = clerkUser?.emailAddresses?.find((emailAddress: any) => emailAddress.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';
  const firstName = clerkUser?.firstName || '';
  const lastName = clerkUser?.lastName || '';

  const existing = await env.MEYYA_DB.prepare('SELECT clerk_id FROM users WHERE clerk_id = ? LIMIT 1').bind(clerkId).first();

  if (existing) {
    await env.MEYYA_DB.prepare(`
      UPDATE users SET
        role = 'admin',
        email = COALESCE(NULLIF(?, ''), email),
        first_name = COALESCE(NULLIF(?, ''), first_name),
        last_name = COALESCE(NULLIF(?, ''), last_name)
      WHERE clerk_id = ?
    `).bind(email, firstName, lastName, clerkId).run();
    return;
  }

  await env.MEYYA_DB.prepare(`
    INSERT INTO users (clerk_id, email, first_name, last_name, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).bind(clerkId, email, firstName, lastName).run();
}
