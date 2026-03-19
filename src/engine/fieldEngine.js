// ═══════════════════════════════════════════════════════
//  fieldEngine.js
//  Field placement system — pre-over zone allocation.
//  9 fielders distributed across 6 zones.
//  Zone coverage reduces boundary/catch probability
//  for specific shot types.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  FIELD ZONES
// ─────────────────────────────────────────
export const FIELD_ZONES = {
  slip:       { key: 'slip',      label: 'SLIP',       max: 3, protects: ['work', 'drive'],          icon: '🔴' },
  cover:      { key: 'cover',     label: 'COVER',      max: 2, protects: ['drive'],                  icon: '🟡' },
  midOff:     { key: 'midOff',    label: 'MID OFF',    max: 2, protects: ['drive', 'power'],         icon: '🟢' },
  midOn:      { key: 'midOn',     label: 'MID ON',     max: 2, protects: ['work', 'power'],          icon: '🔵' },
  midwicket:  { key: 'midwicket', label: 'MIDWICKET',  max: 2, protects: ['work', 'slog'],           icon: '🟣' },
  deepBound:  { key: 'deepBound', label: 'DEEP BOUND', max: 3, protects: ['power', 'slog', 'drive'], icon: '⚫' },
};

export const ZONE_KEYS = ['slip', 'cover', 'midOff', 'midOn', 'midwicket', 'deepBound'];

export const TOTAL_FIELDERS = 9; // keeper + bowler always present, 9 placeable

// ─────────────────────────────────────────
//  DEFAULT FIELD SETTINGS
// ─────────────────────────────────────────
export const DEFAULT_FIELD = {
  slip:      2,
  cover:     1,
  midOff:    1,
  midOn:     1,
  midwicket: 1,
  deepBound: 3,
};

export const ATTACKING_FIELD = {
  slip:      3,
  cover:     1,
  midOff:    1,
  midOn:     1,
  midwicket: 1,
  deepBound: 2,
};

export const DEFENSIVE_FIELD = {
  slip:      1,
  cover:     1,
  midOff:    1,
  midOn:     1,
  midwicket: 1,
  deepBound: 4,
};

export const FIELD_PRESETS = [
  { key: 'attacking',  label: 'ATTACKING',  description: 'Slips up, chase wickets', field: ATTACKING_FIELD },
  { key: 'balanced',   label: 'BALANCED',   description: 'Standard setup',           field: DEFAULT_FIELD },
  { key: 'defensive',  label: 'DEFENSIVE',  description: 'Protect boundaries',       field: DEFENSIVE_FIELD },
];

// ─────────────────────────────────────────
//  TOTAL FIELDER COUNT VALIDATOR
// ─────────────────────────────────────────
export const getFielderCount = (field) =>
  Object.values(field).reduce((sum, n) => sum + n, 0);

export const isValidField = (field) =>
  getFielderCount(field) === TOTAL_FIELDERS;

// ─────────────────────────────────────────
//  FIELD MODIFIER
//  Returns roll modifier based on shot type
//  and fielders in protecting zones
// ─────────────────────────────────────────
export const getFieldMod = (shotKey, field) => {
  let totalFielders = 0;

  for (const zoneKey of ZONE_KEYS) {
    const zone = FIELD_ZONES[zoneKey];
    if (zone.protects.includes(shotKey)) {
      totalFielders += field[zoneKey] || 0;
    }
  }

  // Every 4 fielders in protecting zones = -1 to batting roll, capped at -1
  // Reduced from /2 to /4 and capped to prevent over-stacking
  return -Math.min(1, Math.floor(totalFielders / 4));
};

// ─────────────────────────────────────────
//  BOUNDARY SAVE CHECK
//  High fielder count in deepBound = chance
//  to save a boundary (convert 4 to 2/3)
// ─────────────────────────────────────────
export const checkBoundarySave = (shotKey, field, rollDieFn) => {
  const deepFielders = field.deepBound || 0;
  if (deepFielders < 3) return false;
  if (!['power', 'slog', 'drive'].includes(shotKey)) return false;

  // 3 deep fielders = 33% save chance
  const saveRoll = rollDieFn(3);
  return saveRoll === 1;
};

// ─────────────────────────────────────────
//  CATCH PROBABILITY BOOST
//  Slip fielders boost catch chance on edges
// ─────────────────────────────────────────
export const getSlipCatchBoost = (field) => {
  const slips = field.slip || 0;
  // Each slip fielder adds 5% catch chance (represented as D20 threshold)
  return slips; // used as: catchRoll <= slips means caught
};
