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

/** Calls an edge function and turns any failure into a BackendError with a readable message. */
export async function callFunction<T>(name: 'detect' | 'search', body: object): Promise<T> {
  await ensureUserId();
  const { data, error } = await getSupabase().functions.invoke<T>(name, { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await (error.context as Response).json().catch(() => null)) as {
        error?: { code?: ApiErrorCode; message?: string };
      } | null;
      throw new BackendError(
        payload?.error?.code ?? 'internal',
        payload?.error?.message ?? 'Something went wrong. Try again.',
      );
    }
    if (error instanceof FunctionsFetchError) throw new BackendError('network', OFFLINE_MESSAGE);
    throw new BackendError('internal', 'Something went wrong. Try again.');
  }
  if (data === null) throw new BackendError('internal', 'Something went wrong. Try again.');
  return data;
}

/** Turns any thrown value into a message for the screen. */
export function messageFor(error: unknown): string {
  if (error instanceof BackendError) return error.message;
  return 'Something went wrong. Try again.';
}
