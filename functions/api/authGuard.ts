export async function requireAdmin(context: any) {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // In a real production scenario, verify the JWT properly using clerk/backend or a library.
    // For this MVP, we decode the JWT payload to get the sub (clerk user ID) and check if the user is admin in D1.
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
    const payload = JSON.parse(atob(base64));
    
    if (!payload.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const clerkId = payload.sub;
    
    const user = await env.MEYYA_DB.prepare('SELECT role FROM users WHERE clerk_id = ?').bind(clerkId).first();
    
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    return null; // Return null if authorized
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid token or unauthorized' }), { status: 401 });
  }
}

export async function requireAuth(context: any) {
  const { request, env } = context;
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
    const payload = JSON.parse(atob(base64));
    
    if (!payload.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Attach clerk user ID to context for later use
    context.userId = payload.sub;

    return null; // Return null if authorized
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid token or unauthorized' }), { status: 401 });
  }
}
