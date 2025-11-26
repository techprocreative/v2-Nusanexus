import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Basic rate limiting for expensive API routes
  if (pathname.startsWith('/api/ai')) {
    const { allowed, limit, remaining, reset } = await rateLimit(request, 'ai');
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...(limit !== undefined ? { 'X-RateLimit-Limit': String(limit) } : {}),
            ...(remaining !== undefined
              ? { 'X-RateLimit-Remaining': String(remaining) }
              : {}),
            ...(reset !== undefined ? { 'X-RateLimit-Reset': String(reset) } : {}),
          },
        }
      );
    }
  } else if (pathname.startsWith('/api/billing')) {
    const { allowed, limit, remaining, reset } = await rateLimit(request, 'billing');
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many billing requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...(limit !== undefined ? { 'X-RateLimit-Limit': String(limit) } : {}),
            ...(remaining !== undefined
              ? { 'X-RateLimit-Remaining': String(remaining) }
              : {}),
            ...(reset !== undefined ? { 'X-RateLimit-Reset': String(reset) } : {}),
          },
        }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
