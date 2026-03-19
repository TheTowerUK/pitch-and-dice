// ═══════════════════════════════════════════════════════
//  HomeScreen.js
//  Main landing page. Entry point before any match.
//  Shows New Match, Continue (if saved), Match History.
// ═══════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export const HomeScreen = ({ onNewMatch, onContinue, onHistory, hasResumableMatch }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      {/* Background grid texture */}
      <View style={styles.bgGrid} pointerEvents="none" />

      <View style={styles.container}>

        {/* Logo section */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoPitch}>PITCH</Text>
            <Text style={styles.logoAmp}>&</Text>
            <Text style={styles.logoDice}>DICE</Text>
          </View>
          <Text style={styles.tagline}>STRATEGIC CRICKET · DICE MECHANICS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Menu options */}
        <View style={styles.menuSection}>

          <TouchableOpacity style={styles.primaryBtn} onPress={onNewMatch} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>NEW MATCH</Text>
            <Text style={styles.primaryBtnSub}>Choose teams and format</Text>
          </TouchableOpacity>

          {hasResumableMatch && (
            <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
              <View style={styles.continueDot} />
              <View style={styles.continueTxt}>
                <Text style={styles.continueBtnText}>CONTINUE MATCH</Text>
                <Text style={styles.continueBtnSub}>Resume your saved game</Text>
              </View>
              <Text style={styles.continueArrow}>→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={onHistory} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>MATCH HISTORY</Text>
            <Text style={styles.secondaryBtnSub}>Last 5 matches</Text>
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PHASE 4 · EXPO SDK 54</Text>
          <View style={styles.footerDots}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.footerDot} />
            ))}
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.ink },

  bgGrid: {
    position:    'absolute',
    inset:       0,
    opacity:     0.04,
    borderWidth: 0,
    // Simulated grid via nested views not possible simply — kept as tinted bg
    backgroundColor: COLOURS.gold,
  },

  container: {
    flex:           1,
    paddingHorizontal: SPACE.xl,
    justifyContent: 'space-between',
    paddingVertical: SPACE.xl,
  },

  // ── Logo ──────────────────────────────
  logoSection: { alignItems: 'center', marginTop: SPACE.xxl },
  logoBox: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:            SPACE.sm,
    marginBottom:   SPACE.md,
  },
  logoPitch: {
    fontFamily:   FONTS.display,
    fontSize:     52,
    letterSpacing: 6,
    color:        COLOURS.cream,
  },
  logoAmp: {
    fontFamily:   FONTS.display,
    fontSize:     36,
    color:        COLOURS.gold,
    letterSpacing: 2,
  },
  logoDice: {
    fontFamily:   FONTS.display,
    fontSize:     52,
    letterSpacing: 6,
    color:        COLOURS.gold,
  },
  tagline: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
    textAlign:    'center',
    marginBottom: SPACE.xl,
  },
  dividerLine: {
    width:           60,
    height:          2,
    backgroundColor: COLOURS.gold,
    opacity:         0.4,
  },

  // ── Menu ──────────────────────────────
  menuSection: { gap: SPACE.md },

  primaryBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    4,
    paddingVertical: SPACE.xl,
    paddingHorizontal: SPACE.xl,
    alignItems:      'center',
    shadowColor:     COLOURS.gold,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.3,
    shadowRadius:    12,
    elevation:       8,
  },
  primaryBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xxl,
    letterSpacing: 5,
    color:        COLOURS.ink,
  },
  primaryBtnSub: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.ink,
    opacity:      0.6,
    letterSpacing: 1,
    marginTop:    SPACE.xs,
  },

  continueBtn: {
    backgroundColor: 'rgba(212,160,23,0.1)',
    borderRadius:    4,
    borderWidth:     1,
    borderColor:     COLOURS.gold,
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.xl,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACE.md,
  },
  continueDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: COLOURS.runs1,
  },
  continueTxt:     { flex: 1 },
  continueBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 3,
    color:        COLOURS.gold,
  },
  continueBtnSub: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  2,
  },
  continueArrow: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.xl,
    color:      COLOURS.gold,
  },

  secondaryBtn: {
    backgroundColor: COLOURS.slateMid,
    borderRadius:    4,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.xl,
    alignItems:      'center',
  },
  secondaryBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 4,
    color:        COLOURS.cream,
  },
  secondaryBtnSub: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  SPACE.xs,
  },

  // ── Footer ────────────────────────────
  footer: { alignItems: 'center', gap: SPACE.sm },
  footerText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    opacity:      0.4,
    letterSpacing: 2,
  },
  footerDots: {
    flexDirection: 'row',
    gap:           SPACE.xs,
  },
  footerDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: COLOURS.dot,
    opacity:         0.3,
  },
});
