import { randomUUID } from 'expo-crypto';

import type { DetectedPiece, SourcePhoto } from '@/features/split/detection';
import type { MatchDTO, SearchResponse } from '@/lib/api-types';
import { BackendError, callFunctionOnce, ensureUserId, withFreshSessionRetry } from '@/lib/backend';
import { bytesFromBase64, cropPiece } from '@/lib/images';
import { getSupabase, isBackendConfigured } from '@/lib/supabase';
import { money, type Money } from '@/models/money';
import type { MatchResult } from '@/models/product';
import { previewResults } from '@/preview/preview-data';

export type PieceSearchResult = {
  results: MatchResult[];
  referencePrice: Money | null;
  /** True when these are sample results because the backend isn't set up yet. */
  isSample: boolean;
};

type PieceToSearch = Pick<DetectedPiece, 'category' | 'box'>;

function toMatchResult(dto: MatchDTO, category: DetectedPiece['category']): MatchResult {
  return {
    kind: dto.kind,
    savings: dto.savings ? money(dto.savings.cents, dto.savings.currency) : null,
    availability: dto.availability,
    product: {
      id: dto.id,
      title: dto.title,
      retailer: dto.retailer,
      category,
      price: money(dto.price.cents, dto.price.currency),
      imageUrl: dto.imageUrl,
      productUrl: dto.productUrl,
    },
  };
}

/**
 * Searches stores for one piece: crops it on the phone, uploads the crop to a private folder,
 * and asks the `search` edge function for matches. The server deletes the crop when it's done.
 */
export async function searchPiece(photo: SourcePhoto, piece: PieceToSearch): Promise<PieceSearchResult> {
  if (!isBackendConfigured) {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    return { results: previewResults, referencePrice: money(4800), isSample: true };
  }

  const crop = await cropPiece(photo.uri, photo.width, photo.height, piece.box);
  const response = await withFreshSessionRetry(async () => {
    const userId = await ensureUserId();
    const path = `${userId}/${randomUUID()}.jpg`;
    const upload = await getSupabase()
      .storage.from('uploads')
      .upload(path, bytesFromBase64(crop.base64), { contentType: 'image/jpeg', upsert: false });
    if (upload.error) {
      throw new BackendError('network', "Couldn't upload the photo. Check your internet and try again.");
    }
    return callFunctionOnce<SearchResponse>('search', { path, category: piece.category });
  });

  return {
    results: response.results.map((dto) => toMatchResult(dto, piece.category)),
    referencePrice: response.referencePrice
      ? money(response.referencePrice.cents, response.referencePrice.currency)
      : null,
    isSample: false,
  };
}
