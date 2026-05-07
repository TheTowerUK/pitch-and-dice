// ─────────────────────────────────────────
//  PauseOverlay.js
//  Full-screen pause overlay with mute toggle
// ─────────────────────────────────────────

import React, { useRef, useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { isAudioMuted, setAudioMuted } from '../engine/soundEngine';

export const PauseOverlay = ({
  visible,
  runs, wickets, overDisplay, formatLabel, innings,
  onResume, onSaveAndHome, onQuit, onHelpPress,
  /** Passed to unmute so crowd/commentary match phase (not used when muting). */
  audioRestoreContext = { screen: 'game', gamePhase: null },
}) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [muted, setMuted] = useState(() => isAudioMuted());
  const [muteBusy, setMuteBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setMuted(isAudioMuted());
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible]);

  const toggleMute = async () => {
    if (__DEV__) {
      console.log(
        `[audio-ui][pause] press received localMuted=${muted} muteBusy=${muteBusy} engineMuted=${isAudioMuted()}`
      );
    }
    if (muteBusy) return;
    setMuteBusy(true);
    const newMuted = !muted;
    if (__DEV__) {
      console.log(
        `[audio-ui][pause] before toggle nextMuted=${newMuted} localMuted=${muted} muteBusy=${muteBusy} engineMuted=${isAudioMuted()}`
      );
    }
    try {
      await setAudioMuted(newMuted, newMuted ? null : audioRestoreContext);
    } finally {
      const engineAfter = isAudioMuted();
      if (__DEV__) {
        console.log(
          `[audio-ui][pause] after toggle engineMuted=${engineAfter} localMuted(beforeSet)=${muted} muteBusy(beforeSet)=${muteBusy}`
        );
      }
      setMuted(engineAfter);
      setMuteBusy(false);
      if (__DEV__) {
        console.log(
          `[audio-ui][pause] completion localMuted(target)=${engineAfter} muteBusy(target)=false buttonDisabled=${false}`
        );
      }
    }
  };

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
                {formatLabel} · INN {innings} · {runs}/{wickets} ({overDisplay})
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
                onPress={onHelpPress}
                activeOpacity={0.85}
              >
                <Text style={styles.optionIcon}>❓</Text>
                <View>
                  <Text style={styles.optionText}>HOW TO PLAY</Text>
                  <Text style={styles.optionSub}>Rules, tips and game guide</Text>
                </View>
              </TouchableOpacity>

              {/* Mute toggle */}
              <TouchableOpacity
                style={[styles.optionBtn, muted && styles.mutedBtn]}
                onPress={toggleMute}
                disabled={muteBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.optionIcon}>{muted ? '🔇' : '🔊'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionText}>
                    {muted ? 'UNMUTE SOUNDS' : 'MUTE SOUNDS'}
                  </Text>
                  <Text style={styles.optionSub}>
                    {muted ? 'Tap to restore all audio' : 'Commentary, crowd and effects'}
                  </Text>
                </View>
                <View style={[styles.muteIndicator, !muted && styles.muteIndicatorOn]}>
                  <Text style={styles.muteIndicatorText}>{muted ? 'OFF' : 'ON'}</Text>
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
  safe:    { flex: 1, justifyContent: 'center' },
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
  mutedBtn: {
    borderColor:     'rgba(127,140,141,0.4)',
    backgroundColor: 'rgba(127,140,141,0.1)',
  },
  quitBtn: {
    borderColor:     'rgba(192,57,43,0.3)',
    backgroundColor: 'rgba(192,57,43,0.1)',
  },
  optionIcon:  { fontSize: 20, width: 28, textAlign: 'center' },
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
  muteIndicator: {
    backgroundColor: 'rgba(127,140,141,0.2)',
    borderWidth:     1,
    borderColor:     COLOURS.dot,
    borderRadius:    3,
    paddingVertical: 2,
    paddingHorizontal: SPACE.sm,
  },
  muteIndicatorOn: {
    backgroundColor: 'rgba(39,174,96,0.15)',
    borderColor:     COLOURS.runs1,
  },
  muteIndicatorText: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 1,
  },
});