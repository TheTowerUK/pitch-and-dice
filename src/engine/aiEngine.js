// ═══════════════════════════════════════════════════════
//  aiEngine.js
//  Rule-based AI decision engine — Medium difficulty.
//  Makes situationally intelligent choices without
//  being omniscient or random.
//  All logic is pure JS — no framework dependencies.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  AI BOWLING DECISION
//  Returns { variation, reasoning }
//  Called when player is BATTING (AI bowls)
// ─────────────────────────────────────────
export const getAIBowlingVariation = (state) => {
  const {
    balls, wickets, runs, momentum,
    target, innings, pitchType, format,
  } = state;

  const over          = Math.floor(balls / 6);
  const ballInOver    = balls % 6;
  const totalOvers    = { T20: 20, ODI: 50, Test: 90 }[format] || 20;
  const isDeathOvers  = over >= totalOvers - 4;
  const isPowerPlay   = over < 6;
  const isMidInnings  = over >= 6 && over < totalOvers - 4;
  const isChasing     = !!target && innings === 2;
  const runsNeeded    = target ? target - runs : null;
  const ballsLeft     = (totalOvers * 6) - balls;
  const rrr           = runsNeeded && ballsLeft > 0
    ? (runsNeeded / ballsLeft) * 6 : 0;

  // ── Situation-based decisions ──────────

  // Death overs — go for yorkers and bouncers
  if (isDeathOvers) {
    if (ballInOver <= 2) {
      return { variation: 'yorker', reasoning: 'Death overs — aiming for the blockhole.' };
    }
    if (momentum > 4) {
      return { variation: 'bouncer', reasoning: 'Batsman in form — test them with a short one.' };
    }
    return { variation: 'yorker', reasoning: 'Trying to restrict at the death.' };
  }

  // Power play — swing if conditions suit, else stock
  if (isPowerPlay) {
    if (pitchType === 'damp' || pitchType === 'seaming') {
      return { variation: 'swing', reasoning: 'Conditions perfect for swing in the power play.' };
    }
    if (wickets === 0 && over >= 3) {
      return { variation: 'swing', reasoning: 'Settled partnership — try to get movement.' };
    }
    return { variation: 'stock', reasoning: 'Building pressure in the power play.' };
  }

  // Turning pitch — exploit with spin
  if (pitchType === 'turning' || pitchType === 'deteriorating') {
    return { variation: 'spin', reasoning: 'Pitch is turning — spinning it hard.' };
  }

  // Batsman in the zone — try to disrupt
  if (momentum >= 6) {
    const disruptors = ['bouncer', 'paceChange', 'swing'];
    const pick = disruptors[Math.floor(Math.random() * disruptors.length)];
    return { variation: pick, reasoning: 'Batsman is dangerous — mixing it up.' };
  }

  // Chase is getting away from bowling side — go aggressive
  if (isChasing && rrr < 7 && isMidInnings) {
    return { variation: 'spin', reasoning: 'Chase is comfortable — trying to build pressure.' };
  }

  // Batsman under pressure — apply more squeeze
  if (momentum <= -4) {
    return { variation: 'stock', reasoning: 'Batsman is struggling — keeping it tight.' };
  }

  // Wicket just fell — slip in a good one to new batsman
  if (wickets > 0 && ballInOver === 0) {
    return { variation: 'swing', reasoning: 'New batsman in — going for movement early.' };
  }

  // Mid innings default — mix it up
  const midOptions = ['stock', 'stock', 'swing', 'spin', 'paceChange'];
  const pick = midOptions[Math.floor(Math.random() * midOptions.length)];
  return { variation: pick, reasoning: 'Varying the attack to build pressure.' };
};

// ─────────────────────────────────────────
//  AI BATTING DECISION
//  Returns { shot, aggression, reasoning }
//  Called when player is BOWLING (AI bats)
// ─────────────────────────────────────────
export const getAIBattingDecision = (state) => {
  const {
    balls, wickets, runs, momentum,
    target, innings, format,
  } = state;

  const over         = Math.floor(balls / 6);
  const totalOvers   = { T20: 20, ODI: 50, Test: 90 }[format] || 20;
  const isDeathOvers = over >= totalOvers - 4;
  const isPowerPlay  = over < 6;
  const isChasing    = !!target && innings === 2;
  const runsNeeded   = target ? target - runs : null;
  const ballsLeft    = (totalOvers * 6) - balls;
  const rrr          = runsNeeded && ballsLeft > 0
    ? (runsNeeded / ballsLeft) * 6 : 0;

  // ── Situation-based decisions ──────────

  // Crumbling — survive first
  if (momentum <= -6 || wickets >= 7) {
    return {
      shot:       'defend',
      aggression: 'conservative',
      reasoning:  'Under serious pressure — just surviving.',
    };
  }

  // Under pressure — play carefully
  if (momentum <= -3 || wickets >= 5) {
    return {
      shot:       'work',
      aggression: 'conservative',
      reasoning:  'Too many wickets down — staying patient.',
    };
  }

  // Chase is desperate — must go big
  if (isChasing && rrr >= 13) {
    return {
      shot:       'slog',
      aggression: 'aggressive',
      reasoning:  'Need big shots — nothing to lose now.',
    };
  }

  // Chase requires acceleration
  if (isChasing && rrr >= 10) {
    return {
      shot:       'power',
      aggression: 'aggressive',
      reasoning:  'Run rate climbing — need boundaries.',
    };
  }

  // Death overs — go hard
  if (isDeathOvers) {
    if (momentum >= 4) {
      return {
        shot:       'slog',
        aggression: 'aggressive',
        reasoning:  'Death overs, in form — going for it.',
      };
    }
    return {
      shot:       'power',
      aggression: 'aggressive',
      reasoning:  'Death overs — must accelerate.',
    };
  }

  // Power play — take advantage of fielding restrictions
  if (isPowerPlay) {
    return {
      shot:       'drive',
      aggression: 'balanced',
      reasoning:  'Power play — using the fielding restrictions.',
    };
  }

  // In the zone — press the advantage
  if (momentum >= 6) {
    return {
      shot:       'power',
      aggression: 'aggressive',
      reasoning:  'Feeling good — pressing the advantage.',
    };
  }

  // Confident — keep scoring
  if (momentum >= 3) {
    return {
      shot:       'drive',
      aggression: 'balanced',
      reasoning:  'Playing well — keeping the scoreboard moving.',
    };
  }

  // Chase comfortable — rotate strike
  if (isChasing && rrr < 7) {
    return {
      shot:       'work',
      aggression: 'balanced',
      reasoning:  'Chase is on track — rotating strike.',
    };
  }

  // Default neutral mid-innings
  return {
    shot:       'work',
    aggression: 'balanced',
    reasoning:  'Building the innings — playing sensibly.',
  };
};

// ─────────────────────────────────────────
//  AI FIELD PLACEMENT
//  Returns a field object based on match situation
// ─────────────────────────────────────────
export const getAIFieldPlacement = (state) => {
  const { wickets, momentum, pitchType, balls, format } = state;
  const totalOvers   = { T20: 20, ODI: 50, Test: 90 }[format] || 20;
  const currentOver  = Math.floor(balls / 6);
  const isDeathOvers = currentOver >= totalOvers - 4;
  const isPowerPlay  = currentOver < 6;

  // Attacking field — slips up
  if (wickets < 3 && momentum < 0) {
    return { slip: 3, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 2 };
  }

  // Defensive field — protect boundaries
  if (isDeathOvers || momentum > 5) {
    return { slip: 1, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 4 };
  }

  // Spin field — close catchers
  if (pitchType === 'turning') {
    return { slip: 2, cover: 2, midOff: 1, midOn: 1, midwicket: 1, deepBound: 2 };
  }

  // Default balanced
  return { slip: 2, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 3 };
};

// ─────────────────────────────────────────
//  AI BOWLER SELECTION
//  Picks best available bowler for the situation.
//  Mirrors getAIBowlerSelection in teamEngine.js.
// ─────────────────────────────────────────
export const getAIBowlerSelection = (squadState, format, momentum, pitchType) => {
  if (!squadState) return null;

  const maxOvers = { T20: 4, ODI: 10, Test: 999 }[format] || 4;

  const available = squadState.players
    .map((player, idx) => ({ player, idx }))
    .filter(({ player, idx }) => {
      if (player.bowlingSkill <= 3) return false;
      const bowled = squadState.oversBowled?.[player.id] || 0;
      if (bowled >= maxOvers) return false;
      if (squadState.currentBatsmen?.includes(idx)) return false;
      return true;
    });

  if (available.length === 0) return null;

  // On turning pitch — prefer high-skill bowlers
  if (pitchType === 'turning' || pitchType === 'deteriorating') {
    const sorted = available.sort((a, b) => b.player.bowlingSkill - a.player.bowlingSkill);
    return sorted[0].idx;
  }

  // Pick highest bowling skill available
  const sorted = available.sort((a, b) => b.player.bowlingSkill - a.player.bowlingSkill);
  return sorted[0].idx;
};

// ─────────────────────────────────────────
//  GAME MODE CONSTANTS
// ─────────────────────────────────────────
export const GAME_MODES = {
  manual:  { key: 'manual',  label: 'MANUAL MODE',  description: 'Control both batting and bowling every ball' },
  batting: { key: 'batting', label: 'PLAY — BAT',   description: 'You bat, AI bowls' },
  bowling: { key: 'bowling', label: 'PLAY — BOWL',  description: 'You bowl, AI bats' },
};
