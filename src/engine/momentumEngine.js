// ═══════════════════════════════════════════════════════
//  momentumEngine.js
//  Momentum system — the psychological heartbeat of the game.
//  Momentum runs -10 to +10 and shifts dice pools over time.
//  All momentum logic is pure JS — no framework dependencies.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  MOMENTUM TIERS
//  Each tier modifies the effective dice pool
// ─────────────────────────────────────────
export const MOMENTUM_TIERS = {
  IN_THE_ZONE: {
    key:       'IN_THE_ZONE',
    label:     'IN THE ZONE',
    range:     [8, 10],
    colour:    '#f0c040',
    bgColour:  'rgba(240,192,64,0.15)',
    effect:    'WORK shot rolls D8 instead of D6',
    diceBump:  { work: 8 },           // override die sides per shot
    rollMod:   0,
  },
  CONFIDENT: {
    key:       'CONFIDENT',
    label:     'CONFIDENT',
    range:     [4, 7],
    colour:    '#27ae60',
    bgColour:  'rgba(39,174,96,0.12)',
    effect:    '+1 to all batting rolls',
    diceBump:  {},
    rollMod:   1,
  },
  NEUTRAL: {
    key:       'NEUTRAL',
    label:     'NEUTRAL',
    range:     [-3, 3],
    colour:    '#7f8c8d',
    bgColour:  'rgba(127,140,141,0.08)',
    effect:    'Standard outcome tables apply',
    diceBump:  {},
    rollMod:   0,
  },
  UNDER_PRESSURE: {
    key:       'UNDER_PRESSURE',
    label:     'UNDER PRESSURE',
    range:     [-7, -4],
    colour:    '#e67e22',
    bgColour:  'rgba(230,126,34,0.12)',
    effect:    '-1 to all batting rolls',
    diceBump:  {},
    rollMod:   -1,
  },
  CRUMBLING: {
    key:       'CRUMBLING',
    label:     'CRUMBLING',
    range:     [-10, -8],
    colour:    '#e74c3c',
    bgColour:  'rgba(231,76,60,0.15)',
    effect:    'DEFEND recommended. -1 to all batting rolls.',
    diceBump:  {},   // no die change — softened from D4 override
    rollMod:   -1,
  },
};

export const TIER_ORDER = [
  'IN_THE_ZONE',
  'CONFIDENT',
  'NEUTRAL',
  'UNDER_PRESSURE',
  'CRUMBLING',
];

// ─────────────────────────────────────────
//  GET CURRENT TIER
// ─────────────────────────────────────────
export const getMomentumTier = (momentum) => {
  for (const key of TIER_ORDER) {
    const tier = MOMENTUM_TIERS[key];
    if (momentum >= tier.range[0] && momentum <= tier.range[1]) {
      return tier;
    }
  }
  return MOMENTUM_TIERS.NEUTRAL;
};

// ─────────────────────────────────────────
//  MOMENTUM SHIFT TABLE
//  How much momentum changes per event
// ─────────────────────────────────────────
export const MOMENTUM_SHIFTS = {
  six:              +3,
  four:             +2,
  runs:             +1,   // 1, 2, or 3 runs
  dot:              -1,
  wicket:           -4,
  maiden:           -2,   // full over of dots (applied at over end)
  partnership_50:   +2,
  partnership_100:  +3,
  collapse:         -5,   // 3 wickets in 10 balls (applied separately)
};

// ─────────────────────────────────────────
//  CALCULATE MOMENTUM SHIFT
//  Returns the delta for a given ball outcome
// ─────────────────────────────────────────
export const getMomentumShift = (outcome) => {
  if (!outcome) return 0;
  if (outcome.type === 'wicket') return MOMENTUM_SHIFTS.wicket;
  if (outcome.runs === 6)        return MOMENTUM_SHIFTS.six;
  if (outcome.runs === 4)        return MOMENTUM_SHIFTS.four;
  if (outcome.runs > 0)          return MOMENTUM_SHIFTS.runs;
  if (outcome.type === 'dot')    return MOMENTUM_SHIFTS.dot;
  return 0;
};

// ─────────────────────────────────────────
//  APPLY MOMENTUM TO DICE POOL
//  Returns effective die sides for a shot,
//  accounting for the current momentum tier
// ─────────────────────────────────────────
export const getEffectiveDiceSides = (shotKey, baseSides, momentumTier) => {
  // Check if tier overrides this shot's die
  if (momentumTier.diceBump && momentumTier.diceBump[shotKey] !== undefined) {
    return momentumTier.diceBump[shotKey];
  }
  return baseSides;
};

// ─────────────────────────────────────────
//  APPLY MOMENTUM ROLL MODIFIER
//  Clamps result within valid die range
// ─────────────────────────────────────────
export const applyMomentumMod = (roll, sides, momentumTier) => {
  const modded = roll + momentumTier.rollMod;
  return Math.max(1, Math.min(sides, modded));
};

// ─────────────────────────────────────────
//  CLAMP MOMENTUM to -10 / +10
// ─────────────────────────────────────────
export const clampMomentum = (value) => Math.max(-10, Math.min(10, value));

// ─────────────────────────────────────────
//  COLLAPSE DETECTOR
//  Returns true if 3 wickets in last 10 balls
// ─────────────────────────────────────────
export const isCollapse = (recentBalls = []) => {
  const last10 = recentBalls.slice(-10);
  const wicketsInLast10 = last10.filter(b => b.type === 'wicket').length;
  return wicketsInLast10 >= 3;
};

// ─────────────────────────────────────────
//  MAIDEN OVER DETECTOR
//  Returns true if all balls in current over are dots
// ─────────────────────────────────────────
export const isMaidenOver = (overBalls = []) => {
  return overBalls.length === 6 && overBalls.every(b => b.runs === 0 && b.type !== 'wicket');
};

// ─────────────────────────────────────────
//  MOMENTUM LABEL FOR COMMENTARY
// ─────────────────────────────────────────
export const getMomentumCommentary = (oldMomentum, newMomentum) => {
  const oldTier = getMomentumTier(oldMomentum);
  const newTier = getMomentumTier(newMomentum);

  if (oldTier.key === newTier.key) return null; // no tier change, no comment

  const messages = {
    IN_THE_ZONE:     '🔥 The crowd is electric — this batsman is IN THE ZONE.',
    CONFIDENT:       '📈 Momentum is building. The batting side looks composed.',
    NEUTRAL:         '⚖️  The momentum has levelled out.',
    UNDER_PRESSURE:  '😬 The pressure is mounting. Focus is critical now.',
    CRUMBLING:       '💥 The batting side is crumbling under pressure!',
  };

  return messages[newTier.key] || null;
};
