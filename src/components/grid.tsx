import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/design';

type GridProps = {
  columns: number;
  children: ReactNode;
  columnGap?: number;
  rowGap?: number;
};

/** Equal-width columns. The last row is padded with empty cells so items never stretch. */
export function Grid({ columns, children, columnGap = space.m, rowGap = space.l }: GridProps) {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let start = 0; start < items.length; start += columns) {
    rows.push(items.slice(start, start + columns));
  }

  return (
    <View style={{ gap: rowGap }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap: columnGap }]}>
          {Array.from({ length: columns }, (_, column) => (
            <View key={column} style={styles.cell}>
              {row[column] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
});
