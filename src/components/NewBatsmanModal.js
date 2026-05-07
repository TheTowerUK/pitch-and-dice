// ─────────────────────────────────────────
//  NewBatsmanModal.js
//  Shown when a wicket falls mid-innings.
//  Set the incoming batsman name + skill.
// ─────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TextInput,
  TouchableOpacity, Animated, ScrollView, StyleSheet,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import {
  BATSMAN_PRESETS, getSkillLabel, getSkillColour,
  validatePlayerName, DEFAULT_BATSMAN,
} from '../engine/playerEngine';

export const NewBatsmanModal = ({ visible, wicketInfo, onConfirm }) => {
  const [name,  setName]  = useState('New Batsman');
  const [skill, setSkill] = useState(5);
  const [error, setError] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      // Defer state updates to avoid concurrent rendering conflict
      const id = setTimeout(() => {
        setName('New Batsman');
        setSkill(5);
        setError(null);
      }, 0);
      scaleAnim.setValue(0.85);
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 7, tension: 80, useNativeDriver: true,
      }).start();
      return () => clearTimeout(id);
    }
  }, [visible]);

  const handleConfirm = () => {
    const err = validatePlayerName(name);
    if (err) { setError(err); return; }
    onConfirm({ ...DEFAULT_BATSMAN, name: name.trim(), skill });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          <Text style={styles.title}>NEW BATSMAN</Text>
          {wicketInfo && (
            <Text style={styles.wicketSub}>
              {wicketInfo.type} — {wicketInfo.detail}
            </Text>
          )}

          {/* Name input */}
          <Text style={styles.fieldLabel}>PLAYER NAME</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={name}
            onChangeText={v => { setName(v); setError(null); }}
            placeholder="Enter batsman name"
            placeholderTextColor={COLOURS.dot}
            maxLength={20}
            autoFocus
          />
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Skill control */}
          <Text style={styles.fieldLabel}>SKILL RATING</Text>
          <View style={styles.skillRow}>
            <TouchableOpacity
              style={[styles.skillBtn, skill <= 1 && styles.skillBtnDisabled]}
              onPress={() => setSkill(s => Math.max(1, s - 1))}
              disabled={skill <= 1}
            >
              <Text style={styles.skillBtnTxt}>−</Text>
            </TouchableOpacity>

            <View style={[styles.skillDisp, { borderColor: getSkillColour(skill) }]}>
              <Text style={[styles.skillVal, { color: getSkillColour(skill) }]}>{skill}</Text>
              <Text style={[styles.skillLbl, { color: getSkillColour(skill) }]}>
                {getSkillLabel(skill)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.skillBtn, skill >= 10 && styles.skillBtnDisabled]}
              onPress={() => setSkill(s => Math.min(10, s + 1))}
              disabled={skill >= 10}
            >
              <Text style={styles.skillBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Quick presets */}
          <Text style={styles.fieldLabel}>QUICK SELECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets}>
            {BATSMAN_PRESETS.map(p => (
              <TouchableOpacity
                key={p.name}
                style={[styles.preset, skill === p.skill && styles.presetSel]}
                onPress={() => { setSkill(p.skill); }}  // skill only — preserve entered name
              >
                <Text style={[styles.presetName, skill === p.skill && { color: COLOURS.gold }]}>
                  {p.name}
                </Text>
                <Text style={[styles.presetSkill, { color: getSkillColour(p.skill) }]}>
                  {p.skill}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Confirm */}
          <TouchableOpacity style={styles.btn} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={styles.btnText}>SEND IN →</Text>
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
    padding: SPACE.lg,
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
    marginBottom: SPACE.xs,
  },
  wicketSub: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: '#e056fd',
    letterSpacing: 1,
    marginBottom: SPACE.lg,
  },
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 3,
    marginBottom: SPACE.sm,
    marginTop: SPACE.sm,
  },
  input: {
    backgroundColor: COLOURS.slateMid,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    padding: SPACE.md,
    fontFamily: FONTS.mono,
    fontSize: SIZES.md,
    color: COLOURS.cream,
  },
  inputError: { borderColor: COLOURS.red },
  errorText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.red,
    marginTop: SPACE.xs,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.lg,
    marginVertical: SPACE.sm,
  },
  skillBtn: {
    width: 40, height: 40,
    backgroundColor: COLOURS.slateMid,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillBtnDisabled: { opacity: 0.3 },
  skillBtnTxt: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xl,
    color: COLOURS.cream,
  },
  skillDisp: {
    width: 70, height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOURS.slate,
  },
  skillVal: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 30,
  },
  skillLbl: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    letterSpacing: 1,
  },
  presets: { marginBottom: SPACE.lg },
  preset: {
    backgroundColor: COLOURS.slateMid,
    borderRadius: 3,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.md,
    marginRight: SPACE.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    minWidth: 70,
  },
  presetSel: {
    borderColor: COLOURS.gold,
    backgroundColor: 'rgba(212,160,23,0.1)',
  },
  presetName: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.cream,
  },
  presetSkill: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    marginTop: 1,
  },
  btn: {
    backgroundColor: COLOURS.gold,
    borderRadius: 3,
    paddingVertical: SPACE.md,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    letterSpacing: 4,
    color: COLOURS.ink,
  },
});
