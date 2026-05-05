import { validateCartStock } from '../_cartValidation';
import { ensureCommerceSchema } from '../_commerce';

export async function onRequestPost(context: any) {
  const { env, request } = context;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const validation = await validateCartStock(env, body?.items || []);

    return new Response(JSON.stringify(validation), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to validate cart stock' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
