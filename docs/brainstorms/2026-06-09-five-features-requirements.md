# Requirements: Five Feature Additions
**Date:** 2026-06-09
**App:** Forge — Workout Tracker (React PWA, `index.html` + `app.js`)

---

## Goals

Deliver five discrete improvements to the active session and main-page experience:

1. Fix the session elapsed timer so it stays accurate over long sessions.
2. Add a −15s button to the rest countdown.
3. Allow reps ↔ seconds toggle per exercise during an active session.
4. Display a Workout of the Day card on the main page, sourced from bundled JSON.
5. Add a one-line note field per exercise in both templates and active sessions.

---

## Feature 1 — Session Timer Fix

### Problem
The current timer (`SessionView`, `index.html` line 330) increments by `+1` each second via `setInterval`. This approach drifts over long sessions because JS intervals are not guaranteed to fire at exactly 1000 ms.

### Requirement
On each interval tick, recalculate elapsed from the wall clock:
```
elapsed = Math.round((Date.now() - new Date(workout.createdAt).getTime()) / 1000)
```
The display (`⏱ MM:SS`) and location remain unchanged.

### Scope
- One-line fix inside the `useEffect` in `SessionView`.
- No visual changes unless drift correction alone does not resolve what the user sees.

---

## Feature 2 — Rest Timer −15s Button

### Current state
The rest timer block in `SessionView` has two buttons: `+15s` and `Stop`.

### Requirement
Add a `−15s` button. Pressing it reduces the remaining rest time by 15 seconds. The value clamps at 0 — it cannot go negative. Pressing −15s when ≤15s remain stops the timer (sets to 0 and hides the rest block), equivalent to pressing Stop.

### Layout
Three buttons in the rest block: `−15s` · `+15s` · `Stop`. Order and styling consistent with the existing ghost button style (`className="gh"`).

---

## Feature 3 — Reps / Seconds Toggle During Session

### Current state
- `app.js` has `toggleWorkoutItemMetricMode(itemId)` and `normalizeItemMetricMode(item)`, which toggle `item.metricMode` between `"reps"` and `"seconds"` and persist it.
- The React `SessionView` (`index.html`) does not expose this toggle. The set table header always shows "Reps" regardless of `item.metricMode`.

### Requirement
In `SessionView`, per exercise card:
- Read `item.metricMode` (already stored on the item; falls back to `"reps"` via `normalizeItemMetricMode`).
- Show a small toggle button (e.g. label: "Seconds" when mode is reps, "Reps" when mode is seconds) in the exercise card header area.
- Tapping it calls `toggleWorkoutItemMetricMode(item.id)` and triggers a re-render.
- The set table column header (`Reps`) changes to `Sec` (or `Seconds`) when mode is `"seconds"`.
- The input field and stored value remain `set.reps` in both modes — only the label changes. No conversion of existing values.

### Scope
Session only (not routine templates — templates already have this toggle in `app.js`).

---

## Feature 4 — Workout of the Day Card

### Data source
An Excel file with one row per date. The relevant columns are:

| Field | Description |
|---|---|
| Date | Calendar date of the session |
| Session | Session name / description |
| Distance | Distance (if applicable) |
| Duration min | Minimum duration in minutes |
| Duration max | Maximum duration in minutes |
| Intensity | Effort level label |
| Notes | Free-text notes |

(Additional columns — Week, Phase, Day, Session Type, Key Session — are in the file but not displayed.)

### Integration approach
The user converts the Excel to `wod.json` manually and places it in the project. The app `fetch()`es it at `WorkoutsView` mount. The file is a flat array of objects, each with an ISO date key (`YYYY-MM-DD`). No Excel-parsing library is needed. The file must be listed in `sw.js` for offline caching.

### WOD card display
Add a WOD card to `WorkoutsView` above the "This Week" section. The card shows:
- **Session name** (bold, prominent)
- **Distance** (if present)
- **Duration** as a range: `X – Y min` (if both present; show single value if only one)
- **Intensity**
- **Notes** (smaller text, truncated to two lines with ellipsis)

The card is **tappable**. Tapping it starts a workout linked to that day's session. The `wod.json` entry includes a `routineId` (or `routineName`) field that maps to an existing routine template in the app. If a match is found, tapping opens the same template-start sheet that tapping a routine card opens. If no match is found, tapping starts a blank workout.

### Empty state
When today's date has no matching entry in `wod.json`, display the card with the message: **"No session scheduled today."** The card is not tappable in this state.

### Date matching
Use `fmt8(new Date())` (already available in `index.html`) to produce `YYYY-MM-DD` and look up the matching row.

---

## Feature 5 — Per-Exercise Note Field

### Current state
- The `note` field exists on items in both routines and workouts in the data model (`app.js` normalization).
- `app.js` shows a "Note (optional)" text input for workout items but **not** for routine items.
- The React `SessionView` (`index.html`) shows **no** note field at all.

### Requirement

**Active session (`SessionView`, `index.html`):**
- Below each exercise name, add a single-line text input: `placeholder="Note…"`.
- On blur, write the value to `item.note` and call `saveState()`.
- Show the current value if `item.note` is already set.

**Routine template editor (`app.js`, `renderExerciseCard`):**
- The note input is currently conditional on `owner === "workout"`. Remove this condition so it renders for both workout and routine owners.
- The `data-field="item-note"` handler that writes to `item.note` already handles both owners via `getItemCollection`.

---

## Scope Boundaries

**In scope:**
- All five features as described above.
- `wod.json` is created by manually exporting the Excel — the app does not parse `.xlsx` directly.

**Out of scope:**
- Visual redesign of the session header or rest timer layout beyond adding the −15s button.
- Multi-line or rich-text notes.
- Per-set notes.
- WOD data editing inside the app.
- Automatic sync of `wod.json` from a live spreadsheet.

---

## Outstanding Questions

- What date format does the Excel use? This affects how the JSON keys are structured during conversion. If dates are stored as Excel serial numbers rather than text, they must be converted to `YYYY-MM-DD` strings during export.
- How will the `wod.json` reference a routine — by `routineId` (the app's internal UUID) or by `routineName` (matched by string)? Name matching is simpler to author by hand but brittle if routine names change; ID matching is stable but requires looking up IDs first.

---

## Success Criteria

- Timer displayed during a session matches wall-clock elapsed time within 1 second over a 60-minute session.
- −15s button is visible and functional; rest cannot go below 0.
- Each exercise card in an active session shows a reps/seconds toggle; the column header updates immediately on tap.
- The WOD card appears on the main page showing today's session data; "No session scheduled today." appears when no entry exists.
- Note fields appear for every exercise in both the template editor and active session; notes persist across sessions.
