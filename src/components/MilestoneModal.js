// ─────────────────────────────────────────
//  MilestoneModal.js
//  Batsman score milestone celebration.
//  Fires on 50 and 100 individual scores.
// ─────────────────────────────────────────

import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { AnimatedMatchModal } from './animated/AnimatedMatchModal';

const MILESTONE_CONFIG = {
  50: {
    icon:    '🏏',
    label:   'FIFTY!',
    colour:  COLOURS.runs1,
    detail:  'A fine half-century. The crowd applauds.',
    flavours: [
      'Raises the bat to the dressing room — a well-crafted fifty.',
      'Takes off the helmet and salutes the crowd. Fifty up!',
      'Punches the air — that fifty means everything.',
      'A classy half-century from a composed innings.',
      'The scoreboard ticks to 50 — the crowd rises as one.',
    ],
  },
  100: {
    icon:    '💯',
    label:   'CENTURY!',
    colour:  COLOURS.gold,
    detail:  'A magnificent hundred. The crowd goes wild.',
    flavours: [
      'Removes the helmet and raises the bat to all four sides. Magnificent!',
      'Sinks to one knee — a century of pure class and determination.',
      'Arms outstretched, soaking in the moment. What a knock!',
      'Points to the dressing room. This one is for the team.',
      'The crowd erupts. A century to remember — simply outstanding.',
    ],
  },
};

export const MilestoneModal = ({ visible, milestone, batsmanName, onConfirm, captureMode = false }) => {
  useEffect(() => {
    if (visible && milestone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Milestone audio is owned exclusively by GameScreen (dice commit path).
    }
  }, [visible, milestone]);

  if (!visible || !milestone) return null;

  const cfg     = MILESTONE_CONFIG[milestone];
  if (!cfg) return null;

  const flavour = captureMode
    ? cfg.flavours[0]
    : cfg.flavours[Math.floor(Math.random() * cfg.flavours.length)];

  return (
    <AnimatedMatchModal
      visible={visible}
      type="fifty"
      overlayStyle={styles.overlay}
      cardStyle={[
          styles.card,
          { borderColor: cfg.colour },
        ]}
      captureMode={captureMode}
    >

          {/* Glow header */}
          <View style={[styles.header, { backgroundColor: cfg.colour + '22' }]}>
            <Text style={styles.icon}>{cfg.icon}</Text>
            <Text style={[styles.label, { color: cfg.colour }]}>{cfg.label}</Text>
          </View>

          {/* Score display */}
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color: cfg.colour }]}>{milestone}</Text>
            <Text style={styles.scoreUnit}>RUNS</Text>
          </View>

          {/* Batsman name */}
          <Text style={styles.batsmanName}>{batsmanName || 'Batsman'}</Text>

          {/* Flavour text */}
          <Text style={styles.flavour}>{flavour}</Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: cfg.colour }]}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>CONTINUE →</Text>
          </TouchableOpacity>

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
    borderRadius:    8,
    width:           '100%',
    maxWidth:        360,
    overflow:        'hidden',
    alignItems:      'center',
  },
  header: {
    width:           '100%',
    alignItems:      'center',
    paddingVertical: SPACE.lg,
  },
  icon: {
    fontSize:     48,
    marginBottom: SPACE.xs,
  },
  label: {
    fontFamily:    FONTS.display,
    fontSize:      40,
    letterSpacing: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           SPACE.sm,
    paddingTop:    SPACE.xl,
  },
  scoreNum: {
    fontFamily:    FONTS.display,
    fontSize:      92,
    lineHeight:    96,
    letterSpacing: 2,
  },
  scoreUnit: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xxl,
    color:         COLOURS.dot,
    letterSpacing: 2,
    marginBottom:  SPACE.sm,
  },
  batsmanName: {
    fontFamily:    FONTS.display,
    fontSize:      18,
    color:         COLOURS.cream,
    letterSpacing: 3,
    marginTop:     SPACE.sm,
    marginBottom:  SPACE.md,
  },
  flavour: {
    fontFamily:        FONTS.mono,
    fontSize:          SIZES.sm,
    color:             COLOURS.dot,
    textAlign:         'center',
    lineHeight:        20,
    paddingHorizontal: SPACE.xl,
    marginBottom:      SPACE.xl,
    fontStyle:         'italic',
  },
  btn: {
    width:           '100%',
    paddingVertical: SPACE.lg,
    alignItems:      'center',
  },
  btnText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    letterSpacing: 4,
    color:         COLOURS.ink,
  },
});