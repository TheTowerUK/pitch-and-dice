// ─────────────────────────────────────────
//  RollButton.js
// ─────────────────────────────────────────

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { SHOT_CONFIG } from '../engine/diceEngine';

export const RollButton = ({
  selectedShot,
  onRoll,
  disabled,
  gameMode = 'manual',
  statusLabel = null,
  compact = false,
  stageLarge = false,
}) => {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRoll();
  };

  let label = statusLabel;
  if (!label) {
    if (gameMode === 'bowling') {
      label = 'BOWL — AI BATS';
    } else if (selectedShot) {
      label = `ROLL ${SHOT_CONFIG[selectedShot].label}`;
    } else {
      label = 'SELECT A SHOT';
    }
  }

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, stageLarge && styles.wrapperLarge]}>
      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact, stageLarge && styles.btnLarge, disabled && styles.btnDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text style={[styles.label, compact && styles.labelCompact, stageLarge && styles.labelLarge, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  wrapperCompact: {
    marginHorizontal: SPACE.md,
    marginBottom: SPACE.sm,
  },
  btn: {
    backgroundColor: COLOURS.gold,
    borderRadius: 3,
    paddingVertical: SPACE.lg,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: COLOURS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnCompact: {
    paddingVertical: SPACE.md,
  },
  wrapperLarge: {
    marginHorizontal: SPACE.lg,
  },
  btnLarge: {
    paddingVertical: SPACE.lg,
  },
  labelLarge: {
    fontSize: SIZES.xl,
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
  labelCompact: {
    fontSize: SIZES.lg,
    letterSpacing: 3,
  },
  labelDisabled: {
    color: COLOURS.dot,
  },
});
