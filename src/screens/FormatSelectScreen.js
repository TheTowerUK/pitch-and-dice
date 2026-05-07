// ═══════════════════════════════════════════════════════
//  FormatSelectScreen.js — choose match length before mode
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE, FORMAT_ORDER, FORMAT_PRESENTATION } from '../constants/theme';

export const FormatSelectScreen = ({ selectedFormat, onSelectFormat, onBack }) => {
  const [local, setLocal] = useState(selectedFormat || 'T20');

  const confirm = () => onSelectFormat(local);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.header}>
        <Text style={styles.logo}>PITCH & DICE</Text>
        <Text style={styles.subtitle}>CHOOSE FORMAT</Text>
        <Text style={styles.hint}>Length and atmosphere — same tactical engine for all</Text>
      </View>

      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backText}>← HOME</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {FORMAT_ORDER.map((key) => {
          const p = FORMAT_PRESENTATION[key];
          const sel = local === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.card, sel && styles.cardSelected]}
              onPress={() => setLocal(key)}
              activeOpacity={0.85}
            >
              <View style={[styles.accent, { backgroundColor: sel ? COLOURS.gold : COLOURS.slateMid }]} />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, sel && { color: COLOURS.gold }]}>{p.headline}</Text>
                <Text style={styles.cardDesc}>{p.setupSummary}</Text>
              </View>
              {sel && (
                <View style={styles.tick}>
                  <Text style={styles.tickText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.primaryBtn} onPress={confirm} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>CONTINUE →</Text>
          <Text style={styles.primaryBtnSub}>Next: choose how you want to play</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLOURS.ink },
  header:   { alignItems: 'center', paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  logo:     { fontFamily: FONTS.display, fontSize: 36, letterSpacing: 6, color: COLOURS.gold },
  subtitle: { fontFamily: FONTS.display, fontSize: SIZES.lg, color: COLOURS.cream, letterSpacing: 4, marginTop: SPACE.sm },
  hint:     { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 1, marginTop: SPACE.xs, textAlign: 'center' },
  backBtn:  { alignSelf: 'flex-start', marginLeft: SPACE.lg, marginTop: SPACE.md, padding: SPACE.xs },
  backText: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.gold, letterSpacing: 2 },
  scroll:   { padding: SPACE.lg, paddingBottom: SPACE.xxl, gap: SPACE.md },

  card: {
    flexDirection:     'row',
    alignItems:        'stretch',
    backgroundColor:   COLOURS.slate,
    borderRadius:      4,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.08)',
    overflow:          'hidden',
  },
  cardSelected: {
    borderColor:     COLOURS.gold,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  accent: { width: 4 },
  cardBody: { flex: 1, padding: SPACE.lg },
  cardTitle: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 2,
    color:         COLOURS.cream,
    marginBottom:  SPACE.xs,
  },
  cardDesc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    lineHeight: 18,
  },
  tick: {
    width:          44,
    alignItems:     'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(212,160,23,0.25)',
  },
  tickText: { fontSize: 22, color: COLOURS.gold },

  primaryBtn: {
    marginTop:         SPACE.lg,
    backgroundColor:   COLOURS.gold,
    borderRadius:      4,
    paddingVertical:   SPACE.lg,
    alignItems:        'center',
  },
  primaryBtnText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 4,
    color:         COLOURS.ink,
  },
  primaryBtnSub: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.ink,
    opacity:    0.65,
    marginTop:  SPACE.xs,
  },
});
