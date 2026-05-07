// ═══════════════════════════════════════════════════════
//  DevPanel.js
//  Dev-only scenario jumper. Invisible in production.
// ═══════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

// Scenarios to jump to. Tweak freely.
const SCENARIOS = [
  {
    label:          'Test 1 — T20 sanity',
    format:         'T20',
    target:         160,
    runs:           100,
    wickets:        3,
    ballsRemaining: 60,
  },
  {
    label:          'Test 2 — Late pressure',
    format:         'T20',
    target:         200,
    runs:           160,
    wickets:        7,
    ballsRemaining: 18,
  },
  {
    label:          'Test 3 — Test match (steady chase)',
    format:         'Test',
    target:         320,
    runs:           260,
    wickets:        4,
    ballsRemaining: 240,
  },
  {
    label:          'Comfortable chase',
    target:         140,
    runs:           80,
    wickets:        2,
    ballsRemaining: 60,
  },
  {
    label:          'Watchful (RRR ~7)',
    target:         160,
    runs:           90,
    wickets:        3,
    ballsRemaining: 60,
  },
  {
    label:          'Tense (RRR ~10)',
    target:         180,
    runs:           80,
    wickets:        4,
    ballsRemaining: 60,
  },
  {
    label:          'Desperate (RRR ~13)',
    target:         200,
    runs:           70,
    wickets:        5,
    ballsRemaining: 60,
  },
  {
    label:          'Impossible but alive',
    target:         250,
    runs:           80,
    wickets:        4,
    ballsRemaining: 60,
  },
  {
    label:          'Final over: need 12 off 6',
    target:         160,
    runs:           148,
    wickets:        4,
    ballsRemaining: 6,
  },
  {
    label:          'Final over: need 6 off 4',
    target:         160,
    runs:           154,
    wickets:        5,
    ballsRemaining: 4,
  },
  {
    label:          'Final ball: need 4 to win',
    target:         160,
    runs:           156,
    wickets:        6,
    ballsRemaining: 1,
  },
  {
    label:          'Final ball: need 6 to win',
    target:         160,
    runs:           154,
    wickets:        6,
    ballsRemaining: 1,
  },
  {
    label:          'Last pair, 20 to get',
    target:         180,
    runs:           160,
    wickets:        9,
    ballsRemaining: 18,
  },
  {
    label:          'Milestone: 48 on 48 balls',
    target:         null,
    runs:           48,
    wickets:        2,
    ballsRemaining: 72,
    batsmanRuns:    48,
  },
  {
    label:          'All out: 9 wickets, 1 ball',
    target:         180,
    runs:           100,
    wickets:        9,
    ballsRemaining: 1,
  },
];

export const DevPanel = ({ visible, onClose, onJump }) => {
  if (!__DEV__) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>⚙ DEV PANEL</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.85}>
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Jump to scenario</Text>
          <Text style={styles.warning}>
            Visible in __DEV__ only. Forces innings 2 if target set.
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {SCENARIOS.map((sc, i) => (
              <TouchableOpacity
                key={i}
                style={styles.scenarioBtn}
                onPress={() => { onJump(sc); onClose(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.scenarioLabel}>{sc.label}</Text>
                <Text style={styles.scenarioDetail}>
                  {sc.format ? `${sc.format} · ` : ''}
                  {sc.target ? `target ${sc.target}, ` : ''}
                  {sc.runs}/{sc.wickets} · {sc.ballsRemaining} balls left
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
  card: {
    backgroundColor: COLOURS.ink,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLOURS.gold,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,160,23,0.25)',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xl,
    color: COLOURS.gold,
    letterSpacing: 3,
  },
  closeBtn: { padding: SPACE.xs },
  closeText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.sm,
    color: COLOURS.dot,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.cream,
    letterSpacing: 2,
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.md,
  },
  warning: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.xs,
    marginBottom: SPACE.md,
  },
  scroll: { flexGrow: 0 },
  scrollContent: {
    padding: SPACE.lg,
    paddingTop: 0,
  },
  scenarioBtn: {
    backgroundColor: COLOURS.slate,
    borderRadius: 4,
    padding: SPACE.md,
    marginBottom: SPACE.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scenarioLabel: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.cream,
    letterSpacing: 1,
    marginBottom: 2,
  },
  scenarioDetail: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 1,
  },
});

