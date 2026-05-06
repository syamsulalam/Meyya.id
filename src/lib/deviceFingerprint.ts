const STORAGE_KEY = 'meyya:device:fingerprint:v1';

export async function getDeviceFingerprintHash() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const entropy = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    getCanvasSignal(),
  ].join('|');

  const hash = await sha256(entropy);
  localStorage.setItem(STORAGE_KEY, hash);
  return hash;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getCanvasSignal() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '16px Arial';
    ctx.fillStyle = '#111827';
    ctx.fillText('meyya.id coupon guard', 2, 2);
    return canvas.toDataURL().slice(-80);
  } catch {
    return '';
  }
}
