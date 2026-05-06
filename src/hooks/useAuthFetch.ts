import { useAuth } from '@clerk/react';
import { useCallback } from 'react';
import { getDeviceFingerprintHash } from '../lib/deviceFingerprint';

export function useAuthFetch() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!isLoaded) {
      throw new Error('Authentication is still loading.');
    }

    if (!isSignedIn) {
      throw new Error('Authentication required.');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Authentication token is not available.');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Meyya-Device-Fingerprint', await getDeviceFingerprintHash());
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    return response;
  }, [getToken, isLoaded, isSignedIn]);

  return authFetch;
}

export function useAuthFetcher() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetcher = useCallback(async (url: string) => {
    if (!isLoaded) {
      throw new Error('Authentication is still loading.');
    }

    if (!isSignedIn) {
      throw new Error('Authentication required.');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Authentication token is not available.');
    }

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Meyya-Device-Fingerprint', await getDeviceFingerprintHash());
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorBody: any;
      try {
        errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch {
        // Keep the status-based fallback.
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).info = errorBody;
      throw error;
    }
    return response.json();
  }, [getToken, isLoaded, isSignedIn]);

  return fetcher;
}
