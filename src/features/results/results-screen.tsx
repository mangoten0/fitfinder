import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { GlassIconButton } from '@/components/glass-icon-button';
import { Grid } from '@/components/grid';
import { PhotoCrop } from '@/components/photo-crop';
import { ProductCardSkeleton } from '@/components/product-card';
import { Sticker } from '@/components/sticker';
import { radius, space, Text, useTheme } from '@/design';
import type { NormalizedBox } from '@/features/split/geometry';

type ResultsParams = {
  uri?: string;
  width?: string;
  height?: string;
  label?: string;
  box?: string;
};

const PIECE_MAX = 150;

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

/**
 * Where matches for the chosen piece will appear. In Phase 1 it shows the piece and the loading
 * layout; Phase 2 fills it with real Exact, Dupe, and Alternative results.
 */
export function ResultsScreen() {
  const params = useLocalSearchParams<ResultsParams>();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const box = parseBox(params.box);
  const photoWidth = Number(params.width);
  const photoHeight = Number(params.height);
  const label = params.label ?? 'piece';
  const valid = Boolean(params.uri) && box !== null && photoWidth > 0 && photoHeight > 0;

  // Draw the piece at its real proportions, fitted inside a square.
  const aspect = valid && box ? (box.width * photoWidth) / (box.height * photoHeight) : 1;
  const pieceWidth = aspect >= 1 ? PIECE_MAX : PIECE_MAX * aspect;
  const pieceHeight = aspect >= 1 ? PIECE_MAX / aspect : PIECE_MAX;

  return (
    <View style={[styles.root, { backgroundColor: palette.paper }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + space.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.backRow}>
          <GlassIconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
        </View>

        {valid && box && params.uri ? (
          <>
            <View style={[styles.hero, { backgroundColor: palette.lilac }]}>
              <Sticker
                rotation={-4}
                outline={4}
                render={(silhouette) =>
                  silhouette ? (
                    <View
                      style={[
                        styles.silhouette,
                        { width: pieceWidth, height: pieceHeight, backgroundColor: silhouette },
                      ]}
                    />
                  ) : (
                    <PhotoCrop uri={params.uri ?? ''} box={box} width={pieceWidth} height={pieceHeight} />
                  )
                }
              />
            </View>

            <View style={styles.heading}>
              <Text variant="title1" accessibilityRole="header">
                Matches for the {label.toLowerCase()}
              </Text>
              <Text variant="body" tone="ink2">
                Live results connect in the next build. This is where the exact item, dupes, and
                in-stock alternatives will show up.
              </Text>
            </View>

            <Grid columns={2}>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </Grid>
          </>
        ) : (
          <EmptyState
            icon="image-off-outline"
            title="Nothing picked yet"
            message="Go back and tap the piece you want to find."
            actionTitle="Go back"
            onAction={() => router.back()}
          />
        )}
      </ScrollView>
    </View>
  );
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
    height: 220,
    borderRadius: radius.board,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouette: {
    borderRadius: radius.control,
  },
  heading: {
    gap: space.xs,
  },
});
