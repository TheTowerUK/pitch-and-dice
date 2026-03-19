// ═══════════════════════════════════════════════════════
//  specialEvents.js
//  D20 Special Events — 5% trigger chance per ball.
//  Each event has a mechanical effect on the game state.
// ═══════════════════════════════════════════════════════

import { rollDie } from './diceEngine';

// ─────────────────────────────────────────
//  TRIGGER CHECK
//  5% chance per ball = roll D20, trigger on 20
// ─────────────────────────────────────────
export const shouldTriggerEvent = () => rollDie(20) === 20;

// ─────────────────────────────────────────
//  EVENT TABLE (D20)
//  Each event has a type, label, description,
//  and effect object consumed by useGameState
// ─────────────────────────────────────────
export const SPECIAL_EVENTS = {
  1: {
    key:         'injury',
    label:       'INJURY SCARE',
    icon:        '🚑',
    description: 'The batsman takes a blow and retires hurt temporarily.',
    flavour:     'Play is halted as the physio rushes onto the field.',
    effect: {
      type:          'momentum',
      momentumDelta: -3,
      message:       'Injury scare — momentum swings to the bowling side.',
    },
  },
  2: {
    key:         'weather',
    label:       'WEATHER DELAY',
    icon:        '🌧️',
    description: 'Rain interrupts play. The covers come on.',
    flavour:     'The ground staff sprint onto the field. Frustrating delay.',
    effect: {
      type:          'momentum',
      momentumDelta: -2,
      message:       'Weather delay breaks the batting side\'s rhythm.',
    },
  },
  3: {
    key:         'drs_overturned',
    label:       'DRS OVERTURNED',
    icon:        '📺',
    description: 'A crucial DRS decision is overturned by the third umpire.',
    flavour:     'The replays are conclusive. The finger comes down.',
    effect: {
      type:          'wicket_reprieve',
      momentumDelta: +3,
      message:       'DRS saves the batsman! Massive momentum swing.',
    },
  },
  4: {
    key:         'crowd_factor',
    label:       'CROWD ROARS',
    icon:        '📣',
    description: 'The home crowd lifts the batting side.',
    flavour:     'A wall of noise — the crowd is firmly behind their team.',
    effect: {
      type:          'momentum',
      momentumDelta: +2,
      message:       'The crowd lifts the batting side — momentum surges.',
    },
  },
  5: {
    key:         'pitch_crack',
    label:       'PITCH CRACKS',
    icon:        '💢',
    description: 'A dangerous crack appears on a good length.',
    flavour:     'The groundskeepers inspect but play continues. Danger zone.',
    effect: {
      type:          'pitch_worsen',
      momentumDelta: -2,
      message:       'Pitch deterioration — batting just got harder.',
    },
  },
  6: {
    key:         'dropped_catch',
    label:       'DROPPED CATCH',
    icon:        '😱',
    description: 'A regulation catch goes down in the field.',
    flavour:     'Butterfingers! The fielder can\'t believe it.',
    effect: {
      type:          'momentum',
      momentumDelta: -3,
      message:       'Dropped catch — costly reprieve for the batting side.',
    },
  },
  7: {
    key:         'no_ball',
    label:       'NO BALL!',
    icon:        '⚠️',
    description: 'The bowler oversteps — a free hit is awarded.',
    flavour:     'No ball called! The batting side get a free hit next delivery.',
    effect: {
      type:          'free_hit',
      momentumDelta: +2,
      freeHit:       true,
      message:       'No ball! Free hit awarded — wicket cannot be taken.',
    },
  },
  8: {
    key:         'captain_inspiration',
    label:       'CAPTAIN\'S CALL',
    icon:        '⭐',
    description: 'An inspired tactical change galvanises the batting side.',
    flavour:     'The captain makes a bold call from the pavilion. The team responds.',
    effect: {
      type:          'momentum',
      momentumDelta: +3,
      message:       'Captain\'s inspiration — the team is fired up.',
    },
  },
  9: {
    key:         'new_ball',
    label:       'NEW BALL EFFECT',
    icon:        '🏏',
    description: 'The new ball is taken — extra pace and movement.',
    flavour:     'The bowler shines the new ball. Dangerous conditions ahead.',
    effect: {
      type:          'bowling_boost',
      momentumDelta: -2,
      rollMod:       -1,
      message:       'New ball effect — bowling side holds the upper hand.',
    },
  },
  10: {
    key:         'partnership_pressure',
    label:       'PARTNERSHIP PRESSURE',
    icon:        '🤝',
    description: 'A settled partnership is unsettling the bowling attack.',
    flavour:     'The bowling side looks nervous. The batsmen are playing well together.',
    effect: {
      type:          'momentum',
      momentumDelta: +2,
      message:       'Partnership pressure building — batting side in control.',
    },
  },
  11: {
    key:         'crowd_hostile',
    label:       'HOSTILE CROWD',
    icon:        '😤',
    description: 'The away crowd jeers every shot.',
    flavour:     'A torrent of noise — and none of it supportive.',
    effect: {
      type:          'momentum',
      momentumDelta: -2,
      message:       'Hostile atmosphere — concentration required.',
    },
  },
  12: {
    key:         'milestone_nerves',
    label:       'MILESTONE NERVES',
    icon:        '😰',
    description: 'The batsman tightens up approaching a landmark score.',
    flavour:     'You can see the tension in their movements. Don\'t freeze now.',
    effect: {
      type:          'momentum',
      momentumDelta: -2,
      rollMod:       -1,
      message:       'Milestone nerves — the batsman is tightening up.',
    },
  },
  13: {
    key:         'controversial_decision',
    label:       'CONTROVERSIAL DECISION',
    icon:        '🤨',
    description: 'A howler from the umpire sparks outrage.',
    flavour:     'The players surround the umpire. TV replays make it worse.',
    effect: {
      type:          'momentum',
      momentumDelta: -1,
      message:       'Controversial decision — frustration on the field.',
    },
  },
  14: {
    key:         'record_attempt',
    label:       'RECORD IN SIGHT',
    icon:        '📊',
    description: 'A significant record is within reach — pressure and opportunity.',
    flavour:     'The scoreboard tells the story. History beckons.',
    effect: {
      type:          'momentum',
      momentumDelta: +1,
      message:       'Record in sight — the crowd is on their feet.',
    },
  },
  15: {
    key:         'drinks_break',
    label:       'DRINKS BREAK',
    icon:        '🥤',
    description: 'A timely drinks break resets the momentum.',
    flavour:     'Both sides regroup. The tactical conversation could change everything.',
    effect: {
      type:          'momentum_reset',
      momentumDelta: 0,
      reset:         true,
      message:       'Drinks break — momentum resets to neutral.',
    },
  },
  16: {
    key:         'streaky_boundary',
    label:       'STREAKY BOUNDARY',
    icon:        '🍀',
    description: 'An outside edge races through for four.',
    flavour:     'Off the outside edge — but it counts just the same!',
    effect: {
      type:          'bonus_runs',
      runs:          4,
      momentumDelta: +1,
      message:       'Lucky boundary! Four runs and a momentum lift.',
    },
  },
  17: {
    key:         'ball_change',
    label:       'BALL CHANGE',
    icon:        '🔄',
    description: 'The ball is changed for a new one after going out of shape.',
    flavour:     'The umpires produce a replacement. Fresh conditions ahead.',
    effect: {
      type:          'momentum',
      momentumDelta: -1,
      message:       'Ball change — slight advantage to the bowling side.',
    },
  },
  18: {
    key:         'lightning_fifty',
    label:       'LIGHTNING FIFTY',
    icon:        '⚡',
    description: 'The batting side reaches a milestone at breakneck speed.',
    flavour:     'The scoreboard is flying. This is breathtaking batting.',
    effect: {
      type:          'momentum',
      momentumDelta: +4,
      message:       'Lightning fifty! The batting side are absolutely flying.',
    },
  },
  19: {
    key:         'collapse_warning',
    label:       'COLLAPSE WARNING',
    icon:        '⚠️',
    description: 'A rash of poor shots has the dressing room nervous.',
    flavour:     'The coach watches from the balcony, head in hands.',
    effect: {
      type:          'momentum',
      momentumDelta: -4,
      message:       'Collapse warning — the batting side is in disarray.',
    },
  },
  20: {
    key:         'legendary_ball',
    label:       'LEGENDARY BALL',
    icon:        '🌟',
    description: 'An unplayable delivery — the ball of the century.',
    flavour:     'The crowd falls silent, then erupts. That was special.',
    effect: {
      type:          'wicket_forced',
      momentumDelta: -5,
      message:       'Legendary ball — absolutely unplayable. Wicket!',
    },
  },
};

// ─────────────────────────────────────────
//  ROLL AND RESOLVE EVENT
// ─────────────────────────────────────────
export const resolveSpecialEvent = () => {
  const roll  = rollDie(20);
  const event = SPECIAL_EVENTS[roll];
  return { roll, ...event };
};

// ─────────────────────────────────────────
//  APPLY EVENT EFFECT TO STATE
//  Returns a partial state update object
// ─────────────────────────────────────────
export const applyEventEffect = (event, currentState, clampMomentumFn) => {
  const effect = event.effect;
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
      // Pitch worsening applied via commentary — full pitch engine update in Phase 4
      break;

    case 'free_hit':
      updates.freeHit  = true;
      updates.momentum = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;

    case 'wicket_reprieve':
      // Only applies if last ball was a wicket — handled in useGameState
      updates.momentum = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      break;

    case 'wicket_forced':
      updates.momentum     = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      updates.forceWicket  = true;
      break;

    case 'bowling_boost':
      updates.momentum       = clampMomentumFn(currentState.momentum + effect.momentumDelta);
      updates.tempRollMod    = effect.rollMod || 0;
      break;

    default:
      updates.momentum = clampMomentumFn(currentState.momentum + (effect.momentumDelta || 0));
  }

  return updates;
};
