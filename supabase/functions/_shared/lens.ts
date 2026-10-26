import { parsePrice } from './money.ts';
import type { MoneyDTO } from './types.ts';

/** One listing from Google Lens results, cleaned up. */
export type LensItem = {
  title: string;
  link: string;
  source: string;
  imageUrl: string | null;
  price: MoneyDTO | null;
  /** true / false when the result says so, null when it doesn't. */
  inStock: boolean | null;
  /** Google marked this visual match as the same item as the photo. */
  flaggedExact: boolean;
};

/**
 * The two Lens searches each piece runs. `products` was discontinued by Google, so similar items
 * come from `visual_matches`, whose shopping listings carry a price.
 */
export type LensType = 'exact_matches' | 'visual_matches';

/** The array each Lens result type comes back under. */
const RESULT_KEYS: Record<LensType, string> = {
  exact_matches: 'exact_matches',
  visual_matches: 'visual_matches',
};

function asHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/** How many listings a response holds, before cleaning. For logs. */
export function rawCount(response: unknown, type: LensType): number {
  if (!response || typeof response !== 'object') return 0;
  const raw = (response as Record<string, unknown>)[RESULT_KEYS[type]];
  return Array.isArray(raw) ? raw.length : 0;
}

/**
 * Pulls the listing array out of a SerpApi Google Lens response and cleans each item.
 * Exact matches give price as "$48.00" plus `extracted_price`; visual matches give an object
 * like { value: "$48*", extracted_value: 48, currency: "$" }. parsePrice reads both.
 */
export function lensItemsFrom(response: unknown, type: LensType): LensItem[] {
  if (!response || typeof response !== 'object') return [];
  const raw = (response as Record<string, unknown>)[RESULT_KEYS[type]];
  if (!Array.isArray(raw)) return [];

  const items: LensItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const title = asText(item.title);
    const link = asHttpsUrl(item.link);
    if (!title || !link) continue;

    let source = asText(item.source);
    if (!source) {
      try {
        source = new URL(link).hostname.replace(/^www\./, '');
      } catch {
        source = '';
      }
    }

    const inStock =
      item.in_stock === true ? true : item.out_of_stock === true || item.in_stock === false ? false : null;

    items.push({
      title,
      link,
      source,
      imageUrl: asHttpsUrl(item.image) ?? asHttpsUrl(item.thumbnail),
      price: parsePrice(item.price, item.extracted_price),
      inStock,
      flaggedExact: type === 'visual_matches' && item.exact_matches === true,
    });
  }
  return items;
}

/** Builds the SerpApi request URL. The API key goes in the query string, server-side only. */
export function lensRequestUrl(type: LensType, imageUrl: string, apiKey: string): string {
  const params = new URLSearchParams({
    engine: 'google_lens',
    type,
    url: imageUrl,
    country: 'us',
    hl: 'en',
    api_key: apiKey,
  });
  return `https://serpapi.com/search.json?${params.toString()}`;
}
