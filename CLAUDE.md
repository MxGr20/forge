# Forge PWA — Agent Instructions

Forge is a React PWA workout tracker. No build step — Babel standalone compiles JSX at runtime in the browser.

## Key files

- `app.js` — all global state, state-mutation functions, and rendering helpers
- `index.html` — all React components (JSX compiled at runtime via Babel)
- `sw.js` — service worker; bump `CACHE` version and add to `ASSETS` when adding new data files
- `data/templates.json` — curated workout templates (3 routines, 41 exercises)
- `data/wod.json` — daily WOD schedule

## State

Global `state` object in `app.js`. All mutations go through `app.js` functions. Always call `saveState()` after mutations, and `renderRoutines()` / `renderExercises()` (both call `window._forgeRefresh?.()`) to trigger React re-render.

## Knowledge store

- `docs/solutions/` — documented solutions and patterns; search here before implementing to avoid repeating solved problems
- `CONCEPTS.md` — domain vocabulary (Exercise, Routine, Routine Item, metricMode, Muscle Tag Library)
- `docs/plans/` — implementation plans
- `docs/brainstorms/` — requirements documents
