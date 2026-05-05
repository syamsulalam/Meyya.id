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
      const context = buildAnalyticsContext();
      const metadata = {
        ...(payload.metadata || {}),
        analytics: {
          ...context.analytics,
          ...(payload.metadata?.analytics || {}),
        },
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
          source: payload.source || context.source,
          medium: payload.medium || context.medium,
          campaign: payload.campaign || context.campaign,
          device_type: payload.device_type || context.device_type,
          page_path: payload.page_path || context.page_path,
          referrer: payload.referrer || context.referrer,
          session_id: payload.session_id || context.session_id,
          anonymous_id: payload.anonymous_id || context.anonymous_id,
          campaign_tag: payload.campaign_tag || context.campaign,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [authFetch, isLoaded, isSignedIn]);
}

function buildAnalyticsContext() {
  const attribution = readAttribution();
  const sessionId = getOrCreateSessionValue('meyya_session_id');
  const anonymousId = getOrCreateLocalValue('meyya_anonymous_id');
  const viewport = typeof window !== 'undefined'
    ? { width: window.innerWidth, height: window.innerHeight }
    : { width: 0, height: 0 };
  const deviceType = getDeviceType(viewport.width);
  const pagePath = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}`
    : '';

  return {
    source: attribution.source,
    medium: attribution.medium,
    campaign: attribution.campaign,
    device_type: deviceType,
    page_path: pagePath,
    referrer: attribution.referrer,
    session_id: sessionId,
    anonymous_id: anonymousId,
    analytics: {
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      term: attribution.term,
      content: attribution.content,
      click_id: attribution.clickId,
      referrer: attribution.referrer,
      page_path: pagePath,
      page_title: typeof document !== 'undefined' ? document.title : '',
      device_type: deviceType,
      viewport,
      language: typeof navigator !== 'undefined' ? navigator.language : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      session_id: sessionId,
      anonymous_id: anonymousId,
    },
  };
}

function readAttribution() {
  if (typeof window === 'undefined') {
    return { source: 'unknown', medium: 'unknown', campaign: '', term: '', content: '', clickId: '', referrer: '' };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || '';
  const utmMedium = params.get('utm_medium') || '';
  const utmCampaign = params.get('utm_campaign') || '';
  const clickId = params.get('gclid') || params.get('fbclid') || params.get('ttclid') || '';
  const referrer = document.referrer || '';

  if (utmSource || utmMedium || utmCampaign || clickId) {
    const attribution = {
      source: utmSource || inferSourceFromClickId(clickId) || 'campaign',
      medium: utmMedium || (clickId ? 'paid' : 'campaign'),
      campaign: utmCampaign,
      term: params.get('utm_term') || '',
      content: params.get('utm_content') || '',
      clickId,
      referrer,
    };
    sessionStorage.setItem('meyya_attribution', JSON.stringify(attribution));
    return attribution;
  }

  const stored = parseStoredAttribution();
  if (stored) return { ...stored, referrer: stored.referrer || referrer };

  const referrerHost = getHostname(referrer);
  const ownHost = window.location.hostname;
  if (referrerHost && referrerHost !== ownHost) {
    return { source: referrerHost, medium: 'referral', campaign: '', term: '', content: '', clickId: '', referrer };
  }

  return { source: referrerHost === ownHost ? 'internal' : 'direct', medium: referrerHost === ownHost ? 'internal' : 'none', campaign: '', term: '', content: '', clickId: '', referrer };
}

function parseStoredAttribution() {
  try {
    const stored = sessionStorage.getItem('meyya_attribution');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function inferSourceFromClickId(clickId: string) {
  if (!clickId) return '';
  if (clickId.startsWith('fb') || clickId.includes('fbclid')) return 'meta';
  if (clickId.includes('ttclid')) return 'tiktok';
  return 'google';
}

function getHostname(value: string) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

function getDeviceType(width: number) {
  if (width > 0 && width < 640) return 'mobile';
  if (width > 0 && width < 1024) return 'tablet';
  return 'desktop';
}

function getOrCreateSessionValue(key: string) {
  if (typeof window === 'undefined') return '';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const value = createId('ses');
  sessionStorage.setItem(key, value);
  return value;
}

function getOrCreateLocalValue(key: string) {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = createId('anon');
  localStorage.setItem(key, value);
  return value;
}

function createId(prefix: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
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
