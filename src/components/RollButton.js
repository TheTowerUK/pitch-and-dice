// ─────────────────────────────────────────
//  RollButton.js
// ─────────────────────────────────────────

import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { SHOT_CONFIG } from '../engine/diceEngine';

export const RollButton = ({ selectedShot, onRoll, disabled, gameMode = 'manual' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onRoll();
  };

  let label;
  if (gameMode === 'bowling') {
    label = 'BOWL — AI BATS';
  } else if (selectedShot) {
    label = `ROLL ${SHOT_CONFIG[selectedShot].label}`;
  } else {
    label = 'SELECT A SHOT';
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.wrapper]}>
      <TouchableOpacity
        style={[styles.btn, disabled && styles.btnDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  btn: {
    backgroundColor: COLOURS.gold,
    borderRadius: 3,
    paddingVertical: SPACE.lg,
    alignItems: 'center',
    shadowColor: COLOURS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: {
    backgroundColor: COLOURS.slateMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xl,
    letterSpacing: 5,
    color: COLOURS.ink,
  },
  labelDisabled: {
    color: COLOURS.dot,
  },
});
