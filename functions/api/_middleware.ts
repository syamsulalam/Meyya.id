import { createClerkClient } from '@clerk/backend';

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

    const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    const requestState = await clerkClient.authenticateRequest(request, {
      acceptsToken: 'session_token',
      secretKey: env.CLERK_SECRET_KEY,
    });

    if (!requestState.isAuthenticated) {
      console.error('Clerk authentication failed', {
        reason: requestState.reason,
        message: requestState.message,
      });
      return new Response(JSON.stringify({ error: requestState.message || 'Token validation failed' }), { status: 401 });
    }

    const auth = requestState.toAuth();
    const clerkId = auth.userId;
    const payload = auth.sessionClaims;

    if (!clerkId) {
      return new Response(JSON.stringify({ error: 'Invalid token structure' }), { status: 401 });
    }

    context.data = { ...context.data, clerkId };

    try {
      if (isAdminRoute || isMutationProductRoute || isUploadRoute) {
        const isAdmin = await hasAdminAccess(env, clerkId, payload);

        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
      }
    } catch (err) {
      console.error('Admin authorization failed', err);
      return new Response(JSON.stringify({ error: 'Admin authorization failed' }), { status: 500 });
    }
  }

  // Ensure public endpoints continue processing
  return next();
}

async function hasAdminAccess(env: any, clerkId: string, payload: any) {
  const dbUser = await env.MEYYA_DB.prepare('SELECT role FROM users WHERE clerk_id = ?').bind(clerkId).first();

  if (dbUser?.role === 'admin') {
    return true;
  }

  if (getMetadataRole(payload) === 'admin') {
    await markD1UserAsAdmin(env, clerkId);
    return true;
  }

  const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const clerkUser: any = await clerkClient.users.getUser(clerkId);

  if (getMetadataRole(clerkUser) === 'admin') {
    await markD1UserAsAdmin(env, clerkId, clerkUser);
    return true;
  }

  return false;
}

function getMetadataRole(source: any) {
  return source?.publicMetadata?.role ||
    source?.public_metadata?.role ||
    source?.privateMetadata?.role ||
    source?.private_metadata?.role ||
    source?.metadata?.role ||
    source?.role;
}

async function markD1UserAsAdmin(env: any, clerkId: string, clerkUser?: any) {
  const email = clerkUser?.emailAddresses?.find((emailAddress: any) => emailAddress.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';
  const firstName = clerkUser?.firstName || '';
  const lastName = clerkUser?.lastName || '';

  await env.MEYYA_DB.prepare(`
    INSERT INTO users (clerk_id, email, first_name, last_name, role)
    VALUES (?, ?, ?, ?, 'admin')
    ON CONFLICT(clerk_id) DO UPDATE SET role = 'admin'
  `).bind(clerkId, email, firstName, lastName).run();
}
