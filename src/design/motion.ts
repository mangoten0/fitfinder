import { Easing, ReduceMotion, withSpring, withTiming } from 'react-native-reanimated';

/**
 * Named springs. Every animation in the app uses one of these so motion feels like one system.
 * Durations are perceptual (Reanimated runs them about 1.5x longer while the spring settles).
 */
export const springs = {
  /** Button and card press-down. */
  press: { duration: 160, dampingRatio: 1 },
  /** Small UI responses: values changing, toggles. */
  snappy: { duration: 260, dampingRatio: 0.82 },
  /** Screen-level transitions and layout changes. No overshoot. */
  smooth: { duration: 380, dampingRatio: 1 },
  /** A piece lifting off the photo. */
  lift: { duration: 380, dampingRatio: 0.72 },
  /** A piece landing on the board. The one place with a visible bounce. */
  land: { duration: 460, dampingRatio: 0.52 },
} as const;

export type MotionPreset = keyof typeof springs;

/** Delay between items that animate in sequence, like pieces landing one after another. */
export const STAGGER_MS = 180;

/**
 * Animate a shared value with a preset. With Reduce Motion on, every preset becomes the same
 * short ease, so changes still read as changes without any movement or bounce.
 */
export function animate(toValue: number, preset: MotionPreset, reduceMotion: boolean) {
  'worklet';
  if (reduceMotion) {
    return withTiming(toValue, {
      duration: 160,
      easing: Easing.out(Easing.quad),
      reduceMotion: ReduceMotion.Never,
    });
  }
  return withSpring(toValue, springs[preset]);
}
