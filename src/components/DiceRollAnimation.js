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
import { DiceValueDisplay } from './DiceValueDisplay';

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
  compact = false,
  stagePanel = false,
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

  if (!visible && phase === 'idle') {
    if (compact && stagePanel) {
      return <View style={styles.stagePanelPlaceholder} />;
    }
    return null;
  }

  const isLanded    = phase === 'landed';
  const numberColor = isLanded ? COLOURS.gold : COLOURS.cream;

  const useStagePanel = compact && stagePanel;

  if (useStagePanel) {
    return (
      <Animated.View style={[styles.containerStagePanel, { opacity: opacAnim }]}>
        <View style={styles.stageTop}>
          <Text style={styles.shotLabelStagePanel}>{shotLabel}</Text>
        </View>
        <View style={styles.stageMiddle}>
          {!isLanded && (
            <Text style={styles.rollingTextStage}>ROLLING...</Text>
          )}
        </View>
        <View style={styles.stageBottom}>
          <DiceValueDisplay
            value={displayNum}
            showRolledLabel={isLanded}
            numberColor={numberColor}
            scaleAnim={scaleAnim}
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.container,
      compact && styles.containerCompact,
      { opacity: opacAnim },
    ]}>
      <Text style={[styles.shotLabel, compact && styles.shotLabelCompact]}>
        {shotLabel}
      </Text>

      <View style={[styles.dieWrapper, compact && styles.dieWrapperCompact]}>
        <Animated.View style={[
          styles.dieFace,
          compact && styles.dieFaceCompact,
          isLanded && styles.dieFaceLanded,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Animated.View style={[
            styles.glow,
            compact && styles.glowCompact,
            { opacity: glowAnim },
          ]} />
          <View style={styles.dieNumWrap}>
            <Text style={[
              styles.dieNum,
              compact && styles.dieNumCompact,
              { color: numberColor },
            ]}>
              {displayNum}
            </Text>
          </View>
        </Animated.View>
      </View>

      <Text style={[styles.dieLabel, isLanded && { color: COLOURS.gold }]}>
        {isLanded ? `ROLLED ${dieLabel}` : dieLabel}
      </Text>
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
  containerCompact: {
    paddingVertical: SPACE.xs,
    marginHorizontal: 0,
    marginBottom: 0,
    width: '100%',
  },
  stagePanelPlaceholder: {
    flex: 1,
    width: '100%',
  },
  containerStagePanel: {
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
  },
  stageBottom: {
    flex: 39,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACE.sm,
  },
  rollingTextStage: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.gold,
    letterSpacing: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
  shotLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 4,
    marginBottom:  SPACE.lg,
  },
  shotLabelCompact: {
    marginBottom: SPACE.xs,
    letterSpacing: 2,
  },
  shotLabelStagePanel: {
    marginBottom: 0,
    letterSpacing: 3,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    opacity: 0.85,
  },
  dieWrapper: {
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACE.md,
  },
  dieWrapperCompact: {
    marginBottom: SPACE.xs,
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
  dieFaceCompact: {
    width: 88,
    height: 88,
    borderRadius: 12,
  },
  glowCompact: {
    borderRadius: 10,
  },
  dieNumWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieNumWrapStage: {
    flexDirection: 'column',
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
    fontFamily: FONTS.display,
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
  },
  dieNumCompact: {
    fontSize: 48,
    lineHeight: 48,
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
