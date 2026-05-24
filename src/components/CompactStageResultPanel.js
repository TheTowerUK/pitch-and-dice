// ─────────────────────────────────────────
//  CompactStageResultPanel.js
//  Unified right-side broadcast panel: one DiceValueDisplay
//  for rolling and committed result (no layer swap).
// ─────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { playSoundForRoll } from '../engine/soundEngine';
import { getOutcomeColour } from '../engine/diceEngine';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { DiceValueDisplay, resolveStageDiceValue } from './DiceValueDisplay';

const INTERVALS = [
  50, 50, 55, 55, 60, 65, 70, 80,
  90, 110, 130, 160, 200, 260, 340,
];

const LAND_HOLD_MS = 500;

const PRE_ROLL_WIDTH_THRESHOLD = 400;

const resetScale = (scaleAnim) => {
  scaleAnim.stopAnimation();
  scaleAnim.setValue(1);
};

const fadeHeadlineIn = (headlineFade) => {
  headlineFade.stopAnimation();
  Animated.timing(headlineFade, {
    toValue: 1,
    duration: 280,
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (finished) headlineFade.setValue(1);
  });
};

export const CompactStageResultPanel = ({
  isRolling,
  pendingOutcome,
  lastOutcome,
  shotLabel = 'WORK',
  onRollComplete,
  captureMode = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [panelWidth, setPanelWidth] = useState(0);
  const [displayNum, setDisplayNum] = useState(null);
  const [rollPhase, setRollPhase] = useState('idle'); // idle | rolling | landed
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const headlineFade = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const stepRef = useRef(0);
  const completeTimerRef = useRef(null);
  const onCompleteRef = useRef(onRollComplete);
  onCompleteRef.current = onRollComplete;

  const sides = pendingOutcome?.effectiveSides || 6;
  const finalRoll = pendingOutcome?.clampedRoll ?? 1;

  const diceValue = resolveStageDiceValue(displayNum, lastOutcome);

  useEffect(() => {
    if (captureMode || !lastOutcome || isRolling) {
      headlineFade.setValue(1);
      return;
    }
    headlineFade.setValue(0);
    fadeHeadlineIn(headlineFade);
  }, [captureMode, lastOutcome, isRolling, headlineFade]);

  useEffect(() => {
    if (isRolling) return;
    resetScale(scaleAnim);
    if (!captureMode || !lastOutcome) {
      headlineFade.setValue(1);
    }
  }, [isRolling, captureMode, lastOutcome, scaleAnim, headlineFade]);

  useEffect(() => {
    if (!isRolling || !pendingOutcome) {
      return undefined;
    }

    setRollPhase('rolling');
    setDisplayNum(1);
    resetScale(scaleAnim);
    playSoundForRoll();
    stepRef.current = 0;

    const clearTimers = () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    };

    const runStep = () => {
      const step = stepRef.current;

      if (step >= INTERVALS.length) {
        setDisplayNum(finalRoll);
        setRollPhase('landed');

        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(({ finished }) => {
          if (finished) scaleAnim.setValue(1);
        });

        completeTimerRef.current = setTimeout(() => {
          resetScale(scaleAnim);
          setRollPhase('idle');
          onCompleteRef.current?.();
        }, LAND_HOLD_MS);

        return;
      }

      let rand;
      do {
        rand = Math.floor(Math.random() * sides) + 1;
      } while (rand === finalRoll && step < INTERVALS.length - 2);
      setDisplayNum(rand);

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: INTERVALS[step] * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: INTERVALS[step] * 0.7,
          useNativeDriver: true,
        }),
      ]).start();

      stepRef.current += 1;
      intervalRef.current = setTimeout(runStep, INTERVALS[step]);
    };

    runStep();

    return () => {
      clearTimers();
      resetScale(scaleAnim);
    };
  }, [isRolling, pendingOutcome, finalRoll, sides, scaleAnim]);

  const showRolledLabel = rollPhase !== 'rolling';
  const numberColor = isRolling && rollPhase === 'rolling' ? COLOURS.cream : COLOURS.gold;
  const outcomeColour = lastOutcome ? getOutcomeColour(lastOutcome) : COLOURS.cream;

  const measuredWidth = panelWidth > 0 ? panelWidth : windowWidth;
  const compactPreRoll = measuredWidth < PRE_ROLL_WIDTH_THRESHOLD;
  const preRollTitle = compactPreRoll ? 'READY' : 'READY TO ROLL';
  const preRollBody = compactPreRoll
    ? 'Set your tactic and roll.'
    : 'Set your tactic and roll the dice.';

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth !== panelWidth) setPanelWidth(nextWidth);
      }}
    >
      <Animated.View style={[styles.stageTop, { opacity: headlineFade }]}>
        {isRolling ? (
          <Text style={styles.shotLabel}>{shotLabel}</Text>
        ) : lastOutcome ? (
          <Text
            style={[styles.outcomeLabel, { color: outcomeColour }]}
            numberOfLines={1}
          >
            {lastOutcome.label}
          </Text>
        ) : (
          <Text style={styles.preRollTitle} numberOfLines={1}>
            {preRollTitle}
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.stageMiddle, { opacity: headlineFade }]}>
        {isRolling && rollPhase !== 'landed' ? (
          <Text style={styles.rollingText}>ROLLING...</Text>
        ) : lastOutcome ? (
          <Text style={styles.outcomeDetail} numberOfLines={2}>
            {lastOutcome.detail}
          </Text>
        ) : (
          <Text style={styles.preRollBody} numberOfLines={2}>
            {preRollBody}
          </Text>
        )}
      </Animated.View>

      <View style={styles.stageBottom}>
        <DiceValueDisplay
          value={diceValue}
          showRolledLabel={showRolledLabel}
          numberColor={numberColor}
          scaleAnim={scaleAnim}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
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
  shotLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 3,
    opacity: 0.85,
    textAlign: 'center',
  },
  preRollTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLOURS.gold,
    letterSpacing: 3,
    textAlign: 'center',
    width: '100%',
  },
  preRollBody: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
    paddingHorizontal: SPACE.xs,
  },
  outcomeLabel: {
    fontFamily: FONTS.display,
    fontSize: 30,
    letterSpacing: 3,
    textAlign: 'center',
    width: '100%',
  },
  outcomeDetail: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
    opacity: 0.88,
    textAlign: 'center',
    lineHeight: 18,
    width: '100%',
  },
  rollingText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.gold,
    letterSpacing: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
});
