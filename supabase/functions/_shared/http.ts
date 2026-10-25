import type { ApiError } from './types.ts';

/** Thrown inside handlers; turned into a JSON error response with the right status. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: ApiError['error']['code'];

  constructor(status: number, code: ApiError['error']['code'], message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Needed only for the web build during development. Requests still need a signed-in user's
 * token, so allowing any origin doesn't open anything up.
 */
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    const body: ApiError = { error: { code: error.code, message: error.message } };
    return json(body, error.status);
  }
  // Never leak internals (keys, stack traces) to the client.
  console.error('Unhandled error', error);
  const body: ApiError = { error: { code: 'internal', message: 'Something went wrong. Try again.' } };
  return json(body, 500);
}

/** Reads a JSON body, refusing anything larger than `maxBytes`. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > maxBytes) throw new HttpError(413, 'bad_request', 'That photo is too large.');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'bad_request', 'That photo is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'bad_request', 'The request was not valid JSON.');
  }
}

/** Wraps a handler with CORS preflight, POST-only, and uniform error handling. */
export function handler(run: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (request.method !== 'POST') return json({ error: { code: 'bad_request', message: 'Use POST.' } }, 405);
    try {
      return await run(request);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** fetch with a hard timeout, so one slow provider can't hang a request. */
export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
