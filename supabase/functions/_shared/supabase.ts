import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

import { HttpError } from './http.ts';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(503, 'not_configured', `Server is missing ${name}.`);
  return value;
}

/** Optional secret: returns undefined instead of failing. */
export function optionalEnv(name: string): string | undefined {
  return Deno.env.get(name) || undefined;
}

/** Required secret. Fails the request with a clear "not configured" error if it's missing. */
export function requiredEnv(name: string): string {
  return env(name);
}

/**
 * Full-access client for server-only work: quotas, signed URLs, deleting uploads.
 * Never exposed to the app.
 */
export function serviceClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * The signed-in user making the request. The app signs in anonymously on first launch, so every
 * request carries a user token even before she makes an account.
 */
export async function requireUser(request: Request): Promise<User> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError(401, 'unauthorized', 'Sign-in required.');
  }
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(authorization.slice('Bearer '.length));
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Sign-in required.');
  return data.user;
}
