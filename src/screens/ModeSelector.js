// ═══════════════════════════════════════════════════════
//  ModeSelector.js
//  First screen shown on new match.
//  Choose Manual Mode or Play Mode (bat or bowl).
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

const ModeCard = ({ title, subtitle, description, selected, onPress, accent }) => (
  <TouchableOpacity
    style={[
      styles.card,
      selected && [
        styles.cardSelected,
        {
          borderColor: accent,
          shadowColor: accent,
        },
      ],
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.cardAccent, { backgroundColor: accent }]} />
    <View style={styles.cardContent}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>{title}</Text>
        {selected && (
          <View style={[styles.selectedPill, { borderColor: accent }]}>
            <Text style={styles.selectedPillText}>SELECTED</Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text style={styles.cardSubtitle}>
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

export const ModeSelector = ({ onConfirm, onBack, format }) => {
  const [mode, setMode] = useState(null);

  const canConfirm = mode !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.header}>
        <Text style={styles.logo}>PITCH & DICE</Text>
        <Text style={styles.subtitle}>{format} · SELECT MODE</Text>
      </View>

      {/* Back button sits below header, clear of the logo */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backText}>← BACK TO HOME</Text>
      </TouchableOpacity>

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
          <Text style={[styles.confirmText, !canConfirm && { color: COLOURS.gold }]}>
            {mode === null ? 'SELECT A MODE' : 'CONTINUE →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.slate },
  backBtn: {
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.md,
    alignSelf:         'flex-start',
  },
  backText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.md,
    letterSpacing: 2,
    color:         COLOURS.dot,
  },

  header: {
    backgroundColor:   COLOURS.ink,
    paddingHorizontal: SPACE.xl,
    paddingVertical:   SPACE.lg,
    borderBottomWidth: 3,
    borderBottomColor: COLOURS.gold,
    alignItems:        'center',
  },
  logo: {
    fontFamily:    FONTS.display,
    fontSize:      28,
    letterSpacing: 5,
    color:         COLOURS.gold,
  },
  subtitle: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 2,
    marginTop:     SPACE.xs,
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
  cardSelected: {
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ scale: 1.03 }],
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex:    1,
    padding: SPACE.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
  },
  cardTitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    color:        COLOURS.white,
    letterSpacing: 3,
    marginBottom: 2,
    flex: 1,
  },
  cardSubtitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.sm,
    color:        COLOURS.white,
    letterSpacing: 2,
    marginBottom: SPACE.xs,
    opacity: 0.95,
  },
  cardDesc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    lineHeight: 16,
  },
  selectedPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  selectedPillText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: COLOURS.white,
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

  footer: {},
  confirmBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    4,
    paddingVertical: SPACE.lg,
    alignItems:      'center',
    width:           '100%',
    shadowColor:     COLOURS.gold,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    8,
    elevation:       6,
  },
  confirmBtnDisabled: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     COLOURS.gold,
    shadowOpacity:   0,
    elevation:       0,
  },
  confirmText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    letterSpacing: 5,
    color:        COLOURS.ink,
  },
});