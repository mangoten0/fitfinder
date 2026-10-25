import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { radius as radii } from '@/design';
import type { NormalizedBox } from '@/features/split/geometry';

type PhotoCropProps = {
  uri: string;
  /** The part of the photo to show, as fractions of the photo. */
  box: NormalizedBox;
  /** Size to draw the crop at. Keep the box's real proportions or the photo stretches. */
  width: number;
  height: number;
  radius?: number;
};

/** Shows one region of a photo, scaled to the given size. Used for a piece once it's been picked. */
export function PhotoCrop({ uri, box, width, height, radius = radii.control }: PhotoCropProps) {
  const fullWidth = width / box.width;
  const fullHeight = height / box.height;

  return (
    <View style={[styles.crop, { width, height, borderRadius: radius }]}>
      <Image
        source={uri}
        contentFit="fill"
        accessible={false}
        style={{
          position: 'absolute',
          width: fullWidth,
          height: fullHeight,
          left: -box.x * fullWidth,
          top: -box.y * fullHeight,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  crop: {
    overflow: 'hidden',
  },
});
