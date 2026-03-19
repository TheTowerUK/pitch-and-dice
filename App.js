// ═══════════════════════════════════════════════════════
//  App.js — Phase 4
//  Routes: HomeScreen → GameScreen
//  Checks for resumable match on launch.
// ═══════════════════════════════════════════════════════

import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen }         from './src/screens/HomeScreen';
import { GameScreen }         from './src/screens/GameScreen';
import { MatchHistoryScreen } from './src/screens/MatchHistoryScreen';
import { COLOURS }            from './src/constants/theme';
import { loadCurrentMatch, clearCurrentMatch } from './src/engine/storageEngine';

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  const [screen,         setScreen]         = useState('home');
  const [resumableMatch, setResumableMatch] = useState(null);
  const [checked,        setChecked]        = useState(false);

  useEffect(() => {
    loadCurrentMatch().then(saved => {
      if (saved && saved.balls > 0) setResumableMatch(saved);
      setChecked(true);
    });
  }, []);

  // Always wrap in SafeAreaProvider so context is available everywhere
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      {/* Loading state — fonts or storage check not yet complete */}
      {(!fontsLoaded || !checked) && (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>PITCH & DICE</Text>
        </View>
      )}

      {/* Home screen */}
      {fontsLoaded && checked && screen === 'home' && (
        <HomeScreen
          hasResumableMatch={!!resumableMatch}
          onNewMatch={() => setScreen('game')}
          onContinue={() => setScreen('game')}
          onHistory={() => setScreen('history')}
        />
      )}

      {/* Game screen */}
      {fontsLoaded && checked && screen === 'game' && (
        <GameScreen
          resumableMatch={resumableMatch}
          onGoHome={() => setScreen('home')}
          onQuit={() => {
            clearCurrentMatch();
            setResumableMatch(null);
            setScreen('home');
          }}
          onSaveAndHome={() => setScreen('home')}
        />
      )}

      {/* Match history */}
      {fontsLoaded && checked && screen === 'history' && (
        <MatchHistoryScreen onBack={() => setScreen('home')} />
      )}

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex:            1,
    backgroundColor: COLOURS.ink,
    alignItems:      'center',
    justifyContent:  'center',
  },
  loadingText: {
    fontSize:      32,
    letterSpacing: 6,
    color:         COLOURS.gold,
    fontWeight:    'bold',
  },
});
