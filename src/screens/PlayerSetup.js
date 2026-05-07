// ═══════════════════════════════════════════════════════
//  PlayerSetup.js — Phase 4
//  When teams are selected: pitch type only.
//  When no teams (legacy): name + skill + pitch.
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE, FORMAT_PRESENTATION } from '../constants/theme';
import { PITCH_TYPES, PITCH_KEYS, getPitchCommentary } from '../engine/pitchEngine';
import { getMatchContextLabel } from '../engine/underdogEngine';

const PITCH_EFFECTS = {
  flat:          [{ label: '+1 roll mod — batsman benefit', colour: '#27ae60' },{ label: 'No edge or spin boost', colour: '#7f8c8d' },{ label: 'AI bowls stock/swing variations', colour: '#7f8c8d' }],
  seaming:       [{ label: 'Edge boost — edges more likely', colour: '#e67e22' },{ label: '+1 swing boost for AI bowler', colour: '#e67e22' },{ label: 'AI targets swing in power play', colour: '#e67e22' }],
  turning:       [{ label: '+1 spin boost — wickets via spin', colour: '#8e44ad' },{ label: 'AI rotates to spin bowling', colour: '#8e44ad' },{ label: 'AI sets close-catching spin field', colour: '#8e44ad' }],
  deteriorating: [{ label: '-1 roll mod — batsman penalty', colour: '#c0392b' },{ label: 'Edge + spin boost both active', colour: '#c0392b' },{ label: 'Worsens as match progresses', colour: '#c0392b' }],
  damp:          [{ label: '+2 swing boost — heavy swing', colour: '#2980b9' },{ label: 'AI prioritises swing variations', colour: '#2980b9' },{ label: 'Overcast — no spin advantage', colour: '#7f8c8d' }],
};

const PitchSelector = ({ pitchType, onSelect }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>PITCH CONDITIONS</Text>
    <Text style={styles.cardSubtitle}>Pitch type affects roll modifiers, AI bowling decisions, field placement and commentary.</Text>
    <View style={styles.pitchList}>
      {PITCH_KEYS.map(key => {
        const p = PITCH_TYPES[key];
        const selected = pitchType === key;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.pitchRow,
              selected && [styles.pitchRowSelected, { borderColor: p.colour }],
            ]}
            onPress={() => onSelect(key)}
            activeOpacity={0.8}
          >
            <View style={[styles.pitchRowAccent, { backgroundColor: selected ? p.colour : 'rgba(255,255,255,0.12)' }]} />
            <View style={styles.pitchRowBody}>
              <View style={styles.pitchRowTitleWrap}>
                <Text style={styles.pitchIcon}>{p.icon}</Text>
                <Text style={styles.pitchLabel}>{p.label}</Text>
              </View>
              <Text style={styles.pitchDesc} numberOfLines={2}>{p.description}</Text>
            </View>
            {selected ? (
              <View style={[styles.pitchSelectedBadge, { borderColor: p.colour }]}>
                <Text style={styles.pitchSelectedTick}>✓</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
    {pitchType && (
      <View style={[styles.effectsPanel, { borderColor: PITCH_TYPES[pitchType].colour + '55' }]}>
        <Text style={[styles.effectsTitle, { color: PITCH_TYPES[pitchType].colour }]}>{PITCH_TYPES[pitchType].icon}  {PITCH_TYPES[pitchType].label} — GAMEPLAY EFFECTS</Text>
        {PITCH_EFFECTS[pitchType].map((effect, i) => (
          <View key={i} style={styles.effectRow}>
            <View style={[styles.effectDot, { backgroundColor: effect.colour }]} />
            <Text style={styles.effectText}>{effect.label}</Text>
          </View>
        ))}
        <Text style={styles.effectsNote}>{getPitchCommentary(pitchType)}</Text>
      </View>
    )}
  </View>
);

const MatchContextCard = ({ battingSquad, bowlingSquad }) => {
  if (!battingSquad || !bowlingSquad) return null;
  const ctx = getMatchContextLabel(battingSquad, bowlingSquad);
  return (
    <View style={[styles.contextCard, { borderLeftColor: ctx.colour }]}>
      <Text style={[styles.contextLabel, { color: ctx.colour }]}>{ctx.label}</Text>
      <Text style={styles.contextDesc}>{ctx.description}</Text>
      {ctx.label !== 'EVENLY MATCHED' && <Text style={styles.contextNote}>Underdog probability boost active at key moments</Text>}
    </View>
  );
};

const TeamSummaryCard = ({ squad, role }) => {
  if (!squad) return null;
  const topBat  = [...squad.players].sort((a, b) => b.battingSkill - a.battingSkill).slice(0, 3);
  const topBowl = [...squad.players].sort((a, b) => b.bowlingSkill - a.bowlingSkill).slice(0, 3);
  return (
    <View style={styles.teamCard}>
      <Text style={styles.teamCardTitle}>{squad.flag} {squad.teamName} — {role}</Text>
      <View style={styles.teamCardRow}>
        <View style={styles.teamCardCol}>
          <Text style={styles.teamCardColLabel}>TOP BATSMEN</Text>
          {topBat.map(p => <Text key={p.id} style={styles.teamCardPlayer}>{p.name.split(' ').pop()} <Text style={{ color: '#27ae60' }}>{p.battingSkill}</Text></Text>)}
        </View>
        <View style={styles.teamCardDivider} />
        <View style={styles.teamCardCol}>
          <Text style={styles.teamCardColLabel}>TOP BOWLERS</Text>
          {topBowl.map(p => <Text key={p.id} style={styles.teamCardPlayer}>{p.name.split(' ').pop()} <Text style={{ color: '#e74c3c' }}>{p.bowlingSkill}</Text></Text>)}
        </View>
      </View>
    </View>
  );
};

const FormatStrip = ({ formatKey, formatLabel }) => {
  const p = FORMAT_PRESENTATION[formatKey];
  return (
    <View style={styles.formatStrip}>
      <Text style={styles.formatStripTitle}>{formatLabel}</Text>
      {p?.setupSummary ? <Text style={styles.formatStripDesc}>{p.setupSummary}</Text> : null}
    </View>
  );
};

export const PlayerSetup = ({
  onConfirm, onBack, formatKey, formatLabel, gameMode = 'manual',
  battingSquad, bowlingSquad,
}) => {
  const [pitchType, setPitchType] = useState('flat');
  const hasTeams = !!(battingSquad && bowlingSquad);

  const handleConfirm = () => {
    const batsman = battingSquad?.players[0] ? { name: battingSquad.players[0].name, skill: battingSquad.players[0].battingSkill } : { name: 'Batsman', skill: 5 };
    const bowler  = bowlingSquad?.players[0] ? { name: bowlingSquad.players[0].name, skill: bowlingSquad.players[0].bowlingSkill } : { name: 'Bowler', skill: 5 };
    onConfirm(batsman, bowler, pitchType);
  };

  const modeLabel = gameMode === 'batting' ? 'YOU BAT — AI BOWLS' : gameMode === 'bowling' ? 'YOU BOWL — AI BATS' : 'MANUAL MODE';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>PITCH & DICE</Text>
          <Text style={styles.subtitle}>FINAL CHECK · PITCH CONDITIONS</Text>
        </View>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <FormatStrip formatKey={formatKey} formatLabel={formatLabel} />
        <MatchContextCard battingSquad={battingSquad} bowlingSquad={bowlingSquad} />
        {hasTeams && (<><TeamSummaryCard squad={battingSquad} role="BATTING" /><TeamSummaryCard squad={bowlingSquad} role="BOWLING" /></>)}
        <PitchSelector pitchType={pitchType} onSelect={setPitchType} />
        <TouchableOpacity style={styles.startBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START MATCH →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLOURS.slate },
  scroll: { padding: SPACE.lg, paddingBottom: SPACE.md },
  header: { alignItems: 'center', marginBottom: SPACE.xl, marginTop: SPACE.md },
  logo:   { fontFamily: FONTS.display, fontSize: 40, letterSpacing: 6, color: COLOURS.gold },
  subtitle: { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 3, marginTop: SPACE.xs },
  formatStrip: {
    backgroundColor: COLOURS.ink,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    padding: SPACE.lg,
    marginBottom: SPACE.md,
  },
  formatStripTitle: {
    fontFamily: FONTS.display,
    fontSize: SIZES.lg,
    letterSpacing: 2,
    color: COLOURS.gold,
    marginBottom: SPACE.xs,
  },
  formatStripDesc: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    color: COLOURS.dot,
    lineHeight: 18,
  },
  backBtn:  { marginBottom: SPACE.md, alignSelf: 'flex-start', paddingHorizontal: SPACE.xs, paddingVertical: SPACE.xs },
  backText: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.gold, letterSpacing: 2 },
  contextCard: { backgroundColor: COLOURS.ink, borderLeftWidth: 4, borderRadius: 4, padding: SPACE.lg, marginBottom: SPACE.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  contextLabel: { fontFamily: FONTS.display, fontSize: SIZES.lg, letterSpacing: 3, marginBottom: SPACE.xs },
  contextDesc:  { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, lineHeight: 16 },
  contextNote:  { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.gold, marginTop: SPACE.sm, fontStyle: 'italic' },
  teamCard:     { backgroundColor: COLOURS.ink, borderRadius: 4, padding: SPACE.lg, marginBottom: SPACE.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  teamCardTitle: { fontFamily: FONTS.display, fontSize: SIZES.lg, letterSpacing: 2, color: COLOURS.gold, marginBottom: SPACE.md },
  teamCardRow:   { flexDirection: 'row', gap: SPACE.md },
  teamCardCol:   { flex: 1 },
  teamCardDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  teamCardColLabel: { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 2, marginBottom: SPACE.sm },
  teamCardPlayer:   { fontFamily: FONTS.mono, fontSize: SIZES.sm, color: COLOURS.cream, marginBottom: 3 },
  card:       { backgroundColor: COLOURS.ink, borderRadius: 4, padding: SPACE.lg, marginBottom: SPACE.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle:  { fontFamily: FONTS.display, fontSize: SIZES.xl, letterSpacing: 4, color: COLOURS.gold, marginBottom: SPACE.md },
  cardSubtitle: { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, letterSpacing: 1, lineHeight: 16, marginBottom: SPACE.md },
  effectsPanel: { marginTop: SPACE.md, borderWidth: 1, borderRadius: 4, padding: SPACE.md, backgroundColor: 'rgba(0,0,0,0.2)' },
  effectsTitle: { fontFamily: FONTS.display, fontSize: SIZES.md, letterSpacing: 2, marginBottom: SPACE.sm },
  effectRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.xs },
  effectDot:    { width: 6, height: 6, borderRadius: 3 },
  effectText:   { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.cream, flex: 1 },
  effectsNote:  { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, fontStyle: 'italic', marginTop: SPACE.sm, lineHeight: 16 },
  pitchList: { gap: SPACE.sm },
  pitchRow: {
    minHeight: 76,
    width: '100%',
    backgroundColor: COLOURS.slateMid,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pitchRowSelected: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  pitchRowAccent: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: SPACE.md,
  },
  pitchRowBody: { flex: 1, justifyContent: 'center' },
  pitchRowTitleWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  pitchIcon:  { fontSize: 22, marginRight: SPACE.sm },
  pitchLabel: { fontFamily: FONTS.display, fontSize: SIZES.lg, color: COLOURS.white, letterSpacing: 2 },
  pitchDesc:  { fontFamily: FONTS.mono, fontSize: SIZES.xs, color: COLOURS.dot, lineHeight: 16 },
  pitchSelectedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACE.md,
  },
  pitchSelectedTick: { fontFamily: FONTS.display, fontSize: SIZES.md, color: COLOURS.white },
  startBtn:   { backgroundColor: COLOURS.gold, borderRadius: 4, paddingVertical: SPACE.lg, alignItems: 'center', shadowColor: COLOURS.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  startBtnText: { fontFamily: FONTS.display, fontSize: SIZES.xl, letterSpacing: 5, color: COLOURS.ink },
});