// ═══════════════════════════════════════════════════════
//  playerEngine.js
//  Player skill rating system — Phase 3
//  Skill ratings 1–10 modify dice rolls as the final
//  calculation layer, after momentum is applied.
//  All logic is pure JS — no framework dependencies.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  DEFAULT PLAYERS
// ─────────────────────────────────────────
export const DEFAULT_BATSMAN = {
  id:       'bat_1',
  name:     'Batsman',
  skill:    5,
  role:     'batsman',
  ballsFaced: 0,
  runs:       0,
};

export const DEFAULT_BOWLER = {
  id:       'bowl_1',
  name:     'Bowler',
  skill:    5,
  role:     'bowler',
  ballsBowled: 0,
  wickets:     0,
};

// ─────────────────────────────────────────
//  PRESET PLAYER ARCHETYPES
//  Quick-select options in setup screen
// ─────────────────────────────────────────
export const BATSMAN_PRESETS = [
  { name: 'Tailender',    skill: 2,  description: 'Barely holds a bat' },
  { name: 'Lower Order',  skill: 4,  description: 'Defends well, rarely scores' },
  { name: 'County Pro',   skill: 6,  description: 'Solid all-round batsman' },
  { name: 'International',skill: 8,  description: 'Technically excellent' },
  { name: 'World Class',  skill: 10, description: 'Once in a generation talent' },
];

export const BOWLER_PRESETS = [
  { name: 'Club Trundler', skill: 2,  description: 'Gentle medium pace' },
  { name: 'County Seamer', skill: 4,  description: 'Decent line and length' },
  { name: 'Pro Spinner',   skill: 6,  description: 'Turns it both ways' },
  { name: 'Test Bowler',   skill: 8,  description: 'Dangerous with any ball' },
  { name: 'Elite Striker', skill: 10, description: 'Unplayable on their day' },
];

// ─────────────────────────────────────────
//  SKILL MODIFIER CALCULATOR
//  +1 per 2 skill points above 5
//  Skill 5 = 0, Skill 6 = 0, Skill 7 = +1
//  Skill 8 = +1, Skill 9 = +2, Skill 10 = +2
// ─────────────────────────────────────────
export const getSkillMod = (skill) => {
  if (skill <= 5) return 0;
  // Skill 7-8: +1, Skill 9-10: +2 — meaningful but capped by ±1 total cap
  return Math.floor((skill - 5) / 2);
};

// ─────────────────────────────────────────
//  NET SKILL MODIFIER
//  battingMod - bowlingMod = net effect on roll
//  Positive = batsman advantage
//  Negative = bowler advantage
// ─────────────────────────────────────────
export const getNetSkillMod = (batsmanSkill, bowlerSkill) => {
  const batMod  = getSkillMod(batsmanSkill);
  const bowlMod = getSkillMod(bowlerSkill);
  return batMod - bowlMod;
};

// ─────────────────────────────────────────
//  APPLY SKILL MOD TO ROLL
// ─────────────────────────────────────────
export const applySkillMod = (roll, sides, batsmanSkill, bowlerSkill) => {
  const netMod = getNetSkillMod(batsmanSkill, bowlerSkill);
  return Math.max(1, Math.min(sides, roll + netMod));
};

// ─────────────────────────────────────────
//  SKILL LABEL HELPER
// ─────────────────────────────────────────
export const getSkillLabel = (skill) => {
  if (skill <= 2)  return 'WEAK';
  if (skill <= 4)  return 'AVERAGE';
  if (skill <= 6)  return 'SOLID';
  if (skill <= 8)  return 'STRONG';
  return 'ELITE';
};

export const getSkillColour = (skill) => {
  if (skill <= 2)  return '#7f8c8d';
  if (skill <= 4)  return '#2980b9';
  if (skill <= 6)  return '#27ae60';
  if (skill <= 8)  return '#d4a017';
  return '#e74c3c';
};

// ─────────────────────────────────────────
//  SKILL MATCHUP DESCRIPTION
//  Narrative for commentary
// ─────────────────────────────────────────
export const getMatchupDescription = (batsmanSkill, bowlerSkill) => {
  const net = getNetSkillMod(batsmanSkill, bowlerSkill);
  if (net >= 2)  return 'Batsman has a significant advantage here.';
  if (net === 1) return 'Batsman holds the edge in this matchup.';
  if (net === 0) return 'Evenly matched — could go either way.';
  if (net === -1) return 'Bowler has the upper hand in this battle.';
  return 'Bowler is heavily favoured in this matchup.';
};

// ─────────────────────────────────────────
//  VALIDATE PLAYER NAME
// ─────────────────────────────────────────
export const validatePlayerName = (name) => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Name cannot be empty';
  if (trimmed.length > 20)  return 'Name must be 20 characters or less';
  return null;
};
