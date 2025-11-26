import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Bucket = 'ai' | 'billing';

let redis: ReturnType<typeof Redis.fromEnv> | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = Redis.fromEnv();
}

const aiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'ratelimit:ai',
    })
  : null;

const billingLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      prefix: 'ratelimit:billing',
    })
  : null;

export async function rateLimit(
  request: NextRequest,
  bucket: Bucket
): Promise<{
  allowed: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}> {
  if (!redis) {
    // Rate limiting not configured; always allow
    return { allowed: true };
  }

  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const identifier = `${bucket}:${ip}`;
  const limiter = bucket === 'ai' ? aiLimiter : billingLimiter;

  if (!limiter) {
    return { allowed: true };
  }

  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}