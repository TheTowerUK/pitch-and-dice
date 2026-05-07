# SOUNDS.md

## Audio system inventory

This document describes the current sound inventory based on `src/engine/soundEngine.js` and its known call sites across the app.

---

## 1. Loops (background)

### `menu.mp3` (`menu`)
**Primary trigger**
- `startMenuMusic()`
- `HomeScreen` about 1 second after mount
- `resumeAudioForScreen()` when `screen === 'home'`
- `PauseOverlay` when not in-game

**Stopped by**
- `App.js` AppState background handling via `stopMusic()`

### `ambient_sounds.mp3` (`ambientA` / `ambientB`)
**Primary trigger**
- `startCrowdAmbient()`
- `GameScreen` when `gamePhase` is in-play
- App resume path on `AppState -> active`
- `PauseOverlay` when in-game
- `resumeAudioForScreen()` when on the game screen

**Notes**
- This is the crossfading stadium wash.
- File length ~20.625 s, loaded with `isLooping: false`. The active A/B channel must crossfade out before its file naturally ends.
- Timing constants: `AMBIENT_DURATION_MS = 20625`, `AMBIENT_OVERLAP_MS = 3000`, `AMBIENT_SWAP_MS = 13000`. Constraint: `2 * AMBIENT_OVERLAP_MS + AMBIENT_SWAP_MS <= AMBIENT_DURATION_MS` (≈1.6 s safety buffer).
- When crowd ambient starts, `startCommentary()` also runs.
- `startCommentary()` periodically plays random `general_1` to `general_15` clips over the ambient loop.

---

## 2. One-shot SFX (non-commentary voice)

### `bat_crack.mp3`
**Primary trigger**
- `playSoundForOutcome()`
- `playSfxForOutcome()`
- `playSoundForWicket()` for some contact-based dismissals

### `roll.mp3`
**Primary trigger**
- `playSoundForRoll()`
- Used by `DiceRollAnimation`

### `crowd_four.mp3`
**Primary trigger**
- Boundary 4 outcomes
- Often paired with `swellCrowd`

### `crowd_six.mp3`
**Primary trigger**
- Six outcomes
- Milestones via `playSoundForMilestone()`
- Often paired with `swellCrowd`

### `crowd_single.mp3`
**Primary trigger**
- 1-run outcome crowd layer

### `crowd_two.mp3`
**Primary trigger**
- 2-run outcome crowd layer

### `crowd_wicketcheer.mp3` / `crowd_wicketgroan.mp3`
**Primary trigger**
- `playSoundForWicket()`
- Crowd reaction varies by dismissal context

### `triple.mp3`
**Primary trigger**
- 3-run outcome

### `owzat.mp3`
**Primary trigger**
- `playSoundForWicket()` for appeal moments
- `playSoundForCaughtBehind()` exists but appears unused elsewhere

### `drs_win.mp3` / `drs_lose.mp3`
**Primary trigger**
- `playSoundForDRS()`
- Called by `WicketModal` after review result

---

## 3. Wicket commentary pools

Triggered via `playSoundForWicket()` and selected by dismissal type.

### Bowled
- `bowled_1` to `bowled_3`

### Caught
- `caught_1` to `caught_3`

### LBW
- `lbw_1` to `lbw_2`

### Stumped
- `stumped_1` to `stumped_2`

### Run out
- `runout_1` to `runout_12`

**Primary call site**
- `GameScreen` when `gamePhase === 'wicket_pending'`

---

## 4. Ball-outcome commentary and SFX

### Full commentary path: `playSoundForOutcome()`
Used after a normal ball commit in `GameScreen` when:
- not milestone-only
- not replaced by a close-game override

#### Outcome: 6
**SFX**
- `bat_crack`
- `crowd_six`

**Commentary**
- `six_1` to `six_4`

#### Outcome: 4
**SFX**
- `bat_crack`
- `crowd_four`

**Commentary**
- `four_1` to `four_4`

#### Outcome: 3
No dedicated 3-run commentary pool (falls back to twos logic).

#### Outcome: 2
**SFX**
- `bat_crack`
- `crowd_two`

**Commentary**
- `playRunCommentary(2)`
- `two_neutral`
- `two_pressure`
- `two_chase`

#### Outcome: 1
**SFX**
- `bat_crack`
- `crowd_single`

**Commentary**
- `playRunCommentary(1)`
- `singles_neutral`
- `singles_pressure`
- `singles_chase`

#### Outcome: Dot
**SFX**
- no `bat_crack` in the full-path dot case

**Commentary**
- `dot_1` to `dot_12`

### SFX-only path: `playSfxForOutcome()`
Used when:
- milestone commentary replaces outcome commentary
- `checkCloseGameCommentary()` returns true and only SFX should play

---

## 5. Chase / pressure / result commentary

### `close_1` to `close_10`
**Primary trigger**
- `checkCloseGameCommentary()`
- Close chase branch in innings 2

### `impossible_1` to `impossible_10`
**Primary trigger**
- `checkCloseGameCommentary()`
- Impossible chase branch

### `pressure_calm_*`, `pressure_watchful_*`, `pressure_building_*`, `pressure_high_*`, `pressure_extreme_*`
**Primary trigger**
- `checkCloseGameCommentary()`
- Pressure-tier branch

### `win_1` to `win_3`
### `loss_1` to `loss_3`
**Primary trigger**
- `playSoundForMatchResult()`

### `first_innings_end_1` to `first_innings_end_6`
**Primary trigger**
- `playSoundForFirstInningsEnd()`

### `easy_chase_*`, `balanced_chase_*`, `tough_chase_*`, `very_tough_chase_*`
**Primary trigger**
- `playSoundForChaseStart()`

---

## 6. Milestones

### `fifty_1` to `fifty_10`
### `century_1` to `century_10`
**Primary trigger**
- `playSoundForMilestone()`

**Known call sites**
- `GameScreen` when `queuedAudio.pendingMilestone` is committed
- `MilestoneModal` when the modal becomes visible

**Risk**
- Possible duplicate playback if both paths fire for the same milestone

---

## 7. Special events

Triggered by `playSoundForSpecialEvent(eventKey)`.

### Canonical event mapping
- `no_ball` -> `no_ball_1`
- `dropped_catch` -> `dropped_catch_1`
- `drs_win` -> `drs_win_1`
- `drs_lose` -> `drs_lose_1`
- `injury` -> `injury_1`
- `weather` -> `weather_1`
- `drinks` -> `drinks_1`
- `legendary_ball` -> `legendary_ball_1`
- `new_ball` -> `new_ball_1`

**Notes**
- Special-event playback should run in isolated mode.
- `enterSpecialEventAudioMode()` stops match commentary scheduler and loaded SFX to avoid layering with normal ball audio.

---

## 8. Ambient “general” commentary

### `general_1` to `general_15`
**Primary trigger**
- Random picks from `scheduleNextComment()` / `pickGeneralCommentary()`
- Active only while `startCommentary()` is running

**Notes**
- This is scheduler-driven commentary layered over the crowd ambient loop.

---

## 9. Stop / mode-control functions

### `stopMusic()`
**Effect**
- Stops commentary scheduler
- Stops ambient A/B
- Stops menu loop

**Used by**
- App background handling
- quit / global stop flows

### `stopMatchSounds()`
**Effect**
- Stops commentary and speech timers
- Keeps crowd ambient

**Used by**
- `GameScreen` when innings 2 ends

### `enterSpecialEventAudioMode()`
**Effect**
- Stops match sounds
- Stops all loaded SFX in cache

---

## 10. Summary table

| File or pattern | Primary trigger |
|---|---|
| `menu.mp3` | Home / menu music |
| `ambient_sounds.mp3` | In-match crowd loop |
| `bat_crack.mp3` | Shots and some dismissals |
| `roll.mp3` | Dice animation |
| `crowd_*.mp3` | Outcomes and wickets |
| 3 runs use `two_*` commentary selection | 3 runs |
| `owzat.mp3` | Appeals |
| `drs_win.mp3` / `drs_lose.mp3` | DRS result |
| `bowled_*`, `caught_*`, `lbw_*`, `stumped_*`, `runout_*` | Wicket commentary |
| `four_*`, `six_*`, `dot_*` | Outcome commentary |
| `singles_*`, `two_*` | 1s and 2s by tone |
| `fifty_*`, `century_*` | Milestones |
| `close_*`, `impossible_*`, `pressure_calm/watchful/building/high/extreme_*` | Chase tension |
| `win_*`, `loss_*` | Match result |
| `first_innings_end_*` | End of first innings |
| `easy_chase_*`, `balanced_chase_*`, `tough_chase_*`, `very_tough_chase_*` | Start of chase |
| `no_ball_1`, `dropped_catch_1`, `drs_win_1`, `drs_lose_1`, `injury_1`, `weather_1`, `drinks_1`, `legendary_ball_1`, `new_ball_1` | Locked special events |
| `general_1` to `general_15` | Idle commentary over crowd |

---

## 11. Current implementation concerns

### Duplicate-trigger risk
- Milestone audio may fire from both game flow and modal visibility

### Dead-path risk
- `playSoundForCaughtBehind()` appears to exist without a clear live caller
- Similar legacy helpers should be reviewed and removed or reconnected

### Ownership ambiguity
- Multiple game states may still have authority to trigger overlapping audio families
- The engine should move toward explicit playback ownership rules

---

## 12. Recommended next step

Introduce an ownership-based audio model so each sound family has:
- a single owner
- explicit layer permissions
- explicit suppression rules
- explicit stop behavior during mode changes

---

## 🔗 See Also

- [Audio System](./audio-system.md)
- [Audio Refactor Brief](./audio-refactor-brief.md)
- [Commentary System](./commentary-system.md)
- [Documentation Index](../README.md)
