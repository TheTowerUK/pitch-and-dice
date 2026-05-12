import {
  ANALYST_PROBABILITY,
  CMT_POOLS,
  CMT_DURATION,
  GENERAL_CMTS,
  GENERAL_COMMENTARY_CHANCE,
  GENERAL_COMMENTARY_COOLDOWN_MS,
  GENERAL_COMMENTARY_MAX_MS,
  GENERAL_COMMENTARY_MIN_MS,
  POOL_PRIORITY,
  SPEECH_PRIORITY,
} from './audioAssets';

let reservation = null;
let cmtScheduler = null;
let lastAnalystAt = 0;
let lastCloseAt = 0;
const dedupeMap = {};
const counts = {};
const lastPoolPick = {};
let lastGeneralPick = null;

const DEDUPE_WINDOW_MS = 5000;
const ANALYST_DELAY_MS = 400;
const ANALYST_MIN_GAP_MS = 2500;
const CLOSE_MIN_GAP_MS = 4500;
/**
 * Optional fast scheduler overrides for controlled local validation.
 * Standard pacing uses GENERAL_COMMENTARY_* from audioAssets.
 */
export const ENABLE_FAST_GENERAL_COMMENTARY_TEST = false;
const DEV_GENERAL_FAST_TEST_OVERRIDES = (typeof __DEV__ !== 'undefined' && __DEV__ && ENABLE_FAST_GENERAL_COMMENTARY_TEST)
  ? {
      chance: 0.95,
      minMs: 4000,
      maxMs: 7000,
      generalCooldownMs: 5000,
    }
  : null;
let lastGeneralCommentaryStartedAt = 0;
let lastGeneralCommentaryEndedAt = 0;
let generalCommentaryInFlight = false;

/** Post–wicket-lead analyst `new_batter` follow-up (queued; see queueNewBatterFollowUpAfterWicketLead). */
const NEW_BATTER_FOLLOWUP_DELAY_MIN_MS = 400;
const NEW_BATTER_FOLLOWUP_DELAY_MAX_MS = 700;
const NEW_BATTER_FOLLOWUP_POLL_MS = 100;
const NEW_BATTER_FOLLOWUP_RETRY_MS = 250;
const NEW_BATTER_FOLLOWUP_MAX_RETRIES = 4;
let newBatterFollowUpGeneration = 0;
let pendingNewBatterWicketOwner = null;

/** Incremented when analyst state is reset so pending retries can no-op safely. */
let analystSessionGeneration = 0;

const bumpNewBatterFollowUpGeneration = (reason, logLabel) => {
  newBatterFollowUpGeneration += 1;
  pendingNewBatterWicketOwner = null;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[commentary-debug] new_batter ${logLabel} reason=${reason}`);
  }
};

export const cancelNewBatterFollowUp = (reason) => {
  bumpNewBatterFollowUpGeneration(reason, 'cancelled');
};

export const resetAnalystCommentaryState = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] analyst state reset');
  }
  analystSessionGeneration += 1;
  lastAnalystAt = 0;
  Object.keys(dedupeMap).forEach((key) => {
    if (key.startsWith('analyst:')) delete dedupeMap[key];
  });
  cancelNewBatterFollowUp('analyst_state_reset');
  if (reservation && typeof reservation.owner === 'string' && reservation.owner.startsWith('analyst:')) {
    clearReservation();
  }
};

/**
 * When a lead line reserves the speech lane with priority above analyst, cancel any queued new_batter follow-up.
 * Same wicket sequence shares `owner` with `pendingNewBatterWicketOwner` and is not treated as preempting.
 */
export const notifyLeadReservedForNewBatterFollowUp = ({ owner, poolKey }) => {
  const tier = POOL_PRIORITY[poolKey] || 'general';
  const priority = SPEECH_PRIORITY[tier] ?? SPEECH_PRIORITY.general;
  if (priority <= SPEECH_PRIORITY.analyst) return;
  if (owner && owner === pendingNewBatterWicketOwner) return;
  cancelNewBatterFollowUp('higher_priority_lead');
};

const isNewBatterFollowUpGateClear = (playback) => {
  if (playback.getCurrentSpeechKey?.()) return false;
  if (playback.isCommentaryClipPlaying?.()) return false;
  if (isSpeechLaneBusy()) return false;
  return true;
};

/**
 * Single attempt at analyst new_batter (probability, dedupe, lane, play). Caller handles retries when `retryable`.
 */
const attemptAnalystNewBatterPlayback = async (context, playback) => {
  if (!playback.getPlaybackAllowed()) return { ok: false, retryable: false, reason: 'playback_not_allowed' };
  if (Date.now() - lastAnalystAt < ANALYST_MIN_GAP_MS) {
    return { ok: false, retryable: true, reason: 'analyst_min_gap' };
  }
  const speechKey = playback.getCurrentSpeechKey?.() || '';
  if (speechKey.startsWith('cmt.lead.')) {
    return { ok: false, retryable: true, reason: 'lead_active' };
  }
  if (isSpeechLaneBusy()) return { ok: false, retryable: true, reason: 'speech_lane_busy' };
  if (playback.isCommentaryClipPlaying?.()) return { ok: false, retryable: true, reason: 'commentary_clip_playing' };

  if (context.dismissalConfirmed !== true) return { ok: false, retryable: false, reason: 'dismissal_not_confirmed' };
  if (context.newBatterRequiredInSameInnings !== true) {
    return {
      ok: false,
      retryable: false,
      reason: context.newBatterAnalystBlockReason || 'no_new_batter_required',
    };
  }

  const poolKey = 'new_batter';
  const configuredProbability = ANALYST_PROBABILITY[poolKey] ?? 0.5;
  const sample = Math.random();
  const configuredPool = CMT_POOLS[poolKey] || [];
  const loadedPool = configuredPool.filter((k) => playback.hasSound(k) || playback.hasAssetRef?.(k));
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] analyst attempt', {
      triggerReason: 'new_batter',
      poolName: poolKey,
      configuredProbability,
      sample,
      configuredPoolSize: configuredPool.length,
      loadedPoolSize: loadedPool.length,
    });
  }
  if (sample >= configuredProbability) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_probability_gate', { role: 'analyst', poolName: poolKey, configuredProbability, sample });
    }
    return { ok: false, retryable: false, reason: 'probability_gate' };
  }
  if (!tryConsumeDedupe(`analyst:${poolKey}:${context.ballStamp || 'default'}`)) {
    return { ok: false, retryable: false, reason: 'dedupe' };
  }
  if (!configuredPool.length) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_missing_pool', { role: 'analyst', poolName: poolKey });
    }
    return { ok: false, retryable: false, reason: 'missing_pool' };
  }
  if (!loadedPool.length) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_pool_not_ready', {
        role: 'analyst',
        poolName: poolKey,
        configuredPoolSize: configuredPool.length,
        loadedPoolSize: loadedPool.length,
      });
    }
    return { ok: false, retryable: false, reason: 'pool_not_ready' };
  }
  const priority = SPEECH_PRIORITY[POOL_PRIORITY[poolKey] || 'analyst'];
  const laneOwner = `analyst:${Date.now()}:${poolKey}`;
  if (!reserveSpeechLane({ owner: laneOwner, priority, delayMs: 0 })) {
    return { ok: false, retryable: true, reason: 'reserve_failed' };
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] new_batter playing');
  }
  const ok = await playReservedPoolCommentary({ owner: laneOwner, poolKey, playback, volume: 0.76, role: 'analyst' });
  if (ok) lastAnalystAt = Date.now();
  return { ok: !!ok, retryable: !ok, reason: ok ? undefined : 'play_failed' };
};

/**
 * After wicket *lead* commentary: wait until playback + lane idle, natural pause, then analyst new_batter (retries).
 */
export const queueNewBatterFollowUpAfterWicketLead = ({
  context,
  playback,
  wicketOwner,
  getCancelReason,
}) => {
  newBatterFollowUpGeneration += 1;
  const myGen = newBatterFollowUpGeneration;
  pendingNewBatterWicketOwner = wicketOwner;

  const shouldContinue = () => playback.getPlaybackAllowed() && myGen === newBatterFollowUpGeneration;

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] new_batter queued');
  }

  let loggedWaitingPoll = false;

  const checkHardCancel = () => {
    const r = getCancelReason?.() ?? null;
    if (!r) return false;
    bumpNewBatterFollowUpGeneration(r, 'cancelled');
    return true;
  };

  const waitUntilClear = () => {
    if (myGen !== newBatterFollowUpGeneration) return;
    if (checkHardCancel()) return;
    if (!playback.getPlaybackAllowed()) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] new_batter skipped reason=playback_not_allowed');
      }
      pendingNewBatterWicketOwner = null;
      return;
    }
    if (!isNewBatterFollowUpGateClear(playback)) {
      if (typeof __DEV__ !== 'undefined' && __DEV__ && !loggedWaitingPoll) {
        loggedWaitingPoll = true;
        console.log('[commentary-debug] new_batter waiting_for_lead_clear');
      }
      playback.queueAudioTimeout(waitUntilClear, NEW_BATTER_FOLLOWUP_POLL_MS, shouldContinue);
      return;
    }
    loggedWaitingPoll = false;
    const naturalDelay = NEW_BATTER_FOLLOWUP_DELAY_MIN_MS
      + Math.random() * (NEW_BATTER_FOLLOWUP_DELAY_MAX_MS - NEW_BATTER_FOLLOWUP_DELAY_MIN_MS);
    playback.queueAudioTimeout(runAfterNaturalDelay, naturalDelay, shouldContinue);
  };

  const runAfterNaturalDelay = () => {
    if (myGen !== newBatterFollowUpGeneration) return;
    if (checkHardCancel()) return;
    tryPlayWithRetries(0);
  };

  const tryPlayWithRetries = (retryIndex) => {
    if (myGen !== newBatterFollowUpGeneration) return;
    if (checkHardCancel()) return;
    if (!playback.getPlaybackAllowed()) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] new_batter skipped reason=playback_not_allowed');
      }
      pendingNewBatterWicketOwner = null;
      return;
    }
    if (!isNewBatterFollowUpGateClear(playback)) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] new_batter waiting_for_lead_clear');
      }
      if (retryIndex >= NEW_BATTER_FOLLOWUP_MAX_RETRIES) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[commentary-debug] new_batter skipped reason=max_retries_blocked');
        }
        pendingNewBatterWicketOwner = null;
        return;
      }
      playback.queueAudioTimeout(
        () => tryPlayWithRetries(retryIndex + 1),
        NEW_BATTER_FOLLOWUP_RETRY_MS,
        shouldContinue,
      );
      return;
    }

    (async () => {
      if (myGen !== newBatterFollowUpGeneration) return;
      const rEarly = getCancelReason?.() ?? null;
      if (rEarly) {
        bumpNewBatterFollowUpGeneration(rEarly, 'cancelled');
        return;
      }
      const result = await attemptAnalystNewBatterPlayback(context, playback);
      if (myGen !== newBatterFollowUpGeneration) return;
      if (result.ok) {
        pendingNewBatterWicketOwner = null;
        return;
      }
      if (result.retryable && retryIndex < NEW_BATTER_FOLLOWUP_MAX_RETRIES) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[commentary-debug] new_batter waiting_for_lead_clear');
        }
        playback.queueAudioTimeout(
          () => tryPlayWithRetries(retryIndex + 1),
          NEW_BATTER_FOLLOWUP_RETRY_MS,
          shouldContinue,
        );
        return;
      }
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[commentary-debug] new_batter skipped reason=${result.reason || 'unknown'}`);
      }
      pendingNewBatterWicketOwner = null;
    })();
  };

  playback.queueAudioTimeout(waitUntilClear, 0, shouldContinue);
};

const getCount = (k) => counts[k] || 0;
const bumpCount = (k) => { counts[k] = getCount(k) + 1; };
const randomChance = (p = 0) => Math.random() < p;
const isExpired = () => !reservation || Date.now() > reservation.expiresAt;

const clearReservation = () => { reservation = null; };

const pickLoadedKey = ({ keys = [], poolRefKey, lastPick, playback }) => {
  const loadedKeys = keys.filter((k) => playback.hasSound(k) || playback.hasAssetRef?.(k));
  if (!loadedKeys.length) return null;
  const options = loadedKeys.length > 1 ? loadedKeys.filter((k) => k !== lastPick) : loadedKeys;
  const min = Math.min(...options.map(getCount));
  const least = options.filter((k) => getCount(k) === min);
  const selected = least[Math.floor(Math.random() * least.length)];
  if (poolRefKey) lastPoolPick[poolRefKey] = selected;
  return selected;
};

const pickGeneral = ({ playback }) => pickLoadedKey({
  keys: GENERAL_CMTS,
  poolRefKey: null,
  lastPick: lastGeneralPick,
  playback,
});

const pickFromPool = ({ poolKey, playback }) => pickLoadedKey({
  keys: CMT_POOLS[poolKey] || [],
  poolRefKey: poolKey,
  lastPick: lastPoolPick[poolKey],
  playback,
});

export const isSpeechLaneBusy = () => !isExpired() && !!reservation;
const isSpeechActuallyBusy = (playback) => (
  isSpeechLaneBusy()
  || !!playback?.getCurrentSpeechKey?.()
  || !!playback?.isCommentaryClipPlaying?.()
);
/** True when audio layer reports active speech (ignores our speech-lane reservation). */
const isPlaybackSpeechActive = (playback) => (
  !!playback?.getCurrentSpeechKey?.()
  || !!playback?.isCommentaryClipPlaying?.()
);
const isGeneralCooldownActive = () => {
  const generalCooldownMs = DEV_GENERAL_FAST_TEST_OVERRIDES?.generalCooldownMs ?? GENERAL_COMMENTARY_COOLDOWN_MS;
  const now = Date.now();
  return (
    (now - lastGeneralCommentaryStartedAt) < generalCooldownMs
    || (now - lastGeneralCommentaryEndedAt) < generalCooldownMs
  );
};

/**
 * Conditions for a general line (phase is checked via canPlayGeneralCommentary).
 * When afterOwnReserve is true, our reservation makes isSpeechLaneBusy() true — skip that check.
 */
const isGeneralCommentarySafeToPlay = (playback, { afterOwnReserve = false } = {}) => {
  const laneOk = afterOwnReserve || !isSpeechLaneBusy();
  return (
    laneOk
    && !playback?.getCurrentSpeechKey?.()
    && !playback?.isCommentaryClipPlaying?.()
    && !generalCommentaryInFlight
    && !isGeneralCooldownActive()
  );
};

export const releaseSpeechIfOwned = (owner) => {
  if (reservation?.owner === owner) {
    clearReservation();
    return true;
  }
  return false;
};

export const reserveSpeechLane = ({ owner, priority, delayMs = 0 }) => {
  const now = Date.now();
  if (isExpired()) clearReservation();
  if (!reservation) {
    reservation = { owner, priority, startedAt: now, startAt: now + delayMs, expiresAt: now + delayMs + CMT_DURATION + 300 };
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] reserve_speech_lane', { owner, priority, delayMs, reason: 'empty_lane' });
    }
    return true;
  }
  if (priority > reservation.priority) {
    reservation = { owner, priority, startedAt: now, startAt: now + delayMs, expiresAt: now + delayMs + CMT_DURATION + 300 };
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] reserve_speech_lane', { owner, priority, delayMs, reason: 'priority_override' });
    }
    return true;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] skipped_lane_busy', { owner, priority, delayMs, lane: getSpeechLaneDebugState() });
  }
  return false;
};

export const forceReleaseSpeechLane = () => {
  clearReservation();
};

export const getSpeechLaneDebugState = () => ({
  busy: isSpeechLaneBusy(),
  owner: reservation?.owner ?? null,
  priority: reservation?.priority ?? null,
  expiresAt: reservation?.expiresAt ?? null,
});

const playReservedCommentary = async ({
  owner,
  pickClip,
  playback,
  volume = 0.8,
  role = 'lead',
  poolName = 'unknown',
  onSpeechEnd = null,
}) => {
  if (!reservation || reservation.owner !== owner) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_lane_busy', { owner, role, poolName, reason: 'reservation_owner_mismatch', lane: getSpeechLaneDebugState() });
    }
    return false;
  }
  if (Date.now() > reservation.expiresAt) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_expired_reservation', { owner, role, poolName, expiresAt: reservation.expiresAt });
    }
    clearReservation();
    return false;
  }
  if (isSpeechActuallyBusy(playback) && !isSpeechLaneBusy()) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_lane_busy_after_delay', {
        owner,
        role,
        poolName,
        currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
        commentaryClipPlaying: playback.isCommentaryClipPlaying?.() ?? false,
      });
    }
    return false;
  }
  const configuredPool = poolName === 'general'
    ? GENERAL_CMTS
    : (CMT_POOLS[poolName] || []);
  const loadedPool = configuredPool.filter((k) => playback.hasSound(k) || playback.hasAssetRef?.(k));
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[audio-commentary][request]', `key=pending pool=${poolName} role=${role}`);
  }
  if (!configuredPool.length) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[audio-commentary][skip]', `reason=missing_pool key=none pool=${poolName}`);
      console.log('[commentary-debug] skipped_missing_pool', { role, poolName });
    }
    clearReservation();
    return false;
  }
  if (!loadedPool.length) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[audio-commentary][skip]', `reason=pool_not_ready key=none pool=${poolName}`);
      console.log('[commentary-debug] skipped_pool_not_ready', {
        role,
        poolName,
        configuredPoolSize: configuredPool.length,
        loadedPoolSize: loadedPool.length,
      });
    }
    clearReservation();
    return false;
  }
  const key = pickClip();
  if (poolName === 'general') lastGeneralPick = key;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[audio-commentary][request]', `key=${key || 'none'} pool=${poolName}`);
    console.log('[audio-commentary][resolve]', `key=${key || 'none'} exists=${!!(key && (playback.hasSound(key) || playback.hasAssetRef?.(key)))}`);
    const hasAsset = !!(key && playback.hasAssetRef?.(key));
    const hasLoadedSound = !!(key && playback.hasSound(key));
    console.log('[commentary-debug] selected', {
      role,
      poolName,
      selectedKey: key,
      hasAsset,
      hasLoadedSound,
      configuredPoolSize: configuredPool.length,
      loadedPoolSize: loadedPool.length,
      selectedFromLoadedOnly: true,
      playbackAllowed: playback.getPlaybackAllowed(),
      currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
      speechLaneBusy: isSpeechLaneBusy(),
    });
    if (poolName === 'general' && key) {
      console.log('[commentary-debug] general playing', { selectedKey: key });
    }
  }
  const hasLoadedSound = !!(key && playback.hasSound(key));
  const hasAssetRef = !!(key && playback.hasAssetRef?.(key));
  if (!key || (!hasLoadedSound && !hasAssetRef)) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[audio-commentary][skip]', `reason=missing_asset key=${key || 'none'} pool=${poolName}`);
      console.log('[commentary-debug] skipped_missing_clip', {
        role,
        poolName,
        selectedKey: key,
        hasSound: hasLoadedSound,
        hasAssetRef,
      });
    }
    clearReservation();
    return false;
  }
  if (poolName === 'general' && isPlaybackSpeechActive(playback)) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[audio-commentary][skip]', `reason=speech_busy key=${key || 'none'} pool=${poolName}`);
      console.log('[commentary-debug] skipped_lane_busy_after_delay', {
        owner,
        role,
        poolName,
        phase: 'before_playSfx',
        currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
        commentaryClipPlaying: playback.isCommentaryClipPlaying?.() ?? false,
      });
    }
    releaseSpeechIfOwned(owner);
    return false;
  }
  const sfxOptions = poolName === 'general' && onSpeechEnd ? { onSpeechEnd } : {};
  if (typeof __DEV__ !== 'undefined' && __DEV__ && hasAssetRef && !hasLoadedSound) {
    console.log('[audio-speech][load]', { key, reason: 'lazy_asset_ref' });
  }
  const ok = await playback.playSfx(key, volume, sfxOptions);
  if (ok) bumpCount(key);
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(ok ? '[commentary-debug] playing' : '[commentary-debug] play_failed', { role, poolName, selectedKey: key, volume });
  }
  setTimeout(() => {
    releaseSpeechIfOwned(owner);
  }, CMT_DURATION);
  return ok;
};

export const playReservedPoolCommentary = async ({
  owner,
  poolKey,
  playback,
  volume = 0.8,
  role = 'lead',
}) => playReservedCommentary({ owner, pickClip: () => pickFromPool({ poolKey, playback }), playback, volume, role, poolName: poolKey });

export const playReservedGeneralCommentary = async ({
  owner,
  playback,
  volume = 0.58,
}) => {
  const onSpeechEnd = ({ reason }) => {
    lastGeneralCommentaryEndedAt = Date.now();
    generalCommentaryInFlight = false;
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] general cooldown reset', {
        lastGeneralCommentaryStartedAt,
        lastGeneralCommentaryEndedAt,
        cooldownMs: DEV_GENERAL_FAST_TEST_OVERRIDES?.generalCooldownMs ?? GENERAL_COMMENTARY_COOLDOWN_MS,
        speechEndReason: reason,
      });
      console.log('[commentary-debug] general in_flight', { value: generalCommentaryInFlight });
    }
  };

  generalCommentaryInFlight = true;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] general in_flight', { value: generalCommentaryInFlight });
  }
  try {
    const ok = await playReservedCommentary({
      owner,
      pickClip: () => pickGeneral({ playback }),
      playback,
      volume,
      role: 'lead',
      poolName: 'general',
      onSpeechEnd,
    });
    if (!ok) return false;
    lastGeneralCommentaryStartedAt = Date.now();
    return true;
  } finally {
    if (!(playback.getCurrentSpeechKey?.() || '').startsWith('cmt.lead.general_')) {
      generalCommentaryInFlight = false;
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] general in_flight', { value: generalCommentaryInFlight, reason: 'finally_reset' });
      }
    }
  }
};

const tryConsumeDedupe = (key) => {
  const now = Date.now();
  const prev = dedupeMap[key];
  if (prev && now - prev < DEDUPE_WINDOW_MS) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] skipped_dedupe', { key, elapsedMs: now - prev, dedupeWindowMs: DEDUPE_WINDOW_MS });
    }
    return false;
  }
  dedupeMap[key] = now;
  return true;
};

const shouldTriggerPartnership = (runs = 0) => {
  if (runs % 100 === 0 && runs > 0) return 'partnership_release';
  if (runs >= 60) return 'partnership_pressure';
  if (runs >= 20) return 'partnership_building';
  return null;
};

export const maybePlayAnalystFollowUp = ({ context = {}, playback }) => {
  if (!playback.getPlaybackAllowed()) return;
  const sessionGen = analystSessionGeneration;
  const sessionInvalidated = () => sessionGen !== analystSessionGeneration;
  const logSkip = (reason) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[commentary-debug] analyst skipped reason=${reason}`);
    }
  };
  const delayMs = Math.max(ANALYST_DELAY_MS, context?.leadDelayMs || 0) + 120;
  playback.queueAudioTimeout(async () => {
    if (sessionInvalidated()) { logSkip('session_invalidated'); return; }
    if (!playback.getPlaybackAllowed()) { logSkip('playback_not_allowed'); return; }

    if (context.wicket) {
      if (context.dismissalConfirmed !== true) { logSkip('dismissal_not_confirmed'); return; }
      if (context.newBatterRequiredInSameInnings !== true) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          const reason = context.newBatterAnalystBlockReason || 'replacement not required this innings';
          console.log(`[analyst] blocked new-batter line because ${reason}`);
        }
        logSkip('new_batter_not_required');
        return;
      }
      const runWicketAnalyst = (retry = 0) => {
        if (sessionInvalidated()) { logSkip('session_invalidated'); return; }
        if (!playback.getPlaybackAllowed()) { logSkip('playback_not_allowed'); return; }
        (async () => {
          const result = await attemptAnalystNewBatterPlayback(context, playback);
          if (sessionInvalidated()) { logSkip('session_invalidated'); return; }
          if (result.ok) return;
          if (!result.retryable || retry >= NEW_BATTER_FOLLOWUP_MAX_RETRIES) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.log(`[commentary-debug] new_batter skipped reason=${result.reason || 'unknown'}`);
            }
            logSkip(result.reason || 'unknown');
            return;
          }
          playback.queueAudioTimeout(
            () => runWicketAnalyst(retry + 1),
            NEW_BATTER_FOLLOWUP_RETRY_MS,
            () => !sessionInvalidated() && playback.getPlaybackAllowed(),
          );
        })();
      };
      runWicketAnalyst(0);
      return;
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] analyst route context', {
        wicket: !!context.wicket,
        runs: Number.isFinite(Number(context.outcome)) ? Number(context.outcome) : null,
        overEnded: !!context.overEnded,
        lastStrikeChangeReason: context.lastStrikeChangeReason ?? null,
        strikeRotatedForRuns: context.strikeRotatedForRuns ?? null,
        partnershipRuns: context.partnershipRuns ?? null,
        ballStamp: context.ballStamp ?? null,
        analystRetryCount: context.analystRetryCount || 0,
      });
    }

    if (Date.now() - lastAnalystAt < ANALYST_MIN_GAP_MS) {
      logSkip('analyst_min_gap');
      return;
    }
    if ((playback.getCurrentSpeechKey?.() || '').startsWith('cmt.lead.')) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] skipped_lane_busy_after_delay', { role: 'analyst', reason: 'lead_active', currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null });
        console.log('[audio-commentary][blocked]', 'reason=speech_busy role=analyst source=lead_active');
      }
      logSkip('lead_active');
      if ((context?.analystRetryCount || 0) >= 2) return;
      playback.queueAudioTimeout(
        () => {
          if (sessionInvalidated()) { logSkip('session_invalidated'); return; }
          maybePlayAnalystFollowUp({
            context: {
              ...context,
              leadDelayMs: 0,
              analystRetryCount: (context?.analystRetryCount || 0) + 1,
            },
            playback,
          });
        },
        700,
        () => !sessionInvalidated() && playback.getPlaybackAllowed(),
      );
      return;
    }
    if (isSpeechLaneBusy()) {
      logSkip('lane_busy');
      if ((context?.analystRetryCount || 0) >= 2) return;
      playback.queueAudioTimeout(
        () => {
          if (sessionInvalidated()) { logSkip('session_invalidated'); return; }
          maybePlayAnalystFollowUp({
            context: {
              ...context,
              leadDelayMs: 0,
              analystRetryCount: (context?.analystRetryCount || 0) + 1,
            },
            playback,
          });
        },
        700,
        () => !sessionInvalidated() && playback.getPlaybackAllowed(),
      );
      return;
    }

    let poolKey = null;
    let triggerReason = null;
    {
      const runs = Number(context.outcome);
      const runsKnown = !Number.isNaN(runs);

      if (runsKnown && runs === 0) {
        if (context.overEnded === true && context.lastStrikeChangeReason === 'end_of_over') {
          poolKey = 'over_end_rotate';
          triggerReason = 'over_end_rotate';
        } else {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[commentary-debug] analyst skip', JSON.stringify({ reason: 'dot_ball_no_strike_change', runs: 0 }));
          }
          logSkip('dot_ball_no_strike_change');
          return;
        }
      } else if (runsKnown && (runs === 1 || runs === 3)) {
        if (context.strikeRotatedForRuns === false) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[commentary-debug] analyst skip', JSON.stringify({ reason: 'strike_rotate_no_legal_swap', runs }));
          }
          logSkip('strike_rotate_no_legal_swap');
          return;
        }
        poolKey = 'strike_rotate';
        triggerReason = 'strike_rotate';
      } else if (runsKnown && (runs === 4 || runs === 6)) {
        poolKey = 'boundary_hold';
        triggerReason = 'boundary_hold';
      } else if (runsKnown && runs === 2) {
        poolKey = 'strike_hold';
        triggerReason = 'strike_hold';
      } else if (context.overEnded === true && context.lastStrikeChangeReason === 'end_of_over') {
        poolKey = 'over_end_rotate';
        triggerReason = 'over_end_rotate';
      } else if (runsKnown && runs > 0) {
        poolKey = shouldTriggerPartnership(context.partnershipRuns);
        triggerReason = poolKey ? 'partnership' : null;
      }
    }

    if (!poolKey) {
      logSkip('no_pool_match');
      return;
    }
    const configuredProbability = ANALYST_PROBABILITY[poolKey] ?? 0.5;
    const sample = Math.random();
    const configuredPool = CMT_POOLS[poolKey] || [];
    const loadedPool = configuredPool.filter((k) => playback.hasSound(k) || playback.hasAssetRef?.(k));
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] analyst attempt', {
        triggerReason,
        poolName: poolKey,
        configuredProbability,
        sample,
        configuredPoolSize: configuredPool.length,
        loadedPoolSize: loadedPool.length,
      });
    }
    if (sample >= configuredProbability) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] skipped_probability_gate', { role: 'analyst', poolName: poolKey, configuredProbability, sample });
      }
      logSkip('probability_gate');
      return;
    }
    if (!tryConsumeDedupe(`analyst:${poolKey}:${context.ballStamp || 'default'}`)) {
      logSkip('dedupe');
      return;
    }
    if (!configuredPool.length) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] skipped_missing_pool', { role: 'analyst', poolName: poolKey });
      }
      logSkip('missing_pool');
      return;
    }
    if (!loadedPool.length) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] skipped_pool_not_ready', {
          role: 'analyst',
          poolName: poolKey,
          configuredPoolSize: configuredPool.length,
          loadedPoolSize: loadedPool.length,
        });
      }
      logSkip('pool_not_ready');
      return;
    }
    const priority = SPEECH_PRIORITY[POOL_PRIORITY[poolKey] || 'analyst'];
    const owner = `analyst:${Date.now()}:${poolKey}`;
    if (!reserveSpeechLane({ owner, priority, delayMs: 0 })) {
      logSkip('reserve_failed');
      return;
    }
    if (sessionInvalidated()) {
      releaseSpeechIfOwned(owner);
      logSkip('session_invalidated');
      return;
    }
    const ok = await playReservedPoolCommentary({ owner, poolKey, playback, volume: 0.76, role: 'analyst' });
    if (ok) lastAnalystAt = Date.now();
    if (!ok) logSkip('play_failed');
  }, delayMs, () => !sessionInvalidated() && playback.getPlaybackAllowed());
};

export const canFireCloseCommentary = () => {
  const now = Date.now();
  if (now - lastCloseAt < CLOSE_MIN_GAP_MS) return false;
  lastCloseAt = now;
  return true;
};

export const startAmbientCommentaryScheduler = ({ playback, canPlayGeneralCommentary = () => true }) => {
  if (cmtScheduler) {
    clearTimeout(cmtScheduler);
    cmtScheduler = null;
  }
  const chance = DEV_GENERAL_FAST_TEST_OVERRIDES?.chance ?? GENERAL_COMMENTARY_CHANCE;
  const minMs = DEV_GENERAL_FAST_TEST_OVERRIDES?.minMs ?? GENERAL_COMMENTARY_MIN_MS;
  const maxMs = DEV_GENERAL_FAST_TEST_OVERRIDES?.maxMs ?? GENERAL_COMMENTARY_MAX_MS;
  const generalCooldownMs = DEV_GENERAL_FAST_TEST_OVERRIDES?.generalCooldownMs ?? GENERAL_COMMENTARY_COOLDOWN_MS;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] general scheduler config', {
      chance,
      minMs,
      maxMs,
      generalCommentaryCooldownMs: generalCooldownMs,
      fastGeneralCommentaryTest: !!DEV_GENERAL_FAST_TEST_OVERRIDES,
    });
  }
  const tick = () => {
    if (!canPlayGeneralCommentary()) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[commentary-debug] general scheduler skip', { reason: 'skipped_not_live_phase' });
      }
      cmtScheduler = null;
      return;
    }
    const delay = minMs + Math.random() * (maxMs - minMs);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[commentary-debug] general scheduler armed', {
        delayMs: delay,
        generalCommentaryInFlight,
        lastGeneralCommentaryStartedAt,
        lastGeneralCommentaryEndedAt,
      });
    }
    cmtScheduler = setTimeout(async () => {
      const generalAllowedNow = canPlayGeneralCommentary();
      if (!generalAllowedNow) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[commentary-debug] general scheduler skip', { reason: 'skipped_not_live_phase_after_delay' });
        }
        cmtScheduler = null;
        return;
      }

      const playbackAllowed = playback.getPlaybackAllowed();
      const chancePass = Math.random() < chance;

      if (!playbackAllowed || !isGeneralCommentarySafeToPlay(playback)) {
        console.log('[audio-commentary][skip]', 'reason=general_not_safe_or_cooldown pool=general');
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[commentary-debug] general scheduler skip', {
            reason: 'general_not_safe_or_cooldown',
            playbackAllowed,
            speechLaneBusy: isSpeechLaneBusy(),
            currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
            commentaryClipPlaying: playback.isCommentaryClipPlaying?.() ?? false,
            generalCommentaryInFlight,
            generalCooldownActive: isGeneralCooldownActive(),
          });
        }
        tick();
        return;
      }

      if (!chancePass) {
        tick();
        return;
      }

      const owner = `ambient:${Date.now()}`;
      if (!reserveSpeechLane({ owner, priority: SPEECH_PRIORITY.general, delayMs: 0 })) {
        console.log('[audio-commentary][skip]', 'reason=general_not_safe_or_cooldown pool=general');
        tick();
        return;
      }

      if (!canPlayGeneralCommentary() || !isGeneralCommentarySafeToPlay(playback, { afterOwnReserve: true })) {
        releaseSpeechIfOwned(owner);
        console.log('[audio-commentary][skip]', 'reason=general_not_safe_or_cooldown pool=general');
        tick();
        return;
      }

      await playReservedGeneralCommentary({ owner, playback, volume: 0.58 });
      tick();
    }, delay);
  };
  tick();
};

export const stopAmbientCommentaryScheduler = () => {
  if (cmtScheduler) {
    clearTimeout(cmtScheduler);
    cmtScheduler = null;
  }
  clearReservation();
};

export const getCommentaryUsageStats = () => {
  const allKeys = [...GENERAL_CMTS, ...Object.values(CMT_POOLS).flat()];
  const countsMap = {};
  allKeys.forEach((k) => { countsMap[k] = getCount(k); });
  const unused = [...new Set(allKeys.filter((k) => countsMap[k] === 0))];
  return { totalTracked: allKeys.length, used: allKeys.length - unused.length, unused, counts: countsMap };
};
