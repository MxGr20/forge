---
title: "feat: Silhouette Body Map in Muscle Volume"
date: 2026-06-09
status: superseded
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Silhouette Body Map in Muscle Volume

> **Status note (2026-06-11):** The body silhouette was implemented in full (52 anatomical paths, front+back, organic shapes) and then removed from `StatsView` in a follow-up design decision — the bar chart alone is sufficient. The data pipeline (`MUSCLE_SILHOUETTE_MAP`, `getMuscleSilhouetteData`, `BodySilhouette` component) remains in the codebase but is not rendered. The 1w time range button was retained.

Render an SVG front+back body silhouette above the existing Muscle Volume bar chart in StatsView. Muscle regions fill proportionally to training volume over the selected time range. Add a 1w option to the time range selector.

---

## Problem Frame

The Muscle Volume bar chart ranks muscles by set count but gives no spatial intuition for training balance — which side of the body is overtrained, which muscle groups are neglected. A silhouette integrates the same data into a familiar anatomical layout that immediately highlights imbalances without replacing the precision of the bar chart.

---

## Key Technical Decisions

- **Front + back dual view, side by side.** A front-only silhouette can't show lats, traps, hamstrings, or glutes — muscles that commonly dominate training. Two compact figures in one SVG viewport (front left, back right) cover the full body surface without toggling. Both are contained in a single `<svg>` element within the `BodySilhouette` component.
- **Inline SVG path regions, named by id.** Each anatomical region is an SVG `<path>` with a stable `id` (e.g., `"chest"`, `"quads-front"`, `"lats"`). The fill is computed at render time from `getMuscleSilhouetteData()`. No external SVG file — the markup is inline in the component, keeping it cacheable and modifiable without touching the service worker.
- **`MUSCLE_SILHOUETTE_MAP` is a static constant.** Maps canonical muscle group names (from `CANONICAL_MUSCLE_GROUPS`) to SVG path ids. Multiple canonical names can map to the same path (e.g., both `"Traps"` and `"Upper Back"` could map to the `"upper-back"` region). Muscle names with no mapping entry are silently excluded from the silhouette (R37) but appear in the bar chart.
- **Fill opacity is volume-proportional.** The fill formula is `rgba(var(--brgb), max(0.18, volume/maxVolume))` — ensuring even lightly trained regions are visible at minimum 18% opacity, while the most-trained region is fully saturated. Untrained regions use `var(--s3)` (grey).
- **1w time range uses `musMonths = 0.25`.** `computeMuscleVolumeSeries('week', 0.25, ...)` produces a ~7-day window (0.25 × 30 = 7.5 days). The current button set iterates `[1, 2, 3]`; extending to `[0.25, 1, 2, 3]` with labels `1w / 4w / 8w / 12w` requires no changes to the data pipeline.

---

## Required SVG Regions

The silhouette SVG must define the following named path regions. The implementer draws or sources simplified body outlines covering these regions. Paths must be anatomically positioned but need not be medically accurate — a stylised flat illustration is appropriate.

**Front figure (left half of SVG):** `chest`, `front-delts`, `biceps`, `forearms-front`, `abs`, `quads-front`, `inner-thighs`, `calves-front`.

**Back figure (right half of SVG):** `traps`, `upper-back`, `lats`, `triceps`, `forearms-back`, `lower-back`, `glutes`, `hamstrings`, `calves-back`.

All regions share a `fill` attribute set via inline style at render time. Regions with no mapping or zero volume render as `fill: var(--s3)`. The silhouette outline (body contour) is a separate non-interactive path rendered in `var(--bd2)`.

---

## `MUSCLE_SILHOUETTE_MAP` — initial mapping

The following is the initial mapping from canonical muscle group names to SVG region ids. Implementer should verify canonical names against `CANONICAL_MUSCLE_GROUPS` in `app.js` and adjust.

| Canonical name | SVG region id |
|---|---|
| Chest | chest |
| Shoulders | front-delts |
| Biceps | biceps |
| Forearms | forearms-front, forearms-back |
| Abs / Core | abs |
| Quads | quads-front |
| Calves | calves-front, calves-back |
| Traps | traps |
| Back / Lats / Upper Back | upper-back, lats |
| Triceps | triceps |
| Lower Back | lower-back |
| Glutes | glutes |
| Hamstrings | hamstrings |
| Inner Thigh / Adductors | inner-thighs |

One canonical name may map to multiple region ids (both sides rendered). The map is an object, not a flat list — value is a `string[]`.

---

## Implementation Units

### U1. `getMuscleSilhouetteData()` and 1w range

**Goal:** Compute per-region fill data for the silhouette and update the time range selector.

**Requirements:** R34, R35, R36, R37

**Dependencies:** none

**Files:** `app.js`

**Approach:**

Add `MUSCLE_SILHOUETTE_MAP` as a module-level constant (see mapping table above). Add `getMuscleSilhouetteData(musDisplay, maxMus)` where `musDisplay` is the already-computed array from the Muscle Volume section (`[{ name, total }]` sorted by volume). The function:

1. Builds a map `regionVolume: { [svgId]: number }` by iterating `musDisplay`, looking up `MUSCLE_SILHOUETTE_MAP[s.name]` (case-insensitive lookup with a normalised key), and accumulating `s.total` into each mapped region id.
2. Returns `regionVolume` and `maxRegion = Math.max(...Object.values(regionVolume), 1)`.

The `musMonths` state in `StatsView` needs no app.js change — `computeMuscleVolumeSeries` already accepts any numeric month value; 0.25 produces a 7.5-day window.

**Patterns to follow:** `CANONICAL_MUSCLE_GROUPS` array and `mapMuscleToCanonicalGroups` pattern in `app.js`; `musDisplay` derivation in `StatsView` (line 818).

**Test scenarios:**
- `musDisplay` with `{ name: 'Chest', total: 20 }` and Chest mapped to `'chest'` → `regionVolume.chest === 20`.
- Muscle with no mapping entry → absent from `regionVolume`; no crash.
- Muscle mapping to two regions (`forearms-front`, `forearms-back`) → both receive same total.
- Empty `musDisplay` → `regionVolume = {}`, `maxRegion = 1`.

---

### U2. `BodySilhouette` component and StatsView integration

**Goal:** Render the dual-view silhouette above the bar chart; add the 1w time range button.

**Requirements:** R34, R35, R36, R37

**Dependencies:** U1

**Files:** `index.html`

**Approach:**

Define `BodySilhouette({ regionVolume, maxRegion })` above `StatsView`. The component renders a single `<svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg">` containing:

- A front-figure group (`<g transform="translate(0,0)">`): paths for each front region, plus a body outline path.
- A back-figure group (`<g transform="translate(140,0)">`): paths for each back region, plus a body outline path.
- Small labels "Front" and "Back" below each figure in `var(--t3)` colour.

For each named path region, compute the fill at render time:

```js
function regionFill(id) {
  const vol = regionVolume[id] ?? 0;
  if (!vol) return 'var(--s3)';
  const opacity = Math.max(0.18, vol / maxRegion).toFixed(2);
  return `rgba(var(--brgb), ${opacity})`;
}
```

Each region path: `<path id={id} d="..." fill={regionFill(id)} stroke="none" />`.

Body outline paths: `<path d="..." fill="none" stroke="var(--bd2)" strokeWidth="1" />`.

The SVG paths (`d` attributes) must be authored as simplified flat human body outlines at the appropriate scale for the viewBox. The implementer may trace a reference illustration, use a public-domain anatomy SVG as a starting point (stripping any non-path elements), or draw minimal shapes that clearly distinguish the regions. Medical accuracy is not required — clean recognisable shapes that a user can map to their own body are sufficient.

**StatsView changes:**

1. **Add 1w button.** Change the time range button list from iterating `[1, 2, 3]` to `[0.25, 1, 2, 3]`. Update the label expression: `m===0.25?'1w':m===1?'4w':m===2?'8w':'12w'`. Update the default `musMonths` initial value from `3` to `3` (unchanged — default stays 12w). Add `musMonths===0.25` to the active-button condition.

2. **Add silhouette above bar chart.** Between the time range buttons and the `musDisplay.length === 0` guard, compute:

```js
const { regionVolume, maxRegion } = getMuscleSilhouetteData(musDisplay);
```

Then, before the existing bar chart `<div style={{ marginBottom: 22 }}>`, render:

```jsx
{musDisplay.length > 0 && (
  <div style={{ marginBottom: 20 }}>
    <BodySilhouette regionVolume={regionVolume} maxRegion={maxRegion} />
  </div>
)}
```

The silhouette renders only when there is muscle data (`musDisplay.length > 0`). The empty-state case remains unchanged.

**Patterns to follow:** Existing time range buttons at `index.html` line 882–886; Muscle Volume empty state at line 888–910; `var(--brgb)` rgba pattern used in heatmap (F4) and elsewhere.

**Test scenarios:**
- Covers R34: `BodySilhouette` renders above the bar chart in Muscle Volume; both figures visible.
- Covers R35: trained muscle regions fill with brand colour; untrained regions show grey.
- Covers R35: region with highest volume renders at full saturation; lower-volume regions lighter.
- Covers R36: switching from 4w to 1w — both silhouette fills and bar chart heights update; musMonths = 0.25 produces a ~7-day window.
- Covers R37: a canonical muscle name with no `MUSCLE_SILHOUETTE_MAP` entry does not cause a crash; it appears in the bar chart but no silhouette region changes.
- Muscle mapped to two regions (e.g., Forearms → both `forearms-front` and `forearms-back`) → both paths receive the same fill.
- No workouts logged → silhouette absent (empty state preserved); no console errors.
- 1w button active state styled consistently with existing 4w/8w/12w buttons.

**Verification:** Silhouette renders in front+back layout with correctly filled regions; fill changes when time range changes; bar chart unaffected by addition of silhouette; 1w range option produces expected muscle data; no regressions in other Stats sections.
