 // ═══════════════════════════════════════════════════════
//  DICE ENGINE
//  Pure JavaScript — no framework dependencies.
//  This is the core probability engine for Pitch & Dice.
//  All game logic lives here; UI components call these functions.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  DICE ROLLER
// ─────────────────────────────────────────
export const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;

// ─────────────────────────────────────────
//  SHOT TYPE → DICE MAPPING
// ─────────────────────────────────────────
export const SHOT_CONFIG = {
  defend: { sides: 4,  label: 'D4',  risk: 'SAFE',      display: 'DEFEND' },
  work:   { sides: 6,  label: 'D6',  risk: 'BALANCED',  display: 'WORK'   },
  drive:  { sides: 8,  label: 'D8',  risk: 'ATTACKING', display: 'DRIVE'  },
  power:  { sides: 10, label: 'D10', risk: 'HIGH RISK', display: 'POWER'  },
  slog:   { sides: 12, label: 'D12', risk: 'MAX RISK',  display: 'SLOG'   },
};

export const SHOT_KEYS = ['defend', 'work', 'drive', 'power', 'slog'];

// ─────────────────────────────────────────
//  AGGRESSION MODIFIERS
// ─────────────────────────────────────────
export const AGGRESSION_CONFIG = {
  conservative: { mod: -1, label: 'CONSERVATIVE', colour: '#2980b9' },
  balanced:     { mod:  0, label: 'BALANCED',     colour: '#3a7a24' },
  aggressive:   { mod:  1, label: 'AGGRESSIVE',   colour: '#c0392b' },
};

export const AGGRESSION_KEYS = ['conservative', 'balanced', 'aggressive'];

// ─────────────────────────────────────────
//  OUTCOME TABLES — Rebalanced
//  Target probabilities at neutral (mod=0):
//  WORK D6:  ~17% wicket, ~33% dot, ~17% runs, ~33% boundary
//  Wickets come from shot risk + bowling variations, not stacked modifiers.
// ─────────────────────────────────────────
export const OUTCOME_TABLES = {
  // ── DEFEND D4 ── safe, 0% wicket, max 2 runs
  defend: {
    1: { type: 'dot',  runs: 0, label: 'DOT BALL', detail: 'Defended solidly back down the pitch.' },
    2: { type: 'dot',  runs: 0, label: 'DOT BALL', detail: 'Left well alone outside off stump.' },
    3: { type: 'runs', runs: 1, label: '1 RUN',    detail: 'Worked to leg for a comfortable single.' },
    4: { type: 'runs', runs: 2, label: '2 RUNS',   detail: 'Nudged into the gap — two taken.' },
  },
  // ── WORK D6 ── 1 wicket (17%), 2 dot (33%), 1 run (17%), 1 four (17%), 1 six (17%)
  work: {
    1: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Beaten by the delivery — gone!' },
    2: { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Missed outside off, good leave.' },
    3: { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Hit straight to mid-on, no run.' },
    4: { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Placed through the gap, two runs.' },
    5: { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Driven through the covers — superb timing.' },
    6: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Dispatched over the boundary!' },
  },
  // ── DRIVE D8 ── 1 wicket (12.5%), 1 dot, 3 runs, 2 four, 1 six
  drive: {
    1: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Drove hard and found the edge.' },
    2: { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Straight to mid-off. No run.' },
    3: { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Driven but fielder cuts it off.' },
    4: { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Well driven, two smart runs taken.' },
    5: { type: 'runs',   runs: 3, label: '3 RUNS',   detail: 'To deep midwicket, three taken.' },
    6: { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Beautiful drive through the covers!' },
    7: { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Cracking straight drive to the rope!' },
    8: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Launched straight over the bowler head!' },
  },
  // ── POWER D10 ── 2 wicket (20%), 1 dot, 2 runs, 3 four, 2 six
  power: {
    1:  { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Skied to long-on. Poor shot.' },
    2:  { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Missed the slog — clean bowled.' },
    3:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Swung and missed. Crowd gasps.' },
    4:  { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Mistimed but scrambles a single.' },
    5:  { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Hit powerfully but found the fielder.' },
    6:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Muscled through midwicket to the rope!' },
    7:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Smashed down the ground!' },
    8:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Driven powerfully over the infield!' },
    9:  { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Enormous strike, over deep midwicket!' },
    10: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Out of the ground! Absolutely massive.' },
  },
  // ── SLOG D12 ── 3 wicket (25%), 2 dot, 2 runs, 2 four, 3 six
  slog: {
    1:  { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Ballooned a catch to deep fine leg.' },
    2:  { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Charged and completely missed it.' },
    3:  { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Spooned it back to the bowler.' },
    4:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Swung mightily but missed by a mile.' },
    5:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Yorked! Jammed out at last second.' },
    6:  { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Mishit, but two are taken.' },
    7:  { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Thick edge, scrambles two.' },
    8:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Hit in the middle — crashes to the rope!' },
    9:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Slapped over the infield for four.' },
    10: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Pure slog — it goes all the way!' },
    11: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Launched into the stands!' },
    12: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Maximum! Unbelievable clean strike.' },
  },
};

// ─────────────────────────────────────────
//  WICKET SUB-ROLL TABLE (D6)
// ─────────────────────────────────────────
export const WICKET_TYPES = {
  1: { type: 'BOWLED',           detail: 'Castled! The stumps are shattered.',            drs: false },
  2: { type: 'LBW',              detail: 'Plumb in front! Finger raised. DRS available.', drs: true  },
  3: { type: 'CAUGHT (INFIELD)', detail: 'Edged to slip — a regulation catch.',           drs: false },
  4: { type: 'CAUGHT (OUTFIELD)',detail: 'Superb running catch on the boundary!',         drs: false },
  5: { type: 'STUMPED',          detail: 'Down the pitch — keeper whips the bails off!',  drs: false },
  6: { type: 'RUN OUT',          detail: 'Direct hit! Not even close — out by a yard.',   drs: false },
};

// ─────────────────────────────────────────
//  CORE BALL RESOLVER
//  Takes shot + aggression, returns outcome object
// ─────────────────────────────────────────
export const resolveBall = (shotKey, aggressionKey) => {
  const { sides } = SHOT_CONFIG[shotKey];
  const { mod }   = AGGRESSION_CONFIG[aggressionKey];
  const rawRoll   = rollDie(sides);
  const clampedRoll = Math.max(1, Math.min(sides, rawRoll + mod));
  const outcome   = OUTCOME_TABLES[shotKey][clampedRoll];

  return {
    rawRoll,
    clampedRoll,
    dieLabel: SHOT_CONFIG[shotKey].label,
    ...outcome,
  };
};

// ─────────────────────────────────────────
//  WICKET RESOLVER
//  Call this when resolveBall returns type === 'wicket'
// ─────────────────────────────────────────
export const resolveWicket = () => {
  const roll = rollDie(6);
  return { roll, ...WICKET_TYPES[roll] };
};

// ─────────────────────────────────────────
//  OUTCOME COLOUR HELPER
// ─────────────────────────────────────────
export const getOutcomeColour = (outcome) => {
  if (!outcome) return '#f5f0e8';
  if (outcome.type === 'wicket') return '#8e44ad';
  if (outcome.runs === 6)        return '#e74c3c';
  if (outcome.runs === 4)        return '#e67e22';
  if (outcome.runs > 0)          return '#27ae60';
  return '#7f8c8d';
};

// ─────────────────────────────────────────
//  BALL PIP HELPER (for over display)
// ─────────────────────────────────────────
export const getBallPipStyle = (ballResult) => {
  if (!ballResult) return 'empty';
  if (ballResult.type === 'wicket') return 'wicket';
  if (ballResult.runs === 6) return 'six';
  if (ballResult.runs === 4) return 'four';
  if (ballResult.runs === 3) return 'three';
  if (ballResult.runs === 2) return 'two';
  if (ballResult.runs === 1) return 'one';
  return 'dot';
};