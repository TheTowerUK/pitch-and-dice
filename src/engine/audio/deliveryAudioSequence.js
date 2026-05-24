/**
 * Default delivery commentary priority (standalone / mixed events).
 * matchResult > milestone > wicket > specialEvent > inningsEnd > outcome
 *
 * Combined exception: milestone + match_result on the same delivery plays
 * milestone → match_result (ball achievement before match summary).
 */
export const DELIVERY_AUDIO_EVENT_ORDER = [
  'match_result',
  'milestone',
  'wicket',
  'special_event',
  'innings_end',
  'outcome',
];

const hasMilestone = (milestone) => {
  if (!milestone) return false;
  const runs = milestone.runs ?? milestone;
  return runs === 50 || runs === 100;
};

const hasMatchResult = (matchResult) => {
  if (!matchResult) return false;
  if (matchResult === true) return true;
  return matchResult.playerWon === true || matchResult.playerWon === false;
};

/**
 * @param {object} flags
 * @param {boolean|{ playerWon: boolean }|null} [flags.matchResult]
 * @param {{ runs: number, batsmanName?: string }|number|null} [flags.milestone]
 * @param {{ type: string }|boolean|null} [flags.wicket]
 * @param {boolean|null} [flags.inningsEnd]
 * @param {{ eventKey: string }|string|null} [flags.specialEvent]
 * @param {boolean} [flags.outcome]
 * @returns {string[]}
 */
export const buildDeliveryAudioSequence = ({
  matchResult = null,
  milestone = null,
  wicket = null,
  inningsEnd = false,
  specialEvent = null,
  outcome = false,
} = {}) => {
  const present = {
    match_result: hasMatchResult(matchResult),
    milestone: hasMilestone(milestone),
    wicket: !!(wicket && (wicket === true || wicket.type)),
    special_event: !!(specialEvent && (typeof specialEvent === 'string' ? specialEvent : specialEvent.eventKey)),
    innings_end: !!inningsEnd,
    outcome: !!outcome,
  };

  const sequence = DELIVERY_AUDIO_EVENT_ORDER.filter((key) => present[key]);

  const combinedMatchMilestone = present.milestone && present.match_result;
  if (combinedMatchMilestone) {
    const milestoneIdx = sequence.indexOf('milestone');
    const matchResultIdx = sequence.indexOf('match_result');
    if (milestoneIdx > matchResultIdx) {
      sequence[milestoneIdx] = 'match_result';
      sequence[matchResultIdx] = 'milestone';
    }
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const logSuffix = combinedMatchMilestone ? ' reason="combined_match_milestone"' : '';
    console.log('[audio-sequence]', `events=${JSON.stringify(sequence)}${logSuffix}`);
    validateDeliveryEvents(sequence);
  }

  return sequence;
};

export const isDeliverySpeechEvent = (eventKey) => (
  DELIVERY_AUDIO_EVENT_ORDER.includes(eventKey)
);

/**
 * Dev-only: log unusual or rule-inconsistent event combinations. Never blocks playback.
 * @param {string[]} sequence
 */
export const validateDeliveryEvents = (sequence) => {
  if (typeof __DEV__ === 'undefined' || !__DEV__ || !sequence?.length) return;

  const events = new Set(sequence);
  const has = (key) => events.has(key);
  const warnings = [];

  const push = (reason, detail, kind = 'unusual') => {
    warnings.push({ reason, kind, detail });
  };

  // Rule-inconsistent with resolveAndApplyBall / roll-complete wiring
  if (has('milestone') && has('wicket')) {
    push(
      'milestone_and_wicket',
      'Batter milestones are not set on wicket deliveries (runs > 0, non-wicket).',
      'impossible',
    );
  }
  if (has('match_result') && has('innings_end')) {
    push(
      'match_result_and_innings_end',
      'match_result is innings-2 match end; innings_end is innings-1 break — should not share one delivery.',
      'impossible',
    );
  }
  if (has('outcome') && has('wicket')) {
    push(
      'outcome_and_wicket',
      'Outcome commentary is suppressed when wicket is in the sequence.',
      'impossible',
    );
  }
  if (has('special_event') && sequence.length > 1) {
    push(
      'special_event_with_other_events',
      'Special events freeze the delivery pipeline; roll-complete should not combine them.',
      'impossible',
    );
  }

  // Valid edge cases that often sound awkward — worth spotting in QA
  if (has('match_result') && has('wicket')) {
    push(
      'match_result_and_wicket',
      'Chase won on a wicket ball (e.g. run out) — rare; check commentary flow.',
    );
  }
  if (has('milestone') && has('match_result') && has('wicket')) {
    push(
      'milestone_match_result_and_wicket',
      'Triple stack — winning wicket plus milestone should not occur under current scoring rules.',
      'impossible',
    );
  }
  if (has('wicket') && has('innings_end')) {
    push(
      'wicket_and_innings_end',
      'Innings closed on a wicket (all out or chase won on wicket) — verify order sounds natural.',
    );
  }
  if (has('match_result') && has('wicket') && has('innings_end')) {
    push(
      'match_result_wicket_and_innings_end',
      'Three terminal signals on one delivery — likely a wiring bug.',
      'impossible',
    );
  }
  if (has('milestone') && has('innings_end') && has('wicket')) {
    push(
      'milestone_innings_end_and_wicket',
      'Milestone should not coexist with wicket on the same ball.',
      'impossible',
    );
  }

  warnings.forEach(({ reason, kind, detail }) => {
    console.warn(
      '[audio-sequence-warning]',
      `events=${JSON.stringify(sequence)}`,
      `reason=${reason}`,
      `kind=${kind}`,
      detail,
    );
  });
};
