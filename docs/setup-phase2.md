# Phase 2 setup: turning on real search

Until these steps are done, the app runs on stand-in detection and sample results, so nothing
breaks. Do the steps in order. Each one ends with what to check.

Commands run in VS Code's terminal, in the `fitfinder` folder. `npx supabase ...` runs the
Supabase CLI without installing anything.

## 1. Supabase (backend, free tier)

1. Make an account at supabase.com and create a project called `fitfinder`. Pick a US East
   region. Save the database password somewhere safe.
2. In the project's **Authentication** settings, turn on **anonymous sign-ins**. The app signs
   people in invisibly on first launch so searches work without an account, and so rate limits
   apply per person.
3. Click **Connect** (top of the dashboard) and copy the **Project URL** and the
   **publishable key** (starts with `sb_publishable_`).
4. In the `fitfinder` folder, create a file named `.env.local` with:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
   ```

   `.env.local` is git-ignored. The publishable key is safe in the app; the database rules decide
   what it can do. **Never** put the secret or service role key in this file.
5. Connect the CLI and push the database setup and the two server functions:

   ```
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase db push
   npx supabase functions deploy detect
   npx supabase functions deploy search
   ```

   The project ref is the part of the Project URL before `.supabase.co`.

Check: in the dashboard, **Edge Functions** lists `detect` and `search`, and **Storage** has a
private bucket called `uploads`.

## 2. Google Cloud Vision (finds the pieces in a photo)

1. Go to console.cloud.google.com, create a project called `fitfinder`.
2. Enable the **Cloud Vision API** for it. Google asks for a billing account (card). The first
   1,000 photos a month are free; check current pricing on Google's Vision pricing page.
3. Under **APIs & Services > Credentials**, create an **API key**. Edit it and restrict it to the
   **Cloud Vision API** only, so it's useless for anything else if it ever leaks.
4. Save it as a server secret (it never goes in the app):

   ```
   npx supabase secrets set GOOGLE_VISION_API_KEY=YOUR_KEY
   ```

## 3. SerpApi (Google Lens matches)

1. Make an account at serpapi.com. The free plan is enough to test.
2. Copy your API key from the dashboard and save it as a server secret:

   ```
   npx supabase secrets set SERPAPI_KEY=YOUR_KEY
   ```

Each FitFinder search uses **two** SerpApi searches (one for the exact item, one for similar
products). Check your plan's monthly limit with that in mind.

## 4. Affiliate network (makes money; apply now, approval takes days to weeks)

Apply to **Skimlinks** or **Sovrn Commerce**. They'll ask about the app and where links appear.
Until you're approved, links go straight to stores and nothing breaks. Once approved:

```
npx supabase secrets set AFFILIATE_PROVIDER=skimlinks AFFILIATE_ID=YOUR_PUBLISHER_ID
```

(For Sovrn: `AFFILIATE_PROVIDER=sovrn` and your Sovrn Commerce API key as `AFFILIATE_ID`.)
After approval, compare one generated link with the link format in your network's dashboard.

## 5. Spend caps (optional)

Total searches across all users are capped per day so a bug or abuse can't run up the bill.
Defaults: 300 searches and 2,000 photo scans a day. To change them:

```
npx supabase secrets set SEARCH_GLOBAL_DAILY_LIMIT=500 DETECT_GLOBAL_DAILY_LIMIT=3000
```

Per person: 6 searches a minute, 40 a day; 8 scans a minute, 80 a day (set in the functions).

## 6. Restart the app

Stop the server (Ctrl+C) and start it with a clean cache so it picks up `.env.local`:

```
npx expo start -c
```

Check: take a photo of an outfit. The pieces come from your real photo now (not the fixed
stand-in boxes), and the results screen no longer says "Sample results".

## If something fails

- **"Couldn't connect"** right away: anonymous sign-ins are off, or `.env.local` has a typo.
- **"Sign-in required"**: the functions were deployed before 0.3.1. Pull and redeploy both
  functions. If it still shows, check the function logs for a line starting `requireUser rejected`.
- **"Server is missing ..."**: that secret isn't set. Run the matching `secrets set` command.
- **"Too many searches"**: you hit a rate limit. Wait a minute, or raise the caps above.
- Function logs: Supabase dashboard > Edge Functions > pick the function > Logs.
