import { StyleSheet, View } from 'react-native';

import { radius, space, Text, useTheme, type InkTone } from '@/design';
import { formatMoney, type Money } from '@/models/money';
import { matchKindSpoken, matchKindTitle, type MatchKind } from '@/models/product';

type MatchTagProps = {
  kind: MatchKind;
  savings?: Money | null;
};

/**
 * The tag on every result, drawn like a clothing hang tag (punched hole and all):
 * a black brand label for Exact, a yellow markdown sticker for Dupe, denim for Alternative.
 */
export function MatchTag({ kind, savings = null }: MatchTagProps) {
  const { palette } = useTheme();

  const look: Record<MatchKind, { background: string; tone: InkTone }> = {
    exact: { background: palette.ink, tone: 'onInk' },
    dupe: { background: palette.markdown, tone: 'onMarkdown' },
    alternative: { background: palette.denim, tone: 'onDenim' },
  };
  const { background, tone } = look[kind];
  const showSavings = kind === 'dupe' && savings !== null;

  return (
    <View
      accessible
      accessibilityLabel={
        showSavings ? `${matchKindSpoken[kind]}, ${formatMoney(savings)} less` : matchKindSpoken[kind]
      }
      style={[styles.tag, { backgroundColor: background }]}>
      <View style={[styles.hole, { backgroundColor: palette.paper, borderColor: palette.line }]} />
      <Text variant="label" tone={tone} style={styles.kind}>
        {matchKindTitle[kind]}
      </Text>
      {showSavings ? (
        <Text variant="label" tone={tone}>
          {formatMoney(savings)} less
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingLeft: space.xs,
    paddingRight: space.s - 2,
    paddingVertical: 5,
    borderRadius: radius.tag,
  },
  hole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kind: {
    fontFamily: 'HankenGrotesk_600SemiBold',
  },
});
