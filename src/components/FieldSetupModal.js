// ─────────────────────────────────────────
//  FieldSetupModal.js
//  Pre-over field placement modal.
//  Shown at the start of each new over.
// ─────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  Animated, StyleSheet, ScrollView,
} from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import {
  FIELD_ZONES, ZONE_KEYS, TOTAL_FIELDERS,
  DEFAULT_FIELD, FIELD_PRESETS,
  getFielderCount, isValidField,
} from '../engine/fieldEngine';

const ZoneRow = ({ zoneKey, count, onInc, onDec }) => {
  const zone    = FIELD_ZONES[zoneKey];
  const atMax   = count >= zone.max;
  const atMin   = count <= 0;

  return (
    <View style={styles.zoneRow}>
      <View style={styles.zoneInfo}>
        <Text style={styles.zoneIcon}>{zone.icon}</Text>
        <View>
          <Text style={styles.zoneName}>{zone.label}</Text>
          <Text style={styles.zoneMax}>max {zone.max}</Text>
        </View>
      </View>

      <View style={styles.zoneControl}>
        <TouchableOpacity
          style={[styles.zoneBtn, atMin && styles.zoneBtnDisabled]}
          onPress={onDec} disabled={atMin}
        >
          <Text style={styles.zoneBtnTxt}>−</Text>
        </TouchableOpacity>

        <View style={styles.zoneCount}>
          <Text style={styles.zoneCountTxt}>{count}</Text>
        </View>

        <TouchableOpacity
          style={[styles.zoneBtn, atMax && styles.zoneBtnDisabled]}
          onPress={onInc} disabled={atMax}
        >
          <Text style={styles.zoneBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FieldSetupModal = ({ visible, currentOver, onConfirm }) => {
  const [field, setField]   = useState({ ...DEFAULT_FIELD });
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 7, tension: 80, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const used      = getFielderCount(field);
  const remaining = TOTAL_FIELDERS - used;
  const valid     = isValidField(field);

  const inc = (zone) => {
    const z = FIELD_ZONES[zone];
    if (field[zone] >= z.max) return;
    if (remaining <= 0) return;
    setField(f => ({ ...f, [zone]: f[zone] + 1 }));
  };

  const dec = (zone) => {
    if (field[zone] <= 0) return;
    setField(f => ({ ...f, [zone]: f[zone] - 1 }));
  };

  const applyPreset = (preset) => setField({ ...preset.field });

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          <Text style={styles.title}>FIELD PLACEMENT</Text>
          <Text style={styles.sub}>OVER {currentOver + 1} — Set your field</Text>

          {/* Fielder counter */}
          <View style={[styles.counter, { borderColor: valid ? COLOURS.pitch : COLOURS.red }]}>
            <Text style={[styles.counterVal, { color: valid ? COLOURS.gold : COLOURS.red }]}>
              {used}/{TOTAL_FIELDERS}
            </Text>
            <Text style={styles.counterLbl}>
              {remaining > 0 ? `${remaining} to place` : valid ? 'FIELD SET' : 'TOO MANY'}
            </Text>
          </View>

          {/* Presets */}
          <View style={styles.presetRow}>
            {FIELD_PRESETS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={styles.presetBtn}
                onPress={() => applyPreset(p)}
              >
                <Text style={styles.presetLabel}>{p.label}</Text>
                <Text style={styles.presetDesc}>{p.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Zone controls */}
          <ScrollView style={styles.zones} showsVerticalScrollIndicator={false}>
            {ZONE_KEYS.map(key => (
              <ZoneRow
                key={key}
                zoneKey={key}
                count={field[key]}
                onInc={() => inc(key)}
                onDec={() => dec(key)}
              />
            ))}
          </ScrollView>

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, !valid && styles.confirmBtnDisabled]}
            onPress={() => valid && onConfirm(field)}
            disabled={!valid}
          >
            <Text style={[styles.confirmTxt, !valid && { color: COLOURS.dot }]}>
              SET FIELD →
            </Text>
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
    borderWidth:     2,
    borderColor:     COLOURS.pitchLight,
    borderRadius:    6,
    padding:         SPACE.xl,
    width:           '100%',
    maxWidth:        400,
    maxHeight:       '90%',
  },
  title: {
    fontFamily:   FONTS.display,
    fontSize:     28,
    letterSpacing: 4,
    color:        COLOURS.gold,
    marginBottom: SPACE.xs,
  },
  sub: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
    marginBottom: SPACE.md,
  },
  counter: {
    borderWidth:    1,
    borderRadius:   3,
    padding:        SPACE.sm,
    alignItems:     'center',
    marginBottom:   SPACE.md,
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            SPACE.md,
  },
  counterVal: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xxl,
    letterSpacing: 2,
  },
  counterLbl: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap:           SPACE.sm,
    marginBottom:  SPACE.md,
  },
  presetBtn: {
    flex:            1,
    backgroundColor: COLOURS.slateMid,
    borderRadius:    3,
    padding:         SPACE.sm,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  presetLabel: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.sm,
    letterSpacing: 2,
    color:        COLOURS.cream,
  },
  presetDesc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  2,
    textAlign:  'center',
  },
  zones: { maxHeight: 260, marginBottom: SPACE.md },
  zoneRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  zoneInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, flex: 1 },
  zoneIcon: { fontSize: 18 },
  zoneName: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.cream, letterSpacing: 1 },
  zoneMax:  { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot },
  zoneControl: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  zoneBtn: {
    width:  32, height: 32,
    backgroundColor: COLOURS.slateMid,
    borderRadius:    16,
    alignItems:      'center',
    justifyContent:  'center',
  },
  zoneBtnDisabled: { opacity: 0.25 },
  zoneBtnTxt:  { fontFamily: FONTS.display, fontSize: SIZES.lg, color: COLOURS.cream },
  zoneCount: {
    width:         32,
    alignItems:    'center',
  },
  zoneCountTxt: { fontFamily: FONTS.display, fontSize: SIZES.xl, color: COLOURS.gold },
  confirmBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    3,
    paddingVertical: SPACE.md,
    alignItems:      'center',
  },
  confirmBtnDisabled: { backgroundColor: COLOURS.slateMid },
  confirmTxt: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 4,
    color:        COLOURS.ink,
  },
});
