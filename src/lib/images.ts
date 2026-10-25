import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { NormalizedBox } from '@/features/split/geometry';

export type PreparedImage = {
  base64: string;
  width: number;
  height: number;
};

/** Shrinks so the long side is at most `maxSide`. Never upscales. */
function resizeTarget(width: number, height: number, maxSide: number) {
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}

/**
 * The full photo, resized for detection. Smaller uploads are faster and cheaper, and 1280px is
 * plenty to find the pieces.
 */
export async function prepareForDetection(uri: string, width: number, height: number): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);
  const target = resizeTarget(width, height, 1280);
  if (target) context.resize(target);
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!saved.base64) throw new Error('Image encoding failed.');
  return { base64: saved.base64, width: saved.width, height: saved.height };
}

/** One piece cut out of the original photo, ready to search. */
export async function cropPiece(
  uri: string,
  photoWidth: number,
  photoHeight: number,
  box: NormalizedBox,
): Promise<PreparedImage> {
  const originX = Math.max(0, Math.floor(box.x * photoWidth));
  const originY = Math.max(0, Math.floor(box.y * photoHeight));
  const cropWidth = Math.max(1, Math.min(photoWidth - originX, Math.round(box.width * photoWidth)));
  const cropHeight = Math.max(1, Math.min(photoHeight - originY, Math.round(box.height * photoHeight)));

  const context = ImageManipulator.manipulate(uri).crop({
    originX,
    originY,
    width: cropWidth,
    height: cropHeight,
  });
  const target = resizeTarget(cropWidth, cropHeight, 900);
  if (target) context.resize(target);
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new Error('Image encoding failed.');
  return { base64: saved.base64, width: saved.width, height: saved.height };
}

/** Base64 to raw bytes for uploading. */
export function bytesFromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
