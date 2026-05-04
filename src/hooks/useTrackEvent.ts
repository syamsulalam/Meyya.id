import { useCallback } from 'react';
import { useAuth } from '@clerk/react';
import { useAuthFetch } from './useAuthFetch';
import { useStore } from '../store';

export function useTrackEvent() {
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();

  return useCallback(async (eventType: string, payload: Record<string, any> = {}) => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const normalizedEventType = eventType.toUpperCase();
      const metadata = {
        ...(payload.metadata || {}),
        ...(normalizedEventType === 'CART_UPDATED' && !payload.metadata?.cart_snapshot
          ? { cart_snapshot: buildCartSnapshot() }
          : {}),
      };
      await authFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: normalizedEventType,
          ...payload,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [authFetch, isLoaded, isSignedIn]);
}

function buildCartSnapshot() {
  const cart = useStore.getState().cart;
  const items = cart.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.price,
    color: item.color,
    size: item.size,
  }));
  return {
    item_count: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    subtotal: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    product_ids: Array.from(new Set(items.map((item) => item.product_id))),
    items,
  };
}
