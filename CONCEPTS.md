# Forge PWA — Domain Concepts

Core vocabulary for the Forge workout tracker. Each entry is what the term means in this codebase — precise enough that a new engineer can follow tickets and code without guessing.

---

## Workout Data Model

### Exercise
A reusable named movement definition: has a type (`weight` or `duration`), a category, and optional primary and detailed muscle group strings. An Exercise is a definition — it does not carry per-session data. The same Exercise can appear in many Routines.
*Avoid: movement, exercise definition*

### Routine
A named, ordered template of exercises used to plan a workout session. Each Routine has a list of Routine Items. In the UI, Routines are labelled "Templates"; in code and state, they are `routines`.
*Avoid: template, workout template*

### Routine Item
A single exercise slot within a Routine, binding an Exercise to its configuration: `metricMode`, an optional coaching `note`, and a list of Sets. A Routine Item is not an Exercise — it is the exercise *in context*, and two Routines can contain the same Exercise via separate Routine Items.

### Set
One work unit within a Routine Item — carries `type`, `tag`, `weight`, `reps`, and a `completed` flag. Sets are created from the Routine's template when a workout session is logged.

**Set tag enum** (`normalizeSetTag` → canonical form):
- `"work"` — default; contributes to volume, PR detection, and overload evaluation
- `"failure"` — set ended at muscular failure; counted toward stall detection
- `"drop"` — drop set; uses drop-rest-period setting
- `"warmup"` — auto-generated or manually added warm-up; excluded from PR detection, volume stats, weekly rollup, and overload evaluation; displayed as "WU" in set rows

Tag metadata (label, short abbreviation) is centralised in `TAG_META` in `app.js`.

### Exercise fields (notable)
- `progressionIncrement` — optional number (kg). When set, enables the progressive overload engine: after a clean session (all work sets completed, no failures) the app surfaces a weight suggestion of `last weight + increment` for the next session.

### Muscle Tag Library
A deduplicated, sorted store of muscle group strings (`state.muscleTagLibrary.primary` and `.detailed`). Populated when exercises are created or imported. Drives the tag autocomplete in the exercise editor. Each new import pass adds any strings not already present; existing strings are never removed.

### metricMode
A per-Routine-Item flag controlling how a set is tracked: `"reps"` (count of repetitions) or `"seconds"` (duration). Determines the label shown during a session and the `type` field on each Set (`"weight"` for reps, `"duration"` for seconds).

---

---

## Features (current as of 2026-06-11)

- **Previous-session reference** — each set row shows the prior session's weight/reps as dimmed tap-to-fill hints (`getLastSessionSetsForExercise`)
- **Session summary + PR detection** — `SessionSummarySheet` appears after every workout; PR = all-time heaviest for that exercise at that rep count (`getSessionPRs`)
- **Progressive overload engine** — per-exercise `progressionIncrement`; suggest next weight or deload prompt (`getProgressionStatus`)
- **52-week consistency heatmap** — `ConsistencyHeatmap` on the Forge tab (removed from Stats tab)
- **Rest timer** — auto-start on set completion (toggle in Tools); optional audio alert via Web Audio API; −15s / +15s adjustment buttons
- **Weekly muscle load rollup** — `MuscleLoadRollup` chips above Templates on the Forge tab (`getWeeklyMuscleRollup`)
- **Warmup set auto-generator** — "Add Warmups" button on exercise items when a previous working weight is known; inserts 50% × 5, 70% × 3, 85% × 1 sets tagged `"warmup"` (`addWarmupSets`)
- **WOD card** — fetches `data/wod.json` and renders today's scheduled session; tapping it starts the matched routine
- **Template import** — JSON file import via `importTemplatesFromJSON`; deduplicated by name
- **Body log** — weight + body-fat measurements over time with chart in Stats

---

## Flagged ambiguities

- `"template"` had been used in product copy for what the code calls a `routine`. These are the same thing — the UI now says "Templates" and the state key is `routines`.
