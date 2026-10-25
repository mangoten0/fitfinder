import { isLikelyCounterfeit } from './counterfeit.ts';
import type { LensItem } from './lens.ts';
import { median } from './money.ts';
import type { Availability, MatchKind, MoneyDTO } from './types.ts';

export type Candidate = {
  id: string;
  kind: MatchKind;
  item: LensItem & { price: MoneyDTO };
  savings: MoneyDTO | null;
  availability: Availability;
};

export type Classified = {
  candidates: Candidate[];
  referencePrice: MoneyDTO | null;
};

type Options = {
  currency?: string;
  /** A dupe costs at most this share of the reference price... */
  dupeRatio?: number;
  /** ...and at least this many cents less. */
  minSavingsCents?: number;
  maxDupes?: number;
  maxAlternatives?: number;
};

/** Short stable id from a URL (FNV-1a), so the same listing keeps the same id. */
export function stableId(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** The same product page with different tracking parameters counts as one listing. */
export function canonicalLink(link: string): string {
  try {
    const url = new URL(link);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return link.toLowerCase();
  }
}

function sameListing(a: LensItem, b: LensItem): boolean {
  return (
    canonicalLink(a.link) === canonicalLink(b.link) ||
    (a.source.toLowerCase() === b.source.toLowerCase() && a.title.toLowerCase() === b.title.toLowerCase())
  );
}

function availabilityOf(item: LensItem): Availability {
  if (item.inStock === true) return 'in_stock';
  if (item.inStock === false) return 'sold_out';
  return 'unknown';
}

type Priced = LensItem & { price: MoneyDTO };

function usable(items: LensItem[], currency: string): Priced[] {
  const kept: Priced[] = [];
  for (const item of items) {
    if (!item.price || item.price.currency !== currency) continue;
    const priced = item as Priced;
    if (
      isLikelyCounterfeit({
        title: item.title,
        source: item.source,
        link: item.link,
        priceCents: item.price.cents,
      })
    ) {
      continue;
    }
    if (kept.some((existing) => sameListing(existing, priced))) continue;
    kept.push(priced);
  }
  return kept;
}

/**
 * Sorts Lens results into what the app shows:
 * - exact: the first exact match with a price (can be sold out; the app says so)
 * - dupe: similar items that cost clearly less than the exact item, cheapest first
 * - alternative: similar items at a similar price, in Lens's relevance order
 * Counterfeits, other currencies, unpriced listings, and duplicates are dropped.
 */
export function classify(
  exactMatches: LensItem[],
  products: LensItem[],
  {
    currency = 'USD',
    dupeRatio = 0.8,
    minSavingsCents = 500,
    maxDupes = 12,
    maxAlternatives = 8,
  }: Options = {},
): Classified {
  const exact = usable(exactMatches, currency)[0] ?? null;
  const similar = usable(products, currency).filter((item) => !exact || !sameListing(item, exact));

  const typical = median(similar.map((item) => item.price.cents));
  const referenceCents = exact?.price.cents ?? typical;
  const referencePrice = referenceCents === null ? null : { cents: referenceCents, currency };

  const dupes: Candidate[] = [];
  const alternatives: Candidate[] = [];

  for (const item of similar) {
    const isDupe =
      referenceCents !== null &&
      item.price.cents <= referenceCents * dupeRatio &&
      referenceCents - item.price.cents >= minSavingsCents;

    if (isDupe) {
      dupes.push({
        id: stableId(canonicalLink(item.link)),
        kind: 'dupe',
        item,
        // Only claim savings against a real item, not against a typical price.
        savings: exact ? { cents: referenceCents - item.price.cents, currency } : null,
        availability: availabilityOf(item),
      });
    } else {
      alternatives.push({
        id: stableId(canonicalLink(item.link)),
        kind: 'alternative',
        item,
        savings: null,
        availability: availabilityOf(item),
      });
    }
  }

  dupes.sort((a, b) => a.item.price.cents - b.item.price.cents);

  const candidates: Candidate[] = [];
  if (exact) {
    candidates.push({
      id: stableId(canonicalLink(exact.link)),
      kind: 'exact',
      item: exact,
      savings: null,
      availability: availabilityOf(exact),
    });
  }
  candidates.push(...dupes.slice(0, maxDupes), ...alternatives.slice(0, maxAlternatives));

  return { candidates, referencePrice };
}
