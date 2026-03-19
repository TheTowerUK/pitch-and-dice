// ═══════════════════════════════════════════════════════
//  pressureEngine.js
//  Run rate pressure system — chase modifier.
//  Applies roll penalty + momentum hit when the
//  required run rate climbs beyond thresholds.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  REQUIRED RUN RATE CALCULATOR
// ─────────────────────────────────────────
export const getRequiredRunRate = (target, runs, ballsRemaining) => {
  if (!target || ballsRemaining <= 0) return 0;
  const runsNeeded = target - runs;
  if (runsNeeded <= 0) return 0;
  const oversRemaining = ballsRemaining / 6;
  return runsNeeded / oversRemaining;
};

// ─────────────────────────────────────────
//  CURRENT RUN RATE
// ─────────────────────────────────────────
export const getCurrentRunRate = (runs, balls) => {
  if (balls <= 0) return 0;
  return (runs / balls) * 6;
};

// ─────────────────────────────────────────
//  PRESSURE TIERS
//  Based on required run rate in a chase
// ─────────────────────────────────────────
export const PRESSURE_TIERS = {
  comfortable: {
    key:          'comfortable',
    label:        'COMFORTABLE',
    rrrThreshold: 0,      // RRR < 7
    rollMod:      0,
    momentumHit:  0,
    colour:       '#27ae60',
    description:  'Chase is well in hand.',
  },
  watchful: {
    key:          'watchful',
    label:        'WATCHFUL',
    rrrThreshold: 7,      // RRR 7–9
    rollMod:      0,
    momentumHit:  -1,
    colour:       '#d4a017',
    description:  'Run rate tightening — keep focused.',
  },
  tense: {
    key:          'tense',
    label:        'TENSE',
    rrrThreshold: 10,     // RRR 10–12
    rollMod:      -1,
    momentumHit:  -2,
    colour:       '#e67e22',
    description:  'Required rate climbing — need boundaries.',
  },
  desperate: {
    key:          'desperate',
    label:        'DESPERATE',
    rrrThreshold: 13,     // RRR 13–15
    rollMod:      -1,
    momentumHit:  -3,
    colour:       '#c0392b',
    description:  'Near impossible — must swing hard.',
  },
  impossible: {
    key:          'impossible',
    label:        'IMPOSSIBLE',
    rrrThreshold: 16,     // RRR > 16
    rollMod:      -2,
    momentumHit:  -4,
    colour:       '#8e44ad',
    description:  'The game is up. Only a miracle can save them.',
  },
};

// ─────────────────────────────────────────
//  GET PRESSURE TIER FROM RRR
// ─────────────────────────────────────────
export const getPressureTier = (rrr) => {
  if (rrr >= 16) return PRESSURE_TIERS.impossible;
  if (rrr >= 13) return PRESSURE_TIERS.desperate;
  if (rrr >= 10) return PRESSURE_TIERS.tense;
  if (rrr >= 7)  return PRESSURE_TIERS.watchful;
  return PRESSURE_TIERS.comfortable;
};

// ─────────────────────────────────────────
//  APPLY PRESSURE ROLL MOD
// ─────────────────────────────────────────
export const applyPressureMod = (roll, sides, tier) => {
  if (!tier || tier.rollMod === 0) return roll;
  return Math.max(1, Math.min(sides, roll + tier.rollMod));
};

// ─────────────────────────────────────────
//  PRESSURE COMMENTARY
// ─────────────────────────────────────────
export const getPressureCommentary = (rrr, ballsRemaining) => {
  if (rrr <= 0 || !ballsRemaining) return null;
  const oversLeft = (ballsRemaining / 6).toFixed(1);

  if (rrr >= 16) return `Required rate ${rrr.toFixed(1)} with ${oversLeft} overs left. It's virtually over.`;
  if (rrr >= 13) return `Need ${rrr.toFixed(1)} an over from ${oversLeft} overs. Desperate hitting required.`;
  if (rrr >= 10) return `Required rate ${rrr.toFixed(1)} — boundaries are a must now.`;
  if (rrr >= 7)  return `Run rate ticking up to ${rrr.toFixed(1)}. Stay watchful.`;
  return null;
};

// ─────────────────────────────────────────
//  IS CHASING?
// ─────────────────────────────────────────
export const isChasing = (target, innings) => !!target && innings === 2;
