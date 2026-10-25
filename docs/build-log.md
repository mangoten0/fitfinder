# Build log

## Phase 2: real detection and search (2026-10-25)

- `supabase/functions/detect`: validates a base64 JPEG, checks rate limits, asks Google Cloud
  Vision for objects, keeps clothing only, merges shoes, removes duplicates, orders pieces top to
  bottom, pads boxes slightly.
- `supabase/functions/search`: checks the crop belongs to the caller, rate limits, signs a
  5-minute URL, runs Lens exact matches and products in parallel, classifies results, checks
  stock on the top 10 product pages, wraps affiliate links, deletes the crop.
- Migration: usage counters (per user and global) with service-role-only functions, private
  `uploads` bucket (JPEG, 2 MB), insert-only policy scoped to the user's own folder.
- App: Supabase client with anonymous sign-in and session refresh, image resize and crop on the
  phone, real detector and search with readable errors, fallback to stand-ins without keys.
- Results screen: exact match, dupes (cheapest first, savings vs the exact price), alternatives,
  sold-out handling, price cap filter, curated 6 with "See more", in-app browser, affiliate
  disclosure.
- Verified: 14 backend logic tests pass (Deno), functions type-check and lint clean, app
  type-checks and lints clean, results flow rendered in a browser with sample data.
- Not verified yet: live calls to Vision and SerpApi (needs account keys; see setup-phase2.md).

## Phase 1: capture and split (2026-10-25)

- Home is now the camera (expo-camera): shutter with a white blink, flash toggle, photo picker,
  hint line, and a dev-only shortcut to the design system.
- Camera permission is explained before the system prompt appears. If access was denied, the
  button opens Settings. Picking a screenshot always works without camera access.
- Split screen: a light band sweeps the photo while pieces are found, each piece is cut out as a
  die-cut sticker on the photo, then the pieces drop into a tray with a soft haptic per landing.
  Tap a piece to lift it and open its results. A single piece goes straight to results.
- No pieces or a failed request show an empty state with a next step.
- Reduce Motion: no flight or sweep; pieces fade into the tray.
- Results screen placeholder: the chosen piece as a sticker, heading, and loading cards.
- Not yet: share target from other apps (needs a development build).
- Verified: typecheck and lint clean; full flow run in a browser (capture intro, scan, cut, tray, results).

## Phase 0: design system (2026-10-25)

- Tokens: palette (light/dark), type scale (Syne + Hanken Grotesk), spacing, radii, motion presets,
  haptics, elevation, theme with System/Light/Dark override.
- Components: Button, GlassIconButton, MatchTag, ProductCard, Skeleton, Sticker, EmptyState,
  SectionHeader, PriceCapSlider, PressableScale, Grid.
- First built in SwiftUI, then rebuilt in Expo with a new visual identity (see decisions).
