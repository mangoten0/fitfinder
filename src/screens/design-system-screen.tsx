import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Children, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { GlassIconButton, type IconName } from '@/components/glass-icon-button';
import { MatchTag } from '@/components/match-tag';
import { PriceCapSlider } from '@/components/price-cap-slider';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { SectionHeader } from '@/components/section-header';
import { Sticker } from '@/components/sticker';
import {
  animate,
  elevation,
  haptic,
  hapticKinds,
  lightPalette,
  radius,
  space,
  STAGGER_MS,
  Text,
  typeScale,
  useTheme,
  type Appearance,
  type Palette,
  type TypeVariant,
} from '@/design';
import { money } from '@/models/money';
import { previewResults } from '@/preview/preview-data';

/**
 * Phase 0 review screen: every token and component in one scroll, so the look can be judged on a
 * real phone in light and dark mode, at large text sizes, and with Reduce Motion on before any real
 * screens get built on top of it.
 */
export function DesignSystemScreen() {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const [priceCap, setPriceCap] = useState<number | null>(80);

  return (
    <ScrollView
      style={{ backgroundColor: palette.paper }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.xxl },
      ]}
      showsVerticalScrollIndicator={false}>
      <Header />

      <Section title="Color">
        <ColorGrid />
      </Section>

      <Section title="Type" note="Grows with text size">
        <TypeScale />
      </Section>

      <Section title="Spacing and corners">
        <SpacingAndCorners />
      </Section>

      <Section title="Buttons">
        <Buttons />
      </Section>

      <Section title="Match tags">
        <View style={styles.tagRow}>
          <MatchTag kind="exact" />
          <MatchTag kind="dupe" savings={money(3000)} />
          <MatchTag kind="alternative" />
        </View>
      </Section>

      <Section title="Product cards">
        <ProductGrid />
      </Section>

      <Section title="Stickers" note="Tap a piece">
        <StickerBoard />
      </Section>

      <Section title="Price filter">
        <PriceCapSlider value={priceCap} onChange={setPriceCap} />
      </Section>

      <Section title="Empty state">
        <View style={[styles.emptyCard, { backgroundColor: palette.raised }]}>
          <EmptyState
            icon="image-search-outline"
            title="No matches for this one"
            message="Try a sharper screenshot, or crop closer to the piece you want."
            actionTitle="Try another photo"
            onAction={() => undefined}
          />
        </View>
      </Section>

      <Section title="Haptics" note="Phone only">
        <Grid columns={2}>
          {hapticKinds.map((kind) => (
            <Button
              key={kind}
              title={kind.charAt(0).toUpperCase() + kind.slice(1)}
              variant="secondary"
              onPress={() => haptic(kind)}
            />
          ))}
        </Grid>
      </Section>
    </ScrollView>
  );
}

// MARK: Header

const appearanceOptions: { value: Appearance; title: string }[] = [
  { value: 'system', title: 'System' },
  { value: 'light', title: 'Light' },
  { value: 'dark', title: 'Dark' },
];

function Header() {
  const { palette, scheme, appearance, setAppearance } = useTheme();

  return (
    <View style={styles.header}>
      <Text variant="display" accessibilityRole="header">
        Design system
      </Text>
      <Text variant="body" tone="ink2">
        Every color, type style, and component the app is built from. Check it in light and dark,
        at large text sizes, and with Reduce Motion on.
      </Text>
      <View
        accessibilityRole="radiogroup"
        style={[styles.segmented, { backgroundColor: palette.well }]}>
        {appearanceOptions.map((option) => {
          const selected = option.value === appearance;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setAppearance(option.value)}
              style={[
                styles.segment,
                selected && { backgroundColor: palette.selected },
                selected && elevation('raised', palette, scheme === 'dark'),
              ]}>
              <Text variant="headline" tone={selected ? 'ink' : 'ink2'}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// MARK: Color

function ColorGrid() {
  const { palette } = useTheme();
  const swatches: { name: string; token: keyof Palette }[] = [
    { name: 'paper', token: 'paper' },
    { name: 'raised', token: 'raised' },
    { name: 'well', token: 'well' },
    { name: 'ink', token: 'ink' },
    { name: 'ink 2', token: 'ink2' },
    { name: 'ink 3', token: 'ink3' },
    { name: 'cherry', token: 'cherry' },
    { name: 'markdown', token: 'markdown' },
    { name: 'denim', token: 'denim' },
    { name: 'lilac', token: 'lilac' },
    { name: 'peach', token: 'peach' },
    { name: 'mint', token: 'mint' },
    { name: 'sky', token: 'sky' },
  ];

  return (
    <Grid columns={3}>
      {swatches.map((swatch) => (
        <View key={swatch.token} style={styles.swatchItem}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: palette[swatch.token], borderColor: palette.line },
            ]}
          />
          <Text variant="footnote" tone="ink2">
            {swatch.name}
          </Text>
        </View>
      ))}
    </Grid>
  );
}

// MARK: Type

const typeSamples: { variant: TypeVariant; name: string; sample: string }[] = [
  { variant: 'display', name: 'Display', sample: 'Find the fit' },
  { variant: 'title1', name: 'Title 1', sample: 'Every piece, found' },
  { variant: 'title2', name: 'Title 2', sample: 'Closest in-stock matches' },
  { variant: 'headline', name: 'Headline', sample: 'See more results' },
  { variant: 'body', name: 'Body', sample: 'Screenshot a fit from anywhere, then tap the piece you want.' },
  { variant: 'callout', name: 'Callout', sample: 'Contour squareneck bodysuit' },
  { variant: 'footnote', name: 'Footnote', sample: 'Prices checked just now' },
  { variant: 'label', name: 'Label', sample: 'Aritzia' },
  { variant: 'price', name: 'Price', sample: '$48' },
];

function TypeScale() {
  return (
    <View style={styles.stackL}>
      {typeSamples.map(({ variant, name, sample }) => (
        <View key={variant} style={styles.stackXXS}>
          <Text variant="footnote" tone="ink3">
            {name}, {typeScale[variant].fontSize}pt
          </Text>
          <Text variant={variant}>{sample}</Text>
        </View>
      ))}
    </View>
  );
}

// MARK: Spacing and corners

function SpacingAndCorners() {
  const { palette } = useTheme();
  const spacing = (['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'] as const).map((name) => ({
    name,
    value: space[name],
  }));
  const corners = (['tag', 'control', 'well', 'board'] as const).map((name) => ({
    name,
    value: radius[name],
  }));

  return (
    <View style={styles.stackL}>
      <View style={styles.stackS}>
        {spacing.map(({ name, value }) => (
          <View key={name} style={styles.spacingRow}>
            <Text variant="footnote" tone="ink2" style={styles.spacingName}>
              {name}
            </Text>
            <View style={[styles.spacingBar, { width: value, backgroundColor: palette.cherry }]} />
            <Text variant="footnote" tone="ink3">
              {value}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.cornerRow}>
        {corners.map(({ name, value }) => (
          <View key={name} style={styles.cornerItem}>
            <View
              style={[styles.cornerShape, { borderRadius: value, backgroundColor: palette.well }]}
            />
            <Text variant="footnote" tone="ink2">
              {name}, {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// MARK: Buttons

function Buttons() {
  const { palette } = useTheme();
  const floatingIcons: { icon: IconName; label: string }[] = [
    { icon: 'camera-outline', label: 'Camera' },
    { icon: 'image-multiple-outline', label: 'Photos' },
    { icon: 'flash-off', label: 'Flash off' },
    { icon: 'close', label: 'Close' },
  ];

  return (
    <View style={styles.stackS}>
      <Button title="Find this fit" onPress={() => undefined} />
      <Button title="See more results" variant="secondary" onPress={() => undefined} />
      <Button title="Not now" variant="quiet" onPress={() => undefined} />
      <Button title="Sold out" onPress={() => undefined} disabled />
      <LinearGradient
        colors={[palette.peach, palette.lilac, palette.sky]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassStrip}>
        {floatingIcons.map(({ icon, label }) => (
          <GlassIconButton key={icon} icon={icon} label={label} onPress={() => undefined} />
        ))}
      </LinearGradient>
    </View>
  );
}

// MARK: Product cards

function ProductGrid() {
  return (
    <Grid columns={2}>
      {previewResults.map((result) => (
        <ProductCard key={result.product.id} result={result} onPress={() => undefined} />
      ))}
      <ProductCardSkeleton />
      <ProductCardSkeleton />
    </Grid>
  );
}

// MARK: Stickers

type StickerPiece = {
  name: string;
  icon: IconName;
  /** Stickers are printed objects, so their colors stay the same in light and dark mode. */
  tint: string;
  rotation: number;
  x: number;
  y: number;
};

const stickerPieces: StickerPiece[] = [
  { name: 'Top', icon: 'tshirt-crew', tint: lightPalette.cherry, rotation: -8, x: -78, y: -62 },
  { name: 'Bag', icon: 'purse', tint: lightPalette.denim, rotation: 7, x: 80, y: -50 },
  { name: 'Shoes', icon: 'shoe-heel', tint: lightPalette.ink, rotation: -5, x: -66, y: 72 },
  { name: 'Sunglasses', icon: 'sunglasses', tint: lightPalette.ink, rotation: 10, x: 76, y: 70 },
];

function StickerBoard() {
  const { palette } = useTheme();
  const [dropKey, setDropKey] = useState(0);
  const [liftedIndex, setLiftedIndex] = useState<number | null>(null);

  function toggleLift(index: number) {
    const lifting = liftedIndex !== index;
    setLiftedIndex(lifting ? index : null);
    haptic(lifting ? 'lift' : 'land');
  }

  return (
    <View style={styles.stackXS}>
      <View style={[styles.board, { backgroundColor: palette.lilac }]}>
        {stickerPieces.map((piece, index) => (
          <DroppingSticker
            key={piece.name}
            piece={piece}
            index={index}
            dropKey={dropKey}
            lifted={liftedIndex === index}
            onPress={() => toggleLift(index)}
          />
        ))}
      </View>
      <Button
        title="Replay the drop"
        variant="quiet"
        onPress={() => {
          setLiftedIndex(null);
          setDropKey((key) => key + 1);
        }}
      />
    </View>
  );
}

type DroppingStickerProps = {
  piece: StickerPiece;
  index: number;
  dropKey: number;
  lifted: boolean;
  onPress: () => void;
};

/** One piece that drops onto the board in sequence, with a soft haptic as it lands. */
function DroppingSticker({ piece, index, dropKey, lifted, onPress }: DroppingStickerProps) {
  const reduceMotion = useReducedMotion();
  const landed = useSharedValue(0);

  useEffect(() => {
    const delay = 250 + index * STAGGER_MS;
    landed.set(0);
    landed.set(withDelay(delay, animate(1, 'land', reduceMotion)));
    const timer = setTimeout(() => haptic('land'), delay + 120);
    return () => clearTimeout(timer);
  }, [dropKey, index, landed, reduceMotion]);

  const dropStyle = useAnimatedStyle(() => {
    const progress = landed.get();
    return {
      opacity: Math.min(1, progress * 2),
      transform: [
        { translateX: piece.x },
        { translateY: piece.y - (1 - progress) * (reduceMotion ? 0 : 28) },
        { scale: reduceMotion ? 1 : 1.3 - 0.3 * progress },
      ],
    };
  });

  return (
    <Animated.View style={[styles.boardPiece, { zIndex: lifted ? 1 : 0 }, dropStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={piece.name}
        accessibilityState={{ selected: lifted }}
        onPress={onPress}>
        <Sticker
          rotation={piece.rotation}
          lifted={lifted}
          render={(silhouette) => (
            <MaterialCommunityIcons
              name={piece.icon}
              size={64}
              color={silhouette ?? piece.tint}
            />
          )}
        />
      </Pressable>
    </Animated.View>
  );
}

// MARK: Layout helpers

/** Equal-width columns. The last row is padded with empty cells so items never stretch. */
function Grid({ columns, children }: { columns: number; children: ReactNode }) {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let start = 0; start < items.length; start += columns) {
    rows.push(items.slice(start, start + columns));
  }

  return (
    <View style={styles.gridRows}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {Array.from({ length: columns }, (_, column) => (
            <View key={column} style={styles.gridCell}>
              {row[column] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} note={note} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.gutter,
    gap: space.xxl,
  },
  header: {
    gap: space.s,
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.control,
    marginTop: space.xs,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control - 3,
  },
  section: {
    gap: space.m,
  },
  stackXXS: { gap: space.xxs },
  stackXS: { gap: space.xs },
  stackS: { gap: space.s },
  stackL: { gap: space.l },
  gridRows: {
    gap: space.l,
  },
  gridRow: {
    flexDirection: 'row',
    gap: space.m,
  },
  gridCell: {
    flex: 1,
  },
  swatchItem: {
    gap: space.xs,
  },
  swatch: {
    height: 56,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  spacingName: {
    width: 44,
  },
  spacingBar: {
    height: 8,
    borderRadius: 2,
  },
  cornerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.m,
  },
  cornerItem: {
    gap: space.xs,
  },
  cornerShape: {
    width: 64,
    height: 64,
  },
  glassStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.m,
    paddingVertical: space.xl,
    borderRadius: radius.board,
    marginTop: space.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.s,
  },
  board: {
    height: 300,
    borderRadius: radius.board,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  boardPiece: {
    position: 'absolute',
  },
  emptyCard: {
    borderRadius: radius.board,
  },
});
