// ─────────────────────────────────────────
//  BowlingSelector.js
//  Bowling variation selector — chosen every
//  ball, mirrors the ShotSelector layout.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { BOWLING_KEYS, BOWLING_VARIATIONS } from '../engine/bowlingEngine';

const BowlingBtn = ({ variationKey, selected, onPress }) => {
  const cfg = BOWLING_VARIATIONS[variationKey];
  return (
    <TouchableOpacity
      style={[styles.btn, selected && { backgroundColor: cfg.colour, borderColor: cfg.colour }]}
      onPress={() => onPress(variationKey)}
      activeOpacity={0.7}
    >
      <Text style={[styles.btnLabel, selected && styles.btnLabelSelected]}>
        {cfg.label}
      </Text>
      <Text style={[styles.btnShort, selected && styles.btnShortSelected, { color: selected ? COLOURS.white : cfg.colour }]}>
        {cfg.shortLabel}
      </Text>
      <Text style={[styles.btnDesc, selected && styles.btnDescSelected]} numberOfLines={1}>
        {cfg.description}
      </Text>
    </TouchableOpacity>
  );
};

export const BowlingSelector = ({ selectedBowling, onSelectBowling }) => (
  <View style={styles.container}>
    <Text style={styles.sectionLabel}>BOWLING VARIATION</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {BOWLING_KEYS.map(key => (
        <BowlingBtn
          key={key}
          variationKey={key}
          selected={selectedBowling === key}
          onPress={onSelectBowling}
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
