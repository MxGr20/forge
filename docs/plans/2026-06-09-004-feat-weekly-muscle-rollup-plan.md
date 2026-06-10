---
title: "feat: Weekly Muscle Group Load Rollup"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Weekly Muscle Group Load Rollup

Add a 7-day rolling muscle set count summary to `WorkoutsView`, above the routine list, giving users recovery context before selecting a session.

---

## Problem Frame

Routine selection is calendar-based with no load feedback. The per-session muscle group analytics computed in `app.js` are not surfaced at the moment they are most useful — before picking what to train next.

---

## Key Technical Decisions

- **Focused query over `state.workouts`, not the stats cache.** `getStatsDataSnapshot()` rebuilds the full stats snapshot and caches it — calling it for a 7-day rollup couples this lightweight feature to an expensive pipeline. A dedicated `getWeeklyMuscleRollup()` iterates only recent workouts directly.
- **Display below WOD card, above routine list.** `WorkoutsView` already has a natural section break between the WOD card and the Templates header — the rollup occupies that slot.
- **Empty state is silent.** When no muscle-tagged exercises were completed in the last 7 days, the section is absent entirely (R26).

---

## Implementation Units

### U1. `getWeeklyMuscleRollup()`

**Goal:** Return a sorted array of `{ muscle, sets }` for canonical muscle groups with >0 sets in the rolling 7-day window.

**Requirements:** R25, R26, R27

**Dependencies:** none

**Files:** `app.js`

**Approach:** Filter `state.workouts` to entries with `createdAt >= Date.now() - 7 * 86400 * 1000`. For each matching workout, iterate `workout.items`; for each item, get the exercise via `getExercise(item.exerciseId)`, parse `exercise.primaryMuscleGroups` with `parseMuscleGroups`, map each tag through `mapMuscleToCanonicalGroups`, accumulate set counts per canonical group using the item's total set count (`item.sets.length`). Return entries sorted descending by count, omitting groups with zero.

**Patterns to follow:** `parseMuscleGroups`, `mapMuscleToCanonicalGroups`, `CANONICAL_MUSCLE_GROUPS` — all in `app.js`.

**Test scenarios:**
- No workouts in the last 7 days → returns `[]`.
- One workout with 3 squat sets (`primaryMuscleGroups: "Quads"`) → returns `[{ muscle: 'Quads', sets: 3 }]`.
- Workout from 8 days ago is excluded.
- Exercise with no `primaryMuscleGroups` → no crash; item contributes nothing.
- Two workouts both training chest → sets accumulate across sessions.

---

### U2. `MuscleLoadRollup` component and `WorkoutsView` integration

**Goal:** Render the rollup as a compact chip strip in `WorkoutsView`; hide when empty.

**Requirements:** R25, R26

**Dependencies:** U1

**Files:** `index.html`

**Approach:** Create a `MuscleLoadRollup` component that calls `getWeeklyMuscleRollup()` on each render. When the array is empty, return `null`. Otherwise render a section with label "This Week" and a flex-wrapped row of chips — one per muscle group — showing `{muscle}: {sets} sets`. Insert the component into `WorkoutsView` between the WOD card section and the `<div className="sh">` Templates header.

**Patterns to follow:** `className="chip"` for badge styling; existing section header pattern (`<div className="sh"><span className="sl">…</span></div>`).

**Test scenarios:**
- No muscles trained this week → rollup section absent from the DOM.
- 3 muscles trained → 3 chips visible, sorted by count descending.
- Exercises with untagged muscles do not appear.
- After completing a new workout session, rolling refresh shows updated counts.

**Verification:** Rollup appears only when at least one muscle-tagged exercise was logged in the last 7 days; chips sorted by volume descending; counts accurate after reload.
