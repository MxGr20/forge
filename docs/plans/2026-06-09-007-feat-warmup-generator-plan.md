---
title: "feat: Warmup Set Auto-Generator"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Warmup Set Auto-Generator

When an exercise is added to a live workout and a previous working weight is known, offer a one-tap button to insert three pre-calculated warmup sets at the top of the set list.

---

## Problem Frame

Users who warm up before heavy sets currently add those sets manually one-by-one, remember their own percentages, and round weights themselves. The previous working weight is already in state — `addWorkoutExercise` queries it at line 1242–1245. This feature surfaces an automatic warmup ramp from that weight, inserted in one tap and tagged distinctly so they are excluded from PR detection and progressive overload evaluation.

---

## Key Technical Decisions

- **Extend the tag enum; warmup enters the `cycleSetTag` rotation.** `normalizeSetTag` currently falls through unknown tags to `"work"`, so a warmup-tagged set cycled through `cycleSetTag` would immediately flip to `"failure"`. Adding `"warmup"` to `normalizeSetTag` and appending it after `"drop"` in `nextSetTag`'s order (`["work", "failure", "drop", "warmup"]`) gives users the ability to manually tag any set as warmup and prevents silent normalisation loss. `setTagShort` and `setTagLabel` receive corresponding entries (`"WU"` / `"Warmup"`).
- **Warmup sets use the drop rest duration.** `getRestSeconds` maps `"drop"` to `restSecondsDrop` (45 s). Adding `"warmup"` to that branch keeps warmup rest short and consistent with other low-priority sets.
- **`addWarmupSets` inserts at index 0.** The three sets are unshifted to the front of `item.sets` so they always appear at the top of the list, matching the expected ramp-up ordering.
- **"Add Warmups" button hides after insertion.** The button condition checks whether any warmup-tagged set already exists in `item.sets`. Once inserted, the button disappears — re-insertion is prevented without needing a separate flag. Users can delete individual warmup sets if they want to start over.
- **Warmup set rows are visually distinct.** Warmup rows get a `"WU"` label replacing the numeric set index and a muted background tint (`background: rgba(var(--brgb), 0.06)` inline style). This requires no new CSS classes.

---

## Implementation Units

### U1. Tag system extension and warmup helpers

**Goal:** Extend the set tag system to recognise `"warmup"`, add `getWorkingWeightForExercise()`, and add `addWarmupSets()`.

**Requirements:** R28, R29, R30, R31, R32, R33

**Dependencies:** none

**Files:** `app.js`

**Approach:**

Extend `normalizeSetTag` with one new branch before the final `return "work"`:

```js
if (normalized === "warmup") return "warmup";
```

Update `nextSetTag` order to `["work", "failure", "drop", "warmup"]`.

Update `setTagShort`:
```js
if (current === "warmup") return "WU";
```

Update `setTagLabel`:
```js
if (current === "warmup") return "Warmup";
```

Update `getRestSeconds` to include `"warmup"` in the drop-duration branch:
```js
const key = (normalizedTag === "drop" || normalizedTag === "dropset" || normalizedTag === "drop-set" || normalizedTag === "warmup")
  ? "restSecondsDrop"
  : "restSecondsWork";
```

Add `getWorkingWeightForExercise(exerciseId)` after the tag helpers. The function mirrors the lookup in `addWorkoutExercise` (line 1242–1245): filter `state.workouts` to entries with `endedAt`, sort descending by `createdAt`, find the first containing an item with `exerciseId`, then return the weight of the first work-tagged set in that item's sets. Return `null` if no prior workout exists, no matching item exists, or no work-tagged set with a non-null weight is found.

Add `addWarmupSets(itemId)`. The function:

1. Finds the active workout item by `itemId`.
2. Calls `getWorkingWeightForExercise(item.exerciseId)` — aborts if null.
3. Computes three sets using a local helper `roundTo2_5(kg) = Math.round(kg / 2.5) * 2.5`:
   - `{ id: uid(), tag: 'warmup', weight: roundTo2_5(base * 0.50), reps: 5, completed: false }`
   - `{ id: uid(), tag: 'warmup', weight: roundTo2_5(base * 0.70), reps: 3, completed: false }`
   - `{ id: uid(), tag: 'warmup', weight: roundTo2_5(base * 0.85), reps: 1, completed: false }`
4. Unshifts all three onto `item.sets` (index 0, 1, 2 after insertion).
5. Calls `saveState()` and `renderLog()`.

**Patterns to follow:** `addWorkoutExercise` lookup at line 1242–1245; `nextSetTag` / `normalizeSetTag` at lines 1449–1463; `getRestSeconds` at line 1005.

**Test scenarios:**
- `normalizeSetTag("warmup")` → `"warmup"`.
- `nextSetTag("drop")` → `"warmup"`; `nextSetTag("warmup")` → `"work"`.
- `setTagShort("warmup")` → `"WU"`; `setTagLabel("warmup")` → `"Warmup"`.
- `getRestSeconds("warmup")` → `state.settings.restSecondsDrop`.
- `getWorkingWeightForExercise` with no prior workouts → `null`.
- Prior workout has only warmup-tagged sets for the exercise → `null` (no work sets).
- Prior workout has a work set at 80 kg → returns `80`.
- Multiple prior workouts → returns weight from the most recent.
- `addWarmupSets` with base 100 kg → sets at 50 kg × 5, 70 kg × 3, 87.5 kg × 1 (85% rounded to nearest 2.5).
- `addWarmupSets` with base 60 kg → sets at 30 kg × 5, 42.5 kg × 3, 50 kg × 1.
- After `addWarmupSets`, item.sets has three warmup sets at indices 0–2.

---

### U2. "Add Warmups" button and warmup set visual cue in SessionView

**Goal:** Show the "Add Warmups" button on exercise items that have a known previous working weight and no warmup sets yet; render warmup set rows with a distinct visual style.

**Requirements:** R28, R29, R30, R33

**Dependencies:** U1

**Files:** `index.html`

**Approach:**

Inside the `workout.items.map(item => ...)` block in `SessionView` (line 665), after the exercise header section and before the set list `<div className="sw">`:

Compute two values:
```js
const prevWeight = getWorkingWeightForExercise(item.exerciseId);
const hasWarmups = item.sets.some(s => normalizeSetTag(s.tag) === 'warmup');
```

When `prevWeight !== null && !hasWarmups`, render the button:
```jsx
<button className="gh" style={{ width: '100%', height: 38, fontSize: 12, marginBottom: 8 }}
  onClick={() => { addWarmupSets(item.id); tick(); }}>
  Add Warmups — {Math.round(prevWeight * 0.5 * 2) / 2} / {Math.round(prevWeight * 0.7 * 2) / 2} / {Math.round(prevWeight * 0.85 * 2) / 2} kg
</button>
```

The label previews the three weights so the user can see what will be inserted before tapping. Use `tick()` (already in scope in `SessionView`) to force a re-render after `addWarmupSets` saves state.

In the set row rendering (`item.sets.map((s, i) => ...)`), add a warmup-specific style when the tag is warmup:

```jsx
const isWarmup = normalizeSetTag(s.tag) === 'warmup';
```

Replace the static `{i+1}` in the set number cell (`<div className="sn">`) with `{isWarmup ? 'WU' : i+1}`. Apply inline background tint to the row div:

```jsx
<div key={s.id} className={`sr${s.completed?' done':''}`}
  style={isWarmup ? { background: 'rgba(var(--brgb), 0.06)', borderRadius: 6 } : undefined}>
```

**Patterns to follow:** Exercise item block at `index.html` line 665–708; `tick()` pattern at line 684; `doAddSet`/`+ Add Set` button at line 705 for the ghost button style.

**Note on F1 interaction:** If F1 (Previous-Session Reference) is implemented first and the set rows are extracted into a `SetRow` component, the warmup visual cue logic moves into `SetRow` rather than the inline map. The logic is identical — the placement shifts.

**Test scenarios:**
- Covers R28: Exercise with a known prior working weight → "Add Warmups" button visible below exercise header; button shows preview weights.
- Covers R33: Exercise with no prior work-tagged sets → no "Add Warmups" button.
- Covers R29: Tap "Add Warmups" → three rows appear at top of set list with correct weights and reps (50%×5, 70%×3, 85%×1, rounded to nearest 2.5 kg).
- Covers R30: Inserted sets tagged warmup; rows show "WU" instead of numeric index and get the background tint.
- Button disappears immediately after warmup sets are inserted (hasWarmups becomes true).
- Manually deleting all warmup sets → button reappears.
- Existing workout item that already has warmup sets (e.g., resumed session) → button absent on reload.
- Regular work sets (set 4+) still show numeric index; no tint applied.
- `cycleSetTag` on a warmup row cycles: warmup → work → failure → drop → warmup.

**Verification:** "Add Warmups" appears only when a prior working weight exists and no warmup sets are present; disappears after insertion; inserted sets render at top with "WU" label and tinted background; other set rows unaffected; no console errors.
