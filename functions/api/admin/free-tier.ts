import { auditLog, ensureCommerceSchema } from '../_commerce';

const LIMITS = {
  clerkUsers: 50000,
  d1DatabaseBytes: 500 * 1024 * 1024,
  d1AccountBytes: 5 * 1024 * 1024 * 1024,
  r2StorageBytes: 10 * 1024 * 1024 * 1024,
  d1RowsReadDaily: 5_000_000,
  d1RowsWrittenDaily: 100_000,
  r2ClassAMonthly: 1_000_000,
  r2ClassBMonthly: 10_000_000,
};

export async function onRequestGet({ env }: any) {
  try {
    await ensureCommerceSchema(env);

    const d1Storage = await getD1Storage(env);
    const tableStats = await getTableStats(env);
    const r2Storage = await getR2Storage(env);
    const userCount = Number(tableStats.find((row) => row.table === 'users')?.rows || 0);

    return json({
      limits: LIMITS,
      clerk: {
        users: userCount,
        limit: LIMITS.clerkUsers,
        source: 'D1 synced users proxy',
      },
      d1: {
        databaseBytes: d1Storage.bytes,
        databaseLimitBytes: LIMITS.d1DatabaseBytes,
        accountStorageLimitBytes: LIMITS.d1AccountBytes,
        rowsReadDailyLimit: LIMITS.d1RowsReadDaily,
        rowsWrittenDailyLimit: LIMITS.d1RowsWrittenDaily,
        pageCount: d1Storage.pageCount,
        pageSize: d1Storage.pageSize,
        tableStats,
      },
      r2: {
        storageBytes: r2Storage.bytes,
        objectCount: r2Storage.objectCount,
        storageLimitBytes: LIMITS.r2StorageBytes,
        classAMonthlyLimit: LIMITS.r2ClassAMonthly,
        classBMonthlyLimit: LIMITS.r2ClassBMonthly,
        available: r2Storage.available,
        note: r2Storage.note,
      },
      pruningDefaults: {
        eventRetentionDays: 120,
        convertedCartRetentionDays: 30,
        staleCartRetentionDays: 90,
        regionCacheRetentionDays: 14,
        auditLogRetentionDays: 365,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal membaca free tier usage' }, 500);
  }
}

export async function onRequestPost({ env, request }: any) {
  try {
    await ensureCommerceSchema(env);
    const body = await request.json().catch(() => ({}));
    const eventRetentionDays = clampDays(body.eventRetentionDays, 30, 3650, 120);
    const convertedCartRetentionDays = clampDays(body.convertedCartRetentionDays, 7, 3650, 30);
    const staleCartRetentionDays = clampDays(body.staleCartRetentionDays, 30, 3650, 90);
    const regionCacheRetentionDays = clampDays(body.regionCacheRetentionDays, 1, 3650, 14);
    const auditLogRetentionDays = clampDays(body.auditLogRetentionDays, 180, 3650, 365);
    const includeAuditLogs = Boolean(body.includeAuditLogs);

    const changes: Record<string, number> = {};
    changes.user_events = await deleteOlderThan(env, 'user_events', 'created_at', eventRetentionDays);
    changes.converted_cart_snapshots = await deleteConvertedCartSnapshots(env, convertedCartRetentionDays);
    changes.stale_empty_cart_snapshots = await deleteStaleEmptyCartSnapshots(env, staleCartRetentionDays);
    changes.region_cache = await deleteOlderThan(env, 'region_cache', 'cached_at', regionCacheRetentionDays);

    if (includeAuditLogs) {
      changes.audit_logs = await deleteOlderThan(env, 'audit_logs', 'created_at', auditLogRetentionDays);
    }

    await auditLog(env, body?.clerkId || null, 'PRUNE_FREE_TIER_DATA', 'system', 'free-tier', {
      eventRetentionDays,
      convertedCartRetentionDays,
      staleCartRetentionDays,
      regionCacheRetentionDays,
      auditLogRetentionDays,
      includeAuditLogs,
      changes,
    });

    return json({ success: true, changes });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal menjalankan pruning' }, 500);
  }
}

async function getD1Storage(env: any) {
  const pageCountRow = await env.MEYYA_DB.prepare('PRAGMA page_count').first();
  const pageSizeRow = await env.MEYYA_DB.prepare('PRAGMA page_size').first();
  const pageCount = Number(pageCountRow?.page_count || Object.values(pageCountRow || {})[0] || 0);
  const pageSize = Number(pageSizeRow?.page_size || Object.values(pageSizeRow || {})[0] || 0);
  return {
    pageCount,
    pageSize,
    bytes: pageCount * pageSize,
  };
}

async function getTableStats(env: any) {
  const tables = [
    'users',
    'user_addresses',
    'products',
    'product_images',
    'product_variants',
    'orders',
    'order_items',
    'vouchers',
    'voucher_usages',
    'user_events',
    'user_cart_snapshots',
    'region_cache',
    'audit_logs',
    'return_requests',
    'stock_movements',
    'inventory_reservations',
  ];

  const rows = [];
  for (const table of tables) {
    try {
      const result = await env.MEYYA_DB.prepare(`SELECT COUNT(*) AS total FROM ${table}`).first();
      rows.push({ table, rows: Number(result?.total || 0) });
    } catch {
      rows.push({ table, rows: 0 });
    }
  }

  return rows.sort((a, b) => b.rows - a.rows);
}

async function getR2Storage(env: any) {
  if (!env.MEYYA_R2) {
    return { available: false, bytes: null, objectCount: null, note: 'Binding MEYYA_R2 belum tersedia di environment ini.' };
  }

  let cursor: string | undefined;
  let bytes = 0;
  let objectCount = 0;
  let safety = 0;

  do {
    const page = await env.MEYYA_R2.list({ limit: 1000, cursor });
    for (const object of page.objects || []) {
      bytes += Number(object.size || 0);
      objectCount += 1;
    }
    cursor = page.truncated ? page.cursor : undefined;
    safety += 1;
  } while (cursor && safety < 100);

  return {
    available: true,
    bytes,
    objectCount,
    note: cursor ? 'Listing dihentikan setelah 100 halaman untuk menjaga biaya operasi.' : 'Dihitung dari object yang bisa dilihat binding R2.',
  };
}

async function deleteOlderThan(env: any, table: string, column: string, days: number) {
  const result = await env.MEYYA_DB.prepare(`
    DELETE FROM ${table}
    WHERE datetime(${column}) < datetime('now', ?)
  `).bind(`-${days} days`).run();
  return Number(result?.meta?.changes || 0);
}

async function deleteConvertedCartSnapshots(env: any, days: number) {
  const result = await env.MEYYA_DB.prepare(`
    DELETE FROM user_cart_snapshots
    WHERE status = 'CONVERTED'
      AND datetime(updated_at) < datetime('now', ?)
  `).bind(`-${days} days`).run();
  return Number(result?.meta?.changes || 0);
}

async function deleteStaleEmptyCartSnapshots(env: any, days: number) {
  const result = await env.MEYYA_DB.prepare(`
    DELETE FROM user_cart_snapshots
    WHERE status = 'ACTIVE'
      AND COALESCE(item_count, 0) = 0
      AND datetime(updated_at) < datetime('now', ?)
  `).bind(`-${days} days`).run();
  return Number(result?.meta?.changes || 0);
}

function clampDays(value: any, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(numberValue)));
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

