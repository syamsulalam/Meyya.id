import { auditLog, ensureCommerceSchema, expirePendingOrders } from '../../_commerce';

export async function onRequestPost(context: any) {
  const { env, params, request, data } = context;
  const id = params.id;
  const clerkId = data?.clerkId;

  if (!clerkId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    await ensureCommerceSchema(env);
    await expirePendingOrders(env);

    const order = await env.MEYYA_DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    if (!order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    if (order.clerk_id !== clerkId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    if (order.status !== 'PENDING') return new Response(JSON.stringify({ error: 'Order is not waiting for payment' }), { status: 400 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file || !(file instanceof File)) return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    if (file.size > 5 * 1024 * 1024) return new Response(JSON.stringify({ error: 'File size exceeds 5MB limit' }), { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Upload JPG, PNG, WEBP, AVIF, or PDF.' }), { status: 400 });
    }

    if (!env.MEYYA_R2) return new Response(JSON.stringify({ error: 'R2 bucket is not configured' }), { status: 500 });
    if (!env.MEYYA_R2_PUBLIC_URL) return new Response(JSON.stringify({ error: 'MEYYA_R2_PUBLIC_URL is not configured' }), { status: 500 });

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `payment-proofs/${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    await env.MEYYA_R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    const base = env.MEYYA_R2_PUBLIC_URL.endsWith('/') ? env.MEYYA_R2_PUBLIC_URL.slice(0, -1) : env.MEYYA_R2_PUBLIC_URL;
    const publicUrl = `${base}/${key}`;

    await env.MEYYA_DB.prepare(`
      UPDATE orders
      SET payment_proof_url = ?, payment_submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(publicUrl, id).run();

    await auditLog(env, clerkId, 'UPLOAD_PAYMENT_PROOF', 'order', id, { url: publicUrl });

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
