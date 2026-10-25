import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { animate, elevation, haptic, radius, space, Text, useTheme } from '@/design';
import { formatMoney, money } from '@/models/money';

type PriceCapSliderProps = {
  /** Max price in whole dollars, or null for no cap. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  currency?: string;
};

const THUMB = 28;

/**
 * The only filter on the results screen. Snaps to steps with a haptic tick on each one.
 * The far right stop means no cap ("Any price").
 */
export function PriceCapSlider({
  value,
  onChange,
  min = 20,
  max = 300,
  step = 10,
  currency = 'USD',
}: PriceCapSliderProps) {
  const { palette, scheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);

  const lastStop = Math.max(1, Math.round((max - min) / step));
  const travel = Math.max(1, trackWidth - THUMB);
  const currentStop =
    value === null || value >= max
      ? lastStop
      : Math.min(lastStop, Math.max(0, Math.round((value - min) / step)));

  const thumbX = useSharedValue(0);
  const active = useSharedValue(0);
  const previousTravel = useRef(travel);

  useEffect(() => {
    const target = (currentStop / lastStop) * travel;
    if (previousTravel.current !== travel) {
      // First layout or a size change: jump into place instead of sliding across.
      previousTravel.current = travel;
      thumbX.set(target);
    } else {
      thumbX.set(animate(target, 'snappy', reduceMotion));
    }
  }, [currentStop, lastStop, travel, reduceMotion, thumbX]);

  const valueText =
    value === null ? 'Any price' : `Under ${formatMoney(money(value * 100, currency))}`;

  function selectStop(stop: number) {
    const clamped = Math.min(lastStop, Math.max(0, stop));
    const next = clamped >= lastStop ? null : min + clamped * step;
    if (next !== value) {
      onChange(next);
      haptic('select');
    }
  }

  function selectAt(event: GestureResponderEvent) {
    const fraction = Math.min(1, Math.max(0, (event.nativeEvent.locationX - THUMB / 2) / travel));
    selectStop(Math.round(fraction * lastStop));
  }

  const fillStyle = useAnimatedStyle(() => ({ width: thumbX.get() + THUMB / 2 }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.get() },
      { scale: reduceMotion ? 1 : 1 + 0.12 * active.get() },
    ],
  }));

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Max price"
      accessibilityValue={{ text: valueText }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') selectStop(currentStop + 1);
        if (event.nativeEvent.actionName === 'decrement') selectStop(currentStop - 1);
      }}>
      <View style={styles.header}>
        <Text variant="label" tone="ink2">
          Max price
        </Text>
        <Text variant="headline">{valueText}</Text>
      </View>

      <View
        style={styles.track}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          active.set(animate(1, 'press', reduceMotion));
          selectAt(event);
        }}
        onResponderMove={selectAt}
        onResponderRelease={() => active.set(animate(0, 'press', reduceMotion))}
        onResponderTerminate={() => active.set(animate(0, 'press', reduceMotion))}>
        {/* Children ignore touches so locationX is always measured against the track itself. */}
        <View pointerEvents="none" style={[styles.rail, { backgroundColor: palette.well }]} />
        <Animated.View
          pointerEvents="none"
          style={[styles.fill, { backgroundColor: palette.ink }, fillStyle]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            { backgroundColor: palette.thumb, borderColor: palette.line },
            elevation('raised', palette, scheme === 'dark'),
            thumbStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  track: {
    height: 44,
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: radius.pill,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: radius.pill,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
