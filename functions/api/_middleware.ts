import { verifyToken } from '@clerk/backend';

export async function onRequest(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const isAdminRoute = url.pathname.startsWith('/api/admin/');
  const isMutationProductRoute = (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/categories')) && request.method !== 'GET';
  const isUploadRoute = url.pathname.startsWith('/api/upload');
  
  const isUserRoute = url.pathname.startsWith('/api/user/');
  const isOrdersRoute = url.pathname.startsWith('/api/orders');

  if (url.pathname.startsWith('/api/webhooks/')) return next();

  if (isAdminRoute || isMutationProductRoute || isUploadRoute || isUserRoute || isOrdersRoute) {
    if (!env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is not configured for protected API routes');
      return new Response(JSON.stringify({ error: 'Authentication is not configured' }), { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await verifyToken(token, {
         secretKey: env.CLERK_SECRET_KEY,
      });
      
      const clerkId = payload.sub;
      if (!clerkId) {
        return new Response(JSON.stringify({ error: 'Invalid token structure' }), { status: 401 });
      }

      context.data = { ...context.data, clerkId };

      if (isAdminRoute || isMutationProductRoute || isUploadRoute) {
        // Check role in DB
        const user = await env.MEYYA_DB.prepare('SELECT role FROM users WHERE clerk_id = ?').bind(clerkId).first();
        
        if (!user || user.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Token validation failed' }), { status: 401 });
    }
  }

  // Ensure public endpoints continue processing
  return next();
}
