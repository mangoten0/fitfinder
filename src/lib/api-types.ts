/**
 * Mirror of supabase/functions/_shared/types.ts: what the edge functions send back.
 * Change both files together.
 */
import type { GarmentCategory } from '@/models/product';

export type NormalizedBoxDTO = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectedPieceDTO = {
  id: string;
  category: GarmentCategory;
  label: string;
  box: NormalizedBoxDTO;
  score: number;
};

export type DetectResponse = {
  pieces: DetectedPieceDTO[];
};

export type MoneyDTO = {
  cents: number;
  currency: string;
};

export type MatchDTO = {
  id: string;
  kind: 'exact' | 'dupe' | 'alternative';
  title: string;
  retailer: string;
  price: MoneyDTO;
  savings: MoneyDTO | null;
  imageUrl: string | null;
  productUrl: string;
  availability: 'in_stock' | 'sold_out' | 'unknown';
};

export type SearchResponse = {
  results: MatchDTO[];
  referencePrice: MoneyDTO | null;
};

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'upstream_failed'
  | 'not_configured'
  | 'internal'
  | 'network';
