---
title: "JSON Template Import Pattern for Stateful Frontend Apps"
date: 2026-06-09
category: docs/solutions/best-practices
module: "Forge PWA / Template Import"
problem_type: best_practice
component: frontend_stimulus
severity: high
applies_when:
  - "Adding a batch JSON import feature to a stateful frontend app"
  - "Deduplicating entities by name during an import operation"
  - "Distinguishing structurally invalid input from valid-but-empty import results"
  - "Delegating normalization to a single shared factory function during import"
  - "Importing data that must seed a secondary library as a side effect of the import"
tags:
  - json-import
  - state-mutation
  - deduplication
  - batch-import
  - file-reader
  - pwa
  - normalization
  - error-signaling
related_components:
  - tooling
---

# JSON Template Import Pattern for Stateful Frontend Apps

## Context

Forge tracks workouts using exercise definitions, muscle tag libraries, and routine templates — all stored in local state. When adding a set of curated workout templates (41 exercises across three routines in `data/templates.json`), entering each entry manually through the UI was impractical and error-prone. The app needed a one-tap import path that could read a JSON file, seed all three data layers atomically, and be safe to run multiple times without creating duplicates.

The gap was not just "bulk insert" — it was doing so in a way that respected the existing data model, reused the app's normalization primitives, and gave the user accurate feedback distinguishing a malformed file from a valid-but-already-imported one.

---

## Guidance

Split the implementation along a clear boundary: state mutation lives in `app.js`; the file-picking UI lives in the React component.

### State layer: `importTemplatesFromJSON(data)` in `app.js`

The function returns `null` for structurally invalid input and `{ templatesAdded, exercisesAdded }` for valid input (even if both counts are zero). This distinction is the caller's signal for which toast to show.

```javascript
function importTemplatesFromJSON(data) {
  // Validate: null = bad file, {0,0} = valid but nothing new
  if (!Array.isArray(data) || data.length === 0) return null;
  const valid = data.every(t => typeof t.templateName === "string" && Array.isArray(t.exercises));
  if (!valid) return null;

  // Extract local helper to avoid duplicating the ternary in two places
  const typeOf = m => m === "seconds" ? "duration" : "weight";

  // Seed muscle tag library (rememberMuscleTags deduplicates internally)
  rememberMuscleTags("primary",
    data.flatMap(t => t.exercises.flatMap(ex => (ex.primaryMuscles || []).filter(Boolean))));
  rememberMuscleTags("detailed",
    data.flatMap(t => t.exercises.flatMap(ex => (ex.secondaryMuscles || []).filter(Boolean))));

  // Build lookup map once — O(1) per exercise lookup, not O(N) scan inside the loop
  const existingMap = Object.fromEntries(
    state.exercises.map(e => [(e.name || "").toLowerCase(), e.id])
  );
  const nameToId = {};
  let exercisesAdded = 0;

  data.forEach(t => t.exercises.forEach(ex => {
    const key = (ex.name || "").toLowerCase().trim();
    if (!key || nameToId[key] !== undefined) return;
    if (existingMap[key] !== undefined) {
      nameToId[key] = existingMap[key];  // reuse existing exercise
    } else {
      const created = normalizeExercise({   // single source of truth for normalization
        id: uid(), name: ex.name, category: "",
        type: typeOf(ex.metricMode),
        primaryMuscleGroups: ex.primaryMuscles || [],
        detailedMuscleGroups: ex.secondaryMuscles || []
      });
      state.exercises.push(created);
      nameToId[key] = created.id;
      exercisesAdded++;
    }
  }));

  // Find-or-create routine templates
  let templatesAdded = 0;
  data.forEach(t => {
    const nameLower = t.templateName.toLowerCase();
    if (state.routines.find(r => (r.name || "").toLowerCase() === nameLower)) return;
    state.routines.push({
      id: uid(), name: t.templateName,
      items: t.exercises.map(ex => {
        const key = (ex.name || "").toLowerCase().trim();
        return {
          id: uid(), exerciseId: nameToId[key] || null,
          group: null, note: ex.note || "", metricMode: ex.metricMode,
          sets: Array.from({ length: ex.sets > 0 ? ex.sets : 1 }, () => ({
            id: uid(), type: typeOf(ex.metricMode),
            tag: "work", completed: false, weight: null, reps: ex.reps ?? null
          }))
        };
      })
    });
    templatesAdded++;
  });

  saveState();
  renderRoutines();
  return { templatesAdded, exercisesAdded };
}
```

### UI layer: FileReader in the React component

```jsx
const fileInputRef = useRef(null);

<input ref={fileInputRef} type="file" accept=".json" style={{display:'none'}}
  onChange={e => {
    const file = e.target.files[0];
    e.target.value = '';    // reset synchronously so re-import of same file works
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let parsed;
      try { parsed = JSON.parse(ev.target.result); }
      catch { toast('Invalid file'); return; }
      const result = importTemplatesFromJSON(parsed);
      if (result === null) { toast('Invalid file'); return; }
      const { templatesAdded, exercisesAdded } = result;
      toast(templatesAdded === 0 && exercisesAdded === 0
        ? 'Nothing new to import'
        : `Imported ${templatesAdded} template(s) and ${exercisesAdded} exercise(s)`);
      refresh();
    };
    reader.readAsText(file);
  }}/>
<button className="gh" style={{width:'100%',height:44,fontSize:13,marginTop:16}}
  onClick={() => fileInputRef.current.click()}>
  ↑ Import Templates
</button>
```

The component's only responsibilities: trigger the file picker, parse JSON, call the function, show the toast, and refresh the view.

### Service worker: add new data files to the cache asset list

When `data/templates.json` (or any new data file used by the import) is added, bump the cache version and add the file to `ASSETS` in `sw.js`. Without this, offline users won't have the data available to import.

```javascript
const CACHE = "forge-cache-v13";
const ASSETS = [
  // ...existing entries...
  "./data/wod.json",
  "./data/templates.json"   // ← add with each new data file
];
```

---

## Why This Matters

### Distinct return values for distinct failure modes

Returning `null` for a bad file and `{0,0}` for a valid-but-already-imported file lets the caller show the right message without inspecting error details. When both failure modes return the same shape, callers conflate them — often silently showing "Nothing new to import" for a file that was actually malformed.

### O(1) lookups in import loops

An `Array.find` inside a nested loop over templates and exercises is O(T × E × N) where N is the size of the existing exercise library. Building `existingMap` once before the loop collapses inner-loop lookups to O(1). This pattern applies any time you're matching imported rows against an existing collection.

### Normalization at the point of creation

Constructing an exercise object inline and pushing it to state bypasses trimming, type coercion, and muscle-group text normalization that `normalizeExercise()` enforces. Future changes to normalization logic only need to land in one place when every creation path uses the same factory function.

### Separation of UI from state mutation

The import function is fully testable from the browser console — `importTemplatesFromJSON(data)` requires no DOM involvement. The React component handles only file picking and feedback display. This boundary is worth maintaining as the feature evolves.

### Preserve existing fields when editing imported entities

If `ExerciseSheet.doSave` (or any edit form) hardcodes a field like `type: 'weight'`, saving any imported duration exercise resets its type. Use `item?.type || 'weight'` to preserve the imported value:

```jsx
// Before — clobbers imported type on save
const doSave = () => onSave({ id: item?.id || uid(), name: name.trim(), type: 'weight', ... });

// After — preserves existing type; defaults only when creating new
const doSave = () => onSave({ id: item?.id || uid(), name: name.trim(), type: item?.type || 'weight', ... });
```

---

## When to Apply

- Bulk-seeding multiple related data layers (lookup tables, definitions, templates) from a single external file.
- Import operations that must be idempotent — re-running should not create duplicates or error out.
- When the caller needs to distinguish "bad input" from "valid but nothing to do" in its feedback.
- When imported entities reference other entities created in the same pass (e.g. exercises referenced by routine items) — build the intermediary map before assembling the dependents.
- When an import has side effects on a secondary store (muscle tag library, lookup table) that must stay consistent with the primary data.

---

## Examples

### `null` vs `{0,0}` return — before and after

```javascript
// Before: invalid files returned the same shape as "nothing new"
if (!valid) return { templatesAdded: 0, exercisesAdded: 0 };
// Caller showed: "Nothing new to import" ← wrong for a malformed file

// After: null signals structural failure; {0,0} signals valid-but-already-imported
if (!valid) return null;
// Caller checks result === null first → "Invalid file"
// Caller checks {0,0} → "Nothing new to import"
```

### Lookup map — before and after

```javascript
// Before — O(N) scan per exercise per template
data.forEach(t => t.exercises.forEach(ex => {
  const existing = state.exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
  const id = existing ? existing.id : createAndPushExercise(ex);
  nameToId[ex.name.toLowerCase()] = id;
}));

// After — map built once, O(1) per lookup
const existingMap = Object.fromEntries(state.exercises.map(e => [(e.name||"").toLowerCase(), e.id]));
data.forEach(t => t.exercises.forEach(ex => {
  const key = ex.name.toLowerCase().trim();
  nameToId[key] = existingMap[key] !== undefined ? existingMap[key] : createAndPushExercise(ex);
}));
```

### Sets guard — explicit comparison vs falsy

```javascript
// Before — treats explicit 0 as "missing"
length: ex.sets || 1

// After — only positive values used; 0 and absent both default to 1
length: ex.sets > 0 ? ex.sets : 1
```

### WOD fetch error vs no-WOD — sentinel string pattern

When `fetch` rejects, store a sentinel string rather than `null`/`undefined` so the component can distinguish the error state from "still loading" and "loaded but empty":

```jsx
const [wods, setWods] = useState(null);    // null = loading
useEffect(() => {
  fetch('./data/wod.json')
    .then(r => r.json())
    .then(data => setWods(data))
    .catch(() => setWods('error'));          // 'error' = fetch failed
}, []);

const wodError = wods === 'error';
const todayWod = Array.isArray(wods)
  ? wods.find(w => w.date === today) || null
  : undefined;
// undefined = still loading; null = loaded, no match; 'error' = fetch failed
```

---

## Related

- `docs/plans/2026-06-09-002-feat-template-import-plan.md` — implementation plan for this feature
- `docs/brainstorms/2026-06-09-template-import-requirements.md` — original requirements document
