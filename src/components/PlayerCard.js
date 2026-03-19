// ─────────────────────────────────────────
//  PlayerCard.js
//  Compact in-game display of active
//  batsman and bowler with skill ratings.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { getSkillColour, getSkillLabel } from '../engine/playerEngine';

const PlayerPill = ({ player, role }) => {
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
            : `${player.wickets || 0}wkt (${player.ballsBowled || 0}b)`
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

export const PlayerCard = ({ batsman, bowler }) => {
  if (!batsman || !bowler) return null;

  return (
    <View style={styles.container}>
      <PlayerPill player={batsman} role="batsman" />
      <PlayerPill player={bowler}  role="bowler" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    backgroundColor: COLOURS.ink,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOURS.slate,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  roleTag: {
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  roleText: {
    fontFamily: FONTS.display,
    fontSize: 10,
    letterSpacing: 1,
  },
  pillInfo: {
    flex: 1,
    paddingHorizontal: SPACE.xs,
    paddingVertical: SPACE.xs,
  },
  playerName: {
    fontFamily: FONTS.display,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
    letterSpacing: 1,
  },
  playerStats: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLOURS.dot,
    marginTop: 1,
  },
  skillBadge: {
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    alignItems: 'center',
  },
  skillNum: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    lineHeight: 20,
  },
  skillLbl: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    letterSpacing: 1,
  },
});
