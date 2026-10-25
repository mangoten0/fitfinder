/**
 * Shapes shared between the edge functions and the app. The app keeps a mirror of these in
 * src/lib/api-types.ts; change both together.
 */

export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'bag'
  | 'accessory';

export const GARMENT_CATEGORIES: readonly GarmentCategory[] = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'bag',
  'accessory',
];

/** A box inside a photo, as fractions of the photo's width and height (0 to 1). */
export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectedPieceDTO = {
  id: string;
  category: GarmentCategory;
  label: string;
  box: NormalizedBox;
  score: number;
};

export type DetectResponse = {
  pieces: DetectedPieceDTO[];
};

/** Whole cents, so prices never drift. */
export type MoneyDTO = {
  cents: number;
  currency: string;
};

export type MatchKind = 'exact' | 'dupe' | 'alternative';

export type Availability = 'in_stock' | 'sold_out' | 'unknown';

export type MatchDTO = {
  id: string;
  kind: MatchKind;
  title: string;
  retailer: string;
  price: MoneyDTO;
  /** How much cheaper than the exact item. Only set for dupes when the exact item was found. */
  savings: MoneyDTO | null;
  imageUrl: string | null;
  /** Store link, already converted to an affiliate link when affiliate is configured. */
  productUrl: string;
  availability: Availability;
};

export type SearchResponse = {
  results: MatchDTO[];
  /** The exact item's price, or the typical price of similar items when there's no exact match. */
  referencePrice: MoneyDTO | null;
};

export type ApiError = {
  error: {
    code:
      | 'bad_request'
      | 'unauthorized'
      | 'forbidden'
      | 'rate_limited'
      | 'upstream_failed'
      | 'not_configured'
      | 'internal';
    message: string;
  };
};
