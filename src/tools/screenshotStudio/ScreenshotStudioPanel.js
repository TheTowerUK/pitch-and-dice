import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../../constants/theme';
import { ENABLE_SCREENSHOT_STUDIO, SCREENSHOT_PRESETS } from './screenshotPresets';

export const ScreenshotStudioPanel = ({ onBack, onApplyPreset }) => {
  if (!ENABLE_SCREENSHOT_STUDIO) return null;

  const handleApply = (presetId) => {
    if (!ENABLE_SCREENSHOT_STUDIO) return;
    if (__DEV__) console.log('[screenshot-studio] apply preset', presetId);
    onApplyPreset?.(presetId);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← TOOLS</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SCREENSHOT STUDIO</Text>
          <Text style={styles.headerSub}>Capture Mode Presets</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>ONE-TAP CAPTURE SETUPS</Text>
          <Text style={styles.bannerText}>
            Uses fictional teams only and returns to normal match controls after setup.
          </Text>
        </View>

        <View style={styles.grid}>
          {SCREENSHOT_PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetCard}
              onPress={() => handleApply(preset.id)}
              activeOpacity={0.86}
            >
              <View style={styles.presetTopRow}>
                <Text style={styles.presetIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.presetName}>{preset.name}</Text>
              </View>
              <Text style={styles.presetDescription}>{preset.description}</Text>
              <Text style={styles.presetAction}>APPLY CAPTURE MODE</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLOURS.slate,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOURS.ink,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,160,23,0.25)',
  },
  backBtn: {
    width: 86,
    padding: SPACE.xs,
  },
  backText: {
    fontFamily: FONTS.display,
    fontSize: SIZES.md,
    color: COLOURS.gold,
    letterSpacing: 2,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xl,
    letterSpacing: 4,
    color: COLOURS.cream,
  },
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    letterSpacing: 1.8,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: {
    padding: SPACE.lg,
    paddingBottom: SPACE.xxl,
  },
  banner: {
    backgroundColor: 'rgba(212,160,23,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    borderRadius: 6,
    padding: SPACE.lg,
    marginBottom: SPACE.lg,
  },
  bannerTitle: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    color: COLOURS.gold,
    letterSpacing: 2.6,
    textAlign: 'center',
    marginBottom: SPACE.xs,
  },
  bannerText: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.cream,
    opacity: 0.82,
    lineHeight: 19,
    textAlign: 'center',
  },
  grid: {
    gap: SPACE.md,
  },
  presetCard: {
    backgroundColor: COLOURS.ink,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: SPACE.lg,
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginBottom: SPACE.xs,
  },
  presetIndex: {
    fontFamily: FONTS.monoMed,
    fontSize: SIZES.xs,
    color: COLOURS.gold,
    opacity: 0.72,
    letterSpacing: 1.5,
  },
  presetName: {
    fontFamily: FONTS.display,
    fontSize: SIZES.xl,
    color: COLOURS.cream,
    letterSpacing: 2.8,
    flex: 1,
  },
  presetDescription: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    color: COLOURS.dot,
    lineHeight: 18,
    marginBottom: SPACE.md,
  },
  presetAction: {
    alignSelf: 'flex-start',
    fontFamily: FONTS.monoMed,
    fontSize: SIZES.xs,
    color: COLOURS.runs1,
    letterSpacing: 1.6,
  },
});
