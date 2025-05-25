// lib/fetchWithTrace.ts
export async function fetchWithTrace(
  url: string,
  options: RequestInit = {},
  traceId?: string
) {
  const headers = new Headers(options.headers || {});
  if (traceId) {
    headers.set('x-api-call-stack-id', traceId);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
