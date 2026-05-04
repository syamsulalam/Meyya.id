import { useCallback } from 'react';
import { useAuth } from '@clerk/react';
import { useAuthFetch } from './useAuthFetch';

export function useTrackEvent() {
  const authFetch = useAuthFetch();
  const { isLoaded, isSignedIn } = useAuth();

  return useCallback(async (eventType: string, payload: Record<string, any> = {}) => {
    if (!isLoaded || !isSignedIn) return;
    try {
      await authFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          ...payload,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [authFetch, isLoaded, isSignedIn]);
}
