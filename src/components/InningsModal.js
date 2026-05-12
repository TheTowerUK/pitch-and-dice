// ─────────────────────────────────────────
//  InningsModal.js
//  Innings complete + full match result screen.
//  Innings 1: shows stats, prompts innings 2.
//  Innings 2: full win/loss result with scorecard.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, ScrollView, StyleSheet,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { AnimatedMatchModal } from './animated/AnimatedMatchModal';

const StatRow = ({ label, value, highlight, large }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[
      styles.statValue,
      highlight && { color: COLOURS.runs1 },
      large     && { fontSize: 32, letterSpacing: 2, lineHeight: 34 },
    ]}>
      {value}
    </Text>
  </View>
);

const SectionHeader = ({ label }) => (
  <Text style={styles.sectionHeader}>{label}</Text>
);

export const InningsModal = ({
  visible, innings, runs, wickets,
  overDisplay, boundaries, sixes, dots, runRate,
  target, battingSquad, bowlingSquad,
  innings1Runs, innings1Wickets, innings1Overs,
  onStartInnings2, onNewMatch, onViewScorecard,
  captureMode = false,
}) => {
  const resultPulse = useRef(new Animated.Value(1)).current;

  const isInnings2  = innings === 2;
  const chaseWon    = !!(target && runs >= target);
  const tied        = !!(target && isInnings2 && runs === target - 1);
  const wicketsLeft = 10 - wickets;
  const runsMargin  = chaseWon ? runs - target : 0;
  const deficitRuns = !chaseWon && isInnings2 ? target - runs - 1 : 0;
  const moodKey     = isInnings2 ? (chaseWon ? 'win' : tied ? 'tie' : 'loss') : 'innings';

  const mood = {
    win: {
      accent: COLOURS.runs1,
      secondary: COLOURS.gold,
      overlay: 'rgba(4,18,12,0.90)',
      cardBg: '#162419',
      headerBg: 'rgba(39,174,96,0.20)',
      statsBg: 'rgba(44,62,80,0.92)',
      buttonBg: '#121f16',
      buttonBorder: 'rgba(39,174,96,0.45)',
      buttonText: COLOURS.runs1,
      title: `WON — CHASED ${target || 0} SUCCESSFULLY`,
      resultLine: wickets < 10
        ? `Won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`
        : `Won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`,
    },
    loss: {
      accent: '#b85b4f',
      secondary: '#d4a017',
      overlay: 'rgba(4,5,8,0.94)',
      cardBg: '#151719',
      headerBg: 'rgba(184,91,79,0.12)',
      statsBg: 'rgba(28,35,43,0.94)',
      buttonBg: '#111315',
      buttonBorder: 'rgba(184,91,79,0.42)',
      buttonText: '#c9786f',
      title: wickets >= 10 ? `LOST — ALL OUT ${runs}` : 'LOST — TARGET DEFENDED',
      resultLine: `Lost by ${deficitRuns + 1} run${deficitRuns + 1 !== 1 ? 's' : ''}`,
    },
    tie: {
      accent: COLOURS.gold,
      secondary: COLOURS.cream,
      overlay: 'rgba(8,8,10,0.93)',
      cardBg: '#191817',
      headerBg: 'rgba(212,160,23,0.15)',
      statsBg: 'rgba(44,62,80,0.88)',
      buttonBg: '#141311',
      buttonBorder: 'rgba(212,160,23,0.42)',
      buttonText: COLOURS.gold,
      title: 'TIED — SCORES LEVEL',
      resultLine: 'Match finishes all square',
    },
    innings: {
      accent: COLOURS.gold,
      secondary: COLOURS.gold,
      overlay: 'rgba(0,0,0,0.92)',
      cardBg: COLOURS.ink,
      headerBg: 'rgba(212,160,23,0.13)',
      statsBg: COLOURS.slate,
      buttonBg: '#151515',
      buttonBorder: 'rgba(212,160,23,0.35)',
      buttonText: COLOURS.ink,
      title: 'INNINGS COMPLETE',
      resultLine: null,
    },
  }[moodKey];

  useEffect(() => {
    let pulseLoop;
    if (visible) {
      resultPulse.setValue(1);
      if (moodKey === 'win' && !captureMode) {
        pulseLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(resultPulse, { toValue: 1.025, duration: 850, useNativeDriver: true }),
            Animated.timing(resultPulse, { toValue: 1, duration: 850, useNativeDriver: true }),
          ])
        );
        pulseLoop.start();
      }
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [captureMode, visible, moodKey, resultPulse]);

  const batTeamName  = battingSquad?.teamName  || 'Batting';
  const batFlag      = battingSquad?.flag       || '';
  const bowlTeamName = bowlingSquad?.teamName   || 'Bowling';
  const bowlFlag     = bowlingSquad?.flag       || '';

  return (
    <AnimatedMatchModal
      visible={visible}
      type="matchResult"
      overlayStyle={[styles.overlay, { backgroundColor: mood.overlay }]}
      cardStyle={[
          styles.card,
          styles[`${moodKey}Card`],
          {
            backgroundColor: mood.cardBg,
            borderColor: mood.accent,
          },
        ]}
      captureMode={captureMode}
    >

          {/* Header */}
          <View style={[styles.header, { backgroundColor: mood.headerBg }]}>
            <Animated.Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[
              styles.title,
              styles[`${moodKey}Title`],
              { color: mood.accent, transform: [{ scale: resultPulse }] },
            ]}>
              {mood.title}
            </Animated.Text>
            {mood.resultLine && (
              <Text style={[styles.resultLine, { color: mood.secondary }]}>{mood.resultLine}</Text>
            )}
            {battingSquad && bowlingSquad && (
              <Text style={styles.matchup}>
                {batFlag} {batTeamName}  vs  {bowlTeamName} {bowlFlag}
              </Text>
            )}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* Innings 2 — show both innings scorecard */}
            {isInnings2 && innings1Runs !== undefined && (
              <>
                <SectionHeader label="INNINGS 1" />
                <View style={[styles.statsBox, { backgroundColor: mood.statsBg }]}>
                  <StatRow label="RUNS"     value={`${innings1Runs}/${innings1Wickets}`} large />
                  <StatRow label="OVERS"    value={innings1Overs} />
                  <StatRow label="TARGET SET" value={target} highlight={moodKey === 'win'} />
                </View>

                <SectionHeader label="INNINGS 2" />
              </>
            )}

            {/* Current innings stats */}
            <View style={[styles.statsBox, { backgroundColor: mood.statsBg }]}>
              <StatRow label="RUNS"       value={`${runs}/${wickets}`} large />
              <StatRow label="OVERS"      value={overDisplay} />
              <StatRow label="RUN RATE"   value={runRate} />
              <StatRow label="BOUNDARIES" value={boundaries} />
              <StatRow label="SIXES"      value={sixes} />
              <StatRow label="DOT BALLS"  value={dots} />
              {target && isInnings2 && (
                <StatRow label="TARGET" value={target} highlight={chaseWon || tied} />
              )}
            </View>

            {/* Innings 1 end — set the scene for innings 2 */}
            {!isInnings2 && (
              <View style={[styles.targetBanner, { borderColor: mood.accent + '55' }]}>
                <Text style={styles.targetBannerLabel}>TARGET SET</Text>
                <Text style={styles.targetBannerValue}>{(runs || 0) + 1}</Text>
                <Text style={styles.targetBannerSub}>
                  {bowlTeamName} need {(runs || 0) + 1} to win
                </Text>
              </View>
            )}

          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {!isInnings2 && (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: mood.accent, shadowColor: mood.accent }]}
                onPress={onStartInnings2}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnText, { color: mood.buttonText }]}>START INNINGS 2 →</Text>
              </TouchableOpacity>
            )}

            {isInnings2 && onViewScorecard && (
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  styles.resultBtn,
                  { backgroundColor: mood.buttonBg, borderColor: mood.buttonBorder },
                ]}
                onPress={onViewScorecard}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnText, { color: mood.buttonText }]}>VIEW SCORECARD →</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                isInnings2 && styles.resultBtn,
                isInnings2 && { backgroundColor: mood.buttonBg, borderColor: mood.buttonBorder },
              ]}
              onPress={onNewMatch}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.secondaryBtnText,
                isInnings2 && { color: mood.buttonText },
              ]}>
                {isInnings2 ? 'NEW MATCH' : 'ABANDON MATCH'}
              </Text>
            </TouchableOpacity>
          </View>

    </AnimatedMatchModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         SPACE.lg,
  },
  card: {
    backgroundColor: COLOURS.ink,
    borderWidth:     2,
    borderRadius:    6,
    width:           '100%',
    maxWidth:        420,
    maxHeight:       '90%',
    overflow:        'hidden',
  },
  winCard: {
    shadowColor:   COLOURS.runs1,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius:  18,
    elevation:     9,
  },
  lossCard: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  14,
    elevation:     5,
  },
  tieCard: {
    shadowColor:   COLOURS.gold,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius:  14,
    elevation:     6,
  },
  header: {
    paddingVertical:   SPACE.xl,
    paddingHorizontal: SPACE.xl,
    alignItems:        'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontFamily:    FONTS.display,
    fontSize:      38,
    letterSpacing: 4,
    textAlign:     'center',
  },
  winTitle:  { fontSize: 34, letterSpacing: 3.2, textShadowColor: 'rgba(212,160,23,0.35)', textShadowRadius: 10 },
  lossTitle: { fontSize: 34, letterSpacing: 3.1 },
  tieTitle:  { fontSize: 34, letterSpacing: 3.4 },
  resultLine: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 2,
    marginTop:     SPACE.sm,
    textAlign:     'center',
  },
  matchup: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 2,
    marginTop:     SPACE.sm,
    textAlign:     'center',
  },
  scroll:        { flex: 1 },
  scrollContent: { padding: SPACE.lg },
  sectionHeader: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.md,
    letterSpacing: 3,
    color:         COLOURS.gold,
    marginBottom:  SPACE.sm,
    marginTop:     SPACE.sm,
  },
  statsBox: {
    backgroundColor:  COLOURS.slate,
    borderRadius:     4,
    padding:          SPACE.md,
    marginBottom:     SPACE.md,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.06)',
  },
  statRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.dot,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    color:         COLOURS.gold,
    letterSpacing: 1,
  },
  targetBanner: {
    backgroundColor:  'rgba(212,160,23,0.1)',
    borderWidth:      1,
    borderColor:      'rgba(212,160,23,0.3)',
    borderRadius:     4,
    padding:          SPACE.lg,
    alignItems:       'center',
    marginBottom:     SPACE.md,
  },
  targetBannerLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 3,
    marginBottom:  SPACE.xs,
  },
  targetBannerValue: {
    fontFamily:    FONTS.display,
    fontSize:      56,
    color:         COLOURS.gold,
    letterSpacing: 2,
    lineHeight:    58,
  },
  targetBannerSub: {
    fontFamily:  FONTS.mono,
    fontSize:    SIZES.xs,
    color:       COLOURS.dot,
    marginTop:   SPACE.xs,
    textAlign:   'center',
  },
  actions: {
    padding:          SPACE.lg,
    gap:              SPACE.sm,
    borderTopWidth:   1,
    borderTopColor:   'rgba(255,255,255,0.07)',
  },
  primaryBtn: {
    borderRadius:    4,
    paddingVertical: SPACE.lg,
    alignItems:      'center',
    shadowColor:     COLOURS.gold,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
    elevation:       6,
  },
  resultBtn: {
    borderWidth:     1,
    shadowColor:     '#000000',
    shadowOpacity:   0.08,
    shadowRadius:    4,
    elevation:       1,
  },
  primaryBtnText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 4,
    color:         COLOURS.ink,
  },
  secondaryBtn: {
    borderRadius:    4,
    paddingVertical: SPACE.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    letterSpacing: 3,
    color:         COLOURS.dot,
  },
});