import { useAuth } from '@clerk/react';
import { useCallback } from 'react';

export function useAuthFetch() {
  const { getToken } = useAuth();

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    return response;
  }, [getToken]);

  return authFetch;
}

export function useAuthFetcher() {
  const { getToken } = useAuth();

  const fetcher = useCallback(async (url: string) => {
    const token = await getToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('An error occurred while fetching the data.');
    }
    return response.json();
  }, [getToken]);

  return fetcher;
}
