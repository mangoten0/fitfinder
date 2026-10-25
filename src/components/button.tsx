import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { metrics, radius, space, Text, useTheme } from '@/design';

import { PressableScale } from './pressable-scale';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** primary: one per screen, the main action. secondary: outlined. quiet: text only, like "Not now". */
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, style }: ButtonProps) {
  const { palette } = useTheme();

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: palette.ink }
      : variant === 'secondary'
        ? { borderWidth: 1.25, borderColor: palette.ink }
        : styles.quiet;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedScale={variant === 'quiet' ? 0.95 : 0.97}
      style={[styles.base, variantStyle, disabled && styles.disabled, style]}>
      <Text
        variant="headline"
        tone={variant === 'primary' ? 'onInk' : variant === 'quiet' ? 'ink2' : 'ink'}
        numberOfLines={1}>
        {title}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: metrics.buttonHeight,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quiet: {
    minHeight: metrics.tapTarget,
    paddingHorizontal: space.s,
    alignSelf: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
});
