import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import type { InkTone } from './palette';
import { useTheme } from './theme';

/** Font files loaded at startup (see app/_layout.tsx). */
export const fontAssets = {
  Syne_700Bold,
  Syne_800ExtraBold,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
};

/**
 * Two families with clearly different jobs:
 * - Syne, a wide display face with fashion-magazine attitude, only for headlines.
 * - Hanken Grotesk, a calm grotesk, for everything she reads or taps.
 */
const display = 'Syne_800ExtraBold';
const displayBold = 'Syne_700Bold';
const regular = 'HankenGrotesk_400Regular';
const medium = 'HankenGrotesk_500Medium';
const semibold = 'HankenGrotesk_600SemiBold';

export type TypeVariant =
  | 'display'
  | 'title1'
  | 'title2'
  | 'headline'
  | 'body'
  | 'callout'
  | 'footnote'
  | 'label'
  | 'price';

/** The type scale. Sizes are at the default text size and scale with the phone's text-size setting. */
export const typeScale: Record<TypeVariant, TextStyle> = {
  display: { fontFamily: display, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  title1: { fontFamily: display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  title2: { fontFamily: displayBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  headline: { fontFamily: semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: regular, fontSize: 16, lineHeight: 24 },
  callout: { fontFamily: regular, fontSize: 15, lineHeight: 21 },
  footnote: { fontFamily: regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  price: { fontFamily: semibold, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] },
};

/** Big display type stops growing earlier so headlines never break the layout at huge text sizes. */
const maxScale: Record<TypeVariant, number> = {
  display: 1.3,
  title1: 1.4,
  title2: 1.6,
  headline: 2,
  body: 2,
  callout: 2,
  footnote: 2,
  label: 1.6,
  price: 1.8,
};

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: InkTone;
};

/** The only text component screens should use. */
export function Text({ variant = 'body', tone = 'ink', style, ...rest }: TextProps) {
  const { palette } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[variant]}
      {...rest}
      style={[typeScale[variant], { color: palette[tone] }, style]}
    />
  );
}
