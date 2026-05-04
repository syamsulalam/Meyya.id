import { auditLog, ensureCommerceSchema } from '../_commerce';
import { getAllowedTemplateVariables, getTemplatePreviewValues, renderMessageTemplate, validateMessageTemplate } from '../_message_templates';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare('SELECT * FROM message_templates ORDER BY key ASC').all();
    const formatted = (results || []).map((template: any) => {
      const previewValues = getTemplatePreviewValues(template.key);
      const validation = validateMessageTemplate(template.key, template.title || '', template.body || '');
      return {
        ...template,
        allowed_variables: getAllowedTemplateVariables(template.key),
        invalid_variables: validation.invalidVariables,
        preview_title: renderMessageTemplate(template.title || '', previewValues),
        preview_body: renderMessageTemplate(template.body || '', previewValues),
      };
    });
    return new Response(JSON.stringify(formatted), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPut(context: any) {
  const { env, request, data } = context;
  try {
    await ensureCommerceSchema(env);
    const body = await request.json();
    const key = String(body.key || '').trim();
    if (!key) return new Response(JSON.stringify({ error: 'Template key is required' }), { status: 400 });
    const title = String(body.title || key);
    const templateBody = String(body.body || '');
    const validation = validateMessageTemplate(key, title, templateBody);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: `Placeholder tidak dikenal: ${validation.invalidVariables.map((variable) => `{{${variable}}}`).join(', ')}`,
        invalid_variables: validation.invalidVariables,
        allowed_variables: validation.allowedVariables,
      }), { status: 400 });
    }

    await env.MEYYA_DB.prepare(`
      INSERT INTO message_templates (key, channel, title, body, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET channel = excluded.channel, title = excluded.title, body = excluded.body, updated_at = CURRENT_TIMESTAMP
    `).bind(key, body.channel || 'WHATSAPP', title, templateBody).run();

    await auditLog(env, data?.clerkId || null, 'UPSERT_MESSAGE_TEMPLATE', 'message_template', key, {});

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
