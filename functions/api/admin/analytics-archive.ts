import { auditLog, ensureCommerceSchema } from '../_commerce';

const MAX_ARCHIVE_ROWS = 10000;

export async function onRequestPost(context: any) {
  const { env, request, data } = context;

  try {
    await ensureCommerceSchema(env);
    const body = await request.json().catch(() => ({}));
    const startDate = normalizeDate(body.start_date);
    const endDate = normalizeDate(body.end_date);
    const dryRun = Boolean(body.dry_run);
    const deleteAfterArchive = Boolean(body.delete_after_archive);
    const limit = clampNumber(body.limit, 1, MAX_ARCHIVE_ROWS, MAX_ARCHIVE_ROWS);

    if (!startDate || !endDate || startDate > endDate) {
      return json({ error: 'Window tanggal archive tidak valid' }, 400);
    }
    if (deleteAfterArchive && endDate >= new Date().toISOString().slice(0, 10)) {
      return json({ error: 'Delete-after-archive hanya boleh untuk window sebelum hari ini agar event baru tidak ikut terhapus.' }, 400);
    }

    const totalRow = await env.MEYYA_DB.prepare(`
      SELECT COUNT(*) AS total
      FROM user_events
      WHERE date(created_at) BETWEEN ? AND ?
    `).bind(startDate, endDate).first();
    const totalRows = Number(totalRow?.total || 0);

    if (deleteAfterArchive && totalRows > limit) {
      return json({
        error: `Window punya ${totalRows.toLocaleString('id-ID')} event, melebihi limit ${limit.toLocaleString('id-ID')}. Perkecil window tanggal atau naikkan limit maksimal ${MAX_ARCHIVE_ROWS.toLocaleString('id-ID')}.`,
      }, 400);
    }

    const events = await env.MEYYA_DB.prepare(`
      SELECT
        id, clerk_id, event_type, product_id, order_id, campaign_tag, source, medium, campaign,
        device_type, page_path, referrer, session_id, anonymous_id, metadata, created_at
      FROM user_events
      WHERE date(created_at) BETWEEN ? AND ?
      ORDER BY created_at ASC, id ASC
      LIMIT ?
    `).bind(startDate, endDate, limit).all();
    const rows = events.results || [];
    const payload = rows.map((row: any) => JSON.stringify(row)).join('\n');
    const bytes = new TextEncoder().encode(payload).byteLength;

    const preview = {
      dryRun,
      startDate,
      endDate,
      totalRows,
      selectedRows: rows.length,
      bytes,
      limit,
      deleteAfterArchive,
    };

    if (dryRun) {
      await auditLog(env, data?.clerkId || null, 'DRY_RUN_ANALYTICS_EVENT_ARCHIVE', 'analytics', `${startDate}_${endDate}`, preview);
      return json({ success: true, result: preview });
    }

    if (!env.MEYYA_R2) {
      return json({ error: 'Binding MEYYA_R2 belum tersedia, archive ke R2 tidak bisa dijalankan.' }, 500);
    }

    if (rows.length === 0) {
      return json({ success: true, result: { ...preview, objectKey: null, deletedRows: 0 } });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const objectKey = `analytics/user_events/${startDate}_to_${endDate}/${timestamp}.jsonl`;
    await env.MEYYA_R2.put(objectKey, payload, {
      httpMetadata: { contentType: 'application/x-ndjson; charset=utf-8' },
      customMetadata: {
        start_date: startDate,
        end_date: endDate,
        row_count: String(rows.length),
      },
    });

    let deletedRows = 0;
    if (deleteAfterArchive) {
      const deleted = await env.MEYYA_DB.prepare(`
        DELETE FROM user_events
        WHERE date(created_at) BETWEEN ? AND ?
      `).bind(startDate, endDate).run();
      deletedRows = Number(deleted?.meta?.changes || 0);
    }

    await env.MEYYA_DB.prepare(`
      INSERT INTO analytics_event_archives (
        object_key, start_date, end_date, row_count, deleted_count, bytes, status, created_by, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      objectKey,
      startDate,
      endDate,
      rows.length,
      deletedRows,
      bytes,
      deleteAfterArchive ? 'ARCHIVED_AND_DELETED' : 'ARCHIVED',
      data?.clerkId || null,
      JSON.stringify({ totalRows, limit })
    ).run();

    const result = {
      ...preview,
      objectKey,
      deletedRows,
    };

    await auditLog(env, data?.clerkId || null, 'RUN_ANALYTICS_EVENT_ARCHIVE', 'analytics', objectKey, result);
    return json({ success: true, result });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal archive analytics event ke R2' }, 500);
  }
}

function normalizeDate(value: any) {
  const text = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function clampNumber(value: any, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(numberValue)));
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
