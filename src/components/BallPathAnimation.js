// ─────────────────────────────────────────
//  BallPathAnimation.js
//  Presentation-only ball path overlay (compact field).
// ─────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLOURS } from '../constants/theme';
import {
  BALL_DELIVERY_LEG_RATIO,
  getBallPathDuration,
  getBallPathPoints,
} from '../engine/deliveryVisualMap';

/** Set false to disable ball path overlay quickly. */
export const SHOW_BALL_PATH = false;

const BALL_SIZE = 5;
const BALL_RADIUS = BALL_SIZE / 2;
const TRAIL_SIZE = 9;
const TRAIL_RADIUS = TRAIL_SIZE / 2;

const pct = (n) => `${n}%`;

export const BallPathAnimation = ({ selectedShot, outcome, triggerKey }) => {
  const pathT = useRef(new Animated.Value(0)).current;
  const ballOpac = useRef(new Animated.Value(0)).current;
  const skipFirstRef = useRef(true);
  const lastKeyRef = useRef(null);

  const points = getBallPathPoints(selectedShot, outcome);

  useEffect(() => {
    if (!SHOW_BALL_PATH || triggerKey == null) return;

    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      lastKeyRef.current = triggerKey;
      return;
    }
    if (lastKeyRef.current === triggerKey) return;
    lastKeyRef.current = triggerKey;

    const pathPoints = getBallPathPoints(selectedShot, outcome);
    if (!pathPoints) return;

    const duration = getBallPathDuration(outcome);
    const fadeMs = Math.min(90, Math.round(duration * 0.22));

    pathT.stopAnimation();
    ballOpac.stopAnimation();
    pathT.setValue(0);
    ballOpac.setValue(0);

    Animated.sequence([
      Animated.timing(ballOpac, {
        toValue: 1,
        duration: 35,
        useNativeDriver: false,
      }),
      Animated.timing(pathT, {
        toValue: 1,
        duration: duration - fadeMs,
        useNativeDriver: false,
      }),
      Animated.timing(ballOpac, {
        toValue: 0,
        duration: fadeMs,
        useNativeDriver: false,
      }),
    ]).start();
  }, [triggerKey, selectedShot, outcome, pathT, ballOpac]);

  if (!SHOW_BALL_PATH || !points) {
    return null;
  }

  const { from, contact, to } = points;
  const split = BALL_DELIVERY_LEG_RATIO;

  const ballX = pathT.interpolate({
    inputRange: [0, split, 1],
    outputRange: [from.x, contact.x, to.x],
    extrapolate: 'clamp',
  });
  const ballY = pathT.interpolate({
    inputRange: [0, split, 1],
    outputRange: [from.y, contact.y, to.y],
    extrapolate: 'clamp',
  });

  const trailX = pathT.interpolate({
    inputRange: [0, split, 1],
    outputRange: [
      from.x + (contact.x - from.x) * 0.12,
      contact.x,
      to.x + (contact.x - to.x) * 0.08,
    ],
    extrapolate: 'clamp',
  });
  const trailY = pathT.interpolate({
    inputRange: [0, split, 1],
    outputRange: [
      from.y + (contact.y - from.y) * 0.12,
      contact.y,
      to.y + (contact.y - to.y) * 0.08,
    ],
    extrapolate: 'clamp',
  });

  const ballLeft = ballX.interpolate({
    inputRange: [0, 100],
    outputRange: [pct(0), pct(100)],
  });
  const ballTop = ballY.interpolate({
    inputRange: [0, 100],
    outputRange: [pct(0), pct(100)],
  });
  const trailLeft = trailX.interpolate({
    inputRange: [0, 100],
    outputRange: [pct(0), pct(100)],
  });
  const trailTop = trailY.interpolate({
    inputRange: [0, 100],
    outputRange: [pct(0), pct(100)],
  });
  const trailOpac = ballOpac.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  return (
    <View style={styles.layer} pointerEvents="none">
      <Animated.View
        style={[
          styles.trail,
          {
            opacity: trailOpac,
            left: trailLeft,
            top: trailTop,
            marginLeft: -TRAIL_RADIUS,
            marginTop: -TRAIL_RADIUS,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ball,
          {
            opacity: ballOpac,
            left: ballLeft,
            top: ballTop,
            marginLeft: -BALL_RADIUS,
            marginTop: -BALL_RADIUS,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
    elevation: 8,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_RADIUS,
    backgroundColor: COLOURS.cream,
    borderWidth: 0.5,
    borderColor: COLOURS.gold,
  },
  trail: {
    position: 'absolute',
    width: TRAIL_SIZE,
    height: TRAIL_SIZE,
    borderRadius: TRAIL_RADIUS,
    backgroundColor: 'rgba(245,240,232,0.35)',
  },
});
