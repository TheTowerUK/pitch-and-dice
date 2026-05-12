// ═══════════════════════════════════════════════════════
//  ScorecardScreen.js
//  Full batting / bowling card for in-match view.
// ═══════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE, FORMATS } from '../constants/theme';
import { ChaseGraph } from '../components/ChaseGraph';
import {
  getScorecardRows,
  getYetToBat,
  getStrikeRate,
} from '../engine/teamEngine';

const BattingRow = ({ entry }) => {
  const sr = getStrikeRate(entry.runs, entry.balls);
  const suffix = entry.batting ? '*' : '';
  const outText = entry.dismissal
    ? entry.dismissal
    : entry.batting
      ? 'not out'
      : '—';

  return (
    <View style={styles.batRow}>
      <View style={styles.batNameCol}>
        <Text style={styles.batName} numberOfLines={1}>
          {entry.name.split(' ').pop() || entry.name}{suffix}
        </Text>
        <Text style={[styles.batOut, entry.dismissal && styles.batDismissal]} numberOfLines={1}>{outText}</Text>
      </View>
      <Text style={styles.batNum}>{entry.runs}</Text>
      <Text style={styles.batNum}>{entry.balls}</Text>
      <Text style={styles.batNum}>{entry.fours}</Text>
      <Text style={styles.batNum}>{entry.sixes}</Text>
      <Text style={styles.batNumSr}>{sr}</Text>
    </View>
  );
};

export const ScorecardScreen = ({
  battingSquad, bowlingSquad, runs, wickets, overDisplay, onBack,
  embedded = false,
  formatKey = 'T20',
  innings1Series = null,
  innings2Series = null,
  chaseTarget = null,
  chaseLabel1 = null,
  chaseLabel2 = null,
}) => {
  const maxBalls = (FORMATS[formatKey]?.overs ?? 20) * 6;
  const showChaseGraph = !embedded;
  const batted = battingSquad ? getScorecardRows(battingSquad) : [];
  const ytb    = battingSquad ? getYetToBat(battingSquad)      : [];

  const bowlingRows = bowlingSquad
    ? bowlingSquad.players
        .map((p) => ({
          name:    p.name,
          overs:   bowlingSquad.oversBowled?.[p.id]  || 0,
          runs:    bowlingSquad.runsConceded?.[p.id]  || 0,
          wickets: bowlingSquad.wicketsTaken?.[p.id]  || 0,
        }))
        .filter((r) => r.overs > 0)
        .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
    : [];

  const body = (
    <>
      {!embedded && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.85}
          >
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.title}>SCORECARD</Text>
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.teamName}>
          {battingSquad?.teamName || 'Batting'}
          {battingSquad?.flag ? ` ${battingSquad.flag}` : ''}
        </Text>
        <View style={styles.summaryScoreRow}>
          <Text style={styles.summaryScore}>
            {runs}<Text style={styles.summaryWkts}>/{wickets}</Text>
          </Text>
          <Text style={styles.summaryOv} numberOfLines={1}>OV {overDisplay}</Text>
        </View>
      </View>

      {showChaseGraph && (
        <View style={styles.chaseGraphPad}>
          <ChaseGraph
            series1={innings1Series || []}
            series2={innings2Series || []}
            target={chaseTarget}
            maxBalls={maxBalls}
            label1={chaseLabel1 || '1st innings'}
            label2={chaseLabel2 || '2nd innings'}
          />
        </View>
      )}

      {!battingSquad && (
        <Text style={styles.empty}>No squad data for this match.</Text>
      )}

      {battingSquad && (
        <View style={embedded ? styles.embedWrap : styles.scroll}>
          {!embedded ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.section}>BATTING</Text>
              <View style={styles.tableHead}>
                <Text style={[styles.th, styles.thName]}>BATTER</Text>
                <Text style={styles.th}>R</Text>
                <Text style={styles.th}>B</Text>
                <Text style={styles.th}>4s</Text>
                <Text style={styles.th}>6s</Text>
                <Text style={styles.thSr}>SR</Text>
              </View>
              {batted.map((e) => (
                <BattingRow key={e.playerId} entry={e} />
              ))}

              {ytb.length > 0 && (
                <>
                  <Text style={styles.ytbLabel}>Yet to bat</Text>
                  <Text style={styles.ytbNames}>
                    {ytb.map((e) => e.name.split(' ').pop() || e.name).join(' · ')}
                  </Text>
                </>
              )}

              {bowlingRows.length > 0 && (
                <>
                  <Text style={[styles.section, styles.sectionPad]}>BOWLING</Text>
                  <Text style={styles.bowlTeam}>
                    {bowlingSquad.teamName}{bowlingSquad.flag ? ` ${bowlingSquad.flag}` : ''}
                  </Text>
                  <View style={styles.bowlHead}>
                    <Text style={[styles.bth, styles.bthName]}>BOWLER</Text>
                    <Text style={styles.bth}>OV</Text>
                    <Text style={styles.bth}>R</Text>
                    <Text style={styles.bth}>W</Text>
                    <Text style={styles.bthEcon}>ECON</Text>
                  </View>
                  {bowlingRows.map((r) => {
                    const econ = r.overs > 0 ? (r.runs / r.overs).toFixed(1) : '—';
                    return (
                      <View key={r.name} style={styles.bowlRow}>
                        <Text style={styles.bowlName} numberOfLines={1}>
                          {r.name.split(' ').pop()}
                        </Text>
                        <Text style={styles.bowlNum}>{r.overs}</Text>
                        <Text style={styles.bowlNum}>{r.runs}</Text>
                        <Text style={[styles.bowlNum, r.wickets > 0 && { color: COLOURS.wicket }]}>
                          {r.wickets}
                        </Text>
                        <Text style={styles.bowlEcon}>{econ}</Text>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
          ) : (
            <>
              <Text style={styles.section}>BATTING</Text>
              <View style={styles.tableHead}>
                <Text style={[styles.th, styles.thName]}>BATTER</Text>
                <Text style={styles.th}>R</Text>
                <Text style={styles.th}>B</Text>
                <Text style={styles.th}>4s</Text>
                <Text style={styles.th}>6s</Text>
                <Text style={styles.thSr}>SR</Text>
              </View>
              {batted.map((e) => (
                <BattingRow key={e.playerId} entry={e} />
              ))}

              {ytb.length > 0 && (
                <>
                  <Text style={styles.ytbLabel}>Yet to bat</Text>
                  <Text style={styles.ytbNames}>
                    {ytb.map((e) => e.name.split(' ').pop() || e.name).join(' · ')}
                  </Text>
                </>
              )}

              {bowlingRows.length > 0 && (
                <>
                  <Text style={[styles.section, styles.sectionPad]}>BOWLING</Text>
                  <Text style={styles.bowlTeam}>
                    {bowlingSquad.teamName}{bowlingSquad.flag ? ` ${bowlingSquad.flag}` : ''}
                  </Text>
                  <View style={styles.bowlHead}>
                    <Text style={[styles.bth, styles.bthName]}>BOWLER</Text>
                    <Text style={styles.bth}>OV</Text>
                    <Text style={styles.bth}>R</Text>
                    <Text style={styles.bth}>W</Text>
                    <Text style={styles.bthEcon}>ECON</Text>
                  </View>
                  {bowlingRows.map((r) => {
                    const econ = r.overs > 0 ? (r.runs / r.overs).toFixed(1) : '—';
                    return (
                      <View key={r.name} style={styles.bowlRow}>
                        <Text style={styles.bowlName} numberOfLines={1}>
                          {r.name.split(' ').pop()}
                        </Text>
                        <Text style={styles.bowlNum}>{r.overs}</Text>
                        <Text style={styles.bowlNum}>{r.runs}</Text>
                        <Text style={[styles.bowlNum, r.wickets > 0 && { color: COLOURS.wicket }]}>
                          {r.wickets}
                        </Text>
                        <Text style={styles.bowlEcon}>{econ}</Text>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>
      )}
    </>
  );

  return embedded ? (
    <View>{body}</View>
  ) : (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLOURS.ink },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn:      { marginRight: SPACE.md },
  backText:     { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.gold, letterSpacing: 2 },
  title:        { fontFamily: FONTS.display, fontSize: SIZES.lg, color: COLOURS.cream, letterSpacing: 4 },
  summary:      { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  chaseGraphPad: { paddingHorizontal: SPACE.lg },
  teamName:     { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 2, marginBottom: SPACE.xs },
  summaryScoreRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' },
  summaryScore: { fontFamily: FONTS.display, fontSize: 42, color: COLOURS.cream, letterSpacing: 1, lineHeight: 46 },
  summaryWkts:  { color: COLOURS.red, fontSize: 32 },
  summaryOv:    { fontFamily: FONTS.mono, fontSize: SIZES.md * 1.05, color: COLOURS.dot, marginLeft: 14, marginBottom: 7 },
  empty:        { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.dot, paddingHorizontal: SPACE.lg },
  scroll:       { flex: 1 },
  embedWrap:   { paddingBottom: SPACE.md },
  scrollContent: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxl },
  section:      { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.gold, letterSpacing: 3, marginTop: SPACE.md, marginBottom: SPACE.sm },
  sectionPad:   { marginTop: SPACE.xl },
  tableHead:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(212,160,23,0.25)', paddingBottom: SPACE.xs, marginBottom: SPACE.xs },
  th:           { fontFamily: FONTS.mono, fontSize: 10, color: COLOURS.dot, width: 32, textAlign: 'center' },
  thName:       { flex: 1, textAlign: 'left', width: undefined },
  thSr:         { fontFamily: FONTS.mono, fontSize: 10, color: COLOURS.dot, width: 44, textAlign: 'right' },
  batRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  batNameCol:   { flex: 1, marginRight: SPACE.sm },
  batName:      { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.cream, letterSpacing: 1 },
  batOut:       { fontFamily: FONTS.mono, fontSize: 10, color: COLOURS.boundary, marginTop: 2 },
  batDismissal: { fontFamily: FONTS.monoMed, color: '#ff9638' },
  batNum:       { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.dot, width: 32, textAlign: 'center' },
  batNumSr:     { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.dot, width: 44, textAlign: 'right' },
  ytbLabel:     { fontFamily: FONTS.mono, fontSize: 9.5, color: COLOURS.dot, opacity: 0.72, marginTop: SPACE.md, letterSpacing: 2 },
  ytbNames:     { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, opacity: 0.68, marginTop: 2, lineHeight: 16 },
  bowlTeam:     { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, marginBottom: SPACE.sm },
  bowlHead:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(212,160,23,0.25)', paddingBottom: SPACE.xs, marginBottom: SPACE.xs },
  bth:          { fontFamily: FONTS.mono, fontSize: 10, color: COLOURS.dot, width: 40, textAlign: 'center', letterSpacing: 1 },
  bthName:      { flex: 1, textAlign: 'left', width: undefined },
  bthEcon:      { fontFamily: FONTS.mono, fontSize: 10, color: COLOURS.dot, width: 48, textAlign: 'right', letterSpacing: 1 },
  bowlRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  bowlName:     { fontFamily: FONTS.display, fontSize: SIZES.sm, color: COLOURS.cream, flex: 1, marginRight: SPACE.md, letterSpacing: 1 },
  bowlNum:      { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.cream, width: 40, textAlign: 'center' },
  bowlEcon:     { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.dot, width: 48, textAlign: 'right' },
});