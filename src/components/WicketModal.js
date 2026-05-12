// ─────────────────────────────────────────
//  WicketModal.js
//  Dramatic wicket reveal with DRS challenge.
//  DRS available on LBW only — one review
//  per innings, D6 resolution.
// ─────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { rollDie } from '../engine/diceEngine';
import { playSoundForDRS } from '../engine/soundEngine';
import { AnimatedMatchModal } from './animated/AnimatedMatchModal';

// ─────────────────────────────────────────
//  DRS RESOLUTION
// ─────────────────────────────────────────
const resolveDRS = () => {
  const roll = rollDie(6);
  if (roll <= 2) return {
    roll,
    outcome:  'upheld',
    label:    'WICKET STANDS',
    detail:   'Umpire\'s decision upheld. Hitting the stumps. OUT!',
    colour:   COLOURS.red,
    icon:     '📺',
    overturned: false,
    reviewLost: true,
  };
  if (roll <= 4) return {
    roll,
    outcome:  'umpires_call',
    label:    'UMPIRE\'S CALL',
    detail:   'Ball-tracking shows umpire\'s call. Decision stands.',
    colour:   COLOURS.boundary,
    icon:     '⚖️',
    overturned: false,
    reviewLost: true,
  };
  return {
    roll,
    outcome:  'overturned',
    label:    'NOT OUT!',
    detail:   'Overturned! Ball missing the stumps. Batsman survives!',
    colour:   COLOURS.runs1,
    icon:     '✅',
    overturned: true,
    reviewLost: false,
  };
};

export const WicketModal = ({ visible, wicket, drsReviews, onConfirm, onDRS, captureMode = false }) => {
  const drsAnim   = useRef(new Animated.Value(0)).current;
  const [drsResult, setDrsResult]     = useState(null);
  const [reviewing,  setReviewing]    = useState(false);

  useEffect(() => {
    if (visible && wicket) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDrsResult(null);
      setReviewing(false);
    }
  }, [visible, wicket]);

  const handleReview = () => {
    setReviewing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Dramatic pause before revealing
    setTimeout(() => {
      const result = resolveDRS();
      setDrsResult(result);
      drsAnim.setValue(0);
      Animated.spring(drsAnim, {
        toValue: 1, friction: 6, tension: 100, useNativeDriver: true,
      }).start();

      if (result.overturned) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSoundForDRS(true);   // sarcastic cheer
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playSoundForDRS(false);  // drs_lose groan
      }
    }, 1200);
  };

  const handleContinue = () => {
    onConfirm(drsResult);
  };

  if (!visible || !wicket) return null;

  const canDRS     = wicket.drs && drsReviews > 0 && !drsResult;
  const showDRS    = wicket.drs;

  return (
    <AnimatedMatchModal
      visible={visible}
      type="wicket"
      overlayStyle={styles.overlay}
      cardStyle={styles.card}
      captureMode={captureMode}
    >

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>WICKET!</Text>
          </View>

          {/* Die roll */}
          <View style={styles.dieRow}>
            <View style={styles.diePip}>
              <Text style={styles.dieVal}>{wicket.roll}</Text>
              <Text style={styles.dieLabel}>D6</Text>
            </View>
          </View>

          {/* Dismissal type */}
          <Text style={styles.wicketType}>{wicket.type}</Text>
          <Text style={styles.detail}>{wicket.detail}</Text>

          {/* DRS review result */}
          {reviewing && !drsResult && (
            <View style={styles.drsReviewing}>
              <Text style={styles.drsReviewingText}>📺  REVIEWING...</Text>
            </View>
          )}

          {drsResult && (
            <Animated.View style={[
              styles.drsResult,
              { borderColor: drsResult.colour, opacity: drsAnim,
                transform: [{ scale: drsAnim }] },
            ]}>
              <Text style={styles.drsIcon}>{drsResult.icon}</Text>
              <Text style={[styles.drsLabel, { color: drsResult.colour }]}>
                {drsResult.label}
              </Text>
              <Text style={styles.drsDetail}>{drsResult.detail}</Text>
              <View style={styles.drsDie}>
                <Text style={styles.drsDieVal}>{drsResult.roll}</Text>
                <Text style={styles.drsDieLabel}>D6</Text>
              </View>
              {!drsResult.reviewLost && (
                <Text style={styles.drsReviewSaved}>Review retained</Text>
              )}
            </Animated.View>
          )}

          {/* DRS badge — shown when eligible */}
          {showDRS && !reviewing && (
            <View style={[
              styles.drsBadge,
              !canDRS && styles.drsBadgeUsed,
            ]}>
              <Text style={[styles.drsText, !canDRS && { color: COLOURS.dot }]}>
                {canDRS
                  ? `⚡ DRS AVAILABLE · ${drsReviews} review${drsReviews !== 1 ? 's' : ''} remaining`
                  : '📺 DRS UNAVAILABLE — no reviews left'
                }
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {canDRS && !reviewing && (
              <TouchableOpacity
                style={styles.drsBtn}
                onPress={handleReview}
                activeOpacity={0.8}
              >
                <Text style={styles.drsBtnText}>REVIEW →</Text>
              </TouchableOpacity>
            )}

            {(!reviewing || drsResult) && (
              <TouchableOpacity
                style={[
                  styles.continueBtn,
                  drsResult?.overturned && { backgroundColor: COLOURS.runs1 },
                ]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueBtnText}>
                  {drsResult?.overturned ? 'NOT OUT — CONTINUE →' : 'ACCEPT — CONTINUE →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

    </AnimatedMatchModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         SPACE.xl,
  },
  card: {
    backgroundColor: COLOURS.ink,
    borderWidth:     2,
    borderColor:     COLOURS.wicket,
    borderRadius:    6,
    width:           '100%',
    maxWidth:        380,
    overflow:        'hidden',
  },
  header: {
    backgroundColor: COLOURS.wicket,
    width:           '100%',
    alignItems:      'center',
    paddingVertical: SPACE.md,
  },
  title: {
    fontFamily:    FONTS.display,
    fontSize:      36,
    letterSpacing: 8,
    color:         COLOURS.white,
  },
  dieRow: {
    paddingVertical: SPACE.lg,
    alignItems:      'center',
  },
  diePip: {
    width:           96,
    height:          96,
    borderRadius:    12,
    borderWidth:     2,
    borderColor:     COLOURS.wicket,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(142,68,173,0.12)',
    paddingVertical: 8,
  },
  dieVal: {
    fontFamily: FONTS.display,
    fontSize:   40,
    color:      COLOURS.wicket,
    lineHeight: 44,
  },
  dieLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 2,
    marginTop:     2,
  },
  wicketType: {
    fontFamily:        FONTS.display,
    fontSize:          SIZES.xxl,
    color:             COLOURS.cream,
    letterSpacing:     3,
    textAlign:         'center',
    paddingHorizontal: SPACE.lg,
    marginBottom:      SPACE.sm,
  },
  detail: {
    fontFamily:        FONTS.mono,
    fontSize:          SIZES.sm,
    color:             COLOURS.dot,
    textAlign:         'center',
    lineHeight:        20,
    paddingHorizontal: SPACE.xl,
    marginBottom:      SPACE.md,
  },

  // DRS
  drsBadge: {
    backgroundColor:   'rgba(212,160,23,0.1)',
    borderWidth:       1,
    borderColor:       COLOURS.gold,
    marginHorizontal:  SPACE.lg,
    marginBottom:      SPACE.md,
    paddingVertical:   SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius:      3,
    alignItems:        'center',
  },
  drsBadgeUsed: {
    backgroundColor: 'rgba(127,140,141,0.1)',
    borderColor:     COLOURS.dot,
  },
  drsText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.sm,
    color:         COLOURS.gold,
    letterSpacing: 2,
  },

  drsReviewing: {
    alignItems:    'center',
    paddingVertical: SPACE.lg,
    marginBottom:  SPACE.md,
  },
  drsReviewingText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    color:         COLOURS.gold,
    letterSpacing: 3,
  },

  drsResult: {
    marginHorizontal: SPACE.lg,
    marginBottom:     SPACE.md,
    padding:          SPACE.lg,
    borderWidth:      2,
    borderRadius:     4,
    alignItems:       'center',
    backgroundColor:  COLOURS.slate,
  },
  drsIcon: {
    fontSize:     28,
    marginBottom: SPACE.xs,
  },
  drsLabel: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xxl,
    letterSpacing: 3,
    marginBottom:  SPACE.xs,
    textAlign:     'center',
  },
  drsDetail: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    textAlign:    'center',
    lineHeight:   16,
    marginBottom: SPACE.sm,
  },
  drsDie: {
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius:    6,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.md,
    marginBottom:    SPACE.xs,
  },
  drsDieVal: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.xxl,
    color:      COLOURS.cream,
  },
  drsDieLabel: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 2,
  },
  drsReviewSaved: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.runs1,
    letterSpacing: 1,
  },

  // Buttons
  btnRow: {
    padding: SPACE.lg,
    gap:     SPACE.sm,
  },
  drsBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    3,
    paddingVertical: SPACE.md,
    alignItems:      'center',
  },
  drsBtnText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    letterSpacing: 4,
    color:         COLOURS.ink,
  },
  continueBtn: {
    backgroundColor: COLOURS.wicket,
    borderRadius:    3,
    paddingVertical: SPACE.md,
    alignItems:      'center',
  },
  continueBtnText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.md,
    letterSpacing: 3,
    color:         COLOURS.white,
  },
});