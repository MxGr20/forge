---
date: 2026-06-09
topic: forge-features
focus: what interesting features could I add next
mode: repo-grounded
---

# Ideation: Forge PWA — Next Features

## Grounding Context

**App:** Forge — React PWA workout tracker. Offline-first, Babel runtime JSX, Supabase auth + localStorage + IndexedDB state.

**Already exists:** exercise library (41 exercises), 3 routine templates, in-session logging, set tags (work/failure/drop), exercise performance charts (1RM + volume), muscle group analytics per session, body measurements, plate calculator, CSV/JSON export+import, stats module with multi-month filter, rest timer (+15s/-15s), WOD card (from data/wod.json), per-exercise notes, template JSON import, Supabase cloud sync.

**Key gaps identified:** No previous-session values visible during active workout; no PR detection; no session summary screen; no progressive overload suggestions; no warmup set auto-generator; no audio cue at rest timer expiry; no training consistency heatmap; no weekly muscle load rollup.

**External signal:** Highest-impact feature across all competing apps = previous performance visible inline during logging (Hevy PREVIOUS column). PR detection + session summary = second cluster. Progressive overload rule (StrongLifts) = third. These three convert a logger into a tracker.

## Topic Axes

1. in-session experience
2. progress visibility
3. planning & prescription
4. data portability & trust
5. body & recovery

## Ranked Ideas

### 1. Previous-Session Reference Column
**Description:** Each set row shows last session's weight × reps as dimmed ghost text. One tap auto-fills the current set. No navigation to history required — the information arrives at the exact moment it's needed. The data pipeline already exists (app.js fetches lastItem.sets when adding exercises); this is a render-layer change only.
**Axis:** in-session experience
**Basis:** `direct:` app.js already fetches lastItem.sets and pre-fills inputs — values are silently overwritten on first keystroke. `external:` Hevy's PREVIOUS column is the most-cited QOL feature across every workout app review.
**Rationale:** Every set starts with a blank field and a memory tax. Removing both without adding complexity.
**Downsides:** Requires previous-session data to be queryable per exercise per routine — worth verifying current state shape.
**Confidence:** 95% | **Complexity:** Low | **Status:** Unexplored

---

### 2. Session Summary + PR Detection
**Description:** After finishing a workout, show a one-screen recap: total volume, duration, exercises completed, and a badge for every set that beat the previous best weight or reps. Natural place to add a final note before returning to the main view.
**Axis:** progress visibility
**Basis:** `direct:` app.js endWorkout() stamps endedAt and calls saveState() with a plain toast — no summary rendered. Performance chart infrastructure already computes 1RM and volume; PR detection is a comparison against existing data. `external:` PR detection + session summary is the second most-cited missing feature in workout app reviews.
**Rationale:** Without a recap, users have no immediate sense of progress. Creates the motivational payoff that converts logging into a habit.
**Downsides:** PR detection needs a definition (all-time best set? best for this rep count?). Requires completed-session history to be queryable.
**Confidence:** 90% | **Complexity:** Low–Medium | **Status:** Unexplored

---

### 3. Rule-Based Progressive Overload + Stall Detection
**Description:** Each exercise gets an optional rule: if all work sets met the rep target last session → suggest +2.5 kg next session. If failure-tagged sets appear in two or more of the last three sessions on the same exercise → surface a deload prompt. No AI, no server — purely a query against existing set tags and history.
**Axis:** planning & prescription
**Basis:** `direct:` Set tags (work/failure/drop) are stored in app.js but never acted on programmatically. `external:` StrongLifts' complete-all-reps → add-weight rule is proven prior art; it works offline and requires no personalisation for novice-to-intermediate lifters.
**Rationale:** Progressive overload is the primary driver of strength gains; it is currently 100% manual. A two-state rule machine closes the gap between tracker and coach.
**Downsides:** Needs configurable increment per exercise (2.5 kg default ≠ right for every lift). Linear progression stalls for advanced lifters — v2 problem.
**Confidence:** 85% | **Complexity:** Low–Medium | **Status:** Unexplored

---

### 4. Workout Consistency Heatmap
**Description:** A 52-week GitHub-style heatmap (7 columns × 52 rows) built from workout.createdAt timestamps. Each day cell is coloured by whether a session was logged; tapping a cell shows that day's workout name. Lives in the Stats section.
**Axis:** progress visibility
**Basis:** `direct:` state.workouts already contains createdAt and endedAt for every session — a date histogram is one pass over existing data with no schema changes. `external:` GitHub contribution graph is the canonical UX for frequency-over-time; Strava's consistency score is the fitness equivalent.
**Rationale:** Volume and strength trends are charted, but consistency — the strongest long-term predictor of progress — is invisible. A four-week gap is immediately visible.
**Downsides:** At 480px width, 52 columns is tight — may need a monthly condensed view for small screens.
**Confidence:** 90% | **Complexity:** Low | **Status:** Unexplored

---

### 5. Rest Timer: Auto-Start on Set Log + Audio Cue on Expiry
**Description:** (a) Countdown begins automatically when the user taps set completion — no separate start tap. (b) A short synthesised tone plays via Web Audio API when countdown hits zero (no asset, no permissions prompt). Both toggleable in settings.
**Axis:** in-session experience
**Basis:** `direct:` Rest timer requires a manual start tap after each set; clearInterval on expiry has no side effect (no sound, no vibration). `reasoned:` A completed set always means rest begins — a step performed identically every time is an automation candidate. Audio is the only viable channel when the phone is pocketed.
**Rationale:** A 20-set workout produces 20 wasted taps (manual start) and 20 moments of screen babysitting (silent expiry). Both disappear with one event listener and 5 lines of Web Audio.
**Downsides:** Auto-start could annoy users who log a set before they're physically done with it. Settings toggle mitigates this.
**Confidence:** 92% | **Complexity:** Very Low | **Status:** Unexplored

---

### 6. Weekly Muscle Group Load Rollup
**Description:** Aggregate per-session volume-per-muscle-group (already computed in stats) into a rolling 7-day window. Surface as a simple bar or number on the session planning screen: "Quads: 12 sets this week." Tells the user what is loaded vs. recovered before picking tomorrow's session.
**Axis:** body & recovery
**Basis:** `direct:` Stats module already computes per-session volume per muscle group; state.muscleTagLibrary is populated. A 7-day rollup is one reduce() over existing data. `external:` FitBod's recovery gauge is their most-cited retention driver — accuracy improves as session history grows, creating a compounding value curve.
**Rationale:** Routine selection is currently calendar-based with no load feedback. Adds data-informed recovery context with near-zero new instrumentation.
**Downsides:** Usefulness depends on consistent muscle tagging; manually-added exercises may not be tagged.
**Confidence:** 85% | **Complexity:** Low | **Status:** Unexplored

---

### 7. Warmup Set Auto-Generator
**Description:** When a user adds a compound exercise with a known working weight, a "Add Warmups" button inserts a standard ramp: 50%×5, 70%×3, 85%×1 of the working weight. Sets are tagged as warmup and excluded from progression calculations. Collapsible after acknowledgement.
**Axis:** planning & prescription
**Basis:** `direct:` app.js addWorkoutExercise already fetches lastItem.sets[0].weight — working weight is available at injection time. Set tag infrastructure (work/failure/drop) is extensible to a warmup tag. `external:` Warmup percentage calculators are a standalone app category (Bar Is Loaded, Hevy built-in), proving the manual arithmetic is real, repeated friction.
**Rationale:** Manually entering warmup sets before every compound lift is the most repetitive, zero-information entry in a strength session.
**Downsides:** Working weight must be known before warmup generation — awkward on first-ever session for a new exercise. Fixed percentages don't fit everyone.
**Confidence:** 80% | **Complexity:** Low–Medium | **Status:** Unexplored

---

### 8. Silhouette Progress — Muscle Body Map
**Description:** Replace (or supplement) the per-session muscle group pill list with a body silhouette where muscle regions fill in colour proportional to training load over the selected period. Heavily-trained regions saturate; untrained ones fade to grey. Numbers remain accessible under a tap. Built from the existing per-session muscle group analytics.
**Axis:** progress visibility
**Basis:** `direct:` Forge has per-session muscle group analytics and a muscle tag library linking exercises to regions — the data to drive a body map already exists. `external:` WHOOP strain maps, Nike Training Club muscle emphasis diagrams, and Visible Body are named prior art. `reasoned:` A faded hamstring communicates "neglected" in under one second; a list of numbers does not.
**Rationale:** Users who are not data-literate disengage from chart views. A body silhouette communicates muscle imbalances instantly and makes analytics accessible without training.
**Downsides:** Requires an SVG body diagram asset and mapping between the app's muscle tag strings and SVG regions. Medium implementation effort compared to the other ideas.
**Confidence:** 75% | **Complexity:** Medium | **Status:** Unexplored

---

## Cross-Cut Combinations

**Pre-Session Brief (#3 + #7):** Ideas 3 and 7 combine naturally into a single screen that appears when you tap "Start" on a routine — showing auto-generated warmup sets and a progression suggestion for each exercise before the first rep. Together they turn the session start from a blank slate into a ready-to-execute plan.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| — | Ghost Rep (live racing ghost) | F1.1 covers the core need; live ghost adds significant complexity |
| — | Anki-Style Adaptive Progression | Duplicates rule-based idea with high added complexity; linear covers 90% of users |
| — | Session Blueprint (plan-lock UX) | Adds "planning vs. execution mode" state; depends on session history store |
| — | Aviation Checklist Readiness | Reasoned basis only; subjective questions add friction before every session |
| — | Muscle Recovery Scheduling Primitive | Too complex without a full fatigue model; FitBod built a company on this |
| — | F1 Tire / Recovery Debt Ledger | Compelling vision, premature implementation |
| — | Portfolio Rebalancing for Volume | Requires session history + significant UI; analogy is a lens, not a plan |
| — | Training Seasons (Stardew) | High meta-complexity; "what is a season?" is an unresolved design question |
| — | Exercise-Level Progression Cycles | Advanced periodization, scope overrun |
| — | Exercise Definitions Contextual per Template | Breaks global exercise model; high architectural cost |
| — | Signed / Verifiable Export | Reasoned basis only; personal-use PWA doesn't need cryptographic provenance |
| — | Git-Style Branching History | Clever analogy; unclear value for single-user log |
| — | Training Partner Phantom | Social features are scope expansion; needs Supabase schema changes |
| — | Per-Set Notes via Long-Press | Useful but niche; current per-item notes cover most cases |
| — | RIR as First-Class Set Input | Advanced metric confusing for newer users; niche benefit |
| — | Shareable Progress Snapshot | Good v2 candidate; existing export covers the base case |
| — | Enforced Tempo (app locks UI) | Controversial; better as clearly opt-in experiment |
| — | Dark Souls Session Checkpoints | Unclear if gap exists given Supabase real-time sync |
| — | WOD Historical Comparison | Depends on session history being queryable by routine name |
| — | Automated Periodic Backup | Supabase sync may already do this; gap unclear |
| — | Export Diff View | Below meeting-test threshold |
| — | Deload Auto-Detection | Merged into idea #3 |
| — | axis: data portability & trust | No portability idea passed the meeting test — existing pipeline is adequate |
