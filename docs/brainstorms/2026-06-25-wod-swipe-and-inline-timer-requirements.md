---
date: 2026-06-25
topic: wod-swipe-and-inline-rest-timer
status: active
---

# Requirements: Swipeable WOD Card & Inline Rest Timer

## Summary

Two independent UI improvements to the Forge workout view:

1. **Swipeable WOD card** — the Today's Session block becomes horizontally swipeable so you can browse past and upcoming scheduled sessions without leaving the Forge tab.
2. **Inline rest timer** — when a set is completed, a slim countdown banner appears above that exercise's set rows, eliminating the need to scroll back to the top of the page to see the timer.

---

## Feature 1: Swipeable WOD Card

### Requirements

**R1.** The WOD card block is swipeable left and right. Swiping advances or retreats one calendar day at a time through the entries in `data/wod.json`.

**R2.** Navigation works in both directions: past days and future days are reachable.

**R3.** The section heading updates with the viewed day:
- On today: "Today's Session" (existing behaviour, unchanged)
- On any other day: the day name, e.g. "Friday"

**R4.** Days with no WOD entry in `wod.json` render the existing null/rest state (no crash, no blank screen).

**R5.** Tap-to-start is enabled only on today's card. Cards for any other day are visually read-only — no tappable highlight or start affordance.

**R6.** When the user has swiped away from today, a visual indicator (e.g. a "back to today" pill or subtle pagination dots) makes it clear they are not viewing the current day.

**R7.** Swiping stops at the boundaries of the `wod.json` dataset (first and last available date). No wrapping.

### Out of scope

- Editing or adding WOD entries from within the app.
- Starting a workout from a past or future day's card (today-only, per R5).

---

## Feature 2: Inline Rest Timer

### Requirements

**R8.** When a set is marked complete and the rest timer starts, a slim countdown banner appears above the set rows of the exercise that triggered it — without displacing or modifying the existing top mini-timer.

**R9.** The inline banner always follows the most recently completed set. If a set is completed in a different exercise while the timer is still running, the timer restarts for the new set's rest duration and the banner moves to that exercise.

**R10.** The inline banner disappears when the timer reaches zero or is manually stopped (same triggers as the top mini-timer).

**R11.** The inline banner is visually compact — consistent with the app's existing rest timer style, not a duplicate of the full top timer panel.

**R12.** The inline banner shows the same countdown value as the top mini-timer at all times (they are the same timer, displayed in two places).

### Out of scope

- Replacing the top mini-timer.
- Per-exercise timer configuration.

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| WOD navigation direction | Both past and future | Useful to review what was scheduled and plan ahead |
| Tap-to-start on non-today cards | Today only | Avoids confusion about which day the workout is logged against |
| Non-today heading | Day name (e.g. "Friday") | Short and scannable; unambiguous when browsing |
| Inline timer vs top timer | Both remain visible | Redundant by design — each serves a different scroll position |
| Inline timer follows new set | Yes, jumps to new exercise | The timer is about the most recent action; staying on the old exercise would be confusing |

---

## Affected Files

- `index.html` — `WorkoutsView` (WOD card block, swipe gesture, heading label); `SessionView` (inline timer banner, last-triggered exercise tracking)
- `app.js` — may need to expose last-triggered `itemId` alongside the timer state, or pass it through the existing `_forgeStartTimer` call
