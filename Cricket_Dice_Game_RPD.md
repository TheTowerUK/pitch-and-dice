# Cricket Dice Game — Role–Purpose–Domain (RPD)
### Vibe Coding Foundation Document | v1.0

---

## ⚡ THE VIBE IN ONE LINE
> *"Every ball is a decision. Every dice roll is fate. You are the mind — the dice are the game."*

---

## SECTION 1 — ROLE

### Who Is the Player?
The player assumes the role of **On-Field Strategist** — simultaneously acting as:
- The **Batting Captain** (selecting shot type, aggression level, and running intent)
- The **Bowling Captain** (choosing variation, line, length, and field placement)
- The **Tactical Mind** reading match conditions, pitch behaviour, and momentum shifts

The player does NOT control dice outcomes directly. Instead, they **shape the probability space** through their decisions — loading the dice in their favour through smart cricket thinking.

### Who Are the Agents?
| Agent | Role |
|---|---|
| Batsman | Executes the chosen shot; skill rating modifies outcome table |
| Bowler | Delivers the chosen variation; skill rating adds/removes dice faces |
| Fielders | Positioned pre-over; affect edge/catch/run-out probability |
| Match Conditions | Pitch, weather, format — passive modifiers applied each ball |
| Momentum Engine | Tracks psychological state; shifts dice pools over time |

---

## SECTION 2 — PURPOSE

### Core Design Goals
1. **Strategic Depth** — Every ball presents a genuine decision with meaningful trade-offs
2. **Probability as Storytelling** — Dice don't just produce numbers; they narrate cricket drama
3. **Momentum as a Living System** — Confidence builds and crumbles; the game feels alive
4. **Format Authenticity** — T20, ODI, and Test formats feel genuinely different to play
5. **Accessible Complexity** — Simple to learn a single ball; deep to master a full match

### The Core Loop (Per Ball)
```
PLAYER DECISION → DICE POOL ASSEMBLED → DICE ROLLED → MODIFIERS APPLIED → OUTCOME RESOLVED → MOMENTUM UPDATED
```

### The Emotional Arc
Each over should feel like a **mini drama**:
- Opening ball: cautious, probing
- Mid-over: momentum shifting, pressure building
- Final ball: high-stakes, amplified consequences

---

## SECTION 3 — DOMAIN

### 3.1 — The Dice System

#### Standard Dice & Their Domains
| Die | Domain | Used For |
|---|---|---|
| D6 | Base Resolution | All standard deliveries; default outcome table |
| D8 | Variation Plays | Spin bowling, swing, cutters, pace changes |
| D10 | Aggression & Risk | Power hitting, slog sweeps, reverse sweeps, yorkers |
| D12 | Elite Moments | World-class player skills, special pitch events, momentum peaks |
| D4 | Pressure Die | High pressure situations — small range, punishing low rolls |
| D20 | Match Events | Random match events: DRS referral, injury, weather, crowd factor |

#### Outcome Table (D6 — Neutral Conditions, Neutral Aggression)
| Roll | Outcome |
|---|---|
| 1 | Wicket (type determined by sub-roll) |
| 2 | Dot ball — defended or missed |
| 3 | 1 run — worked to leg or nudged |
| 4 | 2 runs — good running or placement |
| 5 | 4 runs — boundary driven |
| 6 | Choice: 3 runs OR re-roll with D8 (high risk) |

> Outcome tables shift based on Aggression Level, Bowler Skill, Pitch Type, and Momentum Tier.

---

### 3.2 — Player Decision Framework

#### Batting Decisions (Each Ball)
**Shot Type** (choose one):
- `DEFEND` — Safety first. Roll D4. Low risk, low reward.
- `WORK` — Standard play. Roll D6. Balanced outcome table.
- `DRIVE` — Attacking intent. Roll D8. Wider outcome spread.
- `POWER` — Aggressive. Roll D10. High ceiling, high floor risk.
- `SLOG` — High risk/reward. Roll D12. Boundary or wicket probability dominant.

**Aggression Level** (choose one):
- `CONSERVATIVE` — Shift outcome table: fewer 6s, no wicket on 2
- `BALANCED` — Standard table
- `AGGRESSIVE` — Shift table up: more boundaries, but 1 AND 2 = wicket risk

**Running Intent** (choose one):
- `NO RISK` — Only take runs on 4+
- `SHARP` — Convert 1s to 2s (fielding dice check required)
- `STEAL` — Attempt a run even on dot outcomes (fielding dice check, high fail risk)

#### Bowling Decisions (Each Over)
**Variation** (choose per ball):
- `STOCK` — Standard delivery. Opponent rolls D6.
- `SWING/SEAM` — Movement. Opponent rolls D6 but edge results trigger catch check.
- `SPIN` — Drift and turn. Opponent rolls D8 but misread chance added.
- `PACE CHANGE` — Disrupts timing. Roll D4 for batsman's initial read.
- `YORKER` — High difficulty. Batsman must pass a D6 check or face D4 outcome table.
- `BOUNCER` — Forces hook/pull shot. Batsman must declare shot; no DEFEND option.

**Field Placement** (pre-over):
- Allocate 9 fielders across 6 zones: Slip, Gully, Cover, Mid-Off, Mid-On, Midwicket, Fine Leg, Square Leg, Deep
- Each fielder in a zone adds +1 to catch/stop difficulty in that zone
- Field settings interact with shot type outcomes — a DRIVE to cover with no cover fielder = automatic boundary

---

### 3.3 — The Modifier System

#### Player Skill Ratings (1–10 scale)
Each player carries skill ratings that modify dice outcomes:

| Skill | Effect |
|---|---|
| Batting Skill | +1 per 2 points above 5 added to roll result |
| Bowling Skill | -1 per 2 points above 5 subtracted from batsman roll |
| Fielding | Determines fielding dice type in run-out/catch checks |
| Pressure Handling | Reduces negative momentum impact on dice pool |
| Fitness | Degrades over long innings/spells (Test format) |

#### Pitch Conditions
| Pitch Type | Modifier |
|---|---|
| Flat (batting paradise) | All batting rolls +1 |
| Seaming | All swing/seam deliveries trigger edge check on 2–3 |
| Turning | Spin deliveries force D4 read check |
| Deteriorating | Pitch modifier worsens each session (Test) |
| Damp/Overcast | Swing available all innings; +1 to bowling edge rolls |

#### Format Modifiers
| Format | Pace | Aggression Default | Special Rules |
|---|---|---|---|
| T20 | Ultra-fast | AGGRESSIVE | Power Play dice bonus; last 4 overs = D10 mandatory |
| ODI | Medium | BALANCED | 10-over Power Play; 5-fielder restriction overs |
| Test | Session-based | CONSERVATIVE | Fatigue system; pitch evolution; psychological pressure accumulates over days |

---

### 3.4 — The Momentum Engine

Momentum is the **heartbeat** of the game. It runs on a scale of -10 to +10.

#### Momentum Tiers & Effects
| Tier | Range | Effect |
|---|---|---|
| IN THE ZONE | +8 to +10 | Batsman rolls D8 instead of D6 for WORK shots |
| CONFIDENT | +4 to +7 | +1 to all batting rolls |
| NEUTRAL | -3 to +3 | Standard tables apply |
| UNDER PRESSURE | -4 to -7 | -1 to all batting rolls; SLOG shot becomes D4 |
| CRUMBLING | -8 to -10 | Batsman rolls D4 for WORK; DEFEND required to stabilise |

#### Momentum Triggers
**Positive Events** (+momentum):
- Boundary: +2
- Six: +3
- Partnership milestone (50/100): +2
- Successful DRS overturning: +1
- Bowler no-ball or wide: +1

**Negative Events** (-momentum):
- Wicket: -4
- Dropped catch: -2
- Run-out (non-striker): -3
- Maiden over: -2 (batting side)
- Batting collapse (3 wickets in 10 balls): -5 instant drop

---

### 3.5 — Wicket Resolution

When a wicket result is rolled, a **sub-roll** determines the type:

#### Wicket Type Table (D6 sub-roll)
| Roll | Wicket Type | Notes |
|---|---|---|
| 1 | Bowled | Clean bowled — no fielding check |
| 2 | LBW | DRS available — D6 check: 4+ overturns |
| 3 | Caught (Infield) | Fielding zone check — difficulty based on fielder skill |
| 4 | Caught (Outfield) | Distance catch — D8 fielding check, harder to hold |
| 5 | Stumped | Only if WORK or DEFEND chosen; keeper skill check |
| 6 | Run Out | Fielding team rolls D6 vs batsman's D6 (fitness modifier) |

---

### 3.6 — Special Events System (D20)

Once per match, or triggered by double-six on consecutive D12 rolls:

| D20 Roll | Event |
|---|---|
| 1–2 | Injury (key player retires temporarily) |
| 3–4 | Weather interruption (DL adjustment if ODI/T20) |
| 5–6 | Pitch deterioration (permanent -1 batting modifier rest of innings) |
| 7–8 | Crowd factor (home team gains +2 momentum) |
| 9–10 | Controversial DRS (replayed with D20 result binding) |
| 11–12 | Captain's inspiration (team momentum +3) |
| 13–14 | New ball effect (seam bowler gets D8 for 3 overs) |
| 15–16 | Partnership pressure (batting pair: -1 bowling modifier next 2 overs) |
| 17–18 | Record attempt (milestone within 20 runs — narrative pressure applied) |
| 19–20 | Legendary ball (free re-roll of any one ball this innings) |

---

### 3.7 — Match Formats Detail

#### T20 Format Rules
- 20 overs per side
- Power Play: Overs 1–6 (max 2 fielders outside 30-yard circle)
  - Batting side rolls D8 instead of D6 during Power Play
- Death Overs (17–20): Bowling side rolls D10 — higher stakes both ways
- No Test fatigue system
- Momentum resets to 0 at innings break

#### ODI Format Rules
- 50 overs per side
- Power Play: Overs 1–10 (max 2 outside circle)
- Middle Overs (11–40): standard D6 base
- Slog Overs (41–50): D8 base for batting
- 300-run target threshold: pressure modifier kicks in for chasing side

#### Test Format Rules
- Session-based play (3 sessions of 30 overs each, 2 innings per side)
- Pitch evolves: Session 1 = flat, Session 4+ = D8 spin checks mandatory
- Batsman fatigue: after 100 balls faced, -1 to all rolls unless fitness rating 8+
- Bowler fatigue: after 15-over spell, bowling modifier degrades until rested
- Follow-on rule: triggered if deficit exceeds 200 (player decision)
- Psychological pressure accumulates across days — momentum harder to regain

---

### 3.8 — Vibe Coding Implementation Roadmap

#### Phase 1 — Core Engine (MVP)
- [ ] D6 base outcome resolver
- [ ] Shot type selection UI
- [ ] Basic batting/bowling decision tree
- [ ] Wicket sub-roll system
- [ ] Score tracker

#### Phase 2 — Momentum & Modifiers
- [ ] Momentum engine (-10 to +10 scale)
- [ ] Skill rating system for players
- [ ] Pitch condition modifiers
- [ ] Field placement pre-over UI

#### Phase 3 — Format Differentiation
- [ ] T20 Power Play / Death Over rules
- [ ] ODI slog overs
- [ ] Test session/fatigue system

#### Phase 4 — Advanced Dice Mechanics
- [ ] D8/D10/D12 extended pools
- [ ] Special Events D20 system
- [ ] Edge case outcomes (no-ball, wide, DRS)

#### Phase 5 — Polish & Feel
- [ ] Ball-by-ball narrative feedback
- [ ] Momentum visual indicator
- [ ] Match statistics summary
- [ ] Replay / scoreboard

---

### 3.9 — Design Principles for Vibe Coding Sessions

When prompting AI during development, anchor every session to these pillars:

1. **"Strategic not random"** — Every feature should reward smart play, not just lucky rolls
2. **"Dice are probability, not destiny"** — Player choices should always matter more than rolls
3. **"Cricket logic first"** — If it wouldn't make sense on a real pitch, reject it
4. **"Momentum is the drama engine"** — Feature requests should consider momentum impact
5. **"Format shapes mindset"** — T20 and Test should feel fundamentally different to play

---

## RPD SUMMARY CARD
*(Keep this visible during every coding session)*

| | |
|---|---|
| **Role** | On-Field Strategist — batting, bowling, and tactical mind |
| **Purpose** | Create a strategic cricket experience where dice are the probability engine behind every ball, not random chaos |
| **Domain** | Tabletop dice mechanics + cricket simulation + momentum psychology across T20, ODI, and Test formats |
| **Core Loop** | Decision → Dice Pool → Roll → Modify → Resolve → Momentum Update |
| **Key Tensions** | Risk vs reward / Aggression vs caution / Individual brilliance vs team pressure |
| **North Star** | Every ball should feel like a meaningful cricket moment |

---

*RPD v1.0 — Refine this document as mechanics are tested and iterated.*
