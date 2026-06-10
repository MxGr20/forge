---
title: "feat: Session Summary + PR Detection"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Session Summary + PR Detection

After a workout ends, show a summary sheet with total volume, duration, exercise count, PR badges, and a free-text note field before returning the user to the main view.

---

## Problem Frame

`endWorkout()` currently stamps `endedAt`, clears `state.activeWorkoutId`, saves, and navigates away immediately via a toast. There is no moment where the user sees what they accomplished or can add a note. PR context — the most motivating feedback in strength training — is computed nowhere in the app despite all the data existing in state.

---

## Key Technical Decisions

- **App-level `summaryWorkoutId` state, not a new `state` key.** The summary is transient UI state — it lives only between the "End Workout" tap and the user dismissing the sheet. Adding it to the persistent `state` object would require cleanup on every launch. An App-level `useState` is the correct scope.
- **`finishSess` captures the workout id before `endWorkout()` clears it.** `endWorkout()` sets `state.activeWorkoutId = null` at line 1191. `finishSess` in App (line 1557) calls `endWorkout()`. The fix is: in `finishSess`, read `state.activeWorkoutId` into a local variable first, call `endWorkout()`, then call `setSummaryWorkoutId(completedId)` instead of `setInSess(false)` immediately. `setInSess(false)` fires only when the user dismisses the summary, so the session animation context stays active while the sheet is visible.
- **Summary sheet renders as a `SheetPortal` overlay while `inSess` is still true.** `SessionView` stays mounted behind the scrim; the session animation does not fire until dismiss. This avoids an intermediate blank-screen flash that would occur if `inSess` were cleared before the sheet appeared.
- **PR detection is all-time, exercise-wide, work-tagged sets only.** For each completed work-tagged set in the workout, the all-time best weight at that exact rep count is the maximum weight across all prior completed workouts for the same exercise, excluding the current workout. A set is a PR when its weight strictly exceeds that maximum (or no prior record exists at that rep count). Warmup-tagged sets (R31) and non-completed sets are excluded.
- **`updateWorkoutNote(workoutId, note)` is a focused helper.** The note field in the summary sheet saves on blur or on dismiss. A small dedicated function avoids reaching into `state.workouts` directly from the component.

---

## Implementation Units

### U1. `getSessionPRs(workoutId)` and `updateWorkoutNote(workoutId, note)`

**Goal:** Compute PR badges for a completed workout and provide a persistence hook for the session note.

**Requirements:** R5, R6, R7, R8, R9

**Dependencies:** none

**Files:** `app.js`

**Approach:**

Add `getSessionPRs(workoutId)` after the stats helpers. The function:

1. Finds the target workout by id in `state.workouts`. Returns `[]` if not found or `!workout.endedAt`.
2. Builds a lookup: for each other completed workout (`endedAt` set, `id !== workoutId`), for each item, for each work-tagged completed set with `weight` and `reps` — records the maximum weight seen at `(exerciseId, reps)`. This builds an `allTimeBest: Map<string, number>` where the key is `${exerciseId}:${reps}`.
3. Iterates the target workout's items. For each item, for each completed work-tagged set with `weight` and `reps`:
   - key = `${item.exerciseId}:${set.reps}`
   - `isFirstEver` = key not present in `allTimeBest`
   - `isPR` = `isFirstEver || set.weight > allTimeBest.get(key)`
   - If `isPR`, pushes `{ exerciseId: item.exerciseId, exerciseName: getExercise(item.exerciseId)?.name ?? 'Exercise', weight: set.weight, reps: set.reps, isFirstEver }` to results.
4. Returns the PR array (may be empty).

Add `updateWorkoutNote(workoutId, note)`:
```js
function updateWorkoutNote(workoutId, note) {
  const w = state.workouts.find(w => w.id === workoutId);
  if (!w) return;
  w.note = note;
  saveState();
}
```

**Patterns to follow:** `buildStatsDataSnapshot` set-iteration pattern at `app.js` line 506–561; `getExercise` lookup pattern.

**Test scenarios:**
- Empty workout (no items) → returns `[]`.
- Workout not yet ended → returns `[]`.
- Work set at 100 kg × 5; prior best at 5 reps is 95 kg → PR, not first-ever.
- Work set at 100 kg × 5; no prior sets at 5 reps → PR and `isFirstEver: true`.
- Work set at 100 kg × 5; prior best at 5 reps is 100 kg (equal, not greater) → not a PR.
- Warmup-tagged set at 50 kg × 5 → excluded regardless of history.
- Non-completed set → excluded.
- `updateWorkoutNote` with valid id → `workout.note` updated and saved.
- `updateWorkoutNote` with unknown id → no crash.

---

### U2. `SessionSummarySheet` component and App integration

**Goal:** Show the summary sheet after a workout ends; close it to return to the main view.

**Requirements:** R5, R6, R7, R8, R9, R10

**Dependencies:** U1

**Files:** `index.html`

**Approach:**

**App changes (lines 1557–1558 area):**

Add `const [summaryWorkoutId, setSummaryWorkoutId] = useState(null)` alongside the other App state.

Replace:
```js
const finishSess=()=>{endWorkout();setInSess(false);setDir(-1);};
```
With:
```js
const finishSess=()=>{
  const completedId=state.activeWorkoutId;
  endWorkout();
  setSummaryWorkoutId(completedId);
};
const dismissSummary=()=>{setSummaryWorkoutId(null);setInSess(false);setDir(-1);};
```

In the App return JSX, after the existing `{sheet&&<TemplateSheet .../>}` line, add:
```jsx
{summaryWorkoutId&&<SessionSummarySheet workoutId={summaryWorkoutId} onDismiss={dismissSummary}/>}
```

**`SessionSummarySheet` component:**

Define above `StatsView`. Receives `{ workoutId, onDismiss }`.

On mount, computes:
```js
const workout = state.workouts.find(w => w.id === workoutId);
const prs = getSessionPRs(workoutId);
const duration = workout.endedAt && workout.createdAt
  ? Math.round((new Date(workout.endedAt) - new Date(workout.createdAt)) / 60000)
  : null;
const totalVolume = workoutVolume(workout);  // existing helper
const exerciseCount = workout.items.length;
```

Note field uses `const [note, setNote] = useState(workout?.note ?? '')`. `onBlur` calls `updateWorkoutNote(workoutId, note)`.

Renders as a `SheetPortal` (no scrim tap-to-close — user must tap "Done" to prevent accidental dismissal):

```
┌─────────────────────────────┐
│  ── handle ──               │
│  Great work!                │  (workout.name)
│                             │
│  ⏱ 47 min   📦 3,420 kg   │
│  💪 5 exercises  🏅 3 PRs  │
│                             │
│  PR badges (if any):        │
│  Squat  102.5 kg × 5  🏅   │
│  Bench Press  80 kg × 8 ✨  │  (first-ever)
│  …                          │
│                             │
│  [Note… textarea]           │
│                             │
│  [Done →]                   │
└─────────────────────────────┘
```

PR badges list each PR as a row: exercise name, weight, reps, and either a "PR" chip (`chipok` style) or a "First!" chip for `isFirstEver`. When `prs.length === 0`, the PR section is absent (no "0 PRs" shown — silence on zero is friendlier than showing no badges).

The stats row uses `<div className="sg">` chip grid matching the `WorkoutsView` "This Week" stats pattern.

The "Done" button calls `updateWorkoutNote(workoutId, note)` (in case user didn't blur the textarea) then `onDismiss()`.

**Patterns to follow:** `SheetPortal` / `sheet` / sheet handle at `TemplateSheet` line 1432; `workoutVolume` helper; `className="sg"` / `className="st"` stat grid from `WorkoutsView` line 384–389; `chipok` for PR badge; `className="cta"` for the Done button.

**Test scenarios:**
- Covers R5: summary appears after tapping "End Workout"; shows volume, duration, exercise count.
- Covers R6: work set that beats all-time best shows PR badge.
- Covers R7: first-ever set shows "First!" badge.
- Covers R8: warmup sets do not show PR badges even if weight exceeds prior records.
- Covers R9: note text saved after blur and on "Done" tap; note persists after app reload.
- Covers R10: tapping "Done" dismisses sheet and lands on WorkoutsView.
- Workout with no PRs: PR section absent from sheet.
- Duration shows "< 1 min" when `endedAt` and `createdAt` are within the same minute.
- `summaryWorkoutId` cleared on dismiss; re-opening the app does not show summary again.

**Verification:** Summary sheet appears after every normal workout end; PR badges accurate; note saves; "Done" returns to WorkoutsView; no summary shown after discard; no console errors.
