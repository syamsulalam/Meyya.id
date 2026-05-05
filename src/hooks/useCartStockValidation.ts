import { useMemo } from 'react';
import useSWR from 'swr';

type CartItem = {
  product_id: number;
  variant_id?: number;
  product_name: string;
  quantity: number;
};

export type CartStockIssue = {
  lineIndex: number;
  productId: number;
  variantId?: number;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  reason: string;
  message: string;
};

export type CartStockValidation = {
  valid: boolean;
  unavailableItems: CartStockIssue[];
};

const EMPTY_VALIDATION: CartStockValidation = { valid: true, unavailableItems: [] };

export async function validateCartStock(items: CartItem[]): Promise<CartStockValidation> {
  if (!items.length) return EMPTY_VALIDATION;

  const response = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        quantity: item.quantity,
      })),
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Gagal memeriksa stok keranjang.');
  }

  return {
    valid: Boolean(data?.valid),
    unavailableItems: Array.isArray(data?.unavailableItems) ? data.unavailableItems : [],
  };
}

export function useCartStockValidation(items: CartItem[]) {
  const cartSignature = useMemo(
    () => JSON.stringify(items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
    }))),
    [items]
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<CartStockValidation>(
    items.length > 0 ? ['cart-stock-validation', cartSignature] : null,
    () => validateCartStock(items),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const validation = data || EMPTY_VALIDATION;
  const issueLineIndexes = useMemo(
    () => new Set(validation.unavailableItems.map((item) => item.lineIndex)),
    [validation.unavailableItems]
  );

  return {
    validation,
    issueLineIndexes,
    hasStockIssue: validation.unavailableItems.length > 0,
    isCheckingStock: isLoading || isValidating,
    stockCheckError: error as Error | undefined,
    refreshStockValidation: async () => {
      if (!items.length) return EMPTY_VALIDATION;
      return mutate(validateCartStock(items), { revalidate: false });
    },
  };
}
