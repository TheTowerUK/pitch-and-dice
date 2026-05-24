// ─────────────────────────────────────────
//  BatterContactFlash.js
//  Presentation-only contact flash at batter (compact field).
// ─────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLOURS } from '../constants/theme';
import { ROLE_MARKERS } from '../engine/fieldDiagramLayout';

/** Set true to restore the visible bat swing (experimental). */
export const SHOW_BAT_SWING = false;

const BATTER = ROLE_MARKERS.batter;
const BAT_HEIGHT = 14;

/** flashSize / ringSize = circle diameter (px) at contact point. */
const PROFILES = {
  single: {
    flashColor: 'rgba(39,174,96,0.44)',
    flashPeak: 0.44,
    flashScale: 1.04,
    flashMs: 180,
    flashSize: 30,
    batFrom: '-10deg',
    batTo: '100deg',
    batMs: 140,
    batOpacity: 0.35,
  },
  multi: {
    flashColor: 'rgba(39,174,96,0.5)',
    flashPeak: 0.52,
    flashScale: 1.1,
    flashMs: 195,
    flashSize: 38,
    batFrom: '-10deg',
    batTo: '100deg',
    batMs: 140,
    batOpacity: 0.35,
  },
  boundary: {
    flashColor: 'rgba(212,160,23,0.58)',
    flashPeak: 0.58,
    flashScale: 1.14,
    flashMs: 215,
    flashSize: 50,
    batFrom: '-14deg',
    batTo: '112deg',
    batMs: 160,
    batOpacity: 0.4,
  },
  max: {
    flashColor: 'rgba(231,76,60,0.62)',
    flashPeak: 0.64,
    flashScale: 1.18,
    flashMs: 240,
    flashSize: 64,
    batFrom: '-18deg',
    batTo: '122deg',
    batMs: 175,
    batOpacity: 0.45,
  },
  wicket: {
    flashColor: 'rgba(192,57,43,0.32)',
    flashPeak: 0.38,
    flashScale: 1.06,
    flashMs: 260,
    flashSize: 20,
    ringSize: 60,
    showRing: true,
    batFrom: '-6deg',
    batTo: '52deg',
    batMs: 110,
    batOpacity: 0.3,
  },
};

/**
 * @returns {'single'|'multi'|'boundary'|'max'|'wicket'|null}
 */
export const getContactFlashKind = (outcome) => {
  if (!outcome) return null;
  if (outcome.type === 'wicket') return 'wicket';
  if (outcome.type === 'six' || outcome.runs === 6) return 'max';
  if (outcome.type === 'four' || outcome.runs === 4) return 'boundary';
  const runs = outcome.runs ?? 0;
  if (runs >= 2) return 'multi';
  if (runs === 1) return 'single';
  return null;
};

export const BatterContactFlash = ({ outcome, triggerKey }) => {
  const flashOpac = useRef(new Animated.Value(0)).current;
  const flashScale = useRef(new Animated.Value(0.5)).current;
  const batRotate = useRef(new Animated.Value(0)).current;
  const batOpac = useRef(new Animated.Value(0)).current;
  const skipFirstRef = useRef(true);
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (triggerKey == null) return;
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      lastKeyRef.current = triggerKey;
      return;
    }
    if (lastKeyRef.current === triggerKey) return;
    lastKeyRef.current = triggerKey;

    const kind = getContactFlashKind(outcome);
    if (!kind) return;

    const profile = PROFILES[kind];
    const fadeInMs = 45;
    const fadeOutMs = profile.flashMs - fadeInMs;

    flashOpac.setValue(0);
    flashScale.setValue(0.5);
    batOpac.setValue(0);
    batRotate.setValue(0);

    const flashPulse = Animated.parallel([
      Animated.sequence([
        Animated.timing(flashOpac, {
          toValue: profile.flashPeak,
          duration: fadeInMs,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpac, {
          toValue: 0,
          duration: fadeOutMs,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(flashScale, {
          toValue: profile.flashScale,
          duration: fadeInMs,
          useNativeDriver: true,
        }),
        Animated.timing(flashScale, {
          toValue: profile.flashScale * 0.9,
          duration: fadeOutMs,
          useNativeDriver: true,
        }),
      ]),
    ]);

    if (!SHOW_BAT_SWING) {
      flashPulse.start();
      return;
    }

    const batSwing = Animated.sequence([
      Animated.timing(batOpac, {
        toValue: profile.batOpacity,
        duration: 35,
        useNativeDriver: true,
      }),
      Animated.timing(batRotate, {
        toValue: 1,
        duration: profile.batMs,
        useNativeDriver: true,
      }),
      Animated.timing(batOpac, {
        toValue: 0,
        duration: Math.max(50, profile.batMs - 30),
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([batSwing, flashPulse]).start();
  }, [triggerKey, outcome, flashOpac, flashScale, batRotate, batOpac]);

  const kind = getContactFlashKind(outcome);
  const profile = kind ? PROFILES[kind] : PROFILES.single;
  const flashRadius = profile.flashSize / 2;
  const ringRadius = (profile.ringSize ?? profile.flashSize) / 2;

  const batRotation = batRotate.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.batFrom, profile.batTo],
  });

  return (
    <View style={styles.layer} pointerEvents="none">
      <View
        style={[
          styles.anchor,
          { left: `${BATTER.x}%`, top: `${BATTER.y}%` },
        ]}
      >
        {!profile.showRing && (
          <Animated.View
            style={[
              styles.flash,
              {
                width: profile.flashSize,
                height: profile.flashSize,
                borderRadius: flashRadius,
                marginLeft: -flashRadius,
                backgroundColor: profile.flashColor,
                opacity: flashOpac,
                transform: [{ scale: flashScale }],
              },
            ]}
          />
        )}
        {SHOW_BAT_SWING && (
          <Animated.View
            style={[
              styles.bat,
              {
                opacity: batOpac,
                transform: [
                  { translateY: BAT_HEIGHT / 2 },
                  { rotate: batRotation },
                  { translateY: -BAT_HEIGHT / 2 },
                ],
              },
            ]}
          />
        )}
        {profile.showRing && (
          <Animated.View
            style={[
              styles.wicketRing,
              {
                width: profile.ringSize,
                height: profile.ringSize,
                borderRadius: ringRadius,
                marginLeft: -ringRadius,
                opacity: flashOpac,
                transform: [{ scale: flashScale }],
              },
            ]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 10,
  },
  anchor: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    marginTop: 2,
  },
  wicketRing: {
    position: 'absolute',
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: COLOURS.red,
    backgroundColor: 'transparent',
  },
  bat: {
    position: 'absolute',
    bottom: 0,
    left: -1.5,
    width: 3,
    height: BAT_HEIGHT,
    borderRadius: 1,
    backgroundColor: COLOURS.cream,
  },
});
