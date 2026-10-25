# FitFinder (working name)

Expo (React Native) app for iPhone and Android. Visual search for clothes: snap or share a fit,
the app splits it into pieces, then finds the exact item, cheaper dupes, and in-stock alternatives.

Current status: **Phase 1 complete** (camera, photo picker, split animation on mock data).
See `docs/build-log.md` for what's built and `docs/decisions.md` for why.

## Run it (first time)

1. Install **Node.js LTS** from nodejs.org (one-time).
2. Install **Expo Go** on your phone from the App Store or Play Store.
3. Clone the repo (or unzip the folder) and open it in VS Code (File > Open Folder).
4. Open VS Code's terminal (Terminal > New Terminal) and run:

   ```
   npm install
   npx expo start
   ```

5. Scan the QR code with your iPhone camera (or from inside Expo Go on Android). The app opens on
   your phone and reloads every time you save a file.

Press `i` in the terminal to open the iPhone simulator instead (needs Xcode installed, but you
never open Xcode itself).

## What to check in Phase 1

- The app opens on the camera. The first time, it explains the camera before asking.
- Take a photo of a full outfit, or tap the photos button and pick a screenshot.
- Watch the split: scan, pieces cut out, pieces drop into the tray. Tap one.
- Piece detection is a stand-in for now, so the boxes assume a full-body photo.
- The palette button (dev only) opens the design system screen.

## Design system screen

- Switch System / Light / Dark at the top.
- Turn the text size way up in your phone's settings. Text grows, nothing clips.
- Turn on Reduce Motion. Springs become short fades.
- Tap a sticker to lift it, tap "Replay the drop" to watch them land. Haptics are phone only.
- Drag the price slider: it snaps to $10 steps with a tick each time; far right is "Any price".

## Checks before calling anything done

```
npm run typecheck
npm run lint
```

## Structure

```
src/app/            Routes (Expo Router): index (camera), split, results, design-system
src/design/         Tokens: palette, typography, spacing, motion, haptics, elevation, theme
src/components/     Button, GlassIconButton, MatchTag, ProductCard, Skeleton, Sticker,
                    EmptyState, SectionHeader, PriceCapSlider, PressableScale, Grid, PhotoCrop
src/features/       Screen code by feature: capture, split, results, design-system
src/models/         Money (whole cents), Product, MatchResult
src/preview/        Sample data for the design system screen
docs/               Build log and decisions
```

## Rules for every screen

- Colors only from `useTheme().palette`, never hex literals in components.
- Text only through `<Text variant="..." tone="...">` from `@/design`.
- Spacing from `space`, corners from `radius` (chosen by what the thing is).
- Animation only through `animate(value, preset, reduceMotion)`, which handles Reduce Motion.
- Haptics only for meaningful moments (lift, land, value snaps, order result). Plain taps are silent.
- Shared values use `.get()` / `.set()` (required with the React Compiler, which is on).
- Dependencies: Expo SDK modules only so far. Ask before adding anything else.
