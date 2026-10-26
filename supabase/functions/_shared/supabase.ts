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
 * Reads the "default" key from one of the new-style key variables, which hold a JSON object
 * keyed by name (`{"default": "sb_secret_..."}`). Returns undefined if it's missing or malformed.
 */
function namedKey(variable: string): string | undefined {
  const raw = Deno.env.get(variable);
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const value = (parsed as Record<string, unknown>).default;
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Newer projects use publishable/secret keys and may have the legacy anon/service_role keys
 * turned off, so prefer the new keys and fall back to the legacy ones for older projects.
 */
function projectKey(kind: 'public' | 'secret'): string {
  const key =
    kind === 'secret'
      ? namedKey('SUPABASE_SECRET_KEYS') ?? optionalEnv('SUPABASE_SERVICE_ROLE_KEY')
      : namedKey('SUPABASE_PUBLISHABLE_KEYS') ?? optionalEnv('SUPABASE_ANON_KEY');
  if (!key) {
    throw new HttpError(503, 'not_configured', `Server is missing its Supabase ${kind} key.`);
  }
  return key;
}

/**
 * Full-access client for server-only work: quotas, signed URLs, deleting uploads.
 * Never exposed to the app.
 */
export function serviceClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), projectKey('secret'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * The signed-in user making the request. The app signs in anonymously on first launch, so every
 * request carries a user token even before she makes an account.
 *
 * The functions are deployed with the platform JWT check off (it only understands legacy keys),
 * so this is the check: Supabase Auth confirms the token is real, unexpired, and not revoked.
 */
export async function requireUser(request: Request): Promise<User> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
  // A bare API key isn't a user. User tokens are JWTs: three dot-separated parts.
  if (token.split('.').length !== 3) {
    throw new HttpError(401, 'unauthorized', 'Sign-in required.');
  }

  const client = createClient(env('SUPABASE_URL'), projectKey('public'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    // Logged for the dashboard (Edge Functions > Logs). Never logs the token.
    console.error('requireUser rejected a token:', error?.status ?? '', error?.message ?? 'no user');
    throw new HttpError(401, 'unauthorized', 'Sign-in required.');
  }
  return data.user;
}
