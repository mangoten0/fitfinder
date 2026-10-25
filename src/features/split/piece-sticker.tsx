import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';

import { Sticker } from '@/components/sticker';
import { animate, radius, STAGGER_MS } from '@/design';

import type { NormalizedBox, Rect } from './geometry';

/**
 * hidden: not shown yet (still scanning).
 * cut: outlined in place on the photo, as if just cut out.
 * tray: flown down into the tray, ready to tap.
 */
export type PieceStage = 'hidden' | 'cut' | 'tray';

type PieceStickerProps = {
  uri: string;
  box: NormalizedBox;
  /** Where the piece sits on the photo. */
  from: Rect;
  /** Where it lands in the tray. */
  to: Rect;
  /** Resting tilt in the tray, in degrees. */
  tilt: number;
  stage: PieceStage;
  /** Position in the landing sequence. */
  order: number;
  selected: boolean;
  label: string;
  onPress: () => void;
};

const CUT_STAGGER_MS = 70;

function lerp(start: number, end: number, t: number) {
  'worklet';
  return start + (end - start) * t;
}

/**
 * One piece of the outfit. It appears outlined on the photo, then flies down into the tray as a
 * die-cut sticker. With Reduce Motion on it fades into the tray instead of flying.
 */
export function PieceSticker({
  uri,
  box,
  from,
  to,
  tilt,
  stage,
  order,
  selected,
  label,
  onPress,
}: PieceStickerProps) {
  const reduceMotion = useReducedMotion();
  const appear = useSharedValue(0);
  const travel = useSharedValue(0);

  useEffect(() => {
    if (stage === 'hidden') {
      appear.set(0);
      travel.set(0);
    } else if (stage === 'cut') {
      travel.set(0);
      appear.set(withDelay(order * CUT_STAGGER_MS, animate(1, 'lift', reduceMotion)));
    } else if (reduceMotion) {
      // No flight: jump to the tray and fade in there.
      travel.set(1);
      appear.set(0);
      appear.set(withDelay(order * 80, animate(1, 'smooth', true)));
    } else {
      appear.set(1);
      travel.set(withDelay(order * STAGGER_MS, animate(1, 'land', false)));
    }
  }, [stage, order, reduceMotion, appear, travel]);

  const positionStyle = useAnimatedStyle(() => {
    const t = travel.get();
    const a = appear.get();
    return {
      left: lerp(from.x, to.x, t),
      top: lerp(from.y, to.y, t),
      opacity: Math.min(1, a),
      transform: [{ rotate: `${tilt * Math.min(1, t)}deg` }, { scale: 1 + 0.05 * a * (1 - Math.min(1, t)) }],
    };
  });

  const sizeStyle = useAnimatedStyle(() => {
    const t = travel.get();
    return { width: lerp(from.width, to.width, t), height: lerp(from.height, to.height, t) };
  });

  const imageStyle = useAnimatedStyle(() => {
    const t = travel.get();
    const fullWidth = lerp(from.width, to.width, t) / box.width;
    const fullHeight = lerp(from.height, to.height, t) / box.height;
    return {
      width: fullWidth,
      height: fullHeight,
      left: -box.x * fullWidth,
      top: -box.y * fullHeight,
    };
  });

  return (
    <Animated.View style={[styles.position, { zIndex: selected ? 2 : 1 }, positionStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled: stage !== 'tray' }}
        disabled={stage !== 'tray'}
        onPress={onPress}>
        <Sticker
          lifted={selected}
          outline={4}
          render={(silhouette) =>
            silhouette ? (
              <View style={[styles.silhouette, { backgroundColor: silhouette }]} />
            ) : (
              <Animated.View style={[styles.crop, sizeStyle]}>
                <Animated.View style={[styles.image, imageStyle]}>
                  <Image source={uri} contentFit="fill" accessible={false} style={styles.fill} />
                </Animated.View>
              </Animated.View>
            )
          }
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
  },
  crop: {
    overflow: 'hidden',
    borderRadius: radius.control,
  },
  image: {
    position: 'absolute',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  silhouette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.control,
  },
});
