---
title: "feat: Rest Timer Auto-Start and Audio Cue"
date: 2026-06-09
status: active
origin: docs/brainstorms/2026-06-09-forge-next-features-requirements.md
type: feat
---

# feat: Rest Timer Auto-Start and Audio Cue

Wire `state.settings.autoRest` into the React session toggle, add an `audioRestAlert` setting, and play a Web Audio API oscillator tone at countdown expiry.

---

## Problem Frame

`SessionView.toggle()` already fires auto-start unconditionally — it calls `setRest(getRestSeconds(s.tag))` and `setRestOn(true)` on every set completion. The behaviour is not gated on `state.settings.autoRest`, which defaults to `true` and is already handled by the legacy (non-React) settings system. No audio plays when the countdown expires — only a toast appears. Both settings need toggle rows in the Tools tab.

---

## Key Technical Decisions

- **`autoRest` setting pre-exists.** `DEFAULT_STATE.settings.autoRest: true` is already present in `app.js`. The plan wires it into the React component; it does not introduce a new concept.
- **Only `audioRestAlert` is a new setting.** Added to `DEFAULT_STATE.settings` as `false`. No other state schema changes.
- **Audio via Web Audio API oscillator.** A 440 Hz sine wave at 0.3 gain for ~120 ms, created fresh on each expiry call. No file assets, no permissions prompt.

---

## Implementation Units

### U1. Settings exposure

**Goal:** Add `audioRestAlert` to default settings and expose both `autoRest` and `audioRestAlert` as toggle rows in the Tools tab Settings card.

**Requirements:** R22, R23

**Dependencies:** none

**Files:** `app.js`, `index.html`

**Approach:** Add `audioRestAlert: false` to `DEFAULT_STATE.settings`. In `ToolsView`, add two toggle rows to the existing Settings card below the numeric rows. Each row reuses the `setr` class with a label on the left and a checkbox input on the right. The existing `updSetting` helper handles boolean values — extend it to read `element.checked` for checkbox inputs and write `Boolean` to `state.settings[key]`.

**Patterns to follow:** Existing settings rows in `ToolsView` (`setr` class, `updSetting(key, val)` pattern). Legacy `updateSetting('autoRest', ...)` handler at `app.js` line 4793 for reference on the boolean write path.

**Test scenarios:**
- Toggle "Auto-start Rest" off → `state.settings.autoRest === false`, persisted via `saveState()`.
- Toggle "Rest Audio Alert" on → `state.settings.audioRestAlert === true`, persisted.
- Reload app after toggling → both toggles reflect the saved state on mount.
- `updSetting` called with a checkbox input reads `.checked`, not `.value`.

---

### U2. Session behaviour

**Goal:** Gate `toggle()` auto-start on `state.settings.autoRest`; inject audio tone into the countdown expiry path.

**Requirements:** R20, R21, R24

**Dependencies:** U1

**Files:** `index.html`

**Approach:** In `SessionView.toggle()`, wrap the `setRest(getRestSeconds(s.tag)); setRestOn(true)` block in `if (state.settings.autoRest)`. In the App root countdown `useEffect` (line 1542–1546), when the expiry condition fires (`s <= 1`), also call `playRestAlertTone()` if `state.settings.audioRestAlert` is true. `playRestAlertTone` creates a new `AudioContext`, connects an `OscillatorNode` (sine, 440 Hz) through a `GainNode` (0.3), calls `start()` then schedules `stop()` 120 ms later.

**Patterns to follow:** App root countdown `useEffect` at line 1542–1546; `getRestSeconds` tag dispatch pattern.

**Test scenarios:**
- Covers R20 (auto-start on): `autoRest: true` (default) — mark set complete → rest countdown starts automatically.
- Covers R20 (auto-start off): `autoRest: false` — mark set complete → countdown does not start; user taps manually as before.
- Covers R21: `audioRestAlert: true` — let countdown reach zero → tone plays; no file requested, no permissions prompt appears.
- Covers R22 defaults: fresh install → `autoRest: true` (auto-start fires), `audioRestAlert: false` (silent expiry).
- Toast "Rest complete" still shows on expiry regardless of audio setting.
- Marking a set back to incomplete does not affect the running timer.

**Verification:** Auto-start toggles correctly; audio is audible when enabled and silent when disabled; settings survive a page reload; no console errors from `AudioContext` creation.
