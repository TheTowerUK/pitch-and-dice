// ─────────────────────────────────────────
//  Commentary.js
//  Scrollable ball-by-ball commentary feed
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

const CMT_COLOURS = {
  normal:   COLOURS.cream,
  wicket:   '#e056fd',
  four:     COLOURS.boundary,
  six:      COLOURS.six,
  hi:       COLOURS.gold,
  momentum: '#f0c040',
  pressure: '#e67e22',
};

const CommentaryEntry = ({ entry }) => (
  <View style={styles.entry}>
    <Text style={styles.ball}>{entry.ball}</Text>
    <Text style={[styles.text, { color: CMT_COLOURS[entry.style] || COLOURS.cream }]}>
      {entry.text}
    </Text>
  </View>
);

export const Commentary = ({ commentary }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>COMMENTARY</Text>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {commentary.length === 0 && (
          <View style={styles.entry}>
            <Text style={styles.ball}>MATCH START</Text>
            <Text style={[styles.text, { color: COLOURS.gold }]}>
              The players take the field. Choose your shot and roll.
            </Text>
          </View>
        )}
        {commentary.map((entry, i) => (
          <CommentaryEntry key={i} entry={entry} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.lg,
    backgroundColor: COLOURS.ink,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  header: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 3,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  scroll: { flex: 1, padding: SPACE.sm },
  entry: {
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  ball: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLOURS.dot,
    letterSpacing: 2,
    marginBottom: 2,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    lineHeight: 18,
  },
});
