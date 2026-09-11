---
title: "Muscle Volume Category Remapping"
date: 2026-09-11
status: completed
---

# Muscle Volume Category Remapping

## Problem

The Muscle Volume overview (Stats tab) groups every exercise's muscle tags into canonical categories via `mapMuscleToCanonicalGroups` in `app.js`. Two issues make the chart less insightful than it should be:

1. **Overstuffed "Other" bucket.** 13 muscle strings in the curated templates fall through to "Other" because the mapping regex misses them — mostly near-misses (`Peroneals` vs `peroneus`, `Tibialis Posterior` vs `Tibialis Anterior`, `Infraspinatus` as a rotator-cuff muscle) plus functional hip groups.
2. **Dead leg categories.** `Glutes`, `Hamstrings`, `Quadriceps`, and `Calves` exist in `CANONICAL_MUSCLE_GROUPS` but the mapper collapses everything into `Upper Legs` / `Lower Legs`, so those four bars never appear. The exercise editor's muscle picker still offers them, so a user who tags "Glutes" sees it silently rewritten to "Upper Legs" in the chart. For a leg/hip/glute-focused program this blurs the most-trained areas into one bar.

## Requirements

R1. Every muscle string currently landing in "Other" (from `data/templates.json`) is remapped to a specific existing category, per the mapping table below.

R2. The leg buckets are un-collapsed: glute, quadriceps, hamstring, and calf tags map to their own canonical categories (`Glutes`, `Quadriceps`, `Hamstrings`, `Calves`) rather than to `Upper Legs` / `Lower Legs`.

R3. `Upper Legs` remains the home for generic thigh/hip terms (`Legs`, hip flexors, iliopsoas, connective tissue). `Lower Legs` remains the home for shin/ankle/stabiliser terms (tibialis, peroneus, achilles, ankles, TFL) — distinct from the calf complex.

R4. The muscle picker offered in the exercise editor stays consistent with what the chart can display — no canonical group is offered that the mapper can never populate.

R5. Existing correct mappings are preserved; this is additive/corrective, not a rewrite of the classifier.

## Mapping Table

### "Other" → specific category

| Muscle string | New category | Rationale |
|---|---|---|
| Peroneals | Lower Legs | `peroneus` matched, plural did not |
| Tibialis Posterior | Lower Legs | only `Tibialis Anterior` was matched |
| Infraspinatus | Shoulders | rotator cuff muscle (matches existing `rotator cuff` → Shoulders) |
| Anconeus | Triceps | elbow extensor, assists triceps |
| Iliopsoas | Upper Legs | hip flexor |
| Piriformis | Glutes | deep hip external rotator |
| Hip Extensors | Glutes | glutes are the prime hip extensor |
| Hip Internal + External Rotators | Glutes | glute med/min + piriformis |
| Hip Stabilisers | Glutes | glute complex |
| Hip Capsule | Glutes | hip-joint region |
| Thoracic Rotators | Upper Back | thoracic-spine rotation |
| Diaphragm | Abdominals | breathing / deep-core context |
| Iliac Crest Attachments | Abdominals | oblique / TVA / QL attachment site |

### Leg un-collapse

| Tags (and synonyms) | Was | Now |
|---|---|---|
| glutes, gluteus, glute med/min, butt | Upper Legs | **Glutes** |
| quadriceps, quads, vastus, rectus femoris | Upper Legs | **Quadriceps** |
| hamstrings, hammy, biceps femoris, semitendinosus, semimembranosus | Upper Legs | **Hamstrings** |
| calves, calf, gastrocnemius, soleus | Lower Legs | **Calves** |

## Scope Boundaries

**In scope:**
- `mapMuscleToCanonicalGroups` regex logic in `app.js`.
- Confirming picker/chart consistency (R4).

**Out of scope:**
- Removing `Upper Legs` / `Lower Legs` from the canonical list — they remain as meaningful fallbacks (R3).
- Restructuring the muscle-tag data model or the templates themselves.
- The removed/unrendered body silhouette (`MUSCLE_SILHOUETTE_MAP`, `BodySilhouette`) — dead code, not part of this change.
- User's live localStorage data: the analysis is based on `data/templates.json`; the classifier fix applies to any string, but only template strings were enumerated.

## Key Flows

**Happy path:** user opens Stats → Muscle Volume → sees glutes, quads, hamstrings, and calves as distinct bars, with "Other" empty or near-empty instead of a large catch-all.

**Boundary:** a muscle string not covered by any rule still falls to "Other" — the bucket is reduced, not eliminated as a concept.

## Success Criteria

- Running the 56 template muscle strings through the updated classifier leaves 0 (or only genuinely unclassifiable) strings in "Other".
- `Glutes`, `Quadriceps`, `Hamstrings`, `Calves` each receive volume when the corresponding exercises are logged.
- No previously-correct mapping regresses.
- No canonical group offered in the exercise editor is unreachable by the classifier.

## Open Questions / Judgment Calls

- **Diaphragm → Abdominals** and **Iliac Crest Attachments → Abdominals** are the two least clear-cut calls. Alternatives: leave `Diaphragm` in Other (it is a respiratory muscle), route `Iliac Crest Attachments` to `Lower Back`. Low stakes — revisit if the resulting bars look wrong.
- **Hip flexors / iliopsoas → Upper Legs** corrects the existing `hip flexors → Lower Legs` mapping, which is anatomically off. Confirm this correction is wanted (it changes an existing mapping, not just an "Other" one).
