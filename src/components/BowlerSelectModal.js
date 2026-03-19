// ─────────────────────────────────────────
//  BowlerSelectModal.js
//  Choose which bowler bowls the next over.
//  Shows available bowlers with overs remaining.
// ─────────────────────────────────────────

import React, { useRef, useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  Animated, ScrollView, StyleSheet,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { getAvailableBowlers, getStrikeRate } from '../engine/teamEngine';
import { ROLE_CONFIG } from '../engine/teamsData';

export const BowlerSelectModal = ({
  visible, bowlingSquad, format,
  currentOver, onConfirm,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      scaleAnim.setValue(0.9);
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 7, tension: 80, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!bowlingSquad) return null;

  const maxOvers = { T20: 4, ODI: 10, Test: 999 }[format] || 4;
  const available = getAvailableBowlers(bowlingSquad, format);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          <Text style={styles.title}>CHOOSE BOWLER</Text>
          <Text style={styles.sub}>OVER {currentOver + 1}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {available.length === 0 && (
              <Text style={styles.emptyText}>No bowlers available — rotate your attack.</Text>
            )}
            {available.map(({ player, idx }) => {
              const bowled  = bowlingSquad.oversBowled[player.id] || 0;
              const remaining = maxOvers - bowled;
              const role    = ROLE_CONFIG[player.role];
              const isSel   = selected === idx;

              return (
                <TouchableOpacity
                  key={player.id}
                  style={[styles.bowlerRow, isSel && styles.bowlerRowSelected]}
                  onPress={() => setSelected(idx)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleBadge, { backgroundColor: role.colour + '33' }]}>
                    <Text style={[styles.roleText, { color: role.colour }]}>{role.label}</Text>
                  </View>

                  <View style={styles.bowlerInfo}>
                    <Text style={[styles.bowlerName, isSel && { color: COLOURS.gold }]}>
                      {player.name}
                    </Text>
                    <Text style={styles.bowlerStats}>
                      Skill {player.bowlingSkill} · {bowled} ov bowled · {remaining} remaining
                    </Text>
                  </View>

                  <View style={[styles.skillCircle, isSel && { borderColor: COLOURS.gold }]}>
                    <Text style={[styles.skillNum, isSel && { color: COLOURS.gold }]}>
                      {player.bowlingSkill}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmBtn, selected === null && styles.confirmBtnDisabled]}
            onPress={() => selected !== null && onConfirm(selected)}
            disabled={selected === null}
            activeOpacity={0.85}
          >
            <Text style={[styles.confirmText, selected === null && { color: COLOURS.dot }]}>
              {selected !== null
                ? `BOWL — ${bowlingSquad.players[selected]?.name.toUpperCase()}`
                : 'SELECT A BOWLER'}
            </Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLOURS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
  card: {
    backgroundColor: COLOURS.ink,
    borderWidth:     2,
    borderColor:     COLOURS.pitchLight,
    borderRadius:    6,
    padding:         SPACE.xl,
    width:           '100%',
    maxWidth:        400,
    maxHeight:       '85%',
  },
  title: {
    fontFamily:   FONTS.display,
    fontSize:     28,
    letterSpacing: 4,
    color:        COLOURS.gold,
    marginBottom: SPACE.xs,
  },
  sub: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
    marginBottom: SPACE.lg,
  },
  list: { maxHeight: 320, marginBottom: SPACE.lg },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.dot,
    textAlign:  'center',
    padding:    SPACE.lg,
  },
  bowlerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    borderRadius:    3,
    gap:             SPACE.sm,
  },
  bowlerRowSelected: {
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderColor:     COLOURS.gold,
    borderWidth:     1,
    borderBottomWidth: 1,
  },
  roleBadge: {
    paddingHorizontal: SPACE.xs,
    paddingVertical:   2,
    borderRadius:      2,
    minWidth:          36,
    alignItems:        'center',
  },
  roleText: {
    fontFamily:   FONTS.mono,
    fontSize:     8,
    letterSpacing: 1,
  },
  bowlerInfo: { flex: 1 },
  bowlerName: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    color:        COLOURS.cream,
    letterSpacing: 1,
  },
  bowlerStats: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  2,
  },
  skillCircle: {
    width:          36,
    height:         36,
    borderRadius:   18,
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.15)',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: COLOURS.slate,
  },
  skillNum: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.lg,
    color:      COLOURS.cream,
  },
  confirmBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    3,
    paddingVertical: SPACE.md,
    alignItems:      'center',
  },
  confirmBtnDisabled: { backgroundColor: COLOURS.slateMid },
  confirmText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    letterSpacing: 3,
    color:        COLOURS.ink,
  },
});
