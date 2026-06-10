---
title: "feat: Workout Consistency Heatmap"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Workout Consistency Heatmap

Render a 52-week day-by-day heatmap of logged workouts in two places: inline in StatsView and as a sheet drill-down from the weekly tracker card on the main WorkoutsView.

---

## Problem Frame

The streak counter on the main page shows a single number — consecutive training weeks — but gives no spatial picture of where workouts fell across the year. The Stats page has no longitudinal session-frequency view at all. A day-grid heatmap surfaces training consistency at a glance and reveals gaps, streaks, and multi-session days without navigating to individual history entries.

---

## Key Technical Decisions

- **Progressive shade per session count.** Cell color is computed from workout count using `rgba(var(--brgb), opacity)` where `opacity = Math.min(0.4 + count * 0.22, 1.0)`. This yields ~0.62 for one session, ~0.84 for two, and full saturation at three or more. The zero-session color stays `var(--s3)` (grey). This avoids introducing new CSS variables and reuses the existing brand RGB component already in use elsewhere.
- **Shared `ConsistencyHeatmap` component, two mount points.** One component definition covers both the Stats inline section and the WorkoutsView sheet. The component reads `getHeatmapData()` internally on each render; no prop drilling of the full dataset.
- **`getHeatmapData()` returns a map keyed by date string.** The value is `{ count, names[] }` — count for colour lookup, names for the tap-to-show tooltip. Building names into the data function avoids a second pass in the component.
- **Drill-down via sheet from the weekly tracker card.** The card at `index.html` line 346–371 gets an `onClick` handler that sets `heatmapSheet` state to `true`. The sheet uses the same `SheetPortal` + `sheet-scrim` + `sheet` pattern as `TemplateSheet`. This is the most ergonomic entry point: it is already the natural "how am I tracking?" touchpoint on the main page.
- **Grid layout: rows = weeks, columns = Mon–Sun, most-recent week at top.** Row 0 is the current week; row 51 is 52 weeks ago. Future days in the current week are left blank. The component computes all 364 dates from the current Monday backward using the same `getWeekStart()` already in `app.js`.

---

## Implementation Units

### U1. `getHeatmapData()`

**Goal:** Return a data map `{ dateStr → { count, names } }` over the trailing 52 weeks, plus a helper `heatmapCellColor(count)` function.

**Requirements:** R17, R18, R19

**Dependencies:** none

**Files:** `app.js`

**Approach:**

Add `getHeatmapData()` after the existing stats helpers. The function:

1. Computes `cutoff = startOfCurrentWeek - 51 * 7 * 86400_000` (52 weeks back from Monday).
2. Filters `state.workouts` to entries where `endedAt` is set and `createdAt >= cutoff`.
3. Builds a plain-object map: key = `fmt8(new Date(w.createdAt))` (the existing 8-char date helper), value = `{ count, names }` accumulated across workouts on the same day.
4. Returns the map (sparse — only days with ≥ 1 workout appear; the component handles missing keys as zero).

Add `heatmapCellColor(count)` as a module-level function:

```js
function heatmapCellColor(count) {
  if (!count) return 'var(--s3)';
  return `rgba(var(--brgb), ${Math.min(0.4 + count * 0.22, 1).toFixed(2)})`;
}
```

**Patterns to follow:** `fmt8` date helper; `getWeekStart()` at the top of `WorkoutsView`; existing workout filter pattern in `StatsView`.

**Test scenarios:**
- No completed workouts → returns `{}`.
- Workout logged today → entry for today with `count: 1, names: [workout.name]`.
- Two workouts on the same day → single entry with `count: 2, names: [name1, name2]`.
- Workout from 53 weeks ago → excluded from the map.
- Active workout (`!endedAt`) → excluded.
- `heatmapCellColor(0)` → `'var(--s3)'`.
- `heatmapCellColor(1)` → `'rgba(var(--brgb), 0.62)'`.
- `heatmapCellColor(3)` → `'rgba(var(--brgb), 1.00)'` (capped).

---

### U2. `ConsistencyHeatmap` component and both mount points

**Goal:** Render the 7×52 heatmap grid in Stats (inline section) and open it in a sheet from the WorkoutsView weekly tracker card.

**Requirements:** R17, R18, R19

**Dependencies:** U1

**Files:** `index.html`

**Approach:**

Define `ConsistencyHeatmap()` as a standalone function component above `StatsView`. On each render it calls `getHeatmapData()` and `getWeekStart()`. It builds the 52-row × 7-column grid by starting at the current Monday, stepping back one week per row:

```
for row 0..51:
  weekStart = currentMonday - row * 7 days
  for col 0..6:
    date = weekStart + col days
    if date > today → render blank cell
    else render cell with heatmapCellColor(data[fmt8(date)]?.count ?? 0)
```

Cell size: 10×10 px squares, 2 px gap, `borderRadius: 3`. The grid renders as `display: grid; gridTemplateColumns: repeat(7, 10px); gap: 2px`. Day-of-week labels (M T W T F S S) sit above the grid, matching the WeekDays header style in WorkoutsView. Week axis is unlabelled (too dense at 52 rows). The total grid height is approximately 52 × 12 = 624 px — scrollable within the Stats section.

Tap interaction: a `const [tapInfo, setTapInfo] = useState(null)` local state. Tapping a non-zero cell sets `tapInfo` to `{ date, names }`. A small floating label renders above the cell (or fixed at bottom of grid) showing the date and workout name list; tapping again or tapping elsewhere clears it.

**StatsView integration:** Add a new section between the existing header row and the Exercise Progress card (or after the Muscle Volume section — either placement works; below Muscle Volume is recommended so the scroll order goes summary → chart → heatmap). The section uses the existing `<div className="sh"><span className="sl">Consistency</span></div>` header pattern followed by `<ConsistencyHeatmap />`.

**WorkoutsView integration:** Add `const [heatmapSheet, setHeatmapSheet] = useState(false)` alongside `templateSheet` and `editSheet` at the top of `WorkoutsView`. Wrap the existing weekly tracker card `<div>` (line 346) with `onClick={() => setHeatmapSheet(true)}` and `style={{ cursor: 'pointer' }}`. At the bottom of `WorkoutsView`'s return, after the `editSheet` conditional, add:

```jsx
{heatmapSheet && (
  <SheetPortal>
    <div className="sheet-scrim" onClick={() => setHeatmapSheet(false)} />
    <div className="sheet" style={{ maxHeight: '92%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 22px 12px', flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bd2)', margin: '0 auto 14px' }} />
        <div style={{ fontFamily: 'var(--fh)', fontSize: 23, fontWeight: 800, color: 'var(--text)' }}>Consistency</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '10px 22px 20px', WebkitOverflowScrolling: 'touch' }}>
        <ConsistencyHeatmap />
      </div>
    </div>
  </SheetPortal>
)}
```

**Patterns to follow:** `TemplateSheet` at `index.html` line 1432–1455 for sheet structure; weekly tracker card at line 346–371 for the tap target; `StatsView` section header pattern at line 791–910.

**Test scenarios:**
- Covers R17: grid renders 52 rows × 7 columns; no future cells filled.
- Covers R18: day with no workout shows grey (`var(--s3)`); 1 workout shows mid-brand; 2 workouts shows noticeably darker; 3+ shows full brand.
- Covers R19: tapping a non-zero cell shows the day's workout name; tapping a zero cell does nothing.
- Multi-workout day: tap shows both names (e.g., "Morning Run, Leg Day").
- On main WorkoutsView: tapping the weekly tracker card opens the sheet with the heatmap; tapping the scrim closes it.
- On Stats page: heatmap section renders inline and scrolls with the page.
- Current week with 3 days elapsed: Mon–today show workout data; remaining days render as blank (no cell, or transparent fill).
- No workouts at all → all cells grey; no crash.

**Verification:** Heatmap visible in both Stats (inline) and via sheet from main page; color darkens as session count rises; tap shows workout names; sheet open/close works; no layout shift on existing Stats sections; no console errors.
