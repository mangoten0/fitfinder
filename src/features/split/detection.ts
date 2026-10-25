import { callFunction } from '@/lib/backend';
import type { DetectResponse } from '@/lib/api-types';
import { prepareForDetection } from '@/lib/images';
import { isBackendConfigured } from '@/lib/supabase';
import type { GarmentCategory } from '@/models/product';

import type { NormalizedBox } from './geometry';

/** A photo the user captured, picked, or shared. */
export type SourcePhoto = {
  uri: string;
  width: number;
  height: number;
};

/** One garment found in the photo. */
export type DetectedPiece = {
  id: string;
  category: GarmentCategory;
  /** What the UI calls it, e.g. "Top", "Shoes". */
  label: string;
  box: NormalizedBox;
};

/**
 * Finds the garments in a photo. `remoteDetector` is the real one (Google Vision via the
 * `detect` edge function); `mockDetector` stands in until the backend keys are set.
 */
export type PieceDetector = {
  detect: (photo: SourcePhoto) => Promise<DetectedPiece[]>;
};

const MOCK_DELAY_MS = 1400;

/**
 * Stand-in detector. Returns fixed boxes that roughly match a full-body outfit photo
 * (top in the upper third, bottoms in the middle, shoes at the bottom, bag at the side).
 */
export const mockDetector: PieceDetector = {
  detect: async () => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return [
      { id: 'top', category: 'top', label: 'Top', box: { x: 0.24, y: 0.15, width: 0.52, height: 0.27 } },
      { id: 'bottom', category: 'bottom', label: 'Bottoms', box: { x: 0.26, y: 0.42, width: 0.48, height: 0.36 } },
      { id: 'shoes', category: 'shoes', label: 'Shoes', box: { x: 0.28, y: 0.82, width: 0.44, height: 0.15 } },
      { id: 'bag', category: 'bag', label: 'Bag', box: { x: 0.64, y: 0.38, width: 0.28, height: 0.2 } },
    ];
  },
};

/** Real detection: resize on the phone, send to the `detect` edge function. */
export const remoteDetector: PieceDetector = {
  detect: async (photo) => {
    const prepared = await prepareForDetection(photo.uri, photo.width, photo.height);
    const response = await callFunction<DetectResponse>('detect', { image: prepared.base64 });
    return response.pieces.map(({ id, category, label, box }) => ({ id, category, label, box }));
  },
};

/** The detector the app uses: real once Supabase is configured, the stand-in before that. */
export const detector: PieceDetector = isBackendConfigured ? remoteDetector : mockDetector;
