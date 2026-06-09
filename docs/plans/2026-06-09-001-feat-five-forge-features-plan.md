---
title: "Five Forge Feature Additions"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-five-features-requirements.md
---

# Five Forge Feature Additions

**App:** Forge — React PWA (`index.html` + `app.js`)
**Scope:** 5 user-facing features + 2 supporting infra changes

---

## Problem Frame

Six independent gaps in the current Forge experience:

1. Session timer drifts (JS interval ≠ wall clock)
2. Rest timer only supports `+15s` and `Stop` — no reduce option
3. Reps/seconds toggle exists in `app.js` but is not exposed in the React `SessionView`
4. Main page shows raw stats tiles; user wants a Workout-of-the-Day card from a training plan
5. Note field exists in data model and `app.js` (workout items only), not in React `SessionView` or routine items
6. `wod.json` is not in the service worker cache list

---

## Implementation Units

### U1 — Session Timer Fix (`index.html`)

**File:** `index.html`  
**Location:** `SessionView` component, `useEffect` at ~line 333

**Change:** Replace `setEl(s=>s+1)` with a wall-clock recalculation:
```
setEl(Math.round((Date.now() - new Date(workout.createdAt).getTime()) / 1000))
```
The `workout.createdAt` timestamp is already available in scope at the `useEffect` call site. `workout` must be captured outside the interval via a ref or closure — since `workout` is derived from `getActiveWorkout()` called at component mount, the `createdAt` value is stable.

**Test scenarios:**
- Timer shows `00:00` at session start
- Timer shows the correct elapsed value after 1 minute (manual verification)
- Timer does not drift over 10+ minutes compared to a phone clock

---

### U2 — Rest Timer −15s Button (`index.html`)

**File:** `index.html`  
**Location:** `SessionView` rest block, ~line 381

**Change:** Add a `−15s` button before `+15s`:
- Calls `setRest(r => Math.max(0, r - 15))`
- If clamped result is 0, also call `setRestOn(false)` to hide the rest block

**Layout:** Three ghost buttons in a column: `−15s` · `+15s` · `Stop`

**Test scenarios:**
- Pressing `−15s` with 30s remaining → 15s remaining
- Pressing `−15s` with 10s remaining → rest hides (value reaches 0)
- Pressing `−15s` with 0s remaining → no-op (clamped)
- `+15s` and `Stop` continue to work as before

---

### U3 — Reps / Seconds Toggle in SessionView (`index.html`)

**File:** `index.html`  
**Location:** `SessionView`, exercise card render, ~line 392–421

**Approach:**
- Read `item.metricMode` from the item (already stored via `toggleWorkoutItemMetricMode` in `app.js`)
- Derive label: `mode === "seconds" ? "Sec" : "Reps"`
- Render a small toggle pill in the exercise card header area:
  ```jsx
  <button className="gh" style={{height:22,fontSize:10,padding:'0 8px'}}
    onClick={()=>{toggleWorkoutItemMetricMode(item.id); tick();}}>
    {mode==='seconds'?'→ Reps':'→ Sec'}
  </button>
  ```
- Change set table header `<span>Reps</span>` → `<span>{mode==='seconds'?'Sec':'Reps'}</span>`
- The input value stays as `s.reps` — only the column label changes

**Existing hook:** `toggleWorkoutItemMetricMode(itemId)` in `app.js` handles the toggle and `saveState()`. The `tick()` reducer already in `SessionView` forces a re-render.

**Test scenarios:**
- Exercise card shows "→ Sec" toggle by default (mode = reps)
- Tapping toggle changes header to "Sec" and button to "→ Reps"
- Toggling back restores "Reps"
- Mode persists across app reload (stored via `saveState()`)

---

### U4 — Workout of the Day Card (`index.html`)

**Files:** `index.html`, `sw.js`  
**Data:** `wod.json` (135 entries, flat array, one object per row from the training plan)

**JSON schema per entry:**
```json
{
  "date": "2026-06-09",
  "week": 1,
  "phase": "Recovery",
  "sessionNum": 1,
  "sessionType": "Strength+Mobility",
  "session": "Pull B (light) + Mobility",
  "distanceKm": null,
  "durationMin": 45,
  "durationMax": 55,
  "intensity": "Moderate",
  "keySession": false,
  "notes": "Upper body only. No leg work.",
  "routineName": "Pull B (light) + Mobility"
}
```

**WodCard component:**
- Add at top of WorkoutsView using `useState`/`useEffect` to `fetch('./wod.json')`
- Find first entry matching today's date string (`fmt8(new Date())`) in the fetched array
- If no match, render empty-state card: "No session scheduled today."
- Card is tappable → calls `onStart(matchedRoutine)` where `matchedRoutine` is found by case-insensitive name match on `state.routines`; if no match, calls `onStart(null)` (blank workout)
- Style follows the Claude Design prototype exactly (see `WOD_TYPE` and `INTENSITY_STYLE` maps below)

**Session type color map (`WOD_TYPE`):**
```js
const WOD_TYPE = {
  'Rest':             {color:'var(--t3)',    bg:'rgba(255,255,255,.04)', bd:'rgba(255,255,255,.08)'},
  'Strength+Mobility':{color:'var(--brand2)',bg:'rgba(79,102,255,.1)',   bd:'rgba(79,102,255,.22)'},
  'Padel':            {color:'#f59e0b',      bg:'rgba(245,158,11,.09)',  bd:'rgba(245,158,11,.2)'},
  'Run':              {color:'var(--ok)',    bg:'rgba(34,197,94,.08)',   bd:'rgba(34,197,94,.25)'},
  'Bike':             {color:'#60a5fa',      bg:'rgba(96,165,250,.08)',  bd:'rgba(96,165,250,.2)'},
  'Swim':             {color:'#22d3ee',      bg:'rgba(34,211,238,.08)',  bd:'rgba(34,211,238,.2)'},
};
const INTENSITY_STYLE = {
  'Rest':    {color:'var(--t3)',    dots:0},
  'Low':     {color:'var(--ok)',    dots:1},
  'Easy':    {color:'var(--ok)',    dots:1},
  'Moderate':{color:'var(--warn)',  dots:2},
  'Hard':    {color:'var(--danger)',dots:3},
  'High':    {color:'var(--danger)',dots:3},
};
```

**WorkoutsView layout after change:**
1. Header (date + FORGE)
2. 7-day dot row + streak (unchanged)
3. "Start Workout" CTA
4. Section heading "Today's Session" + `<WodCard>`
5. Divider
6. Templates section (unchanged)

**"This Week" stats tiles are removed entirely.**

**Test scenarios:**
- `wod.json` fetches successfully and today's entry renders
- All stat tiles render (distance shows "—" when null, duration shows range)
- Intensity dot bars: 0 dots for Rest, 1 for Easy/Low, 2 for Moderate, 3 for Hard/High
- Key Session badge shows only when `keySession: true`
- Tapping card with matching routine opens that routine's start flow
- Tapping card with no matching routine starts a blank workout
- Date with no WOD entry shows "No session scheduled today." without tappability
- Offline: cached `wod.json` loads correctly

---

### U5 — Per-Exercise Note Field in SessionView (`index.html`)

**File:** `index.html`  
**Location:** `SessionView`, inside each exercise card, below exercise name

**Change:** Add a controlled/uncontrolled note input per exercise:
```jsx
<input type="text" className="si" placeholder="Note…"
  defaultValue={item.note||''}
  onBlur={e=>{
    item.note=e.target.value;
    saveState();
  }}
  style={{width:'100%',marginTop:6,fontSize:12}}/>
```

**Note:** Using `defaultValue` + `onBlur` (same pattern as the existing weight/reps inputs) avoids needing extra React state.

**Test scenarios:**
- Note input appears below exercise name for every exercise in session
- Typing and blurring persists the value (reload shows it)
- Pre-existing `item.note` values pre-populate the input

---

### U6 — Note Field for Routine Items (`app.js`)

**File:** `app.js`  
**Location:** `renderExerciseCard`, ~line 1802

**Change:** Remove the `owner === "workout"` conditional so the note input renders for both `"workout"` and `"routine"` owners:
```js
// Before:
${owner === "workout" ? `<div class="exercise-note-line">...</div>` : ""}
// After:
<div class="exercise-note-line">...</div>
```

The `data-field="item-note"` blur handler at line 4663–4665 already calls `updateItemField` with `owner` from the element attribute, which handles both cases.

**Test scenarios:**
- Note input appears in routine template editor for each exercise
- Typing a note in routine editor persists it via `saveState()`

---

### U7 — Add `wod.json` to Service Worker Cache (`sw.js`)

**File:** `sw.js`

**Change:** Add `"./wod.json"` to the `ASSETS` array. Bump `CACHE` version to `forge-cache-v11`.

**Test scenarios:**
- After install, `wod.json` is served from cache when offline

---

## Sequencing

All units are independent and can be implemented in any order. Suggested order matches risk level (lowest first):

1. U7 (sw.js — one line) + U6 (app.js — remove one conditional)
2. U1 (timer fix — one line in useEffect)
3. U2 (−15s button — add one button)
4. U5 (note field in session — add one input)
5. U3 (metricMode toggle — add button + update header label)
6. U4 (WodCard — largest change, new component + fetch logic + layout replacement)

---

## Files Changed

| File | Units | Nature |
|---|---|---|
| `index.html` | U1, U2, U3, U4, U5 | React component changes |
| `app.js` | U6 | Remove conditional |
| `sw.js` | U7 | Add one cache entry |
| `wod.json` | U4 | New file (already generated) |

---

## Risks

- **WodCard fetch timing:** `wod.json` must load before today's WOD renders. Use `useState(null)` with a loading state; render nothing until loaded.
- **Multiple sessions same date:** Some dates have 2 entries (`sessionNum: 1, 2`). The app uses `find()` (first match) — this consistently picks `sessionNum: 1`, which is acceptable.
- **Routine name matching:** `routineName` in `wod.json` is derived from the session name (e.g., `"Pull B (light) + Mobility"`). This will only link if the user has a template with the exact same name (case-insensitive). Fallback to blank workout is safe.
- **Cache version bump:** Bumping `CACHE` to `forge-cache-v11` forces all existing cached assets to be re-fetched. This is correct behavior.
