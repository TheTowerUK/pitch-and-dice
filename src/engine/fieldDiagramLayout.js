// ═══════════════════════════════════════════════════════
//  fieldDiagramLayout.js
//  Fixed normalized coordinates (viewBox 0–100).
//  Mapped to standard cricket positions (reference field diagram).
//  Striker/batter top, bowler bottom; off side left, leg side right.
// ═══════════════════════════════════════════════════════

import { ZONE_KEYS } from './fieldEngine';

export const DIAGRAM_VIEW_SIZE = 100;

/** Fielder dot radius in viewBox units (must match FieldPitchDiagram FIELD_DOT_R). */
export const FIELD_DOT_RADIUS = 2.85;

/**
 * Keep placeable fielder centres outside the pitch strip (PITCH_RECT + dot radius).
 * Off side x ≤ 39, leg side x ≥ 61, behind striker y ≤ 18, past bowler y ≥ 82.
 */
export const PITCH_FIELDER_MARGIN = 4;

/**
 * Slot order matters: field[zone] = N renders slots 0 … N-1.
 * `cricketLabel` is documentation / dev reference only (not shown in compact UI).
 */
export const FIELD_ZONE_SLOTS = {
  slip: [
    { x: 45, y: 18, cricketLabel: '1st slip' },
    { x: 40, y: 17, cricketLabel: '2nd slip' },
    { x: 35, y: 19, cricketLabel: '3rd slip' },
  ],
  cover: [
    { x: 18, y: 37, cricketLabel: 'cover point' },
    { x: 20, y: 56, cricketLabel: 'cover' },
  ],
  midOff: [
    { x: 28, y: 58, cricketLabel: 'extra cover' },
    { x: 32, y: 84, cricketLabel: 'mid-off' },
  ],
  midOn: [
    { x: 63, y: 46, cricketLabel: 'short mid-on' },
    { x: 68, y: 84, cricketLabel: 'mid-on' },
  ],
  midwicket: [
    { x: 76, y: 55, cricketLabel: 'mid-wicket' },
    { x: 80, y: 37, cricketLabel: 'square leg' },
  ],
  deepBound: [
    { x: 50, y: 5, cricketLabel: 'straight / long-on' },
    { x: 22, y: 15, cricketLabel: 'third man' },
    { x: 63, y: 16, cricketLabel: 'fine leg' },
  ],
};

export const ROLE_MARKERS = {
  batter: { x: 50, y: 34, r: 3.4, cricketLabel: 'batter' },
  keeper: { x: 50, y: 21, r: 3, cricketLabel: 'wicketkeeper' },
  bowler: { x: 50, y: 75, r: 3.5, cricketLabel: 'bowler' },
};

export const PITCH_RECT = { x: 43, y: 22, width: 14, height: 56 };

export const WICKET_ENDS = {
  striker: { x: 50, y: 26 },
  bowler:  { x: 50, y: 74 },
};

export const FIELD_OVAL = { cx: 50, cy: 50, rx: 43, ry: 47 };

/**
 * Clamp a fielder centre inside the playing oval (inset by dot radius).
 * @returns {{ x: number, y: number }}
 */
export const clampFielderToOval = (x, y, dotRadius = FIELD_DOT_RADIUS) => {
  const { cx, cy, rx, ry } = FIELD_OVAL;
  const insetRx = Math.max(6, rx - dotRadius);
  const insetRy = Math.max(6, ry - dotRadius);

  const dx = x - cx;
  const dy = y - cy;
  const norm = Math.sqrt((dx / insetRx) ** 2 + (dy / insetRy) ** 2);
  if (norm <= 1) return { x, y };

  const scale = 1 / norm;
  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
};

/**
 * Keep fielder centres outside the pitch strip (PITCH_FIELDER_MARGIN).
 * @returns {{ x: number, y: number }}
 */
export const clampFielderAwayFromPitch = (x, y) => {
  const left = PITCH_RECT.x - PITCH_FIELDER_MARGIN;
  const right = PITCH_RECT.x + PITCH_RECT.width + PITCH_FIELDER_MARGIN;
  const top = PITCH_RECT.y - PITCH_FIELDER_MARGIN;
  const bottom = PITCH_RECT.y + PITCH_RECT.height + PITCH_FIELDER_MARGIN;

  let px = x;
  let py = y;
  if (px <= left || px >= right || py <= top || py >= bottom) {
    return { x: px, y: py };
  }

  const dLeft = px - left;
  const dRight = right - px;
  const dTop = py - top;
  const dBottom = bottom - py;
  const min = Math.min(dLeft, dRight, dTop, dBottom);

  if (min === dLeft) px = left;
  else if (min === dRight) px = right;
  else if (min === dTop) py = top;
  else py = bottom;

  return { x: px, y: py };
};

/** Oval + pitch constraints for responsive slot tuning and rendering. */
export const normalizeFielderPosition = (x, y, dotRadius = FIELD_DOT_RADIUS) => {
  let pos = clampFielderAwayFromPitch(x, y);
  pos = clampFielderToOval(pos.x, pos.y, dotRadius);
  pos = clampFielderAwayFromPitch(pos.x, pos.y);
  return clampFielderToOval(pos.x, pos.y, dotRadius);
};

/**
 * Rope positions on the oval for ball-path / broadcast visuals only.
 * Not used by buildFieldDiagramDots — keeps 4s/6s off fielder slots.
 */
export const BOUNDARY_ROPE_TARGETS = {
  four: {
    straight:  { x: 50, y: 4, cricketLabel: 'rope straight (4)' },
    off:       { x: 9, y: 20, cricketLabel: 'rope off (4)' },
    leg:       { x: 91, y: 20, cricketLabel: 'rope leg (4)' },
    offBehind: { x: 13, y: 9, cricketLabel: 'rope third man (4)' },
    legBehind: { x: 87, y: 9, cricketLabel: 'rope fine leg (4)' },
  },
  six: {
    straight:  { x: 50, y: 2, cricketLabel: 'rope straight (6)' },
    off:       { x: 6, y: 14, cricketLabel: 'rope off (6)' },
    leg:       { x: 94, y: 14, cricketLabel: 'rope leg (6)' },
    offBehind: { x: 10, y: 5, cricketLabel: 'rope third man (6)' },
    legBehind: { x: 90, y: 5, cricketLabel: 'rope fine leg (6)' },
  },
};

/**
 * @param {Record<string, number>|null|undefined} field
 * @returns {Array<{ x: number, y: number, zone: string, slotIndex: number }>}
 */
export const buildFieldDiagramDots = (field) => {
  if (!field) return [];

  const dots = [];
  for (const zoneKey of ZONE_KEYS) {
    const count = Math.max(0, field[zoneKey] || 0);
    const slots = FIELD_ZONE_SLOTS[zoneKey] || [];
    for (let i = 0; i < count && i < slots.length; i += 1) {
      dots.push({
        x: slots[i].x,
        y: slots[i].y,
        zone: zoneKey,
        slotIndex: i,
        cricketLabel: slots[i].cricketLabel,
      });
    }
  }
  return dots;
};
