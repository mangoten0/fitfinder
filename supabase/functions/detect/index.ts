/**
 * POST /functions/v1/detect
 * Body: { image: base64 JPEG (already resized by the app) }
 * Returns: { pieces: DetectedPieceDTO[] }
 *
 * Finds the clothing in a photo with Google Cloud Vision. The photo is sent straight to Vision
 * and never stored.
 */
import { z } from 'npm:zod@3';

import { piecesFromVision, type VisionObject } from '../_shared/garments.ts';
import { fetchWithTimeout, handler, HttpError, json, readJson } from '../_shared/http.ts';
import { consumeQuota } from '../_shared/quota.ts';
import { optionalEnv, requiredEnv, requireUser, serviceClient } from '../_shared/supabase.ts';
import type { DetectResponse } from '../_shared/types.ts';

const MAX_BODY_BYTES = 3_000_000;

const Body = z.object({
  image: z
    .string()
    .min(1_000)
    .max(MAX_BODY_BYTES)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'Image must be base64.'),
});

Deno.serve(
  handler(async (request) => {
    const user = await requireUser(request);

    const parsed = Body.safeParse(await readJson(request, MAX_BODY_BYTES));
    if (!parsed.success) throw new HttpError(400, 'bad_request', 'Send a photo to scan.');
    const { image } = parsed.data;
    // JPEG files start with FF D8 FF, which is "/9j/" in base64.
    if (!image.startsWith('/9j/')) throw new HttpError(400, 'bad_request', 'Send the photo as a JPEG.');

    await consumeQuota(serviceClient(), user.id, 'detect', {
      perMinute: 8,
      perDay: 80,
      globalPerDay: Number(optionalEnv('DETECT_GLOBAL_DAILY_LIMIT') ?? 2000),
    });

    const response = await fetchWithTimeout(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': requiredEnv('GOOGLE_VISION_API_KEY'),
        },
        body: JSON.stringify({
          requests: [{ image: { content: image }, features: [{ type: 'OBJECT_LOCALIZATION', maxResults: 20 }] }],
        }),
      },
      15_000,
    ).catch((error: unknown) => {
      console.error('Vision request did not complete:', error instanceof Error ? error.message : error);
      throw new HttpError(502, 'upstream_failed', "Couldn't scan this photo. Try again.");
    });

    const body = (await response.json().catch(() => null)) as {
      error?: { status?: string; message?: string };
      responses?: { localizedObjectAnnotations?: VisionObject[]; error?: { message?: string } }[];
    } | null;
    const first = body?.responses?.[0];
    if (!response.ok || !first || first.error) {
      // Google puts key, billing, and API-enabled problems in the top-level error. Logged for the
      // dashboard (Edge Functions > detect > Logs); the key itself is never logged.
      console.error(
        'Vision request failed:',
        response.status,
        body?.error?.status ?? '',
        body?.error?.message ?? first?.error?.message ?? 'no details',
      );
      throw new HttpError(502, 'upstream_failed', "Couldn't scan this photo. Try again.");
    }

    const result: DetectResponse = { pieces: piecesFromVision(first.localizedObjectAnnotations ?? []) };
    return json(result);
  }),
);
