// ─────────────────────────────────────────
//  DiceRollAnimation.js
//  Cycling number animation that slows to
//  reveal the final dice roll result.
//  1.5s dramatic build-up, then resolves.
// ─────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { playSoundForRoll } from '../engine/soundEngine';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

// ─────────────────────────────────────────
//  ANIMATION TIMING
//  Starts fast (50ms intervals) then slows
//  dramatically to final reveal
// ─────────────────────────────────────────
const INTERVALS = [
  50, 50, 55, 55, 60, 65, 70, 80,
  90, 110, 130, 160, 200, 260, 340,
];

export const DiceRollAnimation = ({
  visible,
  sides,      // D4=4, D6=6, D8=8, D10=10, D12=12
  finalRoll,  // the actual result to land on
  dieLabel,   // 'D6', 'D8' etc
  shotLabel,  // 'WORK', 'DRIVE' etc
  onComplete, // called when animation finishes
}) => {
  const [displayNum, setDisplayNum]   = useState(1);
  const [phase, setPhase]             = useState('idle'); // idle | rolling | landed
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const opacAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const stepRef     = useRef(0);

  useEffect(() => {
    if (!visible || !finalRoll || !sides) return;

    setPhase('rolling');
    playSoundForRoll(); // dice rolling sound
    stepRef.current = 0;

    // Fade in
    opacAnim.setValue(0);
    Animated.timing(opacAnim, {
      toValue: 1, duration: 150, useNativeDriver: true,
    }).start();

    const runStep = () => {
      const step = stepRef.current;

      if (step >= INTERVALS.length) {
        // Final land — show actual result
        setDisplayNum(finalRoll);
        setPhase('landed');

        // Glow pulse on landing
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,   duration: 80,  useNativeDriver: true }),
        ]).start();

        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();

        // Hold on result then complete
        setTimeout(() => {
          Animated.timing(opacAnim, {
            toValue: 0, duration: 200, useNativeDriver: true,
          }).start(() => {
            setPhase('idle');
            onComplete?.();
          });
        }, 500);

        return;
      }

      // Cycle random number (never same as finalRoll until last step)
      let rand;
      do { rand = Math.floor(Math.random() * sides) + 1; }
      while (rand === finalRoll && step < INTERVALS.length - 2);
      setDisplayNum(rand);

      // Scale flicker on each cycle
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: INTERVALS[step] * 0.3, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: INTERVALS[step] * 0.7, useNativeDriver: true }),
      ]).start();

      stepRef.current += 1;
      intervalRef.current = setTimeout(runStep, INTERVALS[step]);
    };

    runStep();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [visible, finalRoll, sides]);

  if (!visible && phase === 'idle') return null;

  const isLanded    = phase === 'landed';
  const numberColor = isLanded ? COLOURS.gold : COLOURS.cream;

  return (
    <Animated.View style={[styles.container, { opacity: opacAnim }]}>
      {/* Shot context label */}
      <Text style={styles.shotLabel}>{shotLabel}</Text>

      {/* Die container */}
      <View style={styles.dieWrapper}>
        <Animated.View style={[
          styles.dieFace,
          isLanded && styles.dieFaceLanded,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Animated.View style={[
            styles.glow,
            { opacity: glowAnim },
          ]} />
          <Text style={[styles.dieNum, { color: numberColor }]}>
            {displayNum}
          </Text>
        </Animated.View>
      </View>

      {/* Die label */}
      <Text style={[styles.dieLabel, isLanded && { color: COLOURS.gold }]}>
        {isLanded ? `ROLLED ${dieLabel}` : dieLabel}
      </Text>

      {/* Rolling indicator */}
      {!isLanded && (
        <Text style={styles.rollingText}>ROLLING...</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems:      'center',
    paddingVertical: SPACE.xl,
    marginHorizontal: SPACE.lg,
    marginBottom:    SPACE.md,
  },
  shotLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 4,
    marginBottom:  SPACE.lg,
  },
  dieWrapper: {
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACE.md,
  },
  dieFace: {
    width:           120,
    height:          120,
    borderRadius:    16,
    borderWidth:     2,
    borderColor:     COLOURS.slateMid,
    backgroundColor: COLOURS.ink,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  dieFaceLanded: {
    borderColor:     COLOURS.gold,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  glow: {
    position:        'absolute',
    inset:           0,
    backgroundColor: COLOURS.gold,
    borderRadius:    14,
  },
  dieNum: {
    fontFamily:   FONTS.display,
    fontSize:     72,
    lineHeight:   80,
    letterSpacing: 0,
  },
  dieLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 3,
    marginBottom:  SPACE.sm,
  },
  rollingText: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 4,
    opacity:       0.6,
  },
});
