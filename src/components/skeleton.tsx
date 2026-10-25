import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { radius as radii, useTheme } from '@/design';

type SkeletonBlockProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const SHIMMER_MS = 1400;

/**
 * A loading placeholder with a highlight band sweeping across it. Static under Reduce Motion.
 * Size it the same as the content it stands in for, so nothing jumps when the content arrives.
 */
export function SkeletonBlock({ width, height, radius = radii.tag, style }: SkeletonBlockProps) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const [blockWidth, setBlockWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.set(
      withRepeat(withTiming(1, { duration: SHIMMER_MS, easing: Easing.linear }), -1, false),
    );
  }, [progress, reduceMotion]);

  const bandWidth = blockWidth * 0.6;
  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -bandWidth + progress.get() * (blockWidth + bandWidth) }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setBlockWidth(event.nativeEvent.layout.width)}
      style={[
        styles.block,
        { width, height, borderRadius: radius, backgroundColor: palette.well },
        style,
      ]}>
      {!reduceMotion && blockWidth > 0 ? (
        <Animated.View style={[styles.band, { width: bandWidth }, bandStyle]}>
          <LinearGradient
            colors={['transparent', palette.shimmer, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
