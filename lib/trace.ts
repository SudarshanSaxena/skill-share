// lib/trace.ts
import { randomUUID } from 'crypto';

export function getTraceId(req: any) {
  return req.headers['x-api-call-stack-id'] || randomUUID();
}
