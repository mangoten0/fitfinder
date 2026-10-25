# Decisions

Short record of product and technical decisions, newest first. Each entry says what was decided and why.

## 2026-10-25: Phase 1 runs in Expo Go; share target waits for a dev build
Camera and photo picker are included in Expo Go, so Phase 1 is testable today. The share target
(sharing straight from TikTok, IG, Pinterest) needs native extension code, which only works in a
development build. Expo SDK 58 builds need Xcode 27, so local builds wait until macOS and Xcode are updated.

## 2026-10-25: Mock piece detection behind a detector interface
`PieceDetector` returns pieces with normalized boxes. Phase 1 uses `mockDetector` (fixed boxes for a
full-body photo). Phase 2 swaps in the real server detector with the same shape, so screens don't change.

## 2026-10-25: Free local builds over the $99 Apple Developer account (for now)
Testing on a real phone uses free local builds (Xcode, cable install, 7-day expiry). The paid
account is needed later for TestFlight and the App Store.

## 2026-10-25: New visual identity drawn from retail
Cream background + high-contrast serif + red accent is the most common look in AI-generated design,
which conflicts with "must not look vibe coded". New identity: porcelain fitting-room paper, black
woven-label ink, markdown-sticker yellow (Dupe only), denim (Alternative only), Syne + Hanken Grotesk,
hang-tag match labels, die-cut stickers as the one bold element.

## 2026-10-25: Switched from native SwiftUI to Expo
"Apple-level" was about polish, not iOS-only. Expo gives iPhone + Android from one codebase, a
VS Code-only workflow, over-the-air fixes, and the stack AI tools write best. Trade-off: no free
on-device subject lifting, so piece detection runs on the server.

## 2026-10-25: In-app checkout through a universal checkout API, not dropshipping
The retailer stays the seller and handles shipping, returns, and support. We earn commission.
Dropshipping would make every late or low-quality package our problem.

## 2026-10-25: Dupes come from retailers with real return policies
Never counterfeits or logo copies. Low-priced items with luxury brand names or copied logos are filtered out.

## 2026-10-25: Monetization without ads or subscriptions
Commission on purchases first. Later: clearly labeled featured dupes, resale take rate, trend reports.
