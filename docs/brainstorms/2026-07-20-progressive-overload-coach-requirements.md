---
date: 2026-07-20
topic: progression-coach-v2
status: implemented
---

# Progression Coach v2 — Brainstorm

## Recommendation

Replace the current clean-session banner with a **Next Target coach** based on double progression.

For each enabled routine exercise, Forge should tell the user exactly what to do next: keep the weight and add a rep, increase the weight and reset to the bottom of the rep range, repeat a missed target, or consider a small deload after two consecutive misses.

The target should be visible and prefilled during the workout, with a short explanation based on the previous attempt.

## Why this feature

1. **It removes mental arithmetic.** The user sees one concrete prescription such as `22.5 kg · 8 / 8 / 8`.
2. **It progresses conservatively.** Weight only increases after every planned work set reaches the top of its rep range.
3. **It needs no extra RPE or RIR logging.** Forge can compare planned targets with the weight, reps, and completion data it already records.

The 2026 ACSM resistance-training guidance emphasizes consistency and individualization over complex programming. A small, explainable rule engine fits Forge better than an opaque “AI coach.”

## Current Forge behavior and gaps

Forge already supports an exercise-level `progressionIncrement` and shows either:

- `Try X kg today`, when the previous session contains work sets and no failure tag.
- A deload prompt, when failure tags appear in at least two of the last three sessions.

This is not reliable enough to guide training:

- A work set does not need to be completed for the current logic to call the session successful.
- Actual reps are not compared with a saved target.
- The current React session screen does not expose failure-tag editing, so stall detection is difficult to trigger naturally.
- The rule is stored on the global Exercise, although the same exercise can have different goals in different Routines.
- The banner suggests more weight but does not apply a complete set-by-set target.

## Product concept

### Setup

Progression is configured on a **Routine Item**, not the global Exercise.

The template editor gets a compact `Progression` section:

- Enabled: off by default.
- Rep range: minimum and maximum reps, for example `8–10`.
- Weight step: for example `2.5 kg`.
- Planned work sets: derived from the Routine Item's existing work sets.

When progression is first enabled, Forge uses the Routine Item's current reps as the minimum and suggests a maximum two reps higher. The user can change both values.

### During a workout

The exercise card shows one compact target block:

```text
NEXT TARGET
22.5 kg · 8 / 8 / 8
Completed 20 kg · 10 / 10 / 10 last time
```

The target weight and reps are prefilled into the work-set rows. They remain fully editable. Warmup and drop sets are unaffected.

### After a workout

The session summary shows one outcome per enabled exercise:

- `Target hit — load increases next time`
- `Progress made — add 1 rep per set next time`
- `Target missed — repeat next time`
- `Stalled twice — consider a 10% deload`

No extra confirmation screen is required.

## Progression rules

Only the planned work sets count. Warmups, drop sets, and unplanned bonus sets are ignored.

### 1. Establish a baseline

If there is no previous attempt for this Routine Item, use the template's current weight and reps. Do not label this as progress yet.

### 2. Add reps within the range

If the prior target was completed but at least one set was below the top of the rep range:

- Keep the same weight.
- Add one rep to every set that is still below the maximum.

Example with a range of `8–10`:

```text
Last: 20 kg · 10 / 9 / 8
Next: 20 kg · 10 / 10 / 9
```

### 3. Add weight at the top of the range

If every planned work set was completed at the top of the rep range:

- Add the configured weight step.
- Reset every planned set to the bottom of the rep range.

```text
Last: 20 kg · 10 / 10 / 10
Next: 22.5 kg · 8 / 8 / 8
```

### 4. Repeat a missed target

If at least one planned set was completed but the full prescription was not achieved:

- Repeat the same target next time.
- Explain which set missed its prescribed weight or reps.

An exercise with zero completed work sets is treated as skipped, not failed.

### 5. Suggest a deload after two misses

After two consecutive failed attempts for the same Routine Item:

- Suggest reducing the working weight by 10%, rounded to the configured weight step.
- Never apply the deload silently; show `Apply deload` and `Repeat target` actions.
- Reset the miss streak after a successful target or an accepted deload.

## Important data decision

Forge must store a **progression snapshot** on each Workout Item when the session starts. It should contain the prescribed set targets and the active rule at that moment.

This separates:

- the target Forge prescribed;
- the actual values the user logged;
- later edits to the Routine.

Without this snapshot, historical success cannot be evaluated reliably after a template changes.

## MVP scope

Include:

- Weighted, rep-based Routine Items.
- Per-Routine-Item enablement, rep range, and load increment.
- Set-by-set target calculation and prefill.
- Workout target card with a plain-language reason.
- Session-summary outcome.
- Repeat and two-miss deload logic.
- Automatic migration of the existing exercise-level increment as a suggested value, without deleting the legacy field immediately.

Defer:

- RPE/RIR inputs.
- AI-generated programming.
- Automatic set-count changes.
- Periodization blocks.
- Progression for duration, distance, assisted, and bodyweight-only exercises.
- Fatigue or readiness scoring.

## Edge cases

- The same Exercise in two Routines progresses independently.
- The same Exercise appearing twice in one Routine is tracked by Routine Item identity, not only Exercise ID.
- Added bonus sets do not block progression.
- Removing a planned set during a workout counts as a miss only if another planned work set was attempted; otherwise the exercise is skipped.
- Editing old workout history recalculates the next target the next time a session starts.
- A manually edited target remains the actual session prescription and is captured in the snapshot.
- Invalid rules, such as minimum reps above maximum reps or a zero increment, cannot be saved.

## Acceptance examples

### Full progression

Given `3 sets`, range `8–10`, and step `2.5 kg`:

- `20 kg · 10 / 10 / 10`, all complete → next target `22.5 kg · 8 / 8 / 8`.
- `20 kg · 10 / 9 / 8`, all prescribed targets complete → next target `20 kg · 10 / 10 / 9`.
- Target `20 kg · 10 / 10 / 9`, actual `20 kg · 10 / 8 / 9` → repeat `20 kg · 10 / 10 / 9`.
- Two consecutive misses → offer a rounded 10% deload; do not apply automatically.

### Exclusions

- Warmup sets never affect the result.
- Drop sets never affect the result.
- A fully skipped exercise does not add to the miss streak.
- An exercise without progression enabled behaves exactly as it does today.

## Success criteria

- At workout start, the user can understand the next target and why it was chosen in under five seconds.
- The calculated target never increases after an incomplete or under-target attempt.
- A successful top-of-range session produces the correct load increase and rep reset.
- Suggestions remain editable and never overwrite completed workout history.
- Existing routines and workouts continue to load without migration errors.

## Recommended next step

Turn this concept into an implementation plan covering the state migration, pure progression evaluator, template controls, active-session target UI, and regression tests before changing production code.
