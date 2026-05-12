// ─────────────────────────────────────────
//  ShotSelector.js
//  5 shot type buttons + 3 aggression buttons
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { SHOT_KEYS, SHOT_CONFIG, AGGRESSION_KEYS, AGGRESSION_CONFIG } from '../engine/diceEngine';

const AGGRESSION_TONES = {
  conservative: {
    activeBg: '#34495e',
    activeBorder: '#6f879d',
    activeText: '#dce7ef',
    glow: '#6f879d',
    subtext: 'SAFE PLAY',
  },
  balanced: {
    activeBg: '#1f5f3b',
    activeBorder: '#35b873',
    activeText: '#f4fff8',
    glow: COLOURS.runs1,
    subtext: 'STANDARD RISK',
  },
  aggressive: {
    activeBg: '#74311f',
    activeBorder: '#e86d3d',
    activeText: '#fff3ec',
    glow: COLOURS.boundary,
    subtext: 'BOUNDARY HUNT',
  },
};

// ── Shot Button ──────────────────────────
const ShotBtn = ({ shotKey, selected, onPress }) => {
  const cfg = SHOT_CONFIG[shotKey];

  return (
    <TouchableOpacity
      style={[styles.shotBtn, selected && styles.shotBtnSelected]}
      onPress={() => onPress(shotKey)}
      activeOpacity={0.75}
    >
      <Text style={[styles.shotName, selected && styles.shotNameSelected]}>
        {cfg.display}
      </Text>
      <Text style={[styles.shotDie, selected && styles.shotDieSelected]}>
        {cfg.label}
      </Text>
      <Text style={[styles.shotRisk, selected && styles.shotRiskSelected]}>
        {cfg.risk}
      </Text>
    </TouchableOpacity>
  );
};

// ── Aggression Button ────────────────────
const AggBtn = ({ aggKey, selected, onPress }) => {
  const cfg = AGGRESSION_CONFIG[aggKey];
  const tone = AGGRESSION_TONES[aggKey] || AGGRESSION_TONES.balanced;

  return (
    <TouchableOpacity
      style={[
        styles.aggBtn,
        selected && {
          backgroundColor: tone.activeBg,
          borderColor: tone.activeBorder,
        },
      ]}
      onPress={() => onPress(aggKey)}
      activeOpacity={0.75}
    >
      <Text style={[styles.aggText, selected && { color: tone.activeText }]}>
        {cfg.label}
      </Text>
      <Text style={[styles.aggSubtext, selected && { color: tone.activeText, opacity: 0.86 }]}>
        {tone.subtext}
      </Text>
    </TouchableOpacity>
  );
};

// ── Main Component ───────────────────────
export const ShotSelector = ({
  selectedShot, selectedAggression,
  onSelectShot, onSelectAggression,
}) => {
  return (
    <View style={styles.container}>

      {/* Shot Types */}
      <Text style={styles.sectionLabel}>CHOOSE YOUR SHOT</Text>
      <View style={styles.shotRow}>
        {SHOT_KEYS.map(key => (
          <ShotBtn
            key={key}
            shotKey={key}
            selected={selectedShot === key}
            onPress={onSelectShot}
          />
        ))}
      </View>

      {/* Aggression */}
      <Text style={[styles.sectionLabel, { marginTop: SPACE.md }]}>AGGRESSION</Text>
      <View style={styles.aggRow}>
        {AGGRESSION_KEYS.map(key => (
          <AggBtn
            key={key}
            aggKey={key}
            selected={selectedAggression === key}
            onPress={onSelectAggression}
          />
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 3,
    marginBottom: SPACE.sm,
    paddingBottom: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },

  // Shot buttons
  shotRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  shotBtn: {
    flex: 1,
    backgroundColor: COLOURS.slateMid,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    paddingVertical: SPACE.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: COLOURS.gold,
    shadowOffset: { width: 0, height: 3 },
  },
  shotBtnSelected: {
    backgroundColor: COLOURS.gold,
    borderColor: COLOURS.goldLight,
  },
  shotName: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    letterSpacing: 1,
    color: COLOURS.cream,
    marginBottom: 2,
  },
  shotNameSelected: { color: COLOURS.ink },
  shotDie: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.gold,
    letterSpacing: 1,
  },
  shotDieSelected: { color: COLOURS.ink, opacity: 0.72 },
  shotRisk: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLOURS.dot,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  shotRiskSelected: { color: COLOURS.ink, opacity: 0.62 },

  // Aggression buttons
  aggRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  aggBtn: {
    flex: 1,
    backgroundColor: COLOURS.slateMid,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
  },
  aggText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.sm,
    letterSpacing: 1,
    color: COLOURS.cream,
  },
  aggSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    marginTop: 3,
  },
});
