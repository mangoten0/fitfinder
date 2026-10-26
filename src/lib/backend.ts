import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import type { ApiErrorCode } from './api-types';
import { getSupabase } from './supabase';

/** An error that's safe to show: the message is written for the person using the app. */
export class BackendError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const OFFLINE_MESSAGE = "Couldn't connect. Check your internet and try again.";
const GENERIC_MESSAGE = 'Something went wrong. Try again.';

/**
 * Makes sure there's a signed-in user. On first launch she's signed in anonymously, so searches
 * work right away and rate limits still apply per person. A real account comes later, at checkout.
 */
export async function ensureUserId(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.user) throw new BackendError('network', OFFLINE_MESSAGE);
  return signedIn.user.id;
}

/** Calls an edge function once and turns any failure into a BackendError with a readable message. */
async function invokeOnce<T>(name: 'detect' | 'search', body: object): Promise<T> {
  await ensureUserId();
  const { data, error } = await getSupabase().functions.invoke<T>(name, { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await (error.context as Response).json().catch(() => null)) as {
        error?: { code?: ApiErrorCode; message?: string };
      } | null;
      throw new BackendError(payload?.error?.code ?? 'internal', payload?.error?.message ?? GENERIC_MESSAGE);
    }
    if (error instanceof FunctionsFetchError) throw new BackendError('network', OFFLINE_MESSAGE);
    throw new BackendError('internal', GENERIC_MESSAGE);
  }
  if (data === null) throw new BackendError('internal', GENERIC_MESSAGE);
  return data;
}

/**
 * Runs `work`, and if the server rejected the saved session (expired or removed), starts a fresh
 * anonymous session and runs it once more, so she never sees a sign-in error. `work` must redo
 * everything tied to the user, like uploads into her folder, since the user id changes.
 */
export async function withFreshSessionRetry<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!(error instanceof BackendError) || error.code !== 'unauthorized') throw error;
    await getSupabase().auth.signOut({ scope: 'local' });
    try {
      return await work();
    } catch (retryError) {
      if (retryError instanceof BackendError && retryError.code === 'unauthorized') {
        throw new BackendError('unauthorized', OFFLINE_MESSAGE);
      }
      throw retryError;
    }
  }
}

/** Calls an edge function, retrying once with a fresh session if the saved one was rejected. */
export function callFunction<T>(name: 'detect' | 'search', body: object): Promise<T> {
  return withFreshSessionRetry(() => invokeOnce<T>(name, body));
}

/** Calls an edge function once, with no session retry. For work that wraps its own retry. */
export function callFunctionOnce<T>(name: 'detect' | 'search', body: object): Promise<T> {
  return invokeOnce<T>(name, body);
}

/** Turns any thrown value into a message for the screen. */
export function messageFor(error: unknown): string {
  if (error instanceof BackendError) return error.message;
  return GENERIC_MESSAGE;
}
