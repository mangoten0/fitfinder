/**
 * POST /functions/v1/search
 * Body: { path: "<user id>/<uuid>.jpg" (a cropped piece the app uploaded), category }
 * Returns: { results: MatchDTO[], referencePrice }
 *
 * Finds where to buy a piece: the exact item, cheaper dupes, and in-stock alternatives.
 * The uploaded crop is deleted as soon as the search finishes, success or not.
 */
import { z } from 'npm:zod@3';

import { affiliateConfigFrom, affiliateUrl } from '../_shared/affiliate.ts';
import { classify, type Candidate } from '../_shared/classify.ts';
import { fetchWithTimeout, handler, HttpError, json, readJson } from '../_shared/http.ts';
import { lensItemsFrom, lensRequestUrl, type LensType } from '../_shared/lens.ts';
import { consumeQuota } from '../_shared/quota.ts';
import { checkProductPage, type PageCheck } from '../_shared/stock.ts';
import { optionalEnv, requiredEnv, requireUser, serviceClient } from '../_shared/supabase.ts';
import { GARMENT_CATEGORIES, type MatchDTO, type SearchResponse } from '../_shared/types.ts';

const BUCKET = 'uploads';
const STOCK_CHECKS = 10;

const Body = z.object({
  path: z.string().max(200),
  category: z.enum(GARMENT_CATEGORIES as [string, ...string[]]),
});

const NO_RESULTS = /hasn't returned any results|no results/i;

async function lens(type: LensType, imageUrl: string, apiKey: string): Promise<unknown> {
  const response = await fetchWithTimeout(lensRequestUrl(type, imageUrl, apiKey), { method: 'GET' }, 25_000);
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  if (body && typeof body.error === 'string' && NO_RESULTS.test(body.error)) return {};
  if (!response.ok || !body || body.error) {
    console.error('Lens request failed', type, response.status, body?.error);
    throw new Error('lens_failed');
  }
  return body;
}

Deno.serve(
  handler(async (request) => {
    const user = await requireUser(request);

    const parsed = Body.safeParse(await readJson(request, 10_000));
    if (!parsed.success) throw new HttpError(400, 'bad_request', 'Pick a piece to search.');
    const { path } = parsed.data;

    // Users can only search photos in their own folder.
    const ownPath = new RegExp(`^${user.id}/[0-9a-f-]{36}\\.jpg$`);
    if (!ownPath.test(path)) throw new HttpError(403, 'forbidden', 'That photo belongs to someone else.');

    const service = serviceClient();
    try {
      await consumeQuota(service, user.id, 'search', {
        perMinute: 6,
        perDay: 40,
        globalPerDay: Number(optionalEnv('SEARCH_GLOBAL_DAILY_LIMIT') ?? 300),
      });

      const apiKey = requiredEnv('SERPAPI_KEY');
      // Short-lived link so Google Lens can fetch the crop. Expires in 5 minutes.
      const signed = await service.storage.from(BUCKET).createSignedUrl(path, 300);
      if (signed.error || !signed.data?.signedUrl) {
        throw new HttpError(404, 'bad_request', "That photo isn't available anymore. Pick the piece again.");
      }
      const imageUrl = signed.data.signedUrl;

      const [exactResult, productResult] = await Promise.allSettled([
        lens('exact_matches', imageUrl, apiKey),
        lens('products', imageUrl, apiKey),
      ]);
      if (exactResult.status === 'rejected' && productResult.status === 'rejected') {
        throw new HttpError(502, 'upstream_failed', "Couldn't reach the stores. Try again.");
      }

      const exact = exactResult.status === 'fulfilled' ? lensItemsFrom(exactResult.value, 'exact_matches') : [];
      const products = productResult.status === 'fulfilled' ? lensItemsFrom(productResult.value, 'products') : [];
      const { candidates, referencePrice } = classify(exact, products);

      // Check the top listings' pages: drop dead links, mark sold-out items.
      const checks: PageCheck[] = await Promise.all(
        candidates.map((candidate, index) =>
          index < STOCK_CHECKS && candidate.availability === 'unknown'
            ? checkProductPage(candidate.item.link)
            : Promise.resolve<PageCheck>(candidate.availability),
        ),
      );

      const affiliate = affiliateConfigFrom(optionalEnv('AFFILIATE_PROVIDER'), optionalEnv('AFFILIATE_ID'));
      const results: MatchDTO[] = [];
      candidates.forEach((candidate: Candidate, index) => {
        const check = checks[index] ?? 'unknown';
        if (check === 'gone') return;
        // A sold-out exact item still shows (marked sold out); sold-out dupes and alternatives don't.
        if (check === 'sold_out' && candidate.kind !== 'exact') return;
        results.push({
          id: candidate.id,
          kind: candidate.kind,
          title: candidate.item.title,
          retailer: candidate.item.source,
          price: candidate.item.price,
          savings: candidate.savings,
          imageUrl: candidate.item.imageUrl,
          productUrl: affiliateUrl(candidate.item.link, affiliate),
          availability: check,
        });
      });

      const response: SearchResponse = { results, referencePrice };
      return json(response);
    } finally {
      const removed = await service.storage.from(BUCKET).remove([path]);
      if (removed.error) console.error('Could not delete upload', removed.error.message);
    }
  }),
);
