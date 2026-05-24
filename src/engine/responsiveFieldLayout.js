// ═══════════════════════════════════════════════════════
//  responsiveFieldLayout.js
//  Phase 1 visual field presets — layout only, no gameplay.
// ═══════════════════════════════════════════════════════

import {
  ATTACKING_FIELD,
  DEFAULT_FIELD,
  DEFENSIVE_FIELD,
  ZONE_KEYS,
} from './fieldEngine';
import {
  FIELD_ZONE_SLOTS,
  ROLE_MARKERS,
  DIAGRAM_VIEW_SIZE,
  normalizeFielderPosition,
} from './fieldDiagramLayout';

/** Android / iOS tablet-style layout (shortest edge). */
export const TABLET_LAYOUT_MIN_EDGE = 768;

export const FIELD_SETTING_KEYS = ['attacking', 'balanced', 'defensive'];

const PRESET_FIELDS = {
  attacking: ATTACKING_FIELD,
  balanced: DEFAULT_FIELD,
  defensive: DEFENSIVE_FIELD,
};

const lerp = (from, to, t) => from + (to - from) * t;

const pullToward = (x, y, anchorX, anchorY, strength) => ({
  x: lerp(x, anchorX, strength),
  y: lerp(y, anchorY, strength),
});

const radialScale = (x, y, cx, cy, scale) => ({
  x: cx + (x - cx) * scale,
  y: cy + (y - cy) * scale,
});

/**
 * @param {Record<string, number>|null|undefined} field
 * @returns {'attacking'|'balanced'|'defensive'}
 */
export const inferFieldSetting = (field) => {
  if (!field) return 'balanced';

  const scorePreset = (preset) => ZONE_KEYS.reduce(
    (sum, key) => sum + Math.abs((field[key] || 0) - (preset[key] || 0)),
    0,
  );

  let best = 'balanced';
  let bestScore = scorePreset(DEFAULT_FIELD);
  const attackingScore = scorePreset(ATTACKING_FIELD);
  const defensiveScore = scorePreset(DEFENSIVE_FIELD);

  if (attackingScore < bestScore) {
    best = 'attacking';
    bestScore = attackingScore;
  }
  if (defensiveScore < bestScore) best = 'defensive';

  const slips = field.slip || 0;
  const deep = field.deepBound || 0;
  if (slips >= 3 && deep <= 2) return 'attacking';
  if (slips <= 1 && deep >= 4) return 'defensive';

  return best;
};

export const isTabletLayout = (width, height) => (
  Math.min(width || 0, height || 0) >= TABLET_LAYOUT_MIN_EDGE
);

/**
 * Visual-only tuning per field setting (does not change zone counts).
 */
const PRESET_VISUAL = {
  attacking: {
    ringInward: 0.1,
    slipTowardStriker: 0.14,
    deepOutward: 0.02,
    keeperTowardStriker: 0.08,
    spread: 1,
  },
  balanced: {
    ringInward: 0,
    slipTowardStriker: 0,
    deepOutward: 0,
    keeperTowardStriker: 0,
    spread: 1,
  },
  defensive: {
    ringInward: -0.11,
    slipTowardStriker: -0.06,
    deepOutward: -0.14,
    keeperTowardStriker: -0.05,
    spread: 1.08,
  },
};

const BOWLING_VISUAL_NUDGE = {
  yorker: { ringInward: 0.03, keeperTowardStriker: 0.04 },
  bouncer: { ringInward: -0.02, deepOutward: -0.04 },
  swing: { slipTowardStriker: 0.03 },
  spin: { ringInward: -0.02 },
  paceChange: { ringInward: 0.02 },
  stock: {},
};

const PRESSURE_VISUAL_NUDGE = {
  comfortable: { ringInward: -0.03, deepOutward: -0.03 },
  watchful: {},
  tense: { ringInward: 0.02, slipTowardStriker: 0.02 },
  desperate: { ringInward: 0.05, slipTowardStriker: 0.04, keeperTowardStriker: 0.03 },
  impossible: { ringInward: 0.06, slipTowardStriker: 0.05, keeperTowardStriker: 0.04 },
};

const cloneSlots = () => (
  Object.fromEntries(
    ZONE_KEYS.map((zone) => [
      zone,
      (FIELD_ZONE_SLOTS[zone] || []).map((slot) => ({ ...slot })),
    ]),
  )
);

const applySlotTransform = (slot, zone, tuning, tabletScale) => {
  const cx = 50;
  const cy = 50;
  const strikerY = 26;
  let { x, y } = slot;

  if (zone === 'slip') {
    ({ x, y } = pullToward(x, y, 42, strikerY, tuning.slipTowardStriker));
    ({ x, y } = radialScale(x, y, cx, strikerY, tabletScale * tuning.spread));
  } else if (zone === 'deepBound') {
    ({ x, y } = radialScale(x, y, cx, cy, tabletScale * tuning.spread * (1 - tuning.deepOutward)));
  } else {
    const inward = tuning.ringInward;
    ({ x, y } = pullToward(x, y, cx, cy, inward));
    ({ x, y } = radialScale(x, y, cx, cy, tabletScale * tuning.spread));
  }

  const clamped = normalizeFielderPosition(x, y);
  return {
    ...slot,
    x: clamped.x,
    y: clamped.y,
  };
};

/**
 * @param {object} params
 * @returns {object} layout bundle for FieldPitchDiagram
 */
export const getResponsiveFieldLayout = ({
  width = 0,
  height = 0,
  platform = 'ios',
  isTablet = null,
  fieldSetting = null,
  bowlingType = null,
  pressureState = null,
  field = null,
  gamePhase = null,
} = {}) => {
  const setting = fieldSetting || inferFieldSetting(field);
  const tablet = isTablet ?? isTabletLayout(width, height);
  const phoneCompact = !tablet && Math.min(width || 360, height || 640) < 400;

  const preset = { ...PRESET_VISUAL[setting] || PRESET_VISUAL.balanced };
  const bowlingNudge = BOWLING_VISUAL_NUDGE[bowlingType] || {};
  const pressureNudge = pressureState ? (PRESSURE_VISUAL_NUDGE[pressureState] || {}) : {};

  const tuning = {
    ringInward: preset.ringInward + (bowlingNudge.ringInward || 0) + (pressureNudge.ringInward || 0),
    slipTowardStriker: preset.slipTowardStriker + (bowlingNudge.slipTowardStriker || 0) + (pressureNudge.slipTowardStriker || 0),
    deepOutward: preset.deepOutward + (bowlingNudge.deepOutward || 0) + (pressureNudge.deepOutward || 0),
    keeperTowardStriker: preset.keeperTowardStriker + (bowlingNudge.keeperTowardStriker || 0) + (pressureNudge.keeperTowardStriker || 0),
    spread: preset.spread,
  };

  const tabletScale = tablet ? 1.1 : (phoneCompact ? 0.96 : 1);
  const zoneSlots = cloneSlots();

  for (const zone of ZONE_KEYS) {
    zoneSlots[zone] = (zoneSlots[zone] || []).map((slot) => applySlotTransform(slot, zone, tuning, tabletScale));
  }

  const keeper = ROLE_MARKERS.keeper;
  const keeperPos = pullToward(
    keeper.x,
    keeper.y,
    keeper.x,
    26,
    tuning.keeperTowardStriker,
  );

  const keeperClamped = normalizeFielderPosition(keeperPos.x, keeperPos.y);
  const roleMarkers = {
    ...ROLE_MARKERS,
    keeper: {
      ...keeper,
      x: keeperClamped.x,
      y: keeperClamped.y,
    },
  };

  if (tablet) {
    roleMarkers.batter = { ...ROLE_MARKERS.batter };
    roleMarkers.bowler = { ...ROLE_MARKERS.bowler };
  }

  return {
    fieldSetting: setting,
    isTablet: tablet,
    platform,
    gamePhase,
    zoneSlots,
    roleMarkers,
    namedPositions: buildNamedPositions(zoneSlots, roleMarkers, field),
    viewSize: DIAGRAM_VIEW_SIZE,
    meta: {
      tabletScale,
      phoneCompact,
      tuning,
      referencePreset: PRESET_FIELDS[setting],
    },
  };
};

const buildNamedPositions = (zoneSlots, roleMarkers, field) => {
  const slipSlots = zoneSlots.slip || [];
  const slipCount = field?.slip || 0;

  return {
    keeper: { x: roleMarkers.keeper.x / 100, y: roleMarkers.keeper.y / 100, visible: true },
    slip1: slipSlots[0]
      ? { x: slipSlots[0].x / 100, y: slipSlots[0].y / 100, visible: slipCount >= 1 }
      : { visible: false },
    slip2: slipSlots[1]
      ? { x: slipSlots[1].x / 100, y: slipSlots[1].y / 100, visible: slipCount >= 2 }
      : { visible: false },
    slip3: slipSlots[2]
      ? { x: slipSlots[2].x / 100, y: slipSlots[2].y / 100, visible: slipCount >= 3 }
      : { visible: false },
    cover: zoneSlots.cover?.[0]
      ? { x: zoneSlots.cover[0].x / 100, y: zoneSlots.cover[0].y / 100, visible: (field?.cover || 0) >= 1 }
      : { visible: false },
    midOff: zoneSlots.midOff?.[1] || zoneSlots.midOff?.[0]
      ? {
        x: (zoneSlots.midOff[1] || zoneSlots.midOff[0]).x / 100,
        y: (zoneSlots.midOff[1] || zoneSlots.midOff[0]).y / 100,
        visible: (field?.midOff || 0) >= 1,
      }
      : { visible: false },
    midOn: zoneSlots.midOn?.[0]
      ? { x: zoneSlots.midOn[0].x / 100, y: zoneSlots.midOn[0].y / 100, visible: (field?.midOn || 0) >= 1 }
      : { visible: false },
    squareLeg: zoneSlots.midwicket?.[1]
      ? { x: zoneSlots.midwicket[1].x / 100, y: zoneSlots.midwicket[1].y / 100, visible: (field?.midwicket || 0) >= 2 }
      : { visible: false },
    fineLeg: zoneSlots.deepBound?.[2]
      ? { x: zoneSlots.deepBound[2].x / 100, y: zoneSlots.deepBound[2].y / 100, visible: (field?.deepBound || 0) >= 3 }
      : { visible: false },
  };
};

/**
 * @param {Record<string, number>|null|undefined} field
 * @param {ReturnType<typeof getResponsiveFieldLayout>} layout
 */
export const buildResponsiveFieldDiagramDots = (field, layout) => {
  if (!field || !layout?.zoneSlots) return [];

  const dots = [];
  for (const zoneKey of ZONE_KEYS) {
    const count = Math.max(0, field[zoneKey] || 0);
    const slots = layout.zoneSlots[zoneKey] || [];
    for (let i = 0; i < slots.length; i += 1) {
      const active = i < count;
      dots.push({
        x: slots[i].x,
        y: slots[i].y,
        zone: zoneKey,
        slotIndex: i,
        cricketLabel: slots[i].cricketLabel,
        visible: active,
        opacity: active ? 1 : 0,
      });
    }
  }
  return dots;
};
