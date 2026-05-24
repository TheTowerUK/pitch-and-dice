// ═══════════════════════════════════════════════════════
//  deliveryVisualMap.js
//  Presentation-only ball path targets (viewBox 0–100).
// ═══════════════════════════════════════════════════════

import {
  BOUNDARY_ROPE_TARGETS,
  FIELD_ZONE_SLOTS,
  ROLE_MARKERS,
} from './fieldDiagramLayout';

/** Contact point just down the pitch from the batter marker. */
export const BALL_CONTACT_POINT = { x: 50, y: 36 };

const { bowler } = ROLE_MARKERS;
const { midOn, midwicket, cover, midOff, slip } = FIELD_ZONE_SLOTS;

const SHORT_STOP = { x: 46, y: 40 };
const DEFEND_BLOCK = { x: 54, y: 42 };

/**
 * @param {string} shot
 * @param {boolean} isSix
 * @returns {{ x: number, y: number }}
 */
const resolveRopeTarget = (shot, isSix) => {
  const tier = isSix ? BOUNDARY_ROPE_TARGETS.six : BOUNDARY_ROPE_TARGETS.four;

  switch (shot) {
    case 'slog':
      return tier.legBehind;
    case 'drive':
      return tier.offBehind;
    case 'power':
      return tier.off;
    case 'work':
      return tier.leg;
    default:
      return tier.straight;
  }
};

/**
 * @param {string|null|undefined} selectedShot
 * @param {{ type?: string, runs?: number }|null|undefined} outcome
 * @returns {{ x: number, y: number }|null}
 */
export const resolveBallPathTarget = (selectedShot, outcome) => {
  if (!outcome) return null;

  const shot = (selectedShot || 'work').toLowerCase();

  if (outcome.type === 'wicket') {
    return slip[0];
  }

  if (outcome.type === 'dot' || (outcome.runs ?? 0) === 0) {
    return SHORT_STOP;
  }

  if (outcome.type === 'six' || outcome.runs === 6) {
    return resolveRopeTarget(shot, true);
  }

  if (outcome.type === 'four' || outcome.runs === 4) {
    return resolveRopeTarget(shot, false);
  }

  const runs = outcome.runs ?? 0;

  switch (shot) {
    case 'defend':
      return DEFEND_BLOCK;
    case 'work':
      return runs >= 2 ? midwicket[0] : midOn[0];
    case 'drive':
      return runs >= 2 ? midOff[0] : cover[0];
    case 'power':
      return runs >= 2 ? midOff[1] : midOff[0];
    case 'slog':
      return runs >= 2 ? midwicket[1] : midwicket[0];
    default:
      return runs >= 2 ? midwicket[0] : midOn[0];
  }
};

/**
 * @param {string|null|undefined} selectedShot
 * @param {{ type?: string, runs?: number }|null|undefined} outcome
 * @returns {{ from: {x:number,y:number}, contact: {x:number,y:number}, to: {x:number,y:number} }|null}
 */
export const getBallPathPoints = (selectedShot, outcome) => {
  const to = resolveBallPathTarget(selectedShot, outcome);
  if (!to) return null;

  return {
    from: { x: bowler.x, y: bowler.y },
    contact: BALL_CONTACT_POINT,
    to,
  };
};

/** Total path duration (ms) by outcome — presentation only. */
export const BALL_PATH_DURATIONS = {
  dot: 310,
  single: 365,
  multi: 430,
  four: 575,
  six: 720,
  wicket: 525,
};

/**
 * Bowler → contact stays ~22% of path progress (BALL_DELIVERY_LEG_RATIO);
 * longer totals add time on the batter → destination leg only.
 */
export const getBallPathDuration = (outcome) => {
  if (!outcome) return 0;
  if (outcome.type === 'wicket') return BALL_PATH_DURATIONS.wicket;
  if (outcome.type === 'six' || outcome.runs === 6) return BALL_PATH_DURATIONS.six;
  if (outcome.type === 'four' || outcome.runs === 4) return BALL_PATH_DURATIONS.four;
  if (outcome.type === 'dot' || (outcome.runs ?? 0) === 0) return BALL_PATH_DURATIONS.dot;

  const runs = outcome.runs ?? 0;
  if (runs >= 2) return BALL_PATH_DURATIONS.multi;
  if (runs === 1) return BALL_PATH_DURATIONS.single;
  return BALL_PATH_DURATIONS.single;
};

/** Fraction of path progress spent on bowler → contact leg (~20–25%). */
export const BALL_DELIVERY_LEG_RATIO = 0.22;
