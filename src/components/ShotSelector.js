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
const ShotBtn = ({ shotKey, selected, onPress, compact, stageLarge, disabled }) => {
  const cfg = SHOT_CONFIG[shotKey];

  return (
    <TouchableOpacity
      style={[
        styles.shotBtn,
        compact && styles.shotBtnCompact,
        stageLarge && styles.shotBtnLarge,
        selected && styles.shotBtnSelected,
        disabled && styles.btnDisabled,
      ]}
      onPress={() => onPress(shotKey)}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <Text style={[styles.shotName, compact && styles.shotNameCompact, stageLarge && styles.shotNameLarge, selected && styles.shotNameSelected]}>
        {cfg.display}
      </Text>
      <Text style={[styles.shotDie, compact && styles.shotDieCompact, selected && styles.shotDieSelected]}>
        {cfg.label}
      </Text>
      {!compact && (
        <Text style={[styles.shotRisk, selected && styles.shotRiskSelected]}>
          {cfg.risk}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ── Aggression Button ────────────────────
const AggBtn = ({ aggKey, selected, onPress, compact, stageLarge, disabled }) => {
  const cfg = AGGRESSION_CONFIG[aggKey];
  const tone = AGGRESSION_TONES[aggKey] || AGGRESSION_TONES.balanced;

  return (
    <TouchableOpacity
      style={[
        styles.aggBtn,
        compact && styles.aggBtnCompact,
        stageLarge && styles.aggBtnLarge,
        selected && {
          backgroundColor: tone.activeBg,
          borderColor: tone.activeBorder,
        },
        disabled && styles.btnDisabled,
      ]}
      onPress={() => onPress(aggKey)}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <Text style={[styles.aggText, compact && styles.aggTextCompact, selected && { color: tone.activeText }]}>
        {cfg.label}
      </Text>
      {!compact && (
        <Text style={[styles.aggSubtext, selected && { color: tone.activeText, opacity: 0.86 }]}>
          {tone.subtext}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ── Main Component ───────────────────────
export const ShotSelector = ({
  selectedShot, selectedAggression,
  onSelectShot, onSelectAggression,
  compact = false,
  stageLarge = false,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact, stageLarge && styles.containerLarge]}>

      {/* Shot Types */}
      <Text style={[styles.sectionLabel, compact && styles.sectionLabelCompact, stageLarge && styles.sectionLabelLarge]}>CHOOSE YOUR SHOT</Text>
      <View style={styles.shotRow}>
        {SHOT_KEYS.map(key => (
          <ShotBtn
            key={key}
            shotKey={key}
            selected={selectedShot === key}
            onPress={onSelectShot}
            compact={compact}
            stageLarge={stageLarge}
            disabled={disabled}
          />
        ))}
      </View>

      {/* Aggression */}
      <Text style={[styles.sectionLabel, compact && styles.sectionLabelCompact, stageLarge && styles.sectionLabelLarge, { marginTop: compact ? SPACE.sm : SPACE.md }]}>AGGRESSION</Text>
      <View style={styles.aggRow}>
        {AGGRESSION_KEYS.map(key => (
          <AggBtn
            key={key}
            aggKey={key}
            selected={selectedAggression === key}
            onPress={onSelectAggression}
            compact={compact}
            stageLarge={stageLarge}
            disabled={disabled}
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
  shotBtnCompact: {
    paddingVertical: SPACE.xs,
  },
  shotBtnLarge: {
    paddingVertical: SPACE.sm,
  },
  shotNameLarge: {
    fontSize: SIZES.md,
  },
  containerLarge: {
    paddingHorizontal: SPACE.lg,
  },
  sectionLabelLarge: {
    fontSize: SIZES.sm,
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
  shotNameCompact: {
    fontSize: SIZES.sm,
    marginBottom: 0,
  },
  shotNameSelected: { color: COLOURS.ink },
  shotDie: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.gold,
    letterSpacing: 1,
  },
  shotDieCompact: {
    fontSize: 8,
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
  aggBtnCompact: {
    paddingVertical: 6,
  },
  aggBtnLarge: {
    paddingVertical: SPACE.sm,
  },
  aggText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.sm,
    letterSpacing: 1,
    color: COLOURS.cream,
  },
  aggTextCompact: {
    fontSize: SIZES.xs,
    letterSpacing: 0.5,
  },
  aggSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    marginTop: 3,
  },
});
