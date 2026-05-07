import { evaluatePressureContextFromMatch } from './pressureEngine';
import { getLockedSpecialEventConfig, getSpecialLeadCommentaryKey } from './specialEvents';
import {
  COMMENTARY_SFX_ASSETS,
  CRITICAL_SFX_ASSETS,
  LOOP_ASSETS,
  POOL_PRIORITY,
  SPEECH_PRIORITY,
  hasCommentaryPool,
  logCommentaryPoolValidation,
} from './audio/audioAssets';
import * as playback from './audio/audioPlayback';
import { cancelNewBatterFollowUp, canFireCloseCommentary, forceReleaseSpeechLane, getCommentaryUsageStats as getOrchestratorUsageStats, getSpeechLaneDebugState, maybePlayAnalystFollowUp, notifyLeadReservedForNewBatterFollowUp, playReservedPoolCommentary, queueNewBatterFollowUpAfterWicketLead, releaseSpeechIfOwned, reserveSpeechLane, resetAnalystCommentaryStateForDevScenario, startAmbientCommentaryScheduler, stopAmbientCommentaryScheduler } from './audio/commentaryOrchestrator';

// Re-export dev-only commentary reset (used by Development menu scenario jumps in GameScreen).
export { resetAnalystCommentaryStateForDevScenario };

export const MENU_AUDIO_PHASES = new Set(['format_select','mode_select','team_select','player_setup','setup','innings_break','match_summary']);
export const LIVE_MATCH_AUDIO_PHASES = new Set(['batting','wicket_pending','special_event','bowler_select','field_setup','new_batsman','over_complete','innings_end','match_complete']);
/** General commentary only during calm open play (between deliveries), not transitions or set-pieces. */
const GENERAL_COMMENTARY_ALLOWED_PHASES = new Set(['batting']);
const GENERAL_COMMENTARY_BLOCKED_PHASES = new Set([
  'format_select',
  'mode_select',
  'team_select',
  'player_setup',
  'pitch_select',
  'toss',
  'batting_order',
  'setup',
  'menu',
  'help',
  'pause',
  'paused',
  'wicket_pending',
  'over_complete',
  'bowler_select',
  'field_setup',
  'new_batsman',
  'innings_break',
  'innings_end',
  'match_summary',
  'match_complete',
  'special_event',
]);

let specialEventAudioMode = false;
let matchGamePhaseForAudioResume = null;
let baseMode = null;
/** Resolves when commentary clips are in sfxCache; reset after unload. */
let recoveryInFlightPromise = null;
let crowdAmbientPlaying = false;
let abActive = 'A';
let abSwapTimer = null;
let latestGeneralCommentaryState = null;
// Temporary channel toggles for isolation/testing.
// Channel 1/2: match ambient A/B (always on in match mode)
// Channel 3: lead commentary (on)
// Channel 4: analyst commentary (off)
// Channel 5: general/ambient commentary scheduler (off)
const ENABLE_BALL_SFX = true;
const ENABLE_LEAD_COMMENTARY = true;
const ENABLE_ANALYST_COMMENTARY = true;
const ENABLE_GENERAL_COMMENTARY = true;

// Ambient A/B timing — assets are non-looping (~20.625 s); next active channel's
// crossfade-out must finish before its file naturally ends. Constraint:
// 2 * AMBIENT_OVERLAP_MS + AMBIENT_SWAP_MS <= file length (20625 ms).
const AMBIENT_DURATION_MS = 20625;
const AMBIENT_TARGET_VOLUME = 0.25;
const AMBIENT_OVERLAP_MS = 3000;
const AMBIENT_SWAP_MS = 13000;

const getBaseAudioMode = (state) => (LIVE_MATCH_AUDIO_PHASES.has(state?.gamePhase) ? 'match' : 'menu');
export const canPlayGeneralCommentary = (state) => {
  const phase = state?.gamePhase ?? null;
  const screen = state?.screen ?? null;
  if (screen && screen !== 'game') return false;
  if (!phase) return false;
  if (GENERAL_COMMENTARY_BLOCKED_PHASES.has(phase)) return false;
  return GENERAL_COMMENTARY_ALLOWED_PHASES.has(phase);
};
const syncGeneralCommentarySchedulerForState = (state = latestGeneralCommentaryState) => {
  latestGeneralCommentaryState = state ?? latestGeneralCommentaryState;
  if (!ENABLE_GENERAL_COMMENTARY) return;
  const generalAllowed = canPlayGeneralCommentary(latestGeneralCommentaryState);
  if (baseMode !== 'match' || !crowdAmbientPlaying || specialEventAudioMode || !generalAllowed) {
    stopAmbientCommentaryScheduler();
    return;
  }
  startAmbientCommentaryScheduler({
    playback,
    canPlayGeneralCommentary: () => canPlayGeneralCommentary(latestGeneralCommentaryState),
  });
};
const clearABSwapTimer = () => {
  if (abSwapTimer) {
    clearTimeout(abSwapTimer);
    abSwapTimer = null;
  }
};

const getActiveAmbientKey = () => (abActive === 'A' ? 'ambientA' : 'ambientB');
const getInactiveAmbientKey = () => (abActive === 'A' ? 'ambientB' : 'ambientA');

const startAmbientLoop = async (key, volume = AMBIENT_TARGET_VOLUME) => playback.playLoop(key, volume);

const runAmbientCrossfade = async (fromKey, toKey, durationMs) => {
  const steps = Math.max(8, Math.floor(durationMs / 120));
  const stepMs = Math.max(60, Math.floor(durationMs / steps));
  if (__DEV__) {
    console.log('[ambient-test] fade start', { fromKey, toKey, durationMs, steps, stepMs });
    console.log('[ambient-test] fade start volumes', { oldChannelVolume: AMBIENT_TARGET_VOLUME, newChannelVolume: 0 });
  }
  for (let i = 0; i <= steps; i += 1) {
    if (!crowdAmbientPlaying || !playback.getPlaybackAllowed()) return false;
    const t = i / steps;
    const nextVol = AMBIENT_TARGET_VOLUME * t;
    const prevVol = AMBIENT_TARGET_VOLUME * (1 - t);
    await playback.setLoopVolume(toKey, nextVol);
    await playback.setLoopVolume(fromKey, prevVol);
    if (i < steps) {
      await new Promise((resolve) => setTimeout(resolve, stepMs));
    }
  }
  if (__DEV__) console.log('[ambient-test] fade complete', { toKey, fromKey });
  return true;
};

const scheduleABSwap = () => {
  if (__DEV__) console.log('[ambient-test] scheduleABSwap', { crowdAmbientPlaying, abActive, hasABSwapTimer: !!abSwapTimer });
  clearABSwapTimer();
  if (!crowdAmbientPlaying) return;
  abSwapTimer = setTimeout(async () => {
    if (__DEV__) console.log('[ambient-test] swap fire', { crowdAmbientPlaying, abActive, hasABSwapTimer: !!abSwapTimer });
    if (!crowdAmbientPlaying || !playback.getPlaybackAllowed()) return;
    const nextKey = getInactiveAmbientKey();
    const prevKey = getActiveAmbientKey();
    const nextStarted = await startAmbientLoop(nextKey, 0);
    if (__DEV__) console.log('[ambient-test] start next ambient', { nextKey, prevKey, nextStarted });
    if (!nextStarted) {
      scheduleABSwap();
      return;
    }
    const faded = await runAmbientCrossfade(prevKey, nextKey, AMBIENT_OVERLAP_MS);
    if (!faded || !crowdAmbientPlaying) return;
    await playback.stopLoop(prevKey);
    await playback.setLoopVolume(nextKey, AMBIENT_TARGET_VOLUME);
    if (__DEV__) {
      console.log('[ambient-test] new channel final volume', { key: nextKey, volume: AMBIENT_TARGET_VOLUME });
      console.log('[ambient-test] old channel stopped after fade', { key: prevKey });
    }
    abActive = nextKey === 'ambientA' ? 'A' : 'B';
    if (__DEV__) console.log('[ambient-test] overlap complete stop previous', { stopped: prevKey, activeNow: abActive });
    scheduleABSwap();
  }, AMBIENT_SWAP_MS);
};

const startCrowdAmbient = async () => {
  if (__DEV__) console.log('[ambient-test] startCrowdAmbient before', { crowdAmbientPlaying, abActive, hasABSwapTimer: !!abSwapTimer, currentLoop: playback.getCurrentLoopKey() });
  crowdAmbientPlaying = true;
  clearABSwapTimer();
  abActive = 'A';
  await playback.stopLoops();
  const started = await startAmbientLoop('ambientA', AMBIENT_TARGET_VOLUME);
  if (__DEV__) console.log('[ambient-test] ambient timing', {
    AMBIENT_DURATION_MS,
    AMBIENT_SWAP_MS,
    AMBIENT_OVERLAP_MS,
    AMBIENT_TARGET_VOLUME,
  });
  if (started) scheduleABSwap();
  if (__DEV__) console.log('[ambient-test] startCrowdAmbient after', { started, crowdAmbientPlaying, abActive, hasABSwapTimer: !!abSwapTimer, currentLoop: playback.getCurrentLoopKey() });
  return started;
};

const getAmbientDebugState = () => ({
  crowdAmbientPlaying,
  abActive,
  hasABSwapTimer: !!abSwapTimer,
  baseMode,
  currentLoop: playback.getCurrentLoopKey(),
});

const stopCrowdAmbient = async () => {
  if (__DEV__) console.log('[ambient-test] stopCrowdAmbient before', { crowdAmbientPlaying, abActive, hasABSwapTimer: !!abSwapTimer, currentLoop: playback.getCurrentLoopKey() });
  crowdAmbientPlaying = false;
  clearABSwapTimer();
  await playback.stopLoops();
  if (__DEV__) console.log('[ambient-test] stopCrowdAmbient after', { crowdAmbientPlaying, abActive, hasABSwapTimer: !!abSwapTimer, currentLoop: playback.getCurrentLoopKey() });
};

const requestSpeech = async ({
  role,
  poolKey,
  owner,
  delay = 0,
  volume = 0.62,
  allowDuringSpecial = false,
}) => {
  const roleEnabled = role === 'lead' ? ENABLE_LEAD_COMMENTARY : ENABLE_ANALYST_COMMENTARY;
  if (!roleEnabled) return false;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[audio-speech][request]', { role, poolKey, owner, delay, volume });
    console.log('[audio-commentary][request]', `key=pending pool=${poolKey}`);
    console.log('[audio-lock]', {
      speechLaneBusy: getSpeechLaneDebugState()?.busy ?? false,
      currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
      commentaryPlaying: playback.isCommentaryClipPlaying?.() ?? false,
      reservation: getSpeechLaneDebugState?.() ?? null,
    });
  }
  if (!hasCommentaryPool(role, poolKey)) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[commentary] missing pool', { role, poolKey });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[commentary-debug] skipped_missing_pool', { role, poolName: poolKey });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[audio-speech][skip]', { reason: 'missing_pool', role, poolKey });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[audio-commentary][skip]', `reason=missing_pool key=none pool=${poolKey}`);
    return false;
  }
  if (specialEventAudioMode && !allowDuringSpecial) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[commentary-debug] skipped_special_event_mode', { role, poolName: poolKey });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[audio-speech][skip]', { reason: 'special_mode', role, poolKey });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[audio-commentary][blocked]', `reason=special_mode key=none pool=${poolKey}`);
    return false;
  }
  const priorityKey = POOL_PRIORITY[poolKey] || 'general';
  const priority = SPEECH_PRIORITY[priorityKey] || (role === 'analyst' ? SPEECH_PRIORITY.analyst : SPEECH_PRIORITY.general);
  if (typeof __DEV__ !== 'undefined' && __DEV__ && !POOL_PRIORITY[poolKey]) {
    console.log('[commentary-debug] missing priority mapping defaulted', { role: 'lead', poolName: poolKey, priorityKey });
  }
  const lane = getSpeechLaneDebugState();
  if (lane?.busy && (lane.priority ?? 0) >= priority) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[audio-speech][skip]', { reason: 'speech_busy_higher_or_equal_priority', role, poolKey, lanePriority: lane.priority, requestPriority: priority });
    }
    return false;
  }
  if (lane?.busy && (lane.priority ?? 0) < priority) {
    await playback.stopCurrentSpeech();
    forceReleaseSpeechLane();
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[commentary-debug] request lead pool=' + poolKey, {
      owner,
      delay,
      volume,
      priority,
      playbackAllowed: playback.getPlaybackAllowed(),
      currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
      speechLane: getSpeechLaneDebugState(),
      audio: playback.getAudioDebugState?.(),
    });
  }
  if (!reserveSpeechLane({ owner, priority, delayMs: delay })) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[commentary-debug] skipped_lane_busy', { role, poolName: poolKey, owner, lane: getSpeechLaneDebugState() });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[audio-speech][skip]', { reason: 'reserve_failed', role, poolKey });
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[audio-commentary][blocked]', `reason=speech_busy key=none pool=${poolKey}`);
    return false;
  }
  if (role === 'lead') {
    notifyLeadReservedForNewBatterFollowUp({ owner, poolKey });
  }
  playback.queueAudioTimeout(
    async () => {
      try {
        if (__DEV__) console.log('[audio-speech][selected]', { role, poolKey, owner });
        const ok = await playReservedPoolCommentary({ owner, poolKey, playback, volume, role });
        if (__DEV__) console.log(ok ? '[audio-speech][play]' : '[audio-speech][skip]', ok ? { role, poolKey, owner } : { reason: 'play_failed', role, poolKey, owner });
      } finally {
        releaseSpeechIfOwned(owner);
        if (__DEV__) console.log('[audio-speech][cleanup]', { role, poolKey, owner });
      }
    },
    delay,
    () => {
      const allowed = playback.getPlaybackAllowed();
      const notSpecial = allowDuringSpecial ? true : !specialEventAudioMode;
      if ((!allowed || !notSpecial) && typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(!allowed ? '[commentary-debug] skipped_playback_not_allowed' : '[commentary-debug] skipped_special_event_mode', {
          role,
          poolName: poolKey,
          playbackAllowed: allowed,
          specialEventAudioMode,
        });
        console.log('[audio-commentary][skip]', `reason=${!allowed ? 'playback_not_allowed' : 'special_mode'} key=none pool=${poolKey}`);
        console.log('[audio-speech][skip]', { reason: !allowed ? 'playback_not_allowed' : 'special_mode', role, poolKey });
      }
      return allowed && notSpecial;
    },
  );
  return true;
};

const runPool = async (poolKey, owner, delay = 0, volume = 0.62) => requestSpeech({ role: 'lead', poolKey, owner, delay, volume });
const runAnalystPool = async (poolKey, owner, delay = 0, volume = 0.56) => requestSpeech({ role: 'analyst', poolKey, owner, delay, volume });

export const initSounds = async () => {
  if (__DEV__) console.log('[audio-init] initSounds entered');
  await playback.initPlayback({ criticalAssets: CRITICAL_SFX_ASSETS, loopAssets: LOOP_ASSETS });
  if (__DEV__) console.log('[audio-init] after await initPlayback()');
  playback.registerSfxAssets(COMMENTARY_SFX_ASSETS);
  if (__DEV__) {
    const isCommentaryAvailable = (key) => playback.hasSound(key) || playback.hasAssetRef?.(key);
    logCommentaryPoolValidation({ isAvailable: isCommentaryAvailable });
    const startupSamples = [
      'cmt.lead.six_1',
      'cmt.lead.dot_calm_1',
      'cmt.analyst.boundary_hold_1',
    ];
    startupSamples.forEach((key) => {
      console.log('[audio-commentary][startup-check]', {
        selectedKey: key,
        expectedAssetKey: key,
        hasAssetRef: !!playback.hasAssetRef?.(key),
        hasSound: !!playback.hasSound(key),
        inCommentaryMap: !!COMMENTARY_SFX_ASSETS[key],
      });
    });
    const owzat = await playback.getSfxStatus('owzat');
    const menuLoopDuration = await playback.getLoopDurationMs('menu');
    console.log('[audio-init] critical duration check', { owzat, menuLoopDuration });
    if ((owzat?.durationMillis ?? 0) > 15000 && menuLoopDuration && Math.abs((owzat.durationMillis ?? 0) - menuLoopDuration) < 2000) {
      console.warn('[audio-init] owzat duration suspiciously close to menu loop', { owzatDurationMs: owzat.durationMillis, menuLoopDuration });
    }
  }
};

export const setMatchGamePhaseForAudioResume = (phase) => { matchGamePhaseForAudioResume = phase ?? null; };
export const getMatchGamePhaseForAudioResume = () => matchGamePhaseForAudioResume;

export const syncBaseAudioForState = async (state) => {
  if (!playback.getPlaybackAllowed()) return;
  latestGeneralCommentaryState = state ?? null;
  const mode = getBaseAudioMode(state);
  const activeLoop = playback.getCurrentLoopKey();
  const hasExpectedLoop = mode === 'match'
    ? (activeLoop === 'ambientA' || activeLoop === 'ambientB')
    : activeLoop === 'menu';
  if (__DEV__) console.log('[ambient-test] syncBaseAudioForState before', { phase: state?.gamePhase ?? null, mode, baseMode, activeLoop, hasExpectedLoop, ...getAmbientDebugState() });
  if (mode === baseMode && hasExpectedLoop) return;
  let applied = false;
  if (mode === 'match') {
    applied = await startCrowdAmbient();
    syncGeneralCommentarySchedulerForState(state);
  } else {
    stopAmbientCommentaryScheduler();
    crowdAmbientPlaying = false;
    clearABSwapTimer();
    await playback.stopLoops();
    applied = await playback.playLoop('menu', 0.55);
  }
  baseMode = mode;
  if (__DEV__) console.log('[ambient-test] syncBaseAudioForState after', { mode, applied, ...getAmbientDebugState() });
  return applied;
};

export const startMenuMusic = async () => {
  await initSounds();
  if (__DEV__) {
    console.log('[audio-dev] startMenuMusic entered');
    console.log('[audio-dev] startMenuMusic playbackAllowed=', playback.getPlaybackAllowed());
    console.log('[audio-dev] startMenuMusic specialEventAudioMode=', specialEventAudioMode);
    console.log('[audio-dev] startMenuMusic currentLoop before=', playback.getCurrentLoopKey());
  }
  stopAmbientCommentaryScheduler();
  crowdAmbientPlaying = false;
  clearABSwapTimer();
  await playback.stopLoops();
  baseMode = 'menu';
  const started = await playback.playLoop('menu', 0.55);
  if (__DEV__) {
    console.log('[audio-dev] startMenuMusic loop start returned=', started);
    console.log('[audio-dev] startMenuMusic currentLoop after=', playback.getCurrentLoopKey());
  }
  return started;
};

export const playMenuMusic = async () => startMenuMusic();

export const playMatchAmbient = async (stateForGeneral = null) => {
  await initSounds();
  if (stateForGeneral) latestGeneralCommentaryState = stateForGeneral;
  if (__DEV__) console.log('[ambient-test] playMatchAmbient called', { ...getAmbientDebugState() });
  const started = await startCrowdAmbient();
  syncGeneralCommentarySchedulerForState(latestGeneralCommentaryState);
  baseMode = 'match';
  if (__DEV__) console.log('[ambient-test] playMatchAmbient done', { started, ...getAmbientDebugState() });
  return started;
};

export const updateGeneralCommentaryState = (state) => {
  latestGeneralCommentaryState = state ?? null;
  syncGeneralCommentarySchedulerForState(latestGeneralCommentaryState);
};

export const stopMusic = async () => {
  stopAmbientCommentaryScheduler();
  forceReleaseSpeechLane();
  await playback.stopCurrentSpeech();
  await stopCrowdAmbient();
  baseMode = null;
};

export const stopMatchSounds = () => {
  stopAmbientCommentaryScheduler();
  forceReleaseSpeechLane();
  playback.stopCurrentSpeech();
  crowdAmbientPlaying = false;
  clearABSwapTimer();
};

export const playSound = playback.playSfx;
export const isAudioEnabled = () => playback.getPlaybackAllowed();
export const isAudioMuted = () => playback.isMuted();
export const hydrateAudioMutePreference = () => playback.hydrateMutePreference();

export const setAudioMuted = async (muted, restoreContext = null) => {
  if (__DEV__ && !muted) {
    console.log('[audio-dev] setAudioMuted(false) restoreContext.screen=', restoreContext?.screen);
    console.log('[audio-dev] setAudioMuted(false) restoreContext.gamePhase=', restoreContext?.gamePhase);
    console.log('[audio-dev] setAudioMuted(false) specialEventAudioMode=', specialEventAudioMode);
    console.log('[audio-dev] setAudioMuted(false) playbackAllowed()=', playback.getPlaybackAllowed());
  }
  await playback.setMuted(muted);
  if (muted) {
    // Prevent mode short-circuit on the next unmute restore.
    crowdAmbientPlaying = false;
    clearABSwapTimer();
    baseMode = null;
    return;
  }
  if (restoreContext) {
    await recoverAudioEngineAfterInterruption(
      restoreContext.screen ?? 'home',
      restoreContext.gamePhase ?? null,
    );
  }
};

export const enterSpecialEventAudioMode = () => {
  specialEventAudioMode = true;
  cancelNewBatterFollowUp('special_event');
  stopAmbientCommentaryScheduler();
  forceReleaseSpeechLane();
  playback.stopCurrentSpeech();
  // Keep match ambient loop(s) running under the special event popup.
  // Only speech/commentary channels are paused while the overlay is active.
};

export const exitSpecialEventAudioMode = async (stateForRestore = null) => {
  specialEventAudioMode = false;
  forceReleaseSpeechLane();
  if (stateForRestore) await syncBaseAudioForState(stateForRestore);
};

export const playSoundForRoll = () => {
  if (!ENABLE_BALL_SFX) return;
  if (!specialEventAudioMode) playback.playSfx('roll', 0.8);
};

export const playSfxForOutcome = (outcome) => {
  if (!ENABLE_BALL_SFX) return;
  if (specialEventAudioMode || !outcome || outcome.type === 'wicket') {
    if (__DEV__) {
      console.log('[audio-sfx] bat_crack skipped', {
        reason: specialEventAudioMode ? 'special_event_mode' : !outcome ? 'missing_outcome' : 'wicket_outcome',
        outcomeType: outcome?.type ?? null,
      });
    }
    return;
  }
  if (__DEV__) {
    console.log('[audio-sfx] bat_crack call', {
      runs: outcome.runs,
      hasAsset: true,
      hasSoundObject: playback.hasSound('bat_crack'),
    });
  }
  if (outcome.runs >= 1) playback.playSfx('bat_crack', outcome.runs >= 4 ? 0.9 : 0.6);
  if (outcome.runs === 6) playback.queueAudioTimeout(() => playback.playSfx('crowd_six', 0.65), 100);
  if (outcome.runs === 4) playback.queueAudioTimeout(() => playback.playSfx('crowd_four', 0.6), 100);
  if (outcome.runs === 2) playback.queueAudioTimeout(() => playback.playSfx('crowd_two', 0.4), 100);
  if (outcome.runs === 1) playback.queueAudioTimeout(() => playback.playSfx('crowd_single', 0.4), 100);
};

export const playSoundForOutcome = async (outcome, matchState = null, analystContext = null) => {
  if (specialEventAudioMode || !outcome || outcome.type === 'wicket') {
    if (__DEV__) {
      const reason = specialEventAudioMode ? 'skipped_special_event_mode' : (!outcome ? 'skipped_missing_outcome' : 'skipped_wicket_outcome');
      console.log('[commentary-debug] playSoundForOutcome skipped', { reason, outcomeType: outcome?.type ?? null });
    }
    return { leadHandoff: 'skipped' };
  }
  if (ENABLE_BALL_SFX) playSfxForOutcome(outcome);
  const owner = `outcome:${Date.now()}:${outcome.runs}`;
  let leadDelayMs = 300;
  let leadRequestPromise = Promise.resolve(false);
  const { pressureState } = evaluatePressureContextFromMatch(matchState || {});
  const pickDotPool = () => {
    if (pressureState === 'impossible') return 'dot_extreme';
    if (pressureState === 'desperate') return 'dot_high';
    if (pressureState === 'tense') return 'dot_building';
    if (pressureState === 'watchful') return 'dot_watchful';
    return 'dot_calm';
  };
  const pickSinglesPool = () => {
    if ((matchState?.innings ?? 1) === 2 && (pressureState === 'tense' || pressureState === 'desperate' || pressureState === 'impossible')) return 'singles_chase';
    if (pressureState === 'tense' || pressureState === 'desperate' || pressureState === 'impossible') return 'singles_pressure';
    return 'singles_neutral';
  };
  const pickTwosPool = () => {
    if ((matchState?.innings ?? 1) === 2 && (pressureState === 'tense' || pressureState === 'desperate' || pressureState === 'impossible')) return 'two_chase';
    if (pressureState === 'tense' || pressureState === 'desperate' || pressureState === 'impossible') return 'two_pressure';
    return 'two_neutral';
  };
  if (ENABLE_LEAD_COMMENTARY) {
    if (outcome.runs === 6) { leadDelayMs = 360; if (__DEV__) console.log('[commentary-debug] boundary route', { runs: 6, pool: 'six' }); leadRequestPromise = runPool('six', owner, leadDelayMs, 0.63); }
    else if (outcome.runs === 4) { leadDelayMs = 360; if (__DEV__) console.log('[commentary-debug] boundary route', { runs: 4, pool: 'four' }); leadRequestPromise = runPool('four', owner, leadDelayMs, 0.63); }
    else if (outcome.runs === 3) { const pool = pickTwosPool(); leadDelayMs = 360; if (__DEV__) console.log('[commentary-debug] twos route', { runs: 3, pool, pressureState }); leadRequestPromise = runPool(pool, owner, leadDelayMs, 0.62); }
    else if (outcome.runs === 2) { const pool = pickTwosPool(); leadDelayMs = 360; if (__DEV__) console.log('[commentary-debug] twos route', { runs: 2, pool, pressureState }); leadRequestPromise = runPool(pool, owner, leadDelayMs, 0.62); }
    else if (outcome.runs === 1) { const pool = pickSinglesPool(); leadDelayMs = 360; if (__DEV__) console.log('[commentary-debug] singles route', { runs: 1, pool, pressureState }); leadRequestPromise = runPool(pool, owner, leadDelayMs, 0.62); }
    else if (outcome.runs === 0 && outcome.type === 'dot') { const pool = pickDotPool(); leadDelayMs = 300; if (__DEV__) console.log('[commentary-debug] dot route', { pool, pressureState }); leadRequestPromise = runPool(pool, owner, leadDelayMs, 0.58); }
  }

  if (ENABLE_ANALYST_COMMENTARY) {
    maybePlayAnalystFollowUp({
      context: {
        outcome: outcome.runs,
        wicket: false,
        overEnded: !!analystContext?.overEnded,
        leadDelayMs,
        lastStrikeChangeReason: analystContext?.lastStrikeChangeReason ?? matchState?.lastStrikeChangeReason ?? null,
        partnershipRuns: analystContext?.partnershipRuns ?? matchState?.currentPartnershipRuns ?? 0,
        ballStamp: analystContext?.ballStamp ?? `${matchState?.innings ?? 0}:${matchState?.balls ?? 0}:${outcome?.runs ?? 0}`,
        strikeRotatedForRuns: analystContext?.strikeRotatedForRuns,
      },
      playback,
    });
  }
  const leadAccepted = await Promise.race([
    leadRequestPromise,
    new Promise((resolve) => setTimeout(() => resolve(false), 1800)),
  ]);
  return { leadHandoff: leadAccepted ? 'completed' : 'skipped_or_timed_out' };
};

export const playSoundForWicket = (wicketType, options = {}) => {
  if (specialEventAudioMode) {
    if (__DEV__) console.log('[commentary-debug] playSoundForWicket skipped', { reason: 'skipped_special_event_mode', wicketType });
    return;
  }
  const {
    dismissalConfirmed = true,
    playSfx = ENABLE_BALL_SFX,
    playLead = ENABLE_LEAD_COMMENTARY,
    playAnalyst = ENABLE_ANALYST_COMMENTARY,
    newBatterRequiredInSameInnings = false,
    newBatterAnalystBlockReason = null,
    getNewBatterFollowUpCancelReason = null,
  } = options;
  const sequenceId = `wicket:${Date.now()}:${wicketType}`;
  if (playSfx) {
    playback.playSfx('owzat', 1.0);
    playback.queueAudioTimeout(() => playback.playSfx('crowd_wicketgroan', 0.65), 200);
  }
  const owner = sequenceId;
  const leadDelayMs = 800;
  if (playLead) {
    if (wicketType === 'BOWLED') { if (__DEV__) console.log('[commentary-debug] wicket route', { wicketType, pool: 'bowled' }); runPool('bowled', owner, leadDelayMs, 0.62); }
    else if (wicketType?.startsWith('CAUGHT')) { if (__DEV__) console.log('[commentary-debug] wicket route', { wicketType, pool: 'caught' }); runPool('caught', owner, leadDelayMs, 0.62); }
    else if (wicketType === 'LBW') { if (__DEV__) console.log('[commentary-debug] wicket route', { wicketType, pool: 'lbw' }); runPool('lbw', owner, leadDelayMs, 0.62); }
    else if (wicketType === 'STUMPED') { if (__DEV__) console.log('[commentary-debug] wicket route', { wicketType, pool: 'stumped' }); runPool('stumped', owner, leadDelayMs, 0.62); }
    else if (wicketType === 'RUN OUT') { if (__DEV__) console.log('[commentary-debug] wicket route', { wicketType, pool: 'run_out' }); runPool('run_out', owner, leadDelayMs, 0.62); }
  }
  if (!playAnalyst) return;
  const analystContextBase = {
    wicket: true,
    dismissalConfirmed,
    newBatterRequiredInSameInnings,
    newBatterAnalystBlockReason,
    leadDelayMs,
    outcome: 0,
    overEnded: false,
    partnershipRuns: 0,
    ballStamp: sequenceId,
    sequenceId,
  };
  if (dismissalConfirmed !== true || newBatterRequiredInSameInnings !== true) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const sr = newBatterAnalystBlockReason || (dismissalConfirmed !== true ? 'dismissal_not_confirmed' : 'no_new_batter_required');
      console.log(`[commentary-debug] new_batter skipped reason=${sr}`);
    }
    return;
  }
  const getFollowUpCancel = () => {
    if (specialEventAudioMode) return 'special_event';
    return getNewBatterFollowUpCancelReason?.() ?? null;
  };
  if (playLead) {
    queueNewBatterFollowUpAfterWicketLead({
      context: analystContextBase,
      playback,
      wicketOwner: owner,
      getCancelReason: getFollowUpCancel,
    });
    return;
  }
  maybePlayAnalystFollowUp({
    context: { ...analystContextBase, leadDelayMs: 0 },
    playback,
  });
};

export const playSoundForMilestone = (runs) => {
  if (!ENABLE_LEAD_COMMENTARY) return false;
  if (!specialEventAudioMode) runPool(runs >= 100 ? 'century' : 'fifty', `milestone:${Date.now()}`, 800, 0.63);
};

export const playSoundForDRS = (overturned) => {
  if (!ENABLE_BALL_SFX) return;
  if (!specialEventAudioMode) playback.queueAudioTimeout(() => playback.playSfx(overturned ? 'drs_win' : 'drs_lose', overturned ? 0.9 : 0.8), 400);
};

export const playSoundForSpecialEvent = (eventKey) => {
  if (!ENABLE_BALL_SFX) return;
  const cfg = getLockedSpecialEventConfig(eventKey);
  const key = getSpecialLeadCommentaryKey(eventKey);
  if (__DEV__) {
    console.log('[audio-commentary][request]', `key=${key || 'none'} pool=special_event`);
    console.log('[audio-commentary][resolve]', `key=${key || 'none'} exists=${!!(key && (playback.hasAssetRef?.(key) || playback.hasSound(key) || COMMENTARY_SFX_ASSETS[key]))}`);
    console.log('[audio-lock]', {
      speechLaneBusy: getSpeechLaneDebugState()?.busy ?? false,
      currentSpeechKey: playback.getCurrentSpeechKey?.() ?? null,
      commentaryPlaying: playback.isCommentaryClipPlaying?.() ?? false,
      reservation: getSpeechLaneDebugState?.() ?? null,
      specialEventAudioMode,
      eventKey,
      canonicalAudioKey: cfg?.audioKey ?? null,
    });
  }
  if (cfg?.audioKey || key) {
    playback.playSfx(key, 0.75);
  } else if (__DEV__) {
    console.log('[audio-commentary][skip]', `reason=missing_asset key=${key || 'none'} pool=special_event`);
  }
};

export const checkCloseGameCommentary = (matchSnapshot) => {
  if (!ENABLE_LEAD_COMMENTARY) return false;
  if (specialEventAudioMode || !canFireCloseCommentary()) return false;
  const { pressureState } = evaluatePressureContextFromMatch(matchSnapshot || {});
  const owner = `close:${Date.now()}`;
  if (pressureState === 'impossible') return runPool('impossible', owner, 400, 0.62);
  if (pressureState === 'desperate') return runPool('close', owner, 400, 0.62);
  if (pressureState === 'tense' && Math.random() < 0.55) return runPool('pressure_high', owner, 400, 0.6);
  if (pressureState === 'watchful' && Math.random() < 0.55) return runPool('pressure_watchful', owner, 400, 0.6);
  if (pressureState === 'comfortable' && Math.random() < 0.45) return runPool('pressure_calm', owner, 400, 0.58);
  return false;
};

export const playSoundForMatchResult = (playerWon) => {
  if (!ENABLE_LEAD_COMMENTARY) return false;
  if (specialEventAudioMode) {
    if (__DEV__) console.log('[commentary-debug] playSoundForMatchResult skipped', { reason: 'skipped_special_event_mode' });
    return false;
  }
  forceReleaseSpeechLane();
  playback.stopCurrentSpeech();
  const pool = playerWon ? 'wins' : 'loss';
  if (__DEV__) console.log('[commentary-debug] result route', { pool });
  return runPool(pool, `result:${Date.now()}`, 800, 0.63);
};

export const handoffMenuAfterTieResult = () => {};
export const playSoundForFirstInningsEnd = () => {
  if (!ENABLE_LEAD_COMMENTARY) return false;
  if (__DEV__) console.log('[commentary-debug] innings route', { pool: 'first_innings_end' });
  return runPool('first_innings_end', `inn1:${Date.now()}`, 800, 0.63);
};
export const playSoundForChaseStart = (matchSnapshot = {}) => {
  if (!ENABLE_LEAD_COMMENTARY) return false;
  const { pressureState } = evaluatePressureContextFromMatch(matchSnapshot);
  let pool = 'balanced_chase';
  if (pressureState === 'comfortable') pool = 'easy_chase';
  else if (pressureState === 'watchful') pool = 'balanced_chase';
  else if (pressureState === 'tense') pool = 'tough_chase';
  else pool = 'very_tough_chase';
  if (__DEV__) console.log('[commentary-debug] chase_start route', { pressureState, pool });
  return runPool(pool, `chase:${Date.now()}`, 950, 0.63);
};

export const playLeadCommentary = (poolName, options = {}) => (
  runPool(poolName, options.owner ?? `lead:${Date.now()}:${poolName}`, options.delay ?? 0, options.volume ?? 0.62)
);

export const playAnalystCommentary = (poolName, options = {}) => (
  runAnalystPool(poolName, options.owner ?? `analyst:${Date.now()}:${poolName}`, options.delay ?? 0, options.volume ?? 0.56)
);

export const resumeAudioForScreen = async (screen, gamePhaseOverride) => {
  if (__DEV__) {
    console.log('[audio-dev] resumeAudioForScreen screen=', screen);
    console.log('[audio-dev] resumeAudioForScreen gamePhaseOverride=', gamePhaseOverride);
    console.log('[audio-dev] resumeAudioForScreen matchGamePhaseForAudioResume=', matchGamePhaseForAudioResume);
    console.log('[audio-dev] resumeAudioForScreen pre-state', {
      ...getAmbientDebugState(),
      speechLane: getSpeechLaneDebugState(),
    });
  }
  if (screen === 'home') return startMenuMusic();
  if (screen === 'game') {
    const phase = gamePhaseOverride ?? matchGamePhaseForAudioResume;
    if (LIVE_MATCH_AUDIO_PHASES.has(phase)) {
      return playMatchAmbient({ gamePhase: phase, screen: 'game' });
    }
    return syncBaseAudioForState({ gamePhase: phase });
  }
};

export const recoverAudioEngineAfterInterruption = async (screen, gamePhaseOverride) => {
  if (recoveryInFlightPromise) return recoveryInFlightPromise;
  recoveryInFlightPromise = (async () => {
  if (__DEV__) {
    console.log('[audio-dev] recoverAudioEngineAfterInterruption entered recovery', {
      screen,
      gamePhaseOverride,
      ...getAmbientDebugState(),
      speechLane: getSpeechLaneDebugState(),
    });
  }
  await playback.stopAllAudio();
  stopAmbientCommentaryScheduler();
  forceReleaseSpeechLane();
  crowdAmbientPlaying = false;
  clearABSwapTimer();
  abActive = 'A';
  baseMode = null;
  if (__DEV__) {
    console.log('[audio-dev] recoverAudioEngineAfterInterruption reset-runtime', {
      ...getAmbientDebugState(),
      speechLane: getSpeechLaneDebugState(),
    });
  }
  await tearDownLoadedSoundsAndResetEngine();
  if (__DEV__) console.log('[audio-dev] recoverAudioEngineAfterInterruption after tearDownLoadedSoundsAndResetEngine()');
  await initSounds();
  if (__DEV__) console.log('[audio-dev] recoverAudioEngineAfterInterruption after initSounds()');
  if (!specialEventAudioMode) {
    if (__DEV__) console.log('[audio-dev] recoverAudioEngineAfterInterruption before resumeAudioForScreen(...)');
    await resumeAudioForScreen(screen, gamePhaseOverride);
    if (__DEV__) console.log('[audio-dev] recoverAudioEngineAfterInterruption after resumeAudioForScreen(...)');
  }
  if (__DEV__) {
    console.log('[audio-dev] recoverAudioEngineAfterInterruption completed', {
      ...getAmbientDebugState(),
      speechLane: getSpeechLaneDebugState(),
    });
  }
  })()
    .finally(() => {
      recoveryInFlightPromise = null;
    });
  return recoveryInFlightPromise;
};

export const silenceAllUserAudio = async () => {
  stopAmbientCommentaryScheduler();
  forceReleaseSpeechLane();
  crowdAmbientPlaying = false;
  clearABSwapTimer();
  await playback.stopAllAudio();
};

export const tearDownLoadedSoundsAndResetEngine = async () => {
  stopAmbientCommentaryScheduler();
  forceReleaseSpeechLane();
  crowdAmbientPlaying = false;
  clearABSwapTimer();
  await playback.unloadPlayback();
  baseMode = null;
};

export const getCommentaryUsageStats = () => getOrchestratorUsageStats();
export const getSoundUsageStats = () => ({});
export const unloadSounds = async () => tearDownLoadedSoundsAndResetEngine();
export const getCurrentSpeechKey = () => playback.getCurrentSpeechKey?.() ?? null;
export const isCommentaryClipPlaying = () => !!playback.isCommentaryClipPlaying?.();
export const isSpeechLaneBusyForUi = () => !!getSpeechLaneDebugState()?.busy;

export const runCommentaryDevSmoke = async () => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return false;
  await initSounds();
  const checks = [
    { key: 'cmt.lead.general_1', volume: 0.72 },
    { key: 'cmt.lead.bowled_1', volume: 0.72 },
    { key: 'cmt.lead.no_ball_1', volume: 0.72 },
    { key: 'cmt.analyst.strike_rotate_1', volume: 0.72 },
  ];
  for (const { key, volume } of checks) {
    console.log('[audio-commentary][request]', `key=${key} pool=dev_smoke`);
    console.log('[audio-commentary][resolve]', `key=${key} exists=${!!(playback.hasAssetRef?.(key) || playback.hasSound(key) || COMMENTARY_SFX_ASSETS[key])}`);
    if (!COMMENTARY_SFX_ASSETS[key]) {
      console.log('[audio-commentary][skip]', `reason=missing_asset key=${key} pool=dev_smoke`);
      continue;
    }
    await playback.playSfx(key, volume);
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
  return true;
};
