// ─────────────────────────────────────────
//  InningsModal.js
//  Innings complete + full match result screen.
//  Innings 1: shows stats, prompts innings 2.
//  Innings 2: full win/loss result with scorecard.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  Animated, ScrollView, StyleSheet,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

const StatRow = ({ label, value, highlight, large }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[
      styles.statValue,
      highlight && { color: COLOURS.runs1 },
      large     && { fontSize: 28, letterSpacing: 2 },
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
}) => {
  const scaleAnim   = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isInnings2  = innings === 2;
  const chaseWon    = !!(target && runs >= target);
  const wicketsLeft = 10 - wickets;
  const runsMargin  = chaseWon ? runs - target : 0;
  const deficitRuns = !chaseWon && isInnings2 ? target - runs - 1 : 0;

  let title      = 'INNINGS COMPLETE';
  let accent     = COLOURS.gold;
  let resultLine = null;

  if (isInnings2) {
    if (chaseWon) {
      title      = 'MATCH WON!';
      accent     = COLOURS.runs1;
      resultLine = wickets < 10
        ? `Won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`
        : `Won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`;
    } else {
      title      = 'MATCH LOST';
      accent     = COLOURS.red;
      resultLine = `Lost by ${deficitRuns + 1} run${deficitRuns + 1 !== 1 ? 's' : ''}`;
    }
  }

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const batTeamName  = battingSquad?.teamName  || 'Batting';
  const batFlag      = battingSquad?.flag       || '';
  const bowlTeamName = bowlingSquad?.teamName   || 'Bowling';
  const bowlFlag     = bowlingSquad?.flag       || '';

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { borderColor: accent, transform: [{ scale: scaleAnim }] }]}>

          {/* Header */}
          <View style={[styles.header, { backgroundColor: accent + '22' }]}>
            <Text style={[styles.title, { color: accent }]}>{title}</Text>
            {resultLine && (
              <Text style={[styles.resultLine, { color: accent }]}>{resultLine}</Text>
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
                <View style={styles.statsBox}>
                  <StatRow label="RUNS"     value={`${innings1Runs}/${innings1Wickets}`} large />
                  <StatRow label="OVERS"    value={innings1Overs} />
                  <StatRow label="TARGET SET" value={target} highlight />
                </View>

                <SectionHeader label="INNINGS 2" />
              </>
            )}

            {/* Current innings stats */}
            <View style={styles.statsBox}>
              <StatRow label="RUNS"       value={`${runs}/${wickets}`} large />
              <StatRow label="OVERS"      value={overDisplay} />
              <StatRow label="RUN RATE"   value={runRate} />
              <StatRow label="BOUNDARIES" value={boundaries} />
              <StatRow label="SIXES"      value={sixes} />
              <StatRow label="DOT BALLS"  value={dots} />
              {target && isInnings2 && (
                <StatRow label="TARGET" value={target} highlight={chaseWon} />
              )}
            </View>

            {/* Innings 1 end — set the scene for innings 2 */}
            {!isInnings2 && (
              <View style={styles.targetBanner}>
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
                style={[styles.primaryBtn, { backgroundColor: accent }]}
                onPress={onStartInnings2}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>START INNINGS 2 →</Text>
              </TouchableOpacity>
            )}

            {isInnings2 && onViewScorecard && (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: accent }]}
                onPress={onViewScorecard}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>VIEW SCORECARD →</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                isInnings2 && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={onNewMatch}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.secondaryBtnText,
                isInnings2 && { color: COLOURS.ink },
              ]}>
                {isInnings2 ? 'NEW MATCH' : 'ABANDON MATCH'}
              </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
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
    fontSize:      52,
    color:         COLOURS.gold,
    letterSpacing: 2,
    lineHeight:    56,
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