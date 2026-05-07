// ═══════════════════════════════════════════════════════
//  specialEvents.js
//  D20 Special Events — 5% trigger chance per ball.
//  Each event has a condition() guard so it only fires
//  when contextually valid for the current game state.
// ═══════════════════════════════════════════════════════

import { rollDie } from './diceEngine.js';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const SPECIAL_EVENT_COOLDOWN_LEGAL_BALLS = {
  no_ball: 2,
  dropped_catch: 3,
  drs_win: 6,
  drs_lose: 6,
  injury: 12,
  weather: 18,
  drinks: 24,
  legendary_ball: 12,
  // State-gated and innings-specific: once it fires, keep it out until innings reset.
  new_ball: Number.MAX_SAFE_INTEGER,
};

export const SPECIAL_EVENT_CONFIG = {
  no_ball: {
    audioKey: 'cmt.lead.no_ball_1',
    eligibility: 'ball_context',
    spokenRequired: true,
    aliases: [],
  },
  dropped_catch: {
    audioKey: 'cmt.lead.dropped_catch_1',
    eligibility: 'ball_context',
    spokenRequired: true,
    aliases: [],
  },
  drs_win: {
    audioKey: 'cmt.lead.drs_win_1',
    eligibility: 'review_context',
    spokenRequired: true,
    aliases: ['drs_overturned'],
  },
  drs_lose: {
    audioKey: 'cmt.lead.drs_lose_1',
    eligibility: 'review_context',
    spokenRequired: true,
    aliases: ['drs_lost'],
  },
  injury: {
    audioKey: 'cmt.lead.injury_1',
    eligibility: 'broad_interrupt',
    spokenRequired: true,
    aliases: [],
  },
  weather: {
    audioKey: 'cmt.lead.weather_1',
    eligibility: 'broad_interrupt',
    spokenRequired: true,
    aliases: [],
  },
  drinks: {
    audioKey: 'cmt.lead.drinks_1',
    eligibility: 'broad_interrupt',
    spokenRequired: true,
    aliases: ['drinks_break'],
  },
  legendary_ball: {
    audioKey: 'cmt.lead.legendary_ball_1',
    eligibility: 'rare_ball_event',
    spokenRequired: true,
    aliases: [],
  },
  new_ball: {
    audioKey: 'cmt.lead.new_ball_1',
    eligibility: 'state_event',
    spokenRequired: true,
    aliases: ['new_ball_effect'],
  },
};

const SPECIAL_LEAD_COMMENTARY_KEYS = [
  'cmt.lead.no_ball_1',
  'cmt.lead.dropped_catch_1',
  'cmt.lead.drs_win_1',
  'cmt.lead.drs_lose_1',
  'cmt.lead.injury_1',
  'cmt.lead.weather_1',
  'cmt.lead.drinks_1',
  'cmt.lead.legendary_ball_1',
  'cmt.lead.new_ball_1',
];

const ALIAS_TO_CANONICAL = Object.entries(SPECIAL_EVENT_CONFIG).reduce((acc, [canonical, cfg]) => {
  acc[canonical] = canonical;
  for (const alias of cfg.aliases || []) acc[alias] = canonical;
  return acc;
}, {});

export const normalizeSpecialEventKey = (key) => ALIAS_TO_CANONICAL[key] || null;
export const isKnownSpecialEvent = (key) => !!normalizeSpecialEventKey(key);
export const getLockedSpecialEventConfig = (key) => {
  const canonical = normalizeSpecialEventKey(key);
  if (!canonical) return null;
  return { canonicalKey: canonical, ...SPECIAL_EVENT_CONFIG[canonical] };
};

export const getSpecialLeadCommentaryKey = (eventKey = null) => {
  const cfg = eventKey ? getLockedSpecialEventConfig(eventKey) : null;
  if (cfg?.audioKey && SPECIAL_LEAD_COMMENTARY_KEYS.includes(cfg.audioKey)) return cfg.audioKey;
  return SPECIAL_LEAD_COMMENTARY_KEYS[Math.floor(Math.random() * SPECIAL_LEAD_COMMENTARY_KEYS.length)];
};

export const shouldTriggerEvent = () => rollDie(20) === 20;

// ─────────────────────────────────────────
//  EVENT TABLE
//  condition(state) → bool
//  Return true  = event is valid right now
//  Return false = re-roll to a context-free fallback
// ─────────────────────────────────────────
export const SPECIAL_EVENTS = {
  1: {
    key:         'injury',
    label:       'INJURY SCARE',
    icon:        '🚑',
    description: 'The batsman takes a blow and retires hurt temporarily.',
    flavour:     'Play is halted as the physio rushes onto the field.',
    condition:   () => true,
    effect: { type: 'momentum', momentumDelta: -3,
      message: 'Injury scare — momentum swings to the bowling side.' },
  },
  2: {
    key:         'weather',
    label:       'WEATHER DELAY',
    icon:        '🌧️',
    description: 'Rain interrupts play. The covers come on.',
    flavour:     'The ground staff sprint onto the field. Frustrating delay.',
    condition:   () => true,
    effect: { type: 'momentum', momentumDelta: -2,
      message: 'Weather delay breaks the batting side\'s rhythm.' },
  },
  3: {
    key:         'drs_overturned',
    label:       'DRS OVERTURNED',
    icon:        '📺',
    description: 'A crucial DRS decision is overturned by the third umpire.',
    flavour:     'The replays are conclusive. The finger comes down.',
    // Only valid if at least 1 wicket has fallen
    condition:   (s) => s.wickets >= 1,
    effect: { type: 'wicket_reprieve', momentumDelta: +3,
      message: 'DRS saves the batsman! Massive momentum swing.' },
  },
  4: {
    key:         'crowd_factor',
    label:       'CROWD ROARS',
    icon:        '📣',
    description: 'The home crowd lifts the batting side.',
    flavour:     'A wall of noise — the crowd is firmly behind their team.',
    condition:   () => true,
    effect: { type: 'momentum', momentumDelta: +2,
      message: 'The crowd lifts the batting side — momentum surges.' },
  },
  5: {
    key:         'pitch_crack',
    label:       'PITCH CRACKS',
    icon:        '💢',
    description: 'A dangerous crack appears on a good length.',
    flavour:     'The groundskeepers inspect but play continues. Danger zone.',
    condition:   () => true,
    effect: { type: 'pitch_worsen', momentumDelta: -2,
      message: 'Pitch deterioration — batting just got harder.' },
  },
  6: {
    key:         'dropped_catch',
    label:       'DROPPED CATCH',
    icon:        '😱',
    description: 'A regulation catch goes down in the field.',
    flavour:     'Butterfingers! The fielder can\'t believe it.',
    condition:   () => true,
    effect: { type: 'momentum', momentumDelta: -3,
      message: 'Dropped catch — costly reprieve for the batting side.' },
  },
  7: {
    key:         'no_ball',
    label:       'NO BALL!',
    icon:        '⚠️',
    description: 'The bowler oversteps — illegal delivery, free hit awarded.',
    flavour:     'No ball called! Next delivery is a free hit — bonus ball, no wicket risk.',
    condition:   () => true,
    effect: { type: 'free_hit', momentumDelta: +2, freeHit: true,
      message: 'No ball! Free hit — bonus ball, wicket cannot be taken.' },
  },
  8: {
    key:         'captain_inspiration',
    label:       'CAPTAIN\'S CALL',
    icon:        '⭐',
    description: 'An inspired tactical change galvanises the batting side.',
    flavour:     'The captain makes a bold call from the pavilion. The team responds.',
    condition:   () => true,
    effect: { type: 'momentum', momentumDelta: +3,
      message: 'Captain\'s inspiration — the team is fired up.' },
  },
  9: {
    key:         'new_ball',
    label:       'NEW BALL EFFECT',
    icon:        '🏏',
    description: 'The new ball is taken — extra pace and movement.',
    flavour:     'The bowler shines the new ball. Dangerous conditions ahead.',
    // New ball only relevant from over 10 onwards
    condition:   (s) => s.balls >= 60,
    effect: { type: 'bowling_boost', momentumDelta: -2, rollMod: -1,
      message: 'New ball effect — bowling side holds the upper hand.' },
  },
  10: {
    key:         'partnership_pressure',
    label:       'PARTNERSHIP PRESSURE',
    icon:        '🤝',
    description: 'A settled partnership is unsettling the bowling attack.',
    flavour:     'The bowling side looks nervous. The batsmen are playing well together.',
    // Partnership needs at least 20 runs since last wicket and 12+ balls faced
    condition:   (s) => s.partnership?.runs >= 20 && s.balls >= 12,
    effect: { type: 'momentum', momentumDelta: +2,
      message: 'Partnership pressure building — batting side in control.' },
  },
  11: {
    key:         'crowd_hostile',
    label:       'HOSTILE CROWD',
    icon:        '😤',
    description: 'The away crowd jeers every shot.',
    flavour:     'A torrent of noise — and none of it supportive.',
    condition:   () => true,
    effect: { type: 'momentum', momentumDelta: -2,
      message: 'Hostile atmosphere — concentration required.' },
  },
  12: {
    key:         'milestone_nerves',
    label:       'MILESTONE NERVES',
    icon:        '😰',
    description: 'The batsman tightens up approaching a landmark score.',
    flavour:     'You can see the tension in their movements. Don\'t freeze now.',
    // Only valid when batsman is in the nervous nineties or forties
    condition:   (s) => {
      const runs = s.batsman?.runs || 0;
      return (runs >= 40 && runs < 50) || (runs >= 85 && runs < 100);
    },
    effect: { type: 'momentum', momentumDelta: -2, rollMod: -1,
      message: 'Milestone nerves — the batsman is tightening up.' },
  },
  13: {
    key:         'drs_lost',
    label:       'DRS REVIEW LOST',
    icon:        '📺',
    description: 'The review confirms the wicket — no way back for the batter.',
    flavour:     'UltraEdge and ball tracking agree. The original decision stands.',
    condition:   (s) => s.drsReviews >= 1,
    effect: { type: 'wicket_forced', momentumDelta: -3,
      message: 'DRS review lost — the wicket stands.' },
  },
  14: {
    key:         'record_attempt',
    label:       'RECORD IN SIGHT',
    icon:        '📊',
    description: 'A significant record is within reach — pressure and opportunity.',
    flavour:     'The scoreboard tells the story. History beckons.',
    // Record only makes sense when team score > 120 or batsman near 80+
    condition:   (s) => s.runs >= 120 || (s.batsman?.runs || 0) >= 80,
    effect: { type: 'momentum', momentumDelta: +1,
      message: 'Record in sight — the crowd is on their feet.' },
  },
  15: {
    key:         'drinks',
    label:       'DRINKS BREAK',
    icon:        '🥤',
    description: 'A timely drinks break resets the momentum.',
    flavour:     'Both sides regroup. The tactical conversation could change everything.',
    // Drinks breaks happen mid-innings, not in the first over
    condition:   (s) => s.balls >= 30,
    effect: { type: 'momentum_reset', momentumDelta: 0, reset: true,
      message: 'Drinks break — momentum resets to neutral.' },
  },
  16: {
    key:         'streaky_boundary',
    label:       'STREAKY BOUNDARY',
    icon:        '🍀',
    description: 'An outside edge races through for four.',
    flavour:     'Off the outside edge — but it counts just the same!',
    condition:   () => true,
    effect: { type: 'bonus_runs', runs: 4, momentumDelta: +1,
      message: 'Lucky boundary! Four runs and a momentum lift.' },
  },
  17: {
    key:         'ball_change',
    label:       'BALL CHANGE',
    icon:        '🔄',
    description: 'The ball is changed for a new one after going out of shape.',
    flavour:     'The umpires produce a replacement. Fresh conditions ahead.',
    // Ball change only happens after significant overs
    condition:   (s) => s.balls >= 48,
    effect: { type: 'momentum', momentumDelta: -1,
      message: 'Ball change — slight advantage to the bowling side.' },
  },
  18: {
    key:         'lightning_fifty',
    label:       'LIGHTNING FIFTY',
    icon:        '⚡',
    description: 'The batting side reaches a milestone at breakneck speed.',
    flavour:     'The scoreboard is flying. This is breathtaking batting.',
    // Lightning fifty = team score between 45-65 in the first 8 overs
    condition:   (s) => s.runs >= 45 && s.runs <= 80 && s.balls <= 48,
    effect: { type: 'momentum', momentumDelta: +4,
      message: 'Lightning fifty! The batting side are absolutely flying.' },
  },
  19: {
    key:         'collapse_warning',
    label:       'COLLAPSE WARNING',
    icon:        '⚠️',
    description: 'A rash of poor shots has the dressing room nervous.',
    flavour:     'The coach watches from the balcony, head in hands.',
    // Collapse only meaningful when multiple wickets have already fallen
    condition:   (s) => s.wickets >= 3,
    effect: { type: 'momentum', momentumDelta: -4,
      message: 'Collapse warning — the batting side is in disarray.' },
  },
  20: {
    key:         'legendary_ball',
    label:       'LEGENDARY BALL',
    icon:        '🌟',
    description: 'An unplayable delivery — the ball of the century.',
    flavour:     'The crowd falls silent, then erupts. That was special.',
    condition:   () => true,
    effect: { type: 'wicket_forced', momentumDelta: -5,
      message: 'Legendary ball — absolutely unplayable. Wicket!' },
  },
};

const pickFromRolls = (rolls) => {
  if (!rolls?.length) return null;
  const idx = rollDie(rolls.length) - 1;
  return rolls[idx];
};

const isCatchContext = (provisionalOutcome) =>
  provisionalOutcome?.type === 'wicket' &&
  typeof provisionalOutcome?.wicketType === 'string' &&
  provisionalOutcome.wicketType.startsWith('CAUGHT');

const isReviewContext = (provisionalOutcome) =>
  provisionalOutcome?.type === 'wicket' && !!provisionalOutcome?.drsEligible;

const isNoBallContext = (provisionalOutcome) =>
  provisionalOutcome?.type === 'no_ball' ||
  provisionalOutcome?.eventContext === 'no_ball';

const isContextEligible = (eventKey, provisionalOutcome) => {
  const canonical = normalizeSpecialEventKey(eventKey) || eventKey;
  const cfg = getLockedSpecialEventConfig(canonical);
  if (!cfg) return false;
  switch (cfg.eligibility) {
    // Context-dependent commentary lines
    case 'ball_context':
      if (canonical === 'no_ball') return isNoBallContext(provisionalOutcome);
      if (canonical === 'dropped_catch') return isCatchContext(provisionalOutcome);
      return false;
    case 'review_context':
      return isReviewContext(provisionalOutcome);
    case 'broad_interrupt':
      return true;
    case 'rare_ball_event':
      return canonical === 'legendary_ball' ? (provisionalOutcome?.type === 'wicket') : true;
    case 'state_event':
      return canonical === 'new_ball' ? true : false;
    default:
      return false;
  }
};

const buildLockedEvent = (roll, event) => {
  const canonicalKey = normalizeSpecialEventKey(event.key);
  if (!canonicalKey) {
    if (isDev) console.log(`[EVENT_LOCK] unknown event key ignored: ${event.key}`);
    return null;
  }
  const cfg = getLockedSpecialEventConfig(canonicalKey);
  if (!cfg?.audioKey) {
    if (isDev) console.log(`[EVENT_LOCK] event has no valid audio mapping: ${canonicalKey}`);
    return null;
  }
  if (isDev) console.log(`[EVENT_LOCK] selected event: ${canonicalKey} -> ${cfg.audioKey}`);
  return { roll, ...event, key: canonicalKey, type: canonicalKey };
};

const isRegistryAllowed = (event) => {
  const canonical = normalizeSpecialEventKey(event?.key);
  if (!canonical) {
    if (isDev && event?.key) console.log(`[EVENT_LOCK] unknown event key ignored: ${event.key}`);
    return false;
  }
  const cfg = getLockedSpecialEventConfig(canonical);
  if (!cfg?.audioKey) {
    if (isDev) console.log(`[EVENT_LOCK] event has no valid audio mapping: ${canonical}`);
    return false;
  }
  return true;
};

export const getEligibleSpecialEvents = (provisionalOutcome, gameState = {}) => {
  return Object.entries(SPECIAL_EVENTS)
    .filter(([, event]) => {
      if (!isRegistryAllowed(event)) return false;
      if (event.condition && !event.condition(gameState)) return false;
      return isContextEligible(event.key, provisionalOutcome);
    })
    .map(([roll]) => Number(roll));
};

// ─────────────────────────────────────────
//  ROLL AND RESOLVE
//  Locked: only known, mapped, context-eligible events can fire.
// ─────────────────────────────────────────
export const resolveSpecialEvent = (gameState = {}, provisionalOutcome = null) => {
  const eligibleRolls = getEligibleSpecialEvents(provisionalOutcome, gameState);
  const cooldowns = gameState.specialEventCooldownsByType || {};
  const lastType = gameState.lastSpecialEventType || null;
  const eligibleAfterCooldown = eligibleRolls.filter((roll) => {
    const event = SPECIAL_EVENTS[roll];
    const type = normalizeSpecialEventKey(event?.key) || event?.key;
    if (!type) return false;
    if (type === lastType) {
      if (isDev) console.log(`[special-event] candidate rejected reason=immediate_repeat type=${type}`);
      return false;
    }
    const remaining = cooldowns[type] || 0;
    if (remaining > 0) {
      if (isDev) console.log(`[special-event] candidate rejected reason=cooldown type=${type} ballsRemaining=${remaining}`);
      return false;
    }
    return true;
  });
  if (eligibleRolls.length > 0 && eligibleAfterCooldown.length === 0) {
    if (isDev) console.log('[special-event] skipped reason=no_eligible_after_cooldown');
    return null;
  }

  const chosenRoll = pickFromRolls(eligibleAfterCooldown);
  if (!chosenRoll) return null;
  const selected = SPECIAL_EVENTS[chosenRoll];
  const selectedType = normalizeSpecialEventKey(selected?.key) || selected?.key;
  if (isDev) console.log(`[special-event] selected type=${selectedType}`);
  return buildLockedEvent(chosenRoll, selected);
};

// backwards-compatible helper retained for older callers
export const getSpecialEventAudioKey = (eventKey) => {
  const cfg = getLockedSpecialEventConfig(eventKey);
  return cfg?.audioKey || null;
};

// ─────────────────────────────────────────
//  APPLY EVENT EFFECT TO STATE
// ─────────────────────────────────────────
export const applyEventEffect = (event, currentState, clampMomentumFn) => {
  const effect  = event.effect;
  const updates = {};

  switch (effect.type) {
    case 'momentum':
      updates.momentum = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;
    case 'momentum_reset':
      updates.momentum = 0;
      break;
    case 'bonus_runs':
      updates.runs       = currentState.runs + effect.runs;
      updates.boundaries = currentState.boundaries + 1;
      updates.momentum   = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;
    case 'pitch_worsen':
      updates.momentum = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;
    case 'free_hit':
      updates.freeHit  = true;
      updates.momentum = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;
    case 'wicket_reprieve':
      updates.momentum = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;
    case 'wicket_forced':
      updates.momentum    = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      updates.forceWicket = true;
      break;
    case 'bowling_boost':
      updates.momentum    = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      updates.tempRollMod = effect.rollMod || 0;
      break;
    default:
      updates.momentum = clampMomentumFn(currentState.momentum + (effect.momentumDelta || 0));
  }

  return updates;
};
