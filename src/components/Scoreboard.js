// ─────────────────────────────────────────
//  Scoreboard.js
//  Top scoreboard bar — score, overs, target
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export const Scoreboard = ({
  runs, wickets, overDisplay, format, innings,
  target, ballsRemaining, onFormatPress, onHistoryPress, onPausePress,
}) => {
  const targetText = target
    ? `NEED ${Math.max(0, target - runs)} (${ballsRemaining}b)`
    : '—';

  return (
    <View style={styles.container}>
      {/* Left — score */}
      <View style={styles.left}>
        <View style={styles.scoreRow}>
          <Text style={styles.runs}>{runs}</Text>
          <Text style={styles.wickets}>/{wickets}</Text>
        </View>
        <Text style={styles.meta}>{format} — INNINGS {innings}</Text>
      </View>

      {/* Centre — overs / target */}
      <View style={styles.centre}>
        <Text style={styles.target}>{targetText}</Text>
        <Text style={styles.overs}>OV {overDisplay}</Text>
      </View>

      {/* Right — format toggle */}
      <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
        {onHistoryPress && (
          <TouchableOpacity style={styles.histBtn} onPress={onHistoryPress}>
            <Text style={styles.histText}>📋</Text>
          </TouchableOpacity>
        )}
        {onPausePress && (
          <TouchableOpacity style={styles.histBtn} onPress={onPausePress}>
            <Text style={styles.histText}>≡</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.fmtBtn} onPress={onFormatPress}>
          <Text style={styles.fmtText}>{format}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLOURS.ink,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212,160,23,0.3)',
  },
  left: { flex: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end' },
  runs: {
    fontFamily: FONTS.display,
    fontSize: 44,
    color: COLOURS.cream,
    letterSpacing: 2,
    lineHeight: 48,
  },
  wickets: {
    fontFamily: FONTS.display,
    fontSize: 32,
    color: COLOURS.red,
    letterSpacing: 1,
    marginBottom: 2,
  },
  meta: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 2,
    marginTop: 2,
  },
  centre: { alignItems: 'center', flex: 1 },
  target: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    color: COLOURS.gold,
    letterSpacing: 2,
  },
  overs: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.dot,
    letterSpacing: 3,
    marginTop: 2,
  },
  fmtBtn: {
    borderWidth: 1,
    borderColor: COLOURS.gold,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.md,
  },
  fmtText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.gold,
    letterSpacing: 3,
  },
  histBtn: {
    padding: SPACE.xs,
  },
  histText: {
    fontSize: 18,
    color:    COLOURS.cream,
  },
});
