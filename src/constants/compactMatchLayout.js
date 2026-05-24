// Fixed dimensions for compact match stage (prevents layout judder).

import { SPACE } from './theme';

export const COMPACT_COMMENTARY_HEIGHT = 78;
/** Minimum stage row height; stage grows with flex to fill central area */
export const COMPACT_STAGE_MIN_HEIGHT = 168;
/** Field card ~60% / dice card ~40% of stage row */
export const COMPACT_PITCH_FLEX = 0.6;
export const COMPACT_DICE_FLEX = 0.4;
/** FieldPitchDiagram SVG viewBox (square) */
export const COMPACT_FIELD_VIEWBOX = 100;

/** Reserved height for ROLLED + die value (roll + outcome layers must match). */
export const STAGE_DICE_VALUE_HEIGHT = 76;
/** Die value — shared by DiceValueDisplay on phone and iPad. */
export const STAGE_DICE_NUM_SIZE = 56;

/** Shortest screen edge at or above this uses expanded compact spacing (iPad, etc.). */
export const LARGE_STAGE_SHORT_SIDE_MIN = 640;

/**
 * Responsive compact-match metrics (phone vs iPad portrait).
 * @param {number} width
 * @param {number} height
 */
export const getMatchStageMetrics = (width, height) => {
  const shortSide = Math.min(width, height);
  const large = shortSide >= LARGE_STAGE_SHORT_SIDE_MIN;

  return {
    large,
    commentaryHeight: large ? 92 : COMPACT_COMMENTARY_HEIGHT,
    stageMinHeight: large ? 248 : COMPACT_STAGE_MIN_HEIGHT,
    mainPaddingH: large ? SPACE.xl : SPACE.md,
    mainPaddingTop: large ? SPACE.md : SPACE.sm,
    stageGap: large ? SPACE.lg : SPACE.sm,
    pitchPadding: large ? SPACE.sm : SPACE.xs,
    bottomPanelMaxHeight: large ? '42%' : '48%',
    bottomPanelPaddingTop: large ? SPACE.sm : SPACE.xs,
    bottomPanelPaddingBottom: large ? SPACE.md : SPACE.sm,
    matchDetailsMarginH: large ? SPACE.xl : SPACE.md,
    bottomScrollPaddingH: large ? SPACE.lg : SPACE.md,
    pitchBorderRadius: large ? 6 : 4,
  };
};
