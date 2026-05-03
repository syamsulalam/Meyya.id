import { useAuth } from '@clerk/react';
import { useCallback } from 'react';

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
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch {
        // Keep the status-based fallback.
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }, [getToken, isLoaded, isSignedIn]);

  return fetcher;
}
