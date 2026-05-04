export async function ensureVoucherSchema(env: any) {
  await addColumn(env, 'vouchers', 'birthday_claim_window_days', 'INTEGER');
  await addColumn(env, 'vouchers', 'applicable_product_ids', 'TEXT');
}

async function addColumn(env: any, table: string, column: string, definition: string) {
  try {
    await env.MEYYA_DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  } catch (error: any) {
    if (!String(error?.message || '').toLowerCase().includes('duplicate column')) throw error;
  }
}

export function parseApplicableProductIds(value: any): number[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === 'number') return [value].filter(Number.isFinite);

  const text = String(value).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return parseApplicableProductIds(parsed);
  } catch {
    return text.split(/[,\s]+/).map(Number).filter(Number.isFinite);
  }
}

export function stringifyApplicableProductIds(value: any) {
  const ids = Array.from(new Set(parseApplicableProductIds(value)));
  return ids.length > 0 ? JSON.stringify(ids) : null;
}

export async function validateVoucherForCart(env: any, voucher: any, options: {
  clerkId?: string | null;
  cartSubtotal: number;
  cartItems?: any[];
  shippingCost?: number;
}) {
  const now = new Date();
  const cartSubtotal = Number(options.cartSubtotal || 0);
  const shippingCost = Number(options.shippingCost || 0);
  const cartItems = Array.isArray(options.cartItems) ? options.cartItems : [];

  if (voucher.valid_from && new Date(voucher.valid_from) > now) {
    return invalid('Voucher belum aktif');
  }

  if (voucher.valid_until && new Date(voucher.valid_until) < now) {
    return invalid('Voucher sudah kedaluwarsa');
  }

  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    return invalid('Kuota voucher telah habis');
  }

  if (voucher.min_purchase && cartSubtotal < Number(voucher.min_purchase)) {
    return invalid(`Minimal belanja Rp ${Number(voucher.min_purchase).toLocaleString('id-ID')}`);
  }

  if (voucher.target_clerk_id && voucher.target_clerk_id !== options.clerkId) {
    return invalid('Voucher tidak tersedia untuk akun ini');
  }

  const targetRole = String(voucher.target_user_role || 'ALL').toUpperCase();
  if (targetRole === 'NEW_USER' && options.clerkId) {
    const existingOrder = await env.MEYYA_DB.prepare(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE clerk_id = ? AND status != 'CANCELLED'
    `).bind(options.clerkId).first();
    if (Number(existingOrder?.total || 0) > 0) {
      return invalid('Voucher hanya berlaku untuk belanja pertama');
    }
  }

  const birthdayWindow = Number(voucher.birthday_claim_window_days || 0);
  const isBirthdayVoucher = targetRole === 'BIRTHDAY' || String(voucher.target_segment || '').toUpperCase() === 'BIRTHDAY' || birthdayWindow > 0;
  if (isBirthdayVoucher) {
    if (!options.clerkId) return invalid('Login diperlukan untuk voucher birthday');
    if (!birthdayWindow || birthdayWindow < 1) return invalid('Aturan window klaim birthday belum diatur');

    const user = await env.MEYYA_DB.prepare('SELECT birth_date FROM users WHERE clerk_id = ?').bind(options.clerkId).first();
    if (!user?.birth_date) return invalid('Isi tanggal lahir di profil untuk memakai voucher birthday');

    const birthdayStatus = getBirthdayClaimStatus(user.birth_date, birthdayWindow, now);
    if (!birthdayStatus.valid) {
      return invalid(`Voucher birthday hanya bisa diklaim sampai ${birthdayWindow} hari setelah tanggal ulang tahun`);
    }
  }

  const applicableProductIds = parseApplicableProductIds(voucher.applicable_product_ids);
  let discountBase = cartSubtotal;
  if (applicableProductIds.length > 0) {
    const eligibleSubtotal = cartItems.reduce((sum, item) => {
      const productId = Number(item.product_id);
      if (!applicableProductIds.includes(productId)) return sum;
      return sum + Number(item.price || item.base_price || 0) * Number(item.quantity || 1);
    }, 0);

    if (eligibleSubtotal <= 0) {
      return invalid('Voucher hanya berlaku untuk produk tertentu');
    }
    discountBase = eligibleSubtotal;
  }

  let discountAmount = 0;
  if (voucher.discount_type === 'FIXED') {
    discountAmount = Number(voucher.discount_value || 0);
  } else if (voucher.discount_type === 'PERCENTAGE') {
    discountAmount = (Number(voucher.discount_value || 0) / 100) * discountBase;
    if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
      discountAmount = Number(voucher.max_discount);
    }
  } else if (voucher.discount_type === 'FREE_SHIPPING') {
    discountAmount = Math.min(shippingCost || Number(voucher.discount_value || 0), Number(voucher.discount_value || shippingCost || 0));
  }

  return {
    valid: true,
    error: '',
    discountAmount: Math.max(0, Math.min(discountAmount, discountBase || cartSubtotal)),
    discountBase,
    applicableProductIds,
  };
}

function invalid(message: string) {
  return { valid: false, error: message, discountAmount: 0, discountBase: 0, applicableProductIds: [] };
}

function getBirthdayClaimStatus(value: string, windowDays: number, now: Date) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { valid: false, daysSinceBirthday: null };

  const month = Number(match[2]);
  const day = Number(match[3]);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const birthday = getBirthdayUtc(now.getUTCFullYear(), month, day);
  const daysSinceBirthday = Math.floor((today - birthday) / 86400000);

  return {
    valid: daysSinceBirthday >= 0 && daysSinceBirthday <= windowDays,
    daysSinceBirthday,
  };
}

function getBirthdayUtc(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (month === 2 && day === 29 && date.getUTCMonth() !== 1) {
    return Date.UTC(year, 1, 28);
  }
  return Date.UTC(year, month - 1, day);
}
