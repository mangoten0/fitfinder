import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { GlassIconButton } from '@/components/glass-icon-button';
import { animate, haptic, radius, space, STAGGER_MS, Text, useTheme } from '@/design';
import { messageFor } from '@/lib/backend';

import { detector, type DetectedPiece, type SourcePhoto } from './detection';
import { containRect, pieceRect, trayLayout, type Rect } from './geometry';
import { PieceSticker, type PieceStage } from './piece-sticker';

type Status = 'scanning' | 'cut' | 'tray' | 'empty' | 'error';

const HEADER = 56;
const STATUS_LINE = 44;
/** Alternating resting tilts so the tray reads as a collage, not a grid. */
const TILTS = [-5, 4, 3, -4];

type SplitParams = { uri?: string; width?: string; height?: string };

function parsePhoto(params: SplitParams): SourcePhoto | null {
  const width = Number(params.width);
  const height = Number(params.height);
  if (!params.uri || !(width > 0) || !(height > 0)) return null;
  return { uri: params.uri, width, height };
}

/**
 * The signature moment: the photo is scanned, each piece is cut out as a sticker, and the pieces
 * drop into a tray. She taps the one she wants. A photo with a single piece skips straight ahead.
 */
export function SplitScreen() {
  const params = useLocalSearchParams<SplitParams>();
  const photo = useMemo(
    () => parsePhoto({ uri: params.uri, width: params.width, height: params.height }),
    [params.uri, params.width, params.height],
  );

  if (!photo) {
    return (
      <Shell>
        <EmptyState
          icon="image-off-outline"
          title="No photo to split"
          message="Go back and take a photo or pick a screenshot."
          actionTitle="Go back"
          onAction={() => router.back()}
        />
      </Shell>
    );
  }

  return <Splitter photo={photo} />;
}

function Splitter({ photo }: { photo: SourcePhoto }) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null);
  const [status, setStatus] = useState<Status>('scanning');
  const [pieces, setPieces] = useState<DetectedPiece[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState('Check your connection and try again.');
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find the pieces.
  useEffect(() => {
    let cancelled = false;
    detector
      .detect(photo)
      .then((found) => {
        if (cancelled) return;
        if (found.length === 0) {
          setStatus('empty');
          return;
        }
        setPieces(found);
        setStatus('cut');
        haptic('lift');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(messageFor(error));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [photo, attempt]);

  // After the cut-out beat, drop the pieces into the tray.
  useEffect(() => {
    if (status !== 'cut') return;
    const timer = setTimeout(() => setStatus('tray'), reduceMotion ? 250 : 750);
    return () => clearTimeout(timer);
  }, [status, reduceMotion]);

  const openResults = useCallback(
    (piece: DetectedPiece) => {
      setSelectedId(piece.id);
      haptic('lift');
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
      navigateTimer.current = setTimeout(() => {
        router.push({
          pathname: '/results',
          params: {
            uri: photo.uri,
            width: String(photo.width),
            height: String(photo.height),
            label: piece.label,
            category: piece.category,
            box: JSON.stringify(piece.box),
          },
        });
      }, 380);
    },
    [photo],
  );

  // A soft tap as each piece lands. A single piece goes straight to its results.
  useEffect(() => {
    if (status !== 'tray') return;
    const timers = pieces.map((_, index) =>
      setTimeout(() => haptic('land'), index * STAGGER_MS + 220),
    );
    const onlyPiece = pieces.length === 1 ? pieces[0] : undefined;
    if (onlyPiece) timers.push(setTimeout(() => openResults(onlyPiece), 900));
    return () => timers.forEach(clearTimeout);
  }, [status, pieces, openResults]);

  // Coming back from results: put the lifted piece back down.
  useFocusEffect(
    useCallback(() => {
      setSelectedId(null);
      return () => {
        if (navigateTimer.current) clearTimeout(navigateTimer.current);
      };
    }, []),
  );

  const layout = useMemo(() => {
    if (!stage) return null;
    const frame: Rect = {
      x: space.gutter,
      y: HEADER + space.s,
      width: stage.width - space.gutter * 2,
      height: (stage.height - HEADER) * 0.5,
    };
    const imageRect = containRect(frame, photo.width, photo.height);
    const statusY = frame.y + frame.height + space.m;
    const trayTop = statusY + STATUS_LINE + space.s;
    const tray: Rect = {
      x: space.gutter,
      y: trayTop,
      width: stage.width - space.gutter * 2,
      height: Math.max(0, stage.height - trayTop - space.m),
    };
    const from = pieces.map((piece) => pieceRect(imageRect, piece.box));
    const to = trayLayout(
      tray,
      from.map((rect) => rect.width / rect.height),
      space.m,
    );
    return { frame, statusY, tray, from, to };
  }, [stage, photo, pieces]);

  const pieceStage: PieceStage = status === 'cut' ? 'cut' : status === 'tray' ? 'tray' : 'hidden';
  const showPieces = status === 'cut' || status === 'tray';

  const statusText =
    status === 'scanning'
      ? 'Finding the pieces'
      : pieces.length === 1
        ? `Found the ${pieces[0]?.label.toLowerCase() ?? 'piece'}`
        : 'Tap the piece you want';

  return (
    <Shell>
      <View
        style={styles.stage}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setStage({ width, height });
        }}>
        {layout ? (
          <>
            <PhotoFrame
              uri={photo.uri}
              frame={layout.frame}
              scanning={status === 'scanning'}
              dimmed={showPieces}
            />

            {status === 'empty' || status === 'error' ? (
              <View style={[styles.absolute, { top: layout.statusY, left: 0, right: 0 }]}>
                {status === 'empty' ? (
                  <EmptyState
                    title="No pieces found in this photo"
                    message="Try a photo where the whole outfit is in frame."
                    actionTitle="Pick another photo"
                    onAction={() => router.back()}
                  />
                ) : (
                  <EmptyState
                    title="This photo didn't go through"
                    message={errorMessage}
                    actionTitle="Try again"
                    onAction={() => {
                      setStatus('scanning');
                      setAttempt((count) => count + 1);
                    }}
                  />
                )}
              </View>
            ) : (
              <Animated.View
                key={statusText}
                entering={FadeIn.duration(220)}
                style={[styles.absolute, styles.statusLine, { top: layout.statusY }]}>
                <Text variant="title2" style={styles.center}>
                  {statusText}
                </Text>
              </Animated.View>
            )}

            {showPieces
              ? pieces.map((piece, index) => {
                  const from = layout.from[index];
                  const to = layout.to[index];
                  if (!from || !to) return null;
                  return (
                    <PieceSticker
                      key={piece.id}
                      uri={photo.uri}
                      box={piece.box}
                      from={from}
                      to={to}
                      tilt={TILTS[index % TILTS.length] ?? 0}
                      stage={pieceStage}
                      order={index}
                      selected={selectedId === piece.id}
                      label={piece.label}
                      onPress={() => openResults(piece)}
                    />
                  );
                })
              : null}
          </>
        ) : null}

        <View style={[styles.absolute, styles.back]}>
          <GlassIconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
        </View>

      </View>
    </Shell>
  );
}

// MARK: Photo frame

type PhotoFrameProps = {
  uri: string;
  frame: Rect;
  scanning: boolean;
  dimmed: boolean;
};

const SCAN_BAND = 90;

/** The original photo, with a light band sweeping down it while pieces are being found. */
function PhotoFrame({ uri, frame, scanning, dimmed }: PhotoFrameProps) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const sweep = useSharedValue(0);
  const dim = useSharedValue(0);

  useEffect(() => {
    if (scanning && !reduceMotion) {
      sweep.set(0);
      sweep.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true));
    } else {
      sweep.set(0);
    }
  }, [scanning, reduceMotion, sweep]);

  useEffect(() => {
    dim.set(animate(dimmed ? 1 : 0, 'smooth', reduceMotion));
  }, [dimmed, reduceMotion, dim]);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -SCAN_BAND + sweep.get() * (frame.height + SCAN_BAND) }],
  }));
  const photoStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.6 * dim.get() }));

  return (
    <View
      accessible
      accessibilityLabel={scanning ? 'Your photo, being scanned for pieces' : 'Your photo'}
      style={[
        styles.absolute,
        styles.frame,
        {
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          backgroundColor: palette.well,
        },
      ]}>
      <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
        <Image source={uri} contentFit="contain" accessible={false} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {scanning && !reduceMotion ? (
        <Animated.View pointerEvents="none" style={[styles.band, bandStyle]}>
          <LinearGradient
            colors={['transparent', palette.shimmer, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// MARK: Shell

function Shell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.shell,
        { backgroundColor: palette.paper, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
  },
  absolute: {
    position: 'absolute',
  },
  back: {
    top: space.xs,
    left: space.gutter,
  },
  frame: {
    borderRadius: radius.well,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCAN_BAND,
  },
  statusLine: {
    left: space.gutter,
    right: space.gutter,
    height: STATUS_LINE,
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
