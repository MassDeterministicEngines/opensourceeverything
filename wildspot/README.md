# WildSpot

A friends-only, Pokémon-Go-flavored map of cool nature spots — trails, mountains, caves, parks, reserves — for you and a small group of friends. Photos, captures, leaderboard, all friends-only.

This is a **PWA** (Progressive Web App). It runs in your phone's browser and installs to your home screen. There's no APK to sideload, no app store. You push code, Vercel builds, you reload on your phone, you see changes.

It lives in this `wildspot/` subdirectory and is fully separate from the rest of the repo.

---

## What you have to do once (~30–45 min)

You'll create three free accounts, run a few SQL files, and connect the repo to a deploy service. Nothing here costs money for a small group of friends.

### 1. Create a Supabase project (database + login + photo storage)

1. Go to https://supabase.com and sign in.
2. **New Project**. Name it `wildspot`. Pick a strong DB password and write it down. Region: closest to you (US-East works well for Indiana).
3. Wait ~2 minutes for it to provision.
4. **Auth → Providers**: confirm Email is on. Make sure Google is **off**.
5. **Auth → URL Configuration**: leave default for now; you'll come back after Vercel.
6. **SQL Editor → New query**. Paste the contents of `supabase/migrations/0001_init.sql` and click **Run**. Then do the same for `0002_rls.sql`. Then `0003_storage.sql`.
7. **Storage → New bucket**. Name: `photos`. Leave **Public** unchecked. Save.
8. Re-run `0003_storage.sql` if it errored on the first try (it depends on the bucket existing).
9. **Project Settings → API**. Copy the **Project URL** and the **anon (public)** key. You'll paste these into Vercel.

### 2. Create a Mapbox account (the map itself)

1. Go to https://mapbox.com and sign up.
2. **Account → Tokens**. Copy the default public token (`pk.…`). Keep it handy.
3. (Recommended) Click into that token and **restrict it to URLs** matching your Vercel domain once you have it. Mapbox public tokens are designed to be exposed in the client, but URL-restricting prevents someone else from burning your free quota.
4. (Optional, for the Pokémon-Go look) **Mapbox Studio → New Style** → start from **Outdoors** → **Save as** "WildSpot." Then in the editor:
   - Tint landcover/parks toward saturated greens and teals.
   - Hide secondary/tertiary road layers and most road labels.
   - Drop building opacity to ~30%.
   - **Publish**. Copy the `mapbox://styles/<you>/<id>` URL.
5. If you skip step 4 for now, just use `mapbox://styles/mapbox/outdoors-v12` to start. You can swap the URL later without redeploying — just update the env var in Vercel.

### 3. Deploy on Vercel (free hosting + GitHub auto-deploy)

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New → Project** → import this repo.
3. **Important: set Root Directory to `wildspot`**. Vercel will only build this subfolder and ignore the rest of the repo.
4. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`. (Vercel usually fills these in automatically.)
5. **Environment Variables** — add these for both Preview and Production:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_MAPBOX_TOKEN` = your Mapbox public token
   - `VITE_MAPBOX_STYLE_URL` = `mapbox://styles/mapbox/outdoors-v12` (or your custom URL)
6. **Deploy**. Wait for the build.
7. Copy the Preview/Production URL. Open it on your Android phone in Chrome.
8. Sign up. Allow location when prompted.
9. Chrome menu (⋮) → **Add to Home Screen**. The app installs as a fullscreen icon.

### 4. Tell Supabase the URL is allowed

Back in Supabase: **Auth → URL Configuration → Site URL** = your Vercel URL. **Redirect URLs** = same. Save.

---

## After setup: the daily loop

1. Code change pushed to `claude/app-installation-guide-fKUEv` (this branch).
2. Vercel auto-builds (only `wildspot/`).
3. New Preview URL goes live. Reload the app on your phone — it auto-updates.

For changes that need a new env var or a new SQL migration, the commit message will say so. Read it before pulling.

---

## Verifying it works end-to-end (do this after the first deploy)

Run through this on your phone in order. If any step fails, check the troubleshooting section.

1. Open the Vercel URL in Chrome. Login screen loads in &lt; 3 sec.
2. Tap **Create an account**. Pick a username (e.g. `you`). Sign up.
3. You land on the map. Allow location. Map centers on Indiana.
4. **Add to Home Screen** via Chrome menu. Open from the home screen icon — fullscreen, no browser bar.
5. Tap the **+** button. Add a spot called "Backyard Test". Pick type "Other". Save. A pin appears on the map.
6. Tap the pin → **Spot detail**. Tap **+ Add** under Moments → take a photo → caption "test" → Save. Photo appears.
7. Standing within 100 m of the pin: the **Capture** button enables. Tap it. ✓ appears.
8. Open **Leaders** tab. You should see 1 capture, this month.
9. (Optional, validates RLS) In an incognito tab, sign up a second account, copy the share code from your **Me** page on account A, paste it on account B's **Friends** page. Accept on A. B's map should now show A's pin.
10. Push a small visible change. Wait ~90 s. Reload from home screen icon — change appears.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build log mentions `tree-sitter` or `tauri` | Vercel is building from the repo root. **Set Root Directory to `wildspot`** in project settings. |
| Map is blank / 401 errors in console | `VITE_MAPBOX_TOKEN` missing or wrong. Re-check Vercel env vars and redeploy. |
| Map loads but tiles are wrong style | `VITE_MAPBOX_STYLE_URL` is wrong. Try `mapbox://styles/mapbox/outdoors-v12` to confirm. |
| Login fails with "Invalid login credentials" | Email confirmation is on by default. In Supabase **Auth → Email**, you can disable "Confirm email" while testing. |
| Photo upload errors with `403` | Storage bucket policy isn't applied. Re-run `0003_storage.sql` after the bucket exists. |
| `permission denied for table…` | RLS policies didn't apply. Re-run `0002_rls.sql`. |
| GPS keeps timing out | On Samsung devices, both Chrome's site permission AND the OS location toggle have to be on. |
| Capture button never enables | You need ≤ 50 m GPS accuracy AND ≤ 100 m from the pin. Tree cover degrades GPS — step into the open. |
| App stuck on an old build after a deploy | Open the **Me** tab → **Force refresh app**. (This unregisters the service worker and reloads.) |
| Supabase project says "paused" | Free projects pause after 7 days idle. Open the dashboard once a week, or any user activity wakes it. |

---

## Local development (optional)

If you ever want to run this on a computer:

```bash
cd wildspot
cp .env.example .env  # fill in the values
npm install
npm run dev
```

Open `http://localhost:5173`. GPS won't work over plain HTTP from another device on your LAN — the Vercel preview URL is the easier path.

---

## What's NOT in this MVP (deferred on purpose)

- Push notifications when the app is closed
- Native APK wrapper (PWA covers it)
- Repeat-visit history (currently one capture per spot per user)
- Photo comments / reactions
- In-app spot edit/delete (do it via Supabase Table Editor for now)
- Trails as polylines (would need PostGIS)
- Public discovery feed
- iOS-specific polish — the iOS PWA experience is restricted; this targets Android Chrome
