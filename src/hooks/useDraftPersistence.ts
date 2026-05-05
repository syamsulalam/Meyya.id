import { useCallback, useEffect, useMemo, useRef } from 'react';

type DraftOptions = {
  enabled?: boolean;
};

export function useDraftPersistence<T>(
  key: string,
  value: T,
  onRestore: (value: T) => void,
  options: DraftOptions = {}
) {
  const enabled = options.enabled !== false && Boolean(key);
  const restoredRef = useRef(false);
  const serializedValue = useMemo(() => {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }, [value]);

  useEffect(() => {
    restoredRef.current = false;
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) onRestore(JSON.parse(raw));
    } catch {
      localStorage.removeItem(key);
    } finally {
      restoredRef.current = true;
    }
  }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !restoredRef.current || !serializedValue) return;
    localStorage.setItem(key, serializedValue);
  }, [enabled, key, serializedValue]);

  return useCallback(() => {
    if (!key) return;
    localStorage.removeItem(key);
  }, [key]);
}
