# Pitch & Dice — developer & AI assistant guide

## ⚠️ Critical Rules

- All game logic must live in `src/engine/`
- Never bypass `useGameState`
- All flow must respect `gamePhase`
- Do not mix UI timing with game resolution

👉 Prevents future bugs.

---

**Documentation suite (recommended order):**  
1. [`cricket-dice-game-rpd.md`](./cricket-dice-game-rpd.md) — design intent  
2. [`context-brief.md`](./context-brief.md) — what’s built, stack, phases  
3. **This file** — code map, phases, audio, pitfalls  
4. [`../../README.md`](../../README.md) — quick start + doc index  

Use **CONTEXT_BRIEF** for product narrative and shipped features; **this file** for **where code lives**, **how the game loop fits together**, and **pitfalls** when changing behaviour.

---

## 1. What this repo is

| Item | Detail |
|------|--------|
| **Product** | Strategic cricket dice game (React Native / Expo). |
| **Entry** | `App.js` → routes `HomeScreen` / `GameScreen` / `MatchHistoryScreen`. |
| **State** | Single source: `useGameState` in `src/engine/useGameState.js`. |
| **Persistence** | `src/engine/storageEngine.js` (AsyncStorage). |

**Stack:** Expo ~54, React 19, RN 0.81, JavaScript (no TypeScript). Audio: `expo-av` (`src/engine/soundEngine.js`).

---

## 2. Run & build

```bash
npm install
npx expo start
```

Use Expo Go or emulators per Expo docs. No custom native modules required for core gameplay.

---

## 3. Directory map (high signal)

| Path | Role |
|------|------|
| `App.js` | Fonts, `soundsReady` + `initSounds()`, screen routing, `stopMusic` on quit/save. |
| `src/screens/GameScreen.js` | Main match UI: modals, dice animation, pause, wires `useGameState`. |
| `src/screens/HomeScreen.js` | Landing; delayed `startMenuMusic()` to avoid clashing with init. |
| `src/engine/useGameState.js` | **All** game rules orchestration: `rollBall`, phases, squads, save. |
| `src/engine/diceEngine.js` | Dice pools, outcome tables, `resolveFullBall` inputs. |
| `src/engine/bowlingEngine.js` | Variations, forced checks, yorker `wicketBoost`. |
| `src/engine/pitchEngine.js` | `PITCH_TYPES`, `applyPitchMod`, `getPitchCommentary`. |
| `src/engine/fieldEngine.js` | Zones, presets, `getFieldMod`. |
| `src/engine/momentumEngine.js` | Tiers, shifts, maiden/collapse. |
| `src/engine/aiEngine.js` | `getAIBattingDecision`, `getAIBowlingVariation`, `getAIFieldPlacement`, modes. |
| `src/engine/specialEvents.js` | D20 table, `SPECIAL_EVENTS` keys, effects. |
| `src/engine/soundEngine.js` | Two-phase SFX load, commentary pools, crowd/menu loops. |
| `src/engine/teamEngine.js` | Squads, strikers, bowlers, scorecard updates. |
| `src/constants/theme.js` | `COLOURS`, `FONTS`, `SIZES`, `SPACE`. |

Components under `src/components/` are mostly presentational; **business rules** should stay in `engine/` or `useGameState`.

---

## 4. Game phase model (`gamePhase`)

Phases are a **finite state** string on global state. Examples:

- `mode_select` → `team_select` → `setup` → `batting`
- During play: `batting`, `wicket_pending`, `new_batsman`, `special_event`, `bowler_select`, `field_setup`, `innings_end`

**Rule:** Any new modal or blocking UI must respect **phase** and any **pending** flags (`pendingMilestone`, `pendingEvent`, etc.). Search `gamePhase` in `useGameState.js` and `GameScreen.js` before adding flows.

---

## 5. Ball resolution pipeline (mental model)

1. User (or AI) chooses shot, aggression, bowling; optional field already set.
2. `rollBall` → `resolveAndApplyBall` (inside `useGameState.js`) calls `resolveFullBall` (`diceEngine` + `bowlingEngine` + pitch/field/skill/momentum).
3. Outcome updates runs, squads, commentary, momentum; may set `gamePhase` to wicket/special/over-end/etc.

**Internal helper:** `resolveFullBall` / `resolveAndApplyBall` — search these names when debugging scores or phase transitions.

---

## 6. Audio system (easy to break)

- **`initSounds()`** in `soundEngine.js`: Phase 1 = critical SFX + loops; Phase 2 = commentary assets in background.
- **`App.js`** waits on **`soundsReady`** before mounting `HomeScreen` / `GameScreen` so UI does not race unloaded audio.
- **Commentary** uses named pools in `CMT_POOLS`; special events use **`SPECIAL_EVENT_AUDIO`** map (not a random “special” pool).
- **Crowd/menu:** `startCrowdAmbient`, `startMenuMusic`, `stopMusic` — stop when leaving match or app background (see `App.js` + `GameScreen`).

---

## 7. UI timing & modals (`GameScreen.js`)

- **Dice:** `DiceRollAnimation` freezes displayed outcome/score until `onComplete`.
- **Bowler select:** Readiness `bowlerSelectReady` is driven from **dice `onComplete`** (timer), not only `gamePhase`, so the player sees the last ball first.
- **Field setup:** Short delay via `fieldSetupReady` when entering `field_setup` (phase effect); manual **Edit Field** can bypass that path.
- **Milestone vs bowler/field:** `BowlerSelectModal` / phase-gated `FieldSetupModal` should not show while `pendingMilestone` is set — see current `visible=` conditions in `GameScreen.js`.

Remove or gate **debug `console.log`** calls when shipping.

---

## 8. AI behaviour

- **`getAIBattingDecision`** (`aiEngine.js`): situation-based shot + aggression; death overs and mid-innings are heavily tuned — change in small steps and test T20 totals.
- **`getAIBowlingVariation`**: pitch and over aware.
- **Field:** `getAIFieldPlacement` returns a field object consumed by state.

---

## 9. Conventions for new work

1. **Match existing style:** same import patterns, `COLOURS` / `FONTS`, minimal abstraction churn.
2. **Keep resolver logic out of React components** — pass outcomes or use callbacks from `useGameState`.
3. **Persisted state:** extend `storageEngine` + any save points in `useGameState` when adding fields players expect across sessions.
4. **New sound:** add to `COMMENTARY_SFX_ASSETS` or `CRITICAL_SFX_ASSETS`, wire pool or direct `playSound`, preload runs in `initSounds` path.
5. **Special events:** add entries in `specialEvents.js`; if you need audio, extend `SPECIAL_EVENT_AUDIO` in `soundEngine.js` and pass `pendingEvent.key` from UI.

---

## 10. Files to read first (by task)

| Task | Start here |
|------|------------|
| Ball / wicket / chase logic | `useGameState.js`, `diceEngine.js`, `bowlingEngine.js` |
| New modal or phase | `useGameState.js` (`setState` + `gamePhase`), `GameScreen.js` |
| AI scoring / difficulty | `aiEngine.js` |
| Pitch / field / bowling UX | `pitchEngine.js`, `fieldEngine.js`, `PlayerSetup.js`, `FieldSetupModal.js` |
| Sound / commentary | `soundEngine.js`, `GameScreen.js` (when sounds fire) |
| Teams / XI / scorecard | `teamEngine.js`, `teamsData.js`, `ScorecardScreen.js` |

---

## 11. Related docs

- **[`../../README.md`](../../README.md)** — quick start and full documentation index.
- **[`cricket-dice-game-rpd.md`](./cricket-dice-game-rpd.md)** — design north star (intent may differ from code).
- **[`context-brief.md`](./context-brief.md)** — shipped features, phase history, resolver chain, design system.
- **`app.json` / `package.json`** — Expo SDK and dependency versions.

---

*Last aligned with repo structure as a handoff aid for AI-assisted development. Update this file when architecture or critical flows change.*

---

## 🔗 See Also

- [Context Brief](./context-brief.md)
- [Cricket Dice Game RPD](./cricket-dice-game-rpd.md)
- [Documentation Index](../README.md)
