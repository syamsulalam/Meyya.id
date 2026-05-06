import { backfillAnalyticsAggregates } from '../_analytics';
import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestPost(context: any) {
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json().catch(() => ({}));
    const result = await backfillAnalyticsAggregates(env, {
      startDate: String(body.start_date || ''),
      endDate: String(body.end_date || ''),
      replace: body.replace !== false,
      dryRun: Boolean(body.dry_run),
    });

    await auditLog(env, data?.clerkId || null, body.dry_run ? 'DRY_RUN_ANALYTICS_BACKFILL' : 'RUN_ANALYTICS_BACKFILL', 'analytics', `${result.startDate}_${result.endDate}`, result);

    return json({ success: true, result });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal menjalankan analytics backfill' }, 500);
  }
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
