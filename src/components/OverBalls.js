// ─────────────────────────────────────────
//  OverBalls.js
//  Coloured pip display for the current over
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { getBallPipStyle } from '../engine/diceEngine';

const PIP_COLOURS = {
  empty:   { bg: COLOURS.slateMid,  text: COLOURS.dot },
  dot:     { bg: '#2e2e2e',         text: COLOURS.dot },
  one:     { bg: COLOURS.runs1,     text: COLOURS.white },
  two:     { bg: COLOURS.runs2,     text: COLOURS.white },
  three:   { bg: COLOURS.runs3,     text: COLOURS.white },
  four:    { bg: COLOURS.boundary,  text: COLOURS.white },
  six:     { bg: COLOURS.six,       text: COLOURS.white },
  wicket:  { bg: COLOURS.wicket,    text: COLOURS.white },
};

const PIP_LABEL = {
  empty: '', dot: '•', one: '1', two: '2',
  three: '3', four: '4', six: '6', wicket: 'W',
};

const Pip = ({ ballResult, compact, stageLarge }) => {
  const pipStyle = getBallPipStyle(ballResult);
  const { bg, text } = PIP_COLOURS[pipStyle];
  return (
    <View style={[styles.pip, compact && styles.pipCompact, stageLarge && styles.pipLarge, { backgroundColor: bg }]}>
      <Text style={[styles.pipText, { color: text }]}>
        {PIP_LABEL[pipStyle]}
      </Text>
    </View>
  );
};

export const OverBalls = ({ overBalls, compact = false, stageLarge = false }) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact, stageLarge && styles.containerLarge]}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <Pip key={i} ballResult={overBalls[i] || null} compact={compact} stageLarge={stageLarge} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  containerCompact: {
    paddingVertical: SPACE.xs,
  },
  container: {
    flexDirection: 'row',
    gap: SPACE.xs,
    justifyContent: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    backgroundColor: COLOURS.ink,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pipCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  containerLarge: {
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.xl,
    gap: SPACE.sm,
  },
  pipLarge: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  pip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pipText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    fontWeight: '500',
  },
});
