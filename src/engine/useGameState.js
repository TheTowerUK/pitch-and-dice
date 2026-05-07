// ═══════════════════════════════════════════════════════
//  useGameState.js — Phase 4 with Teams + Squads
//  Adds: batting squad, bowling squad, bowler selection,
//  auto-next-batsman from batting order, scorecard tracking.
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SHOT_CONFIG, OUTCOME_TABLES, AGGRESSION_CONFIG,
  resolveWicket, rollDie,
} from '../engine/diceEngine';
import {
  getMomentumTier, getMomentumShift,
  getEffectiveDiceSides, applyMomentumMod,
  clampMomentum, isCollapse, isMaidenOver,
  getMomentumCommentary,
} from '../engine/momentumEngine';
import {
  DEFAULT_BATSMAN, DEFAULT_BOWLER,
  applySkillMod, getNetSkillMod,
} from '../engine/playerEngine';
import { applyPitchMod }                          from '../engine/pitchEngine';
import {
  BOWLING_VARIATIONS, applyBowlingMod,
  resolveForcedCheck, getBowlingCommentary,
} from '../engine/bowlingEngine';
import {
  DEFAULT_FIELD, getFieldMod,
  checkBoundarySave, getSlipCatchBoost,
} from '../engine/fieldEngine';
import {
  SPECIAL_EVENT_COOLDOWN_LEGAL_BALLS,
  shouldTriggerEvent, resolveSpecialEvent, applyEventEffect,
} from '../engine/specialEvents';
import {
  getRequiredRunRate, getPressureTier,
  PRESSURE_TIERS,
  applyPressureMod, getPressureCommentary, isChasing,
  evaluatePressureContext,
} from '../engine/pressureEngine';
import {
  makePartnership, updatePartnership, resetPartnership,
  checkPartnershipMilestone,
} from '../engine/partnershipEngine';
import {
  saveCurrentMatch, clearCurrentMatch,
  saveMatchToHistory, buildMatchSummary,
  isResumableInProgressMatch,
} from '../engine/storageEngine';
import {
  getAIBowlingVariation, getAIBattingDecision,
  getAIFieldPlacement, getAIBowlerSelection,
} from '../engine/aiEngine';
import {
  applyUnderdogEffect, getUnderdogCommentary,
} from '../engine/underdogEngine';
import {
  makeSquadState, getStriker, getCurrentBowler,
  sendInNextBatsman, updateBatsmanStats,
  setDismissal, setBowler, updateBowlerOvers,
  updateBowlerBallStats,
  swapStrikerEnds,
} from '../engine/teamEngine';
import { FORMATS } from '../constants/theme';

const logPhase = (reason, snapshot) => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  console.log(`[phase] ${reason}`, snapshot);
};

const createInitialBatter = (number) => ({
  number,
  name: `Batter ${number}`,
  runs: 0,
  balls: 0,
  out: false,
});

const swapStrike = (state, reason = 'manual', runsForLog = null) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && Array.isArray(state.batters) && state.batters.length > 0) {
    const label = (idx) => state.batters[idx]?.name ?? idx;
    const before = `${label(state.strikerIndex)}/${label(state.nonStrikerIndex)}`;
    const swapped = {
      ...state,
      strikerIndex: state.nonStrikerIndex,
      nonStrikerIndex: state.strikerIndex,
      lastStrikeChangeReason: reason,
    };
    const after = `${label(swapped.strikerIndex)}/${label(swapped.nonStrikerIndex)}`;
    if (reason === 'end_of_over') {
      console.log(`[strike] rotate reason=end_of_over before=${before} after=${after}`);
    } else if (reason === 'runs' && runsForLog != null) {
      console.log(`[strike] rotate reason=runs runs=${runsForLog} before=${before} after=${after}`);
    }
    return swapped;
  }
  return {
    ...state,
    strikerIndex: state.nonStrikerIndex,
    nonStrikerIndex: state.strikerIndex,
    lastStrikeChangeReason: reason,
  };
};

const decrementSpecialEventCooldowns = (cooldowns = {}) => (
  Object.entries(cooldowns).reduce((acc, [type, remaining]) => {
    const nextRemaining = Math.max(0, (remaining || 0) - 1);
    if (nextRemaining > 0) acc[type] = nextRemaining;
    return acc;
  }, {})
);

const getSpecialEventCooldownsForSelection = (state, eventType) => {
  const cooldown = SPECIAL_EVENT_COOLDOWN_LEGAL_BALLS[eventType] || 0;
  if (cooldown <= 0) return state.specialEventCooldownsByType || {};
  return {
    ...(state.specialEventCooldownsByType || {}),
    [eventType]: cooldown,
  };
};

const carrySpecialEventCooldownsIntoNextInnings = (cooldowns = {}) => {
  const resetOnNewInnings = new Set(['no_ball', 'dropped_catch', 'new_ball']);
  return Object.entries(cooldowns).reduce((acc, [type, remaining]) => {
    if (!resetOnNewInnings.has(type) && remaining > 0) acc[type] = remaining;
    return acc;
  }, {});
};

const applyScoringDelivery = (state, runs) => {
  const next = {
    ...state,
    currentPartnershipRuns: state.currentPartnershipRuns + runs,
    currentPartnershipBalls: state.currentPartnershipBalls + 1,
  };
  if (runs === 1 || runs === 3) {
    return swapStrike(next, 'runs', runs);
  }
  return next;
};

const applyDotDelivery = (state) => ({
  ...state,
  currentPartnershipBalls: state.currentPartnershipBalls + 1,
});

const createNextBatter = (state) => {
  const nextNumber = state.nextBatterNumber || 3;
  const nextBatter = createInitialBatter(nextNumber);
  return {
    nextState: {
      ...state,
      batters: [...state.batters, nextBatter],
      nextBatterNumber: nextNumber + 1,
    },
    nextIndex: state.batters.length,
  };
};

const applyWicketDelivery = (state) => {
  if (!Array.isArray(state.batters) || state.batters.length === 0) return state;
  const strikerIndex = state.strikerIndex ?? 0;
  const withOutStriker = {
    ...state,
    batters: state.batters.map((b, idx) => (
      idx === strikerIndex ? { ...b, out: true } : b
    )),
    currentPartnershipRuns: 0,
    currentPartnershipBalls: 0,
  };
  const { nextState, nextIndex } = createNextBatter(withOutStriker);
  return {
    ...nextState,
    strikerIndex: nextIndex,
    lastStrikeChangeReason: 'wicket_new_batter',
  };
};

// ─────────────────────────────────────────
//  INITIAL STATE
// ─────────────────────────────────────────
const makeInningsState = () => ({
  runs:        0,
  wickets:     0,
  balls:       0,
  boundaries:  0,
  sixes:       0,
  dots:        0,
  momentum:    0,
  overBalls:   [],
  recentBalls: [],
  commentary:  [],
  field:       { ...DEFAULT_FIELD },
  partnership: makePartnership(),
  freeHit:          false,
  drsReviews:       1,
  pendingMilestone: null,
  rollingState:     null,
  pendingInningsEnd: false,
  pendingNextOver:  null,
  lastPressureIndex: null,
  batters: [
    createInitialBatter(1),
    createInitialBatter(2),
  ],
  strikerIndex: 0,
  nonStrikerIndex: 1,
  nextBatterNumber: 3,
  currentPartnershipRuns: 0,
  currentPartnershipBalls: 0,
  lastStrikeChangeReason: 'start_innings',
  currentBatter: createInitialBatter(1),
});

const makeInitialState = (format = 'T20', gameMode = 'manual', opts = {}) => ({
  format,
  gameMode,
  innings:            1,
  target:             null,
  innings1Stats:      null,  // preserved after innings 1 ends
  gamePhase:          opts.skipFormatSelect ? 'mode_select' : 'format_select',
  deliveryPhase:      'idle', // idle | rolling | resolving_delivery | special_event | innings_break | match_complete
  lastOutcome:        null,
  lastWicket:         null,
  pendingEvent:       null,
  lastSpecialEventType: null,
  lastSpecialEventAt: null,
  specialEventCooldownsByType: {},
  pendingOutcome:     null,
  queuedResult:       null,
  queuedCommentary:   null,
  queuedAudio:        null,
  aiDecision:         null,
  drsReviews:         1,
  pendingMilestone:   null,  // { runs: 50|100, batsmanName: string }
  rollingState:       null,  // { sides, finalRoll, dieLabel, shotLabel } during animation
  selectedShot:       'work',
  selectedAggression: 'balanced',
  selectedBowling:    'stock',
  pitchType:          'flat',
  // Legacy single-player fields (used when no squad)
  batsman:            { ...DEFAULT_BATSMAN },
  bowler:             { ...DEFAULT_BOWLER },
  // Phase 4 squad fields
  battingSquad:       null,
  bowlingSquad:       null,
  ...makeInningsState(),
});

// ─────────────────────────────────────────
//  FULL BALL RESOLVER (unchanged from Phase 3)
// ─────────────────────────────────────────
const resolveFullBall = (
  shotKey, aggressionKey, bowlingKey,
  momentum, batsmanSkill, bowlerSkill,
  pitchKey, field, target, runs, ballsRemaining, innings, freeHit,
  pressureInput,
) => {
  const { sides: baseSides } = SHOT_CONFIG[shotKey];
  const tier = getMomentumTier(momentum);
  const wicketBlocked = freeHit;

  const netSkillMod   = getNetSkillMod(batsmanSkill, bowlerSkill);
  const forcedOutcome = resolveForcedCheck(bowlingKey, rollDie, aggressionKey, netSkillMod);
  if (forcedOutcome) {
    const blocked = wicketBlocked && forcedOutcome.type === 'wicket';
    return {
      ...(blocked
        ? { type: 'dot', runs: 0, label: 'DOT BALL', detail: 'Free hit saves the batsman!' }
        : forcedOutcome),
      rawRoll: 0, finalRoll: 0,
      effectiveSides: baseSides, baseSides,
      dieLabel: SHOT_CONFIG[shotKey].label,
      tierKey: tier.key, tierLabel: tier.label, clampedRoll: 0,
    };
  }

  const effectiveSides = getEffectiveDiceSides(shotKey, baseSides, tier);
  const rawRoll        = rollDie(effectiveSides);
  const afterBowling   = applyBowlingMod(rawRoll, effectiveSides, bowlingKey);
  const afterPitch     = applyPitchMod(afterBowling, effectiveSides, pitchKey);
  const fieldMod       = getFieldMod(shotKey, field);
  const afterField     = Math.max(1, Math.min(effectiveSides, afterPitch + fieldMod));
  const { mod: aggMod } = AGGRESSION_CONFIG[aggressionKey];
  const afterAgg       = Math.max(1, Math.min(effectiveSides, afterField + aggMod));
  const afterMomentum  = applyMomentumMod(afterAgg, effectiveSides, tier);
  const afterSkill = applySkillMod(afterMomentum, effectiveSides, batsmanSkill, bowlerSkill);

  let afterPressure = afterSkill;
  if (isChasing(target, innings) && pressureInput) {
    const { pressureState } = evaluatePressureContext(pressureInput, { forMechanics: true });
    const pressureTier = PRESSURE_TIERS[pressureState];
    afterPressure      = applyPressureMod(afterSkill, effectiveSides, pressureTier);
  }

  const rawShift = afterPressure - rawRoll;
  // Conservative widening: allow ±2 only for clear mismatch states.
  const shiftCap = Math.abs(netSkillMod) >= 3 ? 2 : 1;
  const cappedShift = Math.max(-shiftCap, Math.min(shiftCap, rawShift));
  const cappedResult = Math.max(1, Math.min(effectiveSides, rawRoll + cappedShift));

  const tableSize    = SHOT_CONFIG[shotKey].sides;
  const clampedIndex = Math.max(1, Math.min(tableSize, cappedResult));
  let outcome        = { ...OUTCOME_TABLES[shotKey][clampedIndex] };

  // Matchup correction layer:
  // suppress extreme six output for weak-bat/strong-bowl, and reduce
  // counterintuitive wicket spikes for strong-bat/weak-bowl.
  if (
    netSkillMod <= -2 &&
    outcome.runs === 6 &&
    (shotKey === 'power' || shotKey === 'slog')
  ) {
    // Soft suppression for weak-bat / strong-bowl on high-risk lofted shots.
    const sixSuppressChance = netSkillMod <= -3 ? 0.60 : 0.40;
    if (Math.random() < sixSuppressChance) {
      outcome = {
        ...outcome,
        type:  'four',
        runs:  4,
        label: 'FOUR!',
        detail: 'Skied but not timed perfectly — one bounce to the rope.',
      };
    }
  } else if (
    netSkillMod >= 1 &&
    outcome.type === 'wicket' &&
    (shotKey === 'drive' || shotKey === 'power' || shotKey === 'slog')
  ) {
    // Soft reprieve so strong batters are less likely to be over-punished.
    const wicketReprieveChance = netSkillMod >= 3 ? 0.70 : (netSkillMod >= 2 ? 0.55 : 0.40);
    if (Math.random() < wicketReprieveChance) {
      outcome = {
        type: 'four',
        runs: 4,
        label: 'FOUR!',
        detail: 'Thick edge flies safely over slip for four.',
      };
    }
  }

  if (wicketBlocked && outcome.type === 'wicket') {
    outcome = { type: 'dot', runs: 0, label: 'DOT BALL', detail: 'Free hit — no wicket!' };
  }
  if (outcome.runs === 4 && checkBoundarySave(shotKey, field, rollDie)) {
    outcome = { ...outcome, runs: 2, label: '2 RUNS', detail: 'Boundary saved by a diving fielder!', saved: true };
  }
  if (outcome.type === 'wicket') {
    const slipBoost = getSlipCatchBoost(field);
    if (slipBoost > 0) {
      outcome = { ...outcome, detail: outcome.detail + ` (${slipBoost} slip${slipBoost > 1 ? 's' : ''})` };
    }
  }

  return {
    ...outcome, rawRoll, finalRoll: cappedResult,
    effectiveSides, baseSides,
    dieLabel: `D${effectiveSides}`,
    tierKey: tier.key, tierLabel: tier.label, clampedRoll: clampedIndex,
  };
};

// ─────────────────────────────────────────
//  GET CURRENT SKILLS FROM SQUAD OR LEGACY
// ─────────────────────────────────────────
const getBatsmanSkill = (state) => {
  if (state.battingSquad) {
    const striker = getStriker(state.battingSquad);
    return striker?.battingSkill || 5;
  }
  return state.batsman?.skill || 5;
};

const getBowlerSkill = (state) => {
  if (state.bowlingSquad) {
    const bowler = getCurrentBowler(state.bowlingSquad);
    return bowler?.bowlingSkill || 5;
  }
  return state.bowler?.skill || 5;
};

// ─────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────
export const useGameState = () => {
  const [state, setState] = useState(() => makeInitialState('T20'));
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const flushCurrentMatch = useCallback(() => {
    const s = stateRef.current;
    if (!isResumableInProgressMatch(s)) return;
    saveCurrentMatch(s);
  }, []);

  const currentOvers      = Math.floor(state.balls / 6);
  const currentBallInOver = state.balls % 6;
  const maxBalls          = FORMATS[state.format].overs * 6;
  const ballsRemaining    = maxBalls - state.balls;
  const runRate           = state.balls > 0
    ? ((state.runs / state.balls) * 6).toFixed(2) : '0.00';
  const overDisplay  = `${currentOvers}.${currentBallInOver}`;
  const momentumTier = getMomentumTier(state.momentum);
  const rrr          = getRequiredRunRate(state.target, state.runs, ballsRemaining);
  const pressureTier = isChasing(state.target, state.innings)
    ? getPressureTier({
      format: state.format,
      innings: state.innings,
      target: state.target,
      runs: state.runs,
      balls: state.balls,
      wickets: state.wickets,
      momentum: state.momentum,
      recentBalls: state.recentBalls,
      lastPressureIndex: state.lastPressureIndex,
      maxBalls,
    })
    : null;

  // ── AUTO-SAVE ──────────────────────────
  useEffect(() => {
    if (state.gamePhase === 'innings_end') {
      const summary = buildMatchSummary(state, overDisplay, runRate);
      saveMatchToHistory(summary);
      clearCurrentMatch();
      return;
    }
    if (isResumableInProgressMatch(state)) {
      saveCurrentMatch(state);
    }
  }, [state.balls, state.wickets, state.gamePhase]);

  // ── SELECTIONS ──────────────────────────
  const backToModeSelect = useCallback(() =>
    setState(s => {
      logPhase('backToModeSelect', { from: s.gamePhase, to: 'mode_select', innings: s.innings, pendingInningsEnd: s.pendingInningsEnd });
      return { ...s, gamePhase: 'mode_select' };
    }), []);

  const backToFormatSelect = useCallback(() =>
    setState(s => {
      logPhase('backToFormatSelect', { from: s.gamePhase, to: 'format_select', innings: s.innings, pendingInningsEnd: s.pendingInningsEnd });
      return { ...s, gamePhase: 'format_select' };
    }), []);

  const backToTeamSelect = useCallback(() =>
    setState(s => ({ ...s, gamePhase: 'team_select' })), []);

  const confirmFormat = useCallback((formatKey) => {
    setState(s => {
      logPhase('confirmFormat', { from: s.gamePhase, to: 'mode_select', format: formatKey, innings: s.innings, pendingInningsEnd: s.pendingInningsEnd });
      return {
        ...s,
        format:    formatKey,
        gamePhase: 'mode_select',
      };
    });
  }, []);

  const confirmMode = useCallback((mode) => {
    setState(s => ({ ...s, gameMode: mode, gamePhase: 'team_select' }));
  }, []);

  const selectShot       = useCallback((s) => setState(st => ({ ...st, selectedShot: s })), []);
  const selectAggression = useCallback((a) => setState(st => ({ ...st, selectedAggression: a })), []);
  const selectBowling    = useCallback((b) => setState(st => ({ ...st, selectedBowling: b })), []);
  const updateField      = useCallback((f) => setState(st => ({ ...st, field: f })), []);

  // ── TEAM SELECTION ─────────────────────
  const confirmTeam = useCallback((playerTeam, aiTeam) => {
    setState(s => {
      const battingSquad  = makeSquadState(playerTeam);
      const bowlingSquad  = makeSquadState(aiTeam);
      return {
        ...s,
        battingSquad,
        bowlingSquad,
        // Set legacy batsman/bowler from squad for compatibility
        batsman: {
          ...DEFAULT_BATSMAN,
          name:  battingSquad.players[0]?.name || 'Batsman',
          skill: battingSquad.players[0]?.battingSkill || 5,
        },
        bowler: {
          ...DEFAULT_BOWLER,
          name:  bowlingSquad.players[0]?.name || 'Bowler',
          skill: bowlingSquad.players[0]?.bowlingSkill || 5,
        },
        gamePhase: 'setup',
      };
    });
  }, []);

  // ── CONFIRM SETUP ──────────────────────
  const confirmSetup = useCallback((batsman, bowler, pitchType) => {
    setState(s => {
      const newState = {
        ...s,
        batsman:   { ...batsman, ballsFaced: 0, runs: 0 },
        bowler:    { ...bowler,  ballsBowled: 0, wickets: 0 },
        pitchType: pitchType || 'flat',
      };
      if (s.gameMode === 'bowling' || s.gameMode === 'batting') {
        const aiField = getAIFieldPlacement(newState);
        // In bowling mode, AI also selects first bowler
        let updatedBowlingSquad = s.bowlingSquad;
        if (s.bowlingSquad && s.gameMode === 'batting') {
          const aiBowlerIdx = getAIBowlerSelection(
            s.bowlingSquad, s.format, s.momentum, pitchType || 'flat'
          );
          if (aiBowlerIdx !== null) {
            updatedBowlingSquad = setBowler(s.bowlingSquad, aiBowlerIdx);
          }
        }
        return {
          ...newState,
          field:         aiField,
          bowlingSquad:  updatedBowlingSquad,
          gamePhase:     'batting',
        };
      }
      // Manual mode — player selects bowler first
      if (s.bowlingSquad) {
        return { ...newState, gamePhase: 'bowler_select' };
      }
      return { ...newState, gamePhase: 'field_setup' };
    });
  }, []);

  // ── CONFIRM BOWLER ─────────────────────
  const confirmMilestone = useCallback(() => {
    setState(s => ({ ...s, pendingMilestone: null }));
  }, []);

  const confirmBowler = useCallback((bowlerIdx) => {
    setState(s => {
      if (!s.bowlingSquad) return { ...s, gamePhase: 'field_setup' };
      const updatedBowlingSquad = setBowler(s.bowlingSquad, bowlerIdx);
      // Update legacy bowler for skill calculations
      const bowlerPlayer = updatedBowlingSquad.players[bowlerIdx];
      return {
        ...s,
        bowlingSquad: updatedBowlingSquad,
        bowler: {
          ...s.bowler,
          name:  bowlerPlayer?.name  || 'Bowler',
          skill: bowlerPlayer?.bowlingSkill || 5,
        },
        gamePhase: 'field_setup',
      };
    });
  }, []);

  // ── ROLL BALL ──────────────────────────
  const rollBall = useCallback(() => {
    setState(s => {
      // Strict guard — only roll when explicitly in batting phase
      if (
        s.gamePhase !== 'batting' ||
        s.deliveryPhase === 'special_event' ||
        s.deliveryPhase === 'rolling' ||
        s.pendingOutcome ||
        s.queuedResult
      ) return s;

      let updatedState = { ...s };

      if (s.gameMode === 'batting') {
        const aiDecision = getAIBowlingVariation(s);
        // AI also selects bowler if using squads
        let updatedBowlingSquad = s.bowlingSquad;
        if (s.bowlingSquad && !getCurrentBowler(s.bowlingSquad)) {
          const aiBowlerIdx = getAIBowlerSelection(
            s.bowlingSquad, s.format, s.momentum, s.pitchType
          );
          if (aiBowlerIdx !== null) {
            updatedBowlingSquad = setBowler(s.bowlingSquad, aiBowlerIdx);
          }
        }
        updatedState = {
          ...updatedState,
          selectedBowling: aiDecision.variation,
          aiDecision,
          bowlingSquad: updatedBowlingSquad,
        };
      } else if (s.gameMode === 'bowling') {
        const aiDecision = getAIBattingDecision(s);
        updatedState = {
          ...updatedState,
          selectedShot:       aiDecision.shot,
          selectedAggression: aiDecision.aggression,
          aiDecision,
        };
      } else {
        updatedState = { ...updatedState, aiDecision: null };
      }

      const provisionalResolved = resolveAndApplyBall(updatedState, maxBalls);

      if (shouldTriggerEvent()) {
        const event = resolveSpecialEvent(updatedState, provisionalResolved.lastOutcome || null);
        if (!event) {
          if (__DEV__) console.log('[EVENT_LOCK] no eligible locked special event; skipping trigger');
          return {
            ...updatedState,
            deliveryPhase: 'rolling',
            pendingOutcome: provisionalResolved.lastOutcome || null,
            queuedResult: provisionalResolved,
            queuedCommentary: provisionalResolved.commentary || null,
            queuedAudio: {
              pendingMilestone: provisionalResolved.pendingMilestone || null,
              pendingInningsEnd: !!provisionalResolved.pendingInningsEnd,
              innings: provisionalResolved.innings,
              target: provisionalResolved.target,
              runs: provisionalResolved.runs,
              wickets: provisionalResolved.wickets,
              balls: provisionalResolved.balls,
              format: provisionalResolved.format,
            },
          };
        }
        if (__DEV__ && event?.key === 'no_ball') {
          console.log(
            `[EVENT] no_ball triggered -> overBalls frozen (${s.overBalls.length}/6), balls=${s.balls}, freeHit(pending)=true`
          );
        }
        const eventType = event?.type || event?.key || null;
        return {
          ...updatedState,
          gamePhase: 'special_event',
          deliveryPhase: 'special_event',
          pendingEvent: event,
          lastSpecialEventType: eventType,
          lastSpecialEventAt: s.balls,
          specialEventCooldownsByType: eventType
            ? getSpecialEventCooldownsForSelection(updatedState, eventType)
            : (updatedState.specialEventCooldownsByType || {}),
          // Hard freeze legal-ball progression while special-event modal is active.
          balls: s.balls,
          overBalls: s.overBalls,
          // Hard-clear any potentially queued delivery artefacts.
          pendingOutcome: null,
          queuedResult: null,
          queuedCommentary: null,
          queuedAudio: null,
          lastOutcome: null,
          lastWicket: null,
        };
      }

      return {
        ...updatedState,
        deliveryPhase: 'rolling',
        pendingOutcome: provisionalResolved.lastOutcome || null,
        queuedResult: provisionalResolved,
        queuedCommentary: provisionalResolved.commentary || null,
        queuedAudio: {
          pendingMilestone: provisionalResolved.pendingMilestone || null,
          pendingInningsEnd: !!provisionalResolved.pendingInningsEnd,
          innings: provisionalResolved.innings,
          target: provisionalResolved.target,
          runs: provisionalResolved.runs,
          wickets: provisionalResolved.wickets,
          balls: provisionalResolved.balls,
          format: provisionalResolved.format,
        },
      };
    });
  }, [maxBalls]);

  const commitPendingDelivery = useCallback(() => {
    setState(s => {
      if (s.deliveryPhase === 'special_event' || s.gamePhase === 'special_event') {
        return {
          ...s,
          pendingOutcome: null,
          queuedResult: null,
          queuedCommentary: null,
          queuedAudio: null,
        };
      }
      if (!s.queuedResult) {
        return {
          ...s,
          deliveryPhase: 'idle',
          pendingOutcome: null,
          queuedResult: null,
          queuedCommentary: null,
          queuedAudio: null,
        };
      }

      return {
        ...s.queuedResult,
        pendingOutcome: null,
        queuedResult: null,
        queuedCommentary: null,
        queuedAudio: null,
      };
    });
  }, []);

  // ── CONFIRM SPECIAL EVENT ──────────────
  const confirmSpecialEvent = useCallback(() => {
    setState(s => {
      if (!s.pendingEvent) return { ...s, gamePhase: 'batting', deliveryPhase: 'idle' };
      const event   = s.pendingEvent;
      const updates = applyEventEffect(event, s, clampMomentum);
      const newCommentary = [
        { ball: 'EVENT', text: `${event.icon} ${event.effect.message}`, style: 'momentum' },
        ...s.commentary,
      ];
      if (updates.forceWicket) {
        // Resolve wicket now so WicketModal has data
        const forcedWicket = resolveWicket();
        return {
          ...s, ...updates,
          commentary:  newCommentary,
          gamePhase:   'wicket_pending',
          deliveryPhase: 'idle',
          pendingEvent: null,
          pendingOutcome: null,
          queuedResult: null,
          queuedCommentary: null,
          queuedAudio: null,
          lastWicket:  forcedWicket,
          lastOutcome: {
            type:   'wicket',
            runs:   0,
            label:  `WICKET — ${forcedWicket.type}`,
            detail: forcedWicket.detail,
            dieLabel: 'D20',
            clampedRoll: s.pendingEvent?.roll || 20,
          },
        };
      }
      // Clear tempRollMod after event is consumed
      if (__DEV__ && event?.key === 'no_ball') {
        console.log(
          `[EVENT] no_ball continue -> freeHit armed=${!!updates.freeHit}, balls=${s.balls}, overBalls=${s.overBalls.length}`
        );
      }
      return {
        ...s, ...updates,
        commentary:   newCommentary,
        gamePhase:    'batting',
        deliveryPhase: 'idle',
        pendingEvent: null,
        pendingOutcome: null,
        queuedResult: null,
        queuedCommentary: null,
        queuedAudio: null,
        freeHit:      updates.freeHit || false,
        tempRollMod:  0,
      };
    });
  }, []);

  // ── CONFIRM WICKET ─────────────────────
  const confirmWicket = useCallback((drsResult) => {
    setState(s => {
      // If DRS overturned — batsman survives, no wicket counted
      if (drsResult?.overturned) {
        const drsCommentary = [
          { ball: 'DRS', text: 'NOT OUT! DRS overturns the decision — batsman survives!', style: 'momentum' },
          ...s.commentary,
        ];
        const reviewsLeft = drsResult.reviewLost
          ? Math.max(0, s.drsReviews - 1)
          : s.drsReviews;
        // Provisional delivery had already appended a wicket pip; replace with dot so OverBalls matches final outcome.
        const dotBall = { type: 'dot', runs: 0 };
        const overBalls =
          s.overBalls.length > 0
            ? [...s.overBalls.slice(0, -1), dotBall]
            : s.overBalls;
        const recentBalls =
          s.recentBalls.length > 0
            ? [...s.recentBalls.slice(0, -1), dotBall]
            : s.recentBalls;
        return {
          ...s,
          gamePhase:   'batting',
          commentary:  drsCommentary,
          drsReviews:  reviewsLeft,
          overBalls,
          recentBalls,
          // Restore lastOutcome to dot (wicket overturned)
          lastOutcome: {
            ...s.lastOutcome,
            type:   'dot',
            label:  'NOT OUT',
            detail: 'DRS overturns the LBW decision — not out!',
          },
        };
      }

      // DRS upheld or not used — proceed with wicket
      const reviewsLeft = drsResult?.reviewLost
        ? Math.max(0, s.drsReviews - 1)
        : s.drsReviews;

      const wicket  = s.lastWicket || resolveWicket();
      const newWkts = s.wickets + 1;
      const allOut  = newWkts >= 10;
      const oversUp = s.balls >= maxBalls;
      const matchCompleteOnWicket = s.innings === 2 && (allOut || oversUp);

      const newCommentary = [
        { ball: 'WICKET', text: `${wicket.type} — ${wicket.detail} (${newWkts} wkts)`, style: 'wicket' },
        ...s.commentary,
      ];

      // Update batting squad scorecard
      let updatedBattingSquad = s.battingSquad;
      if (updatedBattingSquad) {
        updatedBattingSquad = setDismissal(updatedBattingSquad, wicket.type);
        if (!allOut && !oversUp) {
          updatedBattingSquad = sendInNextBatsman(updatedBattingSquad, 0);
          // Update legacy batsman
          const newStriker = getStriker(updatedBattingSquad);
        }
      }

      // Credit the wicket to the bowler — but only for bowler-credited dismissals.
      // Run-outs go to the fielder in real cricket, not the bowler.
      let updatedBowlingSquad = s.bowlingSquad;
      if (updatedBowlingSquad && wicket?.type !== 'RUN OUT') {
        updatedBowlingSquad = updateBowlerBallStats(
          updatedBowlingSquad,
          0,      // no runs on a wicket ball
          true,   // credit the wicket
        );
      }

      let newPhase = 'new_batsman';
      if (allOut || oversUp) newPhase = 'innings_end';
      // If using squads, batsman auto-populated — skip new_batsman modal
      if (updatedBattingSquad && !allOut && !oversUp) newPhase = 'batting';
      if (matchCompleteOnWicket) newPhase = 'batting';

      // Update legacy batsman from new striker
      const newStriker = updatedBattingSquad ? getStriker(updatedBattingSquad) : null;
      const updatedBatsman = newStriker
        ? { ...s.batsman, name: newStriker.name, skill: newStriker.battingSkill }
        : s.batsman;

      logPhase('confirmWicket', {
        from: s.gamePhase,
        to: newPhase,
        innings: s.innings,
        pendingInningsEnd: matchCompleteOnWicket,
        matchCompleteOnWicket,
        allOut,
        oversUp,
      });

      return {
        ...s,
        wickets:       newWkts,
        lastWicket:    wicket,
        commentary:    newCommentary,
        partnership:   resetPartnership(),
        gamePhase:     newPhase,
        deliveryPhase: matchCompleteOnWicket ? 'match_complete' : 'idle',
        pendingInningsEnd: matchCompleteOnWicket,
        drsReviews:    reviewsLeft,
        battingSquad:  updatedBattingSquad,
        bowlingSquad:  updatedBowlingSquad,
        batsman:       updatedBatsman,
        bowler: { ...s.bowler, wickets: (s.bowler.wickets || 0) + 1 },
      };
    });
  }, [maxBalls]);

  // ── NEW BATSMAN (legacy — used when no squad) ──
  const confirmNewBatsman = useCallback((newBatsman) => {
    setState(s => ({
      ...s,
      batsman:   { ...newBatsman, ballsFaced: 0, runs: 0 },
      gamePhase: 'batting',
      deliveryPhase: 'idle',
    }));
  }, []);

  // ── CONFIRM FIELD ──────────────────────
  const confirmField = useCallback((field) => {
    setState(s => ({ ...s, field, gamePhase: 'batting', deliveryPhase: 'idle' }));
  }, []);

  // ── START INNINGS 2 ────────────────────
  const startInnings2 = useCallback(() => {
    setState(s => {
      // Swap squads for innings 2
      const newBattingSquad = s.bowlingSquad ? makeSquadState({
        id: s.bowlingSquad.teamId,
        name: s.bowlingSquad.teamName,
        flag: s.bowlingSquad.flag,
        colour: s.bowlingSquad.colour,
        players: s.bowlingSquad.players,
      }) : null;
      const newBowlingSquad = s.battingSquad ? makeSquadState({
        id: s.battingSquad.teamId,
        name: s.battingSquad.teamName,
        flag: s.battingSquad.flag,
        colour: s.battingSquad.colour,
        players: s.battingSquad.players,
      }) : null;

      // In play modes with squads, skip setup — go straight to field/batting
      // Only go to setup if manual mode with no squads
      const hasSquads     = !!(newBattingSquad && newBowlingSquad);
      const isPlayMode    = s.gameMode !== 'manual';
      let inn2Phase = 'setup';

      if (hasSquads) {
        if (isPlayMode) {
          // AI sets field automatically
          inn2Phase = 'batting';
        } else {
          // Manual — player picks bowler then field
          inn2Phase = newBowlingSquad ? 'bowler_select' : 'field_setup';
        }
      }

      // AI field for play modes
      // Preserve innings 1 stats for the result screen
      const innings1Stats = {
        runs:        s.runs,
        wickets:     s.wickets,
        overs:       `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
        boundaries:  s.boundaries,
        sixes:       s.sixes,
        dots:        s.dots,
        // Full snapshots for detailed history view
        battingSquad: s.battingSquad,
        bowlingSquad: s.bowlingSquad,
        commentary:   s.commentary,
        teamName:     s.battingSquad?.teamName,
        teamFlag:     s.battingSquad?.flag,
      };

      const inn2State = {
        ...makeInningsState(),
        format:             s.format,
        gameMode:           s.gameMode,
        innings:            2,
        target:             s.runs + 1,
        gamePhase:          inn2Phase,
        deliveryPhase:      'idle',
        lastOutcome:        null,
        lastWicket:         null,
        pendingEvent:       null,
        lastSpecialEventType: s.lastSpecialEventType ?? null,
        lastSpecialEventAt:  s.lastSpecialEventAt ?? null,
        specialEventCooldownsByType: carrySpecialEventCooldownsIntoNextInnings(s.specialEventCooldownsByType),
        aiDecision:         null,
        selectedShot:       'work',
        selectedAggression: 'balanced',
        selectedBowling:    'stock',
        pitchType:          s.pitchType,
        innings1Stats:      innings1Stats,
        batsman:            newBattingSquad?.players[0]
          ? { name: newBattingSquad.players[0].name, skill: newBattingSquad.players[0].battingSkill, ballsFaced: 0, runs: 0 }
          : { ...DEFAULT_BATSMAN },
        bowler:             { ...DEFAULT_BOWLER },
        battingSquad:       newBattingSquad,
        bowlingSquad:       newBowlingSquad,
      };

      // Set AI field if play mode
      if (hasSquads && isPlayMode) {
        inn2State.field = getAIFieldPlacement(inn2State);
        // AI picks opening bowler
        const aiBowlerIdx = getAIBowlerSelection(
          newBowlingSquad, s.format, 0, s.pitchType
        );
        if (aiBowlerIdx !== null) {
          inn2State.bowlingSquad = setBowler(newBowlingSquad, aiBowlerIdx);
          const bowlerPlayer = inn2State.bowlingSquad.players[aiBowlerIdx];
          inn2State.bowler = {
            name:  bowlerPlayer?.name  || 'Bowler',
            skill: bowlerPlayer?.bowlingSkill || 5,
            ballsBowled: 0, wickets: 0,
          };
        }
      }

      return inn2State;
    });
  }, []);

  // ── NEW MATCH ──────────────────────────
  const newMatch = useCallback((format) => {
    logPhase('newMatch(reset)', { format: format || 'T20', skipFormatSelect: !!format });
    clearCurrentMatch();
    setState(makeInitialState(format || 'T20', 'manual', { skipFormatSelect: !!format }));
  }, []);

  // ── RESUME ─────────────────────────────
  const resumeMatch = useCallback((savedState) => {
    setState({ ...savedState, gamePhase: 'batting', deliveryPhase: 'idle' });
  }, []);

  const commitInningsEnd = useCallback(() => {
    setState(s => {
      if (!s.pendingInningsEnd) return s;
      logPhase('commitInningsEnd', {
        from: s.gamePhase,
        to: 'innings_end',
        innings: s.innings,
        pendingInningsEnd: true,
        deliveryPhase: s.deliveryPhase,
      });
      return {
        ...s,
        gamePhase: 'innings_end',
        deliveryPhase: s.innings === 2 ? 'match_complete' : 'innings_break',
        pendingInningsEnd: false,
      };
    });
  }, []);

  const queueMatchResultCommentary = useCallback((text) => {
    if (!text) return;
    setState(s => ({
      ...s,
      commentary: [
        { ball: 'RESULT', text, style: 'momentum' },
        ...s.commentary,
      ].slice(0, 60),
    }));
  }, []);

  const startNextOver = useCallback(() => {
    setState(s => {
      if (s.gamePhase !== 'over_complete' || !s.pendingNextOver) return s;

      const next = s.pendingNextOver;
      const nextCommentary = next.newOverCommentary
        ? [next.newOverCommentary, ...s.commentary].slice(0, 60)
        : s.commentary;

      return {
        ...s,
        gamePhase: next.nextPhase,
        deliveryPhase: 'idle',
        overBalls: [],
        field: next.newField ?? s.field,
        bowler: next.newBowlerLegacy ?? s.bowler,
        bowlingSquad: next.updatedBowlingSquad ?? s.bowlingSquad,
        commentary: nextCommentary,
        pendingNextOver: null,
      };
    });
  }, []);

  // ── DEV: JUMP TO SCENARIO ──────────────
  const jumpToScenario = useCallback((scenario) => {
    if (!__DEV__) return;
    setState(s => {
      // Only works mid-match with squads set up
      if (!s.battingSquad || !s.bowlingSquad) return s;
      const formatKey = scenario.format ?? s.format;
      const maxBallsForFormat = FORMATS[formatKey].overs * 6;

      // Force innings 2 if scenario requires chase
      const needsChase = scenario.target != null;
      const balls = Math.max(0, maxBallsForFormat - scenario.ballsRemaining);

      return {
        ...s,
        format:     formatKey,
        innings:    needsChase ? 2 : s.innings,
        target:     scenario.target ?? s.target,
        balls,
        runs:       scenario.runs,
        wickets:    scenario.wickets,
        gamePhase:  'batting',
        deliveryPhase: 'idle',
        // Reset per-ball tracking so everything recalculates cleanly
        overBalls:  [],
        lastOutcome: null,
        pendingInningsEnd: false,
        pendingMilestone:  null,
        lastPressureIndex: null,
        recentBalls: [],
        momentum: 0,
        // Preserve commentary so the log reads as intended,
        // but mark the jump
        commentary: [
          { ball: 'DEV', text: `⚙ Jumped to: ${scenario.label}`, style: 'momentum' },
          ...s.commentary,
        ],
        // Keep innings1Stats if already set
        innings1Stats: s.innings1Stats ?? (needsChase ? {
          runs:     (scenario.target || 1) - 1,
          wickets:  6,
          overs:    `${Math.floor(maxBallsForFormat / 6)}.0`,
          boundaries: 8,
          sixes:    2,
          dots:     30,
          teamName: s.bowlingSquad?.teamName,
          teamFlag: s.bowlingSquad?.flag,
          battingSquad: s.bowlingSquad,
          bowlingSquad: s.battingSquad,
          commentary: [],
        } : null),
      };
    });
  }, []);

  return {
    state,
    currentOvers, currentBallInOver,
    maxBalls, ballsRemaining,
    runRate, overDisplay,
    momentumTier, pressureTier, rrr,
    confirmFormat, confirmMode, confirmTeam, confirmMilestone,
    backToFormatSelect, backToModeSelect, backToTeamSelect,
    selectShot, selectAggression,
    selectBowling, updateField,
    rollBall,
    commitPendingDelivery,
    confirmSpecialEvent,
    resolveSpecialEventContinue: confirmSpecialEvent,
    confirmWicket, confirmNewBatsman,
    confirmBowler,
    confirmField, confirmSetup,
    startInnings2, newMatch, resumeMatch,
    commitInningsEnd,
    queueMatchResultCommentary,
    startNextOver,
    jumpToScenario,
    flushCurrentMatch,
  };
};

// ─────────────────────────────────────────
//  INTERNAL — RESOLVE AND APPLY BALL
// ─────────────────────────────────────────
function resolveAndApplyBall(s, maxBalls) {
  if (s.deliveryPhase === 'special_event' || s.gamePhase === 'special_event') return s;

  const batsmanSkill = getBatsmanSkillFromState(s);
  const bowlerSkill  = getBowlerSkillFromState(s);

  const pressureInput = isChasing(s.target, s.innings)
    ? {
      format: s.format,
      innings: s.innings,
      target: s.target,
      runs: s.runs,
      balls: s.balls,
      wickets: s.wickets,
      momentum: s.momentum,
      recentBalls: s.recentBalls,
      lastPressureIndex: s.lastPressureIndex,
      maxBalls,
    }
    : null;

  let outcome = resolveFullBall(
    s.selectedShot, s.selectedAggression, s.selectedBowling,
    s.momentum, batsmanSkill, bowlerSkill,
    s.pitchType, s.field,
    s.target, s.runs, maxBalls - s.balls, s.innings, s.freeHit,
    pressureInput,
  );

  // Underdog boost + commentary
  outcome = applyUnderdogEffect(outcome, s.battingSquad, s.bowlingSquad);
  const underdogMsg = getUnderdogCommentary(outcome);

  // ── Wicket resolution (enrich outcome before legal-ball accounting) ──
  let pendingWicket = null;
  if (outcome.type === 'wicket') {
    pendingWicket = resolveWicket();
    outcome = {
      ...outcome,
      label:  `WICKET — ${pendingWicket.type}`,
      detail: pendingWicket.detail,
      wicketType: pendingWicket.type,
      drsEligible: !!pendingWicket.drs,
    };
  }

  // Legal delivery: only these consume balls / over pips / legal ball counts.
  // - Free-hit replay (after a no-ball): does not consume a legal ball.
  // - Explicit no_ball / isLegalDelivery === false: illegal, does not consume.
  const isFreeHitReplay = s.freeHit === true;
  const isNoBallOutcome = outcome.type === 'no_ball' || outcome.isLegalDelivery === false;
  const isLegalDelivery = !isFreeHitReplay && !isNoBallOutcome;

  // Lightweight strike/partnership layer (kept independent from delivery generation).
  let inningsBattingState = {
    batters: s.batters || [createInitialBatter(1), createInitialBatter(2)],
    strikerIndex: s.strikerIndex ?? 0,
    nonStrikerIndex: s.nonStrikerIndex ?? 1,
    nextBatterNumber: s.nextBatterNumber ?? 3,
    currentPartnershipRuns: s.currentPartnershipRuns ?? 0,
    currentPartnershipBalls: s.currentPartnershipBalls ?? 0,
    lastStrikeChangeReason: s.lastStrikeChangeReason ?? null,
  };

  if (isLegalDelivery) {
    const strikerIdx = inningsBattingState.strikerIndex;
    inningsBattingState = {
      ...inningsBattingState,
      batters: inningsBattingState.batters.map((b, idx) => (
        idx === strikerIdx
          ? { ...b, runs: (b.runs || 0) + outcome.runs, balls: (b.balls || 0) + 1 }
          : b
      )),
    };

    if (outcome.type === 'wicket') {
      inningsBattingState = applyWicketDelivery(inningsBattingState);
    } else if (outcome.runs > 0) {
      inningsBattingState = applyScoringDelivery(inningsBattingState, outcome.runs);
    } else {
      inningsBattingState = applyDotDelivery(inningsBattingState);
    }
  }

  // Partnership
  const newPartnership = updatePartnership(s.partnership, outcome.runs);
  const milestone      = checkPartnershipMilestone(s.partnership.runs, newPartnership.runs);

  // Momentum
  let momentumShift    = getMomentumShift(outcome);
  const newRecentBalls = [...s.recentBalls, { type: outcome.type, runs: outcome.runs }].slice(-20);
  if (outcome.type === 'wicket' && isCollapse(newRecentBalls)) momentumShift -= 5;
  if (milestone) momentumShift += milestone.momentumBonus;

  const oldMomentum   = s.momentum;
  const newMomentum   = clampMomentum(oldMomentum + momentumShift);

  const newBalls       = isLegalDelivery ? s.balls + 1 : s.balls;
  const newOverBalls   = isLegalDelivery
    ? [...s.overBalls, { type: outcome.type, runs: outcome.runs }]
    : s.overBalls;
  const isOverComplete = isLegalDelivery && newBalls % 6 === 0;
  // Odd runs (1,3) already swap strikers; do not swap again at over end (same net effect as real cricket).
  if (isOverComplete) {
    const skipEndOverSwap = outcome.type !== 'wicket' && (outcome.runs % 2 === 1);
    if (!skipEndOverSwap) {
      inningsBattingState = swapStrike(inningsBattingState, 'end_of_over');
    }
  }

  const maidenPenalty  = (isOverComplete && isMaidenOver(newOverBalls)) ? -2 : 0;
  const finalMomentum  = clampMomentum(newMomentum + maidenPenalty);

  const newRuns  = s.runs + outcome.runs;
  const newDots  = (isLegalDelivery && outcome.type === 'dot') ? s.dots + 1 : s.dots;
  const newFours = outcome.runs === 4      ? s.boundaries + 1 : s.boundaries;
  const newSixes = outcome.runs === 6      ? s.sixes + 1      : s.sixes;

  const logicalWickets = outcome.type === 'wicket' ? s.wickets + 1 : s.wickets;
  const postPressureEval = isChasing(s.target, s.innings)
    ? evaluatePressureContext({
      format: s.format,
      innings: s.innings,
      target: s.target,
      runs: newRuns,
      balls: newBalls,
      wickets: logicalWickets,
      momentum: finalMomentum,
      recentBalls: newRecentBalls,
      lastPressureIndex: s.lastPressureIndex,
      maxBalls,
    })
    : null;

  // Squad stats
  let updatedBattingSquad = s.battingSquad;
  if (updatedBattingSquad && outcome.type !== 'wicket') {
    updatedBattingSquad = updateBatsmanStats(
      updatedBattingSquad, outcome.runs,
      outcome.runs === 4, outcome.runs === 6,
      isLegalDelivery,
    );
  }

  // ── Milestone check ─────────────────
  // Check if striker just crossed 50 or 100
  let pendingMilestone = null;
  if (outcome.type !== 'wicket' && outcome.runs > 0 && updatedBattingSquad) {
    const striker = getStriker(updatedBattingSquad);
    if (striker) {
      const sc = updatedBattingSquad.scorecard?.find(e => e.playerId === striker.id);
      if (sc) {
        const prevRuns = sc.runs - outcome.runs;
        const newRuns  = sc.runs;
        if ((prevRuns < 50 && newRuns >= 50) || (prevRuns < 100 && newRuns >= 100)) {
          const milestone = newRuns >= 100 ? 100 : 50;
          pendingMilestone = { runs: milestone, batsmanName: striker.name };
        }
      }
    }
  }

  // Bowler runs conceded — runs still count against the bowler,
  // even on a free-hit bonus ball (they bowled the no-ball that caused it).
  // Wicket credit is deferred to confirmWicket so DRS can overturn.
  let updatedBowlingSquad = s.bowlingSquad;
  if (updatedBowlingSquad) {
    updatedBowlingSquad = updateBowlerBallStats(
      updatedBowlingSquad,
      outcome.runs,
      false,  // wicket credit handled in confirmWicket
    );
  }

  // ── Commentary ────────────────────────
  const overNum = Math.floor(s.balls / 6);
  const ballNum = (s.balls % 6) + 1;
  const striker = updatedBattingSquad ? getStriker(updatedBattingSquad) : null;
  const ballTag = isFreeHitReplay
    ? `FREE HIT${striker ? ` — ${striker.name.split(' ').pop()}` : ''}`
    : isNoBallOutcome
      ? `NO BALL${striker ? ` — ${striker.name.split(' ').pop()}` : ''}`
      : `${overNum}.${ballNum}${striker ? ` — ${striker.name.split(' ').pop()}` : ''}`;

  let cmtStyle = 'normal';
  if (outcome.type === 'wicket') cmtStyle = 'wicket';
  else if (outcome.runs === 6)   cmtStyle = 'six';
  else if (outcome.runs === 4)   cmtStyle = 'four';

  const newCommentary = [
    {
      ball: ballTag,
      text: pendingWicket
        ? `${pendingWicket.type} — ${pendingWicket.detail}`
        : outcome.detail,
      style: cmtStyle,
    },
    ...s.commentary,
  ];

  if (milestone) {
    newCommentary.unshift({
      ball: 'PARTNERSHIP',
      text: `${milestone.icon} ${milestone.label}! ${milestone.flavour}`,
      style: 'momentum',
    });
  }
  if (isChasing(s.target, s.innings)) {
    const pressureMsg = getPressureCommentary({
      format: s.format,
      innings: s.innings,
      target: s.target,
      runs: newRuns,
      balls: newBalls,
      wickets: logicalWickets,
      momentum: finalMomentum,
      recentBalls: newRecentBalls,
      lastPressureIndex: s.lastPressureIndex,
      maxBalls,
    });
    if (pressureMsg && isOverComplete) {
      newCommentary.unshift({ ball: 'PRESSURE', text: pressureMsg, style: 'pressure' });
    }
  }
  const tierComment = getMomentumCommentary(oldMomentum, finalMomentum);
  if (tierComment) newCommentary.unshift({ ball: 'MOMENTUM', text: tierComment, style: 'momentum' });
  const synergyMsg = getBowlingCommentary(s.selectedBowling, s.pitchType);
  if (synergyMsg && Math.random() < 0.3) {
    newCommentary.unshift({ ball: 'CONDITIONS', text: synergyMsg, style: 'momentum' });
  }
  if (underdogMsg) {
    newCommentary.unshift({ ball: 'UNDERDOG', text: underdogMsg, style: 'momentum' });
  }
  if (isOverComplete && maidenPenalty < 0) {
    newCommentary.unshift({ ball: 'MAIDEN', text: 'Maiden over — bowling side seizes momentum.', style: 'pressure' });
  }

  // Mirror strike rotation onto the batting squad (scoreboard / AI use currentBatsmen[0] as striker).
  // Wicket balls defer squad updates to confirmWicket (dismissal + sendInNextBatsman).
  if (updatedBattingSquad && isLegalDelivery && outcome.type !== 'wicket') {
    if (outcome.runs === 1 || outcome.runs === 3) {
      updatedBattingSquad = swapStrikerEnds(updatedBattingSquad);
    }
    const skipEndOverSquadSwap = (outcome.runs % 2 === 1);
    if (isOverComplete && !skipEndOverSquadSwap) {
      updatedBattingSquad = swapStrikerEnds(updatedBattingSquad);
    }
  }

  // ── Phase determination ───────────────
  const allOut   = outcome.type === 'wicket' && (s.wickets + 1) >= 10;
  const oversUp  = newBalls >= maxBalls;
  const chaseWon = !!(s.target && newRuns >= s.target);

  let newPhase = 'batting';
  let pendingInningsEnd = false;
  if (outcome.type === 'wicket') {
    if (chaseWon) {
      // Chase won on the wicket-ball — defer innings_end until animation finishes
      newPhase = 'batting';
      pendingInningsEnd = true;
    } else {
      newPhase = 'wicket_pending';
    }
  } else if (oversUp || chaseWon) {
    newPhase = 'batting';
    pendingInningsEnd = true;
  }

  // ── Over complete: hold 6th pip briefly, then transition ────
  let newField        = s.field;
  let newBowlerLegacy = null;
  let pendingNextOver = null;

  // Do not enter over_complete when this ball already ended the innings/match —
  // otherwise startNextOver() runs mid end-sequence and breaks centralized match-end presentation.
  if (isOverComplete && newPhase === 'batting' && !pendingInningsEnd) {
    let nextPhase = 'batting';
    let nextField = s.field;
    let nextBowlerLegacy = null;
    let nextBowlingSquad = updatedBowlingSquad;
    let newOverCommentary = null;

    if (nextBowlingSquad) {
      nextBowlingSquad = updateBowlerOvers(nextBowlingSquad);
    }

    if (s.gameMode === 'batting') {
      nextField = getAIFieldPlacement({ ...s, momentum: finalMomentum });
      const aiBowlerIdx = getAIBowlerSelection(
        nextBowlingSquad, s.format, finalMomentum, s.pitchType
      );
      if (aiBowlerIdx !== null && nextBowlingSquad) {
        nextBowlingSquad = setBowler(nextBowlingSquad, aiBowlerIdx);
        const nextBowlerPlayer = nextBowlingSquad.players[aiBowlerIdx];
        const nextBowlerName   = nextBowlerPlayer?.name || 'Bowler';
        nextBowlerLegacy = {
          name:        nextBowlerName,
          skill:       nextBowlerPlayer?.bowlingSkill || 5,
          ballsBowled: 0,
          wickets:     0,
        };
        newOverCommentary = {
          ball: 'NEW OVER',
          text: `${nextBowlerName} to bowl over ${overNum + 2}.`,
          style: 'normal',
        };
      }
    } else {
      nextPhase = nextBowlingSquad ? 'bowler_select' : 'field_setup';
    }

    pendingNextOver = {
      nextPhase,
      newField: nextField,
      newBowlerLegacy: nextBowlerLegacy,
      updatedBowlingSquad: nextBowlingSquad,
      newOverCommentary,
    };

    newPhase = 'over_complete';
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    logPhase('resolveAndApplyBall', {
      to: newPhase,
      innings: s.innings,
      pendingInningsEnd,
      deliveryPhase: newPhase === 'innings_end'
        ? 'innings_break'
        : (newPhase === 'batting' && s.innings === 2 && (oversUp || chaseWon) ? 'match_complete' : 'idle'),
      oversUp,
      chaseWon,
      allOut,
      isOverComplete,
    });
  }

  const strikeRotatedForRuns = isLegalDelivery && outcome.type !== 'wicket'
    && (outcome.runs === 1 || outcome.runs === 3);
  const nextSpecialEventCooldowns = isLegalDelivery
    ? decrementSpecialEventCooldowns(s.specialEventCooldownsByType)
    : (s.specialEventCooldownsByType || {});

  // ── Single unified return ─────────────
  return {
    ...s,
    balls:        newBalls,
    runs:         newRuns,
    dots:         newDots,
    boundaries:   newFours,
    sixes:        newSixes,
    momentum:     finalMomentum,
    overBalls:    newPhase === 'over_complete' ? newOverBalls : (isOverComplete ? [] : newOverBalls),
    recentBalls:  newRecentBalls,
    lastPressureIndex: postPressureEval ? postPressureEval.pressureIndex : s.lastPressureIndex,
    commentary:   newCommentary.slice(0, 60),
    lastOutcome:  { ...outcome, isLegalDelivery },
    lastWicket:   pendingWicket ?? s.lastWicket,
    gamePhase:    newPhase,
    deliveryPhase: newPhase === 'innings_end'
      ? 'innings_break'
      : (newPhase === 'batting' && s.innings === 2 && (oversUp || chaseWon) ? 'match_complete' : 'idle'),
    pendingInningsEnd,
    specialEventCooldownsByType: nextSpecialEventCooldowns,
    field:        newField,
    pendingNextOver,
    partnership:  outcome.type === 'wicket' ? resetPartnership() : newPartnership,
    freeHit:      isNoBallOutcome,
    tempRollMod:      0,
    pendingMilestone: pendingMilestone,
    batsman: {
      ...s.batsman,
      ballsFaced: isLegalDelivery
        ? (s.batsman.ballsFaced || 0) + 1
        : (s.batsman.ballsFaced || 0),
      runs:       (s.batsman.runs || 0) + outcome.runs,
    },
    bowler: newBowlerLegacy ? newBowlerLegacy : {
      ...s.bowler,
      ballsBowled: isLegalDelivery
        ? (s.bowler.ballsBowled || 0) + 1
        : (s.bowler.ballsBowled || 0),
    },
    battingSquad: updatedBattingSquad,
    bowlingSquad: updatedBowlingSquad,
    batters: inningsBattingState.batters,
    strikerIndex: inningsBattingState.strikerIndex,
    nonStrikerIndex: inningsBattingState.nonStrikerIndex,
    nextBatterNumber: inningsBattingState.nextBatterNumber,
    currentPartnershipRuns: inningsBattingState.currentPartnershipRuns,
    currentPartnershipBalls: inningsBattingState.currentPartnershipBalls,
    lastStrikeChangeReason: inningsBattingState.lastStrikeChangeReason,
    currentBatter: inningsBattingState.batters[inningsBattingState.strikerIndex] || null,
    strikeRotatedForRuns,
  };
}

function getBatsmanSkillFromState(s) {
  if (s.battingSquad) {
    const striker = getStriker(s.battingSquad);
    return striker?.battingSkill || 5;
  }
  return s.batsman?.skill || 5;
}

function getBowlerSkillFromState(s) {
  if (s.bowlingSquad) {
    const bowler = getCurrentBowler(s.bowlingSquad);
    return bowler?.bowlingSkill || 5;
  }
  return s.bowler?.skill || 5;
}