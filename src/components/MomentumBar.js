// ─────────────────────────────────────────
//  MomentumBar.js
//  Visual momentum indicator — sits between
//  scoreboard and outcome display.
//  Shows current tier, label, and -10/+10 bar.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export const MomentumBar = ({ momentum, tier, pressureTier, compact = false, stageLarge = false }) => {
  const normalised = Math.max(0, Math.min(1, (momentum + 10) / 20));
  const fillWidth = `${Math.round(normalised * 100)}%`;
  const pressureGlow = ['tense', 'desperate', 'impossible'].includes(pressureTier?.key);

  return (
    <View style={[styles.container, compact && styles.containerCompact, stageLarge && styles.containerLarge, { backgroundColor: tier.bgColour }]}>

      {/* Top row — tier label + momentum value */}
      <View style={[styles.topRow, compact && styles.topRowCompact, stageLarge && styles.topRowLarge]}>
        <Text style={[styles.tierLabel, compact && styles.tierLabelCompact, stageLarge && styles.tierLabelLarge, { color: tier.colour }]}>
          {tier.label}
        </Text>
        <View style={styles.rightRow}>
          {!compact && (
            <Text style={styles.effectText} numberOfLines={1}>
              {tier.effect}
            </Text>
          )}
          <Text style={[styles.momentumVal, compact && styles.momentumValCompact, stageLarge && styles.momentumValLarge, { color: tier.colour }]}>
            {momentum > 0 ? `+${momentum}` : momentum}
          </Text>
        </View>
      </View>

      {/* Progress bar track */}
      <View style={[styles.trackShell, pressureGlow && styles.pressureTrackGlow]}>
        <View style={styles.track}>
          {/* Centre marker */}
          <View style={styles.centreMarker} />

          {/* Filled bar */}
          <View
            style={[
              styles.fill,
              { width: fillWidth, backgroundColor: tier.colour },
            ]}
          />
        </View>
      </View>

      {/* Scale labels */}
      {!compact && (
        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>-10</Text>
          <Text style={styles.scaleLabel}>CRUMBLING</Text>
          <Text style={styles.scaleLabelCentre}>NEUTRAL</Text>
          <Text style={styles.scaleLabel}>IN THE ZONE</Text>
          <Text style={styles.scaleLabel}>+10</Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  containerCompact: {
    paddingVertical: SPACE.xs,
  },
  containerLarge: {
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.sm,
  },
  topRowLarge: {
    marginBottom: SPACE.xs,
  },
  tierLabelLarge: {
    fontSize: SIZES.xl,
  },
  momentumValLarge: {
    fontSize: 28,
    minWidth: 36,
  },
  topRowCompact: {
    marginBottom: 2,
  },
  tierLabelCompact: {
    fontSize: SIZES.md,
    letterSpacing: 2,
  },
  momentumValCompact: {
    fontSize: SIZES.lg,
    minWidth: 28,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACE.xs,
  },
  tierLabel: {
    fontFamily:  FONTS.display,
    fontSize:    SIZES.lg,
    letterSpacing: 3,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACE.md,
    flex:          1,
    justifyContent: 'flex-end',
  },
  effectText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    letterSpacing: 1,
    flex:       1,
    textAlign:  'right',
  },
  momentumVal: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xxl,
    letterSpacing: 2,
    minWidth:     40,
    textAlign:    'right',
  },

  // Bar
  trackShell: {
    borderRadius: 5,
  },
  pressureTrackGlow: {
    borderWidth:    1,
    borderColor:    'rgba(230,126,34,0.36)',
    shadowColor:    COLOURS.boundary,
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.24,
    shadowRadius:   8,
    elevation:      3,
  },
  track: {
    height:          8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius:    4,
    overflow:        'hidden',
    position:        'relative',
  },
  fill: {
    position:     'absolute',
    left:         0,
    top:          0,
    bottom:       0,
    borderRadius: 4,
  },
  centreMarker: {
    position:        'absolute',
    left:            '50%',
    top:             0,
    bottom:          0,
    width:           2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex:          2,
  },

  // Scale
  scaleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      3,
  },
  scaleLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     8,
    color:        COLOURS.dot,
    letterSpacing: 1,
  },
  scaleLabelCentre: {
    fontFamily:   FONTS.mono,
    fontSize:     8,
    color:        COLOURS.dot,
    letterSpacing: 1,
  },
});
