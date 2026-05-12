// ═══════════════════════════════════════════════════════
//  teamsData.js
//  Production team data is fictional-only.
// ═══════════════════════════════════════════════════════

const ROLE_MAP = {
  batter: 'bat',
  batsman: 'bat',
  bat: 'bat',
  bowler: 'bowl',
  bowl: 'bowl',
  'all-rounder': 'allrounder',
  allrounder: 'allrounder',
  'all rounder': 'allrounder',
  wicketkeeper: 'wk',
  'wicket-keeper': 'wk',
  wk: 'wk',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeSkill = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  // Support 1-100 authored files by scaling to the engine's 1-10 range.
  if (n > 10) return clamp(Math.round(n / 10), 1, 10);
  return clamp(Math.round(n), 1, 10);
};

const normalizeRole = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return ROLE_MAP[key] || 'bat';
};

const normalizeFictionalTeams = (inputTeams) => {
  if (!Array.isArray(inputTeams)) return {};
  return inputTeams.reduce((acc, team, teamIdx) => {
    if (!team?.id || !team?.name || !Array.isArray(team?.players)) return acc;
    const normalizedPlayers = team.players.slice(0, 11).map((player, idx) => ({
      id: player?.id || `${team.id}_${idx + 1}`,
      name: player?.name || `Player ${idx + 1}`,
      role: normalizeRole(player?.role),
      battingSkill: normalizeSkill(player?.battingSkill),
      bowlingSkill: normalizeSkill(player?.bowlingSkill),
      position: idx + 1,
    }));
    if (normalizedPlayers.length < 11) return acc;

    acc[team.id] = {
      id: team.id,
      name: team.name,
      flag: team.flag || '🛡️',
      colour: team.colour || '#4b5563',
      accent: team.accent || '#d4a017',
      players: normalizedPlayers,
      shortName: team.shortName || team.name.slice(0, 3).toUpperCase(),
      source: 'fictional',
      sortOrder: 100 + teamIdx,
    };
    return acc;
  }, {});
};

const FICTIONAL_TEAMS = normalizeFictionalTeams(
  require('./data/fictionalTeams.json')
);

export const GAME_TEAMS = FICTIONAL_TEAMS;
export const WORLD_TEAMS = GAME_TEAMS; // Alias kept for existing imports.
export const TEAM_KEYS = Object.keys(GAME_TEAMS);
export const TEAM_LIST = Object.values(GAME_TEAMS);

// ─────────────────────────────────────────
//  ROLE LABELS + COLOURS
// ─────────────────────────────────────────
export const ROLE_CONFIG = {
  bat:        { label: 'BAT',  colour: '#27ae60' },
  bowl:       { label: 'BOWL', colour: '#e74c3c' },
  allrounder: { label: 'ALL',  colour: '#d4a017' },
  wk:         { label: 'WK',   colour: '#2980b9' },
};

// ─────────────────────────────────────────
//  BLANK CUSTOM PLAYER TEMPLATE
// ─────────────────────────────────────────
export const makeBlankPlayer = (position) => ({
  id:            `custom_${position}`,
  name:          '',
  role:          'bat',
  battingSkill:  5,
  bowlingSkill:  5,
  position,
});

// ─────────────────────────────────────────
//  BLANK CUSTOM TEAM TEMPLATE
// ─────────────────────────────────────────
export const makeBlankTeam = () => ({
  id:      'custom',
  name:    'My Team',
  flag:    '🏏',
  colour:  '#d4a017',
  accent:  '#1a1a1a',
  players: Array.from({ length: 11 }, (_, i) => makeBlankPlayer(i + 1)),
});
