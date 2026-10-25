import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { animate, useTheme } from '@/design';

type StickerProps = {
  /**
   * Draws the piece. Called with a color to draw a solid silhouette (for the outline and shadow
   * layers), or with null to draw the piece normally. Works for icons now and for photo cutouts
   * later (an expo-image `tintColor` gives the silhouette).
   */
  render: (silhouette: string | null) => ReactNode;
  /** Resting tilt in degrees. Lifted pieces straighten out. */
  rotation?: number;
  lifted?: boolean;
  /** White border width around the shape. */
  outline?: number;
};

const OUTLINE_SAMPLES = 16;
const SHADOW_SAMPLES = 8;
const STICKER_WHITE = '#FFFFFF';

function ring(count: number, distance: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
}

/**
 * A die-cut collage piece: white border traced around its real shape, a hard printed shadow,
 * and a slight tilt. Lifting it straightens it, scales it up, and pulls the shadow away.
 */
export function Sticker({ render, rotation = 0, lifted = false, outline = 5 }: StickerProps) {
  const { palette, scheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(lifted ? 1 : 0);

  useEffect(() => {
    lift.set(animate(lifted ? 1 : 0, 'lift', reduceMotion));
  }, [lift, lifted, reduceMotion]);

  const outlineOffsets = useMemo(() => ring(OUTLINE_SAMPLES, outline), [outline]);
  const shadowOffsets = useMemo(() => ring(SHADOW_SAMPLES, outline), [outline]);
  const shadowColor = `rgb(${palette.shadowRGB})`;
  const shadowOpacity = scheme === 'dark' ? 0.45 : 0.16;

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation * (1 - lift.get())}deg` },
      { scale: reduceMotion ? 1 : 1 + 0.08 * lift.get() },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity * (1 - 0.25 * lift.get()),
    transform: [{ translateX: 1 + 3 * lift.get() }, { translateY: 3 + 9 * lift.get() }],
  }));

  return (
    <Animated.View style={bodyStyle}>
      <Animated.View needsOffscreenAlphaCompositing style={[StyleSheet.absoluteFill, shadowStyle]}>
        {shadowOffsets.map(({ x, y }, index) => (
          <View
            key={`shadow-${index}`}
            style={[styles.layer, { transform: [{ translateX: x }, { translateY: y }] }]}>
            {render(shadowColor)}
          </View>
        ))}
      </Animated.View>
      {outlineOffsets.map(({ x, y }, index) => (
        <View
          key={`outline-${index}`}
          style={[styles.layer, { transform: [{ translateX: x }, { translateY: y }] }]}>
          {render(STICKER_WHITE)}
        </View>
      ))}
      <View>{render(null)}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
