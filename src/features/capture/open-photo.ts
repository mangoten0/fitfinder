import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import type { SourcePhoto } from '@/features/split/detection';

/** Sends a photo to the split screen. Every way into the app (camera, picker, share) ends here. */
export function openSplit(photo: SourcePhoto) {
  router.push({
    pathname: '/split',
    params: { uri: photo.uri, width: String(photo.width), height: String(photo.height) },
  });
}

/**
 * Opens the system photo picker. On iOS 14+ and modern Android this needs no permission prompt,
 * because the user only ever shares the one photo they pick.
 */
export async function pickPhoto(): Promise<SourcePhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return { uri: asset.uri, width: asset.width, height: asset.height };
}
