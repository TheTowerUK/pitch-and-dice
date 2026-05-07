import { Audio } from 'expo-av';
import { loadAudioMuted, saveAudioMuted } from '../storageEngine';

let playbackEnabled = true;
let muted = false;
const sfxCache = {};
const sfxAssetRefs = {};
const loopSounds = {};
const loopAssetRefs = {};
let initPromise = null;
let initialised = false;
let currentSpeechKey = null;
let currentLoopKey = null;
let speechFallbackTimer = null;
let speechTrackingToken = 0;
let commentaryClipPlaying = false;
/** One-shot callback for the active commentary clip (e.g. general scheduler cooldown). */
let pendingSpeechEndCallback = null;
const ASSET_LOAD_TIMEOUT_MS = 2500;
const COMMENTARY_VOLUME = {
  lead: 1.15,
  analyst: 0.85,
  general: 0.75,
};

const playbackAllowed = () => playbackEnabled && !muted;

const getCommentaryVolumeMultiplier = (key) => {
  if (typeof key !== 'string' || !key.startsWith('cmt.')) return 1.0;
  if (key.startsWith('cmt.analyst.')) return COMMENTARY_VOLUME.analyst;
  if (key.startsWith('cmt.lead.general_')) return COMMENTARY_VOLUME.general;
  if (key.startsWith('cmt.lead.')) return COMMENTARY_VOLUME.lead;
  return 1.0;
};

export const getPlaybackAllowed = () => playbackAllowed();

const createSoundWithTimeout = async (asset, initialStatus, timeoutMs = ASSET_LOAD_TIMEOUT_MS) => {
  return Promise.race([
    Audio.Sound.createAsync(asset, initialStatus),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`asset load timeout after ${timeoutMs}ms`)), timeoutMs)),
  ]);
};

export const initPlayback = async ({ criticalAssets = {}, loopAssets = {} }) => {
  if (initialised) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      if (__DEV__) console.log('[audio-init] initPlayback start');
      if (__DEV__) console.log('[audio-init] before Audio.setAudioModeAsync');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      if (__DEV__) console.log('[audio-init] after Audio.setAudioModeAsync');
      let criticalLoaded = 0;
      let criticalFailed = 0;
      let loopLoaded = 0;
      let loopFailed = 0;
      for (const [key, asset] of Object.entries(criticalAssets)) {
        if (__DEV__) console.log(`[audio-init] before critical load: ${key}`);
        try {
          const { sound } = await createSoundWithTimeout(asset, { shouldPlay: false, volume: 1.0 });
          sfxCache[key] = sound;
          sfxAssetRefs[key] = asset;
          criticalLoaded += 1;
          if (__DEV__) console.log(`[audio-init] after critical load: ${key}`);
        } catch (e) {
          criticalFailed += 1;
          if (__DEV__) console.log('[audio-init] critical load failed', { key, error: e?.message ?? e });
        }
      }
      for (const [key, asset] of Object.entries(loopAssets)) {
        if (__DEV__) console.log(`[audio-init] before loop load: ${key}`);
        try {
          const { sound } = await createSoundWithTimeout(asset, {
            shouldPlay: false,
            isLooping: key === 'menu',
            volume: 0,
          });
          loopAssetRefs[key] = asset;
          loopSounds[key] = sound;
          loopLoaded += 1;
          if (__DEV__) console.log(`[audio-init] after loop load: ${key}`);
        } catch (e) {
          loopFailed += 1;
          if (__DEV__) console.log('[audio-init] loop load failed', { key, error: e?.message ?? e });
        }
      }
      if (__DEV__) {
        const loadedSfxKeys = Object.keys(sfxCache);
        const loadedLoopKeys = Object.keys(loopSounds);
        console.log('[audio-init] loaded asset summary', {
          assetLoadTimeoutMs: ASSET_LOAD_TIMEOUT_MS,
          criticalLoaded,
          criticalFailed,
          loopLoaded,
          loopFailed,
          criticalCount: loadedSfxKeys.length,
          loopCount: loadedLoopKeys.length,
          hasMenuLoop: !!loopSounds.menu,
          hasAmbientA: !!loopSounds.ambientA,
          hasAmbientB: !!loopSounds.ambientB,
          hasRollSfx: !!sfxCache.roll,
          loopKeys: loadedLoopKeys,
          sfxKeySample: loadedSfxKeys.slice(0, 20),
        });
      }
      if (__DEV__) console.log('[audio-init] before setting initialised=true');
      initialised = true;
      if (__DEV__) console.log('[audio-init] initialised=true');
    } catch (e) {
      playbackEnabled = false;
      if (__DEV__) console.log('[audio-init] initPlayback failed', e?.message ?? e);
    } finally {
      if (__DEV__) console.log('[audio-init] initPlayback finally -> clearing initPromise');
      initPromise = null;
    }
  })();
  if (__DEV__) console.log('[audio-init] initPlayback returning initPromise');
  return initPromise;
};

export const loadCommentaryAssets = async (assets = {}) => {
  let loaded = 0;
  let skippedExisting = 0;
  let failed = 0;
  const failedKeys = [];
  for (const [key, asset] of Object.entries(assets)) {
    if (sfxCache[key]) {
      skippedExisting += 1;
      continue;
    }
    try {
      const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: false, volume: 1.0 });
      sfxCache[key] = sound;
      sfxAssetRefs[key] = asset;
      loaded += 1;
    } catch (e) {
      failed += 1;
      failedKeys.push(key);
      if (__DEV__) console.warn('[commentary-debug] commentary asset load failed', { key, error: e?.message ?? e });
    }
  }
  const totalCommentaryKeys = Object.keys(assets).length;
  const cachedCommentaryKeys = Object.keys(sfxCache).filter((k) => k.startsWith('cmt.')).length;
  if (__DEV__) {
    console.log('[commentary-debug] loadCommentaryAssets complete', {
      totalCommentaryKeys,
      loaded,
      skippedExisting,
      failed,
      cachedCommentaryKeys,
      failedKeys,
    });
  }
  return {
    totalCommentaryKeys,
    loaded,
    skippedExisting,
    failed,
    failedKeys,
    cachedCommentaryKeys,
  };
};

export const hasSound = (key) => !!sfxCache[key];
export const hasAssetRef = (key) => !!sfxAssetRefs[key];

export const registerSfxAssets = (assets = {}) => {
  Object.entries(assets).forEach(([key, asset]) => {
    if (!sfxAssetRefs[key]) sfxAssetRefs[key] = asset;
  });
  if (__DEV__) {
    const keys = Object.keys(assets);
    console.log('[audio-speech][load]', {
      action: 'register_sfx_assets',
      total: keys.length,
      has_six_1: !!assets['cmt.lead.six_1'],
      has_dot_calm_1: !!assets['cmt.lead.dot_calm_1'],
      has_boundary_hold_1: !!assets['cmt.analyst.boundary_hold_1'],
    });
  }
};

const ensureSfxSoundLoaded = async (key) => {
  const existing = sfxCache[key];
  if (!existing) return null;
  try {
    const st = await existing.getStatusAsync();
    if (st?.isLoaded) return existing;
  } catch (e) {}

  const asset = sfxAssetRefs[key];
  if (!asset) {
    if (__DEV__) console.log('[audio-sfx] reload failed', { key, reason: 'missing_asset_ref' });
    return null;
  }

  if (__DEV__) console.log('[audio-sfx] unloaded sound detected -> reloading', { key });
  if (__DEV__ && key.startsWith('cmt.')) console.log('[audio-speech][load]', { key, source: 'reload' });
  try {
    try { await existing.unloadAsync(); } catch (e) {}
    const { sound } = await createSoundWithTimeout(asset, { shouldPlay: false, volume: 1.0 });
    sfxCache[key] = sound;
    return sound;
  } catch (e) {
    if (__DEV__) console.log('[audio-sfx] reload failed', { key, error: e?.message ?? e });
    return null;
  }
};

const loadSfxSoundOnDemand = async (key) => {
  const asset = sfxAssetRefs[key];
  if (!asset) return null;
  try {
    if (__DEV__ && key.startsWith('cmt.')) {
      console.log('[audio-speech][load]', { key, source: 'on_demand' });
    }
    const { sound } = await createSoundWithTimeout(asset, { shouldPlay: false, volume: 1.0 });
    sfxCache[key] = sound;
    return sound;
  } catch (e) {
    if (__DEV__) console.log('[audio-sfx] on-demand load failed', { key, error: e?.message ?? e });
    return null;
  }
};

export const playSfx = async (key, volume = 1.0, options = {}) => {
  const userOnSpeechEnd = typeof options?.onSpeechEnd === 'function' ? options.onSpeechEnd : null;
  const effectiveVolume = Math.max(0, Math.min(1, volume * getCommentaryVolumeMultiplier(key)));
  const hasAsset = !!sfxAssetRefs[key];
  const hasSoundObject = !!sfxCache[key];
  let preloadedStatus = null;
  if (hasSoundObject) {
    try {
      preloadedStatus = await sfxCache[key].getStatusAsync();
    } catch (e) {}
  }
  const hasLoadedSound = !!preloadedStatus?.isLoaded;
  if (__DEV__) {
    const sfxKeys = Object.keys(sfxCache);
    console.log('[audio-sfx] request', {
      key,
      volume,
      effectiveVolume,
      hasAsset,
      hasSoundObject,
      hasLoadedSound,
      playbackAllowed: playbackAllowed(),
      loadedSoundsCount: sfxKeys.length,
      matchingKeys: sfxKeys.filter((k) => k === key || k.includes('roll') || k.includes('cmt.lead.general_1')).slice(0, 20),
    });
    if (typeof key === 'string' && key.startsWith('cmt.')) {
      console.log('[audio-commentary][resolve]', `key=${key} exists=${!!(sfxCache[key] || sfxAssetRefs[key])}`);
      console.log('[audio-commentary][asset]', { key, hasAssetRef: !!sfxAssetRefs[key], assetRefType: typeof sfxAssetRefs[key] });
    }
  }
  if (!playbackAllowed()) {
    if (__DEV__ && key?.startsWith?.('cmt.')) {
      console.log('[commentary-debug] skipped_playback_not_allowed', { key, muted, playbackEnabled });
      console.log('[audio-commentary][skip]', `reason=playback_not_allowed key=${key}`);
    }
    if (__DEV__) console.log('[audio-sfx] failure reason', { key, reason: 'playback_not_allowed', muted, playbackEnabled });
    return false;
  }
  try {
    let sound = sfxCache[key] ? await ensureSfxSoundLoaded(key) : await loadSfxSoundOnDemand(key);
    if (!sound) {
      if (__DEV__) console.warn(`[commentary] missing asset for key: ${key}`);
      if (__DEV__ && key?.startsWith?.('cmt.')) console.log('[audio-commentary][skip]', `reason=missing_asset key=${key}`);
      if (__DEV__) console.log('[audio-sfx] failure reason', { key, reason: 'ensure_loaded_failed' });
      return false;
    }
    let preStatus = await sound.getStatusAsync();
    if (__DEV__) {
      console.log('[audio-sfx] pre-play status', {
        key,
        isLoaded: preStatus?.isLoaded ?? null,
        isPlaying: preStatus?.isPlaying ?? null,
        durationMillis: preStatus?.durationMillis ?? null,
        positionMillis: preStatus?.positionMillis ?? null,
      });
    }
    if (!preStatus?.isLoaded) {
      sound = await ensureSfxSoundLoaded(key);
      if (!sound) {
        if (__DEV__ && key?.startsWith?.('cmt.')) console.log('[audio-commentary][skip]', `reason=missing_asset key=${key}`);
        if (__DEV__) console.log('[audio-sfx] failure reason', { key, reason: 'reload_failed' });
        return false;
      }
      preStatus = await sound.getStatusAsync();
      if (!preStatus?.isLoaded) {
        if (__DEV__ && key?.startsWith?.('cmt.')) console.log('[audio-commentary][skip]', `reason=missing_asset key=${key}`);
        if (__DEV__) console.log('[audio-sfx] failure reason', { key, reason: 'still_unloaded_after_reload' });
        return false;
      }
    }

    const isCommentaryKey = typeof key === 'string' && key.startsWith('cmt.');
    const trackingToken = speechTrackingToken + 1;
    if (isCommentaryKey) {
      speechTrackingToken = trackingToken;
      commentaryClipPlaying = true;
      currentSpeechKey = key;
    }
    await sound.setVolumeAsync(effectiveVolume);
    const status = await sound.replayAsync();
    if (__DEV__) {
      console.log('[audio-sfx] replay result', {
        key,
        isLoaded: status?.isLoaded ?? null,
        isPlaying: status?.isPlaying ?? null,
        positionMillis: status?.positionMillis ?? null,
      });
    }
    if (isCommentaryKey) {
      pendingSpeechEndCallback = userOnSpeechEnd || null;
      let speechEnded = false;
      const finalizeSpeechEnd = (reason) => {
        if (speechEnded) return;
        if (speechTrackingToken !== trackingToken) return;
        speechEnded = true;
        const cb = pendingSpeechEndCallback;
        pendingSpeechEndCallback = null;
        if (cb) {
          try {
            cb({ key, reason });
          } catch (err) {
            if (__DEV__) console.log('[commentary-debug] onSpeechEnd threw', { key, reason, error: err?.message ?? err });
          }
        }
        commentaryClipPlaying = false;
        if (currentSpeechKey === key) currentSpeechKey = null;
        if (__DEV__) console.log('[audio-speech][end]', { key, reason });
        if (speechFallbackTimer) {
          clearTimeout(speechFallbackTimer);
          speechFallbackTimer = null;
        }
      };
      const fallbackDurationMs = 3000;
      const minSpeechHoldMs = 3500;
      const durationMs = status?.durationMillis || fallbackDurationMs;
      const effectiveHoldMs = Math.max(durationMs, minSpeechHoldMs);
      if (__DEV__) {
        console.log('[commentary-debug] speech_start', {
          selectedKey: key,
          durationMs: status?.durationMillis ?? null,
          fallbackDurationMs,
          minSpeechHoldMs,
          effectiveHoldMs,
        });
      }
      if (speechFallbackTimer) {
        clearTimeout(speechFallbackTimer);
        speechFallbackTimer = null;
      }
      sound.setOnPlaybackStatusUpdate?.((nextStatus) => {
        if (speechTrackingToken !== trackingToken) return;
        if (nextStatus?.didJustFinish) {
          if (__DEV__) console.log('[commentary-debug] speech_end', { selectedKey: key, reason: 'ended' });
          finalizeSpeechEnd('ended');
        }
      });
      speechFallbackTimer = setTimeout(() => {
        if (speechTrackingToken !== trackingToken) return;
        if (__DEV__) console.log('[commentary-debug] speech_end', { selectedKey: key, reason: 'fallback_timeout' });
        finalizeSpeechEnd('fallback_timeout');
      }, effectiveHoldMs + 120);
    }
    return true;
  } catch (e) {
    if (typeof key === 'string' && key.startsWith('cmt.')) {
      pendingSpeechEndCallback = null;
      if (speechFallbackTimer) {
        clearTimeout(speechFallbackTimer);
        speechFallbackTimer = null;
      }
      commentaryClipPlaying = false;
      if (currentSpeechKey === key) currentSpeechKey = null;
    }
    if (__DEV__) console.log('[audio-sfx] failure reason', { key, reason: 'exception', error: e?.message ?? e });
    return false;
  }
};

export const getAudioDebugState = () => ({
  playbackEnabled,
  muted,
  playbackAllowed: playbackAllowed(),
  currentSpeechKey,
  currentLoopKey,
  loadedSounds: Object.keys(sfxCache).length,
  loadedCommentarySounds: Object.keys(sfxCache).filter((k) => k.startsWith('cmt.')).length,
  commentaryClipPlaying,
});

export const getSfxStatus = async (key) => {
  const sound = sfxCache[key];
  if (!sound) return { key, hasSound: false, hasAssetRef: !!sfxAssetRefs[key], durationMillis: null };
  try {
    const status = await sound.getStatusAsync();
    return {
      key,
      hasSound: true,
      hasAssetRef: !!sfxAssetRefs[key],
      isLoaded: !!status?.isLoaded,
      durationMillis: status?.durationMillis ?? null,
      isPlaying: status?.isPlaying ?? false,
    };
  } catch (e) {
    return { key, hasSound: true, hasAssetRef: !!sfxAssetRefs[key], error: e?.message ?? String(e) };
  }
};

export const setCurrentSpeechKey = (key) => {
  currentSpeechKey = key || null;
};

export const clearCurrentSpeechKey = (key = null) => {
  if (!key || currentSpeechKey === key) currentSpeechKey = null;
};

export const stopCurrentSpeech = async () => {
  if (!currentSpeechKey) return;
  const stoppingKey = currentSpeechKey;
  const sound = sfxCache[currentSpeechKey];
  const endCb = pendingSpeechEndCallback;
  pendingSpeechEndCallback = null;
  if (endCb) {
    try {
      endCb({ key: stoppingKey, reason: 'stopped' });
    } catch (err) {
      if (__DEV__) console.log('[commentary-debug] onSpeechEnd threw', { key: stoppingKey, reason: 'stopped', error: err?.message ?? err });
    }
  }
  currentSpeechKey = null;
  commentaryClipPlaying = false;
  speechTrackingToken += 1;
  if (speechFallbackTimer) {
    clearTimeout(speechFallbackTimer);
    speechFallbackTimer = null;
  }
  if (__DEV__) console.log('[audio-speech][end]', { key: stoppingKey, reason: 'stopped' });
  if (__DEV__) console.log('[commentary-debug] speech_end', { selectedKey: stoppingKey, reason: 'stopped' });
  if (!sound) return;
  try { await sound.stopAsync(); } catch (e) {}
};

export const stopSound = async (key) => {
  const sound = sfxCache[key];
  if (!sound) return;
  try { await sound.stopAsync(); } catch (e) {}
};

export const queueAudioTimeout = (fn, delay, shouldRun = () => true) => {
  const timerId = setTimeout(() => {
    if (shouldRun()) fn();
  }, delay);
  return timerId;
};

const ensureLoopSoundLoaded = async (key) => {
  const existing = loopSounds[key];
  if (!existing) return null;
  try {
    const st = await existing.getStatusAsync();
    if (st?.isLoaded) return existing;
  } catch (e) {}

  const asset = loopAssetRefs[key];
  if (!asset) {
    if (__DEV__) console.log('[audio-loop] reload failed', { key, reason: 'missing_asset_ref' });
    return null;
  }

  if (__DEV__) console.log('[audio-loop] unloaded sound detected -> reloading', { key });
  try {
    try { await existing.unloadAsync(); } catch (e) {}
    const { sound } = await Audio.Sound.createAsync(asset, {
      shouldPlay: false,
      isLooping: key === 'menu',
      volume: 0,
    });
    loopSounds[key] = sound;
    return sound;
  } catch (e) {
    if (__DEV__) console.log('[audio-loop] reload failed', { key, error: e?.message ?? e });
    return null;
  }
};

export const playLoop = async (key, volume = 0.5) => {
  const hasSoundObject = !!loopSounds[key];
  let preloadedStatus = null;
  if (hasSoundObject) {
    try {
      preloadedStatus = await loopSounds[key].getStatusAsync();
    } catch (e) {}
  }
  const hasLoadedSound = !!preloadedStatus?.isLoaded;
  if (__DEV__) {
    const loopKeys = Object.keys(loopSounds);
    console.log('[audio-loop] playLoop requested', {
      key,
      volume,
      playbackAllowed: playbackAllowed(),
      hasSoundObject,
      hasLoadedSound,
      loadedLoopCount: loopKeys.length,
      matchingLoopKeys: loopKeys.filter((k) => k.toLowerCase().includes('menu')),
      hasMenu: !!loopSounds.menu,
    });
  }
  if (!playbackAllowed()) {
    if (__DEV__) console.log('[audio-loop] playLoop return false: playback not allowed', { key, muted, playbackEnabled });
    return false;
  }
  if (!loopSounds[key]) {
    if (__DEV__) console.log('[audio-loop] playLoop return false: missing loop key', { key, availableKeys: Object.keys(loopSounds) });
    return false;
  }
  try {
    if (__DEV__) console.log('[ambient-test] startAmbientLoop/playLoop', { key, volume, currentLoopKey });
    let sound = await ensureLoopSoundLoaded(key);
    if (!sound) {
      if (__DEV__) console.log('[audio-loop] playLoop return false: sound unavailable after ensureLoopSoundLoaded', { key });
      return false;
    }
    let preStatus = await sound.getStatusAsync();
    if (__DEV__) {
      console.log('[audio-loop] pre-play status', {
        key,
        isLoaded: preStatus?.isLoaded ?? null,
        isPlaying: preStatus?.isPlaying ?? null,
        isLooping: preStatus?.isLooping ?? null,
        durationMillis: preStatus?.durationMillis ?? null,
        positionMillis: preStatus?.positionMillis ?? null,
      });
    }

    if (!preStatus?.isLoaded) {
      sound = await ensureLoopSoundLoaded(key);
      if (!sound) {
        if (__DEV__) console.log('[audio-loop] playLoop return false: reload failed on retry', { key });
        return false;
      }
      preStatus = await sound.getStatusAsync();
      if (!preStatus?.isLoaded) {
        if (__DEV__) console.log('[audio-loop] playLoop return false: status still not loaded after reload', { key });
        return false;
      }
    }

    try {
      await sound.setIsLoopingAsync(key === 'menu');
      if (__DEV__) console.log('[audio-loop] setIsLoopingAsync ok', { key, looping: key === 'menu' });
    } catch (e) {
      if (__DEV__) console.log('[audio-loop] setIsLoopingAsync failed', { key, error: e?.message ?? e });
      throw e;
    }

    try {
      await sound.setVolumeAsync(volume);
      if (__DEV__) console.log('[audio-loop] setVolumeAsync ok', { key, volume });
    } catch (e) {
      if (__DEV__) console.log('[audio-loop] setVolumeAsync failed', { key, volume, error: e?.message ?? e });
      throw e;
    }

    const st = await sound.getStatusAsync();
    if (!st?.isPlaying) {
      try {
        const playResult = await sound.playAsync();
        if (__DEV__) {
          console.log('[audio-loop] playAsync ok', {
            key,
            isLoaded: playResult?.isLoaded ?? null,
            isPlaying: playResult?.isPlaying ?? null,
            positionMillis: playResult?.positionMillis ?? null,
          });
        }
      } catch (e) {
        if (__DEV__) console.log('[audio-loop] playAsync failed', { key, error: e?.message ?? e });
        throw e;
      }
    }
    currentLoopKey = key;
    if (__DEV__) console.log('[audio-loop] playLoop return true', { key, currentLoopKey });
    return true;
  } catch (e) {
    if (__DEV__) console.log('[audio-loop] playLoop return false: exception', { key, error: e?.message ?? e });
    return false;
  }
};

export const setLoopVolume = async (key, volume = 0.5) => {
  if (!loopSounds[key]) return false;
  try {
    await loopSounds[key].setVolumeAsync(volume);
    return true;
  } catch (e) {
    return false;
  }
};

export const stopLoop = async (key) => {
  if (!loopSounds[key]) return;
  if (__DEV__) console.log('[ambient-test] stopLoop', { key, currentLoopKey });
  try { await loopSounds[key].stopAsync(); } catch (e) {}
  if (currentLoopKey === key) currentLoopKey = null;
};

export const stopLoops = async () => {
  if (__DEV__) console.log('[ambient-test] stopLoops', { currentLoopKey });
  await Promise.all(Object.values(loopSounds).map(async (sound) => {
    try { await sound.stopAsync(); } catch (e) {}
  }));
  currentLoopKey = null;
};

export const getLoopDurationMs = async (key) => {
  const sound = loopSounds[key];
  if (!sound) return null;
  try {
    const st = await sound.getStatusAsync();
    return st?.durationMillis ?? null;
  } catch (e) {
    return null;
  }
};

export const stopAllAudio = async () => {
  await stopCurrentSpeech();
  await stopLoops();
  await Promise.all(Object.values(sfxCache).map(async (sound) => {
    try { await sound.stopAsync(); } catch (e) {}
  }));
};

export const unloadPlayback = async () => {
  await stopAllAudio();
  await Promise.all([
    ...Object.values(sfxCache).map((s) => s?.unloadAsync().catch(() => {})),
    ...Object.values(loopSounds).map((s) => s?.unloadAsync().catch(() => {})),
  ]);
  Object.keys(sfxCache).forEach((k) => delete sfxCache[k]);
  Object.keys(sfxAssetRefs).forEach((k) => delete sfxAssetRefs[k]);
  Object.keys(loopSounds).forEach((k) => delete loopSounds[k]);
  Object.keys(loopAssetRefs).forEach((k) => delete loopAssetRefs[k]);
  currentSpeechKey = null;
  currentLoopKey = null;
  initialised = false;
  playbackEnabled = true;
};

export const hydrateMutePreference = async () => {
  muted = await loadAudioMuted();
  if (muted) await stopAllAudio();
};

export const setMuted = async (value) => {
  muted = !!value;
  await saveAudioMuted(muted);
  if (muted) await stopAllAudio();
};

export const isMuted = () => muted;
export const getCurrentLoopKey = () => currentLoopKey;
export const getCurrentSpeechKey = () => currentSpeechKey;
export const isCommentaryClipPlaying = () => commentaryClipPlaying;
