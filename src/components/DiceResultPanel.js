// ═══════════════════════════════════════════════════════
//  DiceResultPanel.js
//  Compact broadcast-style wrapper for dice + last-ball result.
// ═══════════════════════════════════════════════════════

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLOURS, SPACE } from '../constants/theme';

export const DiceResultPanel = ({ children, style, fill = false }) => (
  <View style={[styles.panel, fill && styles.panelFill, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.xs,
    backgroundColor: COLOURS.ink,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.28)',
    borderRadius: 4,
  },
  panelFill: {
    flex: 1,
    minHeight: 0,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.xs,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
});
