// ═══════════════════════════════════════════════════════
//  pressureEngine.js
//  Format-aware chase pressure — dice modifier + commentary.
//  Required rate never pushes to desperate/impossible alone.
// ═══════════════════════════════════════════════════════

/** Mirrors `FORMATS` in `constants/theme.js` — kept local so the engine stays bundleable without cross-layer coupling. */
const FORMAT_OVERS = { T20: 20, ODI: 50, Test: 90 };

/** Same rule as `isCollapse` in `momentumEngine.js` — duplicated to avoid a package-graph cycle. */
const isCollapseWindow = (recentBalls = []) => {
  const last10 = recentBalls.slice(-10);
  return last10.filter((b) => b.type === 'wicket').length >= 3;
};

// ─────────────────────────────────────────
//  STATE KEYS (ordered low → high tension)
// ─────────────────────────────────────────
export const PRESSURE_STATE_ORDER = [
  'comfortable',
  'watchful',
  'tense',
  'desperate',
  'impossible',
];

export const PRESSURE_STATES = Object.fromEntries(
  PRESSURE_STATE_ORDER.map((key, order) => [key, { key, order }]),
);

/** Per-format phase baselines & tuning (RRR is interpreted in match context, not raw thresholds). */
export const FORMAT_PRESSURE_BASELINES = {
  T20: {
    totalOvers: 20,
    powerplayEndOver: 6,
    middleEndOver: 15,
    deathStartOver: 16,
    /** RRR above this in death is “normal cricket”, not automatic panic */
    deathRrrComfort: 11.5,
    middleRrrComfort: 9,
    powerplayRrrComfort: 8.5,
    deathRrrSpan: 7,
    middleRrrSpan: 6,
    powerplayRrrSpan: 5,
  },
  ODI: {
    totalOvers: 50,
    powerplayEndOver: 10,
    middleEndOver: 40,
    deathStartOver: 41,
    middleRrrComfort: 5.5,
    deathRrrComfort: 7.5,
    powerplayRrrComfort: 6.5,
    middleRrrSpan: 4,
    deathRrrSpan: 5.5,
    powerplayRrrSpan: 4.5,
  },
  Test: {
    totalOvers: 90,
    lateStartOver: 70,
    /** Outside collapse/endgame, effective pressure rarely exceeds this band */
    softCapState: 'tense',
    inningsRrrComfort: 4,
    inningsRrrSpan: 3.5,
    lateRrrComfort: 5,
    lateRrrSpan: 4,
  },
};

// ─────────────────────────────────────────
//  LEGACY TIER OBJECTS (UI + dice — unchanged fields)
// ─────────────────────────────────────────
export const PRESSURE_TIERS = {
  comfortable: {
    key: 'comfortable',
    label: 'COMFORTABLE',
    rrrThreshold: 0,
    rollMod: 0,
    momentumHit: 0,
    colour: '#27ae60',
    description: 'The chase is under control.',
  },
  watchful: {
    key: 'watchful',
    label: 'WATCHFUL',
    rrrThreshold: 7,
    rollMod: 0,
    momentumHit: -1,
    colour: '#d4a017',
    description: 'The required rate is rising — stay focused.',
  },
  tense: {
    key: 'tense',
    label: 'TENSE',
    rrrThreshold: 10,
    rollMod: -1,
    momentumHit: -2,
    colour: '#e67e22',
    description: 'The chase is tightening — boundaries are needed.',
  },
  desperate: {
    key: 'desperate',
    label: 'DESPERATE',
    rrrThreshold: 13,
    rollMod: -1,
    momentumHit: -3,
    colour: '#c0392b',
    description: 'The equation is turning brutal — they must attack now.',
  },
  impossible: {
    key: 'impossible',
    label: 'IMPOSSIBLE',
    rrrThreshold: 16,
    rollMod: -2,
    momentumHit: -4,
    colour: '#8e44ad',
    description: 'The required rate has blown out — only a miracle saves this chase.',
  },
};

// ─────────────────────────────────────────
//  REQUIRED RUN RATE / CURRENT RR
// ─────────────────────────────────────────
export const getRequiredRunRate = (target, runs, ballsRemaining) => {
  if (!target || ballsRemaining <= 0) return 0;
  const runsNeeded = target - runs;
  if (runsNeeded <= 0) return 0;
  const oversRemaining = ballsRemaining / 6;
  return runsNeeded / oversRemaining;
};

export const getCurrentRunRate = (runs, balls) => {
  if (balls <= 0) return 0;
  return (runs / balls) * 6;
};

export const isChasing = (target, innings) => !!target && innings === 2;

// ─────────────────────────────────────────
//  INPUT NORMALISATION
// ─────────────────────────────────────────
export const normalizePressureInput = (raw = {}) => {
  const format = raw.format || 'T20';
  const maxBalls = raw.maxBalls ?? (FORMAT_OVERS[format] ?? 20) * 6;
  const balls = raw.balls ?? 0;
  const ballsRemaining = raw.ballsRemaining != null
    ? Math.max(0, raw.ballsRemaining)
    : Math.max(0, maxBalls - balls);
  const wickets = raw.wickets ?? 0;
  const runs = raw.runs ?? 0;
  const target = raw.target ?? null;
  const runsNeeded = target != null ? Math.max(0, target - runs) : 0;
  const rrr = target != null && ballsRemaining > 0
    ? getRequiredRunRate(target, runs, ballsRemaining)
    : 0;
  const wicketsRemaining = Math.max(0, 10 - wickets);
  const oversBowled = balls / 6;
  const innings = raw.innings ?? 1;
  const momentum = raw.momentum ?? 0;
  const recentBalls = raw.recentBalls ?? [];
  const lastPressureIndex = raw.lastPressureIndex != null ? raw.lastPressureIndex : null;

  return {
    format,
    maxBalls,
    balls,
    ballsRemaining,
    wickets,
    runs,
    target,
    innings,
    runsNeeded,
    rrr,
    wicketsRemaining,
    oversBowled,
    momentum,
    recentBalls,
    lastPressureIndex,
  };
};

// ─────────────────────────────────────────
//  PHASE
// ─────────────────────────────────────────
export const getInningsPhase = (ctx) => {
  const { format, oversBowled, maxBalls } = ctx;
  const totalOvers = maxBalls / 6;
  const ob = oversBowled;

  if (format === 'T20') {
    if (ob < 6) return 'powerplay';
    if (ob < 16) return 'middle';
    return 'death';
  }
  if (format === 'ODI') {
    if (ob < 10) return 'powerplay';
    if (ob < 41) return 'middle';
    return 'death';
  }
  if (format === 'Test') {
    if (ob < 20) return 'early';
    if (ob < 70) return 'middle';
    return 'late';
  }
  if (ob < totalOvers * 0.33) return 'powerplay';
  if (ob < totalOvers * 0.75) return 'middle';
  return 'death';
};

// ─────────────────────────────────────────
//  COMPONENT HELPERS (deterministic)
// ─────────────────────────────────────────

/** 0–40: never enough on its own to reach desperate (needs other factors). */
export const getRequiredRatePressure = (ctx, phase) => {
  const { format, rrr, runsNeeded, ballsRemaining } = ctx;
  if (!runsNeeded || ballsRemaining <= 0 || rrr <= 0) return { score: 0, baseline: 0, excess: 0 };

  const BL = FORMAT_PRESSURE_BASELINES[format] || FORMAT_PRESSURE_BASELINES.T20;
  let baseline = 8;
  let span = 6;

  if (format === 'T20') {
    if (phase === 'powerplay') {
      baseline = BL.powerplayRrrComfort;
      span = BL.powerplayRrrSpan;
    } else if (phase === 'middle') {
      baseline = BL.middleRrrComfort;
      span = BL.middleRrrSpan;
    } else {
      baseline = BL.deathRrrComfort;
      span = BL.deathRrrSpan;
    }
  } else if (format === 'ODI') {
    if (phase === 'powerplay') {
      baseline = BL.powerplayRrrComfort;
      span = BL.powerplayRrrSpan;
    } else if (phase === 'middle') {
      baseline = BL.middleRrrComfort;
      span = BL.middleRrrSpan;
    } else {
      baseline = BL.deathRrrComfort;
      span = BL.deathRrrSpan;
    }
  } else {
    baseline = phase === 'late' ? BL.lateRrrComfort : BL.inningsRrrComfort;
    span = phase === 'late' ? BL.lateRrrSpan : BL.inningsRrrSpan;
  }

  const excess = Math.max(0, rrr - baseline);
  const normalized = span > 0 ? excess / span : 0;
  let score = Math.min(40, normalized * 34);

  if (format === 'ODI' && phase === 'middle') {
    score *= 0.55;
  }

  return { score, baseline, excess };
};

export const getWicketPressure = (ctx) => {
  const w = ctx.wicketsRemaining;
  if (w >= 7) return { score: 0, bucket: 'deep' };
  if (w === 6) return { score: 5, bucket: 'healthy' };
  if (w === 5) return { score: 10, bucket: 'touch' };
  if (w === 4) return { score: 16, bucket: 'worry' };
  if (w === 3) return { score: 24, bucket: 'thin' };
  if (w === 2) return { score: 32, bucket: 'tail' };
  if (w === 1) return { score: 40, bucket: 'last_pair' };
  return { score: 48, bucket: 'last_man' };
};

export const getRecentMomentumPressure = (ctx) => {
  const slice = (ctx.recentBalls || []).slice(-8);
  let score = 0;
  let dots = 0;
  let boundaries = 0;
  let wicketsInWindow = 0;

  for (const b of slice) {
    if (b.type === 'wicket') {
      wicketsInWindow += 1;
      dots = 0;
      score += 10;
    } else if (b.runs === 0 || b.type === 'dot') {
      dots += 1;
      score += Math.min(3, dots + 1);
    } else {
      dots = 0;
      if (b.runs >= 4) {
        boundaries += 1;
        score -= b.runs >= 6 ? 5 : 4;
      } else {
        score -= 2;
      }
    }
  }

  if (wicketsInWindow >= 2) score += 12;
  score += ctx.momentum <= -6 ? 8 : ctx.momentum <= -3 ? 4 : 0;
  score = Math.max(-12, Math.min(28, score));

  return { score, wicketsInWindow, sampleSize: slice.length };
};

export const getBallsRemainingPressure = (ctx) => {
  const { ballsRemaining, runsNeeded, format } = ctx;
  if (runsNeeded <= 0 || ballsRemaining <= 0) return { score: 0, urgency: 'done' };

  let score = 0;
  if (ballsRemaining <= 6) score += 22;
  else if (ballsRemaining <= 12) score += 16;
  else if (ballsRemaining <= 24) score += 10;
  else if (ballsRemaining <= 36) score += 5;

  const perBall = runsNeeded / Math.max(1, ballsRemaining);
  if (perBall >= 2.5) score += 8;
  else if (perBall >= 2) score += 4;

  if (format === 'Test' && ballsRemaining > 48) score = Math.min(score, 6);

  return { score, perBallTarget: perBall };
};

/**
 * Phase nudges total score (not RR in isolation).
 * T20 death: tolerate higher RRR — situational urgency comes from balls/wickets, not RR slope alone.
 */
export const getPhasePressureAdjustment = (ctx, phase) => {
  const { format, runsNeeded } = ctx;
  if (runsNeeded <= 0) return { adj: 0, reason: 'chase_done' };

  if (format === 'ODI' && phase === 'middle') {
    return { adj: -16, reason: 'odi_middle_grind' };
  }
  if (format === 'T20' && phase === 'death') {
    return { adj: 4, reason: 't20_death_context' };
  }
  if (format === 'Test' && phase === 'middle') {
    return { adj: -6, reason: 'test_middle_grind' };
  }
  return { adj: 0, reason: 'neutral' };
};

export const capPressureState = (index, ctx, components, phase) => {
  let i = Math.max(0, Math.min(PRESSURE_STATE_ORDER.length - 1, index));
  const { format, runsNeeded, ballsRemaining, wicketsRemaining } = ctx;

  if (format === 'Test') {
    const late = phase === 'late';
    const collapse = isCollapseWindow(ctx.recentBalls || []);
    const endgame =
      ballsRemaining <= 18 ||
      wicketsRemaining <= 3 ||
      (runsNeeded > 0 && runsNeeded <= 24 && ballsRemaining <= 36) ||
      (runsNeeded > 0 && ballsRemaining <= 30 && wicketsRemaining <= 4);
    if (!late && !collapse && !endgame) {
      i = Math.min(i, PRESSURE_STATES.tense.order);
    }
  }

  // Required rate alone must not justify desperate / impossible
  if (i >= PRESSURE_STATES.desperate.order) {
    const rr = components.requiredRate?.score ?? 0;
    const wk = components.wickets?.score ?? 0;
    const mom = components.momentum?.score ?? 0;
    const bal = components.ballsRemaining?.score ?? 0;
    const situational =
      wicketsRemaining <= 4 ||
      ballsRemaining <= 24 ||
      mom >= 12 ||
      wk >= 18 ||
      bal >= 14 ||
      isCollapseWindow(ctx.recentBalls || []);
    const rrLedExtreme = rr > wk + mom + bal + 8;
    if (rrLedExtreme && !situational) {
      i = Math.min(i, PRESSURE_STATES.tense.order);
    }
  }

  return i;
};

/**
 * RR-only band mapping — used to enforce “RR alone never hits extreme”.
 */
export const mapRrOnlyToBand = (ctx, phase) => {
  const { score } = getRequiredRatePressure(ctx, phase);
  if (score <= 12) return 0;
  if (score <= 22) return 1;
  return 2;
};

export const applyPressureGuardrails = (rawIndex, ctx, components, phase, options = {}) => {
  const { forMechanics = false } = options;
  let idx = rawIndex;

  const { wicketsRemaining, runsNeeded, ballsRemaining } = ctx;

  if (runsNeeded > 0 && wicketsRemaining >= 6 && ballsRemaining > 42) {
    const wicketCluster = (components.wickets?.score ?? 0) >= 20;
    const prev = ctx.lastPressureIndex;
    if (typeof prev === 'number' && prev >= 0 && !wicketCluster && idx - prev > 2) {
      idx = Math.min(idx, prev + 2);
    }
  }

  if (!forMechanics && typeof ctx.lastPressureIndex === 'number' && ctx.lastPressureIndex >= 0) {
    const delta = idx - ctx.lastPressureIndex;
    const endgame =
      ballsRemaining <= 18 ||
      wicketsRemaining <= 3 ||
      runsNeeded / Math.max(1, ballsRemaining / 6) >= 14;
    const cluster = isCollapseWindow(ctx.recentBalls || []);
    if (delta > 1 && !endgame && !cluster && wicketsRemaining >= 5) {
      idx = ctx.lastPressureIndex + 1;
    }
  }

  idx = capPressureState(idx, ctx, components, phase);
  return idx;
};

const scoreToRawIndex = (total) => {
  if (total <= 24) return 0;
  if (total <= 42) return 1;
  if (total <= 58) return 2;
  if (total <= 72) return 3;
  return 4;
};

export const COMMENTARY_LANES = {
  CALM: 'calm',
  BUILDING: 'building',
  WATCHFUL: 'watchful',
  URGENT: 'urgent',
  FRANTIC: 'frantic',
  SIEGE: 'siege',
};

export const getPressureCommentaryLane = (rawState) => {
  const ev = evaluatePressureContext(rawState);
  return ev.lane;
};

/** Snapshot shape matches `useGameState` / queued ball result for audio routing. */
export const evaluatePressureContextFromMatch = (matchState) => {
  if (!matchState) {
    return evaluatePressureContext({ format: 'T20', innings: 1, runs: 0, balls: 0, wickets: 0 });
  }
  const format = matchState.format || 'T20';
  const maxBalls = (FORMAT_OVERS[format] ?? 20) * 6;
  return evaluatePressureContext({
    format,
    innings: matchState.innings ?? 1,
    target: matchState.target,
    runs: matchState.runs ?? 0,
    balls: matchState.balls ?? 0,
    wickets: matchState.wickets ?? 0,
    momentum: matchState.momentum ?? 0,
    recentBalls: matchState.recentBalls ?? [],
    lastPressureIndex: matchState.lastPressureIndex ?? null,
    maxBalls,
  });
};

// ─────────────────────────────────────────
//  MAIN EVALUATION
// ─────────────────────────────────────────
export const evaluatePressureContext = (raw, options = {}) => {
  const ctx = normalizePressureInput(raw);
  const phase = getInningsPhase(ctx);
  const { forMechanics = false } = options;

  const rr = getRequiredRatePressure(ctx, phase);
  const wk = getWicketPressure(ctx);
  const mom = getRecentMomentumPressure(ctx);
  const balls = getBallsRemainingPressure(ctx);
  const phaseAdj = getPhasePressureAdjustment(ctx, phase);

  let total =
    rr.score +
    wk.score +
    mom.score +
    balls.score +
    phaseAdj.adj;

  const components = {
    requiredRate: { ...rr, phase },
    wickets: wk,
    momentum: mom,
    ballsRemaining: balls,
    phaseAdjustment: phaseAdj,
    totalBeforeGuardrails: total,
    rrOnlyBand: mapRrOnlyToBand(ctx, phase),
  };

  let rawIndex = scoreToRawIndex(total);

  rawIndex = applyPressureGuardrails(rawIndex, ctx, components, phase, { forMechanics });

  const pressureState = PRESSURE_STATE_ORDER[rawIndex];
  const lane = laneFromState(pressureState, phase, ctx);

  const debug = {
    input: {
      format: ctx.format,
      phase,
      inningsPhase: phase,
      runsNeeded: ctx.runsNeeded,
      ballsRemaining: ctx.ballsRemaining,
      rrr: ctx.rrr,
      requiredRunRate: ctx.rrr,
      wicketsRemaining: ctx.wicketsRemaining,
      wicketsDown: 10 - ctx.wicketsRemaining,
      momentum: ctx.momentum,
      lastPressureIndex: ctx.lastPressureIndex,
    },
    components,
    totalScore: total,
    rawIndexFromScore: scoreToRawIndex(total),
    pressureIndex: rawIndex,
    pressureState,
    lane,
    forMechanics,
  };

  const result = {
    pressureState,
    pressureIndex: rawIndex,
    lane,
    debug,
  };

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[pressure]', result);
  }

  return result;
};

function laneFromState(stateKey, phase, ctx) {
  if (stateKey === 'comfortable') {
    return phase === 'middle' && ctx.format === 'ODI'
      ? COMMENTARY_LANES.BUILDING
      : COMMENTARY_LANES.CALM;
  }
  if (stateKey === 'watchful') {
    return COMMENTARY_LANES.WATCHFUL;
  }
  if (stateKey === 'tense') {
    return COMMENTARY_LANES.URGENT;
  }
  if (stateKey === 'desperate') {
    return COMMENTARY_LANES.FRANTIC;
  }
  return COMMENTARY_LANES.SIEGE;
}

// ─────────────────────────────────────────
//  LEGACY: tier lookup — prefers full context; number falls back to synthetic chase
// ─────────────────────────────────────────
export const buildSyntheticChaseFromRrr = (rrr, format = 'T20') => {
  const maxB = (FORMAT_OVERS[format] ?? 20) * 6;
  const ballsRemaining = 60;
  const runsNeeded = Math.max(0, (rrr * ballsRemaining) / 6);
  const runs = 120;
  const target = runs + runsNeeded;
  return {
    format,
    innings: 2,
    target,
    runs,
    balls: maxB - ballsRemaining,
    wickets: 3,
    momentum: 0,
    recentBalls: [],
    lastPressureIndex: null,
    maxBalls: maxB,
  };
};

export const getPressureTier = (rrrOrContext, legacyFormat) => {
  const isNumeric = typeof rrrOrContext === 'number';
  const ctx = isNumeric
    ? buildSyntheticChaseFromRrr(rrrOrContext, legacyFormat || 'T20')
    : rrrOrContext;
  const { pressureState } = evaluatePressureContext(ctx, { forMechanics: isNumeric });
  return PRESSURE_TIERS[pressureState];
};

export const applyPressureMod = (roll, sides, tier) => {
  if (!tier || tier.rollMod === 0) return roll;
  return Math.max(1, Math.min(sides, roll + tier.rollMod));
};

export const getPressureCommentary = (rawState) => {
  const ev = evaluatePressureContext(rawState);
  const { lane } = ev;
  const d = ev.debug.input;
  const rrr = d.rrr;
  const oversLeft = d.ballsRemaining > 0 ? (d.ballsRemaining / 6).toFixed(1) : '0';

  if (rrr <= 0 || !d.ballsRemaining) return null;
  if (ev.pressureState === 'comfortable' && lane === COMMENTARY_LANES.CALM) return null;

  if (lane === COMMENTARY_LANES.SIEGE) {
    return `Required rate ${rrr.toFixed(1)} from ${oversLeft} overs — the chase is barely alive.`;
  }
  if (lane === COMMENTARY_LANES.FRANTIC) {
    return `They need ${rrr.toFixed(1)} an over with time running out — the innings must open up.`;
  }
  if (lane === COMMENTARY_LANES.URGENT) {
    return `Required rate ${rrr.toFixed(1)} — the chase is tightening; risk and reward both rise.`;
  }
  if (lane === COMMENTARY_LANES.WATCHFUL) {
    return `Run rate climbing toward ${rrr.toFixed(1)} — still manageable, but the margin is shrinking.`;
  }
  if (lane === COMMENTARY_LANES.BUILDING) {
    return `The chase is forming — around ${rrr.toFixed(1)} needed from ${oversLeft} overs, plenty of time to build.`;
  }
  return `The chase is ticking along at roughly ${rrr.toFixed(1)} — no need to panic yet.`;
};
