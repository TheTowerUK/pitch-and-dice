// ─────────────────────────────────────────
//  FieldSummaryStrip.js
//  Compact read-only display of current field
//  placement. Shown above bowling selector
//  during play as a reference.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { FIELD_ZONES, ZONE_KEYS } from '../engine/fieldEngine';

const ZonePip = ({ zoneKey, count }) => {
  const zone    = FIELD_ZONES[zoneKey];
  const hasField = count > 0;

  return (
    <View style={styles.zonePip}>
      <Text style={styles.zoneIcon}>{zone.icon}</Text>
      <Text style={[styles.zoneCount, !hasField && styles.zoneCountEmpty]}>
        {count}
      </Text>
      <Text style={styles.zoneName} numberOfLines={1}>{zone.label}</Text>
    </View>
  );
};

export const FieldSummaryStrip = ({ field, onEditPress, showEdit = true, label: labelProp }) => {
  if (!field) return null;

  const totalFielders = Object.values(field).reduce((s, n) => s + n, 0);
  const headerLabel   = labelProp ?? 'CURRENT FIELD';

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>{headerLabel}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.totalText}>{totalFielders}/9 placed</Text>
          {showEdit && (
            <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
              <Text style={styles.editText}>CHANGE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Zone pips */}
      <View style={styles.zonesRow}>
        {ZONE_KEYS.map(key => (
          <ZonePip key={key} zoneKey={key} count={field[key] || 0} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACE.lg,
    marginBottom:     SPACE.md,
    backgroundColor:  COLOURS.ink,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.07)',
    borderRadius:     3,
    padding:          SPACE.md,
  },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACE.sm,
  },
  label: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACE.md,
  },
  totalText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
  },
  editBtn: {
    borderWidth:       1,
    borderColor:       COLOURS.gold,
    paddingVertical:   2,
    paddingHorizontal: SPACE.sm,
    borderRadius:      2,
  },
  editText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.gold,
    letterSpacing: 1,
  },

  zonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zonePip: {
    alignItems: 'center',
    flex:       1,
  },
  zoneIcon: {
    fontSize:     14,
    marginBottom: 2,
  },
  zoneCount: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    color:        COLOURS.cream,
    lineHeight:   20,
  },
  zoneCountEmpty: {
    color: COLOURS.dot,
  },
  zoneName: {
    fontFamily:   FONTS.mono,
    fontSize:     7,
    color:        COLOURS.dot,
    letterSpacing: 0.5,
    textAlign:    'center',
  },
});
