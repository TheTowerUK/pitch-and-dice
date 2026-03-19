// ═══════════════════════════════════════════════════════
//  PlayerSetup.js — Phase 4
//  When teams are selected: pitch type only.
//  When no teams (legacy): name + skill + pitch.
//  gameMode: 'manual' | 'batting' | 'bowling'
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { PITCH_TYPES, PITCH_KEYS } from '../engine/pitchEngine';
import { getMatchContextLabel } from '../engine/underdogEngine';

// ─────────────────────────────────────────
//  PITCH SELECTOR
// ─────────────────────────────────────────
const PitchSelector = ({ pitchType, onSelect }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>PITCH CONDITIONS</Text>
    <View style={styles.pitchGrid}>
      {PITCH_KEYS.map(key => {
        const p       = PITCH_TYPES[key];
        const selected = pitchType === key;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.pitchBtn,
              selected && { borderColor: p.colour, backgroundColor: p.colour + '22' },
            ]}
            onPress={() => onSelect(key)}
          >
            <Text style={styles.pitchIcon}>{p.icon}</Text>
            <Text style={[styles.pitchLabel, selected && { color: p.colour }]}>{p.label}</Text>
            <Text style={styles.pitchDesc} numberOfLines={2}>{p.description}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─────────────────────────────────────────
//  MATCH CONTEXT CARD (underdog display)
// ─────────────────────────────────────────
const MatchContextCard = ({ battingSquad, bowlingSquad }) => {
  if (!battingSquad || !bowlingSquad) return null;
  const ctx = getMatchContextLabel(battingSquad, bowlingSquad);

  return (
    <View style={[styles.contextCard, { borderLeftColor: ctx.colour }]}>
      <Text style={[styles.contextLabel, { color: ctx.colour }]}>{ctx.label}</Text>
      <Text style={styles.contextDesc}>{ctx.description}</Text>
      {ctx.label !== 'EVENLY MATCHED' && (
        <Text style={styles.contextNote}>
          Underdog probability boost active at key moments
        </Text>
      )}
    </View>
  );
};

// ─────────────────────────────────────────
//  TEAM SUMMARY CARD
// ─────────────────────────────────────────
const TeamSummaryCard = ({ squad, role }) => {
  if (!squad) return null;
  const topBat  = [...squad.players].sort((a, b) => b.battingSkill - a.battingSkill).slice(0, 3);
  const topBowl = [...squad.players].sort((a, b) => b.bowlingSkill - a.bowlingSkill).slice(0, 3);

  return (
    <View style={styles.teamCard}>
      <Text style={styles.teamCardTitle}>
        {squad.flag} {squad.teamName} — {role}
      </Text>
      <View style={styles.teamCardRow}>
        <View style={styles.teamCardCol}>
          <Text style={styles.teamCardColLabel}>TOP BATSMEN</Text>
          {topBat.map(p => (
            <Text key={p.id} style={styles.teamCardPlayer}>
              {p.name.split(' ').pop()} <Text style={{ color: '#27ae60' }}>{p.battingSkill}</Text>
            </Text>
          ))}
        </View>
        <View style={styles.teamCardDivider} />
        <View style={styles.teamCardCol}>
          <Text style={styles.teamCardColLabel}>TOP BOWLERS</Text>
          {topBowl.map(p => (
            <Text key={p.id} style={styles.teamCardPlayer}>
              {p.name.split(' ').pop()} <Text style={{ color: '#e74c3c' }}>{p.bowlingSkill}</Text>
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────
export const PlayerSetup = ({
  onConfirm, format, gameMode = 'manual',
  battingSquad, bowlingSquad,
}) => {
  const [pitchType, setPitchType] = useState('flat');
  const hasTeams = !!(battingSquad && bowlingSquad);

  const handleConfirm = () => {
    // When teams are used, pass dummy batsman/bowler — skills come from squad
    const batsman = battingSquad?.players[0]
      ? { name: battingSquad.players[0].name, skill: battingSquad.players[0].battingSkill }
      : { name: 'Batsman', skill: 5 };
    const bowler = bowlingSquad?.players[0]
      ? { name: bowlingSquad.players[0].name, skill: bowlingSquad.players[0].bowlingSkill }
      : { name: 'Bowler', skill: 5 };
    onConfirm(batsman, bowler, pitchType);
  };

  const modeLabel = gameMode === 'batting' ? 'YOU BAT — AI BOWLS'
    : gameMode === 'bowling' ? 'YOU BOWL — AI BATS'
    : 'MANUAL MODE';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>PITCH & DICE</Text>
          <Text style={styles.subtitle}>{format} · {modeLabel}</Text>
        </View>

        {/* Match context — underdog indicator */}
        <MatchContextCard
          battingSquad={battingSquad}
          bowlingSquad={bowlingSquad}
        />

        {/* Team summaries */}
        {hasTeams && (
          <>
            <TeamSummaryCard squad={battingSquad} role="BATTING" />
            <TeamSummaryCard squad={bowlingSquad} role="BOWLING" />
          </>
        )}

        {/* Pitch selector — always shown */}
        <PitchSelector pitchType={pitchType} onSelect={setPitchType} />

        {/* Start */}
        <TouchableOpacity style={styles.startBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START MATCH →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLOURS.slate },
  scroll: { padding: SPACE.lg, paddingBottom: SPACE.xxl },

  header: { alignItems: 'center', marginBottom: SPACE.xl, marginTop: SPACE.md },
  logo: {
    fontFamily:   FONTS.display,
    fontSize:     40,
    letterSpacing: 6,
    color:        COLOURS.gold,
  },
  subtitle: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
    marginTop:    SPACE.xs,
  },

  // Match context
  contextCard: {
    backgroundColor: COLOURS.ink,
    borderLeftWidth: 4,
    borderRadius:    4,
    padding:         SPACE.lg,
    marginBottom:    SPACE.md,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  contextLabel: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 3,
    marginBottom: SPACE.xs,
  },
  contextDesc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    lineHeight: 16,
  },
  contextNote: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.gold,
    marginTop:    SPACE.sm,
    fontStyle:    'italic',
  },

  // Team summary
  teamCard: {
    backgroundColor: COLOURS.ink,
    borderRadius:    4,
    padding:         SPACE.lg,
    marginBottom:    SPACE.md,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  teamCardTitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 2,
    color:        COLOURS.gold,
    marginBottom: SPACE.md,
  },
  teamCardRow: {
    flexDirection: 'row',
    gap:           SPACE.md,
  },
  teamCardCol:   { flex: 1 },
  teamCardDivider: {
    width:           1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  teamCardColLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
    marginBottom: SPACE.sm,
  },
  teamCardPlayer: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.sm,
    color:        COLOURS.cream,
    marginBottom: 3,
  },

  // Card
  card: {
    backgroundColor: COLOURS.ink,
    borderRadius:    4,
    padding:         SPACE.lg,
    marginBottom:    SPACE.md,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    letterSpacing: 4,
    color:        COLOURS.gold,
    marginBottom: SPACE.md,
  },

  // Pitch
  pitchGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACE.sm,
  },
  pitchBtn: {
    width:           '47%',
    backgroundColor: COLOURS.slateMid,
    borderRadius:    4,
    padding:         SPACE.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  pitchIcon:  { fontSize: 28, marginBottom: SPACE.xs },
  pitchLabel: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    color:         COLOURS.cream,
    letterSpacing: 2,
    marginBottom:  SPACE.xs,
  },
  pitchDesc: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    textAlign:  'center',
    lineHeight: 16,
  },

  // Start
  startBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    4,
    paddingVertical: SPACE.lg,
    alignItems:      'center',
    shadowColor:     COLOURS.gold,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    8,
    elevation:       6,
  },
  startBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    letterSpacing: 5,
    color:        COLOURS.ink,
  },
});