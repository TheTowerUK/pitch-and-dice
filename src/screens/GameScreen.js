// ═══════════════════════════════════════════════════════
//  GameScreen.js — Phase 4 with Teams + Squads
// ═══════════════════════════════════════════════════════

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Text, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE, FORMATS, getFormatScoreboardLabel } from '../constants/theme';
import { useGameState }         from '../engine/useGameState';
import { WORLD_TEAMS }          from '../engine/teamsData';
import { FormatSelectScreen }   from './FormatSelectScreen';
import { ModeSelector }         from './ModeSelector';
import { TeamSelectScreen }     from './TeamSelectScreen';
import { PlayerSetup }          from './PlayerSetup';
import { HelpScreen }           from './HelpScreen';
import { MatchHistoryScreen }   from './MatchHistoryScreen';
import { MatchDetailScreen }    from './MatchDetailScreen';
import { ScorecardScreen }      from './ScorecardScreen';
import { Scoreboard }           from '../components/Scoreboard';
import { OverBalls }            from '../components/OverBalls';
import { MomentumBar }          from '../components/MomentumBar';
import { PlayerCard }           from '../components/PlayerCard';
import { OutcomeDisplay }       from '../components/OutcomeDisplay';
import { AIDecisionBanner }     from '../components/AIDecisionBanner';
import { ShotSelector }         from '../components/ShotSelector';
import { BowlingSelector }      from '../components/BowlingSelector';
import { FieldSummaryStrip }    from '../components/FieldSummaryStrip';
import { RollButton }           from '../components/RollButton';
import { Commentary }           from '../components/Commentary';
import { WicketModal }          from '../components/WicketModal';
import { NewBatsmanModal }      from '../components/NewBatsmanModal';
import { FieldSetupModal }      from '../components/FieldSetupModal';
import { BowlerSelectModal }    from '../components/BowlerSelectModal';
import { SpecialEventModal }    from '../components/SpecialEventModal';
import { InningsModal }         from '../components/InningsModal';
import { PauseOverlay }         from '../components/PauseOverlay';
import { MilestoneModal }       from '../components/MilestoneModal';
import { DiceRollAnimation }    from '../components/DiceRollAnimation';
import { DevPanel }             from '../components/DevPanel';
import { buildMatchSummary, isResumableInProgressMatch } from '../engine/storageEngine';
import { playSoundForOutcome, playSfxForOutcome, playSoundForWicket, playSoundForSpecialEvent, checkCloseGameCommentary, stopMusic, isAudioEnabled, playSoundForMatchResult, playSoundForFirstInningsEnd, playSoundForChaseStart, stopMatchSounds, playSoundForMilestone, enterSpecialEventAudioMode, exitSpecialEventAudioMode, setMatchGamePhaseForAudioResume, syncBaseAudioForState, LIVE_MATCH_AUDIO_PHASES, handoffMenuAfterTieResult, updateGeneralCommentaryState, getCurrentSpeechKey, isCommentaryClipPlaying, isSpeechLaneBusyForUi, resetAnalystCommentaryStateForDevScenario } from '../engine/soundEngine';

const pickAITeam = (playerTeamId) => {
  const others = Object.values(WORLD_TEAMS).filter(t => t.id !== playerTeamId);
  return others[Math.floor(Math.random() * others.length)];
};

const buildMatchResultCommentary = (matchState) => {
  const format = matchState?.format || 'T20';
  const totalBalls = (FORMATS[format]?.overs || 20) * 6;
  const target = matchState?.target;
  if (!target || matchState?.innings !== 2) return null;

  const battingName = matchState?.battingSquad?.teamName || 'Batting side';
  const bowlingName = matchState?.bowlingSquad?.teamName || 'Bowling side';
  const runs = matchState?.runs ?? 0;
  const wickets = matchState?.wickets ?? 0;
  const balls = matchState?.balls ?? 0;

  const chaseWon = runs >= target;
  const inningsClosed = balls >= totalBalls || wickets >= 10;
  const scoresLevel = runs === (target - 1) && inningsClosed;
  if (scoresLevel) return 'The scores are level! The match finishes tied.';

  if (chaseWon) {
    const wicketsLeft = Math.max(0, 10 - wickets);
    return `${battingName} win by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
  }

  if (inningsClosed) {
    const margin = Math.max(0, target - runs - 1);
    return `${bowlingName} win by ${margin} run${margin !== 1 ? 's' : ''}!`;
  }

  return null;
};

const resolveMatchResult = (matchState) => {
  const format = matchState?.format || 'T20';
  const totalBalls = (FORMATS[format]?.overs || 20) * 6;
  const target = matchState?.target;
  if (!target || matchState?.innings !== 2) return null;

  const runs = matchState?.runs ?? 0;
  const wickets = matchState?.wickets ?? 0;
  const balls = matchState?.balls ?? 0;
  const inningsClosed = balls >= totalBalls || wickets >= 10;
  const chaseWon = runs >= target;
  const tied = runs === (target - 1) && inningsClosed;
  const defendingWon = !chaseWon && inningsClosed && !tied;

  if (chaseWon) return { key: 'chase_win', playerWon: true };
  if (defendingWon) return { key: 'defending_win', playerWon: false };
  if (tied) return { key: 'tie', playerWon: null };
  return null;
};

/** Lead SFX + analyst follow-up for wickets; analyst "new batter" pool only if the innings continues with a replacement striker. */
function getWicketAudioNewBatterAnalystContext(state, maxBalls) {
  if (state.gamePhase === 'wicket_pending') {
    const nextWkts = state.wickets + 1;
    const allOutAfter = nextWkts >= 10;
    const oversCompleteAfter = state.balls >= maxBalls;
    if (!allOutAfter && !oversCompleteAfter) {
      return { newBatterRequiredInSameInnings: true };
    }
    if (allOutAfter) {
      return { newBatterRequiredInSameInnings: false, newBatterAnalystBlockReason: 'all out (innings ended)' };
    }
    return { newBatterRequiredInSameInnings: false, newBatterAnalystBlockReason: 'overs complete (innings ended)' };
  }
  if (state.gamePhase === 'innings_end') {
    return { newBatterRequiredInSameInnings: false, newBatterAnalystBlockReason: 'innings ended' };
  }
  if (state.pendingInningsEnd) {
    return { newBatterRequiredInSameInnings: false, newBatterAnalystBlockReason: 'match ended or change of innings' };
  }
  if (state.gamePhase === 'new_batsman' || state.gamePhase === 'batting') {
    return { newBatterRequiredInSameInnings: true };
  }
  return {
    newBatterRequiredInSameInnings: false,
    newBatterAnalystBlockReason: `gamePhase=${state.gamePhase}`,
  };
}

export const GameScreen = ({ resumableMatch, onGoHome, onQuit, onSaveAndHome }) => {
  const MIN_PLAYING_LOCK_MS = 2200;
  const MAX_PLAYING_LOCK_MS = 6500;
  const SPEECH_CLEAR_POLL_MS = 150;
  const {
    state,
    currentOvers, ballsRemaining,
    runRate, overDisplay,
    momentumTier, pressureTier, rrr,
    confirmFormat, confirmMode, confirmTeam, confirmMilestone,
    backToFormatSelect, backToModeSelect, backToTeamSelect,
    selectShot, selectAggression,
    selectBowling, rollBall,
    commitPendingDelivery,
    resolveSpecialEventContinue,
    confirmWicket, confirmNewBatsman,
    confirmBowler, confirmField, confirmSetup,
    startInnings2, newMatch, resumeMatch,
    commitInningsEnd,
    queueMatchResultCommentary,
    startNextOver,
    jumpToScenario,
    flushCurrentMatch,
  } = useGameState();

  const getWicketNewBatterFollowUpCancelReason = useCallback(() => {
    if (state.gamePhase === 'special_event' || state.deliveryPhase === 'special_event') return 'special_event';
    if (state.gamePhase === 'innings_end') return 'innings_end';
    if (state.gamePhase === 'match_complete') return 'match_complete';
    if (state.pendingInningsEnd) return 'match_complete';
    return null;
  }, [state.gamePhase, state.deliveryPhase, state.pendingInningsEnd]);

  const [showHistory,    setShowHistory]   = useState(false);
  const [showPause,      setShowPause]     = useState(false);
  const [showScorecard,  setShowScorecard] = useState(false);
  const [showFieldEdit,  setShowFieldEdit] = useState(false);
  const [showDiceAnim,   setShowDiceAnim]  = useState(false);
  const [showDevPanel,   setShowDevPanel]  = useState(false);
  const [showPauseHelp,  setShowPauseHelp] = useState(false);
  const [resumeOffered,  setResumeOffered] = useState(false);
  const wasSpecialEventMode = useRef(false);
  const previousGamePhase = useRef(state.gamePhase);
  const hasMounted = useRef(false);
  const lastHandledResultKeyRef = useRef(null);
  const prevWicketsRef = useRef(state.wickets);
  const deliveryLockTimerRef = useRef(null);
  const playingLockStartedAtRef = useRef(0);
  const deliveryActionPhaseRef = useRef('ready');
  const [deliveryActionPhase, setDeliveryActionPhase] = useState('ready'); // ready | rolling | playing

  const clearDeliveryLockTimer = useCallback(() => {
    if (deliveryLockTimerRef.current) {
      clearTimeout(deliveryLockTimerRef.current);
      deliveryLockTimerRef.current = null;
    }
  }, []);

  const setDeliveryActionPhaseWithLog = useCallback((nextPhase) => {
    setDeliveryActionPhase((prev) => {
      if (__DEV__ && prev !== nextPhase) console.log(`[roll-lock] ${prev} -> ${nextPhase}`);
      deliveryActionPhaseRef.current = nextPhase;
      return nextPhase;
    });
  }, []);

  const transitionToReady = useCallback((reason) => {
    clearDeliveryLockTimer();
    setDeliveryActionPhase((prev) => {
      if (__DEV__ && prev !== 'ready') console.log(`[roll-lock] ${prev} -> ready reason=${reason}`);
      deliveryActionPhaseRef.current = 'ready';
      return 'ready';
    });
  }, [clearDeliveryLockTimer]);

  const isSpeechStillActive = useCallback(() => (
    !!getCurrentSpeechKey()
    || !!isCommentaryClipPlaying()
    || !!isSpeechLaneBusyForUi()
  ), []);

  const beginDeliveryLock = useCallback((phase) => {
    clearDeliveryLockTimer();
    setDeliveryActionPhaseWithLog(phase);
    if (phase === 'rolling') {
      deliveryLockTimerRef.current = setTimeout(() => {
        transitionToReady('max_timeout');
      }, 3500);
    }
  }, [clearDeliveryLockTimer, setDeliveryActionPhaseWithLog, transitionToReady]);

  const beginDeliveryPlayingLock = useCallback(() => {
    clearDeliveryLockTimer();
    setDeliveryActionPhaseWithLog('playing');
    playingLockStartedAtRef.current = Date.now();
    deliveryLockTimerRef.current = setTimeout(() => {
      if (isSpeechStillActive()) {
        transitionToReady('max_timeout');
      }
    }, MAX_PLAYING_LOCK_MS);
  }, [clearDeliveryLockTimer, isSpeechStillActive, setDeliveryActionPhaseWithLog, transitionToReady]);

  const releaseDeliveryLock = useCallback(() => {
    transitionToReady('handoff_complete');
  }, [transitionToReady]);

  const releaseDeliveryPlayingLock = useCallback(async () => {
    if (deliveryActionPhaseRef.current !== 'playing') {
      releaseDeliveryLock();
      return;
    }
    const elapsed = Date.now() - (playingLockStartedAtRef.current || Date.now());
    const remaining = Math.max(0, MIN_PLAYING_LOCK_MS - elapsed);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
      if (deliveryActionPhaseRef.current !== 'playing') return;
    }
    const deadline = (playingLockStartedAtRef.current || Date.now()) + MAX_PLAYING_LOCK_MS;
    while (deliveryActionPhaseRef.current === 'playing') {
      if (!isSpeechStillActive()) {
        transitionToReady('handoff_complete');
        return;
      }
      if (__DEV__) console.log('[roll-lock] waiting_for_speech_clear');
      if (Date.now() >= deadline) {
        transitionToReady('max_timeout');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, SPEECH_CLEAR_POLL_MS));
    }
  }, [isSpeechStillActive, releaseDeliveryLock, transitionToReady]);

  useEffect(() => () => {
    clearDeliveryLockTimer();
  }, [clearDeliveryLockTimer]);

  useEffect(() => {
    if (deliveryActionPhase === 'rolling' && state.deliveryPhase !== 'rolling' && !state.pendingOutcome) {
      releaseDeliveryLock();
    }
  }, [deliveryActionPhase, state.deliveryPhase, state.pendingOutcome, releaseDeliveryLock]);

  const presentMatchEndResult = useCallback((resultState, finalOutcome = null) => {
    if (__DEV__) {
      console.log(
        `[match-end] resolve innings=${resultState?.innings} runs=${resultState?.runs} target=${resultState?.target} balls=${resultState?.balls} wickets=${resultState?.wickets}`
      );
    }
    const resultLine = buildMatchResultCommentary(resultState);
    if (resultLine) {
      queueMatchResultCommentary(resultLine);
    }

    const outcome = resolveMatchResult(resultState);
    if (!outcome) {
      if (__DEV__) {
        console.warn('[match-end] unresolved result outcome; using tie/fallback handoff');
      }
      // Fallback: still hand off to menu after a short delay so end audio does not stall.
      handoffMenuAfterTieResult();
      return null;
    }

    const dedupeContext = `${resultState?.balls ?? 0}-i${resultState?.innings ?? 0}`;
    if (__DEV__) {
      console.log(`[match-end] outcome=${outcome.key} dedupe=${dedupeContext}`);
    }
    if (outcome.key === 'chase_win') {
      playSoundForMatchResult(true, dedupeContext);
    } else if (outcome.key === 'defending_win') {
      playSoundForMatchResult(false, dedupeContext);
    } else {
      // Tie: explicit text commentary, no dedicated tie VO pool yet.
      handoffMenuAfterTieResult();
      if (finalOutcome) playSfxForOutcome(finalOutcome);
    }
    return outcome.key;
  }, [queueMatchResultCommentary]);

  useEffect(() => {
    setMatchGamePhaseForAudioResume(state.gamePhase);
    updateGeneralCommentaryState({ gamePhase: state.gamePhase, screen: 'game' });
  }, [state.gamePhase]);

  // Clear tracked phase only when leaving GameScreen entirely.
  useEffect(() => () => {
    setMatchGamePhaseForAudioResume(null);
    updateGeneralCommentaryState({ gamePhase: null, screen: 'home' });
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      previousGamePhase.current = state.gamePhase;
      return;
    }

    const prev = previousGamePhase.current;
    previousGamePhase.current = state.gamePhase;

    const enteredLive = !LIVE_MATCH_AUDIO_PHASES.has(prev) && LIVE_MATCH_AUDIO_PHASES.has(state.gamePhase);
    const exitedLive = LIVE_MATCH_AUDIO_PHASES.has(prev) && !LIVE_MATCH_AUDIO_PHASES.has(state.gamePhase);

    if (enteredLive || exitedLive) {
      syncBaseAudioForState(state);
    }
  }, [state.gamePhase]);

  // ── AppState — persist on background; restart ambient when returning to foreground ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flushCurrentMatch();
        return;
      }
      if (nextState === 'active' && isAudioEnabled()) {
        syncBaseAudioForState(state);
      }
    });
    return () => subscription.remove();
  }, [state.gamePhase, flushCurrentMatch]);

  // Wicket sounds — fire when phase enters wicket_pending
  useEffect(() => {
    if (state.gamePhase === 'wicket_pending' && state.lastWicket) {
      const maxBalls = (FORMATS[state.format]?.overs ?? 20) * 6;
      const analystCtx = getWicketAudioNewBatterAnalystContext(state, maxBalls);
      playSoundForWicket(state.lastWicket.type, {
        dismissalConfirmed: !state.lastWicket?.drs,
        getNewBatterFollowUpCancelReason: getWicketNewBatterFollowUpCancelReason,
        ...analystCtx,
      });
    }
  }, [state.gamePhase, getWicketNewBatterFollowUpCancelReason]);

  // DRS-confirmed wicket: trigger analyst new-batter only after final confirmation (uses post-confirm gamePhase / flags).
  useEffect(() => {
    const wicketsIncreased = state.wickets > prevWicketsRef.current;
    if (wicketsIncreased && state.lastWicket?.drs) {
      const maxBalls = (FORMATS[state.format]?.overs ?? 20) * 6;
      const analystCtx = getWicketAudioNewBatterAnalystContext(state, maxBalls);
      playSoundForWicket(state.lastWicket.type, {
        dismissalConfirmed: true,
        playSfx: false,
        playLead: false,
        playAnalyst: true,
        getNewBatterFollowUpCancelReason: getWicketNewBatterFollowUpCancelReason,
        ...analystCtx,
      });
    }
    prevWicketsRef.current = state.wickets;
  }, [state.wickets, state.lastWicket, state.gamePhase, state.pendingInningsEnd, state.format, getWicketNewBatterFollowUpCancelReason]);

  useEffect(() => {
    const inSpecialEvent = state.gamePhase === 'special_event' || state.deliveryPhase === 'special_event';
    if (inSpecialEvent) {
      setShowDiceAnim(false);
      enterSpecialEventAudioMode();
      wasSpecialEventMode.current = true;
      return;
    }
    if (wasSpecialEventMode.current) {
      exitSpecialEventAudioMode(state);
      wasSpecialEventMode.current = false;
    }
  }, [state.gamePhase, state.deliveryPhase]);

  // Start delivery animation only for queued, not-yet-applied outcomes.
  useEffect(() => {
    if (!state.pendingOutcome) return;
    if (state.gamePhase === 'special_event' || state.deliveryPhase === 'special_event') return;
    if (state.deliveryPhase !== 'rolling') return;
    setShowDiceAnim(true);
  }, [state.pendingOutcome, state.gamePhase, state.deliveryPhase]);

  // Mid-game save: resume immediately (skip format/mode menus).
  useEffect(() => {
    if (!resumableMatch || resumeOffered) return;
    if (isResumableInProgressMatch(resumableMatch) && (resumableMatch.balls ?? 0) > 0) {
      resumeMatch(resumableMatch);
      setResumeOffered(true);
    }
  }, [resumableMatch, resumeOffered, resumeMatch]);

  // Match-over: give result commentary time to play, then stop match-only SFX.
  useEffect(() => {
    if (state.gamePhase === 'innings_end' && state.innings === 2) {
      const timer = setTimeout(() => {
        stopMatchSounds();
      }, 6200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.gamePhase, state.innings]);

  // Unified match-end result presentation (text + audio), reused by all branches.
  useEffect(() => {
    if (!state.pendingInningsEnd || state.innings !== 2) return;
    const resultKey = `${state.innings}-${state.balls}-${state.runs}-${state.wickets}-${state.target ?? 0}`;
    if (lastHandledResultKeyRef.current === resultKey) return;
    lastHandledResultKeyRef.current = resultKey;

    presentMatchEndResult(state, state.lastOutcome || null);
    const timer = setTimeout(() => { commitInningsEnd(); }, 2400);
    return () => clearTimeout(timer);
  }, [
    state.pendingInningsEnd,
    state.innings,
    state.balls,
    state.runs,
    state.wickets,
    state.target,
    state.lastOutcome,
    presentMatchEndResult,
    commitInningsEnd,
  ]);

  // Reset guard once a pending end is resolved so future matches/innings
  // can present result commentary even if they end on the same key values.
  useEffect(() => {
    if (!state.pendingInningsEnd) {
      lastHandledResultKeyRef.current = null;
    }
  }, [state.pendingInningsEnd]);

  // Hold completed over pips briefly so ball 6 is visible.
  useEffect(() => {
    if (state.gamePhase !== 'over_complete') return undefined;
    const last = state.lastOutcome;
    const isBigFinish = last?.type === 'wicket' || last?.runs === 4 || last?.runs === 6;
    const pauseMs = isBigFinish ? 1750 : 1600;
    const timer = setTimeout(() => {
      startNextOver();
    }, pauseMs);
    return () => clearTimeout(timer);
  }, [state.gamePhase, state.lastOutcome, startNextOver]);

  const { gameMode } = state;
  const isManual  = gameMode === 'manual';
  const isBatting = gameMode === 'batting';
  const isBowling = gameMode === 'bowling';

  if (
    resumableMatch &&
    !resumeOffered &&
    state.balls === 0 &&
    (state.gamePhase === 'format_select' || state.gamePhase === 'mode_select')
  ) {
    const fmt = getFormatScoreboardLabel(resumableMatch.format);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resumeScreen}>
          <Text style={styles.resumeTitle}>RESUME MATCH?</Text>
          <Text style={styles.resumeFmt}>{fmt}</Text>
          <Text style={styles.resumeSub}>
            {resumableMatch.runs}/{resumableMatch.wickets}
            {'\n'}Over {Math.floor(resumableMatch.balls / 6)}.{resumableMatch.balls % 6}
          </Text>
          <TouchableOpacity style={styles.resumeBtn} onPress={() => { resumeMatch(resumableMatch); setResumeOffered(true); }}>
            <Text style={styles.resumeBtnText}>RESUME →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={() => { setResumeOffered(true); newMatch(); }}>
            <Text style={styles.newBtnText}>NEW MATCH</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showHistory)   return <MatchHistoryScreen onBack={() => setShowHistory(false)} />;
  if (showPauseHelp) return <HelpScreen onBack={() => { setShowPauseHelp(false); setShowPause(true); }} />;
  if (showScorecard) {
    // Post-match: show the full MatchDetailScreen (both innings + commentary tabs).
    // Mid-match: show the simpler single-innings ScorecardScreen.
    const isMatchComplete = state.gamePhase === 'innings_end' && state.innings === 2;

    if (isMatchComplete) {
      const matchSummary = buildMatchSummary(state, overDisplay, runRate);
      return (
        <MatchDetailScreen
          match={matchSummary}
          onBack={() => setShowScorecard(false)}
        />
      );
    }

    return (
      <ScorecardScreen
        battingSquad={state.battingSquad} bowlingSquad={state.bowlingSquad}
        runs={state.runs} wickets={state.wickets} overDisplay={overDisplay}
        onBack={() => setShowScorecard(false)}
      />
    );
  }

  if (state.gamePhase === 'format_select') {
    return (
      <FormatSelectScreen
        selectedFormat={state.format}
        onSelectFormat={confirmFormat}
        onBack={onGoHome}
      />
    );
  }

  if (state.gamePhase === 'mode_select') {
    return (
      <ModeSelector
        format={getFormatScoreboardLabel(state.format)}
        onConfirm={confirmMode}
        onBack={backToFormatSelect}
      />
    );
  }

  if (state.gamePhase === 'team_select') return (
    <TeamSelectScreen
      formatLabel={getFormatScoreboardLabel(state.format)}
      gameMode={gameMode}
      onBack={backToModeSelect}
      onConfirm={(playerTeam) => {
        const aiTeam = pickAITeam(playerTeam.id);
        if (isBatting)       confirmTeam(playerTeam, aiTeam);
        else if (isBowling)  confirmTeam(aiTeam, playerTeam);
        else                 confirmTeam(playerTeam, aiTeam);
      }}
      onCustomBuild={() => {}}
    />
  );

  if (state.gamePhase === 'setup') return (
    <PlayerSetup
      formatKey={state.format}
      formatLabel={getFormatScoreboardLabel(state.format)}
      gameMode={gameMode}
      battingSquad={state.battingSquad} bowlingSquad={state.bowlingSquad}
      onBack={backToTeamSelect}
      onConfirm={confirmSetup}
    />
  );

  const canRoll             = state.gamePhase === 'batting' && !state.pendingOutcome && state.deliveryPhase !== 'rolling' && !state.pendingInningsEnd;
  const canTriggerRoll = canRoll && deliveryActionPhase === 'ready';
  const rollButtonStatusLabel = deliveryActionPhase === 'rolling'
    ? 'ROLLING...'
    : deliveryActionPhase === 'playing'
      ? 'PLAYING...'
      : 'ROLL';
  const showShotSelector    = isManual || isBatting;
  const showBowlingSelector = isManual || isBowling;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.top}>
        {(() => {
          const scoreboardEl = (
            <Scoreboard
              runs={state.runs}
              wickets={state.wickets}
              overDisplay={overDisplay}
              ballsRemaining={ballsRemaining}
              formatLabel={getFormatScoreboardLabel(state.format)}
              innings={state.innings}
              target={state.target}
              rrr={rrr}
              pressureTier={pressureTier}
              bowler={state.bowler}
              battingSquad={state.battingSquad}
              bowlingSquad={state.bowlingSquad}
              batters={state.batters}
              battingOrder={state.battingOrder}
              players={state.players}
              strikerIndex={state.strikerIndex}
              nonStrikerIndex={state.nonStrikerIndex}
              onHistoryPress={() => setShowHistory(true)} onPausePress={() => setShowPause(true)}
            />
          );
          if (!__DEV__) return scoreboardEl;
          return (
            <TouchableOpacity
              onLongPress={() => setShowDevPanel(true)}
              delayLongPress={1000}
              activeOpacity={1}
            >
              {scoreboardEl}
            </TouchableOpacity>
          );
        })()}
        <OverBalls overBalls={state.overBalls} />
        {state.gamePhase === 'special_event' && state.pendingEvent?.key === 'no_ball' && (
          <View style={styles.noBallBadge}>
            <Text style={styles.noBallText}>NO BALL — FREE HIT AWARDED</Text>
          </View>
        )}
        {state.gamePhase === 'over_complete' && (
          <View style={styles.overCompleteBadge}>
            <Text style={styles.overCompleteText}>OVER COMPLETE</Text>
          </View>
        )}
        <MomentumBar
          momentum={state.momentum}
          tier={momentumTier}
        />
        <PlayerCard
          batsman={state.batsman} bowler={state.bowler}
          battingSquad={state.battingSquad} bowlingSquad={state.bowlingSquad}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <DiceRollAnimation
          visible={showDiceAnim && !!state.pendingOutcome}
          sides={state.pendingOutcome?.effectiveSides || 6}
          finalRoll={state.pendingOutcome?.clampedRoll || 1}
          dieLabel={state.pendingOutcome?.dieLabel || 'D6'}
          shotLabel={state.selectedShot?.toUpperCase() || 'WORK'}
          onComplete={async () => {
            const delivery = state.pendingOutcome;
            const queuedResult = state.queuedResult;
            const queuedAudio = state.queuedAudio;

            if (!delivery || !queuedResult) {
              setShowDiceAnim(false);
              releaseDeliveryLock();
              return;
            }
            if (state.gamePhase === 'special_event' || state.deliveryPhase === 'special_event') {
              setShowDiceAnim(false);
              releaseDeliveryLock();
              return;
            }
            beginDeliveryPlayingLock();
            // Commit state only after animation completion.
            commitPendingDelivery();

            let closeCmtFired = false;
            if (queuedResult.innings === 2 && queuedResult.target) {
              closeCmtFired = checkCloseGameCommentary(queuedResult);
            }
            const qrPhase = queuedResult?.gamePhase;
            const shouldPlayOutcomeCommentary =
              qrPhase !== 'wicket_pending'
              && qrPhase !== 'special_event'
              && (state.gamePhase === 'batting' || qrPhase === 'batting' || qrPhase === 'over_complete');
            if (shouldPlayOutcomeCommentary) {
              // Priority order: milestone > close > normal outcome
              if (queuedAudio?.pendingMilestone) {
                // Milestone just crossed — play SFX only, commentary replaced by milestone call
                playSfxForOutcome(delivery);
                playSoundForMilestone(
                  queuedAudio.pendingMilestone.runs,
                  `${queuedResult.balls}-${queuedResult.innings}-${queuedAudio.pendingMilestone.runs}`,
                );
              } else if (closeCmtFired) {
                playSfxForOutcome(delivery);
              } else {
                await playSoundForOutcome(delivery, queuedResult, {
                  overEnded: queuedResult?.gamePhase === 'over_complete',
                  lastStrikeChangeReason: queuedResult?.lastStrikeChangeReason,
                  partnershipRuns: queuedResult?.currentPartnershipRuns,
                  ballStamp: `${queuedResult?.innings ?? 0}:${queuedResult?.balls ?? 0}:${delivery?.runs ?? 0}`,
                  strikeRotatedForRuns: queuedResult?.strikeRotatedForRuns,
                });
              }
            }
            // If this ball ended the innings, the centralized pendingInningsEnd
            // effect handles result presentation and end transition.
            if (queuedAudio?.pendingInningsEnd) {
              if (queuedResult.innings === 1) {
                playSoundForFirstInningsEnd(queuedResult);
                setTimeout(() => { commitInningsEnd(); }, 2400);
              }
            }
            setShowDiceAnim(false);
            await releaseDeliveryPlayingLock();
          }}
        />

        {/* Last Ball + stats: committed match state only. pendingOutcome drives DiceRollAnimation only. */}
        <OutcomeDisplay
          outcome={state.lastOutcome}
          stats={{ balls: state.balls, boundaries: state.boundaries, sixes: state.sixes, dots: state.dots }}
        />

        {showShotSelector && (
          <ShotSelector
            selectedShot={state.selectedShot} selectedAggression={state.selectedAggression}
            onSelectShot={selectShot} onSelectAggression={selectAggression}
          />
        )}

        {showBowlingSelector && (
          <BowlingSelector selectedBowling={state.selectedBowling} onSelectBowling={selectBowling} />
        )}

        {state.freeHit && (
          <View style={styles.freeHitBanner}>
            <Text style={styles.freeHitText}>FREE HIT — BONUS BALL · NO WICKET</Text>
          </View>
        )}

        <RollButton
          selectedShot={state.selectedShot}
          onRoll={() => {
            beginDeliveryLock('rolling');
            rollBall();
          }}
          disabled={!canTriggerRoll}
          statusLabel={rollButtonStatusLabel}
          gameMode={gameMode}
        />

        <AIDecisionBanner aiDecision={state.aiDecision} gameMode={gameMode} />

        <FieldSummaryStrip
          field={state.field}
          label={isBatting ? 'AI FIELD' : 'CURRENT FIELD'}
          onEditPress={() => setShowFieldEdit(true)}
          showEdit={isManual}
        />

        {state.battingSquad && (
          <TouchableOpacity style={styles.scorecardBtn} onPress={() => setShowScorecard(true)}>
            <Text style={styles.scorecardBtnText}>📋 VIEW SCORECARD</Text>
          </TouchableOpacity>
        )}

        <Commentary commentary={state.commentary} />
      </ScrollView>

      <SpecialEventModal
        visible={state.gamePhase === 'special_event'}
        event={state.pendingEvent}
        onConfirm={() => {
          playSoundForSpecialEvent(state.pendingEvent?.key, String(state.balls));
          resolveSpecialEventContinue();
        }}
      />
      <WicketModal visible={state.gamePhase === 'wicket_pending'} wicket={state.lastWicket} drsReviews={state.drsReviews ?? 1} onConfirm={confirmWicket} />
      <NewBatsmanModal visible={state.gamePhase === 'new_batsman'} wicketInfo={state.lastWicket} onConfirm={confirmNewBatsman} />
      <BowlerSelectModal visible={state.gamePhase === 'bowler_select'} bowlingSquad={state.bowlingSquad} format={state.format} currentOver={currentOvers} onConfirm={confirmBowler} />
      <FieldSetupModal
        visible={state.gamePhase === 'field_setup' || showFieldEdit}
        currentOver={currentOvers}
        onConfirm={(field) => { confirmField(field); setShowFieldEdit(false); }}
      />
      <MilestoneModal visible={!!state.pendingMilestone} milestone={state.pendingMilestone?.runs} batsmanName={state.pendingMilestone?.batsmanName} onConfirm={confirmMilestone} />
      <PauseOverlay
        visible={showPause} runs={state.runs} wickets={state.wickets}
        overDisplay={overDisplay} formatLabel={getFormatScoreboardLabel(state.format)} innings={state.innings}
        audioRestoreContext={{ screen: 'game', gamePhase: state.gamePhase }}
        onResume={() => setShowPause(false)}
        onHelpPress={() => setShowPauseHelp(true)}
        onSaveAndHome={() => { setShowPause(false); onSaveAndHome?.(); onGoHome?.(); }}
        onQuit={() => { setShowPause(false); onQuit?.(); }}
      />
      <InningsModal
        visible={state.gamePhase === 'innings_end'} innings={state.innings}
        runs={state.runs} wickets={state.wickets} overDisplay={overDisplay}
        boundaries={state.boundaries} sixes={state.sixes} dots={state.dots}
        runRate={runRate} target={state.target}
        battingSquad={state.battingSquad} bowlingSquad={state.bowlingSquad}
        innings1Runs={state.innings1Stats?.runs}
        innings1Wickets={state.innings1Stats?.wickets}
        innings1Overs={state.innings1Stats?.overs}
        onStartInnings2={() => {
          playSoundForChaseStart({
            innings: 2,
            format: state.format,
            target: (state.runs ?? 0) + 1,
            runs: 0,
            balls: 0,
          });
          startInnings2();
        }}
        onNewMatch={() => newMatch(state.format)}
        onViewScorecard={() => setShowScorecard(true)}
      />
      {__DEV__ && (
        <DevPanel
          visible={showDevPanel}
          onClose={() => setShowDevPanel(false)}
          onJump={(scenario) => {
            resetAnalystCommentaryStateForDevScenario();
            jumpToScenario(scenario);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLOURS.slate },
  top:           { backgroundColor: COLOURS.ink },
  scroll:        { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  freeHitBanner: {
    backgroundColor: 'rgba(240,192,64,0.15)', borderWidth: 1, borderColor: COLOURS.gold,
    marginHorizontal: SPACE.lg, marginBottom: SPACE.sm, padding: SPACE.sm,
    alignItems: 'center', borderRadius: 3,
  },
  freeHitText: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.gold, letterSpacing: 2 },
  noBallBadge: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.40)',
    borderRadius: 3,
    backgroundColor: 'rgba(212,160,23,0.10)',
  },
  noBallText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.gold,
    letterSpacing: 2,
  },
  overCompleteBadge: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    borderRadius: 3,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  overCompleteText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 3,
  },
  scorecardBtn: {
    marginHorizontal: SPACE.lg, marginBottom: SPACE.sm, paddingVertical: SPACE.sm,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, backgroundColor: COLOURS.ink,
  },
  scorecardBtnText: { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 2 },
  resumeScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xxl, backgroundColor: COLOURS.slate },
  resumeTitle: { fontFamily: FONTS.display, fontSize: 36, letterSpacing: 5, color: COLOURS.gold, marginBottom: SPACE.md },
  resumeFmt: {
    fontFamily: FONTS.display, fontSize: SIZES.lg, letterSpacing: 3, color: COLOURS.gold,
    marginBottom: SPACE.sm, textAlign: 'center',
  },
  resumeSub: { fontFamily: FONTS.mono, fontSize: SIZES.md, color: COLOURS.cream, textAlign: 'center', lineHeight: 22, marginBottom: SPACE.xxl },
  resumeBtn: { backgroundColor: COLOURS.gold, borderRadius: 4, paddingVertical: SPACE.lg, paddingHorizontal: SPACE.xxl, marginBottom: SPACE.md, width: '100%', alignItems: 'center' },
  resumeBtnText: { fontFamily: FONTS.display, fontSize: SIZES.xl, letterSpacing: 5, color: COLOURS.ink },
  newBtn: { borderWidth: 1, borderColor: COLOURS.dot, borderRadius: 4, paddingVertical: SPACE.md, paddingHorizontal: SPACE.xxl, width: '100%', alignItems: 'center' },
  newBtnText: { fontFamily: FONTS.display, fontSize: SIZES.lg, letterSpacing: 4, color: COLOURS.dot },
});