// ═══════════════════════════════════════════════════════
//  bowlingEngine.js
//  Bowling variation system — chosen every ball,
//  mirrors the shot type system on the batting side.
//  Each variation modifies outcome probabilities or
//  forces specific checks before outcome resolution.
// ═══════════════════════════════════════════════════════

export const BOWLING_VARIATIONS = {
  stock: {
    key:         'stock',
    label:       'STOCK',
    description: 'Standard delivery — no surprises',
    shortLabel:  'STK',
    colour:      '#7f8c8d',
    rollMod:     0,
    wicketBoost: 0,
    forcedCheck: null,
    detail:      'Bowled on a good length, line and length.',
  },
  swing: {
    key:         'swing',
    label:       'SWING',
    description: 'Outswing or inswing — movement in the air',
    shortLabel:  'SWG',
    colour:      '#2980b9',
    rollMod:     -1,    // harder for batsman
    wicketBoost: 0,
    forcedCheck: 'edge', // on low rolls, edge check replaces clean dismissal
    detail:      'The ball swings late through the air.',
  },
  spin: {
    key:         'spin',
    label:       'SPIN',
    description: 'Turn and drift — read it or face the consequences',
    shortLabel:  'SPN',
    colour:      '#8e44ad',
    rollMod:     -1,
    wicketBoost: 0,
    forcedCheck: 'misread',
    detail:      'Rips off the surface with big turn.',
  },
  paceChange: {
    key:         'paceChange',
    label:       'PACE CHANGE',
    description: 'Slower ball — disrupts timing',
    shortLabel:  'PCH',
    colour:      '#d4a017',
    rollMod:     0,
    wicketBoost: 0,
    forcedCheck: 'timing', // roll D4 first as timing check
    detail:      'The slower ball deceives the batsman.',
  },
  yorker: {
    key:         'yorker',
    label:       'YORKER',
    description: 'Full and straight — toe-crusher',
    shortLabel:  'YRK',
    colour:      '#e67e22',
    rollMod:     -1,    // reduced from -2 to prevent over-stacking
    wicketBoost: +1,
    forcedCheck: null,
    detail:      'Drilled into the blockhole.',
  },
  bouncer: {
    key:         'bouncer',
    label:       'BOUNCER',
    description: 'Short and hostile — hook or duck',
    shortLabel:  'BNC',
    colour:      '#e74c3c',
    rollMod:     0,
    wicketBoost: 0,
    forcedCheck: 'hook', // batsman must pick hook/duck — affects outcome
    detail:      'Rears up sharply at the batsman\'s throat.',
  },
};

export const BOWLING_KEYS = ['stock', 'swing', 'spin', 'paceChange', 'yorker', 'bouncer'];

// ─────────────────────────────────────────
//  APPLY BOWLING MODIFIER TO ROLL
// ─────────────────────────────────────────
export const applyBowlingMod = (roll, sides, variationKey) => {
  const variation = BOWLING_VARIATIONS[variationKey];
  if (!variation) return roll;
  return Math.max(1, Math.min(sides, roll + variation.rollMod));
};

// ─────────────────────────────────────────
//  FORCED CHECK RESOLVER
//  Some variations trigger a pre-roll check
//  that can override the normal outcome
// ─────────────────────────────────────────
export const resolveForcedCheck = (variationKey, rollDieFn, aggressionKey, netSkillMod = 0) => {
  const variation = BOWLING_VARIATIONS[variationKey];
  if (!variation || !variation.forcedCheck) return null;

  const checkRoll = rollDieFn(6);
  // Apply skill modifier to check roll — skilled batsmen handle variations better
  const adjustedRoll = Math.max(1, Math.min(6, checkRoll + netSkillMod));

  switch (variation.forcedCheck) {
    case 'edge':
      // Swing edge — only triggers on roll = 1 (skill-adjusted)
      // ~16.7% chance, reduced from ≤2 to stop dot inflation
      if (adjustedRoll === 1) {
        return {
          type:   'dot',
          runs:   0,
          label:  'DOT BALL',
          detail: 'The swing found the edge but flew safely through the gap.',
          forced: true,
        };
      }
      return null;

    case 'misread':
      // Spin misread — roll = 1 only
      if (adjustedRoll === 1) {
        return {
          type:   'dot',
          runs:   0,
          label:  'DOT BALL',
          detail: 'The spin deceived the batsman — jammed out at the last second.',
          forced: true,
        };
      }
      return null;

    case 'timing':
      // Slower ball — roll = 1 only
      if (adjustedRoll === 1) {
        return {
          type:   'dot',
          runs:   0,
          label:  'DOT BALL',
          detail: 'Completely foxed by the slower ball — big swing and a miss.',
          forced: true,
        };
      }
      return null;

    case 'hook':
      // Bouncer hook — conservative always ducks safely
      if (aggressionKey === 'conservative') {
        return {
          type:   'dot',
          runs:   0,
          label:  'DOT BALL',
          detail: 'Ducked under the bouncer — sensible play.',
          forced: true,
        };
      }
      // Aggressive: wicket only on roll = 1 (rare), six on 5-6
      if (adjustedRoll === 1) {
        return {
          type:   'wicket',
          runs:   0,
          label:  'WICKET!',
          detail: 'Tried the hook — top-edged to fine leg!',
          forced: true,
        };
      }
      if (adjustedRoll >= 5) {
        return {
          type:   'six',
          runs:   6,
          label:  'SIX!',
          detail: 'Swivelled and pulled it over the rope! Audacious.',
          forced: true,
        };
      }
      return null;

    default:
      return null;
  }
};

// ─────────────────────────────────────────
//  BOWLING COMMENTARY
// ─────────────────────────────────────────
export const getBowlingCommentary = (variationKey, pitchKey) => {
  const synergies = {
    'swing-damp':          'The conditions are tailor-made for this — the ball is swinging prodigiously.',
    'spin-turning':        'Lethal combination — spin on a turning pitch.',
    'yorker-flat':         'Even on a flat pitch, the yorker is a dangerous weapon.',
    'bouncer-deteriorating': 'Uneven bounce makes this bouncer genuinely frightening.',
  };
  return synergies[`${variationKey}-${pitchKey}`] || null;
};
