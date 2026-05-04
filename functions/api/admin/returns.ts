import { auditLog, ensureCommerceSchema } from '../_commerce';

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    await ensureCommerceSchema(env);
    const { results } = await env.MEYYA_DB.prepare(`
      SELECT rr.*, u.email, COALESCE(u.first_name || ' ' || u.last_name, u.email) AS customer_name
      FROM return_requests rr
      LEFT JOIN users u ON u.clerk_id = rr.clerk_id
      ORDER BY rr.created_at DESC
    `).all();
    const formatted = await Promise.all((results || []).map(async (item: any) => {
      const orderItems = await env.MEYYA_DB.prepare(`
        SELECT product_id, product_name, variant_id, variant_options, color_name, size_name, quantity
        FROM order_items
        WHERE order_id = ?
      `).bind(item.order_id).all();
      return {
        ...item,
        evidence_urls: parseJsonArray(item.evidence_urls),
        warehouse_evidence_urls: parseJsonArray(item.warehouse_evidence_urls),
        qc_log: parseJsonArray(item.qc_log),
        order_items: orderItems.results || [],
        sla_status: getSlaStatus(item.sla_due_at, item.status),
      };
    }));
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
    const id = Number(body.id);
    const status = String(body.status || '').toUpperCase();
    const adminNote = String(body.admin_note || '').trim();
    const receivedNote = String(body.received_note || '').trim();
    const decision = sanitizeDecision(body.decision);
    const decisionNote = String(body.decision_note || '').trim();
    const warehouseEvidenceUrls = sanitizeUrlArray(body.warehouse_evidence_urls);
    const qcLog = sanitizeQcLog(body.qc_log);
    const restockReceivedItems = Boolean(body.restock_received_items);
    if (!id || !['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid return request update' }), { status: 400 });
    }

    const requestRow = await env.MEYYA_DB.prepare('SELECT * FROM return_requests WHERE id = ?').bind(id).first();
    if (!requestRow) return new Response(JSON.stringify({ error: 'Return request not found' }), { status: 404 });

    await env.MEYYA_DB.prepare(`
      UPDATE return_requests
      SET status = ?,
          admin_note = COALESCE(?, admin_note),
          received_note = CASE WHEN ? = 'RECEIVED' THEN COALESCE(?, received_note) ELSE received_note END,
          warehouse_evidence_urls = COALESCE(?, warehouse_evidence_urls),
          decision = COALESCE(?, decision),
          decision_note = COALESCE(?, decision_note),
          qc_log = COALESCE(?, qc_log),
          received_at = CASE WHEN ? = 'RECEIVED' THEN COALESCE(received_at, CURRENT_TIMESTAMP) ELSE received_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      status,
      adminNote || null,
      status,
      receivedNote || null,
      warehouseEvidenceUrls.length > 0 ? JSON.stringify(warehouseEvidenceUrls) : null,
      decision,
      decisionNote || null,
      qcLog.length > 0 ? JSON.stringify(qcLog) : null,
      status,
      id
    ).run();

    let restoredStock = false;
    if (status === 'RECEIVED' && restockReceivedItems && !requestRow.stock_restored_at) {
      await restoreReturnedOrderStock(env, requestRow.order_id);
      await env.MEYYA_DB.prepare(`
        UPDATE return_requests SET stock_restored_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();
      restoredStock = true;
    }

    await auditLog(env, data?.clerkId || null, 'UPDATE_RETURN_REQUEST', 'return_request', String(id), {
      status,
      restored_stock: restoredStock,
      decision,
      qc_count: qcLog.length,
      warehouse_evidence_count: warehouseEvidenceUrls.length,
    });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

async function restoreReturnedOrderStock(env: any, orderId: string) {
  const { results: items } = await env.MEYYA_DB.prepare(`
    SELECT product_id, variant_id, quantity
    FROM order_items
    WHERE order_id = ?
  `).bind(orderId).all();

  const statements: any[] = [];
  for (const item of items || []) {
    statements.push(
      env.MEYYA_DB.prepare('UPDATE products SET stock = stock + ?, last_stock_update = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(Number(item.quantity || 0), item.product_id)
    );
    if (item.variant_id) {
      statements.push(
        env.MEYYA_DB.prepare('UPDATE product_variants SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(Number(item.quantity || 0), item.variant_id)
      );
    }
    statements.push(
      env.MEYYA_DB.prepare("INSERT INTO stock_movements (product_id, order_id, change_qty, reason, note) VALUES (?, ?, ?, 'RETURN_RECEIVED', ?)")
        .bind(item.product_id, orderId, Number(item.quantity || 0), 'Barang retur diterima dan stok dikembalikan')
    );
  }

  if (statements.length > 0) await env.MEYYA_DB.batch(statements);
}

function parseJsonArray(value: any) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeUrlArray(value: any) {
  const source = Array.isArray(value) ? value : [];
  return Array.from(new Set(source
    .map((url: any) => String(url || '').trim())
    .filter((url: string) => /^https?:\/\//.test(url))
    .slice(0, 8)));
}

function sanitizeDecision(value: any) {
  const decision = String(value || '').trim().toUpperCase();
  return ['REFUND', 'EXCHANGE', 'REJECT', 'REPAIR', 'STORE_CREDIT'].includes(decision) ? decision : null;
}

function sanitizeQcLog(value: any) {
  const source = Array.isArray(value) ? value : [];
  return source.slice(0, 30).map((item: any) => ({
    product_id: Number(item?.product_id || 0),
    variant_id: item?.variant_id ? Number(item.variant_id) : null,
    product_name: String(item?.product_name || '').slice(0, 120),
    quantity: Math.max(0, Number(item?.quantity || 0)),
    condition: sanitizeCondition(item?.condition),
    note: String(item?.note || '').slice(0, 240),
  })).filter((item: any) => item.product_id && item.quantity > 0);
}

function sanitizeCondition(value: any) {
  const condition = String(value || '').trim().toUpperCase();
  return ['GOOD', 'DAMAGED', 'MISSING', 'WRONG_ITEM', 'USED', 'INCOMPLETE'].includes(condition) ? condition : 'GOOD';
}

function getSlaStatus(slaDueAt: string | null, status: string) {
  if (!slaDueAt || ['REJECTED', 'REFUNDED', 'EXCHANGED'].includes(String(status || '').toUpperCase())) return 'NONE';
  const due = new Date(slaDueAt).getTime();
  if (Number.isNaN(due)) return 'NONE';
  const diffHours = Math.ceil((due - Date.now()) / 3600000);
  if (diffHours < 0) return 'OVERDUE';
  if (diffHours <= 24) return 'DUE_SOON';
  return 'ON_TRACK';
}
