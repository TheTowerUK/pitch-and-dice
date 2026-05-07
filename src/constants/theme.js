// ─────────────────────────────────────────
//  THEME COLOURS
// ─────────────────────────────────────────
export const COLOURS = {
  ink:         '#1a1a1a',
  slate:       '#2c3e50',
  slateMid:    '#3d5166',
  slateLight:  '#4a6080',
  cream:       '#f5f0e8',
  gold:        '#d4a017',
  goldLight:   '#f0c040',
  red:         '#c0392b',
  pitch:       '#2d5a1b',
  pitchLight:  '#3a7a24',
  dot:         '#7f8c8d',
  boundary:    '#e67e22',
  six:         '#e74c3c',
  wicket:      '#8e44ad',
  runs1:       '#27ae60',
  runs2:       '#2980b9',
  runs3:       '#8e44ad',
  white:       '#ffffff',
  overlay:     'rgba(0,0,0,0.85)',
};

// ─────────────────────────────────────────
//  TYPOGRAPHY SIZES
// ─────────────────────────────────────────
export const FONTS = {
  display:  'BebasNeue_400Regular',
  mono:     'DMMono_400Regular',
  monoMed:  'DMMono_500Medium',
};

export const SIZES = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   20,
  xxl:  28,
  hero: 48,
};

// ─────────────────────────────────────────
//  SPACING
// ─────────────────────────────────────────
export const SPACE = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

// ─────────────────────────────────────────
//  FORMAT CONFIG
// ─────────────────────────────────────────
export const FORMATS = {
  T20:  { overs: 20,  label: 'T20' },
  ODI:  { overs: 50,  label: 'ODI' },
  Test: { overs: 90,  label: 'TEST' },
};

export const FORMAT_ORDER = ['T20', 'ODI', 'Test'];

/** User-facing lines for setup, scoreboard, and help — atmosphere-first, not rule-complete. */
export const FORMAT_PRESENTATION = {
  T20: {
    headline:    'T20 — Quick match',
    scoreboard:  'T20 · Quick match',
    setupSummary: '20 overs — fast swings in momentum.',
    help:        'Twenty overs per innings. Quick decisions and rapid context shifts — good for learning the engine.',
  },
  ODI: {
    headline:    'ODI — 50 overs',
    scoreboard:  'ODI · 50 overs',
    setupSummary: '50 overs per innings — a longer stretch and richer match arc.',
    help:        'Fifty overs per innings for extended play. Uses the same core rules as shorter formats — not a full real-world ODI simulation.',
  },
  Test: {
    headline:    'Test — 90 overs',
    scoreboard:  'Test · 90 overs',
    setupSummary: '90 overs per innings — the longest session.',
    help:        'Ninety overs per innings. Paced for a marathon feel; mechanics match other formats.',
  },
};

export const getFormatScoreboardLabel = (formatKey) =>
  FORMAT_PRESENTATION[formatKey]?.scoreboard
  || FORMATS[formatKey]?.label
  || String(formatKey || '');
