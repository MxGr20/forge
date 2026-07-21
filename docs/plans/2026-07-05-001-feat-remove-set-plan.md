---
title: "feat: Remove Set During Active Workout"
date: 2026-07-05
status: active
origin: docs/brainstorms/2026-07-05-remove-set-requirements.md
type: feat
---

# feat: Remove Set During Active Workout

Users can add sets mid-workout but cannot remove them. A misfire on "+ Add Set" or a changed plan requires finishing the workout to correct the set count.

---

## Requirements Trace

| Requirement | Summary |
|---|---|
| R1 | Remove button on every set row |
| R2 | Button hidden when exercise has exactly one set |
| R3 | Immediate removal, no confirmation |
| R4 | Re-renders and persists to state |
| R5 | Button is compact and does not disrupt the row layout |

---

## Key Technical Decisions

**KTD1 — Local `doRemoveSet` wrapper, not `app.js` `removeSet`.**
`removeSet` in `app.js` (line 1548) ends by calling `renderLog()`, the non-React rendering path. In `SessionView`, all mutations use the local-wrapper pattern (`doAddSet` mutates `item.sets` directly, then calls `saveState(); tick()`). `doRemoveSet` follows the same pattern: filter `item.sets` by id, then `saveState(); tick()`. No changes to `app.js` needed.

**KTD2 — `onRemove` prop on `SetRow`, button rendered inside the component.**
The remove button is passed as a callback prop (`onRemove`) to `SetRow`. When `onRemove` is null (one set remaining), the button is absent. This keeps the per-row layout self-contained inside `SetRow` and avoids wrapping every row in an additional flex container in the parent.

**KTD3 — Button placed after the ✓ column, styled as a compact `−` rounded-rect.**
The existing set row has four columns (Set / kg / reps / ✓). The remove button sits after the checkmark column. Style reference: the per-set remove button in the log/history view (`index.html` line ~1301) — `width:44, height:44, borderRadius:12, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'var(--danger)', fontSize:18`. This matches touch target size conventions. A fifth column header is not required — the button is visually attached to the row end.

---

## Implementation Units

### U1. Remove set button in SessionView

**Goal:** Add a per-set remove button to `SessionView` that filters the set from the workout and re-renders. Hidden when only one set remains.

**Requirements:** R1, R2, R3, R4, R5

**Dependencies:** none

**Files:**
- `index.html` — `SessionView` component (~line 684 for `doAddSet` reference, ~line 796 for `SetRow` call, ~line 830+ for `SetRow` component definition)

**Approach:**

1. Add `doRemoveSet` inside `SessionView` next to `doAddSet`:
   ```
   doRemoveSet(itemId, setId) → filter item.sets, saveState(), tick()
   ```

2. In the `item.sets.map(...)` render loop, pass `onRemove` to `SetRow`:
   - `onRemove={item.sets.length > 1 ? () => doRemoveSet(item.id, s.id) : null}`
   - When `item.sets.length <= 1`, `onRemove` is `null` → button absent.

3. In the `SetRow` component, accept `onRemove` as a prop. When non-null, render a `×` button after the ✓ cell:
   - Style: `background: none`, `border: none`, `color: var(--danger)`, `fontSize: 16`, `cursor: pointer`, `padding: 0 0 0 8px`, `lineHeight: 1` — matches the progression chip dismissal button at line ~776.
   - No impact on the Set / kg / reps / ✓ columns.

**Patterns to follow:**
- `doAddSet` (index.html line ~684) — local mutation + `saveState(); tick()` pattern
- `SetRow` call site (index.html line ~796-799) — prop-passing pattern
- Per-set remove button in log/history view (index.html line ~1301) — button style

**Test scenarios:**
- Exercise has 3 sets: remove button visible on all three rows
- Remove middle set → remaining two rows renumber correctly, both still show the button
- Exercise reduced to 2 sets → remove button visible on both
- Remove one more → 1 set remains → remove button is gone
- Remove button on a completed (checked) set → set is removed cleanly
- Warm-up sets present: remove button obeys the same rule (`item.sets.length > 1`) — warmup and work sets count together toward the minimum
- State persists: reload after removal shows the updated set count

**Verification:** Start an active workout. Add 3 sets to an exercise. Confirm a `×` button appears on each row. Remove the first — two remain. Remove one more — one row remains with no `×`. Confirm state is saved (refresh, reopen session).

---

## Scope Boundaries

**In scope:** `SessionView` during an active workout — `index.html` only.

**Deferred to Follow-Up Work:**
- Undo / restore after accidental removal
- Remove sets in the routine template editor (different component, different mutation path)
- Remove sets in the workout history view (uses `doRemoveItem` for whole exercises; set-level removal not requested)
