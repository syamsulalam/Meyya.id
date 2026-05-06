import { ensureUsersSchema } from './_users';

const DEFAULT_COUPON_CAMPAIGNS = [
  {
    key: 'MEYYAWELCOME',
    title: 'Welcome Coupon',
    description: 'Kupon belanja pertama untuk customer baru yang sudah verifikasi WhatsApp.',
    enabled: 1,
    trigger_type: 'WELCOME',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_purchase: 200000,
    max_discount: 25000,
    expires_in_days: 14,
    usage_limit_per_user: 1,
    requires_verified_wa: 1,
    requires_entitlement: 1,
    metadata: '{}',
  },
  {
    key: 'BDAYGIFT',
    title: 'Birthday Gift',
    description: 'Kupon ulang tahun customer, 1x per tahun.',
    enabled: 1,
    trigger_type: 'BIRTHDAY',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_purchase: 250000,
    max_discount: 50000,
    expires_in_days: 7,
    usage_limit_per_user: 1,
    requires_verified_wa: 1,
    requires_entitlement: 1,
    birthday_claim_window_days: 7,
    metadata: '{}',
  },
  {
    key: 'MEYYABDAY',
    title: 'Meyya Birthday',
    description: 'Campaign ulang tahun Meyya. Admin mengatur tanggal dan window campaign.',
    enabled: 0,
    trigger_type: 'BRAND_BIRTHDAY',
    discount_type: 'PERCENTAGE',
    discount_value: 12,
    min_purchase: 250000,
    max_discount: 75000,
    expires_in_days: 10,
    usage_limit_per_user: 1,
    requires_verified_wa: 1,
    requires_entitlement: 1,
    metadata: JSON.stringify({ month: 1, day: 1, window_before_days: 3, window_after_days: 7 }),
  },
  {
    key: 'REVIEWSPIN',
    title: 'Review Spin',
    description: 'Kesempatan spin wheel setelah review valid dari order selesai.',
    enabled: 1,
    trigger_type: 'REVIEW_SPIN',
    discount_type: 'SPIN',
    discount_value: 0,
    min_purchase: 0,
    max_discount: null,
    expires_in_days: 14,
    usage_limit_per_user: 0,
    requires_verified_wa: 1,
    requires_entitlement: 1,
    metadata: '{}',
  },
];

const DEFAULT_WHEEL_PRIZES = [
  {
    key: 'SHIP5_NO_MIN',
    label: 'Diskon Ongkir Rp5.000',
    voucher_code: 'REVIEWONGKIR5',
    discount_type: 'FREE_SHIPPING',
    discount_value: 5000,
    min_purchase: 0,
    max_discount_formula: null,
    min_purchase_formula: null,
    weight_first_spin: 45,
    weight_repeat_spin: 30,
    expires_in_days: 7,
    enabled: 1,
    metadata: '{}',
  },
  {
    key: 'SMALL_FIXED',
    label: 'Diskon Rp10.000',
    voucher_code: 'REVIEW10K',
    discount_type: 'FIXED',
    discount_value: 10000,
    min_purchase: 200000,
    max_discount_formula: null,
    min_purchase_formula: null,
    weight_first_spin: 25,
    weight_repeat_spin: 18,
    expires_in_days: 14,
    enabled: 1,
    metadata: '{}',
  },
  {
    key: 'SHIP10_MIN',
    label: 'Diskon Ongkir Rp10.000',
    voucher_code: 'REVIEWONGKIR10',
    discount_type: 'FREE_SHIPPING',
    discount_value: 10000,
    min_purchase: 250000,
    max_discount_formula: null,
    min_purchase_formula: null,
    weight_first_spin: 20,
    weight_repeat_spin: 12,
    expires_in_days: 14,
    enabled: 1,
    metadata: '{}',
  },
  {
    key: 'REVIEW_MAX20_LAST_ORDER',
    label: 'Diskon 20% transaksi terakhir',
    voucher_code: 'REVIEW20',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    min_purchase: 0,
    max_discount_formula: 'LAST_ORDER_SUBTOTAL_20_PERCENT',
    min_purchase_formula: 'LAST_ORDER_SUBTOTAL',
    weight_first_spin: 2,
    weight_repeat_spin: 1,
    expires_in_days: 30,
    enabled: 1,
    metadata: '{}',
  },
  {
    key: 'FREE_PRODUCT_10_LAST_ORDER',
    label: 'Free product pool 10%',
    voucher_code: 'REVIEWFREE10',
    discount_type: 'FIXED',
    discount_value: 0,
    min_purchase: 0,
    max_discount_formula: 'LAST_ORDER_SUBTOTAL_10_PERCENT',
    min_purchase_formula: 'LAST_ORDER_SUBTOTAL',
    weight_first_spin: 0,
    weight_repeat_spin: 0,
    expires_in_days: 30,
    enabled: 0,
    metadata: JSON.stringify({ note: 'Disabled until free product auto-pick is implemented.' }),
  },
  {
    key: 'TRY_AGAIN',
    label: 'Coba Lagi',
    voucher_code: null,
    discount_type: 'NONE',
    discount_value: 0,
    min_purchase: 0,
    max_discount_formula: null,
    min_purchase_formula: null,
    weight_first_spin: 0,
    weight_repeat_spin: 35,
    expires_in_days: 0,
    enabled: 1,
    metadata: '{}',
  },
];

export async function ensureVoucherSchema(env: any) {
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS voucher_usages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_code TEXT,
      clerk_id TEXT,
      order_id TEXT,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      usage_type TEXT,
      claim_year INTEGER
    )
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS coupon_campaigns (
      key TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      trigger_type TEXT,
      discount_type TEXT,
      discount_value NUMERIC DEFAULT 0,
      min_purchase NUMERIC DEFAULT 0,
      max_discount NUMERIC,
      expires_in_days INTEGER DEFAULT 14,
      usage_limit_global INTEGER DEFAULT 0,
      usage_limit_per_user INTEGER DEFAULT 1,
      requires_verified_wa INTEGER DEFAULT 1,
      requires_entitlement INTEGER DEFAULT 1,
      birthday_claim_window_days INTEGER,
      metadata TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS coupon_entitlements (
      id TEXT PRIMARY KEY,
      campaign_key TEXT,
      voucher_code TEXT,
      clerk_id TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE',
      source_type TEXT,
      source_id TEXT,
      discount_type TEXT,
      discount_value NUMERIC,
      min_purchase NUMERIC,
      max_discount NUMERIC,
      valid_from DATETIME,
      valid_until DATETIME,
      metadata TEXT,
      used_order_id TEXT,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS wheel_prizes (
      key TEXT PRIMARY KEY,
      label TEXT,
      enabled INTEGER DEFAULT 1,
      voucher_code TEXT,
      discount_type TEXT,
      discount_value NUMERIC DEFAULT 0,
      min_purchase NUMERIC DEFAULT 0,
      max_discount_formula TEXT,
      min_purchase_formula TEXT,
      weight_first_spin INTEGER DEFAULT 0,
      weight_repeat_spin INTEGER DEFAULT 0,
      expires_in_days INTEGER DEFAULT 14,
      metadata TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS review_spin_entitlements (
      id TEXT PRIMARY KEY,
      review_id INTEGER UNIQUE,
      order_id TEXT,
      product_id INTEGER,
      clerk_id TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE',
      expires_at DATETIME,
      spun_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS wheel_spins (
      id TEXT PRIMARY KEY,
      spin_entitlement_id TEXT UNIQUE,
      clerk_id TEXT NOT NULL,
      review_id INTEGER,
      prize_key TEXT,
      coupon_entitlement_id TEXT,
      is_first_spin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await addColumn(env, 'vouchers', 'birthday_claim_window_days', 'INTEGER');
  await addColumn(env, 'vouchers', 'applicable_product_ids', 'TEXT');
  await addColumn(env, 'vouchers', 'requires_entitlement', 'INTEGER DEFAULT 0');
  await addColumn(env, 'vouchers', 'source_campaign_key', 'TEXT');
  await addColumn(env, 'voucher_usages', 'usage_type', 'TEXT');
  await addColumn(env, 'voucher_usages', 'claim_year', 'INTEGER');
  await addColumn(env, 'voucher_usages', 'coupon_entitlement_id', 'TEXT');
  await addColumn(env, 'coupon_campaigns', 'usage_limit_global', 'INTEGER DEFAULT 0');
  await addColumn(env, 'coupon_campaigns', 'usage_limit_per_user', 'INTEGER DEFAULT 1');
  await addColumn(env, 'coupon_campaigns', 'requires_verified_wa', 'INTEGER DEFAULT 1');
  await addColumn(env, 'coupon_campaigns', 'requires_entitlement', 'INTEGER DEFAULT 1');
  await addColumn(env, 'coupon_campaigns', 'birthday_claim_window_days', 'INTEGER');
  await addColumn(env, 'coupon_entitlements', 'used_order_id', 'TEXT');
  await addColumn(env, 'coupon_entitlements', 'used_at', 'DATETIME');
  await addColumn(env, 'review_spin_entitlements', 'product_id', 'INTEGER');
  await env.MEYYA_DB.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_usages_birthday_year
    ON voucher_usages(clerk_id, claim_year)
    WHERE usage_type = 'BIRTHDAY'
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_entitlements_unique_source
    ON coupon_entitlements(clerk_id, campaign_key, source_type, source_id)
    WHERE source_id IS NOT NULL
  `).run();
  await env.MEYYA_DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_coupon_entitlements_available
    ON coupon_entitlements(clerk_id, voucher_code, status, valid_until)
  `).run();

  await seedDefaultCouponSystem(env);
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

  if (!options.clerkId) {
    return invalid('Login diperlukan untuk memakai kupon/voucher');
  }

  const phoneStatus = await getWhatsappVerificationStatus(env, options.clerkId);
  if (!phoneStatus.verified) {
    return invalid('Verifikasi nomor WhatsApp diperlukan untuk memakai kupon/voucher');
  }

  let effectiveVoucher = { ...voucher };
  let entitlement: any = null;
  const requiresEntitlement = Number(voucher.requires_entitlement || 0) === 1;

  if (requiresEntitlement) {
    entitlement = await getAvailableCouponEntitlement(env, options.clerkId, voucher.code);
    if (!entitlement) return invalid('Kupon ini belum tersedia untuk akun Anda');

    const campaign = entitlement.campaign_key
      ? await env.MEYYA_DB.prepare('SELECT enabled FROM coupon_campaigns WHERE key = ?').bind(entitlement.campaign_key).first()
      : null;
    if (campaign && Number(campaign.enabled || 0) !== 1) {
      return invalid('Campaign kupon ini sedang nonaktif');
    }

    effectiveVoucher = {
      ...effectiveVoucher,
      discount_type: entitlement.discount_type || effectiveVoucher.discount_type,
      discount_value: entitlement.discount_value ?? effectiveVoucher.discount_value,
      min_purchase: entitlement.min_purchase ?? effectiveVoucher.min_purchase,
      max_discount: entitlement.max_discount ?? effectiveVoucher.max_discount,
      valid_from: entitlement.valid_from || effectiveVoucher.valid_from,
      valid_until: entitlement.valid_until || effectiveVoucher.valid_until,
    };
  }

  if (effectiveVoucher.valid_from && new Date(effectiveVoucher.valid_from) > now) {
    return invalid('Voucher belum aktif');
  }

  if (effectiveVoucher.valid_until && new Date(effectiveVoucher.valid_until) < now) {
    return invalid('Voucher sudah kedaluwarsa');
  }

  if (effectiveVoucher.usage_limit && effectiveVoucher.used_count >= effectiveVoucher.usage_limit) {
    return invalid('Kuota voucher telah habis');
  }

  if (effectiveVoucher.min_purchase && cartSubtotal < Number(effectiveVoucher.min_purchase)) {
    return invalid(`Minimal belanja Rp ${Number(effectiveVoucher.min_purchase).toLocaleString('id-ID')}`);
  }

  if (effectiveVoucher.target_clerk_id && effectiveVoucher.target_clerk_id !== options.clerkId) {
    return invalid('Voucher tidak tersedia untuk akun ini');
  }

  const targetRole = String(effectiveVoucher.target_user_role || 'ALL').toUpperCase();
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

  const birthdayWindow = Number(effectiveVoucher.birthday_claim_window_days || 0);
  const isBirthdayVoucher = targetRole === 'BIRTHDAY' || String(effectiveVoucher.target_segment || '').toUpperCase() === 'BIRTHDAY' || birthdayWindow > 0 || entitlement?.source_type === 'BIRTHDAY';
  if (isBirthdayVoucher) {
    if (!options.clerkId) return invalid('Login diperlukan untuk voucher birthday');
    if (!birthdayWindow || birthdayWindow < 1) return invalid('Aturan window klaim birthday belum diatur');

    const user = await env.MEYYA_DB.prepare('SELECT birth_date FROM users WHERE clerk_id = ?').bind(options.clerkId).first();
    if (!user?.birth_date) return invalid('Isi tanggal lahir di profil untuk memakai voucher birthday');

    const birthdayStatus = getBirthdayClaimStatus(user.birth_date, birthdayWindow, now);
    if (!birthdayStatus.valid) {
      return invalid(`Voucher birthday hanya bisa diklaim sampai ${birthdayWindow} hari setelah tanggal ulang tahun`);
    }

    const alreadyClaimed = await hasBirthdayVoucherClaimThisYear(env, options.clerkId, now);
    if (alreadyClaimed) {
      return invalid('Voucher birthday hanya bisa diklaim 1x per tahun');
    }
  }

  const applicableProductIds = parseApplicableProductIds(effectiveVoucher.applicable_product_ids);
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
  if (effectiveVoucher.discount_type === 'FIXED') {
    discountAmount = Number(effectiveVoucher.discount_value || 0);
  } else if (effectiveVoucher.discount_type === 'PERCENTAGE') {
    discountAmount = (Number(effectiveVoucher.discount_value || 0) / 100) * discountBase;
    if (effectiveVoucher.max_discount && discountAmount > Number(effectiveVoucher.max_discount)) {
      discountAmount = Number(effectiveVoucher.max_discount);
    }
  } else if (effectiveVoucher.discount_type === 'FREE_SHIPPING') {
    discountAmount = Math.min(shippingCost || Number(effectiveVoucher.discount_value || 0), Number(effectiveVoucher.discount_value || shippingCost || 0));
  }

  return {
    valid: true,
    error: '',
    discountAmount: Math.max(0, Math.min(discountAmount, discountBase || cartSubtotal)),
    discountBase,
    applicableProductIds,
    isBirthdayVoucher,
    birthdayClaimYear: isBirthdayVoucher ? getJakartaClaimYear(now) : null,
    entitlementId: entitlement?.id || null,
    entitlementSourceType: entitlement?.source_type || null,
  };
}

function invalid(message: string) {
  return { valid: false, error: message, discountAmount: 0, discountBase: 0, applicableProductIds: [], isBirthdayVoucher: false, birthdayClaimYear: null, entitlementId: null, entitlementSourceType: null };
}

export async function getWhatsappVerificationStatus(env: any, clerkId: string) {
  await ensureUsersSchema(env);
  const user = await env.MEYYA_DB.prepare('SELECT phone_wa, phone_wa_verified_at FROM users WHERE clerk_id = ?').bind(clerkId).first();
  return {
    phoneWa: user?.phone_wa || '',
    verified: Boolean(user?.phone_wa_verified_at),
    verifiedAt: user?.phone_wa_verified_at || null,
  };
}

export async function getAvailableCouponEntitlement(env: any, clerkId: string, voucherCode: string) {
  await ensureVoucherSchema(env);
  return env.MEYYA_DB.prepare(`
    SELECT *
    FROM coupon_entitlements
    WHERE clerk_id = ?
      AND voucher_code = ?
      AND status = 'AVAILABLE'
      AND (valid_from IS NULL OR datetime(valid_from) <= datetime('now'))
      AND (valid_until IS NULL OR datetime(valid_until) >= datetime('now'))
    ORDER BY valid_until IS NULL ASC, valid_until ASC, created_at ASC
    LIMIT 1
  `).bind(clerkId, String(voucherCode || '').toUpperCase()).first();
}

export async function issueCouponEntitlement(env: any, input: {
  campaignKey: string;
  voucherCode: string;
  clerkId: string;
  sourceType: string;
  sourceId?: string | number | null;
  discountType: string;
  discountValue: number;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  metadata?: any;
}) {
  await ensureVoucherSchema(env);
  const id = crypto.randomUUID();
  const sourceId = input.sourceId === undefined || input.sourceId === null ? null : String(input.sourceId);
  if (sourceId) {
    const existing = await env.MEYYA_DB.prepare(`
      SELECT *
      FROM coupon_entitlements
      WHERE clerk_id = ? AND campaign_key = ? AND source_type = ? AND source_id = ?
      LIMIT 1
    `).bind(input.clerkId, input.campaignKey, input.sourceType, sourceId).first();
    if (existing) return existing;
  }
  await env.MEYYA_DB.prepare(`
    INSERT INTO coupon_entitlements (
      id, campaign_key, voucher_code, clerk_id, status, source_type, source_id,
      discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, metadata
    )
    VALUES (?, ?, ?, ?, 'AVAILABLE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    input.campaignKey,
    input.voucherCode.toUpperCase(),
    input.clerkId,
    input.sourceType,
    sourceId,
    input.discountType,
    Number(input.discountValue || 0),
    input.minPurchase ?? 0,
    input.maxDiscount ?? null,
    input.validFrom || new Date().toISOString(),
    input.validUntil || null,
    JSON.stringify(input.metadata || {})
  ).run();

  return getAvailableCouponEntitlement(env, input.clerkId, input.voucherCode);
}

export async function ensureDefaultCouponEntitlementsForUser(env: any, clerkId: string) {
  await ensureVoucherSchema(env);
  await ensureUsersSchema(env);
  const user = await env.MEYYA_DB.prepare('SELECT birth_date, phone_wa_verified_at FROM users WHERE clerk_id = ?').bind(clerkId).first();
  if (!user?.phone_wa_verified_at) return;

  const campaignsRes = await env.MEYYA_DB.prepare('SELECT * FROM coupon_campaigns WHERE enabled = 1').all();
  const campaigns = campaignsRes.results || [];
  const now = new Date();

  for (const campaign of campaigns) {
    const key = String(campaign.key || '').toUpperCase();
    const triggerType = String(campaign.trigger_type || '').toUpperCase();
    if (!['WELCOME', 'BIRTHDAY', 'BRAND_BIRTHDAY'].includes(triggerType)) continue;

    if (triggerType === 'WELCOME') {
      const existingOrder = await env.MEYYA_DB.prepare(`
        SELECT id FROM orders
        WHERE clerk_id = ? AND status != 'CANCELLED'
        LIMIT 1
      `).bind(clerkId).first();
      if (existingOrder) continue;
      await issueCampaignEntitlement(env, campaign, clerkId, 'WELCOME', 'FIRST_ORDER');
      continue;
    }

    if (triggerType === 'BIRTHDAY') {
      const birthdayWindow = Number(campaign.birthday_claim_window_days || 0);
      if (!user?.birth_date || birthdayWindow < 1) continue;
      if (!getBirthdayClaimStatus(user.birth_date, birthdayWindow, now).valid) continue;
      if (await hasBirthdayVoucherClaimThisYear(env, clerkId, now)) continue;
      await issueCampaignEntitlement(env, campaign, clerkId, 'BIRTHDAY', String(getJakartaClaimYear(now)));
      continue;
    }

    if (triggerType === 'BRAND_BIRTHDAY') {
      const metadata = parseJson(campaign.metadata, {});
      if (!isBrandBirthdayWindow(metadata, now)) continue;
      await issueCampaignEntitlement(env, campaign, clerkId, 'BRAND_BIRTHDAY', String(getJakartaClaimYear(now)));
    }
  }
}

async function issueCampaignEntitlement(env: any, campaign: any, clerkId: string, sourceType: string, sourceId: string) {
  const now = new Date();
  const expiresInDays = Number(campaign.expires_in_days || 14);
  const validUntil = expiresInDays > 0 ? new Date(now.getTime() + expiresInDays * 86400000).toISOString() : null;
  await issueCouponEntitlement(env, {
    campaignKey: String(campaign.key || '').toUpperCase(),
    voucherCode: String(campaign.key || '').toUpperCase(),
    clerkId,
    sourceType,
    sourceId,
    discountType: campaign.discount_type,
    discountValue: Number(campaign.discount_value || 0),
    minPurchase: Number(campaign.min_purchase || 0),
    maxDiscount: campaign.max_discount === null || campaign.max_discount === undefined ? null : Number(campaign.max_discount),
    validFrom: now.toISOString(),
    validUntil,
    metadata: { generated_from_campaign: true },
  });
}

export async function hasBirthdayVoucherClaimThisYear(env: any, clerkId: string, now: Date = new Date()) {
  const claimYear = getJakartaClaimYear(now);
  const existingClaim = await env.MEYYA_DB.prepare(`
    SELECT vu.id
    FROM voucher_usages vu
    LEFT JOIN vouchers v ON v.code = vu.voucher_code
    WHERE vu.clerk_id = ?
      AND COALESCE(vu.claim_year, CAST(strftime('%Y', vu.used_at) AS INTEGER)) = ?
      AND (
        vu.usage_type = 'BIRTHDAY'
        OR UPPER(COALESCE(v.target_user_role, '')) = 'BIRTHDAY'
        OR UPPER(COALESCE(v.target_segment, '')) = 'BIRTHDAY'
        OR COALESCE(v.birthday_claim_window_days, 0) > 0
      )
    LIMIT 1
  `).bind(clerkId, claimYear).first();
  return Boolean(existingClaim);
}

export function getJakartaClaimYear(now: Date = new Date()) {
  return getJakartaDateParts(now).year;
}

export function getBirthdayClaimStatus(value: string, windowDays: number, now: Date = new Date()) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { valid: false, daysSinceBirthday: null };

  const month = Number(match[2]);
  const day = Number(match[3]);
  const jakartaToday = getJakartaDateParts(now);
  const today = Date.UTC(jakartaToday.year, jakartaToday.month - 1, jakartaToday.day);
  const birthday = getBirthdayUtc(jakartaToday.year, month, day);
  const daysSinceBirthday = Math.floor((today - birthday) / 86400000);

  return {
    valid: daysSinceBirthday >= 0 && daysSinceBirthday <= windowDays,
    daysSinceBirthday,
  };
}

function getJakartaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getBirthdayUtc(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (month === 2 && day === 29 && date.getUTCMonth() !== 1) {
    return Date.UTC(year, 1, 28);
  }
  return Date.UTC(year, month - 1, day);
}

async function seedDefaultCouponSystem(env: any) {
  for (const campaign of DEFAULT_COUPON_CAMPAIGNS) {
    await env.MEYYA_DB.prepare(`
      INSERT OR IGNORE INTO coupon_campaigns (
        key, title, description, enabled, trigger_type, discount_type, discount_value,
        min_purchase, max_discount, expires_in_days, usage_limit_per_user,
        requires_verified_wa, requires_entitlement, birthday_claim_window_days, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      campaign.key,
      campaign.title,
      campaign.description,
      campaign.enabled,
      campaign.trigger_type,
      campaign.discount_type,
      campaign.discount_value,
      campaign.min_purchase,
      campaign.max_discount,
      campaign.expires_in_days,
      campaign.usage_limit_per_user,
      campaign.requires_verified_wa,
      campaign.requires_entitlement,
      (campaign as any).birthday_claim_window_days || null,
      campaign.metadata
    ).run();

    if (campaign.discount_type !== 'SPIN') {
      await env.MEYYA_DB.prepare(`
        INSERT OR IGNORE INTO vouchers (
          code, discount_type, discount_value, min_purchase, max_discount, usage_limit,
          used_count, target_user_role, target_segment, birthday_claim_window_days,
          requires_entitlement, source_campaign_key
        )
        VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, 1, ?)
      `).bind(
        campaign.key,
        campaign.discount_type,
        campaign.discount_value,
        campaign.min_purchase,
        campaign.max_discount,
        campaign.trigger_type === 'WELCOME' ? 'NEW_USER' : campaign.trigger_type === 'BIRTHDAY' ? 'BIRTHDAY' : 'ALL',
        campaign.trigger_type,
        (campaign as any).birthday_claim_window_days || null,
        campaign.key
      ).run();
    }
  }

  for (const prize of DEFAULT_WHEEL_PRIZES) {
    await env.MEYYA_DB.prepare(`
      INSERT OR IGNORE INTO wheel_prizes (
        key, label, enabled, voucher_code, discount_type, discount_value, min_purchase,
        max_discount_formula, min_purchase_formula, weight_first_spin, weight_repeat_spin,
        expires_in_days, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      prize.key,
      prize.label,
      prize.enabled,
      prize.voucher_code,
      prize.discount_type,
      prize.discount_value,
      prize.min_purchase,
      prize.max_discount_formula,
      prize.min_purchase_formula,
      prize.weight_first_spin,
      prize.weight_repeat_spin,
      prize.expires_in_days,
      prize.metadata
    ).run();

    if (prize.voucher_code && prize.discount_type !== 'NONE') {
      await env.MEYYA_DB.prepare(`
        INSERT OR IGNORE INTO vouchers (
          code, discount_type, discount_value, min_purchase, max_discount, usage_limit,
          used_count, target_user_role, target_segment, requires_entitlement, source_campaign_key
        )
        VALUES (?, ?, ?, ?, NULL, 0, 0, 'ALL', 'REVIEW_SPIN', 1, 'REVIEWSPIN')
      `).bind(
        prize.voucher_code,
        prize.discount_type,
        prize.discount_value,
        prize.min_purchase
      ).run();
    }
  }
}

function parseJson(value: any, fallback: any) {
  try {
    return value ? JSON.parse(String(value)) : fallback;
  } catch {
    return fallback;
  }
}

function isBrandBirthdayWindow(metadata: any, now: Date) {
  const month = Number(metadata?.month || 0);
  const day = Number(metadata?.day || 0);
  if (!month || !day) return false;

  const before = Number(metadata?.window_before_days || 0);
  const after = Number(metadata?.window_after_days || 0);
  const jakarta = getJakartaDateParts(now);
  const today = Date.UTC(jakarta.year, jakarta.month - 1, jakarta.day);
  const birthday = Date.UTC(jakarta.year, month - 1, day);
  const diffDays = Math.floor((today - birthday) / 86400000);
  return diffDays >= -before && diffDays <= after;
}
