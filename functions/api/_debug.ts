export function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function debugErrorResponse(error: any, status: number, context: Record<string, any> = {}) {
  const payload = {
    error: error?.message || String(error),
    debug: {
      ...redact(context),
      error: serializeError(error),
      timestamp: new Date().toISOString(),
    }
  };

  console.error('API debug error', payload);
  return jsonResponse(payload, status);
}

export function serializeError(error: any) {
  return redact({
    name: error?.name,
    message: error?.message || String(error),
    stack: error?.stack,
    cause: error?.cause ? serializeError(error.cause) : undefined,
  });
}

function redact(value: any): any {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? redactString(value) : value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (/secret|token|authorization|password|key/i.test(key)) {
        return [key, '[redacted]'];
      }
      return [key, redact(nestedValue)];
    })
  );
}

function redactString(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .replace(/sk_[A-Za-z0-9_-]+/g, 'sk_[redacted]')
    .replace(/pk_[A-Za-z0-9_-]+/g, 'pk_[redacted]');
}
