// ═══════════════════════════════════════════════════════
//  MatchDetailScreen.js
//  Detailed view of a historic match — scorecard + commentary
//  Shown when a match is tapped in MatchHistoryScreen.
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { ScorecardScreen } from './ScorecardScreen';

const Tab = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const CommentaryEntry = ({ entry }) => {
  let colour = COLOURS.cream;
  if (entry.style === 'wicket')   colour = COLOURS.red;
  if (entry.style === 'six')      colour = COLOURS.gold;
  if (entry.style === 'four')     colour = COLOURS.boundary;
  if (entry.style === 'momentum') colour = COLOURS.gold;
  if (entry.style === 'pressure') colour = COLOURS.red;

  return (
    <View style={styles.cmtRow}>
      <Text style={styles.cmtBall}>{entry.ball}</Text>
      <Text style={[styles.cmtText, { color: colour }]}>{entry.text}</Text>
    </View>
  );
};

// Renders a full scorecard view for an innings stored in history
const HistoryScorecard = ({ innings, label }) => {
  if (!innings || !innings.battingSquad) {
    return (
      <View style={styles.noData}>
        <Text style={styles.noDataText}>
          Detailed scorecard not available for this innings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.inningsBlock}>
      <Text style={styles.inningsLabel}>{label}</Text>
      <ScorecardScreen
        battingSquad={innings.battingSquad}
        bowlingSquad={innings.bowlingSquad}
        runs={innings.runs}
        wickets={innings.wickets}
        overDisplay={innings.overs}
        onBack={null}
        embedded={true}
      />
    </View>
  );
};

export const MatchDetailScreen = ({ match, onBack }) => {
  const [tab, setTab] = useState('scorecard');

  const isV2 = match?.schemaVersion >= 2;
  const hasInnings1 = isV2 && match.innings1;
  const hasInnings2 = isV2 && match.innings2;

  // Build combined commentary — newest balls at top, label with innings
  const combinedCommentary = [];
  if (hasInnings2) {
    combinedCommentary.push({ ball: '', text: '— INNINGS 2 —', style: 'momentum' });
    combinedCommentary.push(...(match.innings2.commentary || []));
  }
  if (hasInnings1) {
    combinedCommentary.push({ ball: '', text: '— INNINGS 1 —', style: 'momentum' });
    combinedCommentary.push(...(match.innings1.commentary || []));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.85}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MATCH DETAIL</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.format}>{match.format} · {match.date}</Text>
        <Text style={styles.result}>{match.result}</Text>
      </View>

      {!isV2 && (
        <View style={styles.noData}>
          <Text style={styles.noDataIcon}>📋</Text>
          <Text style={styles.noDataText}>
            This match was recorded before detailed history was available.
          </Text>
          <Text style={styles.noDataSubtext}>
            Final score: {match.runs}/{match.wickets} ({match.overs} ov)
          </Text>
        </View>
      )}

      {isV2 && (
        <>
          <View style={styles.tabs}>
            <Tab label="SCORECARD" active={tab === 'scorecard'} onPress={() => setTab('scorecard')} />
            <Tab label="COMMENTARY" active={tab === 'commentary'} onPress={() => setTab('commentary')} />
          </View>

          {tab === 'scorecard' && (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {hasInnings1 && (
                <HistoryScorecard innings={match.innings1} label="1st INNINGS" />
              )}
              {hasInnings2 && (
                <HistoryScorecard innings={match.innings2} label="2nd INNINGS" />
              )}
            </ScrollView>
          )}

          {tab === 'commentary' && (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {combinedCommentary.length === 0 && (
                <Text style={styles.noDataText}>No commentary recorded.</Text>
              )}
              {combinedCommentary.map((entry, i) => (
                <CommentaryEntry key={i} entry={entry} />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { marginRight: SPACE.md },
  backText: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.gold, letterSpacing: 2 },
  title: { fontFamily: FONTS.display, fontSize: SIZES.lg, color: COLOURS.cream, letterSpacing: 4 },
  summary: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  format: { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 2, marginBottom: SPACE.xs },
  result: { fontFamily: FONTS.display, fontSize: SIZES.lg, color: COLOURS.gold, letterSpacing: 2 },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,160,23,0.25)',
    paddingHorizontal: SPACE.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLOURS.gold },
  tabText: { fontFamily: FONTS.display, fontSize: SIZES.sm, color: COLOURS.dot, letterSpacing: 3 },
  tabTextActive: { color: COLOURS.gold },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACE.lg, paddingBottom: SPACE.xxl },

  inningsBlock: { marginBottom: SPACE.xl },
  inningsLabel: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.gold,
    letterSpacing: 3,
    marginBottom: SPACE.sm,
    textAlign: 'center',
  },

  cmtRow: {
    flexDirection: 'row',
    paddingVertical: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cmtBall: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 1,
    width: 100,
    marginRight: SPACE.sm,
  },
  cmtText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    flex: 1,
    lineHeight: 18,
  },

  noData: { alignItems: 'center', paddingTop: SPACE.xxl },
  noDataIcon: { fontSize: 48, marginBottom: SPACE.md },
  noDataText: { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.dot, textAlign: 'center', marginBottom: SPACE.sm },
  noDataSubtext: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.cream, letterSpacing: 2 },
});

