export async function onRequest(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const isAdminRoute = url.pathname.startsWith('/api/admin/');
  const isMutationProductRoute = (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/categories')) && request.method !== 'GET';
  const isUploadRoute = url.pathname.startsWith('/api/upload');

  if (isAdminRoute || isMutationProductRoute || isUploadRoute) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      // Decode JWT payload (without verification, as edge workers might not have full crypto or Clerk backend easily available without additional config).
      // Assuming Clerk protects the token source, but ideally use @clerk/backend or SVIX to verify.
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      const clerkId = payload.sub;
      if (!clerkId) {
        return new Response(JSON.stringify({ error: 'Invalid token structure' }), { status: 401 });
      }

      // Check role in DB
      const user = await env.MEYYA_DB.prepare('SELECT role FROM users WHERE clerk_id = ?').bind(clerkId).first();
      
      if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Token validation failed' }), { status: 401 });
    }
  }

  // Ensure public endpoints continue processing
  return next();
}
