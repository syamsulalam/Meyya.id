type CartValidationLine = {
  lineIndex: number;
  productId: number;
  variantId?: number;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  reason: string;
  message: string;
};

type NormalizedCartItem = {
  lineIndex: number;
  product_id: number;
  variant_id?: number;
  product_name: string;
  quantity: number;
};

export async function validateCartStock(env: any, inputItems: any[]) {
  const items = Array.isArray(inputItems) ? inputItems : [];
  const unavailableItems: CartValidationLine[] = [];
  const issueKeys = new Set<string>();
  const normalizedItems: NormalizedCartItem[] = [];

  const addIssue = (
    item: Partial<NormalizedCartItem>,
    reason: string,
    availableStock = 0,
    requestedQuantity = Number(item.quantity || 0)
  ) => {
    const lineIndex = Number(item.lineIndex ?? -1);
    const key = `${lineIndex}:${reason}`;
    if (issueKeys.has(key)) return;
    issueKeys.add(key);
    const productName = item.product_name || 'Produk';
    unavailableItems.push({
      lineIndex,
      productId: Number(item.product_id || 0),
      variantId: item.variant_id,
      productName,
      requestedQuantity,
      availableStock,
      reason,
      message: buildStockMessage(productName, reason, availableStock, requestedQuantity),
    });
  };

  items.forEach((item: any, index: number) => {
    const productId = Number(item?.product_id);
    const variantId = item?.variant_id === undefined || item?.variant_id === null || item?.variant_id === ''
      ? undefined
      : Number(item.variant_id);
    const quantity = Number(item?.quantity);
    const productName = String(item?.product_name || item?.name || 'Produk').trim() || 'Produk';

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || (variantId !== undefined && (!Number.isInteger(variantId) || variantId <= 0))) {
      addIssue({ lineIndex: index, product_id: productId, variant_id: variantId, product_name: productName, quantity }, 'INVALID_ITEM');
      return;
    }

    normalizedItems.push({
      lineIndex: index,
      product_id: productId,
      variant_id: variantId,
      product_name: productName,
      quantity,
    });
  });

  if (normalizedItems.length === 0) {
    return { valid: unavailableItems.length === 0, unavailableItems };
  }

  const productIds = Array.from(new Set(normalizedItems.map((item) => item.product_id)));
  const productPlaceholders = productIds.map(() => '?').join(',');
  const productsRes = await env.MEYYA_DB.prepare(`
    SELECT id, name, is_active, is_preorder, stock, deleted_at
    FROM products
    WHERE id IN (${productPlaceholders})
  `).bind(...productIds).all();
  const productMap = new Map<number, any>((productsRes.results || []).map((product: any) => [Number(product.id), product]));
  const productRequestedQuantity = new Map<number, number>();

  for (const item of normalizedItems) {
    const product = productMap.get(item.product_id);
    if (!product) {
      addIssue(item, 'PRODUCT_UNAVAILABLE');
      continue;
    }
    if (Number(product.is_active) !== 1 || product.deleted_at) {
      addIssue(item, 'PRODUCT_UNAVAILABLE');
      continue;
    }
    productRequestedQuantity.set(item.product_id, (productRequestedQuantity.get(item.product_id) || 0) + item.quantity);
  }

  for (const [productId, requestedQuantity] of productRequestedQuantity.entries()) {
    const product = productMap.get(productId);
    if (!product || Number(product.is_preorder) === 1) continue;
    const availableStock = Number(product.stock || 0);
    if (availableStock < requestedQuantity) {
      const reason = availableStock <= 0 ? 'PRODUCT_OUT_OF_STOCK' : 'PRODUCT_STOCK_LOW';
      normalizedItems
        .filter((item) => item.product_id === productId)
        .forEach((item) => addIssue(item, reason, availableStock, requestedQuantity));
    }
  }

  const variantIds = Array.from(new Set(normalizedItems.map((item) => item.variant_id).filter(Boolean))) as number[];
  if (variantIds.length > 0) {
    const variantPlaceholders = variantIds.map(() => '?').join(',');
    const variantsRes = await env.MEYYA_DB.prepare(`
      SELECT id, product_id, stock, is_active
      FROM product_variants
      WHERE id IN (${variantPlaceholders})
    `).bind(...variantIds).all();
    const variantMap = new Map<string, any>((variantsRes.results || []).map((variant: any) => [`${Number(variant.product_id)}:${Number(variant.id)}`, variant]));
    const variantRequestedQuantity = new Map<string, number>();

    for (const item of normalizedItems) {
      if (!item.variant_id) continue;
      const product = productMap.get(item.product_id);
      const key = `${item.product_id}:${item.variant_id}`;
      const variant = variantMap.get(key);

      if (!product || Number(product.is_active) !== 1 || product.deleted_at) continue;
      if (!variant || Number(variant.is_active) !== 1) {
        addIssue(item, 'VARIANT_UNAVAILABLE');
        continue;
      }
      variantRequestedQuantity.set(key, (variantRequestedQuantity.get(key) || 0) + item.quantity);
    }

    for (const [key, requestedQuantity] of variantRequestedQuantity.entries()) {
      const [productIdText, variantIdText] = key.split(':');
      const productId = Number(productIdText);
      const variantId = Number(variantIdText);
      const product = productMap.get(productId);
      const variant = variantMap.get(key);
      if (!product || !variant || Number(product.is_preorder) === 1) continue;
      const availableStock = Number(variant.stock || 0);
      if (availableStock < requestedQuantity) {
        const reason = availableStock <= 0 ? 'VARIANT_OUT_OF_STOCK' : 'VARIANT_STOCK_LOW';
        normalizedItems
          .filter((item) => item.product_id === productId && item.variant_id === variantId)
          .forEach((item) => addIssue(item, reason, availableStock, requestedQuantity));
      }
    }
  }

  return { valid: unavailableItems.length === 0, unavailableItems };
}

function buildStockMessage(productName: string, reason: string, availableStock: number, requestedQuantity: number) {
  if (reason === 'INVALID_ITEM') return 'Item keranjang tidak valid.';
  if (reason === 'PRODUCT_UNAVAILABLE') return `${productName} sudah tidak tersedia.`;
  if (reason === 'VARIANT_UNAVAILABLE') return `Varian ${productName} sudah tidak tersedia.`;
  if (reason === 'PRODUCT_OUT_OF_STOCK') return `${productName} sedang habis.`;
  if (reason === 'VARIANT_OUT_OF_STOCK') return `Varian ${productName} sedang habis.`;
  if (reason === 'PRODUCT_STOCK_LOW') return `Stok ${productName} tersisa ${availableStock} pcs, sedangkan keranjang meminta ${requestedQuantity} pcs.`;
  if (reason === 'VARIANT_STOCK_LOW') return `Stok varian ${productName} tersisa ${availableStock} pcs, sedangkan keranjang meminta ${requestedQuantity} pcs.`;
  return `${productName} tidak bisa di-checkout saat ini.`;
}
