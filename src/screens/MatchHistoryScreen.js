// ═══════════════════════════════════════════════════════
//  MatchHistoryScreen.js
//  Displays last 5 saved matches from AsyncStorage.
// ═══════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { loadMatchHistory, clearAllData } from '../engine/storageEngine';
import { PITCH_TYPES } from '../engine/pitchEngine';

const MatchCard = ({ match }) => {
  const pitchInfo = PITCH_TYPES[match.pitchType] || PITCH_TYPES.flat;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.format}>{match.format}</Text>
          <Text style={styles.date}>{match.date}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.pitchIcon}>{pitchInfo.icon}</Text>
          <Text style={[styles.pitchLabel, { color: pitchInfo.colour }]}>
            {pitchInfo.label}
          </Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <Text style={styles.score}>
          {match.runs}
          <Text style={styles.wickets}>/{match.wickets}</Text>
        </Text>
        <Text style={styles.overs}>({match.overs} ov)</Text>
      </View>

      {/* Result */}
      <Text style={styles.result}>{match.result}</Text>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <StatChip label="RR"  value={match.runRate} />
        <StatChip label="4s"  value={match.boundaries} />
        <StatChip label="6s"  value={match.sixes} />
        <StatChip label="INN" value={match.innings} />
      </View>

      {/* Players */}
      <View style={styles.playersRow}>
        <Text style={styles.playerChip}>🏏 {match.batsman}</Text>
        <Text style={styles.playerChip}>⚾ {match.bowler}</Text>
      </View>
    </View>
  );
};

const StatChip = ({ label, value }) => (
  <View style={styles.statChip}>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const MatchHistoryScreen = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatchHistory().then(h => {
      setHistory(h);
      setLoading(false);
    });
  }, []);

  const handleClear = async () => {
    await clearAllData();
    setHistory([]);
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MATCH HISTORY</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && (
          <ActivityIndicator color={COLOURS.gold} style={{ marginTop: SPACE.xxl }} />
        )}

        {!loading && history.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No matches played yet.</Text>
            <Text style={styles.emptySubtext}>
              Complete a match to see your history here.
            </Text>
          </View>
        )}

        {!loading && history.map((match, i) => (
          <MatchCard key={match.id || i} match={match} />
        ))}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLOURS.slate },
  header: {
    backgroundColor:  COLOURS.ink,
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical:  SPACE.md,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212,160,23,0.3)',
  },
  backBtn:   { paddingRight: SPACE.lg },
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
    flex:         1,
    textAlign:    'center',
  },
  clearBtn:  { paddingLeft: SPACE.lg },
  clearText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.red,
    letterSpacing: 2,
  },
  scroll: { padding: SPACE.lg, paddingBottom: SPACE.xxl },

  card: {
    backgroundColor: COLOURS.ink,
    borderRadius:    4,
    padding:         SPACE.lg,
    marginBottom:    SPACE.md,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   SPACE.sm,
  },
  headerLeft: {},
  format: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    color:        COLOURS.gold,
    letterSpacing: 3,
  },
  date: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  2,
  },
  headerRight: { alignItems: 'flex-end' },
  pitchIcon:  { fontSize: 20 },
  pitchLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    letterSpacing: 1,
    marginTop:    2,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           SPACE.sm,
    marginBottom:  SPACE.xs,
  },
  score: {
    fontFamily:   FONTS.display,
    fontSize:     40,
    color:        COLOURS.cream,
    letterSpacing: 1,
    lineHeight:   44,
  },
  wickets: { color: COLOURS.red },
  overs: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.sm,
    color:        COLOURS.dot,
    marginBottom: SPACE.xs,
  },
  result: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.sm,
    color:        COLOURS.gold,
    marginBottom: SPACE.md,
    fontStyle:    'italic',
  },

  statsRow: {
    flexDirection: 'row',
    gap:           SPACE.sm,
    marginBottom:  SPACE.sm,
  },
  statChip: {
    flex:            1,
    backgroundColor: COLOURS.slateMid,
    borderRadius:    3,
    padding:         SPACE.sm,
    alignItems:      'center',
  },
  statVal: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    color:        COLOURS.cream,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  1,
  },

  playersRow: {
    flexDirection: 'row',
    gap:           SPACE.sm,
  },
  playerChip: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    flex:       1,
  },

  empty: { alignItems: 'center', paddingTop: SPACE.xxl * 2 },
  emptyIcon:    { fontSize: 48, marginBottom: SPACE.lg },
  emptyText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    color:        COLOURS.cream,
    letterSpacing: 3,
    marginBottom: SPACE.sm,
  },
  emptySubtext: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.dot,
    textAlign:  'center',
  },
});
