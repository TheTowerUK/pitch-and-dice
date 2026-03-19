// ─────────────────────────────────────────
//  WicketModal.js
//  D6 sub-roll dismissal modal
// ─────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { resolveWicket } from '../engine/diceEngine';

export const WicketModal = ({ visible, onConfirm }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [wicket, setWicket] = React.useState(null);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const result = resolveWicket();
      setWicket(result);
      scaleAnim.setValue(0.8);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!wicket && !visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          <Text style={styles.title}>WICKET!</Text>
          <Text style={styles.sub}>D6 dismissal roll</Text>

          {wicket && (
            <>
              <Text style={styles.dieVal}>{wicket.roll}</Text>
              <Text style={styles.wicketType}>{wicket.type}</Text>
              <Text style={styles.detail}>{wicket.detail}</Text>
              {wicket.drs && (
                <View style={styles.drsBadge}>
                  <Text style={styles.drsText}>DRS AVAILABLE</Text>
                </View>
              )}
            </>
          )}

          <TouchableOpacity style={styles.btn} onPress={onConfirm} activeOpacity={0.8}>
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
    backgroundColor: COLOURS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xl,
  },
  card: {
    backgroundColor: COLOURS.ink,
    borderWidth: 2,
    borderColor: COLOURS.wicket,
    borderRadius: 6,
    padding: SPACE.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 40,
    letterSpacing: 5,
    color: COLOURS.wicket,
    marginBottom: SPACE.xs,
  },
  sub: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.dot,
    letterSpacing: 2,
    marginBottom: SPACE.lg,
  },
  dieVal: {
    fontFamily: FONTS.display,
    fontSize: 72,
    color: COLOURS.wicket,
    lineHeight: 76,
    marginBottom: SPACE.sm,
  },
  wicketType: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xxl,
    color: COLOURS.cream,
    letterSpacing: 3,
    marginBottom: SPACE.sm,
    textAlign: 'center',
  },
  detail: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.dot,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACE.lg,
  },
  drsBadge: {
    backgroundColor: 'rgba(212,160,23,0.15)',
    borderWidth: 1,
    borderColor: COLOURS.gold,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.md,
    marginBottom: SPACE.lg,
  },
  drsText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.sm,
    color: COLOURS.gold,
    letterSpacing: 3,
  },
  btn: {
    backgroundColor: COLOURS.wicket,
    borderRadius: 3,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xxl,
  },
  btnText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    letterSpacing: 4,
    color: COLOURS.white,
  },
});
