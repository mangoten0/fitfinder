import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { animate } from '@/design';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Scale while pressed. Bigger targets use a subtler scale. */
  pressedScale?: number;
};

/**
 * The shared press response: a quick spring down on touch. With Reduce Motion on it dims instead.
 * Silent on purpose; haptics are saved for meaningful moments.
 */
export function PressableScale({
  pressedScale = 0.97,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);

  const pressedStyle = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: 1 - pressed.get() * 0.3 }
      : { transform: [{ scale: 1 - pressed.get() * (1 - pressedScale) }] },
  );

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        pressed.set(animate(1, 'press', reduceMotion));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.set(animate(0, 'press', reduceMotion));
        onPressOut?.(event);
      }}
      style={[style, pressedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
