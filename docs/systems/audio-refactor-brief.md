# Cursor Audio Refactor Brief

## Objective

Refactor `src/engine/soundEngine.js` so the audio system is governed by explicit **ownership, layering, and suppression rules** instead of loosely coordinated playback calls.

The goal is to prevent:
- duplicate commentary
- milestone double-fires
- special-event overlap with normal ball audio
- orphaned or dead helper paths
- inconsistent stop behavior across screen changes and modal states

This is not an asset expansion task. It is a **playback control and architecture hardening task**.

---

## Current problem summary

The current audio model is already strong, but it behaves like a mixed responsibility layer:

- it loads and plays sounds
- it schedules ambient/general commentary
- it reacts to gameplay states
- it acts as a partial mode manager
- it sometimes relies on external callers to avoid collisions

That leaves the system vulnerable to overlap bugs.

### Known examples
1. **Milestone duplication risk**
   - `GameScreen` can call `playSoundForMilestone()` from queued game flow
   - `MilestoneModal` can also call `playSoundForMilestone()` when visible
   - this can lead to duplicate milestone playback

2. **Special event isolation needs to be strict**
   - special events should suspend all normal ball commentary/SFX ownership
   - `enterSpecialEventAudioMode()` exists, but ownership rules should make this impossible to violate accidentally

3. **Dead path suspicion**
   - `playSoundForCaughtBehind()` appears to exist without a clear active caller
   - other old helper functions may also remain

---

## Required outcome

Implement an explicit audio-state model with clear playback ownership.

The sound engine should know:
- which family owns the current audio lane
- what is allowed to layer
- what must stop immediately
- what must be suppressed until another mode exits

---

## Target playback families

Use these families as the baseline grouping.

### 1. Music
- menu loop

### 2. Ambient
- stadium crowd ambient loop
- ambient crossfade controller

### 3. Ambient commentary
- scheduler-driven `general_*` lines

### 4. Ball SFX
- bat crack
- roll
- crowd single/two/four/six
- triple
- appeal effects

### 5. Ball commentary
- dot
- singles / two tone pools
- four / six / triple commentary
- close / pressure / impossible chase commentary if still treated as ball-level replacement commentary

### 6. Wicket package
- wicket SFX
- crowd wicket reaction
- wicket commentary pool
- DRS result audio if still tied to wicket flow

### 7. Milestone package
- fifty / century commentary
- milestone crowd swell

### 8. Innings / result package
- chase start
- first innings end
- match result

### 9. Special event package
- locked `special_1` to `special_9`

---

## Ownership model to implement

Add a central ownership definition in `soundEngine.js`, or in a nearby module imported by it.

Suggested structure:

```js
const AUDIO_FAMILIES = {
  MUSIC: 'music',
  AMBIENT: 'ambient',
  AMBIENT_COMMENTARY: 'ambient_commentary',
  BALL_SFX: 'ball_sfx',
  BALL_COMMENTARY: 'ball_commentary',
  WICKET: 'wicket',
  MILESTONE: 'milestone',
  INNINGS_RESULT: 'innings_result',
  SPECIAL_EVENT: 'special_event',
};
```

Add a runtime controller state, for example:

```js
const audioState = {
  activeMode: 'menu', // menu | match | paused | special_event | result | idle
  activeOwners: new Set(),
  suppression: {
    ballCommentaryBlocked: false,
    ambientCommentaryBlocked: false,
    wicketBlocked: false,
    milestoneBlocked: false,
  },
  lastPlayedKeys: {},
};
```

Do not copy this literally unless it fits the codebase. The point is to create a single truth source.

---

## Required playback rules

### Rule group A: menu vs match
1. Menu music must not run while in-match ambient is active.
2. In-match ambient must not start if special-event mode is active.
3. Resume helpers must restore only the audio appropriate to the current screen and mode.

### Rule group B: ambient commentary
1. Ambient commentary (`general_*`) may only run when:
   - match ambient is active
   - no special event is active
   - no wicket package is actively speaking
   - no innings/result package is actively speaking
2. Ambient commentary should be paused or deferred during all priority spoken sequences.

### Rule group C: ball audio
1. A normal ball may own:
   - one ball SFX package
   - one commentary package
2. Ball commentary must be suppressible by:
   - milestone package
   - wicket package
   - special event package
   - innings/result package
3. If close-game commentary is selected, outcome commentary should not also fire.

### Rule group D: wicket package
1. Wicket package has higher priority than standard ball commentary.
2. Wicket package may include:
   - appeal / contact SFX
   - crowd wicket reaction
   - wicket commentary line
3. No standard outcome commentary may fire after wicket ownership is granted.

### Rule group E: milestone package
1. Milestone audio must have a **single owner path**.
2. Choose one:
   - either game flow owns milestone playback
   - or modal visibility owns milestone playback
3. Preferred approach:
   - game flow owns playback
   - modal is display-only and must not trigger milestone audio
4. Add a guard so the same milestone key cannot fire twice for the same delivery / state transition.

### Rule group F: special event package
1. Special event package has top priority over match commentary.
2. Entering special-event mode must:
   - stop ball commentary
   - stop ambient commentary scheduler
   - stop non-essential SFX still playing
3. While special-event mode is active:
   - no normal ball audio may start
   - no ambient commentary may resume
4. Exiting special-event mode should restore only valid baseline audio for the current game state.

### Rule group G: innings/result package
1. End/start/result voice lines should block ambient commentary while speaking.
2. These should not coexist with ball commentary from the same state transition.
3. Result audio should cleanly stop match commentary scheduler after final outcome.

---

## Required duplicate guards

Add lightweight guard logic for repeat prevention.

Examples:
- `milestone:fifty:teamA:over12_ball3`
- `wicket:run_out:innings2:ball47`
- `special:no_ball:match123:event4`

A simple `lastPlayedKeys` map or `recentlyPlayed` cache is enough.

Minimum requirements:
- prevent same milestone firing twice from separate call sites
- prevent same special-event voice line replay from duplicate modal / continue flows
- prevent repeat result audio on repeated effect passes

---

## Required cleanup pass

Review all exported or internal helpers in `soundEngine.js` and classify each as:

- active and valid
- active but should be merged
- dead and removable
- dead but intentionally reserved

Specifically review:
- `playSoundForCaughtBehind()`
- any legacy wicket helpers not referenced by current flow
- any duplicate stop/resume helpers that partially overlap in purpose

Remove dead branches unless there is a clear near-term reason to keep them.

---

## Suggested implementation approach

### Phase 1: structure
- add audio family constants
- add central runtime state for ownership/suppression
- add helper functions such as:
  - `acquireAudioOwner(family, context)`
  - `releaseAudioOwner(family)`
  - `canPlayFamily(family, context)`
  - `suppressFamily(family)`
  - `resumeAllowedAmbientLayers()`

### Phase 2: harden high-risk paths
- milestone playback ownership
- special-event isolation
- wicket vs standard ball commentary collision prevention
- result/innings spoken sequence suppression

### Phase 3: cleanup
- remove dead helpers
- simplify duplicated stop/resume logic
- centralize scheduler pause/resume behavior

---

## Preferred concrete changes

### 1. Milestone ownership fix
Refactor so:
- `GameScreen` remains the only owner of milestone playback
- `MilestoneModal` no longer calls `playSoundForMilestone()`

If a modal still needs “play on first reveal” behavior, it must check a consumed playback token rather than playing blindly.

### 2. Special-event mode hardening
Ensure `enterSpecialEventAudioMode()` is not just a stop helper. It should also set a controller state that blocks new non-special playback until exit.

### 3. Scheduler isolation
Move general ambient commentary scheduling behind a strict gate:
- only active in match mode
- not during special events
- not during priority commentary playback

### 4. Ball commentary arbitration
Refactor the outcome path so only one spoken commentary lane is selected:
- standard outcome
- pressure/close/impossible override
- wicket commentary
- milestone commentary
- innings/result line
Never more than one for the same state transition.

---

## Acceptance criteria

This task is complete when all of the following are true:

1. **Milestones no longer double-play**
   - only one audio playback per milestone event

2. **Special events are isolated**
   - no normal ball commentary or ambient scheduler overlap during a special event

3. **Ball commentary is single-lane**
   - no stacking of standard outcome + close/pressure + wicket speech

4. **Ambient commentary respects priority**
   - `general_*` lines pause during higher-priority spoken events

5. **Dead helper review completed**
   - orphaned functions either removed or explicitly retained with comment

6. **Stop/resume behavior is predictable**
   - background/resume/screen changes restore only the correct baseline audio

---

## Optional but recommended logging

Add dev-only traces, for example:

```js
console.log('[audio] owner acquired', family, context);
console.log('[audio] blocked', family, reason);
console.log('[audio] special-event mode entered');
console.log('[audio] milestone skipped duplicate', playbackKey);
```

This will make audio flow debugging much easier during test runs.

---

## Deliverables expected from Cursor

1. Updated `src/engine/soundEngine.js`
2. Any small supporting constants/helper module if needed
3. Call-site adjustments in:
   - `GameScreen`
   - `MilestoneModal`
   - any special-event modal flow
   - any wicket or DRS flow that currently duplicates responsibility
4. Brief implementation summary stating:
   - what ownership model was added
   - what duplicate paths were removed
   - what dead helpers were deleted or retained

---

## Final instruction to Cursor

Refactor for control and reliability, not for feature expansion.

Do not add new sound assets.
Do not broaden commentary pools.
Do not change the game’s visible behavior except where necessary to:
- stop duplicates
- stop overlap bugs
- make audio transitions deterministic

---

## 🔗 See Also

- [Audio System](./audio-system.md)
- [Sounds](./sounds.md)
- [Commentary System](./commentary-system.md)
- [Documentation Index](../README.md)
