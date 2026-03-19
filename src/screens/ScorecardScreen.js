// ═══════════════════════════════════════════════════════
//  ScorecardScreen.js
//  Live innings scorecard showing all batsmen,
//  fall of wickets, and bowling figures.
// ═══════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import {
  getScorecardRows, getYetToBat,
  getStrikeRate, formatDismissal,
} from '../engine/teamEngine';
import { ROLE_CONFIG } from '../engine/teamsData';

const ScorecardRow = ({ entry, isBatting }) => {
  const sr = getStrikeRate(entry.runs, entry.balls);
  return (
    <View style={[styles.row, isBatting && styles.rowActive]}>
      <View style={styles.playerCol}>
        <Text style={[styles.playerName, isBatting && { color: COLOURS.gold }]}>
          {entry.name}
          {isBatting && <Text style={styles.batting}> *</Text>}
        </Text>
        <Text style={styles.dismissal}>{formatDismissal(entry.dismissal)}</Text>
      </View>
      <Text style={styles.statCell}>{entry.runs}</Text>
      <Text style={styles.statCell}>{entry.balls}</Text>
      <Text style={styles.statCell}>{entry.fours}</Text>
      <Text style={styles.statCell}>{entry.sixes}</Text>
      <Text style={[styles.statCell, styles.srCell]}>{sr}</Text>
    </View>
  );
};

export const ScorecardScreen = ({ battingSquad, bowlingSquad, runs, wickets, overDisplay, onBack }) => {
  if (!battingSquad) return null;

  const batted   = getScorecardRows(battingSquad);
  const yetToBat = getYetToBat(battingSquad);

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SCORECARD</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Innings summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryScore}>
          {battingSquad.teamName} {runs}/{wickets}
        </Text>
        <Text style={styles.summaryOvers}>({overDisplay} ov)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Column headers */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.playerCol]}>BATSMAN</Text>
          <Text style={styles.headerCell}>R</Text>
          <Text style={styles.headerCell}>B</Text>
          <Text style={styles.headerCell}>4s</Text>
          <Text style={styles.headerCell}>6s</Text>
          <Text style={[styles.headerCell, styles.srCell]}>SR</Text>
        </View>

        {/* Batted rows */}
        {batted.map(entry => (
          <ScorecardRow
            key={entry.playerId}
            entry={entry}
            isBatting={entry.batting}
          />
        ))}

        {/* Yet to bat */}
        {yetToBat.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>YET TO BAT</Text>
            {yetToBat.map(entry => (
              <View key={entry.playerId} style={styles.yetRow}>
                <Text style={styles.yetName}>{entry.name}</Text>
              </View>
            ))}
          </>
        )}

        {/* Bowling figures */}
        {bowlingSquad && (
          <>
            <Text style={styles.sectionLabel}>BOWLING</Text>
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, styles.playerCol]}>BOWLER</Text>
              <Text style={styles.headerCell}>O</Text>
              <Text style={styles.headerCell}>W</Text>
            </View>
            {bowlingSquad.players
              .filter(p => (bowlingSquad.oversBowled[p.id] || 0) > 0)
              .map(p => (
                <View key={p.id} style={styles.row}>
                  <Text style={[styles.playerName, styles.playerCol]}>{p.name}</Text>
                  <Text style={styles.statCell}>{bowlingSquad.oversBowled[p.id] || 0}</Text>
                  <Text style={styles.statCell}>
                    {bowlingSquad.scorecard?.filter(e => e.dismissal?.includes(p.name)).length || '—'}
                  </Text>
                </View>
              ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLOURS.slate },
  header: {
    backgroundColor:   COLOURS.ink,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.md,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212,160,23,0.3)',
    justifyContent:    'space-between',
  },
  backBtn:     { minWidth: 60 },
  backText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    color:        COLOURS.gold,
    letterSpacing: 2,
  },
  title: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    color:        COLOURS.cream,
    letterSpacing: 4,
  },
  placeholder: { minWidth: 60 },

  summary: {
    backgroundColor:  COLOURS.ink,
    paddingHorizontal: SPACE.lg,
    paddingVertical:  SPACE.md,
    flexDirection:    'row',
    alignItems:       'baseline',
    gap:              SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  summaryScore: {
    fontFamily:   FONTS.display,
    fontSize:     32,
    color:        COLOURS.cream,
    letterSpacing: 2,
  },
  summaryOvers: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.dot,
  },

  scroll: { padding: SPACE.lg, paddingBottom: SPACE.xxl },

  headerRow: {
    flexDirection:     'row',
    paddingVertical:   SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom:      SPACE.xs,
  },
  headerCell: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 1,
    textAlign:    'right',
    width:        32,
  },

  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowActive: {
    backgroundColor: 'rgba(212,160,23,0.05)',
  },
  playerCol: { flex: 1, paddingRight: SPACE.sm },
  playerName: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.sm,
    color:        COLOURS.cream,
  },
  batting: { color: COLOURS.gold },
  dismissal: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  1,
  },
  statCell: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    color:        COLOURS.cream,
    textAlign:    'right',
    width:        32,
    letterSpacing: 1,
  },
  srCell: { width: 44 },

  sectionLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
    marginTop:    SPACE.lg,
    marginBottom: SPACE.sm,
    paddingBottom: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  yetRow: { paddingVertical: SPACE.xs },
  yetName: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.dot,
  },
});
