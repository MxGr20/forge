---
title: "Remove Set During Active Workout"
date: 2026-07-05
status: active
---

# Remove Set During Active Workout

## Problem

Users can add sets to an exercise during an active workout but have no way to remove one. A misfired "+ Add Set" tap or a change of plan requires finishing the workout to fix the set count.

## Requirements

R1. Each set row in `SessionView` has a remove button.  
R2. The remove button is hidden when the exercise has exactly one set remaining — the minimum is one set per exercise.  
R3. Tapping the remove button immediately removes the set with no confirmation dialog.  
R4. Removing a set re-renders the exercise block and persists the change to state.  
R5. The remove button is visually compact and does not disrupt the set row layout (weight / reps / checkmark columns).

## Scope Boundaries

**In scope:** `SessionView` during an active workout.

**Out of scope:**
- Undo / restore after removal
- Remove sets in the routine template editor (separate editor view)
- Remove sets in the workout history view

## Key Flows

**Happy path:** user taps remove on a set row → set disappears, remaining rows renumber, one set minimum enforced by hiding the button.

**Boundary:** exercise has two sets → remove one → one set remains → remove button on that row disappears.

## Success Criteria

- A set can be removed from any exercise in an active workout except the last remaining set.
- The remove button is not visible when only one set remains.
- State is saved immediately on removal.
