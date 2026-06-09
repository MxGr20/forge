---
title: "feat: Add JSON template import to Forge"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-template-import-requirements.md
---

# feat: Add JSON Template Import

**App:** Forge — Workout Tracker (React PWA)
**Plan depth:** Standard

---

## Summary

Add an "↑ Import Templates" button to the bottom of the Templates section. Tapping it opens a file picker; selecting `data/templates.json` creates missing exercises (with muscle groups and coaching notes), missing muscle tags, and missing routine templates in a single pass — skipping any that already exist by name.

The `data/templates.json` file is already on disk (3 templates, 41 exercises from Workouts A, B, C). This plan covers the two remaining in-app pieces only: the import logic function and the React button UI.

---

## Problem Frame

The user's training plan defines 3 workout templates across Workouts A, B, and C in `data/templates.json`. Entering these manually is tedious and error-prone. An import function seeds the exercise library, muscle tag library, and routine templates in one tap, with skip-on-conflict so subsequent imports are safe to run repeatedly.

---

## Requirements

From `docs/brainstorms/2026-06-09-template-import-requirements.md`:

- "↑ Import Templates" ghost button at the bottom of the Templates section
- Tapping it triggers a hidden `<input type="file" accept=".json">` — no extra dialog
- JSON validated before processing; toast shown on error
- `primaryMuscles` values ensured in `state.muscleTagLibrary.primary`; `secondaryMuscles` in `muscleTagLibrary.detailed`
- Exercises found by case-insensitive name match; created if absent, skipped if present
- New exercises carry `primaryMuscleGroups`, `detailedMuscleGroups`, `type` (derived from `metricMode`)
- Routine templates found by case-insensitive name match; created if absent, skipped if present
- New templates carry all exercises as items with full sets (`weight: null`, reps from JSON, metricMode), item-level `note` pre-filled from coaching note
- Result toast: "Imported X template(s) and Y exercise(s)" or "Nothing new to import"
- No rewrite of existing exercises or templates on conflict

---

## Key Technical Decisions

**Import logic in `app.js`, not inline in the React component.**
All state-mutation primitives (`createRoutine`, `uid`, `saveState`, `renderRoutines`, `toast`) live in `app.js` and are globally accessible. Placing `importTemplatesFromJSON` there keeps the pattern consistent and avoids embedding data logic in JSX. The React component's responsibility is limited to file picking and invoking the function. (see origin: Feature 3)

**`muscleTagLibrary` null-guarded at import time.**
`state.muscleTagLibrary` exists in `DEFAULT_STATE` but may be absent in older localStorage snapshots. The import function initialises it to `{ primary: [], detailed: [] }` if missing, avoiding a runtime crash on first import.

**Exercise type derived from `metricMode`.**
`metricMode: "seconds"` → `type: "duration"`. All other values → `type: "weight"`. Consistent with `normalizeExercise` in `app.js` and correctly drives the set row rendering in the app.

**Coaching note goes on the routine item, not the exercise definition.**
The note field visible on each exercise card during a session is `item.note` (the routine item's note), not a field on the exercise definition itself. The import populates `item.note` on each routine item from the JSON `note` field. Exercise definitions remain note-free, consistent with the existing data model.

**Import function returns counts; toast is the caller's responsibility.**
`importTemplatesFromJSON(data)` returns `{ templatesAdded, exercisesAdded }`. The React `onChange` handler formats and shows the toast. This keeps the function testable from the browser console without UI side effects.

---

## High-Level Technical Design

```
User taps "↑ Import Templates"
        │
        ▼
fileInputRef.current.click()   [WorkoutsView, index.html]
        │  browser file picker
        ▼
onChange → FileReader.readAsText(file)
        │  onload callback
        ▼
JSON.parse(text)  ──→ invalid? toast("Invalid file"), abort
        │
        ▼
importTemplatesFromJSON(parsed)        [app.js]
  │
  ├─ guard: initialise muscleTagLibrary if absent
  ├─ collect all unique primaryMuscles → push missing into muscleTagLibrary.primary
  ├─ collect all unique secondaryMuscles → push missing into muscleTagLibrary.detailed
  ├─ build name→id map: for each unique exercise name
  │    ├─ case-insensitive match in state.exercises → reuse id
  │    └─ no match → create exercise, push to state.exercises
  ├─ for each template in data
  │    ├─ case-insensitive match in state.routines → skip
  │    └─ no match → build routine with items array → push to state.routines
  ├─ saveState()
  └─ renderRoutines()
        │
        ▼
returns { templatesAdded, exercisesAdded }
        │
        ▼  [WorkoutsView onChange handler]
toast(result message)
refresh()   ← forces WorkoutsView re-render
reset input value ← allows same file to be re-selected
```

---

## Implementation Units

### U1. Import logic function (`app.js`)

**Goal:** Add `importTemplatesFromJSON(data)` to `app.js` — the authoritative state-mutation function that validates the JSON payload, ensures muscle tags, finds or creates exercises, and finds or creates routine templates.

**Requirements:** Feature 3 — all five steps (validate, muscle tags, exercises, templates, persist)

**Dependencies:** None

**Files:**
- `app.js` (modify — add function near `createRoutine`, ~line 1520)

**Approach:**
Validate that `data` is a non-empty array where each item has a string `templateName` and an array `exercises`. Return `{ templatesAdded: 0, exercisesAdded: 0 }` early on failure (caller shows toast).

Muscle tags: collect all unique `primaryMuscles` strings across every exercise in every template into a Set; for each string not in `state.muscleTagLibrary.primary`, push it. Repeat for `secondaryMuscles` → `muscleTagLibrary.detailed`. Check first whether a helper such as `mergeMuscleTag` (near line 690) already handles deduplication and reuse it if so; otherwise direct push is fine.

Exercise build: iterate all unique exercise names (lowercase-keyed map). `state.exercises.find(e => e.name.toLowerCase() === name)` → reuse id. Otherwise:
```
{ id: uid(), name: ex.name, category: "",
  type: ex.metricMode === "seconds" ? "duration" : "weight",
  primaryMuscleGroups: (ex.primaryMuscles || []).join(", "),
  detailedMuscleGroups: (ex.secondaryMuscles || []).join(", ") }
```
Push to `state.exercises`.

Template build: `state.routines.find(r => r.name.toLowerCase() === templateName.toLowerCase())` → skip. Otherwise:
```
{ id: uid(), name: template.templateName, items: template.exercises.map(ex => ({
    id: uid(),
    exerciseId: nameToIdMap[ex.name.toLowerCase()],
    group: null,
    note: ex.note || "",
    metricMode: ex.metricMode,
    sets: Array.from({ length: ex.sets || 1 }, () => ({
      id: uid(),
      type: ex.metricMode === "seconds" ? "duration" : "weight",
      tag: "work",
      completed: false,
      weight: null,
      reps: ex.reps ?? null
    }))
  }))
}
```
Push to `state.routines`.

After all mutations: `saveState()`, `renderRoutines()`. Return `{ templatesAdded, exercisesAdded }`.

**Patterns to follow:** `createRoutine` (~line 1503), `createExerciseFromName` (~line 851), `uid()`, `saveState()`, `renderRoutines()`

**Test scenarios:**
- Import `data/templates.json` (3 templates, 41 exercises) against empty state → `templatesAdded: 3`, `exercisesAdded: 41`; `state.routines` has 3 entries; `state.exercises` has 41 entries; `saveState` called; `renderRoutines` called
- Import same payload a second time → `{ templatesAdded: 0, exercisesAdded: 0 }`; no new entries pushed; `saveState` still called
- One exercise already exists by exact name in `state.exercises` → that exercise's id is reused in the routine item; exercise count not incremented for that one; no duplicate in `state.exercises`
- One exercise already exists with different casing (e.g. "bulgarian split squat") → matched case-insensitively; not duplicated
- Exercise with `metricMode: "seconds"` (Copenhagen Plank) → created exercise has `type: "duration"`; all its sets have `type: "duration"`
- Exercise with `reps: null` (Pull-ups "4 × max") → sets have `reps: null` (blank in app)
- `item.note` on each routine item matches the JSON `note` string for that exercise
- `state.muscleTagLibrary` absent → function initialises it and populates both `primary` and `detailed` without throwing
- Template name matches existing routine case-insensitively → routine skipped; no duplicate; `templatesAdded` not incremented for that template
- Invalid input (null, non-array, array items missing `templateName`) → returns `{ templatesAdded: 0, exercisesAdded: 0 }` immediately; no state mutations

**Verification:** From the browser console: paste the `data/templates.json` content, call `importTemplatesFromJSON(parsed)`. Inspect `state.routines.length`, `state.exercises.length`, `state.muscleTagLibrary`. Call again and confirm counts are 0.

---

### U2. Import button and FileReader UI (`index.html`)

**Goal:** Add the "↑ Import Templates" ghost button and wired hidden file input to `WorkoutsView`, connecting the file picker to `importTemplatesFromJSON` and handling the result toast and re-render.

**Requirements:** Feature 2 — button placement, file picker, toast, re-render after import

**Dependencies:** U1

**Files:**
- `index.html` (modify — `WorkoutsView` component)

**Approach:**
Add `const fileInputRef=useRef(null)` near the top of `WorkoutsView`.

Place a hidden file input and the button after the routines list (after the closing `</div>` of the `routines.map(...)` block, before the component's closing `</div>`):

```jsx
<input ref={fileInputRef} type="file" accept=".json" style={{display:'none'}}
  onChange={e=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      let parsed;
      try{ parsed=JSON.parse(ev.target.result); }
      catch{ toast('Invalid file'); return; }
      if(!Array.isArray(parsed)){ toast('Invalid file'); return; }
      const {templatesAdded,exercisesAdded}=importTemplatesFromJSON(parsed);
      toast(templatesAdded===0&&exercisesAdded===0
        ?'Nothing new to import'
        :`Imported ${templatesAdded} template(s) and ${exercisesAdded} exercise(s)`);
      refresh();
    };
    reader.readAsText(file);
    e.target.value='';
  }}/>
<button className="gh"
  style={{width:'100%',height:44,fontSize:13,marginTop:16}}
  onClick={()=>fileInputRef.current.click()}>
  ↑ Import Templates
</button>
```

Note: `e.target.value=''` is set before `reader.onload` fires (it resets the input synchronously so the same file can be re-selected on a second tap).

**Patterns to follow:** `useRef` (used in `AddExerciseToSession`), `refresh()` call on the "+ New" template button handler, `toast()` global, existing ghost button `className="gh"` styling

**Test scenarios:**
- Button renders at the bottom of the Templates section with the routines list empty and also when it has items
- Tapping button triggers the OS file picker (verify in browser — can't unit-test)
- Selecting a valid `data/templates.json` → 3 templates appear in the list immediately without page reload; toast shows "Imported 3 template(s) and 41 exercise(s)"
- Selecting the same file a second time → toast "Nothing new to import"; list unchanged
- Selecting a file with invalid JSON text → toast "Invalid file"; list unchanged
- Selecting a valid JSON file that is not an array (e.g. `{}`) → toast "Invalid file"; list unchanged
- Cancelling the file picker without selecting a file → no toast, no change, no error
- Closing and reopening the file picker after a successful import and selecting the same file again works (input value was reset)

**Verification:** Open `http://localhost:5174`. Scroll to the bottom of the Templates section. Tap "↑ Import Templates". Select `data/templates.json`. Confirm 3 templates appear (Workout A, B, C). Open each template and confirm exercises are listed with sets and coaching notes visible.

---

## Scope Boundaries

**In scope:**
- `importTemplatesFromJSON` function in `app.js`
- Import button and FileReader handler in `WorkoutsView` (`index.html`)
- Muscle tag library population from import data

**Deferred to Follow-Up Work:**
- Morning Routine import (requires separate parser — different column structure)
- Template name transformation (names imported verbatim from JSON; user can rename in-app)
- Overwrite/merge mode on re-import (currently skip-on-conflict only)
- Weight pre-filling in imported sets (all start as `null`)

**Out of scope:**
- Editing `data/templates.json` from inside the app
- Syncing templates from a live external source
