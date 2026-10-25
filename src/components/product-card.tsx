import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, space, Text, useTheme } from '@/design';
import { formatMoney } from '@/models/money';
import { matchKindSpoken, type GarmentCategory, type MatchResult } from '@/models/product';

import type { IconName } from './glass-icon-button';
import { MatchTag } from './match-tag';
import { PressableScale } from './pressable-scale';
import { SkeletonBlock } from './skeleton';

const categoryIcon: Record<GarmentCategory, IconName> = {
  top: 'tshirt-crew-outline',
  bottom: 'hanger',
  dress: 'hanger',
  outerwear: 'hanger',
  shoes: 'shoe-heel',
  bag: 'purse-outline',
  accessory: 'sunglasses',
};

type ProductCardProps = {
  result: MatchResult;
  onPress: () => void;
};

/** One search result. Editorial layout: the image well carries the shape, no card chrome. */
export function ProductCard({ result, onPress }: ProductCardProps) {
  const { product, kind, savings } = result;

  const spoken = [
    matchKindSpoken[kind],
    product.title,
    product.retailer,
    formatMoney(product.price),
    savings ? `${formatMoney(savings)} less` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      pressedScale={0.98}
      style={styles.card}>
      <View style={styles.well}>
        <ProductImage imageUrl={product.imageUrl} category={product.category} />
        <View style={styles.tag}>
          <MatchTag kind={kind} savings={savings} />
        </View>
      </View>
      <View style={styles.meta}>
        <Text variant="label" tone="ink2" numberOfLines={1}>
          {product.retailer}
        </Text>
        <Text variant="callout" numberOfLines={2}>
          {product.title}
        </Text>
        <Text variant="price">{formatMoney(product.price)}</Text>
      </View>
    </PressableScale>
  );
}

type ProductImageProps = {
  imageUrl: string | null;
  category: GarmentCategory;
};

/** Product photo with a shimmer while it loads and a category glyph if there's no image. */
export function ProductImage({ imageUrl, category }: ProductImageProps) {
  const { palette } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: palette.well }]}>
        <MaterialCommunityIcons name={categoryIcon[category]} size={36} color={palette.ink3} />
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.well }]}>
      {!loaded ? <SkeletonBlock radius={0} style={StyleSheet.absoluteFill} /> : null}
      <Image
        source={imageUrl}
        contentFit="cover"
        transition={250}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
    </View>
  );
}

/** Same footprint as ProductCard, so nothing jumps when results arrive. */
export function ProductCardSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading" style={styles.card}>
      <SkeletonBlock radius={radius.well} style={styles.wellShape} />
      <View style={styles.meta}>
        <SkeletonBlock width={64} height={10} />
        <SkeletonBlock width="100%" height={14} />
        <SkeletonBlock width={44} height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.s,
  },
  well: {
    aspectRatio: 4 / 5,
    borderRadius: radius.well,
    overflow: 'hidden',
  },
  wellShape: {
    aspectRatio: 4 / 5,
  },
  tag: {
    position: 'absolute',
    top: space.xs,
    left: space.xs,
  },
  meta: {
    gap: space.xxs,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
