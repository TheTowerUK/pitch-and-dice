// ═══════════════════════════════════════════════════════
//  storageEngine.js
//  AsyncStorage wrapper — handles match persistence
//  and match history (last 5 matches).
// ═══════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CURRENT_MATCH:  'pitchdice_current_match',
  MATCH_HISTORY:  'pitchdice_match_history',
  AUDIO_MUTED:    'pitchdice_audio_muted',
};

const MAX_HISTORY = 5;

/** Phases where a match is in progress and should be persisted / offered as Continue */
export const IN_PROGRESS_MATCH_PHASES = new Set([
  'batting',
  'wicket_pending',
  'over_complete',
  'special_event',
  'bowler_select',
  'field_setup',
  'new_batsman',
]);

export const isResumableInProgressMatch = (s) =>
  !!s?.gamePhase && IN_PROGRESS_MATCH_PHASES.has(s.gamePhase);

// ─────────────────────────────────────────
//  SAVE CURRENT MATCH STATE
//  Called after every ball — auto-save
// ─────────────────────────────────────────
export const saveCurrentMatch = async (state) => {
  try {
    const serialised = JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(KEYS.CURRENT_MATCH, serialised);
  } catch (e) {
    console.warn('Failed to save match state:', e);
  }
};

// ─────────────────────────────────────────
//  LOAD CURRENT MATCH STATE
//  Called on app launch to check for resume
// ─────────────────────────────────────────
export const loadCurrentMatch = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CURRENT_MATCH);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load match state:', e);
    return null;
  }
};

// ─────────────────────────────────────────
//  CLEAR CURRENT MATCH
//  Called when a match completes or new match starts
// ─────────────────────────────────────────
export const clearCurrentMatch = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.CURRENT_MATCH);
  } catch (e) {
    console.warn('Failed to clear match state:', e);
  }
};

// ─────────────────────────────────────────
//  SAVE MATCH TO HISTORY
//  Called on innings end — saves a summary
// ─────────────────────────────────────────
export const saveMatchToHistory = async (matchSummary) => {
  try {
    const existing = await loadMatchHistory();
    const updated  = [matchSummary, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(KEYS.MATCH_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save match history:', e);
  }
};

// ─────────────────────────────────────────
//  LOAD MATCH HISTORY
// ─────────────────────────────────────────
export const loadMatchHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MATCH_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load match history:', e);
    return [];
  }
};

// ─────────────────────────────────────────
//  AUDIO MUTE PREFERENCE (persisted)
// ─────────────────────────────────────────
export const loadAudioMuted = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.AUDIO_MUTED);
    if (raw == null) return false;
    return raw === '1' || raw === 'true';
  } catch (e) {
    return false;
  }
};

export const saveAudioMuted = async (muted) => {
  try {
    await AsyncStorage.setItem(KEYS.AUDIO_MUTED, muted ? '1' : '0');
  } catch (e) {
    console.warn('Failed to save audio mute preference:', e);
  }
};

// ─────────────────────────────────────────
//  BUILD MATCH SUMMARY
//  Lightweight object saved to history
// ─────────────────────────────────────────
export const buildMatchSummary = (state, overDisplay, runRate) => {
  // Determine winner on a 2-innings match
  let winner = null;
  let resultMood = 'neutral';
  if (state.innings === 2 && state.target) {
    const tied = state.runs === state.target - 1;
    if (state.runs >= state.target) {
      winner = 'chasing';
      resultMood = 'win';
    } else if (tied) {
      winner = 'tie';
      resultMood = 'tie';
    } else {
      winner = 'defending';
      resultMood = 'loss';
    }
  }

  return {
    id:          Date.now(),
    date:        new Date().toLocaleDateString('en-GB'),
    format:      state.format,
    innings:     state.innings,
    runs:        state.runs,
    wickets:     state.wickets,
    overs:       overDisplay,
    boundaries:  state.boundaries,
    sixes:       state.sixes,
    dots:        state.dots,
    runRate,
    target:      state.target || null,
    result:      buildResultString(state),
    batsman:     state.batsman?.name || 'Unknown',
    bowler:      state.bowler?.name  || 'Unknown',
    pitchType:   state.pitchType     || 'flat',
    winner,
    resultMood,

    // Detailed match data — v2 schema
    schemaVersion: 2,
    innings1: state.innings1Stats ? {
      runs:         state.innings1Stats.runs,
      wickets:      state.innings1Stats.wickets,
      overs:        state.innings1Stats.overs,
      boundaries:   state.innings1Stats.boundaries,
      sixes:        state.innings1Stats.sixes,
      dots:         state.innings1Stats.dots,
      cumulativeRunSeries: state.innings1Stats.cumulativeRunSeries || [],
      teamName:     state.innings1Stats.teamName,
      teamFlag:     state.innings1Stats.teamFlag,
      battingSquad: state.innings1Stats.battingSquad,
      bowlingSquad: state.innings1Stats.bowlingSquad,
      commentary:   state.innings1Stats.commentary || [],
    } : null,
    innings2: state.innings === 2 ? {
      runs:         state.runs,
      wickets:      state.wickets,
      overs:        overDisplay,
      boundaries:   state.boundaries,
      sixes:        state.sixes,
      dots:         state.dots,
      cumulativeRunSeries: state.cumulativeRunSeries || [],
      teamName:     state.battingSquad?.teamName,
      teamFlag:     state.battingSquad?.flag,
      battingSquad: state.battingSquad,
      bowlingSquad: state.bowlingSquad,
      commentary:   state.commentary || [],
    } : null,
  };
};

const buildResultString = (state) => {
  if (state.target && state.runs >= state.target) {
    return `WON — CHASED ${state.target} SUCCESSFULLY`;
  }
  if (state.target && state.runs === state.target - 1) {
    return 'TIED — SCORES LEVEL';
  }
  if (state.target) {
    if (state.wickets >= 10) {
      return `LOST — ALL OUT ${state.runs}`;
    }
    return 'LOST — TARGET DEFENDED';
  }
  if (state.wickets >= 10) {
    return `ALL OUT ${state.runs}`;
  }
  return `${state.runs}/${state.wickets}`;
};

// ─────────────────────────────────────────
//  CLEAR ALL DATA (for testing/reset)
// ─────────────────────────────────────────
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.CURRENT_MATCH, KEYS.MATCH_HISTORY]);
  } catch (e) {
    console.warn('Failed to clear all data:', e);
  }
};
