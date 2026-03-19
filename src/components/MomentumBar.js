// ─────────────────────────────────────────
//  MomentumBar.js
//  Visual momentum indicator — sits between
//  scoreboard and outcome display.
//  Shows current tier, label, and -10/+10 bar.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { MOMENTUM_TIERS, TIER_ORDER } from '../engine/momentumEngine';

export const MomentumBar = ({ momentum, tier }) => {
  const barAnim  = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Convert -10/+10 to 0/1 for bar width
    const normalised = (momentum + 10) / 20;

    Animated.parallel([
      Animated.timing(barAnim, {
        toValue:         normalised,
        duration:        500,
        useNativeDriver: false, // width animation needs false
      }),
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.6, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [momentum]);

  const barWidth = barAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: tier.bgColour }]}>

      {/* Top row — tier label + momentum value */}
      <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}>
        <Text style={[styles.tierLabel, { color: tier.colour }]}>
          {tier.label}
        </Text>
        <View style={styles.rightRow}>
          <Text style={styles.effectText} numberOfLines={1}>
            {tier.effect}
          </Text>
          <Text style={[styles.momentumVal, { color: tier.colour }]}>
            {momentum > 0 ? `+${momentum}` : momentum}
          </Text>
        </View>
      </Animated.View>

      {/* Progress bar track */}
      <View style={styles.track}>
        {/* Centre marker */}
        <View style={styles.centreMarker} />

        {/* Filled bar */}
        <Animated.View
          style={[
            styles.fill,
            { width: barWidth, backgroundColor: tier.colour },
          ]}
        />
      </View>

      {/* Scale labels */}
      <View style={styles.scaleRow}>
        <Text style={styles.scaleLabel}>-10</Text>
        <Text style={styles.scaleLabel}>CRUMBLING</Text>
        <Text style={styles.scaleLabelCentre}>NEUTRAL</Text>
        <Text style={styles.scaleLabel}>IN THE ZONE</Text>
        <Text style={styles.scaleLabel}>+10</Text>
      </View>

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
