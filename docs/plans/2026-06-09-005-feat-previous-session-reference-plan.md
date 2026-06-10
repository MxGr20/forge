---
title: "feat: Previous-Session Reference Column"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Previous-Session Reference Column

Show last session's weight × reps as dimmed ghost text on each set row during an active workout. Tapping the ghost text fills the current set's inputs.

---

## Problem Frame

Every set starts with a blank field backed by pre-filled `defaultValue` that is silently overwritten on first keystroke. The previous session's values are fetched inside `addWorkoutExercise` but never surfaced to the user during logging. The memory tax of recalling last session's numbers is the most-cited friction in workout logging apps.

---

## Key Technical Decisions

- **Controlled inputs via `SetRow` sub-component.** The existing set rows use `defaultValue` (uncontrolled). Tap-to-fill requires programmatically setting the displayed value, which is not reliably achievable on uncontrolled inputs without fragile key-remount tricks. Extracting each row into a `SetRow` component with local `[weight, setWeight]` and `[reps, setReps]` state is the standard React approach and eliminates the entire class of problem. The refactor is scoped to `SessionView`'s set list only.
- **Reference indexed by set position.** Set `i` shows the reference from last session's set `i`. If last session had fewer sets than the current count, extra rows show no reference (R4).
- **Helper extracts shared lookup logic.** `addWorkoutExercise` already queries the most recent completed workout for an exercise. Extracting that as `getLastSessionSetsForExercise(exerciseId, currentWorkoutId)` avoids duplicating the query in the React component.

---

## Implementation Units

### U1. `getLastSessionSetsForExercise(exerciseId, currentWorkoutId)`

**Goal:** Return the sets array from the most recent completed workout containing `exerciseId`, excluding the current workout.

**Requirements:** R3, R4

**Dependencies:** none

**Files:** `app.js`

**Approach:** Filter `state.workouts` to entries with `endedAt` set and `id !== currentWorkoutId`, sort descending by `createdAt`, find the first with an item matching `exerciseId`, return that item's `sets` array. Return `[]` when none found. This mirrors the lookup already inside `addWorkoutExercise` (line 1242–1245) — the plan extracts it so both callsites use the same function.

**Patterns to follow:** `addWorkoutExercise` lookup at `app.js` line 1242–1245.

**Test scenarios:**
- No previous workouts → returns `[]`.
- Previous workout has 3 sets for the exercise → returns those 3 sets.
- Previous workout is the current workout (same ID) → excluded; returns sets from the one before it.
- Exercise appears in multiple past workouts → returns sets from the most recent.
- Exercise never logged before → returns `[]`.

---

### U2. `SetRow` component with controlled inputs and ghost reference text

**Goal:** Replace the inline set row JSX in `SessionView` with a `SetRow` component; add ghost reference text and tap-to-fill.

**Requirements:** R1, R2, R4

**Dependencies:** U1

**Files:** `index.html`

**Approach:** Extract the per-set `<div key={s.id} className="sr...">` block from `SessionView` into a `SetRow({ s, index, itemId, prevSets, updField, onToggle, repsLbl })` component. Inside:

- `const [weight, setWeight] = useState(s.weight ?? '')` and `const [reps, setReps] = useState(s.reps ?? '')`.
- `onChange` on each input updates local state; `onBlur` calls `updField(itemId, s.id, field, value)`.
- `const prev = prevSets?.[index]` — the reference set at the same position.
- When `prev` exists and has a non-null `weight` or `reps`, render dimmed reference text below or beside the inputs: `{prev.weight}kg × {prev.reps}`. Style with `color: var(--t3)`, `fontSize: 11`.
- Tapping the reference text calls `setWeight(String(prev.weight ?? ''))`, `setReps(String(prev.reps ?? ''))`, and `updField` for both fields immediately (no blur needed for tap-to-fill).

The parent `SessionView` calls `getLastSessionSetsForExercise(item.exerciseId, workout.id)` once per exercise item, passes the result as `prevSets` to each `SetRow`.

**Patterns to follow:** Existing set row JSX at `index.html` line 694–703; `updField` call pattern; `className="sr done"` toggling.

**Test scenarios:**
- Covers R1: set row renders dimmed `{w}kg × {r}` reference when previous session data exists at that index.
- Covers R1: reference absent when exercise was never logged before.
- Covers R1: last session had 2 sets, current has 3 → sets 1 and 2 show reference; set 3 shows none.
- Covers R2: tapping reference text → weight and reps fields update immediately; values persist on blur via `updField`.
- Controlled inputs: typing a new weight updates local state without losing focus; `onBlur` persists.
- Set completion toggle still works after conversion to controlled inputs.
- `+15s`, `−15s`, Stop buttons on rest block unaffected.

**Verification:** Ghost text visible on each set row with previous session data; tapping ghost text fills both fields; typing in fields works as before; set completion and rest timer unaffected; no console errors.
