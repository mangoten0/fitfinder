import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { HttpError } from './http.ts';

export type QuotaLimits = {
  perMinute: number;
  perDay: number;
  /** Across all users, per day. Caps spend even if someone scripts lots of anonymous accounts. */
  globalPerDay: number;
};

/**
 * Counts this request against per-user and global limits. Every paid API call (Vision, Lens)
 * goes through here first, so no one can run up the bill.
 */
export async function consumeQuota(
  service: SupabaseClient,
  userId: string,
  action: 'detect' | 'search',
  limits: QuotaLimits,
  now = new Date(),
): Promise<void> {
  const day = now.toISOString().slice(0, 10);
  const minute = now.toISOString().slice(0, 16);

  const checks = await Promise.all([
    service.rpc('consume_quota', { p_user: userId, p_bucket: `${action}:m:${minute}`, p_limit: limits.perMinute }),
    service.rpc('consume_quota', { p_user: userId, p_bucket: `${action}:d:${day}`, p_limit: limits.perDay }),
    service.rpc('consume_global_quota', { p_bucket: `${action}:d:${day}`, p_limit: limits.globalPerDay }),
  ]);

  for (const { data, error } of checks) {
    if (error) throw new HttpError(500, 'internal', 'Could not check usage limits.');
    if (data !== true) {
      throw new HttpError(429, 'rate_limited', 'Too many searches for now. Try again a little later.');
    }
  }
}
