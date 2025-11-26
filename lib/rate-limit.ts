import { SupabaseClient } from '@supabase/supabase-js';

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

/**
 * Simple per-user, per-endpoint rate limiter backed by Supabase.
 * Not perfect under extreme concurrency, but good enough to guard against abuse.
 *
 * @param supabase Supabase client instance
 * @param userId Authenticated user's ID
 * @param endpoint Logical endpoint key (e.g. "ai:generate")
 * @param limit Max number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs).toISOString();

  // Look up existing counter for this user/endpoint/window
  const { data: existing } = await supabase
    .from('api_rate_limits')
    .select('id, count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('window_start', windowStart)
    .maybeSingle();

  let currentCount = existing?.count ?? 0;

  if (currentCount >= limit) {
    const resetAt = new Date(windowStartMs + windowMs).toISOString();
    return {
      ok: false,
      remaining: 0,
      limit,
      resetAt,
    };
  }

  const newCount = currentCount + 1;

  if (existing?.id) {
    await supabase
      .from('api_rate_limits')
      .update({ count: newCount })
      .eq('id', existing.id);
  } else {
    await supabase.from('api_rate_limits').insert({
      user_id: userId,
      endpoint,
      window_start: windowStart,
      count: 1,
    });
  }

  const resetAt = new Date(windowStartMs + windowMs).toISOString();

  return {
    ok: true,
    remaining: Math.max(0, limit - newCount),
    limit,
    resetAt,
  };
}