import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = String(url.searchParams.get('status') || '').toUpperCase();
  const statusFilter = ['PUBLISHED', 'HIDDEN', 'PENDING'].includes(status) ? status : '';

  try {
    await ensureCommerceSchema(env);
    const { results } = statusFilter
      ? await env.MEYYA_DB.prepare(`
        SELECT
          pr.*,
          p.name AS product_name,
          p.slug AS product_slug,
          u.email,
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS customer_name
        FROM product_reviews pr
        LEFT JOIN products p ON p.id = pr.product_id
        LEFT JOIN users u ON u.clerk_id = pr.clerk_id
        WHERE pr.status = ?
        ORDER BY pr.created_at DESC
        LIMIT 200
      `).bind(statusFilter).all()
      : await env.MEYYA_DB.prepare(`
        SELECT
          pr.*,
          p.name AS product_name,
          p.slug AS product_slug,
          u.email,
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS customer_name
        FROM product_reviews pr
        LEFT JOIN products p ON p.id = pr.product_id
        LEFT JOIN users u ON u.clerk_id = pr.clerk_id
        ORDER BY pr.created_at DESC
        LIMIT 200
      `).all();

    return json(results || []);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPatch(context: any) {
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return json({ error: 'Review id wajib diisi' }, 400);

    const status = body.status ? String(body.status).toUpperCase() : null;
    if (status && !['PUBLISHED', 'HIDDEN', 'PENDING'].includes(status)) {
      return json({ error: 'Status review tidak valid' }, 400);
    }

    await env.MEYYA_DB.prepare(`
      UPDATE product_reviews
      SET
        status = COALESCE(?, status),
        admin_reply = CASE WHEN ? THEN ? ELSE admin_reply END,
        admin_replied_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE admin_replied_at END,
        admin_replied_by = CASE WHEN ? THEN ? ELSE admin_replied_by END,
        is_featured = COALESCE(?, is_featured),
        moderation_note = CASE WHEN ? THEN ? ELSE moderation_note END
      WHERE id = ?
    `).bind(
      status,
      body.admin_reply !== undefined ? 1 : 0,
      body.admin_reply === null ? null : String(body.admin_reply || '').trim(),
      body.admin_reply !== undefined ? 1 : 0,
      body.admin_reply !== undefined ? 1 : 0,
      data?.clerkId || null,
      body.is_featured === undefined ? null : (body.is_featured ? 1 : 0),
      body.moderation_note !== undefined ? 1 : 0,
      body.moderation_note === null ? null : String(body.moderation_note || '').trim(),
      id
    ).run();

    await auditLog(env, data?.clerkId || null, 'UPDATE_REVIEW_MODERATION', 'product_review', String(id), body);

    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
