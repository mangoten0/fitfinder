# FitFinder (working name)

Expo (React Native) app for iPhone and Android. Visual search for clothes: snap or share a fit,
the app splits it into pieces, then finds the exact item, cheaper dupes, and in-stock alternatives.

Current status: **Phase 2 complete** (real detection and search, built and waiting on account keys).
To turn on real search, follow `docs/setup-phase2.md`. Until then the app uses stand-in detection and sample results.
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

## Getting updates

Pull in VS Code (Source Control > ... > Pull) or run `git pull`. If `package.json` changed,
run `npm install` before `npx expo start`.

## What to check in Phase 2

- Take a photo or pick a screenshot, tap a piece. The results screen shows the exact item,
  dupes (cheapest first, with how much less), and alternatives.
- Drag the max price slider to filter; "See more" reveals the rest.
- Tap a result to open the store in an in-app browser sheet.
- Without keys, results say "Sample results". With keys (see docs/setup-phase2.md), pieces come
  from your real photo and results come from real stores.

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
npm run test:backend
```

`test:backend` needs Deno (`npm install -g deno`).

## Structure

```
src/app/            Routes (Expo Router): index (camera), split, results, design-system
src/design/         Tokens: palette, typography, spacing, motion, haptics, elevation, theme
src/components/     Button, GlassIconButton, MatchTag, ProductCard, Skeleton, Sticker,
                    EmptyState, SectionHeader, PriceCapSlider, PressableScale, Grid, PhotoCrop
src/features/       Screen code by feature: capture, split, search, results, design-system
src/lib/            Supabase client, backend calls, image resizing and cropping
src/models/         Money (whole cents), Product, MatchResult
src/preview/        Sample data for the design system screen
supabase/           Database migration and edge functions (detect, search), Deno
docs/               Build log, decisions, setup guides
```

## Rules for every screen

- Colors only from `useTheme().palette`, never hex literals in components.
- Text only through `<Text variant="..." tone="...">` from `@/design`.
- Spacing from `space`, corners from `radius` (chosen by what the thing is).
- Animation only through `animate(value, preset, reduceMotion)`, which handles Reduce Motion.
- Haptics only for meaningful moments (lift, land, value snaps, order result). Plain taps are silent.
- Shared values use `.get()` / `.set()` (required with the React Compiler, which is on).
- Dependencies: Expo SDK modules only so far. Ask before adding anything else.
