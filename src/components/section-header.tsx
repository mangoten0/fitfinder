import { StyleSheet, View } from 'react-native';

import { space, Text, useTheme } from '@/design';

type SectionHeaderProps = {
  title: string;
  /** Short supporting note on the right, like "Phone only". */
  note?: string;
};

export function SectionHeader({ title, note }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text variant="title2" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {note ? (
          <Text variant="footnote" tone="ink2">
            {note}
          </Text>
        ) : null}
      </View>
      <Hairline />
    </View>
  );
}

/** A true one-pixel divider on every screen density. */
export function Hairline() {
  const { palette } = useTheme();
  return <View style={[styles.hairline, { backgroundColor: palette.line }]} />;
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.s,
  },
  title: {
    flexShrink: 1,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
});
