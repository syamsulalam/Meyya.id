import { auditLog, ensureCommerceSchema } from '../_commerce';

const PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'SELESAI'];

export async function onRequestGet({ env, request }: any) {
  try {
    await ensureCommerceSchema(env);
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || 'month';
    const filter = getDateFilter(range);
    const report = await buildFinanceReport(env, filter);
    const { results: closings } = await env.MEYYA_DB.prepare(`
      SELECT id, period_key, closed_by, closed_at, snapshot
      FROM finance_period_closings
      ORDER BY period_key DESC
      LIMIT 24
    `).all();

    return json({
      range,
      ...report,
      closings: (closings || []).map((closing: any) => ({
        ...closing,
        snapshot: parseJson(closing.snapshot, {}),
      })),
    });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal membaca laporan keuangan' }, 500);
  }
}

export async function onRequestPost({ env, request, data }: any) {
  try {
    await ensureCommerceSchema(env);
    const body = await request.json().catch(() => ({}));

    if (body.action === 'CLOSE_PERIOD') {
      const periodKey = cleanPeriodKey(body.period_key) || new Date().toISOString().slice(0, 7);
      const existing = await env.MEYYA_DB.prepare('SELECT id FROM finance_period_closings WHERE period_key = ?').bind(periodKey).first();
      if (existing) return json({ error: 'Periode ini sudah ditutup buku' }, 400);

      const report = await buildFinanceReport(env, getPeriodFilter(periodKey));
      const snapshot = {
        periodKey,
        statement: report.statement,
        transactionCount: report.transactions.length,
        closedAt: new Date().toISOString(),
      };

      const result = await env.MEYYA_DB.prepare(`
        INSERT INTO finance_period_closings (period_key, closed_by, snapshot)
        VALUES (?, ?, ?)
      `).bind(periodKey, data?.clerkId || null, JSON.stringify(snapshot)).run();

      await auditLog(env, data?.clerkId || null, 'CLOSE_FINANCE_PERIOD', 'finance_period', periodKey, snapshot);
      return json({ success: true, id: result?.meta?.last_row_id || null, snapshot });
    }

    const type = String(body.type || '').toUpperCase();
    if (!['INCOME', 'EXPENSE'].includes(type)) return json({ error: 'Tipe transaksi harus INCOME atau EXPENSE' }, 400);

    const amount = Math.max(0, Math.round(Number(body.amount || 0)));
    if (!amount) return json({ error: 'Nominal transaksi wajib diisi' }, 400);

    const transactionDate = cleanDate(body.transaction_date) || new Date().toISOString().slice(0, 10);
    const periodKey = transactionDate.slice(0, 7);
    if (await isPeriodClosed(env, periodKey)) {
      return json({ error: `Periode ${periodKey} sudah ditutup buku. Transaksi tidak bisa ditambahkan.` }, 400);
    }

    const category = String(body.category || '').trim().slice(0, 80);
    const description = String(body.description || '').trim().slice(0, 500);
    const attachmentUrl = String(body.attachment_url || '').trim().slice(0, 1000);
    const createdBy = data?.clerkId || null;

    const result = await env.MEYYA_DB.prepare(`
      INSERT INTO finance_transactions (transaction_date, type, category, description, amount, attachment_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(transactionDate, type, category, description, amount, attachmentUrl || null, createdBy).run();

    await auditLog(env, createdBy, 'CREATE_FINANCE_TRANSACTION', 'finance_transaction', String(result?.meta?.last_row_id || ''), {
      transactionDate,
      type,
      category,
      amount,
    });

    return json({ success: true, id: result?.meta?.last_row_id || null });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal menyimpan transaksi' }, 500);
  }
}

export async function onRequestDelete({ env, request, data }: any) {
  try {
    await ensureCommerceSchema(env);
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id') || 0);
    if (!id) return json({ error: 'ID transaksi wajib diisi' }, 400);

    const transaction = await env.MEYYA_DB.prepare('SELECT transaction_date FROM finance_transactions WHERE id = ?').bind(id).first();
    if (!transaction) return json({ error: 'Transaksi tidak ditemukan' }, 404);
    const periodKey = String(transaction.transaction_date || '').slice(0, 7);
    if (await isPeriodClosed(env, periodKey)) {
      return json({ error: `Periode ${periodKey} sudah ditutup buku. Transaksi tidak bisa dihapus.` }, 400);
    }

    const result = await env.MEYYA_DB.prepare('DELETE FROM finance_transactions WHERE id = ?').bind(id).run();
    await auditLog(env, data?.clerkId || null, 'DELETE_FINANCE_TRANSACTION', 'finance_transaction', String(id), {
      changes: result?.meta?.changes || 0,
    });

    return json({ success: true, changes: result?.meta?.changes || 0 });
  } catch (error: any) {
    return json({ error: error.message || 'Gagal menghapus transaksi' }, 500);
  }
}

async function buildFinanceReport(env: any, filter: ReturnType<typeof getDateFilter>) {
  const orderSummary = await env.MEYYA_DB.prepare(`
      SELECT
        COUNT(*) AS order_count,
        COALESCE(SUM(subtotal), 0) AS subtotal,
        COALESCE(SUM(order_bump), 0) AS order_bump,
        COALESCE(SUM(discount_amount), 0) AS discount_amount,
        COALESCE(SUM(shipping_cost), 0) AS shipping_cost,
        COALESCE(SUM(admin_fee), 0) AS admin_fee,
        COALESCE(SUM(total_paid), 0) AS total_paid
      FROM orders
      WHERE status IN (${PAID_STATUSES.map(() => '?').join(', ')})
      ${filter.orderSql}
    `).bind(...PAID_STATUSES, ...filter.bindings).first();

  const hppSummary = await env.MEYYA_DB.prepare(`
      SELECT COALESCE(SUM(COALESCE(oi.hpp_at_purchase, 0) * COALESCE(oi.quantity, 0)), 0) AS hpp
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN (${PAID_STATUSES.map(() => '?').join(', ')})
      ${filter.joinedOrderSql}
    `).bind(...PAID_STATUSES, ...filter.bindings).first();

  const { results: transactions } = await env.MEYYA_DB.prepare(`
      SELECT *
      FROM finance_transactions
      WHERE 1 = 1
      ${filter.transactionSql}
      ORDER BY transaction_date DESC, id DESC
      LIMIT 100
    `).bind(...filter.bindings).all();

  const transactionRows = transactions || [];
  const manualIncome = sumTransactions(transactionRows, 'INCOME');
  const manualExpense = sumTransactions(transactionRows, 'EXPENSE');
  const packagingExpense = sumTransactionsByCategory(transactionRows, 'EXPENSE', ['packaging', 'kemasan', 'bubble', 'box', 'dus']);
  const adsExpense = sumTransactionsByCategory(transactionRows, 'EXPENSE', ['ads', 'iklan', 'marketing', 'meta ads', 'tiktok ads']);
  const orderCount = Number(orderSummary?.order_count || 0);
  const productRevenue = Number(orderSummary?.subtotal || 0) + Number(orderSummary?.order_bump || 0);
  const discountAmount = Number(orderSummary?.discount_amount || 0);
  const adminFeeCollected = Number(orderSummary?.admin_fee || 0);
  const netProductRevenue = productRevenue - discountAmount;
  const hpp = Number(hppSummary?.hpp || 0);
  const grossProfit = netProductRevenue - hpp;
  const operatingIncome = netProductRevenue + adminFeeCollected + manualIncome;
  const operatingExpense = hpp + manualExpense;
  const netProfit = operatingIncome - operatingExpense;

  return {
    statement: {
      orderCount,
      productRevenue,
      orderBumpRevenue: Number(orderSummary?.order_bump || 0),
      discountAmount,
      netProductRevenue,
      shippingCharged: Number(orderSummary?.shipping_cost || 0),
      adminFeeCollected,
      totalPaidCollected: Number(orderSummary?.total_paid || 0),
      hpp,
      grossProfit,
      manualIncome,
      manualExpense,
      packagingExpense,
      adsExpense,
      packagingCostPerOrder: orderCount > 0 ? packagingExpense / orderCount : 0,
      adsCostPerOrder: orderCount > 0 ? adsExpense / orderCount : 0,
      operatingIncome,
      operatingExpense,
      netProfit,
      marginPercent: netProductRevenue > 0 ? (grossProfit / netProductRevenue) * 100 : 0,
    },
    transactions: transactionRows,
  };
}

function getDateFilter(range: string) {
  if (range === 'today') {
    return {
      orderSql: "AND date(created_at) = date('now')",
      joinedOrderSql: "AND date(o.created_at) = date('now')",
      transactionSql: "AND date(transaction_date) = date('now')",
      bindings: [] as string[],
    };
  }

  if (range === 'all') {
    return { orderSql: '', joinedOrderSql: '', transactionSql: '', bindings: [] as string[] };
  }

  return {
    orderSql: "AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
    joinedOrderSql: "AND strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')",
    transactionSql: "AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')",
    bindings: [] as string[],
  };
}

function getPeriodFilter(periodKey: string) {
  return {
    orderSql: "AND strftime('%Y-%m', created_at) = ?",
    joinedOrderSql: "AND strftime('%Y-%m', o.created_at) = ?",
    transactionSql: "AND strftime('%Y-%m', transaction_date) = ?",
    bindings: [periodKey],
  };
}

function sumTransactions(transactions: any[], type: 'INCOME' | 'EXPENSE') {
  return transactions
    .filter((transaction) => String(transaction.type || '').toUpperCase() === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

function sumTransactionsByCategory(transactions: any[], type: 'INCOME' | 'EXPENSE', keywords: string[]) {
  return transactions
    .filter((transaction) => String(transaction.type || '').toUpperCase() === type)
    .filter((transaction) => {
      const text = `${transaction.category || ''} ${transaction.description || ''}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    })
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

function cleanDate(value: any) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cleanPeriodKey(value: any) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(text) ? text : null;
}

async function isPeriodClosed(env: any, periodKey: string) {
  if (!cleanPeriodKey(periodKey)) return false;
  const row = await env.MEYYA_DB.prepare('SELECT id FROM finance_period_closings WHERE period_key = ? LIMIT 1').bind(periodKey).first();
  return Boolean(row);
}

function parseJson(value: string, fallback: any) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
