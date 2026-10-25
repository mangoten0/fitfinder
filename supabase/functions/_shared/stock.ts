import type { Availability } from './types.ts';

/** What a product page check found. "gone" means the page no longer exists. */
export type PageCheck = Availability | 'gone';

const SOLD_OUT = /(OutOfStock|SoldOut|Discontinued)/i;
const IN_STOCK = /(InStock|LimitedAvailability|InStoreOnly|OnlineOnly|PreOrder|BackOrder)/i;

/**
 * Reads stock status from a product page. Most stores publish schema.org Product data
 * ("availability": "https://schema.org/InStock") or an Open Graph availability tag.
 */
export function availabilityFromHtml(html: string): Availability {
  const schemaValues = [...html.matchAll(/"availability"\s*:\s*"([^"]+)"/gi)].map((match) => match[1] ?? '');
  const itemprop = [...html.matchAll(/itemprop=["']availability["'][^>]*(?:href|content)=["']([^"']+)["']/gi)].map(
    (match) => match[1] ?? '',
  );
  const values = [...schemaValues, ...itemprop];

  if (values.some((value) => IN_STOCK.test(value))) return 'in_stock';
  if (values.some((value) => SOLD_OUT.test(value))) return 'sold_out';

  const og = /<meta[^>]+property=["'](?:product|og):availability["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
  if (og) {
    const lower = og.toLowerCase();
    if (lower.includes('out of stock') || lower.includes('oos') || lower.includes('discontinued')) return 'sold_out';
    if (lower.includes('in stock') || lower.includes('instock') || lower.includes('preorder')) return 'in_stock';
  }
  return 'unknown';
}

/**
 * Fetches a product page and reports whether it's in stock. Anything unclear (blocked by the
 * store, slow, unusual page) comes back "unknown" so a real listing is never hidden by mistake.
 */
export async function checkProductPage(
  url: string,
  fetcher: typeof fetch = fetch,
  timeoutMs = 2500,
): Promise<PageCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        accept: 'text/html',
      },
    });
    if (response.status === 404 || response.status === 410) return 'gone';
    if (!response.ok) return 'unknown';
    const html = (await response.text()).slice(0, 600_000);
    return availabilityFromHtml(html);
  } catch {
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}
