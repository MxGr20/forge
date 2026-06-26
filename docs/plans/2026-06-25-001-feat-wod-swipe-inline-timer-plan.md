---
title: "feat: Swipeable WOD Card & Inline Rest Timer"
date: 2026-06-25
status: active
origin: docs/brainstorms/2026-06-25-wod-swipe-and-inline-timer-requirements.md
type: feat
---

# feat: Swipeable WOD Card & Inline Rest Timer

Two independent UI improvements to the Forge workout view — both confined to `index.html`.

---

## Problem Frame

1. The WOD card shows only today's scheduled session. Users have no way to preview upcoming sessions or review recent ones without leaving the app.
2. When a set is completed and the rest timer starts, users must scroll back to the top of the session view to see the countdown. On long exercise lists this is disruptive.

---

## Requirements Trace

| Requirement | Summary |
|---|---|
| R1–R2 | WOD card is swipeable left/right through the `wod.json` dataset |
| R3 | Section heading: "Today's Session" on today; day name elsewhere |
| R4 | Off-today offset with no matching entry renders the existing null state |
| R5 | Tap-to-start enabled on today only; other cards are read-only |
| R6 | "Back to today" indicator visible when browsed away from today |
| R7 | Swiping stops at dataset boundaries (no wrapping) |
| R8–R9 | Inline timer banner appears above set rows of the last-triggered exercise; follows the most recent completed set |
| R10 | Banner disappears when the timer reaches zero or is stopped |
| R11–R12 | Banner is compact; shows the same countdown as the top mini-timer |

---

## Key Technical Decisions

**KTD1 — Swipe detection via `onTouchStart`/`onTouchEnd`.**
No existing swipe pattern in the codebase. Implement touch handlers directly on the WOD card container: record `touchStartX` on `touchstart`, compute `deltaX` on `touchend`, treat `|deltaX| >= 40px` as a swipe. This is the smallest implementation that works reliably on mobile with no external dependency. `onMouseDown`/`onMouseUp` are not needed (the app targets phones).

**KTD2 — `viewOffset` integer state, not an index.**
Store the navigation state as a day offset from today (0 = today, -1 = yesterday, +1 = tomorrow). Compute the viewed date as `today + viewOffset days`, format with `fmt8`, and find the matching WOD entry. This is simpler than storing a date string and avoids date-parsing complexity. Boundaries are enforced by clamping to the min/max dates found in the loaded `wods` array.

**KTD3 — `lastActiveItemId` state inside `SessionView`.**
The inline timer anchor (which exercise the banner appears next to) is pure UI state — it doesn't need to propagate up to `App`. Add a `lastActiveItemId` `useState` in `SessionView`. The existing `toggle()` function already knows the `itemId`; update it to set `lastActiveItemId = itemId` whenever a set is completed and the timer starts. The banner renders conditionally inside the exercise loop using `restOn && item.id === lastActiveItemId`.

**KTD4 — `app.js` stays unchanged.**
`_forgeStartTimer` signature is not modified. The `rest`/`restOn` props already flow from `App` into `SessionView`, so the inline banner reads the same values as the top mini-timer without any new prop threading.

---

## Scope Boundaries

**In scope:** Both features as specified in the requirements doc.

**Deferred to Follow-Up Work:**
- Animated WOD card slide transition (CSS `transform` / `translate` animation on swipe)
- Keyboard/arrow-key navigation for the WOD card (desktop only, low priority for a mobile-first PWA)
- Replacing the top mini-timer with the inline banner

**Out of scope:**
- Editing or adding WOD entries from the app
- Starting a workout from a non-today card
- Per-exercise timer configuration

---

## Implementation Units

### U1. WOD card swipe navigation

**Goal:** Make the WOD card block swipeable left/right to browse past and future days.

**Requirements:** R1, R2, R3, R4, R5, R6, R7

**Dependencies:** none

**Files:**
- `index.html` — `WorkoutsView` component (lines ~305–400)

**Approach:**

In `WorkoutsView`:

1. Add `const [viewOffset, setViewOffset] = useState(0)` alongside existing state.
2. Add `touchStartX` ref (`useRef(0)`) — no re-render needed, just a scratch value.
3. Compute the viewed date:
   ```
   const viewDate = fmt8(new Date(new Date().setDate(new Date().getDate() + viewOffset)))
   ```
   (or equivalently, create a `Date`, add `viewOffset` days, call `fmt8`).
4. Find the WOD for the viewed date: `const viewWod = Array.isArray(wods) ? wods.find(w => w.date === viewDate) || null : undefined`.
5. Compute dataset boundaries from the loaded array:
   ```
   const minOffset = ... // index of first entry's date relative to today
   const maxOffset = ... // index of last entry's date relative to today
   ```
   Simplest: when `wods` is an array, compute `minOffset` and `maxOffset` once by diffing the first/last entry dates against today in milliseconds (`Math.round((entryDate - todayDate) / 86400000)`). Store as derived constants (not state), recalculated on each render.
6. Wrap the WOD card section in a container div with:
   - `onTouchStart={e => { touchStartXRef.current = e.touches[0].clientX; }}`
   - `onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touchStartXRef.current; if (Math.abs(dx) >= 40) setViewOffset(o => Math.max(minOffset, Math.min(maxOffset, o + (dx < 0 ? 1 : -1)))); }}`
7. Section heading: `viewOffset === 0 ? 'Today\'s Session' : new Date(viewDate).toLocaleDateString('en-US', { weekday: 'long' })`
8. Pass `viewWod` to `<WodCard>` and `onTap={viewOffset === 0 ? handleWodTap : null}`.
9. Back-to-today indicator: render a small pill button below the heading when `viewOffset !== 0`:
   ```jsx
   {viewOffset !== 0 && (
     <button onClick={() => setViewOffset(0)} style={{ /* compact pill style */ }}>
       ← Today
     </button>
   )}
   ```

**Patterns to follow:**
- `fmt8` usage and `today8` pattern already in `WorkoutsView`
- `WodCard` already accepts `onTap=null` and renders read-only (no `onClick` handler if `onTap` is falsy, per the existing `cursor: onTap ? 'pointer' : 'default'`)

**Test scenarios:**
- Swipe left from today → shows tomorrow's entry; heading shows the day name (e.g. "Thursday")
- Swipe right from today → shows yesterday's entry; heading shows the day name
- Swiping to a date with no WOD entry → renders "No session scheduled" null state (existing `WodCard` null branch)
- Swipe past the last dataset entry → offset does not change beyond the boundary
- Swipe past the first dataset entry → offset does not change beyond the boundary
- "← Today" pill is visible when offset ≠ 0; tapping it resets to today
- On today (offset = 0): tapping the card starts the matched routine (existing behaviour)
- On a non-today card: tapping has no effect (no pointer cursor, no `onStart` call)
- After returning to today via the pill: heading shows "Today's Session" again, pill is gone

**Verification:** Load the app on today's date, swipe left and right, confirm heading, card content, and boundaries. Confirm tap-to-start only works on today's card.

---

### U2. Inline rest timer banner in SessionView

**Goal:** Show a compact countdown banner above the set rows of the exercise that most recently triggered the rest timer.

**Requirements:** R8, R9, R10, R11, R12

**Dependencies:** U1 (none — these features are independent; U2 can be implemented before or after U1)

**Files:**
- `index.html` — `SessionView` component (lines ~629–789)

**Approach:**

1. Add `const [lastActiveItemId, setLastActiveItemId] = useState(null)` inside `SessionView`.
2. In the `toggle()` function, after the existing `_forgeStartTimer` call, add:
   ```
   setLastActiveItemId(itemId);
   ```
   Only fires when `s.completed && state.settings.autoRest` (same condition as the timer call).
3. Inside the `workout.items.map(item => ...)` render loop, just before the `<div className="sw">` set-table div, insert the inline banner:
   ```jsx
   {restOn && item.id === lastActiveItemId && (
     <div style={{ /* compact banner style */ }}>
       <span>Rest</span>
       <span>{fmtDur(rest)}</span>
     </div>
   )}
   ```
4. Style: use the same CSS variables as the top timer (`var(--brand2)` for the countdown, `var(--s2)` background, `var(--bd)` border, `borderRadius: 10`). Keep it to ~36–40px tall — visually a single row, not a duplicate of the full top panel.
5. The banner disappears automatically when `restOn` becomes false (the `&&` guard in the render condition handles it). No extra cleanup needed.

**Patterns to follow:**
- Existing top timer block (`rb rb-on`) for CSS variable and layout reference; the inline banner is a slimmed-down read-only version
- `fmtDur(rest)` for the countdown display (already imported in scope)

**Test scenarios:**
- Complete a set in an exercise → inline banner appears above that exercise's set rows showing the same value as the top mini-timer
- Complete a set in a different exercise while the timer is running → banner moves to the new exercise; top timer value unchanged
- Timer reaches zero → both the top mini-timer and the inline banner disappear
- Tap "Stop" on the top mini-timer → inline banner disappears
- `autoRest` is disabled in settings → no inline banner appears (timer never starts)
- Exercise with only uncompleted sets → no banner shown

**Verification:** During an active workout session, check off a set and confirm the inline banner appears directly above that exercise's set rows showing a countdown matching the top timer. Check off a set in a second exercise and confirm the banner jumps to the new exercise. Wait for the timer to expire and confirm both displays clear.

---

## Open Questions

None — all product decisions were resolved in the brainstorm.

---

## Sources & Research

- `docs/brainstorms/2026-06-25-wod-swipe-and-inline-timer-requirements.md` — upstream requirements document
- `data/wod.json` — 135 entries, 2026-06-01 to 2026-09-27, date format `YYYY-MM-DD` matching `fmt8` output
