// ─────────────────────────────────────────
//  PlayerCard.js
//  Compact in-game display of active
//  batsman and bowler with skill ratings.
//  When squad data is available, shows
//  current squad player not legacy object.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { getSkillColour, getSkillLabel } from '../engine/playerEngine';

const PlayerPill = ({ player, role, overs }) => {
  const colour = getSkillColour(player.skill);
  const isBat  = role === 'batsman';

  return (
    <View style={[styles.pill, { borderColor: colour + '44' }]}>
      <View style={[styles.roleTag, { backgroundColor: colour + '22' }]}>
        <Text style={[styles.roleText, { color: colour }]}>
          {isBat ? 'BAT' : 'BOWL'}
        </Text>
      </View>
      <View style={styles.pillInfo}>
        <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.playerStats}>
          {isBat
            ? `${player.runs || 0}r (${player.ballsFaced || 0}b)`
            : `${player.wickets || 0}wkt · ${overs || '0.0'} ov`
          }
        </Text>
      </View>
      <View style={[styles.skillBadge, { backgroundColor: colour + '22' }]}>
        <Text style={[styles.skillNum, { color: colour }]}>{player.skill}</Text>
        <Text style={[styles.skillLbl, { color: colour }]}>{getSkillLabel(player.skill)}</Text>
      </View>
    </View>
  );
};

export const PlayerCard = ({ batsman, bowler, battingSquad, bowlingSquad }) => {
  if (!batsman || !bowler) return null;

  // Prefer team-sheet striker from squad state to avoid generic "Batter N" placeholders.
  let resolvedBatsman = batsman;
  if (battingSquad?.players?.length && Array.isArray(battingSquad.currentBatsmen)) {
    const strikerSquadIdx = battingSquad.currentBatsmen[0];
    if (Number.isInteger(strikerSquadIdx)) {
      const strikerPlayer = battingSquad.players[strikerSquadIdx];
      if (strikerPlayer?.name && !strikerPlayer.name.startsWith('Batter ')) {
        const strikerScore = battingSquad.scorecard?.find((row) => row.playerId === strikerPlayer.id);
        resolvedBatsman = {
          ...batsman,
          name: strikerPlayer.name,
          skill: strikerPlayer.battingSkill ?? batsman.skill,
          runs: strikerScore?.runs ?? batsman.runs,
          ballsFaced: strikerScore?.balls ?? batsman.ballsFaced,
        };
      }
    }
  }

  // Prefer live squad data for bowler overs count
  let bowlerOvers = '0.0';
  if (bowlingSquad && bowler.name) {
    const squadPlayer = bowlingSquad.players.find(p => p.name === bowler.name);
    if (squadPlayer) {
      const ballsBowled = bowlingSquad.oversBowled?.[squadPlayer.id] || 0;
      bowlerOvers = `${ballsBowled}.0`;
    }
  }

  return (
    <View style={styles.container}>
      <PlayerPill player={resolvedBatsman} role="batsman" />
      <PlayerPill player={bowler}  role="bowler"  overs={bowlerOvers} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.sm,
    gap:               SPACE.sm,
  },
  pill: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLOURS.slate,
    borderRadius:    3,
    borderWidth:     1,
    overflow:        'hidden',
  },
  roleTag: {
    paddingHorizontal: SPACE.xs,
    paddingVertical:   SPACE.sm,
    alignItems:        'center',
    justifyContent:    'center',
    minWidth:          36,
  },
  roleText: {
    fontFamily:    FONTS.mono,
    fontSize:      8,
    letterSpacing: 1,
  },
  pillInfo: {
    flex:    1,
    padding: SPACE.sm,
  },
  playerName: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.sm,
    color:        COLOURS.cream,
    letterSpacing: 1,
  },
  playerStats: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  1,
  },
  skillBadge: {
    paddingHorizontal: SPACE.sm,
    paddingVertical:   SPACE.xs,
    alignItems:        'center',
    minWidth:          40,
  },
  skillNum: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    lineHeight:   24,
  },
  skillLbl: {
    fontFamily:   FONTS.mono,
    fontSize:     7,
    letterSpacing: 1,
  },
});
