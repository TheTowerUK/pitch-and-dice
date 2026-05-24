// ─────────────────────────────────────────
//  Commentary.js
//  Scrollable ball-by-ball commentary feed
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { COMPACT_COMMENTARY_HEIGHT } from '../constants/compactMatchLayout';

const CMT_COLOURS = {
  normal:   COLOURS.cream,
  wicket:   '#e056fd',
  four:     COLOURS.boundary,
  six:      COLOURS.six,
  hi:       COLOURS.gold,
  momentum: '#f0c040',
  pressure: '#e67e22',
};

const CommentaryEntry = ({ entry, compact = false, stageLarge = false }) => (
  <View style={[styles.entry, compact && styles.entryCompact]}>
    <Text style={[styles.ball, stageLarge && styles.ballLarge]}>{entry.ball}</Text>
    <Text
      style={[
        styles.text,
        compact && styles.textCompact,
        stageLarge && styles.textLarge,
        { color: CMT_COLOURS[entry.style] || COLOURS.cream },
      ]}
      numberOfLines={compact ? 2 : undefined}
    >
      {entry.text}
    </Text>
  </View>
);

export const Commentary = ({ commentary, compact = false, compactHeight, stageLarge = false }) => {
  if (compact) {
    const latest = commentary.length > 0 ? commentary[commentary.length - 1] : null;
    return (
      <View
        style={[
          styles.container,
          styles.containerCompact,
          compactHeight != null && { height: compactHeight },
        ]}
      >
        <Text style={[styles.header, stageLarge && styles.headerLarge]}>COMMENTARY</Text>
        <View style={[styles.compactBody, stageLarge && styles.compactBodyLarge]}>
          {latest ? (
            <CommentaryEntry entry={latest} compact stageLarge={stageLarge} />
          ) : (
            <View style={styles.entry}>
              <Text style={[styles.ball, stageLarge && styles.ballLarge]}>MATCH START</Text>
              <Text
                style={[styles.text, styles.textCompact, stageLarge && styles.textLarge, { color: COLOURS.gold }]}
                numberOfLines={2}
              >
                The players take the field. Choose your shot and roll.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

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
  containerCompact: {
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: 0,
    marginBottom: SPACE.sm,
    height: COMPACT_COMMENTARY_HEIGHT,
  },
  compactBody: {
    flex: 1,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    justifyContent: 'center',
    overflow: 'hidden',
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
  entryCompact: {
    paddingVertical: 0,
    borderBottomWidth: 0,
  },
  textCompact: {
    fontSize: SIZES.xs,
    lineHeight: 16,
  },
  headerLarge: {
    paddingVertical: SPACE.sm,
    fontSize: SIZES.sm,
  },
  compactBodyLarge: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
  },
  ballLarge: {
    fontSize: SIZES.xs,
  },
  textLarge: {
    fontSize: SIZES.sm,
    lineHeight: 20,
  },
});
