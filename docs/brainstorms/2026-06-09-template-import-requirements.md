# Requirements: Template Import from JSON
**Date:** 2026-06-09
**App:** Forge — Workout Tracker (React PWA, `index.html` + `app.js`)

---

## Goals

Allow workout templates defined in the Excel training plan to be imported into Forge in one tap. This seeds the exercise library, muscle group tags, and routine templates without manual entry.

---

## JSON Generation — Approach

No separate Python script is needed. The JSON files are regenerated on demand by sharing the Excel with Claude and requesting a regeneration. Claude reads all three tabs using the `anthropic-skills:xlsx` skill and writes the files directly to the project folder.

**Three separate files** (each focused, independently replaceable):

| File | Source tab | When used |
|---|---|---|
| `wod.json` | Daily Plan | Fetched on every home screen load |
| `templates.json` | Workout Details | Loaded once via the in-app import button |
| `weekly_summary.json` | Weekly Summary | Reserved for future use |

**Regeneration command:** Share the updated Excel with Claude and say `"regenerate plan JSON"`.

---

## Feature 1 — `templates.json` Schema

Produced from the "Workout Details" tab. Three workouts are in scope (Morning Routine excluded — different column structure).

### Parsing rules

**Workout headers** (e.g. `WORKOUT A — LEGS + MOBILITY + LOWER BACK  |  Monday  |  65 min`):
- Identify by: first cell is non-empty, second cell is empty, string contains "WORKOUT"
- Extract `templateName` as the full workout title before the first ` | `

**Exercise rows** — identified by having a value in both column A and column B (Sets × Reps):
- Skip rows where the name starts with `✕` (removed exercises)
- Skip section divider rows (e.g. `── MOBILITY PROTOCOL ──`)
- Skip the Morning Routine section entirely (identified by `☀️` or "MORNING ROUTINE" in column A)
- Skip column-header rows (first cell is "Exercise")

**Sets × Reps parsing** (column B):
| Input | Output |
|---|---|
| `3 × 10` | `sets: 3, reps: 10, metricMode: "reps"` |
| `3 × 10 each` | `sets: 3, reps: 10, metricMode: "reps"` |
| `4 × max` | `sets: 4, reps: null, metricMode: "reps"` |
| `3 × 20→45 sec each` | `sets: 3, reps: 45, metricMode: "seconds"` |
| `3 × 30m each` | `sets: 3, reps: 30, metricMode: "reps"` |
| `90 sec each` | `sets: 1, reps: 90, metricMode: "seconds"` |
| `10 breaths` | `sets: 1, reps: 10, metricMode: "reps"` |
| `2 × 8 each` | `sets: 2, reps: 8, metricMode: "reps"` |

Rule: if "sec" appears in the string → `metricMode: "seconds"`, use the last number as reps. Otherwise → `metricMode: "reps"`, use the last number.

**Muscle group cleaning** (columns D and E):
- Split on `,` to get individual tags
- Strip parenthetical qualifiers: `"Glutes (max)"` → `"Glutes"`, `"Adductors (inner thigh)"` → `"Adductors"`
- Trim whitespace

**Exercise name cleaning:**
- Strip `⭐` suffix: `"Copenhagen Plank ⭐"` → `"Copenhagen Plank"`

**Coaching notes** (column F): import as-is, trimmed.

### Output JSON schema

```json
[
  {
    "templateName": "Workout A — Legs + Mobility",
    "exercises": [
      {
        "name": "Bulgarian Split Squat",
        "sets": 3,
        "reps": 10,
        "metricMode": "reps",
        "primaryMuscles": ["Quads", "Glutes"],
        "secondaryMuscles": ["Hip Flexors", "Hamstrings", "Core"],
        "note": "Slow 3-sec eccentric. Knee tracks over toe."
      },
      {
        "name": "Copenhagen Plank",
        "sets": 3,
        "reps": 45,
        "metricMode": "seconds",
        "primaryMuscles": ["Adductors"],
        "secondaryMuscles": ["Hip Flexors", "Obliques", "Core"],
        "note": "NON-NEGOTIABLE. Right side priority. Build 5 sec/week."
      }
    ]
  }
]
```

### Templates in scope (3 from the Excel)

| Template name | Day | Duration |
|---|---|---|
| Workout A — Legs + Mobility | Monday | 65 min |
| Workout B — Pull + Mobility | Wednesday | 55 min |
| Workout C — Push + Mobility | Friday | 50 min |

Morning Routine (daily, 4–5 min) is **excluded** from V1 — it has a different column structure (Step/Duration/Type vs Exercise/Sets/Tempo) that requires separate parsing logic.

---

## Feature 2 — Import Button (UI)

An **"↑ Import Templates"** button at the bottom of the Templates section in `WorkoutsView` (`index.html`).

- Styled as a ghost button, same width as the "Start Workout" CTA
- Tapping triggers a hidden `<input type="file" accept=".json">` — no extra dialog or UI
- After import completes, display a toast: `"Imported X template(s) and Y exercise(s)"` (or `"Nothing new to import"` if all existed)
- Button remains visible after import (user can re-import an updated JSON)

---

## Feature 3 — Import Logic (`index.html` or `app.js`)

Triggered when the file input receives a JSON file. Runs synchronously after `FileReader` decodes the file.

### Step 1 — Validate
- Parse JSON; if invalid, show toast "Invalid file" and abort.
- Confirm top-level is an array; each item has `templateName` (string) and `exercises` (array).

### Step 2 — Ensure muscle tags exist
For every unique muscle name across all exercises and all templates:
- Check `state.muscleTagLibrary.primary` — if the name is not present, add it.
- Check `state.muscleTagLibrary.detailed` — if the name is not present, add it.

Muscle tags from `primaryMuscles` fields → `muscleTagLibrary.primary`.
Muscle tags from `secondaryMuscles` fields → `muscleTagLibrary.detailed`.

### Step 3 — Ensure exercises exist
For each unique exercise name across all templates (deduplication by lowercase name):
- Case-insensitive name match against `state.exercises`.
- **Match found:** skip (do not overwrite existing exercise data).
- **No match:** create new exercise:
  ```js
  {
    id: uid(),
    name: exercise.name,
    category: "",
    type: exercise.metricMode === "seconds" ? "duration" : "weight",
    primaryMuscleGroups: exercise.primaryMuscles.join(", "),
    detailedMuscleGroups: exercise.secondaryMuscles.join(", ")
  }
  ```

### Step 4 — Ensure templates exist
For each template in the JSON:
- Case-insensitive name match against `state.routines`.
- **Match found:** skip (do not overwrite).
- **No match:** create routine:
  ```js
  {
    id: uid(),
    name: template.templateName,
    items: template.exercises.map(ex => ({
      id: uid(),
      exerciseId: /* id of the exercise just found/created */,
      group: null,
      note: ex.note || "",
      metricMode: ex.metricMode,
      sets: Array.from({ length: ex.sets }, () => ({
        id: uid(),
        type: ex.metricMode === "seconds" ? "duration" : "weight",
        tag: "work",
        completed: false,
        weight: null,
        reps: ex.reps
      }))
    }))
  }
  ```

### Step 5 — Persist and render
- `saveState()`
- Re-render templates list
- Show result toast

---

## Scope Boundaries

**In scope:**
- Python conversion script that reads the Excel and writes `templates.json`
- Import button in the Templates section
- Exercise creation with primary + secondary muscle groups
- Template creation with sets, reps/seconds, and pre-filled coaching notes
- Skip-on-conflict for both exercises and templates

**Out of scope — V1:**
- Morning Routine import (different column structure)
- Overwriting or merging existing exercises/templates
- Weight pre-filling (all sets start with `weight: null`)
- Import of the Daily Plan WOD data (already handled by `wod.json`)
- Editing the JSON from inside the app

---

## Success Criteria

- Running `convert_templates.py` produces a valid `templates.json` with 3 templates and all exercises from Workouts A, B, C.
- Tapping "↑ Import Templates" and selecting `templates.json` results in 3 new routine templates appearing in the Templates section.
- All exercises from the import appear in the exercise library with correct primary and secondary muscle group tags.
- Coaching notes are pre-filled on each exercise card in the templates.
- Running the import a second time shows "Nothing new to import" — no duplicates created.
- Exercises already in the library are reused (not duplicated) if their name matches.
