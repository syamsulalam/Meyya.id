import { ensureCommerceSchema } from '../../_commerce';

export async function onRequestGet(context: any) {
  const { env, params, data } = context;
  const orderId = params.id;
  const clerkId = data?.clerkId;

  if (!clerkId) return json({ error: 'Unauthorized' }, 401);

  try {
    await ensureCommerceSchema(env);
    const order = await env.MEYYA_DB.prepare(`
      SELECT id, clerk_id, tracking_number, tracking_courier, status
      FROM orders
      WHERE id = ?
    `).bind(orderId).first();

    if (!order) return json({ error: 'Order not found' }, 404);
    if (order.clerk_id !== clerkId) return json({ error: 'Forbidden' }, 403);

    const awb = String(order.tracking_number || '').trim();
    const courier = normalizeCourier(order.tracking_courier);
    if (!awb || !courier) {
      return json({
        available: false,
        error: 'Nomor resi atau kurir belum tersedia',
        tracking_number: awb,
        courier: order.tracking_courier || '',
      }, 200);
    }

    const apiKey = env.RAJAONGKIR_API_KEY || env.KOMERCE_API_KEY || env.API_CO_ID_KEY || '';
    if (!apiKey) {
      return json({
        available: false,
        error: 'API key tracking resi belum dikonfigurasi',
        tracking_number: awb,
        courier,
      }, 200);
    }

    const url = `https://rajaongkir.komerce.id/api/v1/track/waybill?awb=${encodeURIComponent(awb)}&courier=${encodeURIComponent(courier)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { key: apiKey },
    });
    const raw = await response.json().catch(() => ({}));
    const normalized = normalizeTrackingResponse(raw, awb, courier);

    if (!response.ok || !normalized.available) {
      return json({
        ...normalized,
        available: false,
        error: normalized.error || 'Tracking resi belum tersedia dari kurir',
      }, 200);
    }

    return json(normalized, 200);
  } catch (error: any) {
    return json({ available: false, error: error.message || 'Gagal mengambil tracking resi' }, 200);
  }
}

function normalizeTrackingResponse(raw: any, fallbackAwb: string, fallbackCourier: string) {
  const meta = raw?.meta || {};
  const data = raw?.data || null;
  if (!data) {
    return {
      available: false,
      error: meta.message || 'Data tracking tidak ditemukan',
      raw_meta: meta,
      tracking_number: fallbackAwb,
      courier: fallbackCourier,
      events: [],
    };
  }

  const summary = data.summary || {};
  const deliveryStatus = data.delivery_status || {};
  const manifest = Array.isArray(data.manifest) ? data.manifest : [];
  return {
    available: true,
    delivered: Boolean(data.delivered),
    status: deliveryStatus.status || summary.status || '',
    tracking_number: summary.waybill_number || fallbackAwb,
    courier: summary.courier_code || fallbackCourier,
    courier_name: summary.courier_name || '',
    service: summary.service_code || '',
    origin: summary.origin || data.details?.origin || '',
    destination: summary.destination || data.details?.destination || '',
    receiver: deliveryStatus.pod_receiver || data.details?.receiver_name || '',
    delivered_at: joinDateTime(deliveryStatus.pod_date, deliveryStatus.pod_time),
    events: manifest.map((event: any) => ({
      code: event.manifest_code || '',
      description: event.manifest_description || '',
      date: event.manifest_date || '',
      time: event.manifest_time || '',
      city: event.city_name || '',
      timestamp: joinDateTime(event.manifest_date, event.manifest_time),
    })),
    raw_meta: meta,
  };
}

function normalizeCourier(value: any) {
  const text = String(value || '').trim().toLowerCase();
  const compact = text.replace(/[^a-z0-9]/g, '');
  const map: Record<string, string> = {
    jnt: 'jnt',
    jne: 'jne',
    sicepat: 'sicepat',
    sap: 'sap',
    idexpress: 'ide',
    ide: 'ide',
    lionparcel: 'lion',
    lion: 'lion',
    anteraja: 'anteraja',
    ninja: 'ninja',
    ninjaexpress: 'ninja',
    wahana: 'wahana',
    tiki: 'tiki',
    pos: 'pos',
    posindonesia: 'pos',
    paxel: 'paxel',
  };
  return map[compact] || compact;
}

function joinDateTime(date?: string, time?: string) {
  const cleanDate = String(date || '').trim();
  const cleanTime = String(time || '').trim();
  if (!cleanDate && !cleanTime) return '';
  return [cleanDate, cleanTime].filter(Boolean).join(' ');
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
