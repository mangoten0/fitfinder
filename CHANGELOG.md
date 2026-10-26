# Changelog

## 0.3.2
- Search uses Google Lens `visual_matches` for dupes and alternatives (Google discontinued the
  `products` type, so every search came back with no matches)
- Visual matches Google flags as the same item count as the exact match when the exact search
  has nothing priced
- Search logs result counts and Vision logs Google's error reason, for debugging

## 0.3.1
- Fix "Sign-in required" on new Supabase projects: the functions now read the new publishable/secret
  keys (falling back to the legacy anon/service_role keys) and check the user token themselves, with
  the platform JWT check off since it only understands legacy keys
- App starts a fresh anonymous session and retries once if a saved session is rejected
- Rejected tokens are logged (without the token) in the function logs

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
