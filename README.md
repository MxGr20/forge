# Forge

A progressive web app (PWA) for tracking weightlifting workouts. No build step — JSX is compiled at runtime via Babel standalone.

## Features

- **Previous-session reference** — each set row shows the prior session's weight/reps as dimmed tap-to-fill hints
- **Session summary + PR detection** — summary sheet after every workout with personal record badges
- **Progressive overload engine** — per-exercise increment config; surfaces weight suggestions and deload prompts
- **52-week consistency heatmap** — day-by-day workout calendar on the Forge tab
- **Rest timer** — auto-starts on set completion; optional audio alert via Web Audio API; ±15 s adjustment
- **Weekly muscle load rollup** — rolling 7-day set count per muscle group above the template list
- **Warmup set auto-generator** — "Add Warmups" inserts 50% × 5, 70% × 3, 85% × 1 sets from the previous working weight
- **WOD card** — renders today's scheduled session from `data/wod.json`; tap to start
- **Template import** — load routines from a JSON file; deduplicated by name
- **Body log** — weight and body-fat measurements over time with chart in Stats

---

## Setting up your own instance

Each person needs their own deployment — this gives you completely separate data, your own Supabase project, and cross-device sync under your own account.

### 1. Fork the repository

Fork this repo on GitHub so you have your own copy to modify.

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account and a new project.
2. Once the project is ready, open **SQL Editor → New query**, paste the contents of [`supabase_schema.sql`](supabase_schema.sql), and run it. This creates the `forge_profiles` table with the correct security rules.
3. In **Project Settings → API**, copy your **Project URL** and **anon public** key.

### 3. Configure the app

Open `app.js` and replace the two constants at the very top of the file with your own values:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

### 4. Enable magic-link auth

In your Supabase dashboard go to **Authentication → Providers → Email** and make sure **Enable Email provider** is on. Magic-link sign-in (passwordless) is enabled by default — no additional config needed.

Add your deployment URL to **Authentication → URL Configuration → Redirect URLs** so magic links work after you deploy. For GitHub Pages it will look like `https://your-username.github.io/forge/`.

### 5. Host the app

The app is a static site — any free hosting works. The easiest option is GitHub Pages:

1. In your forked repo go to **Settings → Pages**.
2. Set **Source** to **Deploy from a branch** → `main` → `/ (root)`.
3. Save. Your app will be live at `https://your-username.github.io/forge/`.

Push your updated `app.js` (with your Supabase credentials) and the site deploys automatically.

### 6. Sign in

Open the app, go to the **Tools** tab, enter your email, and tap **Send magic link**. Click the link in your email and you're signed in. From that point on your data syncs automatically across every device where you sign in.

---

## Running locally

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`. The service worker (`sw.js`) caches assets for offline use.

---

## Key files

| File | Purpose |
|---|---|
| `index.html` | All React components (JSX compiled at runtime) |
| `app.js` | Global state, all state-mutation functions, rendering helpers |
| `sw.js` | Service worker — bump `CACHE` version and add to `ASSETS` when adding new data files |
| `supabase_schema.sql` | Database schema to run once in your Supabase SQL editor |
| `data/templates.json` | Curated workout templates (3 routines, 41 exercises) |
| `data/wod.json` | Daily WOD schedule |

## Architecture

State lives in a single global `state` object in `app.js`. All mutations go through functions in `app.js`; call `saveState()` after every mutation and `renderRoutines()` / `renderExercises()` to trigger a React re-render via `window._forgeRefresh?.()`.

Cloud sync uses a single Supabase table (`forge_profiles`) — one row per user containing the full state as JSONB. On sign-in the app compares remote vs local `lastModified` timestamps and takes whichever is newer.

React components in `index.html` are compiled at runtime — there is no build step and no `node_modules`. Adding a new data file requires updating both `CACHE` (version bump) and the `ASSETS` array in `sw.js`.

## Docs

- `CONCEPTS.md` — domain vocabulary (Exercise, Routine, Set tag enum, metricMode, Muscle Tag Library)
- `docs/plans/` — implementation plans
- `docs/brainstorms/` — feature requirements
- `docs/solutions/` — documented solutions and patterns; search here before implementing
