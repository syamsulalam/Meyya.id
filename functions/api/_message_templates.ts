export const TEMPLATE_VARIABLES: Record<string, Record<string, string>> = {
  payment_reminder: {
    name: 'Nama pelanggan',
    order_id: 'ID pesanan',
    total_paid: 'Total bayar',
    payment_expires_at: 'Batas pembayaran',
  },
  order_shipped: {
    name: 'Nama pelanggan',
    order_id: 'ID pesanan',
    courier: 'Kurir',
    tracking_number: 'Nomor resi',
    tracking_url: 'Link tracking pesanan',
  },
  order_completed: {
    name: 'Nama pelanggan',
    order_id: 'ID pesanan',
    total_paid: 'Total bayar',
  },
};

const GLOBAL_VARIABLES: Record<string, string> = {
  store_name: 'Nama toko',
  support_whatsapp: 'WhatsApp CS',
};

export function getAllowedTemplateVariables(key: string) {
  return {
    ...GLOBAL_VARIABLES,
    ...(TEMPLATE_VARIABLES[key] || {}),
  };
}

export function extractTemplateVariables(text: string) {
  const matches = String(text || '').matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
  return Array.from(new Set(Array.from(matches, (match) => match[1])));
}

export function validateMessageTemplate(key: string, title: string, body: string) {
  const allowed = getAllowedTemplateVariables(key);
  const variables = extractTemplateVariables(`${title}\n${body}`);
  const invalidVariables = variables.filter((variable) => !allowed[variable]);

  return {
    valid: invalidVariables.length === 0,
    allowedVariables: Object.keys(allowed),
    invalidVariables,
  };
}

export function renderMessageTemplate(text: string, values: Record<string, any>) {
  return String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const value = values[key];
    if (value === null || value === undefined || value === '') return `{{${key}}}`;
    return String(value);
  });
}

export function getTemplatePreviewValues(key: string) {
  return {
    store_name: 'MEYYA.ID',
    support_whatsapp: '6281234567890',
    name: 'Aisyah',
    order_id: 'ORD-20260504-123',
    total_paid: 'Rp 349.123',
    payment_expires_at: '4 Mei 2026 21.00',
    courier: 'JNE',
    tracking_number: 'JNE123456789',
    tracking_url: 'https://meyya.id/order/ORD-20260504-123',
    ...(key === 'order_completed' ? { total_paid: 'Rp 349.123' } : {}),
  };
}
