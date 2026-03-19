// ═══════════════════════════════════════════════════════
//  underdogEngine.js
//  Underdog mechanic — probability boost for the weaker
//  team at key moments: wicket saves and boundary chances.
//  Does NOT affect every ball — only pivotal moments.
//  This makes upsets feel earned, not random.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  TEAM STRENGTH CALCULATOR
//  Returns average skill rating for a squad
// ─────────────────────────────────────────
export const getTeamStrength = (squad) => {
  if (!squad || !squad.players) return 5;
  const total = squad.players.reduce((sum, p) => sum + p.battingSkill + p.bowlingSkill, 0);
  return total / (squad.players.length * 2);
};

// ─────────────────────────────────────────
//  UNDERDOG DIFFERENTIAL
//  Returns how much weaker the batting side is.
//  Positive = batting side is the underdog.
//  Negative = batting side is the favourite.
// ─────────────────────────────────────────
export const getUnderdogDifferential = (battingSquad, bowlingSquad) => {
  if (!battingSquad || !bowlingSquad) return 0;
  const batStrength  = getTeamStrength(battingSquad);
  const bowlStrength = getTeamStrength(bowlingSquad);
  return bowlStrength - batStrength; // positive when batting team is weaker
};

// ─────────────────────────────────────────
//  UNDERDOG TIERS
// ─────────────────────────────────────────
export const UNDERDOG_TIERS = {
  none:     { label: 'EVENLY MATCHED', differential: 0,   boostChance: 0    },
  slight:   { label: 'SLIGHT UNDERDOG', differential: 0.5, boostChance: 0.15 },
  moderate: { label: 'UNDERDOG',        differential: 1.0, boostChance: 0.25 },
  heavy:    { label: 'HEAVY UNDERDOG',  differential: 1.5, boostChance: 0.35 },
};

export const getUnderdogTier = (differential) => {
  if (differential >= 1.5) return UNDERDOG_TIERS.heavy;
  if (differential >= 1.0) return UNDERDOG_TIERS.moderate;
  if (differential >= 0.5) return UNDERDOG_TIERS.slight;
  return UNDERDOG_TIERS.none;
};

// ─────────────────────────────────────────
//  WICKET SAVE CHECK
//  On a wicket outcome, underdog gets a chance
//  to convert it to a near-miss dot ball instead.
//  Called AFTER outcome is determined.
// ─────────────────────────────────────────
export const checkUnderdogWicketSave = (outcome, differential) => {
  if (outcome.type !== 'wicket') return outcome;
  if (differential <= 0) return outcome; // not the underdog

  const tier        = getUnderdogTier(differential);
  const saveChance  = tier.boostChance;
  if (saveChance <= 0) return outcome;

  const roll = Math.random();
  if (roll < saveChance) {
    // Convert wicket to a lucky escape
    const escapes = [
      { type: 'dot', runs: 0, label: 'DOT BALL', detail: 'Edged but falls short of the fielder — lucky escape!' },
      { type: 'dot', runs: 0, label: 'DOT BALL', detail: 'Top edge flies over the keeper — survives!' },
      { type: 'runs', runs: 1, label: '1 RUN',   detail: 'Bottom edge sneaks past the stumps for a single!' },
    ];
    const escape = escapes[Math.floor(Math.random() * escapes.length)];
    return { ...escape, underdogSave: true };
  }
  return outcome;
};

// ─────────────────────────────────────────
//  BOUNDARY BOOST CHECK
//  On a near-boundary outcome (2 or 3 runs),
//  underdog gets a chance to convert to a boundary.
// ─────────────────────────────────────────
export const checkUnderdogBoundaryBoost = (outcome, differential) => {
  if (outcome.runs < 2 || outcome.runs > 3) return outcome;
  if (differential <= 0) return outcome;

  const tier        = getUnderdogTier(differential);
  const boostChance = tier.boostChance * 0.6; // slightly lower than wicket save
  if (boostChance <= 0) return outcome;

  const roll = Math.random();
  if (roll < boostChance) {
    return {
      ...outcome,
      type:   'four',
      runs:   4,
      label:  'FOUR!',
      detail: outcome.detail.replace(/two|three/i, 'four') + ' — races to the boundary!',
      underdogBoost: true,
    };
  }
  return outcome;
};

// ─────────────────────────────────────────
//  APPLY ALL UNDERDOG CHECKS
//  Single entry point called from ball resolver
// ─────────────────────────────────────────
export const applyUnderdogEffect = (outcome, battingSquad, bowlingSquad) => {
  const differential = getUnderdogDifferential(battingSquad, bowlingSquad);
  if (differential < 0.5) return outcome; // no meaningful underdog situation

  // Check wicket save first
  let result = checkUnderdogWicketSave(outcome, differential);

  // If still a run outcome, check boundary boost
  if (result.type !== 'wicket') {
    result = checkUnderdogBoundaryBoost(result, differential);
  }

  return result;
};

// ─────────────────────────────────────────
//  UNDERDOG COMMENTARY
// ─────────────────────────────────────────
export const getUnderdogCommentary = (outcome) => {
  if (outcome.underdogSave) {
    return 'The underdog survives! Moments like these write cricket history.';
  }
  if (outcome.underdogBoost) {
    return 'The underdogs are fighting! Every run matters in this battle.';
  }
  return null;
};

// ─────────────────────────────────────────
//  MATCH CONTEXT LABEL
//  Shown on PlayerSetup / pre-match screen
// ─────────────────────────────────────────
export const getMatchContextLabel = (battingSquad, bowlingSquad) => {
  const differential = getUnderdogDifferential(battingSquad, bowlingSquad);
  const tier = getUnderdogTier(differential);

  if (differential < 0.5) {
    return { label: 'EVENLY MATCHED', colour: '#7f8c8d', description: 'A contest of equals.' };
  }

  const batStrength  = getTeamStrength(battingSquad).toFixed(1);
  const bowlStrength = getTeamStrength(bowlingSquad).toFixed(1);

  return {
    label:       tier.label,
    colour:      differential >= 1.5 ? '#e74c3c' : differential >= 1.0 ? '#e67e22' : '#d4a017',
    description: `Batting avg: ${batStrength} · Bowling avg: ${bowlStrength} · Upset boost: ${Math.round(tier.boostChance * 100)}%`,
  };
};
