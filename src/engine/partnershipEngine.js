// ═══════════════════════════════════════════════════════
//  partnershipEngine.js
//  Partnership tracker — milestone bonuses at 50/100.
//  Tracks runs scored together since last wicket.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  INITIAL PARTNERSHIP STATE
// ─────────────────────────────────────────
export const makePartnership = () => ({
  runs:  0,
  balls: 0,
});

// ─────────────────────────────────────────
//  MILESTONE CHECK
//  Returns milestone object if crossed, null otherwise
// ─────────────────────────────────────────
export const checkPartnershipMilestone = (oldRuns, newRuns) => {
  const milestones = [50, 100, 150, 200];

  for (const milestone of milestones) {
    if (oldRuns < milestone && newRuns >= milestone) {
      return PARTNERSHIP_MILESTONES[milestone];
    }
  }
  return null;
};

// ─────────────────────────────────────────
//  MILESTONE DEFINITIONS
// ─────────────────────────────────────────
export const PARTNERSHIP_MILESTONES = {
  50: {
    runs:          50,
    label:         '50 PARTNERSHIP',
    icon:          '🤝',
    flavour:       'A solid half-century stand — the batting side are building nicely.',
    momentumBonus: +2,
    colour:        '#27ae60',
  },
  100: {
    runs:          100,
    label:         '100 PARTNERSHIP',
    icon:          '💯',
    flavour:       'Century partnership! The bowling attack is being dismantled.',
    momentumBonus: +3,
    colour:        '#d4a017',
  },
  150: {
    runs:          150,
    label:         '150 PARTNERSHIP',
    icon:          '🔥',
    flavour:       '150 together — this is a match-defining stand.',
    momentumBonus: +3,
    colour:        '#e67e22',
  },
  200: {
    runs:          200,
    label:         '200 PARTNERSHIP',
    icon:          '⭐',
    flavour:       'Two hundred runs together! Historic batting display.',
    momentumBonus: +4,
    colour:        '#e74c3c',
  },
};

// ─────────────────────────────────────────
//  UPDATE PARTNERSHIP
// ─────────────────────────────────────────
export const updatePartnership = (partnership, runs) => ({
  runs:  partnership.runs + runs,
  balls: partnership.balls + 1,
});

// ─────────────────────────────────────────
//  RESET ON WICKET
// ─────────────────────────────────────────
export const resetPartnership = () => makePartnership();

// ─────────────────────────────────────────
//  PARTNERSHIP DISPLAY STRING
// ─────────────────────────────────────────
export const getPartnershipDisplay = (partnership) => {
  if (partnership.runs === 0) return 'New partnership';
  return `${partnership.runs} runs (${partnership.balls} balls)`;
};
