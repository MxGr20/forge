---
title: "feat: Rule-Based Progressive Overload + Stall Detection"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Rule-Based Progressive Overload + Stall Detection

Add an optional `progressionIncrement` field to exercises. When set, evaluate the last few sessions for that exercise and surface a weight suggestion or deload prompt at the start of the next session.

---

## Problem Frame

Users who follow linear progression must mentally track whether they hit all their reps last session and calculate the next weight themselves. All the data exists in state — sets, tags, weights — but nothing connects prior results to the current session's starting point. This feature closes that loop with a single per-exercise toggle and a non-intrusive banner in the session view.

---

## Key Technical Decisions

- **`progressionIncrement` stored on the exercise object.** `normalizeExercise` uses spread (`...exercise`) so additional fields are preserved through all save/normalize paths. The `ExerciseSheet.doSave` currently enumerates fields explicitly, so it needs to be updated to spread `item` first, preserving `progressionIncrement` (and any future fields) when editing. `null` or `undefined` means no rule — the feature is opt-in per exercise.
- **Progression condition inferred from failure tags, not a stored rep target.** Sets have no separate "target reps" field. The progression condition is: last session contained ≥ 1 work-tagged completed set and 0 failure-tagged sets among work sets. The stall condition is: ≥ 2 of the last 3 sessions contain ≥ 1 failure-tagged set. This maps cleanly to R12 and R14 without requiring a new data field.
- **Suggested weight is last working weight + increment.** The last working weight is the weight from the first work-tagged set of the most recent session (same logic as F7's `getWorkingWeightForExercise`). The suggestion is that weight plus `exercise.progressionIncrement`.
- **Per-session dismiss, not persistent.** The banner uses a `dismissed` set in `SessionView` local state (keyed by exerciseId). Tapping ✕ hides the banner for the current session. On the next session, it reappears — there is no "snooze" or permanent dismiss. This avoids a new state key and prevents the suggestion from becoming invisible indefinitely.
- **Banner shows only the most relevant signal.** When both conditions are theoretically present (stall in last 3 sessions AND most recent was clean), stall wins — it is the higher-priority safety signal.

---

## Implementation Units

### U1. `getProgressionStatus(exerciseId)`

**Goal:** Return the relevant progression signal — suggestion, stall, or null — for a given exercise.

**Requirements:** R11, R12, R13, R14, R15, R16

**Dependencies:** none (reuses patterns from `getWorkingWeightForExercise` in F7)

**Files:** `app.js`

**Approach:**

Add `getProgressionStatus(exerciseId)` after the progression-related helpers.

1. Get the exercise via `getExercise(exerciseId)`. If `!exercise.progressionIncrement` (null, undefined, 0), return `null`.
2. Collect the last 3 completed sessions containing this exercise, sorted by `createdAt` descending. Each "session" is a `{ workout, item }` pair where `item.exerciseId === exerciseId` and `workout.endedAt` is set.
3. If no sessions found, return `null` (no history to evaluate).
4. **Stall check (last 3 sessions):** Count how many of the up-to-3 sessions have ≥ 1 failure-tagged set in the exercise item's sets (where `normalizeSetTag(s.tag) === 'failure'`). If count ≥ 2, return `{ type: 'stall' }`.
5. **Progress check (most recent session only):** From session[0] (the most recent), get all work-tagged sets. If there are ≥ 1 work-tagged completed sets and 0 failure-tagged sets among work sets, the condition is met. Compute `base` = weight of first work-tagged set (same as `getWorkingWeightForExercise`). Return `{ type: 'suggest', weight: base + exercise.progressionIncrement }`.
6. Otherwise return `null` (last session had failures or insufficient data to suggest).

**Patterns to follow:** Session lookup pattern from `getWorkingWeightForExercise` (F7 U1); `normalizeSetTag` for tag comparison.

**Test scenarios:**
- Exercise with no `progressionIncrement` → `null`.
- No prior sessions → `null`.
- Last session: 3 work sets completed, 0 failures, base weight 100 kg, increment 2.5 → `{ type: 'suggest', weight: 102.5 }`.
- Last session: 2 work sets, 1 failure-tagged → no suggestion; check stall.
- 2 of last 3 sessions have failure sets → `{ type: 'stall' }`.
- 3 of last 3 sessions have failure sets → `{ type: 'stall' }` (stall wins over progress check).
- Last session clean but second and third sessions both have failures → `{ type: 'stall' }` (stall still wins).
- Only warmup-tagged sets in last session, no work sets → no suggestion (condition not met).

---

### U2. `ExerciseSheet` update and SessionView progression banner

**Goal:** Expose `progressionIncrement` in the exercise editor and show the banner in the live session.

**Requirements:** R11, R13, R15

**Dependencies:** U1

**Files:** `index.html`

**Approach:**

**`ExerciseSheet` changes:**

Add `const [increment, setIncrement] = useState(item?.progressionIncrement ?? '')` alongside the existing state.

In `doSave`, spread `item` first to preserve any existing fields, then override with form values:
```js
const doSave = () => onSave({
  ...item,
  id: item?.id || uid(),
  name: name.trim(),
  category: item?.category || '',
  type: item?.type || 'weight',
  primaryMuscleGroups: primary.join(', '),
  detailedMuscleGroups: detailed.join(', '),
  progressionIncrement: increment !== '' ? parseFloat(increment) || null : null,
});
```

Add a settings row below the muscle pickers and above the save button:

```jsx
<div className="setr" style={{ marginTop: 16, marginBottom: 4 }}>
  <span style={{ fontSize: 13, color: 'var(--text)' }}>Progression step</span>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <input className="seti" type="number" step="0.5" placeholder="—"
      value={increment} onChange={e => setIncrement(e.target.value)} />
    <span style={{ fontSize: 12, color: 'var(--t3)', width: 24 }}>kg</span>
  </div>
</div>
<div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16, paddingLeft: 2 }}>
  Leave blank to disable auto-progression for this exercise.
</div>
```

**SessionView progression banner:**

Add `const [dismissed, setDismissed] = useState({})` at the top of `SessionView`.

Inside `workout.items.map(item => ...)`, after computing `ex`, add:
```js
const progression = dismissed[item.exerciseId] ? null : getProgressionStatus(item.exerciseId);
```

When `progression !== null`, render a banner between the exercise header and the note input:

- `type: 'suggest'`: brand-accented banner — "Try {weight} kg today (+{increment})" with a ✕ dismiss button.
- `type: 'stall'`: warning-accented banner — "Consider deloading — recent sessions had failures" with a ✕ dismiss button.

Both banners use `onClick={() => setDismissed(d => ({ ...d, [item.exerciseId]: true }))}` on the ✕ button.

Banner style: `background: type==='suggest' ? 'var(--bsoft)' : 'rgba(239,68,68,.08)'`, `border: 1px solid type==='suggest' ? 'var(--bbd)' : 'rgba(239,68,68,.2)'`, `borderRadius: 10`, `padding: '8px 12px'`, `marginBottom: 8`, `display: 'flex'`, `justifyContent: 'space-between'`, `alignItems: 'center'`.

**Patterns to follow:** `setr` / `seti` classes from `ToolsView` settings rows; `var(--bsoft)` / `var(--bbd)` brand-soft tint pattern used elsewhere in the app; `ExerciseSheet` existing state and field patterns at line 1312–1341.

**Test scenarios:**
- Exercise with no progression rule → no banner shown.
- Exercise with rule, last session clean → brand-accent "Try X kg" banner visible below exercise name.
- Exercise with rule, stall detected → warning-accent "Consider deloading" banner.
- Tapping ✕ on banner → banner disappears for this session; does not affect state or other exercises.
- Starting a new session → dismissed state resets (new `SessionView` mount).
- Editing exercise in `ExerciseSheet`: setting increment to 2.5 → saved; clearing the field → `progressionIncrement` set to null; reopening sheet shows current value.
- `doSave` spread preserves other fields (e.g., warmup-related fields added by F7) when editing.

**Verification:** Progression increment field visible in exercise editor for all exercises; banner appears in session only when a rule is active and condition is met; dismiss works per-session; stall overrides suggest when both conditions are present; no console errors.
