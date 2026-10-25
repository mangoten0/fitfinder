import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { GlassIconButton } from '@/components/glass-icon-button';
import { Grid } from '@/components/grid';
import { PhotoCrop } from '@/components/photo-crop';
import { PriceCapSlider } from '@/components/price-cap-slider';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { SectionHeader } from '@/components/section-header';
import { Sticker } from '@/components/sticker';
import { radius, space, Text, useTheme } from '@/design';
import { usePieceSearch } from '@/features/search/use-piece-search';
import type { NormalizedBox } from '@/features/split/geometry';
import { formatMoney, type Money } from '@/models/money';
import type { GarmentCategory, MatchKind, MatchResult } from '@/models/product';

type ResultsParams = {
  uri?: string;
  width?: string;
  height?: string;
  label?: string;
  category?: string;
  box?: string;
};

const CATEGORIES: GarmentCategory[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'];
/** How many dupes and alternatives show before "See more". The exact item always shows. */
const CURATED = 6;
const PIECE_MAX = 132;

function parseBox(raw: string | undefined): NormalizedBox | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { x, y, width, height } = value as Record<string, unknown>;
    if ([x, y, width, height].some((n) => typeof n !== 'number' || !Number.isFinite(n))) return null;
    const box = { x, y, width, height } as NormalizedBox;
    return box.width > 0 && box.height > 0 ? box : null;
  } catch {
    return null;
  }
}

function parseParams(params: ResultsParams) {
  const box = parseBox(params.box);
  const width = Number(params.width);
  const height = Number(params.height);
  const category = CATEGORIES.find((value) => value === params.category) ?? 'top';
  if (!params.uri || !box || !(width > 0) || !(height > 0)) return null;
  return {
    photo: { uri: params.uri, width, height },
    piece: { category, box },
    label: params.label ?? 'piece',
  };
}

const SECTION_TITLES: Record<MatchKind, string> = {
  exact: 'Exact match',
  dupe: 'Dupes',
  alternative: 'Alternatives',
};

/** Matches for the piece she tapped: the exact item, cheaper dupes, and similar in-stock options. */
export function ResultsScreen() {
  const params = useLocalSearchParams<ResultsParams>();
  const parsed = parseParams(params);
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { state, retry } = usePieceSearch(parsed?.photo ?? null, parsed?.piece ?? null);

  return (
    <View style={[styles.root, { backgroundColor: palette.paper }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + space.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.backRow}>
          <GlassIconButton icon="arrow-left" label="Back to pieces" onPress={() => router.back()} />
        </View>

        {!parsed ? (
          <EmptyState
            icon="image-off-outline"
            title="Nothing picked yet"
            message="Go back and tap the piece you want to find."
            actionTitle="Go back"
            onAction={() => router.back()}
          />
        ) : (
          <>
            <PieceHero uri={parsed.photo.uri} box={parsed.piece.box} photo={parsed.photo} />
            <Text variant="title1" accessibilityRole="header">
              Matches for the {parsed.label.toLowerCase()}
            </Text>

            {state.status === 'loading' ? (
              <View style={styles.stack}>
                <Text variant="callout" tone="ink2">
                  Checking stores for this piece and cheaper versions of it.
                </Text>
                <Grid columns={2}>
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </Grid>
              </View>
            ) : state.status === 'error' ? (
              <EmptyState
                title="Search didn't go through"
                message={state.message}
                actionTitle="Try again"
                onAction={retry}
              />
            ) : state.data.results.length === 0 ? (
              <EmptyState
                title="No matches for this piece"
                message="Try a clearer photo, or a shot where the piece fills more of the frame."
                actionTitle="Back to pieces"
                onAction={() => router.back()}
              />
            ) : (
              <Animated.View entering={FadeIn.duration(250)} style={styles.stack}>
                <Matches
                  results={state.data.results}
                  referencePrice={state.data.referencePrice}
                  isSample={state.data.isSample}
                />
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// MARK: Piece hero

type PieceHeroProps = {
  uri: string;
  box: NormalizedBox;
  photo: { width: number; height: number };
};

/** The piece she picked, as a sticker on the board, so she knows what's being searched. */
function PieceHero({ uri, box, photo }: PieceHeroProps) {
  const { palette } = useTheme();
  const aspect = (box.width * photo.width) / (box.height * photo.height);
  const width = aspect >= 1 ? PIECE_MAX : PIECE_MAX * aspect;
  const height = aspect >= 1 ? PIECE_MAX / aspect : PIECE_MAX;

  return (
    <View style={[styles.hero, { backgroundColor: palette.lilac }]}>
      <Sticker
        rotation={-4}
        outline={4}
        render={(silhouette) =>
          silhouette ? (
            <View style={[styles.silhouette, { width, height, backgroundColor: silhouette }]} />
          ) : (
            <PhotoCrop uri={uri} box={box} width={width} height={height} />
          )
        }
      />
    </View>
  );
}

// MARK: Matches

type MatchesProps = {
  results: MatchResult[];
  referencePrice: Money | null;
  isSample: boolean;
};

function Matches({ results, referencePrice, isSample }: MatchesProps) {
  const { palette } = useTheme();
  const [priceCap, setPriceCap] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const exact = results.find((result) => result.kind === 'exact') ?? null;
  const others = results
    .filter((result) => result.kind !== 'exact')
    .filter((result) => priceCap === null || result.product.price.cents <= priceCap * 100);
  const visibleOthers = expanded ? others : others.slice(0, CURATED);
  const hiddenCount = others.length - visibleOthers.length;

  const sections: { kind: MatchKind; items: MatchResult[] }[] = [
    { kind: 'exact' as const, items: exact ? [exact] : [] },
    { kind: 'dupe' as const, items: visibleOthers.filter((result) => result.kind === 'dupe') },
    { kind: 'alternative' as const, items: visibleOthers.filter((result) => result.kind === 'alternative') },
  ].filter((section) => section.items.length > 0);

  const showFilter = results.length > 2;

  return (
    <>
      {isSample ? (
        <View style={[styles.note, { backgroundColor: palette.raised }]}>
          <Text variant="footnote" tone="ink2">
            Sample results. Real matches show up once search is connected.
          </Text>
        </View>
      ) : null}

      {exact?.availability === 'sold_out' ? (
        <Text variant="callout" tone="ink2">
          The exact one is sold out. The dupes and alternatives below are in stock.
        </Text>
      ) : null}

      {showFilter ? <PriceCapSlider value={priceCap} onChange={setPriceCap} /> : null}

      {sections.map((section) => (
        <View key={section.kind} style={styles.stack}>
          <SectionHeader
            title={SECTION_TITLES[section.kind]}
            note={
              section.kind === 'dupe' && referencePrice && exact
                ? `vs ${formatMoney(referencePrice)}`
                : undefined
            }
          />
          <Grid columns={2}>
            {section.items.map((result) => (
              <ProductCard key={result.product.id} result={result} onPress={() => openProduct(result, palette.ink)} />
            ))}
          </Grid>
        </View>
      ))}

      {others.length === 0 && priceCap !== null ? (
        <Text variant="callout" tone="ink2">
          Nothing under that price yet. Slide the max price up to see more.
        </Text>
      ) : null}

      {hiddenCount > 0 ? (
        <Button title={`See ${hiddenCount} more`} variant="secondary" onPress={() => setExpanded(true)} />
      ) : null}

      <Text variant="footnote" tone="ink2">
        Prices and stock were checked just now and can change. FitFinder may earn a commission when
        you buy through these links, at no extra cost to you.
      </Text>
    </>
  );
}

/** Opens the store in an in-app browser sheet, so she's one swipe from coming back. */
function openProduct(result: MatchResult, controlsColor: string) {
  WebBrowser.openBrowserAsync(result.product.productUrl, {
    controlsColor,
    dismissButtonStyle: 'close',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => undefined);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.gutter,
    gap: space.l,
  },
  backRow: {
    flexDirection: 'row',
  },
  hero: {
    height: 190,
    borderRadius: radius.board,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouette: {
    borderRadius: radius.control,
  },
  stack: {
    gap: space.m,
  },
  note: {
    padding: space.m,
    borderRadius: radius.control,
  },
});
