// ─────────────────────────────────────────
//  AIDecisionBanner.js
//  Shows the AI's last decision after each ball.
//  Revealed after the roll — not before.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { BOWLING_VARIATIONS } from '../engine/bowlingEngine';
import { SHOT_CONFIG } from '../engine/diceEngine';

export const AIDecisionBanner = ({ aiDecision, gameMode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!aiDecision) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue:  1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [aiDecision]);

  if (!aiDecision || gameMode === 'manual') return null;

  const isBowling = gameMode === 'batting'; // AI bowls when player bats
  const isBatting = gameMode === 'bowling'; // AI bats when player bowls

  const accentColour = isBowling ? COLOURS.wicket : COLOURS.runs1;

  let choiceLabel = '';
  let choiceDetail = '';

  if (isBowling && aiDecision.variation) {
    const cfg = BOWLING_VARIATIONS[aiDecision.variation];
    choiceLabel  = `AI BOWLED: ${cfg?.label || aiDecision.variation.toUpperCase()}`;
    choiceDetail = aiDecision.reasoning || cfg?.description || '';
  } else if (isBatting && aiDecision.shot) {
    const cfg = SHOT_CONFIG[aiDecision.shot];
    choiceLabel  = `AI PLAYED: ${cfg?.display || aiDecision.shot.toUpperCase()} (${aiDecision.aggression?.toUpperCase()})`;
    choiceDetail = aiDecision.reasoning || '';
  }

  return (
    <Animated.View style={[styles.container, { borderLeftColor: accentColour, opacity: fadeAnim }]}>
      <View style={styles.row}>
        <Text style={styles.aiTag}>AI</Text>
        <View style={styles.content}>
          <Text style={[styles.choice, { color: accentColour }]}>{choiceLabel}</Text>
          <Text style={styles.reasoning} numberOfLines={1}>{choiceDetail}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor:  COLOURS.ink,
    borderLeftWidth:  3,
    marginHorizontal: SPACE.lg,
    marginBottom:     SPACE.sm,
    paddingVertical:  SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.06)',
    borderRadius:     3,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACE.sm,
  },
  aiTag: {
    fontFamily:      FONTS.display,
    fontSize:        SIZES.xs,
    letterSpacing:   3,
    color:           COLOURS.ink,
    backgroundColor: COLOURS.dot,
    paddingHorizontal: SPACE.xs,
    paddingVertical:   1,
    borderRadius:    2,
  },
  content: { flex: 1 },
  choice: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.sm,
    letterSpacing: 2,
    marginBottom: 2,
  },
  reasoning: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    lineHeight: 14,
  },
});
