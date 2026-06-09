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
One work unit within a Routine Item — carries `type`, `tag` (e.g. `"work"`), `weight`, `reps`, and a `completed` flag. Sets are created from the Routine's template when a workout session is logged.

### Muscle Tag Library
A deduplicated, sorted store of muscle group strings (`state.muscleTagLibrary.primary` and `.detailed`). Populated when exercises are created or imported. Drives the tag autocomplete in the exercise editor. Each new import pass adds any strings not already present; existing strings are never removed.

### metricMode
A per-Routine-Item flag controlling how a set is tracked: `"reps"` (count of repetitions) or `"seconds"` (duration). Determines the label shown during a session and the `type` field on each Set (`"weight"` for reps, `"duration"` for seconds).

---

## Flagged ambiguities

- `"template"` had been used in product copy for what the code calls a `routine`. These are the same thing — the UI now says "Templates" and the state key is `routines`.
