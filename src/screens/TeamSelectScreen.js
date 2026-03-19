// ═══════════════════════════════════════════════════════
//  TeamSelectScreen.js
//  Select your team — world team or custom build.
//  Shows vs AI opponent team selection too.
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE } from '../constants/theme';
import { WORLD_TEAMS, TEAM_LIST, ROLE_CONFIG } from '../engine/teamsData';

// ─────────────────────────────────────────
//  TEAM CARD
// ─────────────────────────────────────────
const TeamCard = ({ team, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.teamCard, selected && { borderColor: team.colour, backgroundColor: team.colour + '18' }]}
    onPress={() => onPress(team)}
    activeOpacity={0.8}
  >
    <View style={[styles.teamAccent, { backgroundColor: team.colour }]} />
    <Text style={styles.teamFlag}>{team.flag}</Text>
    <View style={styles.teamInfo}>
      <Text style={[styles.teamName, selected && { color: team.colour }]}>{team.name}</Text>
      <Text style={styles.teamSubtitle}>
        {team.players.filter(p => p.role === 'bat' || p.role === 'wk').length} batsmen ·{' '}
        {team.players.filter(p => p.role === 'bowl').length} bowlers ·{' '}
        {team.players.filter(p => p.role === 'allrounder').length} all-rounders
      </Text>
    </View>
    {selected && (
      <View style={[styles.selectedDot, { backgroundColor: team.colour }]}>
        <Text style={styles.selectedTick}>✓</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─────────────────────────────────────────
//  PLAYER LIST PREVIEW
// ─────────────────────────────────────────
const PlayerPreview = ({ team }) => (
  <View style={styles.preview}>
    <Text style={styles.previewTitle}>{team.flag} {team.name} — SQUAD</Text>
    {team.players.map((p, i) => {
      const role = ROLE_CONFIG[p.role];
      return (
        <View key={p.id} style={styles.previewRow}>
          <Text style={styles.previewPos}>{i + 1}</Text>
          <View style={[styles.roleBadge, { backgroundColor: role.colour + '33' }]}>
            <Text style={[styles.roleText, { color: role.colour }]}>{role.label}</Text>
          </View>
          <Text style={styles.previewName}>{p.name}</Text>
          <View style={styles.previewSkills}>
            <Text style={[styles.skillPip, { color: '#27ae60' }]}>BAT {p.battingSkill}</Text>
            <Text style={[styles.skillPip, { color: '#e74c3c' }]}>BOWL {p.bowlingSkill}</Text>
          </View>
        </View>
      );
    })}
  </View>
);

// ─────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────
export const TeamSelectScreen = ({ onConfirm, onCustomBuild, format, gameMode }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showPreview,  setShowPreview]  = useState(false);

  const handleSelect = (team) => {
    if (selectedTeam?.id === team.id) {
      setShowPreview(p => !p);
    } else {
      setSelectedTeam(team);
      setShowPreview(false);
    }
  };

  const sideLabel = gameMode === 'batting' ? 'YOUR BATTING TEAM' : 'YOUR BOWLING TEAM';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.ink} />

      <View style={styles.header}>
        <Text style={styles.logo}>PITCH & DICE</Text>
        <Text style={styles.subtitle}>{format} · {sideLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>SELECT A WORLD TEAM</Text>

        {TEAM_LIST.map(team => (
          <React.Fragment key={team.id}>
            <TeamCard
              team={team}
              selected={selectedTeam?.id === team.id}
              onPress={handleSelect}
            />
            {selectedTeam?.id === team.id && showPreview && (
              <PlayerPreview team={team} />
            )}
          </React.Fragment>
        ))}

        {selectedTeam && (
          <TouchableOpacity
            style={styles.previewToggle}
            onPress={() => setShowPreview(p => !p)}
          >
            <Text style={styles.previewToggleText}>
              {showPreview ? '▲ HIDE SQUAD' : '▼ VIEW SQUAD'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.customBtn} onPress={onCustomBuild} activeOpacity={0.8}>
          <Text style={styles.customBtnText}>BUILD CUSTOM TEAM →</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Footer confirm */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedTeam && styles.confirmBtnDisabled]}
          onPress={() => selectedTeam && onConfirm(selectedTeam)}
          disabled={!selectedTeam}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, !selectedTeam && { color: COLOURS.dot }]}>
            {selectedTeam ? `PLAY AS ${selectedTeam.name.toUpperCase()} →` : 'SELECT A TEAM'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLOURS.slate },
  header: {
    backgroundColor:   COLOURS.ink,
    paddingHorizontal: SPACE.xl,
    paddingVertical:   SPACE.lg,
    borderBottomWidth: 3,
    borderBottomColor: COLOURS.gold,
    alignItems:        'center',
  },
  logo: {
    fontFamily:   FONTS.display,
    fontSize:     28,
    letterSpacing: 5,
    color:        COLOURS.gold,
  },
  subtitle: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 2,
    marginTop:    SPACE.xs,
  },

  scroll: { padding: SPACE.lg, paddingBottom: SPACE.xxl },
  sectionLabel: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
    marginBottom: SPACE.md,
  },

  teamCard: {
    backgroundColor: COLOURS.ink,
    borderRadius:    4,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    marginBottom:    SPACE.sm,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    minHeight:       64,
  },
  teamAccent: { width: 4, alignSelf: 'stretch' },
  teamFlag:   { fontSize: 28, marginHorizontal: SPACE.md },
  teamInfo:   { flex: 1 },
  teamName: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    color:        COLOURS.cream,
    letterSpacing: 2,
  },
  teamSubtitle: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.xs,
    color:      COLOURS.dot,
    marginTop:  2,
  },
  selectedDot: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    SPACE.md,
  },
  selectedTick: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.md,
    color:      COLOURS.white,
  },

  // Player preview
  preview: {
    backgroundColor: COLOURS.ink,
    borderRadius:    3,
    padding:         SPACE.md,
    marginBottom:    SPACE.sm,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.06)',
  },
  previewTitle: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.md,
    color:        COLOURS.gold,
    letterSpacing: 2,
    marginBottom: SPACE.sm,
  },
  previewRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap:            SPACE.sm,
  },
  previewPos: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    width:        16,
    textAlign:    'right',
  },
  roleBadge: {
    paddingHorizontal: SPACE.xs,
    paddingVertical:   1,
    borderRadius:      2,
    minWidth:          34,
    alignItems:        'center',
  },
  roleText: {
    fontFamily:   FONTS.mono,
    fontSize:     8,
    letterSpacing: 1,
  },
  previewName: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.cream,
    flex:       1,
  },
  previewSkills: {
    flexDirection: 'row',
    gap:           SPACE.sm,
  },
  skillPip: {
    fontFamily: FONTS.mono,
    fontSize:   9,
    letterSpacing: 0.5,
  },

  previewToggle: {
    alignItems:   'center',
    paddingVertical: SPACE.sm,
    marginBottom: SPACE.md,
  },
  previewToggleText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.gold,
    letterSpacing: 2,
  },

  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: SPACE.lg,
    gap:            SPACE.md,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    letterSpacing: 3,
  },

  customBtn: {
    backgroundColor: COLOURS.slateMid,
    borderRadius:    4,
    borderWidth:     1,
    borderColor:     COLOURS.gold,
    paddingVertical: SPACE.lg,
    alignItems:      'center',
    marginBottom:    SPACE.lg,
  },
  customBtnText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.lg,
    letterSpacing: 3,
    color:        COLOURS.gold,
  },

  footer: {
    padding:          SPACE.lg,
    backgroundColor:  COLOURS.ink,
    borderTopWidth:   1,
    borderTopColor:   'rgba(255,255,255,0.07)',
  },
  confirmBtn: {
    backgroundColor: COLOURS.gold,
    borderRadius:    4,
    paddingVertical: SPACE.lg,
    alignItems:      'center',
  },
  confirmBtnDisabled: { backgroundColor: COLOURS.slateMid },
  confirmText: {
    fontFamily:   FONTS.display,
    fontSize:     SIZES.xl,
    letterSpacing: 4,
    color:        COLOURS.ink,
  },
});
