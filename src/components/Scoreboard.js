// ─────────────────────────────────────────
//  Scoreboard.js
//  Top scoreboard bar — matchup, score, overs, target
//  and current bowler figures.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export const Scoreboard = ({
  runs, wickets, overDisplay, formatLabel, innings,
  target, ballsRemaining, onHistoryPress, onPausePress,
  bowler, battingSquad, bowlingSquad, rrr, pressureTier,
  batters, battingOrder, players, strikerIndex, nonStrikerIndex,
  compact = false,
  stageLarge = false,
  showOverComplete = false,
}) => {
  const runsNeeded = target ? Math.max(0, target - runs) : null;

  const bowlerOvers   = bowler ? Math.floor((bowler.ballsBowled || 0) / 6) : 0;
  const bowlerBalls   = bowler ? (bowler.ballsBowled || 0) % 6 : 0;
  const bowlerFigures = bowler && innings === 1
    ? `${bowler.name?.split(' ').pop() || 'Bowler'} ${bowlerOvers}.${bowlerBalls} ov`
    : null;

  const batTeam  = battingSquad?.teamName || null;
  const batFlag  = battingSquad?.flag     || '';
  const bowlTeam = bowlingSquad?.teamName || null;
  const bowlFlag = bowlingSquad?.flag     || '';
  const headerMetaItems = [
    { key: 'format', value: formatLabel || '' },
    { key: 'innings', value: `INN ${innings}` },
  ];
  const [formatMeta, inningsMeta] = headerMetaItems;
  const isActiveChase = innings === 2 && !!target && runs < target && ballsRemaining > 0;
  const strikerSquadIdx = battingSquad?.currentBatsmen?.[0];
  const nonStrikerSquadIdx = battingSquad?.currentBatsmen?.[1];
  const strikerFromSquad = Number.isInteger(strikerSquadIdx) ? battingSquad?.players?.[strikerSquadIdx] : null;
  const nonStrikerFromSquad = Number.isInteger(nonStrikerSquadIdx) ? battingSquad?.players?.[nonStrikerSquadIdx] : null;
  const strikerFallback = battingOrder?.[strikerIndex] || players?.[strikerIndex] || batters?.[strikerIndex] || null;
  const nonStrikerFallback = battingOrder?.[nonStrikerIndex] || players?.[nonStrikerIndex] || batters?.[nonStrikerIndex] || null;
  const striker = strikerFromSquad || strikerFallback;
  const nonStriker = nonStrikerFromSquad || nonStrikerFallback;
  const strikerName = striker?.name && !striker.name.startsWith('Batter ') ? striker.name : 'TBD';
  const nonStrikerName = nonStriker?.name && !nonStriker.name.startsWith('Batter ') ? nonStriker.name : 'TBD';

  const getChaseStateDescriptor = () => {
    if (!isActiveChase || !pressureTier?.key) return null;

    const key = pressureTier.key;
    if (key === 'comfortable' || key === 'watchful') {
      return {
        stateKey: 'comfortable',
        stateLabel: 'COMFORTABLE',
        stateSubtitle: 'Chase in control',
        tone: COLOURS.runs1,
      };
    }
    if (key === 'tense') {
      return {
        stateKey: 'pressure',
        stateLabel: 'PRESSURE',
        stateSubtitle: 'Game tightening',
        tone: COLOURS.boundary,
      };
    }
    return {
      stateKey: 'critical',
      stateLabel: 'CRITICAL',
      stateSubtitle: 'Boundaries needed now',
      tone: COLOURS.red,
    };
  };

  const chaseState = getChaseStateDescriptor();

  return (
    <View style={styles.wrapper}>
      {/* Utility/header row — compact top bar */}
      <View style={[
        styles.utilityHeader,
        compact && styles.utilityHeaderCompact,
        stageLarge && styles.utilityHeaderLarge,
      ]}
      >
        <View style={styles.headerLeftMeta}>
          <Text
            style={styles.utilityMetaFormat}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatMeta.value}
          </Text>
          <Text style={styles.utilityMetaSeparator}>•</Text>
          <Text style={styles.utilityMetaInnings} numberOfLines={1}>
            {inningsMeta.value}
          </Text>
        </View>
        <View style={styles.utilityControls}>
          {onHistoryPress && (
            <TouchableOpacity style={styles.iconBtn} onPress={onHistoryPress}>
              <Text style={styles.iconText}>📋</Text>
            </TouchableOpacity>
          )}
          {onPausePress && (
            <TouchableOpacity style={styles.iconBtn} onPress={onPausePress}>
              <Text style={styles.pauseText}>≡</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Matchup strip — slim row above score */}
      {batTeam && bowlTeam && (
        <View style={[styles.matchup, compact && styles.matchupCompact, stageLarge && styles.matchupLarge]}>
          <Text style={styles.matchTeam} numberOfLines={1}>
            {batFlag} {batTeam}
          </Text>
          <Text style={styles.matchVs}>vs</Text>
          <Text style={styles.matchTeam} numberOfLines={1}>
            {bowlTeam} {bowlFlag}
          </Text>
        </View>
      )}

      <View style={[
        styles.scorePanel,
        compact && styles.scorePanelCompact,
        stageLarge && styles.scorePanelLarge,
      ]}
      >
        {/* Main scoreboard row — score always visible; over-complete overlays center */}
        <View style={[
          styles.liveMatchRow,
          compact && styles.liveMatchRowCompact,
          stageLarge && styles.liveMatchRowLarge,
        ]}
        >
          <View style={styles.scoreRow}>
            <Text style={[styles.runs, compact && styles.runsCompact, stageLarge && styles.runsLarge]}>{runs}</Text>
            <Text style={[styles.wicketsText, compact && styles.wicketsTextCompact, stageLarge && styles.wicketsTextLarge]}>/{wickets}</Text>
          </View>
          <View style={[styles.oversPill, compact && styles.oversPillCompact, stageLarge && styles.oversPillLarge]}>
            <Text style={[styles.oversValue, compact && styles.oversValueCompact, stageLarge && styles.oversValueLarge]}>{overDisplay} overs</Text>
          </View>
          {showOverComplete && (
            <View style={styles.overCompleteOverlay} pointerEvents="none">
              <View style={[
                styles.overCompleteBadge,
                compact && styles.overCompleteBadgeCompact,
                stageLarge && styles.overCompleteBadgeLarge,
              ]}
              >
                <Text style={[
                  styles.overCompleteText,
                  compact && styles.overCompleteTextCompact,
                  stageLarge && styles.overCompleteTextLarge,
                ]}
                >
                  OVER COMPLETE
                </Text>
              </View>
            </View>
          )}
        </View>

        {(target || bowlerFigures) ? (
          <View style={[styles.contextRow, compact && styles.contextRowCompact, stageLarge && styles.contextRowLarge]}>
            <View style={styles.contextLeft}>
              {target ? (
                <Text style={[styles.chaseLine, compact && styles.chaseLineCompact, stageLarge && styles.chaseLineLarge]} numberOfLines={1} ellipsizeMode="tail">
                  Need {runsNeeded} from {ballsRemaining}
                </Text>
              ) : (
                <Text style={[styles.chaseLine, compact && styles.chaseLineCompact, stageLarge && styles.chaseLineLarge]} numberOfLines={1} ellipsizeMode="tail">
                  {bowlerFigures || ''}
                </Text>
              )}
            </View>
            <View style={styles.contextRight}>
              {isActiveChase && typeof rrr === 'number' ? (
                <Text style={[styles.chaseRightLine, compact && styles.chaseRightLineCompact, stageLarge && styles.chaseRightLineLarge]} numberOfLines={1} ellipsizeMode="tail">
                  RRR {rrr.toFixed(2)}
                  {chaseState ? (
                    <Text style={styles.chaseStateInline}>
                      {' '}• <Text style={[styles.chaseStateTone, { color: chaseState.tone }]}>{chaseState.stateLabel}</Text>
                    </Text>
                  ) : null}
                </Text>
              ) : (
                <Text style={[styles.chaseRightLine, compact && styles.chaseRightLineCompact, stageLarge && styles.chaseRightLineLarge]} numberOfLines={1} ellipsizeMode="tail">
                  {target ? `Target ${target}` : ''}
                </Text>
              )}
            </View>
          </View>
        ) : null}
      </View>

      {!compact && (
        <View style={styles.batterRow}>
          <View style={styles.batterBlock}>
            <Text style={styles.batterLabel}>On Strike</Text>
            <Text style={styles.batterName} numberOfLines={1} ellipsizeMode="tail">
              {strikerName} *
            </Text>
          </View>
          <View style={styles.batterDivider} />
          <View style={styles.batterBlock}>
            <Text style={styles.batterLabel}>Non-Striker</Text>
            <Text style={styles.batterNameDim} numberOfLines={1} ellipsizeMode="tail">
              {nonStrikerName}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor:   COLOURS.ink,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212,160,23,0.3)',
  },
  matchup: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: SPACE.lg,
    paddingTop:        SPACE.sm,
    paddingBottom:     SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,160,23,0.12)',
    gap:               SPACE.sm,
  },
  utilityHeaderCompact: {
    minHeight: 24,
    paddingTop: 2,
    paddingBottom: 2,
  },
  utilityHeaderLarge: {
    minHeight: 30,
    paddingHorizontal: SPACE.xl,
  },
  matchupCompact: {
    paddingTop: SPACE.xs,
    paddingBottom: 2,
  },
  matchupLarge: {
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
  },
  scorePanel: {
    width: '100%',
  },
  scorePanelCompact: {
    paddingBottom: 2,
  },
  scorePanelLarge: {
    paddingBottom: SPACE.xs,
  },
  liveMatchRowCompact: {
    minHeight: 50,
    paddingTop: 0,
    paddingBottom: 0,
  },
  liveMatchRowLarge: {
    minHeight: 58,
    paddingTop: 2,
    paddingBottom: 2,
  },
  runsCompact: {
    fontSize: 48,
    lineHeight: 50,
  },
  runsLarge: {
    fontSize: 59,
    lineHeight: 61,
  },
  wicketsTextCompact: {
    fontSize: 33,
    marginBottom: 3,
  },
  wicketsTextLarge: {
    fontSize: 39,
    marginBottom: 4,
  },
  oversPillCompact: {
    marginLeft: 8,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
  },
  oversPillLarge: {
    marginLeft: SPACE.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
  },
  oversValueCompact: {
    fontSize: SIZES.sm,
  },
  oversValueLarge: {
    fontSize: SIZES.md,
  },
  contextRowCompact: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  contextRowLarge: {
    paddingTop: 3,
    paddingBottom: 3,
  },
  chaseLineCompact: {
    fontSize: SIZES.sm,
  },
  chaseLineLarge: {
    fontSize: SIZES.md,
  },
  chaseRightLineCompact: {
    fontSize: SIZES.xs,
  },
  chaseRightLineLarge: {
    fontSize: SIZES.sm,
  },
  utilityHeader: {
    minHeight:         28,
    paddingHorizontal: SPACE.lg,
    paddingTop:        SPACE.xs,
    paddingBottom:     SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  headerLeftMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  utilityMetaFormat: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 1.2,
  },
  utilityMetaSeparator: {
    flexShrink: 0,
    marginHorizontal: 6,
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: 'rgba(245,240,232,0.55)',
    letterSpacing: 1,
  },
  utilityMetaInnings: {
    flexShrink: 0,
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.cream,
    letterSpacing: 1.6,
  },
  matchTeam: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 1,
    flex:          1,
    textAlign:     'center',
  },
  matchVs: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.gold,
    letterSpacing: 2,
    opacity:       0.7,
  },
  liveMatchRow: {
    position:          'relative',
    minHeight:         72,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical:   4,
    width:             '100%',
  },
  overCompleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  overCompleteBadge: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.45)',
    borderRadius: 3,
    backgroundColor: 'rgba(26,26,26,0.88)',
  },
  overCompleteBadgeCompact: {
    paddingVertical: 4,
  },
  overCompleteBadgeLarge: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
  },
  overCompleteText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.dot,
    letterSpacing: 3,
    textAlign: 'center',
  },
  overCompleteTextCompact: {
    fontSize: SIZES.xs,
    letterSpacing: 2,
  },
  overCompleteTextLarge: {
    fontSize: SIZES.md,
    letterSpacing: 3,
  },
  utilityControls: {
    flexShrink: 0,
    flexDirection: 'row',
    gap:           8,
    alignItems:    'center',
    justifyContent:'flex-end',
  },
  scoreRow:  {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    marginRight: 12,
    borderRadius: 8,
    shadowColor: COLOURS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  runs: {
    fontFamily:    FONTS.display,
    fontSize:      62,
    color:         COLOURS.cream,
    letterSpacing: 2,
    lineHeight:    64,
  },
  wicketsText: {
    fontFamily:    FONTS.display,
    fontSize:      45,
    color:         COLOURS.red,
    letterSpacing: 1,
    marginBottom:  4,
  },
  oversPill: {
    marginLeft: 12,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
  },
  oversValue: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.md * 1.05,
    color:         COLOURS.cream,
    letterSpacing: 1.1,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: 2,
    paddingBottom: 2,
    gap: SPACE.sm,
  },
  contextLeft: {
    flex: 1.2,
    minWidth: 0,
  },
  contextRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  chaseLine: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.cream,
    letterSpacing: 0.8,
  },
  chaseRightLine: {
    fontFamily: FONTS.display,
    fontSize: SIZES.sm,
    color: COLOURS.dot,
    letterSpacing: 0.8,
    textAlign: 'right',
    minWidth: 0,
  },
  chaseStateInline: {
    color: COLOURS.dot,
  },
  chaseStateTone: {
    fontFamily: FONTS.display,
  },
  batterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingTop: 4,
    paddingBottom: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  batterBlock: {
    flex: 1,
    minWidth: 0,
  },
  batterDivider: {
    width: 1,
    height: 26,
    marginHorizontal: SPACE.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  batterLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(245,240,232,0.72)',
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  batterName: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLOURS.cream,
    letterSpacing: 0.5,
  },
  batterNameDim: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: 'rgba(245,240,232,0.78)',
    letterSpacing: 0.5,
  },
  bowlerFig: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.boundary,
    letterSpacing: 1,
    opacity:       0.85,
  },
  iconBtn:   { padding: SPACE.xs },
  iconText:  { fontSize: 18 },
  pauseText: {
    fontSize:          22,
    color:             COLOURS.white,
    fontWeight:        '600',
    paddingHorizontal: SPACE.xs,
  },
});