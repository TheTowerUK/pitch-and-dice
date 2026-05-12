// ─────────────────────────────────────────
//  OutcomeDisplay.js
//  "LAST BALL" panel — committed delivery only (lastOutcome).
//  Do not pass pending/provisional outcomes; dice-in-flight uses DiceRollAnimation.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { getOutcomeColour } from '../engine/diceEngine';

export const OutcomeDisplay = ({ outcome, stats }) => {
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!outcome) return;
    // Reset and animate in
    fadeAnim.setValue(0);
    slideAnim.setValue(8);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [outcome]);

  const outcomeColour = outcome ? getOutcomeColour(outcome) : COLOURS.cream;

  return (
    <View style={styles.container}>
      {/* Top row — outcome text + dice side by side */}
      <View style={styles.topRow}>
        <View style={styles.left}>
          <Text style={styles.label}>LAST BALL</Text>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.result, { color: outcomeColour }]}>
              {outcome ? outcome.label : 'SELECT SHOT'}
            </Text>
            <Text style={styles.detail} numberOfLines={2}>
              {outcome ? outcome.detail : 'Choose a shot type and roll'}
            </Text>
          </Animated.View>
        </View>

        {/* Right — dice value */}
        {outcome && (
          <View style={styles.diceBox}>
            <Text style={styles.diceRollLabel}>ROLLED</Text>
            <Text style={styles.diceVal}>{outcome.clampedRoll}</Text>
            <Text style={styles.diceLabel}>ROLL DISK {outcome.dieLabel}</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatChip label="BALLS"  value={stats.balls} />
        <StatChip label="4s"     value={stats.boundaries} />
        <StatChip label="6s"     value={stats.sixes} />
        <StatChip label="DOTS"   value={stats.dots} />
      </View>
    </View>
  );
};

const StatChip = ({ label, value }) => (
  <View style={styles.statChip}>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLOURS.ink,
    borderLeftWidth: 4,
    borderLeftColor: COLOURS.gold,
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.lg,
    marginBottom: SPACE.md,
    padding: SPACE.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginBottom:  SPACE.md,
  },
  left: {
    flex:          1,
    paddingRight:  SPACE.md,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: 'rgba(245,240,232,0.72)',
    letterSpacing: 3,
    marginBottom: SPACE.xs,
  },
  result: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xxl,
    letterSpacing: 3,
    marginBottom: 2,
  },
  detail: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.gold,
    lineHeight: 18,
  },
  diceBox: {
    alignItems:  'center',
    justifyContent: 'flex-start',
    paddingTop:  2,
    minWidth:    80,
  },
  diceRollLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 3,
    marginBottom:  2,
  },
  diceVal: {
    fontFamily: FONTS.display,
    fontSize:   42,
    color:      COLOURS.gold,
    lineHeight: 44,
  },
  diceLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginTop: SPACE.sm,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLOURS.slateMid,
    borderRadius: 3,
    padding: SPACE.sm,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xl,
    color: COLOURS.cream,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLOURS.dot,
    letterSpacing: 2,
    marginTop: 1,
  },
});