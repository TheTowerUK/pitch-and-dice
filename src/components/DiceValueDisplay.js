// ─────────────────────────────────────────
//  DiceValueDisplay.js
//  Shared compact-panel dice value (no inner box).
//  Used by roll animation and committed result.
// ─────────────────────────────────────────

import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLOURS, FONTS } from '../constants/theme';
import { STAGE_DICE_NUM_SIZE, STAGE_DICE_VALUE_HEIGHT } from '../constants/compactMatchLayout';

/**
 * Stable display value for compact stage dice (rolling + committed).
 * @param {number|null|undefined} displayNum
 * @param {{ clampedRoll?: number }|null|undefined} lastOutcome
 */
export const resolveStageDiceValue = (displayNum, lastOutcome) => {
  if (displayNum != null && displayNum !== '') return displayNum;
  if (lastOutcome?.clampedRoll != null) return lastOutcome.clampedRoll;
  return '';
};

/**
 * @param {object} props
 * @param {number|string|null|undefined} props.value
 * @param {boolean} [props.showRolledLabel=true]
 * @param {string} [props.numberColor]
 * @param {import('react-native').Animated.Value} [props.scaleAnim]
 */
const DiceValueDisplayInner = ({
  value,
  showRolledLabel = true,
  numberColor = COLOURS.gold,
  scaleAnim = null,
}) => {
  const display = value != null && value !== '' ? String(value) : '';

  const numberEl = (
    <Text style={[styles.number, { color: numberColor }]}>
      {display}
    </Text>
  );

  return (
    <View style={styles.root}>
      <Text style={[styles.rolledLabel, !showRolledLabel && styles.rolledLabelHidden]}>
        ROLLED
      </Text>
      <View style={styles.numberSlot}>
        {scaleAnim ? (
          <Animated.View style={[styles.numberScale, { transform: [{ scale: scaleAnim }] }]}>
            {numberEl}
          </Animated.View>
        ) : (
          numberEl
        )}
      </View>
    </View>
  );
};

const propsAreEqual = (prev, next) => (
  prev.value === next.value
  && prev.showRolledLabel === next.showRolledLabel
  && prev.numberColor === next.numberColor
  && prev.scaleAnim === next.scaleAnim
);

export const DiceValueDisplay = React.memo(DiceValueDisplayInner, propsAreEqual);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: STAGE_DICE_VALUE_HEIGHT,
    width: '100%',
  },
  rolledLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLOURS.dot,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  rolledLabelHidden: {
    opacity: 0,
  },
  numberSlot: {
    height: STAGE_DICE_NUM_SIZE + 8,
    minWidth: STAGE_DICE_NUM_SIZE + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberScale: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: FONTS.display,
    fontSize: STAGE_DICE_NUM_SIZE,
    lineHeight: STAGE_DICE_NUM_SIZE,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
