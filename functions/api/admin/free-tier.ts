import { auditLog, ensureCommerceSchema } from '../_commerce';
import { ensureExternalApiUsageSchema, getExternalApiUsageSummary } from '../_externalApiUsage';

const LIMITS = {
  clerkUsers: 50000,
  d1DatabaseBytes: 500 * 1024 * 1024,
  d1AccountBytes: 5 * 1024 * 1024 * 1024,
  r2StorageBytes: 10 * 1024 * 1024 * 1024,
  d1RowsReadDaily: 5_000_000,
  d1RowsWrittenDaily: 100_000,
  r2ClassAMonthly: 1_000_000,
  r2ClassBMonthly: 10_000_000,
  apiCoIdMonthlyHits: 3000,
};

const CACHE_TTL_MS = 15 * 60 * 1000;
let cachedUsage: { data: any; expiresAt: number } | null = null;

export async function onRequestGet({ env, request }: any) {
  try {
    const url = new URL(request.url);
    const bypassCache = url.searchParams.get('refresh') === '1';
    if (!bypassCache && cachedUsage && cachedUsage.expiresAt > Date.now()) {
      return json({
        ...cachedUsage.data,
        cache: {
          hit: true,
          ttlSeconds: Math.max(0, Math.floor((cachedUsage.expiresAt - Date.now()) / 1000)),
          note: 'Free-tier usage memakai cache 15 menit agar Cloudflare API/R2/D1 tidak dipanggil berulang.',
        },
      });
    }

    await ensureCommerceSchema(env);
    await ensureExternalApiUsageSchema(env);

    const d1Storage = await getD1Storage(env);
    const cloudflareD1 = await getCloudflareD1Usage(env);
    const tableStats = await getTableStats(env);
    const r2Storage = await getR2Storage(env);
    const externalApis = await getExternalApiUsageSummary(env);
    const userCount = await readTableCount(env, 'users');
    const databaseBytes = cloudflareD1.databaseBytes ?? d1Storage.bytes;
    const accountStorageBytes = cloudflareD1.accountStorageBytes ?? databaseBytes;

    const data = {
      limits: LIMITS,
      clerk: {
        users: userCount,
        limit: LIMITS.clerkUsers,
        source: 'D1 synced users proxy',
      },
      d1: {
        databaseBytes,
        accountStorageBytes,
        databaseLimitBytes: LIMITS.d1DatabaseBytes,
        accountStorageLimitBytes: LIMITS.d1AccountBytes,
        rowsReadDailyLimit: LIMITS.d1RowsReadDaily,
        rowsWrittenDailyLimit: LIMITS.d1RowsWrittenDaily,
        pageCount: d1Storage.pageCount,
        pageSize: d1Storage.pageSize,
        source: cloudflareD1.databaseBytes !== null || cloudflareD1.accountStorageBytes !== null ? 'cloudflare_api' : d1Storage.bytes !== null ? 'd1_pragma' : 'unavailable',
        cloudflareApi: cloudflareD1,
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
      externalApis,
      pruningDefaults: {
        eventRetentionDays: 120,
        convertedCartRetentionDays: 30,
        staleCartRetentionDays: 90,
        analyticsUserKeyRetentionDays: 180,
        rawEventArchiveMaxRows: 10000,
        regionCacheRetentionDays: 14,
        shippingQuoteCacheRetentionDays: 2,
        auditLogRetentionDays: 365,
      },
      cache: {
        hit: false,
        ttlSeconds: CACHE_TTL_MS / 1000,
        note: 'Free-tier usage akan di-cache 15 menit di Cloudflare Function isolate.',
      },
    };

    cachedUsage = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return json(data);
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
    const analyticsUserKeyRetentionDays = clampDays(body.analyticsUserKeyRetentionDays, 30, 3650, 180);
    const regionCacheRetentionDays = clampDays(body.regionCacheRetentionDays, 1, 3650, 14);
    const shippingQuoteCacheRetentionDays = clampDays(body.shippingQuoteCacheRetentionDays, 1, 3650, 2);
    const auditLogRetentionDays = clampDays(body.auditLogRetentionDays, 180, 3650, 365);
    const includeAuditLogs = Boolean(body.includeAuditLogs);

    const changes: Record<string, number> = {};
    changes.user_events = await deleteOlderThan(env, 'user_events', 'created_at', eventRetentionDays);
    changes.analytics_daily_metric_users = await deleteOlderThan(env, 'analytics_daily_metric_users', 'created_at', analyticsUserKeyRetentionDays);
    changes.converted_cart_snapshots = await deleteConvertedCartSnapshots(env, convertedCartRetentionDays);
    changes.stale_empty_cart_snapshots = await deleteStaleEmptyCartSnapshots(env, staleCartRetentionDays);
    changes.region_cache = await deleteOlderThan(env, 'region_cache', 'cached_at', regionCacheRetentionDays);
    changes.shipping_quote_cache = await deleteOlderThan(env, 'shipping_quote_cache', 'cached_at', shippingQuoteCacheRetentionDays);

    if (includeAuditLogs) {
      changes.audit_logs = await deleteOlderThan(env, 'audit_logs', 'created_at', auditLogRetentionDays);
    }

    await auditLog(env, body?.clerkId || null, 'PRUNE_FREE_TIER_DATA', 'system', 'free-tier', {
      eventRetentionDays,
      convertedCartRetentionDays,
      staleCartRetentionDays,
      analyticsUserKeyRetentionDays,
      regionCacheRetentionDays,
      shippingQuoteCacheRetentionDays,
      auditLogRetentionDays,
      includeAuditLogs,
      changes,
    });

    cachedUsage = null;

    return json({ success: true, changes });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal menjalankan pruning' }, 500);
  }
}

async function getD1Storage(env: any) {
  const pageCount = await readPragmaNumber(env, 'page_count');
  const pageSize = await readPragmaNumber(env, 'page_size');
  return {
    pageCount,
    pageSize,
    bytes: pageCount > 0 && pageSize > 0 ? pageCount * pageSize : null,
  };
}

async function getCloudflareD1Usage(env: any) {
  const token = String(env.CLOUDFLARE_API_TOKEN || '').trim();
  const accountId = String(env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const databaseId = String(env.CLOUDFLARE_D1_DATABASE_ID || '').trim();
  const base = {
    configured: Boolean(token && accountId && databaseId),
    databaseBytes: null as number | null,
    accountStorageBytes: null as number | null,
    databaseId: databaseId || null,
    databaseName: null as string | null,
    error: null as string | null,
    note: null as string | null,
  };

  if (!token || !accountId || !databaseId) {
    return {
      ...base,
      note: 'Set CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, dan CLOUDFLARE_D1_DATABASE_ID agar ukuran D1 dibaca dari Cloudflare API.',
    };
  }

  try {
    const [databaseInfo, databaseList] = await Promise.all([
      cloudflareApiGet(env, `/accounts/${accountId}/d1/database/${databaseId}`),
      cloudflareApiGet(env, `/accounts/${accountId}/d1/database?per_page=100`),
    ]);

    const databaseResult = databaseInfo?.result || {};
    const listResult = Array.isArray(databaseList?.result) ? databaseList.result : [];
    const databaseBytes = readPositiveNumber(databaseResult.file_size);
    const accountStorageBytes = listResult.reduce((sum: number, item: any) => sum + readPositiveNumber(item?.file_size), 0);

    return {
      ...base,
      databaseBytes: databaseBytes || null,
      accountStorageBytes: accountStorageBytes || databaseBytes || null,
      databaseName: typeof databaseResult.name === 'string' ? databaseResult.name : null,
      note: 'Dibaca dari Cloudflare D1 API.',
    };
  } catch (error: any) {
    return {
      ...base,
      error: error.message || 'Cloudflare D1 API tidak bisa dibaca.',
      note: 'Fallback ke PRAGMA D1 jika tersedia.',
    };
  }
}

async function cloudflareApiGet(env: any, path: string) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: {
      Authorization: `Bearer ${String(env.CLOUDFLARE_API_TOKEN || '').trim()}`,
      'Content-Type': 'application/json',
    },
  });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const message = payload?.errors?.[0]?.message || `Cloudflare API error ${response.status}`;
    throw new Error(message);
  }
  return payload;
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
    'analytics_daily_metrics',
    'analytics_daily_metric_users',
    'analytics_event_archives',
    'user_event_summaries',
    'user_cart_snapshots',
    'region_cache',
    'shipping_quote_cache',
    'external_api_usage_monthly',
    'audit_logs',
    'return_requests',
    'stock_movements',
    'inventory_reservations',
  ];

  const rows = [];
  for (const table of tables) {
    rows.push({ table, rows: await readTableCount(env, table) });
  }

  return rows.sort((a, b) => b.rows - a.rows);
}

async function readTableCount(env: any, table: string) {
  try {
    const result = await env.MEYYA_DB.prepare(`SELECT COUNT(*) AS total FROM ${table}`).first();
    return readNumberFromRow(result, ['total', 'COUNT(*)', 'count']);
  } catch {
    return 0;
  }
}

async function readPragmaNumber(env: any, pragmaName: 'page_count' | 'page_size') {
  try {
    const row = await env.MEYYA_DB.prepare(`PRAGMA ${pragmaName}`).first();
    return readNumberFromRow(row, [pragmaName]);
  } catch {
    return 0;
  }
}

function readNumberFromRow(row: any, preferredKeys: string[]) {
  if (!row || typeof row !== 'object') return 0;
  for (const key of preferredKeys) {
    const value = Number(row[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  for (const value of Object.values(row)) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue;
  }
  return 0;
}

function readPositiveNumber(value: any) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
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
