# FitFinder (working name)

Expo (React Native) app for iPhone and Android. Visual search for clothes: snap or share a fit,
the app splits it into pieces, then finds the exact item, cheaper dupes, and in-stock alternatives.

Current status: **Phase 0 complete** (design system and component library).

## Run it (first time)

1. Install **Node.js LTS** from nodejs.org (one-time).
2. Install **Expo Go** on your phone from the App Store or Play Store.
3. Unzip this folder, open it in VS Code (File > Open Folder).
4. Open VS Code's terminal (Terminal > New Terminal) and run:

   ```
   npm install
   npx expo start
   ```

5. Scan the QR code with your iPhone camera (or from inside Expo Go on Android). The app opens on
   your phone and reloads every time you save a file.

Press `i` in the terminal to open the iPhone simulator instead (needs Xcode installed, but you
never open Xcode itself).

## What to check in Phase 0

The app opens on the design system screen.

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
src/app/            Screens (Expo Router: every file here is a route)
src/design/         Tokens: palette, typography, spacing, motion, haptics, elevation, theme
src/components/     Button, GlassIconButton, MatchTag, ProductCard, Skeleton, Sticker,
                    EmptyState, SectionHeader, PriceCapSlider, PressableScale
src/screens/        Screen bodies used by routes
src/models/         Money (whole cents), Product, MatchResult
src/preview/        Sample data for the design system screen
```

## Rules for every screen

- Colors only from `useTheme().palette`, never hex literals in components.
- Text only through `<Text variant="..." tone="...">` from `@/design`.
- Spacing from `space`, corners from `radius` (chosen by what the thing is).
- Animation only through `animate(value, preset, reduceMotion)`, which handles Reduce Motion.
- Haptics only for meaningful moments (lift, land, value snaps, order result). Plain taps are silent.
- Shared values use `.get()` / `.set()` (required with the React Compiler, which is on).
- Dependencies: Expo SDK modules only so far. Ask before adding anything else.
