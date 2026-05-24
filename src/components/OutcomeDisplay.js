// ─────────────────────────────────────────
//  OutcomeDisplay.js
//  "LAST BALL" panel — committed delivery only (lastOutcome).
//  Do not pass pending/provisional outcomes; dice-in-flight uses DiceRollAnimation.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { getOutcomeColour } from '../engine/diceEngine';
import { DiceValueDisplay } from './DiceValueDisplay';

export const OutcomeDisplay = ({ outcome, stats, compact = false, stagePanel = false }) => {
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

  if (compact && stagePanel) {
    if (!outcome) {
      return <View style={styles.stagePanelPlaceholder} />;
    }

    return (
      <Animated.View
        style={[styles.stagePanelRoot, { opacity: fadeAnim }]}
      >
        <View style={styles.stageTop}>
          <Text
            style={[styles.stageOutcomeLabel, { color: outcomeColour }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {outcome.label}
          </Text>
        </View>
        <View style={styles.stageMiddle}>
          <Text style={styles.stageOutcomeDetail} numberOfLines={2}>
            {outcome.detail}
          </Text>
        </View>
        <View style={styles.stageBottom}>
          <DiceValueDisplay
            value={outcome.clampedRoll}
            numberColor={COLOURS.gold}
          />
        </View>
      </Animated.View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact, styles.containerPanel]}>
        <Text style={styles.label}>LAST BALL</Text>
        <Animated.View style={[styles.panelBody, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.resultPanel, { color: outcomeColour }]} numberOfLines={1}>
            {outcome ? outcome.label : 'SELECT SHOT'}
          </Text>
          {outcome ? (
            <View style={styles.resultDieCard}>
              <Text style={styles.diceRollLabelCentered}>ROLLED</Text>
              <Text style={styles.diceValCentered}>{outcome.clampedRoll}</Text>
            </View>
          ) : (
            <Text style={styles.detailPanel} numberOfLines={2}>
              Choose a shot and roll
            </Text>
          )}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

        {outcome && (
          <View style={styles.diceBox}>
            <View style={styles.resultDieCardTablet}>
              <Text style={styles.diceRollLabelCentered}>ROLLED</Text>
              <Text style={styles.diceVal}>{outcome.clampedRoll}</Text>
            </View>
            <Text style={styles.diceLabel}>ROLL DISK {outcome.dieLabel}</Text>
          </View>
        )}
      </View>

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
  containerCompact: {
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
    padding: SPACE.sm,
    borderLeftWidth: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    width: '100%',
  },
  containerPanel: {
    alignItems: 'center',
  },
  panelBody: {
    alignItems: 'center',
    width: '100%',
  },
  resultPanel: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACE.sm,
  },
  detailPanel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    textAlign: 'center',
    lineHeight: 16,
  },
  resultDieCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.45)',
    backgroundColor: 'rgba(212,160,23,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.xs,
  },
  resultDieCardTablet: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.45)',
    backgroundColor: 'rgba(212,160,23,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.xs,
  },
  diceRollLabelCentered: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLOURS.dot,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 2,
  },
  diceValCentered: {
    fontFamily: FONTS.display,
    fontSize: 40,
    color: COLOURS.gold,
    lineHeight: 42,
    textAlign: 'center',
    includeFontPadding: false,
  },
  stagePanelPlaceholder: {
    flex: 1,
    width: '100%',
  },
  stagePanelRoot: {
    flex: 1,
    width: '100%',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  stageTop: {
    flex: 33,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACE.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  stageMiddle: {
    flex: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.xs,
  },
  stageBottom: {
    flex: 39,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACE.sm,
  },
  stageOutcomeLabel: {
    fontFamily: FONTS.display,
    fontSize: 30,
    letterSpacing: 3,
    textAlign: 'center',
    width: '100%',
  },
  stageOutcomeDetail: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
    opacity: 0.88,
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
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
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  diceVal: {
    fontFamily: FONTS.display,
    fontSize: 42,
    color: COLOURS.gold,
    lineHeight: 44,
    textAlign: 'center',
    includeFontPadding: false,
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