// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

export function middleware(request: NextRequest) {
  const traceId = request.headers.get('x-api-call-stack-id') || randomUUID();
  const response = NextResponse.next();
  response.headers.set('x-api-call-stack-id', traceId);
  return response;
}
