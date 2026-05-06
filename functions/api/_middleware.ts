import { createClerkClient } from '@clerk/backend';
import { debugErrorResponse, jsonResponse } from './_debug';
import { ensureUsersSchema, markUserAsAdmin } from './_users';

export async function onRequest(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  ensureProcessEnv();

  const isAdminRoute = url.pathname.startsWith('/api/admin/');
  const isMutationProductRoute = (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/categories')) && request.method !== 'GET';
  const isUploadRoute = url.pathname.startsWith('/api/upload');
  
  const isUserRoute = url.pathname.startsWith('/api/user/');
  const isOrdersRoute = url.pathname.startsWith('/api/orders');
  const isReviewRoute = url.pathname.startsWith('/api/reviews');
  const isReviewSpinRoute = url.pathname.startsWith('/api/review-spins');
  const isReturnRoute = url.pathname.startsWith('/api/returns');
  const isEventRoute = url.pathname.startsWith('/api/events');

  if (url.pathname.startsWith('/api/webhooks/')) return next();

  if (isAdminRoute || isMutationProductRoute || isUploadRoute || isUserRoute || isOrdersRoute || isReviewRoute || isReviewSpinRoute || isReturnRoute || isEventRoute) {
    if (!env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is not configured for protected API routes');
      return jsonResponse({
        error: 'Authentication is not configured',
        debug: {
          endpoint: url.pathname,
          phase: 'missing-clerk-secret',
          has_clerk_secret: false,
          has_db_binding: Boolean(env.MEYYA_DB),
          timestamp: new Date().toISOString(),
        }
      }, 500);
    }

    const clerkPublishableKey = env.VITE_CLERK_PUBLISHABLE_KEY || env.CLERK_PUBLISHABLE_KEY;
    if (!clerkPublishableKey) {
      return jsonResponse({
        error: 'Clerk publishable key is not configured',
        debug: {
          endpoint: url.pathname,
          phase: 'missing-clerk-publishable-key',
          expected_env_names: ['VITE_CLERK_PUBLISHABLE_KEY', 'CLERK_PUBLISHABLE_KEY'],
          has_clerk_secret: Boolean(env.CLERK_SECRET_KEY),
          has_db_binding: Boolean(env.MEYYA_DB),
          timestamp: new Date().toISOString(),
        }
      }, 500);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({
        error: 'Unauthorized: Missing or invalid Authorization header',
        debug: {
          endpoint: url.pathname,
          phase: 'missing-authorization-header',
          has_authorization_header: Boolean(authHeader),
          timestamp: new Date().toISOString(),
        }
      }, 401);
    }

    let requestState: any;
    try {
      const clerkClient = createClerkClient({
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: clerkPublishableKey,
      });
      requestState = await clerkClient.authenticateRequest(request, {
        acceptsToken: 'session_token',
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: clerkPublishableKey,
      });
    } catch (err: any) {
      return debugErrorResponse(err, 500, {
        endpoint: url.pathname,
        phase: 'clerk-authenticate-request',
        has_clerk_secret: Boolean(env.CLERK_SECRET_KEY),
        has_clerk_publishable_key: Boolean(clerkPublishableKey),
        has_db_binding: Boolean(env.MEYYA_DB),
        authorization_header_present: true,
      });
    }

    if (!requestState.isAuthenticated) {
      console.error('Clerk authentication failed', {
        reason: requestState.reason,
        message: requestState.message,
      });
      return jsonResponse({
        error: requestState.message || 'Token validation failed',
        debug: {
          endpoint: url.pathname,
          phase: 'clerk-request-not-authenticated',
          reason: requestState.reason,
          message: requestState.message,
          token_type: requestState.tokenType,
          timestamp: new Date().toISOString(),
        }
      }, 401);
    }

    const auth = requestState.toAuth();
    const clerkId = auth.userId;
    const payload = auth.sessionClaims;

    if (!clerkId) {
      return jsonResponse({
        error: 'Invalid token structure',
        debug: {
          endpoint: url.pathname,
          phase: 'missing-clerk-user-id',
          has_session_claims: Boolean(payload),
          timestamp: new Date().toISOString(),
        }
      }, 401);
    }

    context.data = { ...context.data, clerkId };

    try {
      if (isAdminRoute || isMutationProductRoute || isUploadRoute) {
        const isAdmin = await hasAdminAccess(env, clerkId, payload, clerkPublishableKey);

        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
      }
    } catch (err) {
      return debugErrorResponse(err, 500, {
        endpoint: url.pathname,
        phase: 'admin-authorization',
        clerk_id: clerkId,
        has_db_binding: Boolean(env.MEYYA_DB),
      });
    }
  }

  // Ensure public endpoints continue processing
  try {
    return await next();
  } catch (err: any) {
    return debugErrorResponse(err, 500, {
      endpoint: url.pathname,
      phase: 'route-handler',
      has_db_binding: Boolean(env.MEYYA_DB),
    });
  }
}

function ensureProcessEnv() {
  const globalScope = globalThis as any;
  if (!globalScope.process) {
    globalScope.process = { env: {} };
    return;
  }

  if (!globalScope.process.env) {
    globalScope.process.env = {};
  }
}

async function hasAdminAccess(env: any, clerkId: string, payload: any, clerkPublishableKey: string) {
  await ensureUsersSchema(env);

  const dbUser = await env.MEYYA_DB.prepare('SELECT role FROM users WHERE clerk_id = ?').bind(clerkId).first();

  if (dbUser?.role === 'admin') {
    return true;
  }

  if (getMetadataRole(payload) === 'admin') {
    await markUserAsAdmin(env, clerkId);
    return true;
  }

  const clerkClient = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: clerkPublishableKey,
  });
  const clerkUser: any = await clerkClient.users.getUser(clerkId);

  if (getMetadataRole(clerkUser) === 'admin') {
    await markUserAsAdmin(env, clerkId, clerkUser);
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
