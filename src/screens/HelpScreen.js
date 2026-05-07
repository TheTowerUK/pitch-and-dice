// ─────────────────────────────────────────
//  HelpScreen.js
//  Game guide — collapsible sections,
//  approachable tone, full design system.
// ─────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLOURS, FONTS, SIZES, SPACE, FORMAT_PRESENTATION } from '../constants/theme';

const FORMAT_HELP_BULLETS = [
  `🏏  ${FORMAT_PRESENTATION.T20.headline}. ${FORMAT_PRESENTATION.T20.help}`,
  `🏏  ${FORMAT_PRESENTATION.ODI.headline}. ${FORMAT_PRESENTATION.ODI.help}`,
  `🏏  ${FORMAT_PRESENTATION.Test.headline}. ${FORMAT_PRESENTATION.Test.help}`,
];

// ─────────────────────────────────────────
//  HELP CONTENT
// ─────────────────────────────────────────
const SECTIONS = [
  {
    key:   'what',
    icon:  '🏏',
    title: 'What is Pitch & Dice?',
    content: [
      {
        type: 'para',
        text: 'Pitch & Dice is a strategic cricket game powered by dice mechanics. Every ball is resolved by rolling dice — but your choices about shots, aggression, bowling variations and field placement all influence the outcome.',
      },
      {
        type: 'para',
        text: 'Think of it as cricket meets board game. The dice add unpredictability, just like real cricket, but smart decisions give you the edge.',
      },
    ],
  },
  {
    key:   'modes',
    icon:  '🎮',
    title: 'Game Modes',
    content: [
      {
        type: 'heading',
        text: 'Manual Mode',
      },
      {
        type: 'para',
        text: 'You control everything — shot selection, aggression, bowling variations and field placement. Great for learning all the systems.',
      },
      {
        type: 'heading',
        text: 'Batting Mode',
      },
      {
        type: 'para',
        text: 'You bat, the AI bowls. Pick your shots and aggression level each ball. The AI will vary its bowling and field to challenge you.',
      },
      {
        type: 'heading',
        text: 'Bowling Mode',
      },
      {
        type: 'para',
        text: 'You bowl, the AI bats. Choose your bowling variation each delivery and try to take wickets while restricting runs.',
      },
    ],
  },
  {
    key:   'batting',
    icon:  '🪃',
    title: 'Batting — Shots & Aggression',
    content: [
      {
        type: 'para',
        text: 'Each ball you choose a shot type and an aggression level. These two choices shape what the dice can produce.',
      },
      {
        type: 'heading',
        text: 'Shot Types',
      },
      {
        type: 'bullets',
        items: [
          '🛡️  Defend — safe, minimal risk, low scoring',
          '🔄  Work — rotate strike, steady singles and twos',
          '🎯  Drive — balanced, targets fours through the off side',
          '💥  Power — attacking, boundaries more likely',
          '🌪️  Slog — high risk, high reward — chance of a six or a wicket',
        ],
      },
      {
        type: 'heading',
        text: 'Aggression',
      },
      {
        type: 'bullets',
        items: [
          'Conservative — reduces your scoring but protects wickets',
          'Balanced — steady middle ground',
          'Aggressive — boosts scoring potential but increases risk',
        ],
      },
      {
        type: 'tip',
        text: 'Tip: In the early overs, work and drive with balanced aggression. Save the slog for the death overs when you have wickets in hand.',
      },
    ],
  },
  {
    key:   'bowling',
    icon:  '⚡',
    title: 'Bowling — Variations',
    content: [
      {
        type: 'para',
        text: 'When bowling, you choose a variation each delivery. Each one affects the dice roll differently and some trigger special checks.',
      },
      {
        type: 'bullets',
        items: [
          '⚪  Stock — reliable line and length, no surprises',
          '🔵  Swing — harder to score, chance of an edge',
          '🟣  Spin — turn and drift, misread and you\'re in trouble',
          '🟡  Pace Change — slower ball, disrupts timing',
          '🟠  Yorker — full and straight, best wicket-taking option',
          '🔴  Bouncer — short and hostile, conservative batsmen duck, aggressive ones go for it',
        ],
      },
      {
        type: 'tip',
        text: 'Tip: The Yorker has a built-in wicket boost — use it when you need a breakthrough. Mix in Pace Changes to keep the batsman guessing.',
      },
    ],
  },
  {
    key:   'dice',
    icon:  '🎲',
    title: 'How the Dice Work',
    content: [
      {
        type: 'para',
        text: 'Every ball rolls a die — the size of the die depends on your shot selection. A defensive shot rolls a smaller die (fewer possible outcomes), a slog rolls a larger one.',
      },
      {
        type: 'para',
        text: 'But the raw roll is just the start. It gets modified by:',
      },
      {
        type: 'bullets',
        items: [
          '🏏  Your shot and aggression choices',
          '⚡  The bowling variation selected',
          '🌱  The pitch conditions',
          '🌀  Momentum — being in form helps, a collapse hurts',
          '👥  Player skills — batting and bowling ratings matter',
          '🏟️  Field placement — gaps in the field mean more runs',
        ],
      },
      {
        type: 'para',
        text: 'The final number maps to an outcome table — runs scored, dot ball, or wicket. Every decision nudges the odds.',
      },
    ],
  },
  {
    key:   'momentum',
    icon:  '🌀',
    title: 'Momentum & Pressure',
    content: [
      {
        type: 'para',
        text: 'Momentum tracks which side is on top, while pressure reflects how tense the current phase of the match has become. Boundaries, wickets, dot-ball streaks and the required rate all shape the feel of an innings.',
      },
      {
        type: 'bullets',
        items: [
          '🔥  High momentum — a batting side in rhythm gets more confidence',
          '⚖️  Neutral phase — neither side has a clear grip on the game',
          '❄️  Pressure building — dot balls and wickets make run-scoring harder',
          '💀  Collapse danger — quick wickets can trigger a major swing',
          '📈  Chase pressure — when the required rate climbs too high, the drama intensifies',
        ],
      },
      {
        type: 'tip',
        text: 'Tip: If a chase starts slipping away, rotate strike and protect wickets before trying to force the game back in your favour.',
      },
    ],
  },
  {
    key:   'commentary',
    icon:  '🎙️',
    title: 'Commentary & Match Drama',
    content: [
      {
        type: 'para',
        text: 'The commentary now reacts more closely to the state of the match. Calm phases sound calmer, while collapses, pressure overs and difficult chases become more dramatic.',
      },
      {
        type: 'bullets',
        items: [
          '🧱  Dot-ball pressure builds tension',
          '🎯  Big wickets trigger sharper dramatic commentary',
          '📉  Faltering run chases feel more urgent',
          '🚀  Late acceleration creates high-intensity match moments',
        ],
      },
      {
        type: 'tip',
        text: 'Tip: Commentary reflects the pressure of the situation, so the tone of the game can shift quickly even before the score swings fully.',
      },
    ],
  },
  {
    key:   'pitch',
    icon:  '🌱',
    title: 'Pitch Conditions',
    content: [
      {
        type: 'para',
        text: 'You choose the pitch before each match. It\'s not just cosmetic — it genuinely changes how the game plays.',
      },
      {
        type: 'bullets',
        items: [
          '🟩  Flat — batting paradise, +1 roll bonus for batsmen',
          '🟠  Seaming — edges more likely, swing bowling boosted',
          '🟣  Turning — spin variations get extra wicket chance',
          '🔴  Deteriorating — -1 roll penalty, edges and spin both boosted',
          '🔵  Damp — heavy swing all day, overcast overhead',
        ],
      },
      {
        type: 'tip',
        text: 'Tip: Match your bowling attack to the conditions. Swing bowlers on a damp pitch, spinners on a turning one.',
      },
    ],
  },
  {
    key:   'field',
    icon:  '🏟️',
    title: 'Field Placement',
    content: [
      {
        type: 'para',
        text: 'At the start of each over you set your field. You have 9 fielders to place across different zones.',
      },
      {
        type: 'bullets',
        items: [
          'Slip cordon — catches edges, great for swing and seam',
          'Cover — cuts off drives through the off side',
          'Mid off / Mid on — restricts straight shots',
          'Midwicket — stops the pull and the work to leg',
          'Deep boundary — protects the rope in the death overs',
        ],
      },
      {
        type: 'para',
        text: 'Use the presets as a starting point, then tweak based on how the batsman is playing. An attacking field takes wickets — a defensive one saves runs.',
      },
      {
        type: 'tip',
        text: 'Tip: In the power play, pack the slip cordon. In the death overs, push fielders to the deep boundary.',
      },
    ],
  },
  {
    key:   'special',
    icon:  '🎲',
    title: 'Special Events',
    content: [
      {
        type: 'para',
        text: 'Special events are rare match moments that can interrupt the normal flow of a delivery. They do not appear at random from a huge pool — only specific approved events can trigger when the match situation allows it.',
      },
      {
        type: 'bullets',
        items: [
          '⚠️  No Ball — adds an extra and can create a free-hit situation',
          '😱  Dropped Catch — a wicket chance goes down and the batter survives',
          '📺  DRS Won — the review succeeds and the decision is overturned',
          '📺  DRS Lost — the review fails and the original decision stands',
          '🩹  Injury — play is disrupted by a fitness issue',
          '🌧️  Weather Delay — conditions interrupt the rhythm of the innings',
          '🥤  Drinks Break — a short pause that can reset momentum',
          '🌟  Legendary Ball — a rare, outstanding delivery that can force a breakthrough',
          '🎾  New Ball — a fresh ball can slightly shift conditions in the bowler’s favour',
        ],
      },
      {
        type: 'tip',
        text: 'Tip: Special events are context-based. If the match situation does not allow one, normal ball resolution continues instead.',
      },
    ],
  },
  {
    key:   'drs',
    icon:  '📺',
    title: 'DRS Reviews',
    content: [
      {
        type: 'para',
        text: 'DRS can create one of two outcomes in the game: a review won or a review lost. When a review is triggered, the final result determines whether the original decision stands or is overturned.',
      },
      {
        type: 'bullets',
        items: [
          '✅  DRS Won — the decision is overturned in favour of the review',
          '❌  DRS Lost — the original decision stands',
        ],
      },
      {
        type: 'para',
        text: 'A successful review can swing a big moment, while a failed one leaves the original pressure in place.',
      },
    ],
  },
  {
    key:   'formats',
    icon:  '📋',
    title: 'Formats',
    content: [
      {
        type: 'bullets',
        items: FORMAT_HELP_BULLETS,
      },
      {
        type: 'tip',
        text: 'Tip: Pick your format before you choose mode. T20 is the quickest way to learn the flow; ODI stretches the same engine over a longer innings.',
      },
    ],
  },
];

// ─────────────────────────────────────────
//  COLLAPSIBLE SECTION
// ─────────────────────────────────────────
const Section = ({ section, isOpen, onToggle }) => (
  <View style={styles.section}>
    <TouchableOpacity
      style={[styles.sectionHeader, isOpen && styles.sectionHeaderOpen]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{section.icon}</Text>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      <Text style={[styles.chevron, isOpen && styles.chevronOpen]}>›</Text>
    </TouchableOpacity>

    {isOpen && (
      <View style={styles.sectionBody}>
        {section.content.map((block, i) => {
          if (block.type === 'para') {
            return (
              <Text key={i} style={styles.para}>{block.text}</Text>
            );
          }
          if (block.type === 'heading') {
            return (
              <Text key={i} style={styles.heading}>{block.text}</Text>
            );
          }
          if (block.type === 'bullets') {
            return (
              <View key={i} style={styles.bulletList}>
                {block.items.map((item, j) => (
                  <View key={j} style={styles.bulletRow}>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            );
          }
          if (block.type === 'tip') {
            return (
              <View key={i} style={styles.tip}>
                <Text style={styles.tipText}>{block.text}</Text>
              </View>
            );
          }
          return null;
        })}
      </View>
    )}
  </View>
);

// ─────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────
export const HelpScreen = ({ onBack }) => {
  const [openSection, setOpenSection] = useState('what');

  const toggle = (key) => {
    setOpenSection(prev => prev === key ? null : key);
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>HOW TO PLAY</Text>
          <Text style={styles.headerSub}>Pitch & Dice — Game Guide</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            New to the game? Start with the first three sections, then check Momentum & Pressure and Special Events before your next match.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map(section => (
          <Section
            key={section.key}
            section={section}
            isOpen={openSection === section.key}
            onToggle={() => toggle(section.key)}
          />
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Good luck out there. May the dice roll in your favour. 🏏
          </Text>
          <Text style={styles.phaseText}>PITCH & DICE GUIDE · SDK 54</Text>
          <View style={styles.footerDots}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.footerDot} />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: COLOURS.slate,
  },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   COLOURS.ink,
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width:   80,
    padding: SPACE.xs,
  },
  backText: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.md,
    color:         COLOURS.gold,
    letterSpacing: 2,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.xl,
    letterSpacing: 5,
    color:         COLOURS.cream,
  },
  headerSub: {
    fontFamily:    FONTS.mono,
    fontSize:      SIZES.xs,
    color:         COLOURS.dot,
    letterSpacing: 2,
    marginTop:     2,
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: SPACE.lg, paddingBottom: SPACE.xxl },

  // Banner
  banner: {
    backgroundColor: 'rgba(212,160,23,0.1)',
    borderWidth:     1,
    borderColor:     'rgba(212,160,23,0.3)',
    borderRadius:    4,
    padding:         SPACE.lg,
    marginBottom:    SPACE.lg,
  },
  bannerText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.gold,
    lineHeight: 20,
    textAlign:  'center',
  },

  // Section
  section: {
    marginBottom:    SPACE.sm,
    borderRadius:    4,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
  },
  sectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   COLOURS.ink,
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.md,
  },
  sectionHeaderOpen: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,160,23,0.2)',
    backgroundColor:   '#1f1f1f',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACE.sm,
    flex:          1,
  },
  sectionIcon:  { fontSize: 18 },
  sectionTitle: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.lg,
    letterSpacing: 2,
    color:         COLOURS.cream,
    flex:          1,
  },
  chevron: {
    fontFamily: FONTS.display,
    fontSize:   SIZES.xxl,
    color:      COLOURS.dot,
    transform:  [{ rotate: '0deg' }],
  },
  chevronOpen: {
    color:     COLOURS.gold,
    transform: [{ rotate: '90deg' }],
  },

  // Section body
  sectionBody: {
    backgroundColor:   COLOURS.slateMid,
    paddingHorizontal: SPACE.lg,
    paddingVertical:   SPACE.lg,
    gap:               SPACE.md,
  },

  // Content blocks
  para: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.cream,
    lineHeight: 20,
  },
  heading: {
    fontFamily:    FONTS.display,
    fontSize:      SIZES.md,
    letterSpacing: 2,
    color:         COLOURS.gold,
    marginTop:     SPACE.xs,
  },
  bulletList: { gap: SPACE.sm },
  bulletRow:  {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  bulletText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.cream,
    lineHeight: 20,
    flex:       1,
  },
  tip: {
    backgroundColor: 'rgba(39,174,96,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLOURS.runs1,
    borderRadius:    2,
    padding:         SPACE.md,
    marginTop:       SPACE.xs,
  },
  tipText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.runs1,
    lineHeight: 20,
    fontStyle:  'italic',
  },

  // Footer
  footer: {
    alignItems:  'center',
    paddingTop:  SPACE.xl,
    paddingBottom: SPACE.md,
    gap: SPACE.sm,
  },
  footerText: {
    fontFamily: FONTS.mono,
    fontSize:   SIZES.sm,
    color:      COLOURS.dot,
    textAlign:  'center',
    lineHeight: 20,
    fontStyle:  'italic',
  },
  phaseText: {
    fontFamily:   FONTS.mono,
    fontSize:     SIZES.xs,
    color:        COLOURS.dot,
    opacity:      0.4,
    letterSpacing: 2,
    textAlign:    'center',
  },
  footerDots: {
    flexDirection: 'row',
    gap:           SPACE.xs,
  },
  footerDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: COLOURS.dot,
    opacity:         0.3,
  },
});