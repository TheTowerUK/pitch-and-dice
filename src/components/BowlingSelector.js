// ─────────────────────────────────────────
//  BowlingSelector.js
//  Bowling variation selector — chosen every
//  ball, mirrors the ShotSelector layout.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { BOWLING_KEYS, BOWLING_VARIATIONS } from '../engine/bowlingEngine';

const BowlingBtn = ({ variationKey, selected, onPress, compact, stageLarge, disabled }) => {
  const cfg = BOWLING_VARIATIONS[variationKey];
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        compact && styles.btnCompact,
        stageLarge && styles.btnLarge,
        selected && { backgroundColor: cfg.colour, borderColor: cfg.colour },
        disabled && styles.btnDisabled,
      ]}
      onPress={() => onPress(variationKey)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.btnLabel, selected && styles.btnLabelSelected]}>
        {cfg.label}
      </Text>
      <Text style={[styles.btnShort, selected && styles.btnShortSelected, { color: selected ? COLOURS.white : cfg.colour }]}>
        {cfg.shortLabel}
      </Text>
      {!compact && (
        <Text style={[styles.btnDesc, selected && styles.btnDescSelected]} numberOfLines={1}>
          {cfg.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const BowlingSelector = ({ selectedBowling, onSelectBowling, compact = false, stageLarge = false, disabled = false }) => (
  <View style={[styles.container, compact && styles.containerCompact, stageLarge && styles.containerLarge]}>
    <Text style={[styles.sectionLabel, compact && styles.sectionLabelCompact, stageLarge && styles.sectionLabelLarge]}>BOWLING VARIATION</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {BOWLING_KEYS.map(key => (
        <BowlingBtn
          key={key}
          variationKey={key}
          selected={selectedBowling === key}
          onPress={onSelectBowling}
          compact={compact}
          stageLarge={stageLarge}
          disabled={disabled}
        />
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    marginBottom:      SPACE.md,
  },
  containerCompact: {
    paddingHorizontal: SPACE.md,
    marginBottom: SPACE.sm,
  },
  sectionLabelCompact: {
    marginBottom: 4,
    paddingBottom: 2,
    letterSpacing: 2,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  sectionLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
    marginBottom: SPACE.sm,
    paddingBottom: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  scroll: { marginHorizontal: -SPACE.xs },
  btn: {
    backgroundColor: COLOURS.slateMid,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    borderRadius:    3,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    marginRight:     SPACE.sm,
    minWidth:        90,
    maxWidth:        110,
  },
  btnCompact: {
    minWidth: 72,
    maxWidth: 88,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
  },
  btnLarge: {
    minWidth: 84,
    maxWidth: 100,
    paddingVertical: SPACE.sm,
  },
  containerLarge: {
    paddingHorizontal: SPACE.lg,
  },
  sectionLabelLarge: {
    fontSize: SIZES.sm,
  },
  btnLabel: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    letterSpacing: 2,
    color:        COLOURS.cream,
    marginBottom: 2,
  },
  btnLabelSelected: { color: COLOURS.white },
  btnShort: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    letterSpacing: 2,
    marginBottom: 2,
  },
  btnShortSelected: { color: COLOURS.white, opacity: 0.8 },
  btnDesc: {
    fontFamily: FONTS.mono,
    fontSize:   8,
    color:      COLOURS.dot,
    lineHeight: 11,
  },
  btnDescSelected: { color: COLOURS.white, opacity: 0.6 },
});
