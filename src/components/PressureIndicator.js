// ─────────────────────────────────────────
//  PressureIndicator.js
//  Shows required run rate and pressure tier
//  during a chase. Hidden in innings 1.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export const PressureIndicator = ({ rrr, pressureTier, target, runs, ballsRemaining }) => {
  if (!pressureTier || !target) return null;

  const runsNeeded   = Math.max(0, target - runs);
  const oversLeft    = (ballsRemaining / 6).toFixed(1);
  const isComfort    = pressureTier.key === 'comfortable';

  return (
    <View style={[styles.container, { borderLeftColor: pressureTier.colour }]}>
      <View style={styles.left}>
        <Text style={styles.label}>REQUIRED</Text>
        <Text style={[styles.rrr, { color: pressureTier.colour }]}>
          {rrr > 0 ? rrr.toFixed(1) : '—'}
        </Text>
        <Text style={styles.unit}>per over</Text>
      </View>

      <View style={styles.centre}>
        <Text style={[styles.tierLabel, { color: pressureTier.colour }]}>
          {pressureTier.label}
        </Text>
        <Text style={styles.desc}>{pressureTier.description}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.label}>NEED</Text>
        <Text style={[styles.runsNeeded, { color: pressureTier.colour }]}>
          {runsNeeded}
        </Text>
        <Text style={styles.unit}>{oversLeft} ov left</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLOURS.ink,
    borderLeftWidth: 4,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: SPACE.md,
  },
  left:   { alignItems: 'center', minWidth: 56 },
  centre: { flex: 1, alignItems: 'center' },
  right:  { alignItems: 'center', minWidth: 56 },
  label: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
    marginBottom: 2,
  },
  rrr: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xxl,
    letterSpacing: 1,
    lineHeight:   30,
  },
  runsNeeded: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xxl,
    letterSpacing: 1,
    lineHeight:   30,
  },
  unit: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  1,
  },
  tierLabel: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 3,
    marginBottom: 2,
  },
  desc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    textAlign:  'center',
    lineHeight: 14,
  },
});
