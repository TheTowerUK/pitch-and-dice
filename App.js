import 'react-native-gesture-handler';

// ═══════════════════════════════════════════════════════
//  App.js — Phase 4
//  Routes: HomeScreen → GameScreen
//  Checks for resumable match on launch.
// ═══════════════════════════════════════════════════════

import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
enableScreens();

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen }         from './src/screens/HomeScreen';
import { GameScreen }         from './src/screens/GameScreen';
import { MatchHistoryScreen } from './src/screens/MatchHistoryScreen';
import { COLOURS }            from './src/constants/theme';
import { loadCurrentMatch, clearCurrentMatch, isResumableInProgressMatch } from './src/engine/storageEngine';
import { ENABLE_SCREENSHOT_STUDIO } from './src/tools/screenshotStudio/screenshotPresets';
import {
  initSounds, unloadSounds, stopMusic,
  recoverAudioEngineAfterInterruption, hydrateAudioMutePreference,
  getMatchGamePhaseForAudioResume,
} from './src/engine/soundEngine';

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  const [screen,         setScreen]         = useState('home');
  const [resumableMatch, setResumableMatch] = useState(null);
  const [checked,        setChecked]        = useState(false);
  const [soundsReady,    setSoundsReady]     = useState(false);
  const [screenshotPresetId, setScreenshotPresetId] = useState(null);
  const appStateRef      = useRef(AppState.currentState);
  const screenRef        = useRef('home');
  const pendingStopTimerRef = useRef(null);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    console.log('[app-gates]', {
      fontsLoaded,
      checked,
      soundsReady,
      screen,
    });
  }, [fontsLoaded, checked, soundsReady, screen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[app-init] start');
        console.log('[app-init] before initSounds()');
        const initResult = await Promise.race([
          initSounds().then(() => 'ok').catch((e) => {
            if (__DEV__) console.log('[app-init] initSounds error', e?.message ?? e);
            return 'failed';
          }),
          new Promise((resolve) => setTimeout(() => resolve('timeout'), 8000)),
        ]);
        if (__DEV__) console.log('[app-init] initSounds gate result', { initResult });
        console.log('[app-init] initSounds complete');
        console.log('[app-init] after initSounds()');
        console.log('[app-init] before hydrateAudioMutePreference()');
        await Promise.race([
          hydrateAudioMutePreference().catch((e) => {
            if (__DEV__) console.log('[app-init] hydrateAudioMutePreference error', e?.message ?? e);
          }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
        console.log('[app-init] hydrateAudioMutePreference complete');
        console.log('[app-init] after hydrateAudioMutePreference()');
      } catch (e) {
        console.log('[app-init] failed', e?.message ?? e);
      } finally {
        if (!cancelled) {
          setSoundsReady(true);
          console.log('[app-init] soundsReady set true');
          console.log('[app-init] after setSoundsReady(true)');
        }
      }
    })();
    return () => {
      cancelled = true;
      unloadSounds();
    };
  }, []);

  // ── AppState — handle background/foreground transitions ──
  useEffect(() => {
    const clearPendingStop = () => {
      if (pendingStopTimerRef.current) {
        clearTimeout(pendingStopTimerRef.current);
        pendingStopTimerRef.current = null;
      }
    };
    const scheduleConfirmedStop = (reason, delayMs) => {
      clearPendingStop();
      pendingStopTimerRef.current = setTimeout(() => {
        const stateNow = appStateRef.current;
        if (stateNow === 'active') {
          if (__DEV__) console.log('[audio-appstate] stop canceled; app returned active');
          return;
        }
        if (__DEV__) console.log('[audio-appstate] confirmed background -> stopMusic', { reason, stateNow });
        stopMusic().catch(() => {});
      }, delayMs);
    };

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (__DEV__) {
        console.log('[audio-appstate] transition', {
          prev,
          nextState,
          screen: screenRef.current,
        });
      }
      if (nextState === 'active') {
        clearPendingStop();
        const gamePhase = getMatchGamePhaseForAudioResume();
        if (__DEV__) console.log('[audio-appstate] active -> resumeBaseAudio', { screen: screenRef.current, gamePhase });
        recoverAudioEngineAfterInterruption(screenRef.current, gamePhase).catch(() => {});
      } else if (nextState === 'inactive') {
        if (__DEV__) console.log('[audio-appstate] ignored transient inactive (debounced)');
        scheduleConfirmedStop('inactive', 1200);
      } else if (nextState === 'background') {
        if (__DEV__) console.log('[audio-appstate] background detected (debounced confirm)');
        scheduleConfirmedStop('background', 300);
      }
    });
    return () => {
      clearPendingStop();
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    loadCurrentMatch().then(saved => {
      if (saved && isResumableInProgressMatch(saved)) setResumableMatch(saved);
      setChecked(true);
    });
  }, []);

  // Always wrap in SafeAreaProvider so context is available everywhere
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />

        {/* Home — show as soon as fonts + save check complete; audio loads in background */}
        {fontsLoaded && checked && screen === 'home' && (
          <HomeScreen
            hasResumableMatch={!!resumableMatch}
            resumableMatch={resumableMatch}
            onNewMatch={() => {
              setResumableMatch(null); // clear so GameScreen starts fresh
              setScreenshotPresetId(null);
              setScreen('game');
            }}
            onContinue={() => {
              setScreenshotPresetId(null);
              setScreen('game');
            }}
            onHistory={() => setScreen('history')}
            onStartScreenshotPreset={(presetId) => {
              if (!ENABLE_SCREENSHOT_STUDIO) return;
              setResumableMatch(null);
              setScreenshotPresetId(presetId);
              setScreen('game');
            }}
          />
        )}

        {/* Game screen */}
        {fontsLoaded && checked && soundsReady && screen === 'game' && (
          <GameScreen
            resumableMatch={resumableMatch}
            screenshotPresetId={screenshotPresetId}
            onScreenshotPresetApplied={() => setScreenshotPresetId(null)}
            onGoHome={() => setScreen('home')}
            onQuit={async () => {
              await stopMusic();
              clearCurrentMatch();
              setResumableMatch(null);
              setScreen('home');
            }}
            onSaveAndHome={async () => {
              await stopMusic();
              loadCurrentMatch().then(saved => {
                if (saved && saved.balls > 0) setResumableMatch(saved);
              });
              setScreen('home');
            }}
          />
        )}

        {/* Match history */}
        {fontsLoaded && checked && screen === 'history' && (
          <MatchHistoryScreen onBack={() => setScreen('home')} />
        )}

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLOURS.ink,
  },
});