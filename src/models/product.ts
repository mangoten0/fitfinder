import type { Money } from './money';

export type GarmentCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'bag' | 'accessory';

/** A purchasable item from a retailer's catalog. */
export type Product = {
  id: string;
  title: string;
  retailer: string;
  category: GarmentCategory;
  price: Money;
  imageUrl: string | null;
  productUrl: string;
};

/**
 * How a result relates to the piece she searched for.
 * - exact: the item itself
 * - dupe: a cheaper item with the same look
 * - alternative: the closest in-stock match when the original is sold out
 */
export type MatchKind = 'exact' | 'dupe' | 'alternative';

/** One search result: a product plus how it matches. */
export type MatchResult = {
  product: Product;
  kind: MatchKind;
  /** How much cheaper than the exact item, when it is cheaper. */
  savings: Money | null;
};

export const matchKindTitle: Record<MatchKind, string> = {
  exact: 'Exact',
  dupe: 'Dupe',
  alternative: 'Alternative',
};

export const matchKindSpoken: Record<MatchKind, string> = {
  exact: 'Exact match',
  dupe: 'Dupe',
  alternative: 'In-stock alternative',
};
