// ═══════════════════════════════════════════════════════
//  GameScreen.js — Phase 4 with Teams + Squads
// ═══════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, StatusBar,
  TouchableOpacity, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { useGameState }         from '../engine/useGameState';
import { WORLD_TEAMS }          from '../engine/teamsData';
import { ModeSelector }         from './ModeSelector';
import { TeamSelectScreen }     from './TeamSelectScreen';
import { PlayerSetup }          from './PlayerSetup';
import { MatchHistoryScreen }   from './MatchHistoryScreen';
import { ScorecardScreen }      from './ScorecardScreen';
import { Scoreboard }           from '../components/Scoreboard';
import { OverBalls }            from '../components/OverBalls';
import { MomentumBar }          from '../components/MomentumBar';
import { PlayerCard }           from '../components/PlayerCard';
import { PressureIndicator }    from '../components/PressureIndicator';
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

// AI opponent team — randomly pick from world teams excluding player's team
const pickAITeam = (playerTeamId) => {
  const others = Object.values(WORLD_TEAMS).filter(t => t.id !== playerTeamId);
  return others[Math.floor(Math.random() * others.length)];
};

export const GameScreen = ({ resumableMatch, onGoHome, onQuit, onSaveAndHome }) => {
  const {
    state,
    currentOvers, ballsRemaining,
    runRate, overDisplay,
    momentumTier, pressureTier, rrr,
    confirmMode, confirmTeam,
    selectShot, selectAggression,
    selectBowling, cycleFormat, rollBall,
    confirmSpecialEvent,
    confirmWicket, confirmNewBatsman,
    confirmBowler, confirmField, confirmSetup,
    startInnings2, newMatch, resumeMatch,
  } = useGameState();

  const [showHistory,   setShowHistory]   = useState(false);
  const [showPause,     setShowPause]     = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showFieldEdit, setShowFieldEdit] = useState(false);
  const [resumeOffered, setResumeOffered] = useState(false);

  useEffect(() => {
    if (resumableMatch && !resumeOffered) setResumeOffered(true);
  }, []);

  const { gameMode } = state;
  const isManual  = gameMode === 'manual';
  const isBatting = gameMode === 'batting';
  const isBowling = gameMode === 'bowling';

  // ── Resume prompt ──────────────────────
  if (resumableMatch && !resumeOffered && state.gamePhase === 'mode_select' && state.balls === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resumeScreen}>
          <Text style={styles.resumeTitle}>RESUME MATCH?</Text>
          <Text style={styles.resumeSub}>
            {resumableMatch.format} — {resumableMatch.runs}/{resumableMatch.wickets}
            {'\n'}Over {Math.floor(resumableMatch.balls / 6)}.{resumableMatch.balls % 6}
          </Text>
          <TouchableOpacity style={styles.resumeBtn} onPress={() => resumeMatch(resumableMatch)}>
            <Text style={styles.resumeBtnText}>RESUME →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={() => setResumeOffered(true)}>
            <Text style={styles.newBtnText}>NEW MATCH</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showHistory)   return <MatchHistoryScreen onBack={() => setShowHistory(false)} />;
  if (showScorecard) return (
    <ScorecardScreen
      battingSquad={state.battingSquad}
      bowlingSquad={state.bowlingSquad}
      runs={state.runs}
      wickets={state.wickets}
      overDisplay={overDisplay}
      onBack={() => setShowScorecard(false)}
    />
  );

  // ── Mode selector ──────────────────────
  if (state.gamePhase === 'mode_select') {
    return <ModeSelector format={state.format} onConfirm={confirmMode} />;
  }

  // ── Team selection ─────────────────────
  if (state.gamePhase === 'team_select') {
    return (
      <TeamSelectScreen
        format={state.format}
        gameMode={gameMode}
        onConfirm={(playerTeam) => {
          const aiTeam = pickAITeam(playerTeam.id);
          // batting mode: player bats (battingSquad), AI bowls (bowlingSquad)
          // bowling mode: player bowls (bowlingSquad), AI bats (battingSquad)
          if (isBatting) {
            confirmTeam(playerTeam, aiTeam);
          } else if (isBowling) {
            confirmTeam(aiTeam, playerTeam); // AI bats first
          } else {
            confirmTeam(playerTeam, aiTeam); // manual: player bats first
          }
        }}
        onCustomBuild={() => {/* TODO Phase 4b — custom builder */}}
      />
    );
  }

  // ── Player setup ───────────────────────
  if (state.gamePhase === 'setup') {
    return (
      <PlayerSetup
        format={state.format}
        gameMode={gameMode}
        battingSquad={state.battingSquad}
        bowlingSquad={state.bowlingSquad}
        onConfirm={confirmSetup}
      />
    );
  }

  const canRoll            = state.gamePhase === 'batting';
  const showShotSelector   = isManual || isBatting;
  const showBowlingSelector = isManual || isBowling;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.top}>
        <Scoreboard
          runs={state.runs}
          wickets={state.wickets}
          overDisplay={overDisplay}
          format={state.format}
          innings={state.innings}
          target={state.target}
          ballsRemaining={ballsRemaining}
          onFormatPress={cycleFormat}
          onHistoryPress={() => setShowHistory(true)}
          onPausePress={() => setShowPause(true)}
        />
        <OverBalls overBalls={state.overBalls} />
        <MomentumBar momentum={state.momentum} tier={momentumTier} />
        <PlayerCard batsman={state.batsman} bowler={state.bowler} />
        <PressureIndicator
          rrr={rrr}
          pressureTier={pressureTier}
          target={state.target}
          runs={state.runs}
          ballsRemaining={ballsRemaining}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Last ball outcome */}
        <OutcomeDisplay
          outcome={state.lastOutcome}
          stats={{
            balls:      state.balls,
            boundaries: state.boundaries,
            sixes:      state.sixes,
            dots:       state.dots,
          }}
        />

        {/* 2. Shot selector (batting / manual) */}
        {showShotSelector && (
          <ShotSelector
            selectedShot={state.selectedShot}
            selectedAggression={state.selectedAggression}
            onSelectShot={selectShot}
            onSelectAggression={selectAggression}
          />
        )}

        {/* 3. Bowling selector before roll (manual / bowling) */}
        {showBowlingSelector && (
          <BowlingSelector
            selectedBowling={state.selectedBowling}
            onSelectBowling={selectBowling}
          />
        )}

        {/* 4. Roll button */}
        {state.freeHit && (
          <View style={styles.freeHitBanner}>
            <Text style={styles.freeHitText}>FREE HIT — NO WICKET THIS BALL</Text>
          </View>
        )}
        <RollButton
          selectedShot={state.selectedShot}
          onRoll={rollBall}
          disabled={!canRoll}
          gameMode={gameMode}
        />

        {/* 5. AI decision revealed after roll */}
        <AIDecisionBanner aiDecision={state.aiDecision} gameMode={gameMode} />

        {/* 6. Field summary strip */}
        <FieldSummaryStrip
          field={state.field}
          label={isBatting ? 'AI FIELD' : 'CURRENT FIELD'}
          onEditPress={() => setShowFieldEdit(true)}
          showEdit={isManual}
        />

        {/* 7. Scorecard link */}
        {(state.battingSquad) && (
          <TouchableOpacity style={styles.scorecardBtn} onPress={() => setShowScorecard(true)}>
            <Text style={styles.scorecardBtnText}>📋 VIEW SCORECARD</Text>
          </TouchableOpacity>
        )}

        {/* 8. Commentary */}
        <Commentary commentary={state.commentary} />
      </ScrollView>

      {/* Modals */}
      <SpecialEventModal
        visible={state.gamePhase === 'special_event'}
        event={state.pendingEvent}
        onConfirm={confirmSpecialEvent}
      />
      <WicketModal
        visible={state.gamePhase === 'wicket_pending'}
        onConfirm={confirmWicket}
      />
      <NewBatsmanModal
        visible={state.gamePhase === 'new_batsman'}
        wicketInfo={state.lastWicket}
        onConfirm={confirmNewBatsman}
      />
      <BowlerSelectModal
        visible={state.gamePhase === 'bowler_select'}
        bowlingSquad={state.bowlingSquad}
        format={state.format}
        currentOver={currentOvers}
        onConfirm={confirmBowler}
      />
      <FieldSetupModal
        visible={state.gamePhase === 'field_setup' || showFieldEdit}
        currentOver={currentOvers}
        onConfirm={(field) => { confirmField(field); setShowFieldEdit(false); }}
      />
      <PauseOverlay
        visible={showPause}
        runs={state.runs}
        wickets={state.wickets}
        overDisplay={overDisplay}
        format={state.format}
        innings={state.innings}
        onResume={() => setShowPause(false)}
        onSaveAndHome={() => { setShowPause(false); onSaveAndHome && onSaveAndHome(); onGoHome && onGoHome(); }}
        onQuit={() => { setShowPause(false); onQuit && onQuit(); }}
      />
      <InningsModal
        visible={state.gamePhase === 'innings_end'}
        innings={state.innings}
        runs={state.runs}
        wickets={state.wickets}
        overDisplay={overDisplay}
        boundaries={state.boundaries}
        sixes={state.sixes}
        dots={state.dots}
        runRate={runRate}
        target={state.target}
        onStartInnings2={startInnings2}
        onNewMatch={() => newMatch(state.format)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLOURS.slate },
  top:           { backgroundColor: COLOURS.ink },
  scroll:        { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  freeHitBanner: {
    backgroundColor: 'rgba(240,192,64,0.15)',
    borderWidth:     1,
    borderColor:     COLOURS.gold,
    marginHorizontal: SPACE.lg,
    marginBottom:    SPACE.sm,
    padding:         SPACE.sm,
    alignItems:      'center',
    borderRadius:    3,
  },
  freeHitText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    color:        COLOURS.gold,
    letterSpacing: 2,
  },
  scorecardBtn: {
    marginHorizontal: SPACE.lg,
    marginBottom:     SPACE.sm,
    paddingVertical:  SPACE.sm,
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.1)',
    borderRadius:     3,
    backgroundColor:  COLOURS.ink,
  },
  scorecardBtnText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
  },
  resumeScreen: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        SPACE.xxl,
    backgroundColor: COLOURS.slate,
  },
  resumeTitle: {
    fontFamily:   FONTS.display,
    fontSize:     36,
    letterSpacing: 5,
    color:        COLOURS.gold,
    marginBottom: SPACE.md,
  },
  resumeSub: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.md,
    color:        COLOURS.cream,
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: SPACE.xxl,
  },
  resumeBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    4,
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.xxl,
    marginBottom:    SPACE.md,
    width:           '100%',
    alignItems:      'center',
  },
  resumeBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    letterSpacing: 5,
    color:        COLOURS.ink,
  },
  newBtn: {
    borderWidth:     1,
    borderColor:     COLOURS.dot,
    borderRadius:    4,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xxl,
    width:           '100%',
    alignItems:      'center',
  },
  newBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 4,
    color:        COLOURS.dot,
  },
});
