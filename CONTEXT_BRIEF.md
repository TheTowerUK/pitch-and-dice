# APP CONTEXT BRIEF — Pitch & Dice
*Paste this at the start of any new Claude.ai conversation to restore full context.*

---

## 1. APP IDENTITY

**App Name:** Pitch & Dice

**One-Line Description:**
A strategic cricket dice game where every ball is resolved through player decisions (shot type, aggression, bowling variation) combined with dice rolls across D4–D12, with AI opponent modes and full match persistence.

**Platform Target:** iOS + Android (React Native via Expo)

**Current Status:** Phases 1–3 complete + AI Mode implemented. Running live on device via Expo Go.

---

## 2. TECH STACK

**Framework:** React Native + Expo (~54.0.0) — React 19.1.0, RN 0.81.5
**Language:** JavaScript (ES6+)
**State Management:** useState + custom hook (useGameState)
**Backend / Database:** AsyncStorage (match persistence + history)
**Key Libraries:**
- @expo-google-fonts/bebas-neue
- @expo-google-fonts/dm-mono
- expo-haptics (wired to RollButton + WicketModal)
- @react-native-async-storage/async-storage
- react-native-safe-area-context ~5.6.0
- react-native-screens ~4.16.0

**Repo:** [ADD YOUR GITHUB REPO URL]
**Branch Strategy:** main = stable, dev = active development

---

## 3. PROJECT STRUCTURE

```
/pitch-and-dice
  App.js                            ← Entry point, font loading, SafeAreaProvider, resume check
  app.json                          ← Expo config (SDK 54, no asset refs until icons added)
  package.json                      ← SDK 54 compatible dependency versions
  babel.config.js
  CONTEXT_BRIEF.md
  README.md
  /src
    /constants
      theme.js                      ← COLOURS, FONTS, SIZES, SPACE, FORMATS
    /engine
      diceEngine.js                 ← Pure JS dice logic, outcome tables, resolvers
      useGameState.js               ← Central game state hook — full resolver chain
      momentumEngine.js             ← Momentum tiers, shifts, commentary
      playerEngine.js               ← Skill ratings, presets, modifiers
      pitchEngine.js                ← 5 pitch types, passive roll modifiers
      bowlingEngine.js              ← 6 variations, forced checks, synergy commentary
      fieldEngine.js                ← 6 zones, fielder allocation, boundary/catch checks
      specialEvents.js              ← D20 event table, 5% trigger, effect resolver
      pressureEngine.js             ← RRR calculator, 5 pressure tiers, roll modifier
      partnershipEngine.js          ← Partnership tracker, milestone bonuses at 50/100/150/200
      storageEngine.js              ← AsyncStorage save/load match + history
      aiEngine.js                   ← Rule-based AI: bowling variation, batting decision, field placement
    /components
      Scoreboard.js                 ← Top score bar + format toggle + history button
      OverBalls.js                  ← 6-pip current over display
      MomentumBar.js                ← Animated -10/+10 momentum indicator
      PlayerCard.js                 ← Active batsman + bowler in-game display
      PressureIndicator.js          ← RRR + pressure tier display (chase only)
      OutcomeDisplay.js             ← Last ball result (ROLLED label) + stats strip
      ShotSelector.js               ← 5 shot buttons + 3 aggression buttons
      BowlingSelector.js            ← 6 bowling variation buttons (chosen every ball)
      FieldSummaryStrip.js          ← Compact field display above bowling selector
      AIDecisionBanner.js           ← AI choice revealed after roll (batting/bowling mode)
      RollButton.js                 ← Main roll CTA + haptic feedback
      Commentary.js                 ← Scrollable ball-by-ball feed
      WicketModal.js                ← D6 dismissal sub-roll modal + haptic
      NewBatsmanModal.js            ← New batsman name + skill on wicket fall
      FieldSetupModal.js            ← Pre-over zone-based field placement
      SpecialEventModal.js          ← D20 special event dramatic reveal
      InningsModal.js               ← Innings complete / match summary
    /screens
      GameScreen.js                 ← Main screen, wires all components + mode routing
      ModeSelector.js               ← Manual / Play Bat / Play Bowl selection
      PlayerSetup.js                ← Pre-match: batsman, bowler, pitch type (mode-aware)
      MatchHistoryScreen.js         ← Last 5 matches with full stats
```

---

## 4. PHASE 1 — COMPLETE ✅

- [x] Dice engine — D4/D6/D8/D10/D12 per shot type
- [x] Outcome tables — all 5 shot types, rebalanced for realistic T20 probabilities
- [x] Aggression modifier — conservative (-1) / balanced (0) / aggressive (+1)
- [x] Ball resolver — resolveBall returns full outcome object
- [x] Wicket sub-roll — D6 → Bowled/LBW/Caught/Stumped/Run Out
- [x] Game state hook — useGameState with full innings lifecycle
- [x] Score tracking — runs, wickets, balls, overs, 4s, 6s, dots
- [x] Over ball pips — 6-ball current over display
- [x] Commentary feed — ball-by-ball narrative, last 60 entries
- [x] Innings 1 → Innings 2 target chase flow
- [x] Format switching — T20 / ODI / Test (overs change)
- [x] Wicket modal — animated D6 sub-roll with dismissal type
- [x] Innings end modal — stats summary with start innings 2 / new match

---

## 5. PHASE 2 — COMPLETE ✅

- [x] Momentum engine (-10 to +10 scale, 5 tiers affecting dice pools)
- [x] MomentumBar — animated visual indicator with tier label + effect
- [x] Collapse detector — 3 wickets in 10 balls triggers -5 momentum
- [x] Maiden over detector — full dot over triggers -2 momentum
- [x] CRUMBLING tier softened — no D4 override, just -1 rollMod
- [x] Player skill ratings — 1–10 scale, presets (Tailender → World Class)
- [x] Net skill modifier — floor((skill-5)/2), capped by ±1 global modifier cap
- [x] Pre-match PlayerSetup screen — name, skill, pitch type (mode-aware)
- [x] PlayerCard — in-game compact display with live ball/run stats
- [x] New batsman modal — on wicket fall, send in next player with skill
- [x] Pitch conditions — 5 types (Flat/Seaming/Turning/Deteriorating/Damp)
- [x] Bowling variations — 6 types (Stock/Swing/Spin/Pace Change/Yorker/Bouncer)
- [x] Forced checks — reduced thresholds, output dot not wicket (edge/misread/timing)
- [x] Field placement — 9 fielders across 6 zones, 3 presets, pre-over modal
- [x] FieldSummaryStrip — compact always-visible field display above bowling selector
- [x] AI FIELD label — strip shows AI vs player field clearly in each mode
- [x] Boundary save check — deep fielders can convert 4 to 2
- [x] Slip catch boost — extra slip fielders increase edge catch probability
- [x] Haptic feedback — Medium impact on roll, Warning notification on wicket
- [x] Quick select skill presets — skill only, name preserved

**Full resolver chain (per ball):**
Forced Check → Bowling Mod → Pitch Mod → Field Mod → Aggression → Momentum → Skill → Pressure → Global Cap (±1) → Outcome

**Balance fixes applied:**
- WORK D6: 1 wicket face (17%), 2 dot (33%), 1 run, 1 four, 1 six
- DRIVE D8: 1 wicket face (12.5%), balanced run/boundary distribution
- Forced checks: dot ball output, not instant wicket (except bouncer hook on roll=1)
- Global modifier cap: ±1 — prevents stacking from breaking probability tables

---

## 6. PHASE 3 — COMPLETE ✅

- [x] D20 special events — 20-entry table, 5% trigger per ball, full effect system
- [x] SpecialEventModal — animated dramatic reveal with D20 roll display
- [x] Persistent match state — AsyncStorage auto-save every ball
- [x] Resume match — app launch checks for in-progress match, offers resume
- [x] Match history — last 5 matches saved with full stats
- [x] MatchHistoryScreen — accessible via scoreboard history button
- [x] Run rate pressure — RRR calculator, 5 tiers, roll modifier + momentum hit in chase
- [x] PressureIndicator — live RRR display, pressure tier, runs needed, overs left
- [x] Partnership tracker — milestones at 50/100/150/200 runs with momentum bonus
- [x] Free hit — no-ball event awards free hit, banner shown, wicket blocked

---

## 7. AI MODE — COMPLETE ✅

- [x] ModeSelector screen — Manual / Play Bat / Play Bowl
- [x] AI bowling variation — situational: swing in powerplay, yorkers at death, spin on turning pitch
- [x] AI batting decision — situational: defend when crumbling, slog when chasing desperately
- [x] AI field placement — attacking early, defensive at death, spin field on turning pitch
- [x] AI field auto-set — batting mode skips field_setup, AI sets field on setup + each over
- [x] AIDecisionBanner — AI choice revealed after roll with reasoning text
- [x] FieldSummaryStrip — shows AI FIELD label in batting mode, CURRENT FIELD in others
- [x] ShotSelector hidden when AI bats, BowlingSelector hidden when AI bowls
- [x] PlayerSetup mode-aware — only shows relevant player card per mode
- [x] RollButton label adapts — "BOWL — AI BATS" in bowling mode

---

## 8. PHASE 4 — NEXT

- [ ] Pre-built world teams with realistic player names + skill ratings
- [ ] Random name generator for custom/fictional teams
- [ ] Team selection screen — pick XI before match
- [ ] Batting order — next batsman auto-populated from squad on wicket
- [ ] Bowling rotation — assign overs per bowler pre-match
- [ ] Player fatigue system (Test format) — skill degrades over long spells

---

## 9. PHASE 5 — POLISH & DEPLOYMENT

- [ ] App icon + splash screen assets
- [ ] Animated dice roll visual (spinning die)
- [ ] Score milestones — 50/100 batsman celebration
- [ ] Sound effects (optional — crowd, bat crack, wicket)
- [ ] App Store / Google Play submission prep
- [ ] TestFlight / internal testing

---

## 10. KNOWN ISSUES / NOTES

- Player names are free text — squad/team system planned for Phase 4
- Assets folder empty — icon.png / splash.png needed before submission
- diceEngine.js had a duplicate OUTCOME_TABLES declaration (fixed by Cursor — single declaration remains)
- PlayerSetup.js JSX was broken by patch script (fixed by full rewrite — use () not && for conditionals)
- When generating files via Python scripts, always regenerate whole files rather than patching to avoid JSX errors

---

## 11. DESIGN SYSTEM

**Colours (from src/constants/theme.js):**
```
ink:        #1a1a1a   ← cards, panels, modals
slate:      #2c3e50   ← app background
slateMid:   #3d5166   ← buttons, inputs
gold:       #d4a017   ← primary accent
red:        #c0392b   ← wickets, danger
pitch:      #2d5a1b   ← cricket green
boundary:   #e67e22   ← 4s, field alerts
six:        #e74c3c   ← 6s
wicket:     #8e44ad   ← dismissals
runs1:      #27ae60   ← runs scored
runs2:      #2980b9   ← 2 runs
dot:        #7f8c8d   ← dot balls, labels
```

**Fonts:** Bebas Neue (display/headings) + DM Mono (body/labels/mono)

**Size scale (SIZES):** xs=10, sm=12, md=14, lg=16, xl=20, xxl=28, hero=48

**Spacing (SPACE):** xs=4, sm=8, md=12, lg=16, xl=24, xxl=32

**Conventions:**
- All components are functional with hooks — no class components
- Game logic lives in /engine only — zero game logic in components
- StyleSheet.create for all styles — no inline styles
- COLOURS/FONTS/SIZES/SPACE always imported from constants/theme.js
- Minimum font size is SIZES.xs (10px) — never hardcode below this
- All new engine files are pure JS — no React imports
- Never use Python patch scripts on JSX files — always regenerate whole files
- Apostrophes in JS string literals must use escaped \' or remove the apostrophe

---

## 12. RPD REFERENCE (game design north star)

- **Role:** On-field strategist — batting, bowling, and tactical mind
- **Purpose:** Dice are the probability engine, not random chaos — strategy always matters more than luck
- **Domain:** Tabletop dice + cricket simulation + momentum psychology
- **Core Loop:** Decision → Dice Pool → Roll → Modify → Resolve → Momentum Update
- **Key Tensions:** Risk vs reward / Aggression vs caution / Individual brilliance vs team pressure
- **North Star:** Every ball should feel like a meaningful cricket moment

---

## 13. SESSION LOG

| Date       | What Was Done                                                                                      | Next Action              |
|------------|----------------------------------------------------------------------------------------------------|--------------------------|
| 18/03/2026 | RPD created, Phase 1 HTML prototype built, Expo RN project generated                               | Phase 2 momentum engine  |
| 18/03/2026 | Phase 2 complete — Momentum, Player Skills, Pitch, Bowling, Field, Haptics                        | Phase 3                  |
| 18/03/2026 | Phase 3 complete — D20 Events, AsyncStorage, Pressure, Partnership, Resume                        | AI Mode                  |
| 18/03/2026 | AI Mode complete — Manual/Bat/Bowl modes, AI bowling+batting+field, AIDecisionBanner, FieldStrip  | Phase 4 — Teams + Squads |

---

## QUICK-START PROMPT

```
I am continuing development on Pitch & Dice — a strategic cricket dice game
built in React Native + Expo (SDK 54).

Here is my full context brief: [paste this document]

Today's task: [describe what you need]
Relevant existing code: [paste snippet if needed]
```
