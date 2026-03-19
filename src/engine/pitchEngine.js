// ═══════════════════════════════════════════════════════
//  pitchEngine.js
//  Pitch condition system — passive modifier applied
//  to every ball resolution.
// ═══════════════════════════════════════════════════════

export const PITCH_TYPES = {
  flat: {
    key:         'flat',
    label:       'FLAT',
    description: 'Batting paradise — true bounce, no movement',
    colour:      '#27ae60',
    rollMod:     +1,    // batsman benefit
    edgeBoost:   0,     // extra wicket chance on edges
    spinBoost:   0,
    swingBoost:  0,
    icon:        '🟩',
  },
  seaming: {
    key:         'seaming',
    label:       'SEAMING',
    description: 'Late movement off the pitch — edges likely',
    colour:      '#e67e22',
    rollMod:     0,
    edgeBoost:   +1,    // on rolls 2-3, edge check triggered
    spinBoost:   0,
    swingBoost:  +1,
    icon:        '🟠',
  },
  turning: {
    key:         'turning',
    label:       'TURNING',
    description: 'Significant spin — read the ball or perish',
    colour:      '#8e44ad',
    rollMod:     0,
    edgeBoost:   0,
    spinBoost:   +1,    // spin variations get extra wicket chance
    swingBoost:  0,
    icon:        '🟣',
  },
  deteriorating: {
    key:         'deteriorating',
    label:       'DETERIORATING',
    description: 'Pitch breaking up — uneven bounce, unpredictable',
    colour:      '#c0392b',
    rollMod:     -1,    // batsman penalty
    edgeBoost:   +1,
    spinBoost:   +1,
    swingBoost:  0,
    icon:        '🔴',
  },
  damp: {
    key:         'damp',
    label:       'DAMP',
    description: 'Overcast and damp — swing all day',
    colour:      '#2980b9',
    rollMod:     0,
    edgeBoost:   0,
    spinBoost:   0,
    swingBoost:  +2,    // swing variations heavily favoured
    icon:        '🔵',
  },
};

export const PITCH_KEYS = ['flat', 'seaming', 'turning', 'deteriorating', 'damp'];

// ─────────────────────────────────────────
//  APPLY PITCH MODIFIER TO ROLL
// ─────────────────────────────────────────
export const applyPitchMod = (roll, sides, pitchKey) => {
  const pitch = PITCH_TYPES[pitchKey];
  if (!pitch) return roll;
  return Math.max(1, Math.min(sides, roll + pitch.rollMod));
};

// ─────────────────────────────────────────
//  GET PITCH COMMENTARY
// ─────────────────────────────────────────
export const getPitchCommentary = (pitchKey) => {
  const msgs = {
    flat:          'The pitch is playing beautifully — ideal for batting.',
    seaming:       'The ball is moving off the seam. Every edge is dangerous.',
    turning:       'Big turn off the surface. Reading the spin is critical.',
    deteriorating: 'The pitch is crumbling. Uneven bounce making life difficult.',
    damp:          'Overhead conditions are perfect for swing bowling.',
  };
  return msgs[pitchKey] || '';
};
