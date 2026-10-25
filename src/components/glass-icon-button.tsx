import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { metrics, radius, useTheme } from '@/design';

import { PressableScale } from './pressable-scale';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type GlassIconButtonProps = {
  icon: IconName;
  /** Spoken by screen readers. Required because the button has no visible text. */
  label: string;
  onPress: () => void;
};

/**
 * Round glass button for icons that float over photos (close, flash, gallery).
 * Uses Apple's Liquid Glass on iOS 26+, and a blur everywhere else.
 */
export function GlassIconButton({ icon, label, onPress }: GlassIconButtonProps) {
  const { palette, scheme } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      pressedScale={0.9}
      style={styles.base}>
      {isLiquidGlassAvailable() ? (
        <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme={scheme} />
      ) : (
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={50}
          tint={scheme === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
        />
      )}
      <MaterialCommunityIcons name={icon} size={20} color={palette.ink} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    width: metrics.tapTarget,
    height: metrics.tapTarget,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
