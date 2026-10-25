import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GlassIconButton } from '@/components/glass-icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { Sticker } from '@/components/sticker';
import { lightPalette, metrics, radius, space, Text, useTheme } from '@/design';

import { openSplit, pickPhoto } from './open-photo';

/**
 * The home screen. A full-bleed camera with three ways in: take a photo, pick a screenshot,
 * or (later) share straight from TikTok, IG, or Pinterest.
 */
export function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { palette } = useTheme();

  async function choosePhoto() {
    const photo = await pickPhoto();
    if (photo) openSplit(photo);
  }

  // Still reading the permission state: a blank page, so nothing flashes.
  if (!permission) return <View style={[styles.root, { backgroundColor: palette.paper }]} />;

  if (!permission.granted) {
    return (
      <CameraIntro
        canAsk={permission.canAskAgain}
        onAllow={() => {
          if (permission.canAskAgain) requestPermission();
          else Linking.openSettings();
        }}
        onPick={choosePhoto}
      />
    );
  }

  return <Camera onPick={choosePhoto} />;
}

// MARK: Camera

function Camera({ onPick }: { onPick: () => void }) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blink = useSharedValue(0);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.get() }));

  async function takePhoto() {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    setError(null);
    // A quick white blink answers the tap the way a real shutter does.
    blink.set(
      withSequence(
        withTiming(reduceMotion ? 0.4 : 0.85, { duration: 60 }),
        withTiming(0, { duration: 240 }),
      ),
    );
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      openSplit({ uri: picture.uri, width: picture.width, height: picture.height });
    } catch {
      setError("The photo didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.photoBackdrop }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flashOn ? 'on' : 'off'}
        animateShutter={false}
        onCameraReady={() => setReady(true)}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.onPhoto }, blinkStyle]} />

      <View style={[styles.topBar, { paddingTop: insets.top + space.xs }]}>
        <Text variant="title2" tone="onPhoto" style={styles.photoText}>
          FitFinder
        </Text>
        <GlassIconButton
          icon={flashOn ? 'flash' : 'flash-off'}
          label={flashOn ? 'Flash on' : 'Flash off'}
          onPress={() => setFlashOn((on) => !on)}
        />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + space.l }]}>
        <Text variant="callout" tone="onPhoto" style={[styles.photoText, styles.hint]}>
          {error ?? 'Point at a fit, or pick a screenshot'}
        </Text>
        <View style={styles.controls}>
          <GlassIconButton icon="image-multiple-outline" label="Pick a photo" onPress={onPick} />
          <Shutter disabled={!ready || busy} onPress={takePhoto} />
          {__DEV__ ? (
            <GlassIconButton
              icon="palette-outline"
              label="Open design system"
              onPress={() => router.push('/design-system')}
            />
          ) : (
            <View style={styles.controlSpacer} />
          )}
        </View>
      </View>
    </View>
  );
}

function Shutter({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Take photo"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.92}
      style={[styles.shutterRing, { borderColor: palette.onPhoto }, disabled && styles.dimmed]}>
      <View style={[styles.shutterCore, { backgroundColor: palette.onPhoto }]} />
    </PressableScale>
  );
}

// MARK: Camera intro

type CameraIntroProps = {
  canAsk: boolean;
  onAllow: () => void;
  onPick: () => void;
};

/** Explains the camera before the system prompt appears, so the prompt is never a surprise. */
function CameraIntro({ canAsk, onAllow, onPick }: CameraIntroProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.root,
        styles.intro,
        {
          backgroundColor: palette.paper,
          paddingTop: insets.top + space.l,
          paddingBottom: insets.bottom + space.l,
        },
      ]}>
      <Text variant="title2">FitFinder</Text>

      <View style={[styles.collage, { backgroundColor: palette.lilac }]}>
        <View style={[styles.collagePiece, { transform: [{ translateX: -64 }, { translateY: -34 }] }]}>
          <Sticker
            rotation={-9}
            render={(silhouette) => (
              <MaterialCommunityIcons
                name="tshirt-crew"
                size={72}
                color={silhouette ?? lightPalette.cherry}
              />
            )}
          />
        </View>
        <View style={[styles.collagePiece, { transform: [{ translateX: 70 }, { translateY: -14 }] }]}>
          <Sticker
            rotation={8}
            render={(silhouette) => (
              <MaterialCommunityIcons name="purse" size={60} color={silhouette ?? lightPalette.denim} />
            )}
          />
        </View>
        <View style={[styles.collagePiece, { transform: [{ translateX: -6 }, { translateY: 58 }] }]}>
          <Sticker
            rotation={-4}
            render={(silhouette) => (
              <MaterialCommunityIcons name="shoe-heel" size={60} color={silhouette ?? lightPalette.ink} />
            )}
          />
        </View>
      </View>

      <View style={styles.introCopy}>
        <Text variant="display" accessibilityRole="header">
          Find the fit
        </Text>
        <Text variant="body" tone="ink2">
          Point your camera at an outfit, or pick a screenshot. FitFinder pulls out every piece so
          you can find it, or a cheaper dupe.
        </Text>
      </View>

      <View style={styles.introActions}>
        <Button title={canAsk ? 'Turn on camera' : 'Open Settings'} onPress={onAllow} />
        {!canAsk ? (
          <Text variant="footnote" tone="ink2" style={styles.center}>
            Camera access is off for FitFinder. Turn it on in Settings, or pick a screenshot instead.
          </Text>
        ) : null}
        <Button title="Pick a screenshot" variant="secondary" onPress={onPick} />
      </View>
    </View>
  );
}

const SHUTTER = 78;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  photoText: {
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: space.l,
    paddingHorizontal: space.gutter,
  },
  hint: {
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.m,
  },
  controlSpacer: {
    width: metrics.tapTarget,
  },
  shutterRing: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: radius.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: SHUTTER - 16,
    height: SHUTTER - 16,
    borderRadius: radius.pill,
  },
  dimmed: {
    opacity: 0.5,
  },
  intro: {
    paddingHorizontal: space.gutter,
    gap: space.l,
  },
  collage: {
    flex: 1,
    minHeight: 220,
    borderRadius: radius.board,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collagePiece: {
    position: 'absolute',
  },
  introCopy: {
    gap: space.s,
  },
  introActions: {
    gap: space.s,
  },
  center: {
    textAlign: 'center',
  },
});
