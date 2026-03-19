// ═══════════════════════════════════════════════════════
//  storageEngine.js
//  AsyncStorage wrapper — handles match persistence
//  and match history (last 5 matches).
// ═══════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CURRENT_MATCH:  'pitchdice_current_match',
  MATCH_HISTORY:  'pitchdice_match_history',
};

const MAX_HISTORY = 5;

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
//  BUILD MATCH SUMMARY
//  Lightweight object saved to history
// ─────────────────────────────────────────
export const buildMatchSummary = (state, overDisplay, runRate) => ({
  id:          Date.now(),
  date:        new Date().toLocaleDateString('en-GB'),
  format:      state.format,
  innings:     state.innings,
  runs:        state.runs,
  wickets:     state.wickets,
  overs:       overDisplay,
  boundaries:  state.boundaries,
  sixes:       state.sixes,
  runRate,
  target:      state.target || null,
  result:      buildResultString(state),
  batsman:     state.batsman?.name || 'Unknown',
  bowler:      state.bowler?.name  || 'Unknown',
  pitchType:   state.pitchType     || 'flat',
});

const buildResultString = (state) => {
  if (state.target && state.runs >= state.target) {
    return `Won — chased ${state.target} successfully`;
  }
  if (state.wickets >= 10) {
    return `All out for ${state.runs}`;
  }
  return `${state.runs}/${state.wickets} declared`;
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
