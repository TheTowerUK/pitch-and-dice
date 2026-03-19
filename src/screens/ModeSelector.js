// ═══════════════════════════════════════════════════════
//  ModeSelector.js
//  First screen shown on new match.
//  Choose Manual Mode or Play Mode (bat or bowl).
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

const ModeCard = ({ title, subtitle, description, selected, onPress, accent }) => (
  <TouchableOpacity
    style={[styles.card, selected && { borderColor: accent, backgroundColor: accent + '15' }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.cardAccent, { backgroundColor: accent }]} />
    <View style={styles.cardContent}>
      <Text style={[styles.cardTitle, selected && { color: accent }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.cardSubtitle, selected && { color: accent, opacity: 0.8 }]}>
          {subtitle}
        </Text>
      )}
      <Text style={styles.cardDesc}>{description}</Text>
    </View>
    {selected && (
      <View style={[styles.selectedBadge, { backgroundColor: accent }]}>
        <Text style={styles.selectedText}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

export const ModeSelector = ({ onConfirm, format }) => {
  const [mode, setMode] = useState(null);

  const canConfirm = mode !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.header}>
        <Text style={styles.logo}>PITCH & DICE</Text>
        <Text style={styles.formatBadge}>{format}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>SELECT GAME MODE</Text>

        {/* Manual Mode */}
        <ModeCard
          title="MANUAL MODE"
          subtitle="FULL CONTROL"
          description="Choose both batting shots and bowling variations every ball. Play as strategist for both sides."
          selected={mode === 'manual'}
          onPress={() => setMode('manual')}
          accent={COLOURS.gold}
        />

        <Text style={styles.orDivider}>— OR PLAY A SIDE —</Text>

        {/* Play — Bat */}
        <ModeCard
          title="PLAY MODE"
          subtitle="YOU BAT"
          description="Choose your shots every ball. The AI bowls situationally — varying deliveries based on match conditions."
          selected={mode === 'batting'}
          onPress={() => setMode('batting')}
          accent={COLOURS.runs1}
        />

        {/* Play — Bowl */}
        <ModeCard
          title="PLAY MODE"
          subtitle="YOU BOWL"
          description="Choose your bowling variation every ball. The AI bats intelligently based on the match situation."
          selected={mode === 'bowling'}
          onPress={() => setMode('bowling')}
          accent={COLOURS.wicket}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={() => canConfirm && onConfirm(mode)}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, !canConfirm && { color: COLOURS.dot }]}>
            {mode === null ? 'SELECT A MODE' : 'CONTINUE →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.slate },

  header: {
    backgroundColor:   COLOURS.ink,
    paddingHorizontal: SPACE.xl,
    paddingVertical:   SPACE.lg,
    borderBottomWidth: 3,
    borderBottomColor: COLOURS.gold,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  logo: {
    fontFamily:   FONTS.display,
    fontSize:     28,
    letterSpacing: 5,
    color:        COLOURS.gold,
  },
  formatBadge: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    letterSpacing: 3,
    color:        COLOURS.gold,
    borderWidth:  1,
    borderColor:  COLOURS.gold,
    paddingVertical:   SPACE.xs,
    paddingHorizontal: SPACE.md,
  },

  body: {
    flex:    1,
    padding: SPACE.lg,
  },
  sectionTitle: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
    marginBottom: SPACE.lg,
    textAlign:    'center',
  },

  card: {
    backgroundColor: COLOURS.ink,
    borderRadius:    4,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    marginBottom:    SPACE.md,
    flexDirection:   'row',
    overflow:        'hidden',
    minHeight:       80,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex:    1,
    padding: SPACE.md,
  },
  cardTitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    color:        COLOURS.cream,
    letterSpacing: 3,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.sm,
    color:        COLOURS.dot,
    letterSpacing: 2,
    marginBottom: SPACE.xs,
  },
  cardDesc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    lineHeight: 16,
  },
  selectedBadge: {
    width:          32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.lg,
    color:      COLOURS.white,
  },

  orDivider: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
    textAlign:    'center',
    marginVertical: SPACE.sm,
  },

  footer: {
    padding:          SPACE.lg,
    backgroundColor:  COLOURS.ink,
    borderTopWidth:   1,
    borderTopColor:   'rgba(255,255,255,0.07)',
  },
  confirmBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    4,
    paddingVertical: SPACE.lg,
    alignItems:      'center',
  },
  confirmBtnDisabled: {
    backgroundColor: COLOURS.slateMid,
  },
  confirmText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    letterSpacing: 5,
    color:        COLOURS.ink,
  },
});
