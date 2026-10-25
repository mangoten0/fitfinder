# Changelog

## 0.3.0 (Phase 2)
- Supabase backend: `detect` (Google Cloud Vision) and `search` (Google Lens via SerpApi) edge functions
- Results sorted into exact match, dupes (with savings), and alternatives; counterfeits filtered out
- Live stock check on top results; dead links dropped, sold-out exact item marked
- Affiliate link wrapping (Skimlinks or Sovrn) behind a server secret
- Per-user and global rate limits; uploads go to a private bucket and are deleted after each search
- Real results screen: price filter, see more, in-app store browser, affiliate disclosure
- Falls back to stand-in detection and sample results until keys are set

## 0.2.0 (Phase 1)
- Camera home screen with photo picker and permission flow
- Split animation: scan, cut out, drop into tray, tap to pick
- Placeholder results screen
- Design system moved to its own dev-only screen

## 0.1.0 (Phase 0)
- Design system and component library
