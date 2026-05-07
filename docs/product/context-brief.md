# APP CONTEXT BRIEF — Pitch & Dice

Current Active Phase: Phase 5 — Polish

## 1. APP IDENTITY
**App Name:** Pitch & Dice
**Platform:** iOS + Android (React Native via Expo SDK 54)
**Status:** Phases 1–4 complete + audio/polish in progress. Phase 5 = store prep.

## 2. TECH STACK
- React Native + Expo ~54.0.0, React 19.1.0, RN 0.81.5, JavaScript ES6+
- expo-av (audio), expo-haptics, @react-native-async-storage, react-native-safe-area-context ~5.6.0
- Fonts: @expo-google-fonts/bebas-neue + dm-mono

## 3. PROJECT STRUCTURE
App.js → fonts, initSounds, AppState, screen routing
src/engine/ → ALL game logic
src/components/ → presentational only
src/screens/ → screen-level composition
src/constants/theme.js → COLOURS, FONTS, SIZES, SPACE, FORMATS
src/assets/sounds/ → 80+ audio files (see soundEngine.js for full list)

Key engine files:
- useGameState.js — central hook, all phase transitions, resolver chain
- diceEngine.js — outcome tables v6 (wickets at HIGH faces), resolvers
- soundEngine.js — two-phase init, commentary pools, A/B ambient, SFX
- teamEngine.js — squads, runsConceded, wicketsTaken, updateBowlerBallStats
- specialEvents.js — D20 table, condition() guards, context-aware firing
- aiEngine.js — rule-based AI batting/bowling/field

## 4–8. PHASES 1–4 — ALL COMPLETE ✅
See full phase details in original CONTEXT_BRIEF.md

## 9. PHASE 5 — POLISH & DEPLOYMENT
- [x] App icon (Option C — stumps + die) + splash screen SVG
- [x] Dice roll animation with frozen state pattern
- [x] Score milestones 50/100
- [x] Full audio system (soundEngine.js)
- [x] Commentary system (76 files, least-used-first selection)
- [x] Back navigation through setup flow
- [x] Consistent header style (PITCH & DICE / T20 · CONTEXT)
- [x] Match result screen with both innings stats
- [x] Scorecard with full bowling table (OV/R/W/ECON)
- [x] Bowler stats tracked per ball (runsConceded, wicketsTaken)
- [x] Close game commentary (innings 2 only, format-aware)
- [x] Mute toggle in PauseOverlay
- [x] AppState lifecycle audio resume
- [ ] App Store / Google Play submission
- [ ] TestFlight internal testing
- [ ] EAS build config

## 10. AUDIO SYSTEM SUMMARY
- CRITICAL_SFX_ASSETS: 12 files, load immediately
- COMMENTARY_SFX_ASSETS: 64+ files, background load with 40ms gaps
- LOOP_ASSETS: menu.mp3 (isLooping:true), ambientA/B (ambient_sounds.mp3, ~20.625s, isLooping:false; OVERLAP=3000ms, SWAP=13000ms)
- A/B crossfade: timer-based at AMBIENT_DURATION_MS=20625, AMBIENT_OVERLAP_MS=3000, AMBIENT_SWAP_MS=13000 (rule: `2 * overlap + swap <= ambient file length`)
- Commentary: CMT_POOLS per event, least-used-first, cmtBusy/cmtCooldownEnd queue
- Wicket sounds: bat_crack (bowled/caught only), owzat (caught+LBW), crowd reaction, commentary
- Close game: checkCloseGameCommentary(balls, ballsRemaining, target, runs, wickets) — innings 2 only

## 11. DESIGN SYSTEM
COLOURS: ink=#1a1a1a, slate=#2c3e50, slateMid=#3d5166, gold=#d4a017, red=#c0392b
         pitch=#2d5a1b, boundary=#e67e22, six=#e74c3c, wicket=#8e44ad, runs1=#27ae60, dot=#7f8c8d
FONTS: display=Bebas Neue, mono=DM Mono
SIZES: xs=10, sm=12, md=14, lg=16, xl=20, xxl=28, hero=48
SPACE: xs=4, sm=8, md=12, lg=16, xl=24, xxl=32

## 12. KEY CONVENTIONS
- Game logic in /engine ONLY — never in components
- gamePhase is the finite state machine — always respect it
- frozenScoreRef/frozenOutcomeRef/frozenMomentumRef pattern for dice animation freeze
- backToModeSelect/backToTeamSelect in useGameState for setup back navigation
- innings1Stats preserved before innings 2 reset for result screen
- Never patch JSX with Python — always regenerate whole file
- Apostrophes in JS strings must use \' or rephrase

## 13. SESSION LOG
| Date | What Was Done |
|------|---------------|
| 18/03/2026 | Phases 1-4 complete |
| 10/04/2026 | Phase 5: audio, animation, milestones, commentary, UI polish |
| 15/04/2026 | Scorecard, result screen, back nav, close game commentary, bowler stats |

---

## 🔗 See Also

- [Pitch and Dice Overview](./pitch-and-dice-overview.md)
- [Cricket Dice Game RPD](./cricket-dice-game-rpd.md)
- [Game Flow](../architecture/game-flow.md)
- [Documentation Index](../README.md)
