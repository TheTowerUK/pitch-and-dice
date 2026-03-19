// ─────────────────────────────────────────
//  SpecialEventModal.js
//  Dramatic D20 special event reveal.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import * as Haptics from 'expo-haptics';

export const SpecialEventModal = ({ visible, event, onConfirm }) => {
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && event) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scaleAnim.setValue(0.7);
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.05, friction: 5, tension: 120, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1,    friction: 8, tension: 80,  useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!event) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* D20 badge */}
          <View style={styles.dieBadge}>
            <Text style={styles.dieLabel}>D20</Text>
            <Text style={styles.dieVal}>{event.roll}</Text>
          </View>

          {/* Event icon */}
          <Text style={styles.eventIcon}>{event.icon}</Text>

          {/* Event title */}
          <Text style={styles.eventTitle}>{event.label}</Text>

          {/* Description */}
          <Text style={styles.eventDesc}>{event.description}</Text>

          {/* Flavour */}
          <Text style={styles.eventFlavour}>{event.flavour}</Text>

          {/* Effect */}
          <View style={styles.effectBox}>
            <Text style={styles.effectLabel}>EFFECT</Text>
            <Text style={styles.effectText}>{event.effect.message}</Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={styles.btnText}>CONTINUE →</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xl,
  },
  card: {
    backgroundColor: COLOURS.ink,
    borderWidth: 2,
    borderColor: COLOURS.gold,
    borderRadius: 8,
    padding: SPACE.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  dieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLOURS.slateMid,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.md,
    borderRadius: 3,
    marginBottom: SPACE.lg,
  },
  dieLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 2,
  },
  dieVal: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xxl,
    color: COLOURS.gold,
    letterSpacing: 2,
  },
  eventIcon: {
    fontSize: 52,
    marginBottom: SPACE.md,
  },
  eventTitle: {
    fontFamily: FONTS.display,
    fontSize: 28,
    letterSpacing: 4,
    color: COLOURS.gold,
    textAlign: 'center',
    marginBottom: SPACE.sm,
  },
  eventDesc: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACE.sm,
  },
  eventFlavour: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: SPACE.lg,
  },
  effectBox: {
    backgroundColor: 'rgba(212,160,23,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    borderRadius: 3,
    padding: SPACE.md,
    width: '100%',
    marginBottom: SPACE.lg,
  },
  effectLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 3,
    marginBottom: SPACE.xs,
  },
  effectText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    color: COLOURS.gold,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: COLOURS.gold,
    borderRadius: 3,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xxl,
  },
  btnText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    letterSpacing: 4,
    color: COLOURS.ink,
  },
});
