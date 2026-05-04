export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size exceeds 5MB limit' }), { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, WEBP, AVIF, and PDF are allowed.' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    // Generate a unique file name
    const ext = file.name.split('.').pop();
    const fileName = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${ext}`;

    // Upload to Cloudflare R2
    if (env.MEYYA_R2) {
      await env.MEYYA_R2.put(fileName, arrayBuffer, {
        httpMetadata: { contentType: file.type },
      });
      
      // Get the public URL base from environment variables
      const baseUrl = env.MEYYA_R2_PUBLIC_URL;
      if (!baseUrl) {
        return new Response(JSON.stringify({ error: 'MEYYA_R2_PUBLIC_URL is not configured' }), { status: 500 });
      }
      
      // Ensure there is no trailing slash in baseUrl
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const publicUrl = `${normalizedBase}/${fileName}`;
      
      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: 'R2 bucket not bound natively in local/dev yet.' }), { status: 500 });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
