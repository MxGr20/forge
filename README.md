# Forge

A progressive web app (PWA) for tracking weightlifting workouts. No build step — JSX is compiled at runtime via Babel standalone.

## Running locally

Serve the project root with any static file server:

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser. The service worker (`sw.js`) caches assets for offline use.

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

## Key files

| File | Purpose |
|---|---|
| `index.html` | All React components (JSX compiled at runtime) |
| `app.js` | Global state, all state-mutation functions, rendering helpers |
| `sw.js` | Service worker — bump `CACHE` version and add to `ASSETS` when adding new data files |
| `data/templates.json` | Curated workout templates (3 routines, 41 exercises) |
| `data/wod.json` | Daily WOD schedule |

## Architecture

State lives in a single global `state` object in `app.js`. All mutations go through functions in `app.js`; call `saveState()` after every mutation and `renderRoutines()` / `renderExercises()` to trigger a React re-render via `window._forgeRefresh?.()`.

React components in `index.html` are compiled at runtime — there is no build step and no `node_modules`. Adding a new data file requires updating both `CACHE` (version bump) and the `ASSETS` array in `sw.js`.

## Docs

- `CONCEPTS.md` — domain vocabulary (Exercise, Routine, Set tag enum, metricMode, Muscle Tag Library)
- `docs/plans/` — implementation plans
- `docs/brainstorms/` — feature requirements
- `docs/solutions/` — documented solutions and patterns; search here before implementing
