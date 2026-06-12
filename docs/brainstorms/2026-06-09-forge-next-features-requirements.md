---
date: 2026-06-09
topic: forge-next-features
---

# Forge Next Features — Requirements

## Summary

Eight features for the Forge workout tracker: in-session reference data from the previous session, a post-workout summary with PR detection, rule-based progressive overload and stall detection, a 52-week consistency heatmap, rest timer auto-start and audio cue, a weekly muscle load rollup before session selection, warmup set auto-generation, and an SVG body silhouette integrated into the Muscle Volume stats section.

## Key Decisions

**PR definition:** A set is a PR when its weight is the all-time heaviest recorded for that exercise at exactly that rep count. First-ever sets always qualify.

**Progressive overload applies to work-tagged sets only:** Warmup, failure, and drop tags are excluded from the completion check; only work-tagged sets determine whether the rep target was met.

**Warmup percentages are fixed in v1:** The ramp is 50% × 5, 70% × 3, 85% × 1 of the previous working weight. Per-exercise configuration is deferred.

**Auto-start on by default; audio off by default:** Auto-start preserves timer utility without added friction. Audio is off by default to avoid unexpected tones in shared gym environments. Both toggles live in the Tools tab alongside existing settings.

**Silhouette and bar chart co-exist in one view:** The SVG silhouette renders above the existing bar chart in Muscle Volume — same data pipeline, two representations, no toggle. The time range selector gains a 1w option (1w / 4w / 8w / 12w); selecting a range updates both.

## Requirements

**Previous-Session Reference**

R1. Each set row in the active workout displays the previous session's weight and reps for that exercise as dimmed reference text alongside the input fields.
R2. Tapping the reference text auto-fills the current set's weight and reps fields.
R3. Reference values are drawn from the most recent completed workout containing that exercise, regardless of which routine was used.
R4. When no previous session exists for an exercise, the reference area is absent.

**Session Summary + PR Detection**

R5. After a workout ends, a summary screen appears before returning to the main view, showing total volume, duration, exercise count, and PR badges.
R6. A PR badge appears on any completed set whose weight is the all-time heaviest recorded for that exercise at that exact rep count.
R7. First-ever sets for a new exercise receive a PR badge.
R8. Warmup-tagged sets are excluded from PR detection.
R9. The summary screen includes a free-text note field; the note is persisted to the workout record.
R10. Dismissing the summary returns the user to the Workouts view.

**Rule-Based Progressive Overload + Stall Detection**

R11. Each exercise supports an optional progression rule with a configurable weight increment (default 2.5 kg).
R12. The progression condition is met when all work-tagged sets in the most recent session for that exercise completed their target rep count.
R13. When the progression condition is met, the system surfaces a weight suggestion for that exercise at the start of the next session containing it.
R14. The stall condition is met when failure-tagged sets appear in two or more of the last three sessions for the same exercise.
R15. When the stall condition is met, the system surfaces a deload prompt for that exercise at the start of the next session containing it.
R16. Only work-tagged sets are evaluated for R12; warmup, failure, and drop tags do not contribute.

**Workout Consistency Heatmap**

R17. The Stats section includes a 52-week heatmap, 7 columns (days of the week) × 52 rows (weeks), built from workout `createdAt` timestamps.
R18. Cells are coloured to indicate whether a workout was logged on that day; no-workout days are visually distinct.
R19. Tapping a cell with a logged workout displays that day's workout name.

**Rest Timer: Auto-Start + Audio Cue**

R20. When auto-start is enabled, the rest timer starts automatically when a set is marked complete, using the existing configured rest duration.
R21. When audio is enabled, a short synthesised tone plays via Web Audio API when the countdown reaches zero.
R22. Auto-start is on by default; audio is off by default.
R23. Both settings are present in the Tools tab alongside existing settings.
R24. The audio tone uses a Web Audio API oscillator — no audio file asset required, no permissions prompt.

**Weekly Muscle Group Load Rollup**

R25. The routine selection screen displays a 7-day rolling set count per muscle group before the user starts a session.
R26. Muscle groups with zero sets in the rolling 7-day window are omitted from the display.
R27. The rollup reuses the muscle group data already computed in the stats pipeline; no new data instrumentation is required.

**Warmup Set Auto-Generator**

R28. When an exercise is added to an active workout and a previous working weight is known, an "Add Warmups" button appears on that exercise item.
R29. Tapping "Add Warmups" inserts three sets at the top of the exercise's set list: 50% × 5 reps, 70% × 3 reps, 85% × 1 rep, calculated from the previous working weight and rounded to the nearest 2.5 kg.
R30. Inserted sets carry a new "warmup" tag, extending the existing work / failure / drop enum.
R31. Warmup-tagged sets are excluded from PR detection (R6–R8) and progressive overload evaluation (R12, R16).
R32. The working weight source is the weight from the first work-tagged set of the most recent completed session for that exercise.
R33. When no previous working weight exists, the "Add Warmups" button is not shown.

**Silhouette Body Map** *(implemented then removed — 2026-06-11)*

R34. ~~The Muscle Volume section in Stats renders an SVG body silhouette above the existing horizontal bar chart.~~ *Implemented and later removed; bar chart alone is sufficient.*
R35. ~~Muscle regions on the silhouette are filled proportionally to set volume over the selected time period; untrained regions render in grey.~~ *Implemented; removed with R34.*
R36. The time range selector gains a 1w option, making it 1w / 4w / 8w / 12w; selecting a range updates the bar chart. *(Retained.)*
R37. ~~Muscle group strings not mappable to a silhouette region are ignored in the silhouette but remain in the bar chart.~~ *Moot — silhouette removed.*

## Key Flows

**Session Summary**

**Trigger:** User taps "End Workout."

1. `endWorkout()` stamps `endedAt`. The system compares each completed work-tagged set against the all-time best weight at that rep count for the exercise.
2. Summary screen renders: total volume, duration, exercise count, PR badges on qualifying sets.
3. User optionally adds a session note; note is saved to the workout record.
4. User dismisses → Workouts view.

**Covers R5–R10.**

---

**Progressive Overload Evaluation**

**Trigger:** A workout containing exercises with active progression rules is completed.

1. For each exercise with a rule, the system checks whether all work-tagged sets met their target rep count.
2. If the progression condition is met: the incremented weight is used as the pre-fill suggestion for that exercise in the next session.
3. If the stall condition is met (failure tags in ≥ 2 of the last 3 sessions): a deload prompt appears at the start of the next session containing that exercise.

**Covers R11–R16.**

---

**Warmup Generation**

**Trigger:** User adds an exercise to an active workout.

1. System checks for a previous working weight (first work-tagged set in the most recent completed session for that exercise).
2. If weight found: "Add Warmups" button appears on the exercise item.
3. User taps the button → three warmup sets inserted at the top of the set list: 50% × 5, 70% × 3, 85% × 1, tagged warmup.
4. Warmup sets appear visually distinct from work sets.

**Covers R28–R33.**

## Acceptance Examples

**AE1. PR detection — qualifying and non-qualifying**

**Covers R6, R7, R8.**

- All-time best for Squat at 5 reps: 100 kg. Current set: 102.5 kg × 5 → PR badge.
- All-time best for Squat at 8 reps: none. Current set: 80 kg × 8 → PR badge (first at this rep count).
- Current set: 100 kg × 5 (matches existing best, not a new record) → no badge.
- First-ever set of Romanian Deadlift → PR badge.
- Warmup set on Squat at 50 kg × 5 → no badge regardless of history.

**AE2. Progression condition with mixed set tags**

**Covers R12, R16.**

- 3 work sets, all completing target reps → condition met, weight suggestion fires.
- 3 work sets, one failure-tagged → condition not met.
- 2 work sets + 3 warmup sets, both work sets completing target reps → condition met (warmup sets excluded from evaluation).

**AE3. Warmup button visibility**

**Covers R32, R33.**

- Bench Press added; most recent session had a work set at 80 kg → "Add Warmups" appears.
- Romanian Deadlift added for the first time → no "Add Warmups" button.
- Romanian Deadlift added; most recent session had only warmup-tagged sets, no work sets → no "Add Warmups" button.

**AE4. Rest timer auto-start and audio**

**Covers R20–R22.**

- Auto-start on, audio off: user marks set complete → timer starts automatically; expires silently (existing "Rest complete" toast still shows).
- Auto-start on, audio on: timer expires → synthesised tone plays.
- Auto-start off: user marks set complete → timer does not start; user must tap manually as before.

## Scope Boundaries

- Progressive overload: AI-based or periodization models — deferred.
- Warmup generator: user-configurable warmup percentages — deferred to v2; users may edit or delete individual warmup sets as a workaround.
- Silhouette body map: tapping a region to filter or drill into exercise history — deferred to v2.
- Session summary: sharing or exporting the summary screen.
- Rest timer: haptic vibration on expiry — not universally available across devices.
- PR tracking: all PRs are exercise-wide across any routine; routine-specific or WOD-specific PR scoping is out.

## Sources / Research

- `app.js` line 1235–1260: `addWorkoutExercise` — fetches `lastItem.sets`, pre-fills weight and reps; R1–R4 and R28–R33 build directly on this pipeline.
- `app.js` line 1187–1196: `endWorkout` — stamps `endedAt`, calls `saveState()` with a toast; R5–R10 summary screen inserts after this call.
- `app.js` line 1000–1050: `restTimer` module — `startTimer` / `stopTimer` / `updateTimerUI`; R20–R24 hook into set-completion events.
- `app.js` line 506–561: `buildStatsDataSnapshot` — computes `exercisePerformance` and `muscleGroupSets`; R6 PR lookup, R25–R27 rollup, and R34–R37 silhouette all draw from this snapshot.
- `app.js` line 119–129: `state.muscleTagLibrary` and `state.muscleGroupSets` shape.
- `index.html` line 791–910: `StatsView` — Exercise Progress chart, Muscle Volume bars with 4w / 8w / 12w selector, body measurements; R17–R19 heatmap and R34–R37 silhouette extend this view.
- `CONCEPTS.md` — canonical set tags (work / failure / drop), metricMode, Exercise vs Routine Item distinctions.
- `docs/ideation/2026-06-09-forge-features-ideation.md` — source ideation with axis, basis, rationale, and confidence for all 8 features.
