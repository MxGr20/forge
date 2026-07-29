---
title: "feat: Progression Coach v2"
date: 2026-07-20
status: completed
origin: docs/brainstorms/2026-07-20-progressive-overload-coach-requirements.md
type: feat
---

# feat: Progression Coach v2

Replace the exercise-level clean-session banner with an opt-in, Routine Item-level double-progression coach. Forge will prescribe a set-by-set target, prefill it into the next workout, evaluate the completed attempt, and explain the next progression decision.

## Requirements Trace

| Requirement | Implementation |
|---|---|
| Routine-specific progression | Store a normalized `progression` rule on each Routine Item |
| Stable historical prescription | Store a `progressionPlan` snapshot and `routineItemId` on each Workout Item |
| Add reps before load | Advance every below-maximum set by one rep after success |
| Add load at top of range | Add `increment` and reset all targets to `minReps` |
| Repeat a missed target | Reuse the prior snapshot after any attempted but under-target workout |
| Preserve completion | Snapshot completed target-set IDs when finishing and repair the narrow legacy one-flag-loss case |
| Ignore skipped exercises | Zero completed planned sets do not add to the miss streak |
| Deload after two misses | Offer, but do not silently apply, a 10% step-rounded target reduction |
| Explain every decision | Show target and reason in SessionView and an outcome in SessionSummarySheet |
| Preserve existing data | Normalize missing fields, keep `exercise.progressionIncrement` as a default and legacy fallback |

## Key Technical Decisions

### KTD1 — Pure evaluator backed by target snapshots

`evaluateProgressionAttempt(item)` compares the Workout Item's current sets with the `progressionPlan.targets` saved when the workout began. A target contains the generated set ID, prescribed weight, and prescribed reps. Missing or removed planned sets therefore remain detectable.

### KTD2 — Routine Item identity is the progression scope

New Workout Items store `routineItemId`. Prior progression attempts are matched by `routineId + routineItemId`, not only Exercise ID. This allows one Exercise to use different rep ranges in different Routines and supports repeated appearances in a single Routine.

### KTD3 — Suggestions prefill but remain editable

`startWorkout()` first creates the normal previous-session prefill, calculates a progression plan, then overlays the prescribed target. The target is not historical data until the user completes the workout, and every set field remains editable.

Editing a planned weight in the active workout updates that set's target snapshot immediately. The adjusted weight survives reloads and becomes the base for the following progression instead of being evaluated against the original suggestion.

### KTD4 — Deload is an explicit action

After two consecutive misses, the repeated target remains the default. The active-session card offers `Apply 10% deload` and `Keep target`. Applying updates the plan snapshot and the uncompleted set weights; declining only dismisses the offer for that workout.

### KTD5 — Legacy increment becomes the default step

The existing Exercise-level `progressionIncrement` remains persisted and becomes the suggested step when enabling progression for a Routine Item. The old banner remains as a fallback only when no v2 plan exists, preventing an abrupt loss of existing behavior.

## Implementation Units

### U1. State normalization and Routine Item mutation API

**Files:** `app.js`

- Bump `STORAGE_VERSION`.
- Add `normalizeProgressionRule()` and `normalizeProgressionPlan()`.
- Normalize `item.progression` on Routines and `item.progressionPlan` on Workouts.
- Add `updateRoutineItemProgression(routineId, itemId, rule)` with validation.
- Preserve compatibility with missing progression fields.

### U2. Progression evaluator and plan generator

**Files:** `app.js`

- Add `evaluateProgressionAttempt(item)`.
- Add attempt-history lookup scoped by `routineId + routineItemId`.
- Add consecutive-miss calculation that ignores skipped attempts.
- Add baseline, add-rep, add-weight, repeat, and deload-offer plan generation.
- Add target formatting helpers and session-summary outcome generation.
- Add explicit deload apply/dismiss mutations.

### U3. Workout creation and immutable target snapshot

**Files:** `app.js`

- Add `routineItemId` to Workout Items created from a Routine.
- Build the progression plan after previous-session prefill.
- Overlay plan targets onto the new Workout Item sets.
- Keep ad-hoc exercises and non-enabled items unchanged.

### U4. Template progression controls

**Files:** `index.html`

- Add a compact `RoutineProgressionEditor` inside every rep-based Routine Item card.
- Support enable/disable, minimum reps, maximum reps, and weight step.
- Default the step from `exercise.progressionIncrement`, then 2.5 kg.
- Block invalid ranges and non-positive increments.
- Relabel the Exercise editor field as the default progression step.

### U5. Active-session target card and deload actions

**Files:** `index.html`

- Replace the v2 banner with a target card showing prescribed weight/reps and the decision reason.
- Show deload actions only after two misses.
- Keep the legacy banner when a v2 plan is absent.
- Synchronize `SetRow` local input state when a target action changes set values.

### U6. Session-summary outcomes

**Files:** `index.html`, `app.js`

- Add a `Next Progression` section to `SessionSummarySheet`.
- Render one concise result per enabled Workout Item.
- Distinguish success, baseline, repeat, stalled, and skipped outcomes.

### U7. Offline cache and verification

**Files:** `sw.js`

- Bump the service-worker cache version.
- Run syntax checks for `app.js` and Babel JSX parsing for `index.html`.
- Exercise the pure evaluator with baseline, add-rep, add-weight, miss, skip, and deload scenarios.
- Verify old snapshots normalize without progression data.

## Acceptance Scenarios

1. `3 x 8–10 @ 20 kg`; complete `10/10/10` → next workout prefills `3 x 8 @ 22.5 kg`.
2. Complete `10/9/8` → next workout prefills `10/10/9` at the same weight.
3. Target `10/10/9`; actual `10/8/9` → next workout repeats `10/10/9`.
4. Miss two consecutive attempts → next workout repeats the target and offers a 10% deload.
5. Skip the exercise → the following workout preserves the target without increasing the miss streak.
6. Use the same Exercise in two Routines → each target progresses independently.
7. Edit the Routine after a workout → the completed Workout's saved target remains unchanged.
8. Load a pre-v3 saved state → all routines and workouts continue to work.

## Scope Boundaries

The MVP covers weighted, rep-based Routine Items only. Duration, distance, assisted, bodyweight-only progression, RPE/RIR, set-count changes, readiness scoring, and periodization remain deferred.

## Verification

- `node tests/progression-engine.test.js`
- `node --check app.js`
- `node --check tests/progression-engine.test.js`
- Babel standalone parse of the inline React JSX and `tweaks-panel.jsx`
- Local HTTP smoke check returned 200

Interactive browser verification could not be completed because no browser surface was available in the implementation session.
