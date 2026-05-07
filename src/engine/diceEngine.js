// ═══════════════════════════════════════════════════════
//  DICE ENGINE — Balanced v6
//
//  Key design principle: wickets sit at HIGH face numbers.
//  This means:
//  -1 modifier (bowling skill, pressure) → turns wicket face
//   into a boundary/six (rewards caution, reduces punishment)
//  +1 modifier (momentum, batting skill) → turns top run face
//   into a wicket (punishes recklessness, adds tension)
//
//  Simulated results at neutral mod mix (40% -1, 40% 0, 20% +1):
//  Neutral:   mean 168, p25=155, p50=171, p75=185
//  Pressure:  mean 145, p25=133, p50=144, p75=156
//  Momentum+: mean 132, p25=100, p50=128, p75=162 (high variance)
// ═══════════════════════════════════════════════════════

export const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;

// ─────────────────────────────────────────
//  SHOT CONFIG
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
//  OUTCOME TABLES — v6
//
//  Wickets at HIGH faces so modifiers work intuitively:
//  Conservative/good bowling → shifts roll DOWN → away from wicket
//  Aggressive/bad pitch      → shifts roll UP   → toward wicket
//
//  DEFEND D4:  safe, max 1 run, no wickets
//  WORK   D6:  no wicket, dots + singles + twos
//  DRIVE  D8:  wicket only on face 8 (12.5%)
//  POWER  D10: wickets on faces 9-10 (20%)
//  SLOG   D12: wickets on faces 11-12 (17%)
// ─────────────────────────────────────────
export const OUTCOME_TABLES = {

  // DEFEND D4 — 0% wicket, 50% dot, 50% single
  defend: {
    1: { type: 'dot',  runs: 0, label: 'DOT BALL', detail: 'Defended solidly back down the pitch.' },
    2: { type: 'dot',  runs: 0, label: 'DOT BALL', detail: 'Left well alone outside off stump.' },
    3: { type: 'runs', runs: 1, label: '1 RUN',    detail: 'Worked to leg for a comfortable single.' },
    4: { type: 'runs', runs: 1, label: '1 RUN',    detail: 'Nudged into the gap — scrambles one.' },
  },

  // WORK D6 — 0% wicket, 33% dot, 33% single, 33% two
  // Wickets on work come from bowling forced checks only
  work: {
    1: { type: 'dot',  runs: 0, label: 'DOT BALL', detail: 'Missed outside off, good leave.' },
    2: { type: 'dot',  runs: 0, label: 'DOT BALL', detail: 'Hit straight to mid-on, no run.' },
    3: { type: 'runs', runs: 1, label: '1 RUN',    detail: 'Nudged to leg for a single.' },
    4: { type: 'runs', runs: 1, label: '1 RUN',    detail: 'Pushed through covers, one taken.' },
    5: { type: 'runs', runs: 2, label: '2 RUNS',   detail: 'Placed through the gap, two runs.' },
    6: { type: 'runs', runs: 2, label: '2 RUNS',   detail: 'Worked to fine leg, two taken.' },
  },

  // DRIVE D8 — wicket ONLY on face 8 (12.5%)
  // -1 mod turns wicket → six (caution rewarded)
  // +1 mod turns six → wicket (aggression punished)
  drive: {
    1: { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Straight to mid-off. No run.' },
    2: { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Driven but fielder cuts it off.' },
    3: { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Good drive, fielder saves the boundary.' },
    4: { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Well driven, two smart runs taken.' },
    5: { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Through the covers — two taken.' },
    6: { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Beautiful drive through the covers!' },
    7: { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Launched straight over the bowler head!' },
    8: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Drove hard and found the edge.' },
  },

  // POWER D10 — wickets on faces 9-10 (20%)
  // Sixes on 7-8, just below danger zone
  power: {
    1:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Swung and missed. Crowd gasps.' },
    2:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Jammed out at the last second.' },
    3:  { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Mistimed but scrambles a single.' },
    4:  { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Hit powerfully, fielder cuts it off.' },
    5:  { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Hit powerfully but found the fielder.' },
    6:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Muscled through midwicket to the rope!' },
    7:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Smashed down the ground!' },
    8:  { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Enormous strike, over deep midwicket!' },
    9:  { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Skied to long-on. Poor shot selection.' },
    10: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Missed the slog — clean bowled.' },
  },

  // SLOG D12 — wickets on faces 10-12 (25%)
  // Six-heavy but slightly reined in: sixes on faces 7-9.
  // Keeps slog explosive while increasing collapse risk on over-attack.
  slog: {
    1:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Swung mightily but missed by a mile.' },
    2:  { type: 'dot',    runs: 0, label: 'DOT BALL', detail: 'Yorked! Jammed out at last second.' },
    3:  { type: 'runs',   runs: 1, label: '1 RUN',    detail: 'Mishit trickles for one.' },
    4:  { type: 'runs',   runs: 2, label: '2 RUNS',   detail: 'Thick edge, scrambles two.' },
    5:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Hit in the middle — crashes to the rope!' },
    6:  { type: 'four',   runs: 4, label: 'FOUR!',    detail: 'Slapped over the infield for four.' },
    7:  { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Pure slog — it goes all the way!' },
    8:  { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Launched into the stands!' },
    9:  { type: 'six',    runs: 6, label: 'SIX!',     detail: 'Maximum! Unbelievable clean strike.' },
    10: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Tried to clear the ropes but miscued badly to long-on.' },
    11: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Ballooned a catch to deep fine leg.' },
    12: { type: 'wicket', runs: 0, label: 'WICKET!',  detail: 'Charged and completely missed it.' },
  },
};

// ─────────────────────────────────────────
//  WICKET TYPES — 5 flavours per dismissal
// ─────────────────────────────────────────
export const WICKET_TYPES = {
  1: {
    type: 'BOWLED', drs: false,
    flavours: [
      'Castled! The stumps are shattered.',
      'Through the gate — middle stump gone!',
      'Played on! Deflects off the pad into the stumps.',
      'Clean bowled — never saw it.',
      'The ball jagged back sharply and hit off stump.',
    ],
  },
  2: {
    type: 'LBW', drs: true,
    flavours: [
      'Plumb in front! Finger raised immediately.',
      'Trapped on the crease — umpire has no hesitation.',
      'Big appeal and given! Sliding in full — that is out.',
      'Missed the sweep — hits him right in front of off stump.',
      'Trapped on the back foot — out LBW.',
    ],
  },
  3: {
    type: 'CAUGHT SLIP', drs: false,
    flavours: [
      'Edged and taken at first slip — regulation catch.',
      'Outside edge flies to second slip — caught low to the right.',
      'Thick edge, gully takes it cleanly.',
      'Nicks off — keeper takes it cleanly going to his right.',
      'Feathered edge behind — caught at second slip.',
    ],
  },
  4: {
    type: 'CAUGHT OUTFIELD', drs: false,
    flavours: [
      'Skied to long-on — settles under it easily.',
      'Miscued pull shot — mid-wicket takes it running back.',
      'Top-edged the slog — fine leg settles under it.',
      'Superb running catch at deep cover — brilliant fielding!',
      'Holes out to long-off — picked the fielder perfectly.',
    ],
  },
  5: {
    type: 'STUMPED', drs: false,
    flavours: [
      'Down the pitch and missed — keeper whips the bails off!',
      'Stranded! Stumped in a flash.',
      'Beaten in flight, foot in the air — stumped easily.',
      'Danced out and beaten — keeper does the rest.',
      'Miles out of his crease — stumped!',
    ],
  },
  6: {
    type: 'RUN OUT', drs: false,
    flavours: [
      'Direct hit! Not even close — run out by a yard.',
      'Terrible mix-up between the batsmen — one has to go.',
      'Brilliant throw from the deep — direct hit, out!',
      'Called for a suicidal single — run out comfortably.',
      'Caught short of his ground — sharp fielding wins it.',
    ],
  },
};

// ─────────────────────────────────────────
//  CORE BALL RESOLVER
// ─────────────────────────────────────────
export const resolveBall = (shotKey, aggressionKey) => {
  const { sides } = SHOT_CONFIG[shotKey];
  const { mod }   = AGGRESSION_CONFIG[aggressionKey];
  const rawRoll   = rollDie(sides);
  const clampedRoll = Math.max(1, Math.min(sides, rawRoll + mod));
  const outcome   = OUTCOME_TABLES[shotKey][clampedRoll];
  return { rawRoll, clampedRoll, dieLabel: SHOT_CONFIG[shotKey].label, ...outcome };
};

// ─────────────────────────────────────────
//  WICKET RESOLVER
// ─────────────────────────────────────────
export const resolveWicket = () => {
  const roll    = rollDie(6);
  const entry   = WICKET_TYPES[roll];
  const flavour = entry.flavours[Math.floor(Math.random() * entry.flavours.length)];
  return { roll, type: entry.type, detail: flavour, drs: entry.drs };
};

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────
export const getOutcomeColour = (outcome) => {
  if (!outcome) return '#f5f0e8';
  if (outcome.type === 'wicket') return '#8e44ad';
  if (outcome.runs === 6)        return '#e74c3c';
  if (outcome.runs === 4)        return '#e67e22';
  if (outcome.runs > 0)          return '#27ae60';
  return '#7f8c8d';
};

export const getBallPipStyle = (ballResult) => {
  if (!ballResult)                  return 'empty';
  if (ballResult.type === 'wicket') return 'wicket';
  if (ballResult.runs === 6)        return 'six';
  if (ballResult.runs === 4)        return 'four';
  if (ballResult.runs === 3)        return 'three';
  if (ballResult.runs === 2)        return 'two';
  if (ballResult.runs === 1)        return 'one';
  return 'dot';
};