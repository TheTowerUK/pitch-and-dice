// ─────────────────────────────────────────
//  PauseOverlay.js
//  Full-screen pause overlay shown when the
//  player taps the menu button during a match.
//  Options: Resume, Save & Home, Quit Game.
// ─────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';

export const PauseOverlay = ({
  visible,
  runs, wickets, overDisplay, format, innings,
  onResume, onSaveAndHome, onQuit,
}) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.safe}>
          <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.pauseLabel}>GAME PAUSED</Text>
              <Text style={styles.matchInfo}>
                {format} · INN {innings} · {runs}/{wickets} ({overDisplay})
              </Text>
            </View>

            {/* Score display */}
            <View style={styles.scoreBox}>
              <Text style={styles.scoreVal}>{runs}</Text>
              <Text style={styles.scoreWkts}>/{wickets}</Text>
              <Text style={styles.scoreOv}>({overDisplay} ov)</Text>
            </View>

            {/* Menu options */}
            <View style={styles.options}>

              <TouchableOpacity
                style={styles.resumeBtn}
                onPress={onResume}
                activeOpacity={0.85}
              >
                <Text style={styles.resumeIcon}>▶</Text>
                <View>
                  <Text style={styles.resumeText}>RESUME MATCH</Text>
                  <Text style={styles.resumeSub}>Continue playing</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionBtn}
                onPress={onSaveAndHome}
                activeOpacity={0.85}
              >
                <Text style={styles.optionIcon}>🏠</Text>
                <View>
                  <Text style={styles.optionText}>SAVE & HOME</Text>
                  <Text style={styles.optionSub}>Game saved — continue later</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionBtn, styles.quitBtn]}
                onPress={onQuit}
                activeOpacity={0.85}
              >
                <Text style={styles.optionIcon}>✕</Text>
                <View>
                  <Text style={[styles.optionText, styles.quitText]}>QUIT GAME</Text>
                  <Text style={styles.optionSub}>Progress will not be saved</Text>
                </View>
              </TouchableOpacity>

            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent:  'center',
    padding:         SPACE.xl,
  },
  safe: {
    flex:           1,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: COLOURS.ink,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     'rgba(212,160,23,0.3)',
    overflow:        'hidden',
  },
  header: {
    backgroundColor:   COLOURS.slate,
    paddingHorizontal: SPACE.xl,
    paddingVertical:   SPACE.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    alignItems:        'center',
  },
  pauseLabel: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 6,
    color:         COLOURS.dot,
    marginBottom:  SPACE.xs,
  },
  matchInfo: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 2,
  },
  scoreBox: {
    flexDirection:     'row',
    alignItems:        'baseline',
    justifyContent:    'center',
    paddingVertical:   SPACE.xl,
    gap:               SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  scoreVal: {
    fontFamily:    FONTS.display,
    fontSize:      64,
    color:         COLOURS.cream,
    lineHeight:    68,
    letterSpacing: 2,
  },
  scoreWkts: {
    fontFamily:    FONTS.display,
    fontSize:      42,
    color:         COLOURS.red,
    letterSpacing: 1,
  },
  scoreOv: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.sm,
    color:        COLOURS.dot,
    marginBottom: SPACE.xs,
  },
  options: { padding: SPACE.lg, gap: SPACE.sm },
  resumeBtn: {
    backgroundColor:   COLOURS.gold,
    borderRadius:      4,
    paddingVertical:   SPACE.lg,
    paddingHorizontal: SPACE.xl,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACE.lg,
  },
  resumeIcon: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.xxl,
    color:      COLOURS.ink,
  },
  resumeText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 4,
    color:         COLOURS.ink,
  },
  resumeSub: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.ink,
    opacity:    0.6,
    marginTop:  2,
  },
  optionBtn: {
    backgroundColor:   COLOURS.slateMid,
    borderRadius:      4,
    paddingVertical:   SPACE.lg,
    paddingHorizontal: SPACE.xl,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACE.lg,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.08)',
  },
  quitBtn: {
    borderColor:     'rgba(192,57,43,0.3)',
    backgroundColor: 'rgba(192,57,43,0.1)',
  },
  optionIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  optionText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    letterSpacing: 3,
    color:         COLOURS.cream,
  },
  quitText:  { color: COLOURS.red },
  optionSub: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  2,
  },
});
