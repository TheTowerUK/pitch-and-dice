// ─────────────────────────────────────────
//  InningsModal.js
//  Innings complete / match summary modal
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

const StatRow = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const InningsModal = ({
  visible, innings, runs, wickets,
  overDisplay, boundaries, sixes, dots, runRate,
  target, onStartInnings2, onNewMatch,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 7, tension: 80, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const chaseWon  = target && runs >= target;
  const title     = chaseWon ? 'TARGET CHASED!' : 'INNINGS COMPLETE';
  const showBtn2  = innings === 1 && !chaseWon;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          <Text style={[styles.title, chaseWon && { color: COLOURS.runs1 }]}>{title}</Text>

          <View style={styles.statsBox}>
            <StatRow label="RUNS"          value={runs} />
            <StatRow label="WICKETS"       value={wickets} />
            <StatRow label="OVERS"         value={overDisplay} />
            <StatRow label="BOUNDARIES 4s" value={boundaries} />
            <StatRow label="SIXES"         value={sixes} />
            <StatRow label="DOT BALLS"     value={dots} />
            <StatRow label="RUN RATE"      value={runRate} />
            {target && <StatRow label="TARGET" value={target} />}
          </View>

          {showBtn2 && (
            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={onStartInnings2} activeOpacity={0.8}>
              <Text style={styles.btnText}>START INNINGS 2 →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={onNewMatch} activeOpacity={0.8}>
            <Text style={styles.btnText}>NEW MATCH</Text>
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
    borderColor: COLOURS.gold,
    borderRadius: 6,
    padding: SPACE.xl,
    width: '100%',
    maxWidth: 380,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
    letterSpacing: 4,
    color: COLOURS.gold,
    textAlign: 'center',
    marginBottom: SPACE.lg,
  },
  statsBox: {
    backgroundColor: COLOURS.slate,
    borderRadius: 3,
    padding: SPACE.md,
    marginBottom: SPACE.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    color: COLOURS.gold,
    letterSpacing: 1,
  },
  btn: {
    borderRadius: 3,
    paddingVertical: SPACE.md,
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  btnGreen: { backgroundColor: COLOURS.pitchLight },
  btnRed:   { backgroundColor: COLOURS.red },
  btnText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    letterSpacing: 4,
    color: COLOURS.white,
  },
});
