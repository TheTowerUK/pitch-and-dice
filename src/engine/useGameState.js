// ═══════════════════════════════════════════════════════
//  useGameState.js — Phase 4 with Teams + Squads
//  Adds: batting squad, bowling squad, bowler selection,
//  auto-next-batsman from batting order, scorecard tracking.
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
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
  shouldTriggerEvent, resolveSpecialEvent, applyEventEffect,
} from '../engine/specialEvents';
import {
  getRequiredRunRate, getPressureTier,
  applyPressureMod, getPressureCommentary, isChasing,
} from '../engine/pressureEngine';
import {
  makePartnership, updatePartnership, resetPartnership,
  checkPartnershipMilestone,
} from '../engine/partnershipEngine';
import {
  saveCurrentMatch, clearCurrentMatch,
  saveMatchToHistory, buildMatchSummary,
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
} from '../engine/teamEngine';
import { FORMATS, FORMAT_ORDER } from '../constants/theme';

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
  freeHit:     false,
});

const makeInitialState = (format = 'T20', gameMode = 'manual') => ({
  format,
  gameMode,
  innings:            1,
  target:             null,
  gamePhase:          'mode_select',
  lastOutcome:        null,
  lastWicket:         null,
  pendingEvent:       null,
  aiDecision:         null,
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
  const afterSkill     = applySkillMod(afterMomentum, effectiveSides, batsmanSkill, bowlerSkill);

  let afterPressure = afterSkill;
  if (isChasing(target, innings)) {
    const rrr          = getRequiredRunRate(target, runs, ballsRemaining);
    const pressureTier = getPressureTier(rrr);
    afterPressure      = applyPressureMod(afterSkill, effectiveSides, pressureTier);
  }

  const rawShift    = afterPressure - rawRoll;
  const cappedShift = Math.max(-1, Math.min(1, rawShift));
  const cappedResult = Math.max(1, Math.min(effectiveSides, rawRoll + cappedShift));

  const tableSize    = SHOT_CONFIG[shotKey].sides;
  const clampedIndex = Math.max(1, Math.min(tableSize, cappedResult));
  let outcome        = { ...OUTCOME_TABLES[shotKey][clampedIndex] };

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
  const [state, setState] = useState(makeInitialState('T20'));

  const currentOvers      = Math.floor(state.balls / 6);
  const currentBallInOver = state.balls % 6;
  const maxBalls          = FORMATS[state.format].overs * 6;
  const ballsRemaining    = maxBalls - state.balls;
  const runRate           = state.balls > 0
    ? ((state.runs / state.balls) * 6).toFixed(2) : '0.00';
  const overDisplay  = `${currentOvers}.${currentBallInOver}`;
  const momentumTier = getMomentumTier(state.momentum);
  const rrr          = getRequiredRunRate(state.target, state.runs, ballsRemaining);
  const pressureTier = isChasing(state.target, state.innings) ? getPressureTier(rrr) : null;

  // ── AUTO-SAVE ──────────────────────────
  useEffect(() => {
    if (state.gamePhase === 'batting' || state.gamePhase === 'wicket_pending') {
      saveCurrentMatch(state);
    }
    if (state.gamePhase === 'innings_end') {
      const summary = buildMatchSummary(state, overDisplay, runRate);
      saveMatchToHistory(summary);
      clearCurrentMatch();
    }
  }, [state.balls, state.wickets, state.gamePhase]);

  // ── SELECTIONS ──────────────────────────
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

  const cycleFormat = useCallback(() => {
    setState(s => {
      const idx  = FORMAT_ORDER.indexOf(s.format);
      const next = FORMAT_ORDER[(idx + 1) % FORMAT_ORDER.length];
      return makeInitialState(next, s.gameMode);
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
      if (s.gamePhase !== 'batting') return s;

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

      if (shouldTriggerEvent()) {
        const event = resolveSpecialEvent();
        return { ...updatedState, pendingEvent: event, gamePhase: 'special_event' };
      }

      return resolveAndApplyBall(updatedState, maxBalls);
    });
  }, [maxBalls]);

  // ── CONFIRM SPECIAL EVENT ──────────────
  const confirmSpecialEvent = useCallback(() => {
    setState(s => {
      if (!s.pendingEvent) return { ...s, gamePhase: 'batting' };
      const event   = s.pendingEvent;
      const updates = applyEventEffect(event, s, clampMomentum);
      const newCommentary = [
        { ball: 'EVENT', text: `${event.icon} ${event.effect.message}`, style: 'momentum' },
        ...s.commentary,
      ];
      if (updates.forceWicket) {
        return { ...s, ...updates, commentary: newCommentary, gamePhase: 'wicket_pending', pendingEvent: null };
      }
      return { ...s, ...updates, commentary: newCommentary, gamePhase: 'batting', pendingEvent: null, freeHit: updates.freeHit || false };
    });
  }, []);

  // ── CONFIRM WICKET ─────────────────────
  const confirmWicket = useCallback(() => {
    setState(s => {
      const wicket  = resolveWicket();
      const newWkts = s.wickets + 1;
      const allOut  = newWkts >= 10;
      const oversUp = s.balls >= maxBalls;

      const newCommentary = [
        { ball: 'WICKET', text: `${wicket.type} — ${newWkts} down.`, style: 'wicket' },
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

      // Update bowler wicket stats in bowling squad
      let updatedBowlingSquad = s.bowlingSquad;

      let newPhase = 'new_batsman';
      if (allOut || oversUp) newPhase = 'innings_end';
      // If using squads, batsman auto-populated — skip new_batsman modal
      if (updatedBattingSquad && !allOut && !oversUp) newPhase = 'batting';

      // Update legacy batsman from new striker
      const newStriker = updatedBattingSquad ? getStriker(updatedBattingSquad) : null;
      const updatedBatsman = newStriker
        ? { ...s.batsman, name: newStriker.name, skill: newStriker.battingSkill }
        : s.batsman;

      return {
        ...s,
        wickets:       newWkts,
        lastWicket:    wicket,
        commentary:    newCommentary,
        partnership:   resetPartnership(),
        gamePhase:     newPhase,
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
    }));
  }, []);

  // ── CONFIRM FIELD ──────────────────────
  const confirmField = useCallback((field) => {
    setState(s => ({ ...s, field, gamePhase: 'batting' }));
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

      return {
        ...makeInningsState(),
        format:            s.format,
        gameMode:          s.gameMode,
        innings:           2,
        target:            s.runs + 1,
        gamePhase:         'setup',
        lastOutcome:       null,
        lastWicket:        null,
        pendingEvent:      null,
        selectedShot:      s.selectedShot,
        selectedAggression: s.selectedAggression,
        selectedBowling:   s.selectedBowling,
        pitchType:         s.pitchType,
        batsman:           { ...DEFAULT_BATSMAN },
        bowler:            { ...DEFAULT_BOWLER },
        battingSquad:      newBattingSquad,
        bowlingSquad:      newBowlingSquad,
      };
    });
  }, []);

  // ── NEW MATCH ──────────────────────────
  const newMatch = useCallback((format) => {
    clearCurrentMatch();
    setState(makeInitialState(format || 'T20', 'manual'));
  }, []);

  // ── RESUME ─────────────────────────────
  const resumeMatch = useCallback((savedState) => {
    setState({ ...savedState, gamePhase: 'batting' });
  }, []);

  return {
    state,
    currentOvers, currentBallInOver,
    maxBalls, ballsRemaining,
    runRate, overDisplay,
    momentumTier, pressureTier, rrr,
    confirmMode, confirmTeam,
    selectShot, selectAggression,
    selectBowling, updateField,
    cycleFormat, rollBall,
    confirmSpecialEvent,
    confirmWicket, confirmNewBatsman,
    confirmBowler,
    confirmField, confirmSetup,
    startInnings2, newMatch, resumeMatch,
  };
};

// ─────────────────────────────────────────
//  INTERNAL — RESOLVE AND APPLY BALL
// ─────────────────────────────────────────
function resolveAndApplyBall(s, maxBalls) {
  const batsmanSkill = getBatsmanSkillFromState(s);
  const bowlerSkill  = getBowlerSkillFromState(s);

  let outcome = resolveFullBall(
    s.selectedShot, s.selectedAggression, s.selectedBowling,
    s.momentum, batsmanSkill, bowlerSkill,
    s.pitchType, s.field,
    s.target, s.runs, maxBalls - s.balls, s.innings, s.freeHit,
  );

  // Apply underdog boost at key moments
  outcome = applyUnderdogEffect(outcome, s.battingSquad, s.bowlingSquad);

  // Underdog commentary
  const underdogMsg = getUnderdogCommentary(outcome);

  // Partnership
  const newPartnership = updatePartnership(s.partnership, outcome.runs);
  const milestone      = checkPartnershipMilestone(s.partnership.runs, newPartnership.runs);

  // Momentum
  let momentumShift    = getMomentumShift(outcome);
  const newRecentBalls = [...s.recentBalls, { type: outcome.type, runs: outcome.runs }].slice(-20);
  if (outcome.type === 'wicket' && isCollapse(newRecentBalls)) momentumShift += -5;
  if (milestone) momentumShift += milestone.momentumBonus;

  const oldMomentum    = s.momentum;
  const newMomentum    = clampMomentum(oldMomentum + momentumShift);
  const newBalls       = s.balls + 1;
  const newOverBalls   = [...s.overBalls, { type: outcome.type, runs: outcome.runs }];
  const isOverComplete = newBalls % 6 === 0;

  let maidenPenalty = 0;
  if (isOverComplete && isMaidenOver(newOverBalls)) maidenPenalty = -2;
  const finalMomentum = clampMomentum(newMomentum + maidenPenalty);

  const newRuns  = s.runs + outcome.runs;
  const newDots  = outcome.type === 'dot'  ? s.dots + 1       : s.dots;
  const newFours = outcome.runs === 4       ? s.boundaries + 1 : s.boundaries;
  const newSixes = outcome.runs === 6       ? s.sixes + 1      : s.sixes;

  // Update squad stats
  let updatedBattingSquad = s.battingSquad;
  if (updatedBattingSquad && outcome.type !== 'wicket') {
    updatedBattingSquad = updateBatsmanStats(
      updatedBattingSquad,
      outcome.runs,
      outcome.runs === 4,
      outcome.runs === 6,
    );
  }

  // Commentary
  const overNum = Math.floor(s.balls / 6);
  const ballNum = (s.balls % 6) + 1;
  const striker = updatedBattingSquad ? getStriker(updatedBattingSquad) : null;
  const ballTag = `${overNum}.${ballNum}${striker ? ` — ${striker.name.split(' ').pop()}` : ''}`;

  let cmtStyle = 'normal';
  if (outcome.type === 'wicket') cmtStyle = 'wicket';
  else if (outcome.runs === 6)   cmtStyle = 'six';
  else if (outcome.runs === 4)   cmtStyle = 'four';

  const newCommentary = [
    { ball: ballTag, text: outcome.detail, style: cmtStyle },
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
    const rrr = getRequiredRunRate(s.target, newRuns, maxBalls - newBalls);
    const pressureMsg = getPressureCommentary(rrr, maxBalls - newBalls);
    if (pressureMsg && newBalls % 6 === 0) {
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

  // Phase
  const allOut   = outcome.type === 'wicket' && (s.wickets + 1) >= 10;
  const oversUp  = newBalls >= maxBalls;
  const chaseWon = s.target && newRuns >= s.target;

  let newPhase = 'batting';
  if (outcome.type === 'wicket' && !allOut && !chaseWon) {
    newPhase = s.battingSquad ? 'wicket_pending' : 'wicket_pending';
  }
  if (allOut || oversUp || chaseWon) newPhase = 'innings_end';

  // Over complete — handle field + bowler selection
  let updatedBowlingSquad = s.bowlingSquad;
  if (isOverComplete && newPhase === 'batting') {
    if (updatedBowlingSquad) {
      updatedBowlingSquad = updateBowlerOvers(updatedBowlingSquad);
    }
    if (s.gameMode === 'batting') {
      // AI sets field and selects new bowler automatically
      const aiField     = getAIFieldPlacement(s);
      const aiBowlerIdx = getAIBowlerSelection(
        updatedBowlingSquad || s.bowlingSquad,
        s.format, finalMomentum, s.pitchType
      );
      if (aiBowlerIdx !== null && updatedBowlingSquad) {
        updatedBowlingSquad = setBowler(updatedBowlingSquad, aiBowlerIdx);
        const newBowlerPlayer = updatedBowlingSquad.players[aiBowlerIdx];
        // commentary about new bowler
        newCommentary.unshift({
          ball: 'NEW OVER',
          text: `${newBowlerPlayer?.name || 'Bowler'} to bowl over ${overNum + 2}.`,
          style: 'normal',
        });
      }
      return {
        ...s,
        balls: newBalls, runs: newRuns, dots: newDots,
        boundaries: newFours, sixes: newSixes,
        momentum: finalMomentum,
        overBalls: [], recentBalls: newRecentBalls,
        commentary: newCommentary.slice(0, 60),
        lastOutcome: outcome, gamePhase: 'batting',
        field: aiField,
        partnership: outcome.type === 'wicket' ? resetPartnership() : newPartnership,
        freeHit: false,
        batsman: { ...s.batsman, ballsFaced: (s.batsman.ballsFaced || 0) + 1, runs: (s.batsman.runs || 0) + outcome.runs },
        bowler:  { ...s.bowler, ballsBowled: (s.bowler.ballsBowled || 0) + 1 },
        battingSquad: updatedBattingSquad,
        bowlingSquad: updatedBowlingSquad,
      };
    }
    // Manual/bowling mode — prompt bowler select then field
    newPhase = updatedBowlingSquad ? 'bowler_select' : 'field_setup';
  }

  return {
    ...s,
    balls:       newBalls,
    runs:        newRuns,
    dots:        newDots,
    boundaries:  newFours,
    sixes:       newSixes,
    momentum:    finalMomentum,
    overBalls:   isOverComplete ? [] : newOverBalls,
    recentBalls: newRecentBalls,
    commentary:  newCommentary.slice(0, 60),
    lastOutcome: outcome,
    gamePhase:   newPhase,
    partnership: outcome.type === 'wicket' ? resetPartnership() : newPartnership,
    freeHit:     false,
    batsman:     { ...s.batsman, ballsFaced: (s.batsman.ballsFaced || 0) + 1, runs: (s.batsman.runs || 0) + outcome.runs },
    bowler:      { ...s.bowler, ballsBowled: (s.bowler.ballsBowled || 0) + 1 },
    battingSquad: updatedBattingSquad,
    bowlingSquad: updatedBowlingSquad,
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
