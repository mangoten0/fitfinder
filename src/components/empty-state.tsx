import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { radius, space, Text, useTheme } from '@/design';

import { Button } from './button';
import type { IconName } from './glass-icon-button';

type EmptyStateProps = {
  title: string;
  /** Says what happened and what to do next. Never apologizes, never vague. */
  message: string;
  icon?: IconName;
  actionTitle?: string;
  onAction?: () => void;
};

/** Used for no results, errors, and first-run moments. */
export function EmptyState({ title, message, icon, actionTitle, onAction }: EmptyStateProps) {
  const { palette } = useTheme();

  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.iconWell, { backgroundColor: palette.well }]}>
          <MaterialCommunityIcons name={icon} size={26} color={palette.ink2} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text variant="title2" style={styles.center} accessibilityRole="header">
          {title}
        </Text>
        <Text variant="callout" tone="ink2" style={styles.center}>
          {message}
        </Text>
      </View>
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.l,
    paddingVertical: space.xl,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: space.xs,
    maxWidth: 300,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: space.xs,
  },
});
