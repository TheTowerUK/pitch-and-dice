// ═══════════════════════════════════════════════════════
//  teamsData.js
//  Pre-built world teams with authentic skill ratings.
//  Ratings based on real player ability levels (2024-25).
//  battingSkill / bowlingSkill: 1-10 scale
//  role: 'bat' | 'bowl' | 'allrounder' | 'wk'
// ═══════════════════════════════════════════════════════

export const WORLD_TEAMS = {
  england: {
    id:      'england',
    name:    'England',
    flag:    '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    colour:  '#003366',
    accent:  '#CC0000',
    players: [
      { id: 'eng_1',  name: 'Z. Crawley',      role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 1  },
      { id: 'eng_2',  name: 'B. Duckett',       role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 2  },
      { id: 'eng_3',  name: 'O. Pope',          role: 'bat',       battingSkill: 8, bowlingSkill: 2, position: 3  },
      { id: 'eng_4',  name: 'J. Root',          role: 'bat',       battingSkill: 9, bowlingSkill: 4, position: 4  },
      { id: 'eng_5',  name: 'H. Brook',         role: 'bat',       battingSkill: 9, bowlingSkill: 2, position: 5  },
      { id: 'eng_6',  name: 'B. Stokes',        role: 'allrounder',battingSkill: 8, bowlingSkill: 7, position: 6  },
      { id: 'eng_7',  name: 'J. Bairstow',      role: 'wk',        battingSkill: 7, bowlingSkill: 1, position: 7  },
      { id: 'eng_8',  name: 'C. Woakes',        role: 'allrounder',battingSkill: 5, bowlingSkill: 7, position: 8  },
      { id: 'eng_9',  name: 'G. Atkinson',      role: 'bowl',      battingSkill: 3, bowlingSkill: 7, position: 9  },
      { id: 'eng_10', name: 'M. Wood',          role: 'bowl',      battingSkill: 3, bowlingSkill: 8, position: 10 },
      { id: 'eng_11', name: 'S. Bashir',        role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 11 },
    ],
  },

  australia: {
    id:      'australia',
    name:    'Australia',
    flag:    '🇦🇺',
    colour:  '#FFCD00',
    accent:  '#006400',
    players: [
      { id: 'aus_1',  name: 'U. Khawaja',       role: 'bat',       battingSkill: 8, bowlingSkill: 1, position: 1  },
      { id: 'aus_2',  name: 'D. Warner',         role: 'bat',       battingSkill: 8, bowlingSkill: 1, position: 2  },
      { id: 'aus_3',  name: 'M. Labuschagne',    role: 'allrounder',battingSkill: 9, bowlingSkill: 4, position: 3  },
      { id: 'aus_4',  name: 'S. Smith',          role: 'bat',       battingSkill: 9, bowlingSkill: 3, position: 4  },
      { id: 'aus_5',  name: 'T. Head',           role: 'allrounder',battingSkill: 8, bowlingSkill: 4, position: 5  },
      { id: 'aus_6',  name: 'M. Marsh',          role: 'allrounder',battingSkill: 7, bowlingSkill: 6, position: 6  },
      { id: 'aus_7',  name: 'A. Inglis',         role: 'wk',        battingSkill: 6, bowlingSkill: 1, position: 7  },
      { id: 'aus_8',  name: 'M. Starc',          role: 'bowl',      battingSkill: 4, bowlingSkill: 9, position: 8  },
      { id: 'aus_9',  name: 'P. Cummins',        role: 'bowl',      battingSkill: 4, bowlingSkill: 9, position: 9  },
      { id: 'aus_10', name: 'N. Lyon',           role: 'bowl',      battingSkill: 3, bowlingSkill: 8, position: 10 },
      { id: 'aus_11', name: 'J. Hazlewood',      role: 'bowl',      battingSkill: 2, bowlingSkill: 8, position: 11 },
    ],
  },

  india: {
    id:      'india',
    name:    'India',
    flag:    '🇮🇳',
    colour:  '#0044AA',
    accent:  '#FF671F',
    players: [
      { id: 'ind_1',  name: 'R. Sharma',         role: 'bat',       battingSkill: 8, bowlingSkill: 2, position: 1  },
      { id: 'ind_2',  name: 'Y. Jaiswal',        role: 'bat',       battingSkill: 8, bowlingSkill: 1, position: 2  },
      { id: 'ind_3',  name: 'V. Kohli',          role: 'bat',       battingSkill: 9, bowlingSkill: 2, position: 3  },
      { id: 'ind_4',  name: 'S. Gill',           role: 'bat',       battingSkill: 8, bowlingSkill: 2, position: 4  },
      { id: 'ind_5',  name: 'R. Jadeja',         role: 'allrounder',battingSkill: 7, bowlingSkill: 8, position: 5  },
      { id: 'ind_6',  name: 'H. Pandya',         role: 'allrounder',battingSkill: 7, bowlingSkill: 7, position: 6  },
      { id: 'ind_7',  name: 'R. Pant',           role: 'wk',        battingSkill: 8, bowlingSkill: 1, position: 7  },
      { id: 'ind_8',  name: 'R. Ashwin',         role: 'allrounder',battingSkill: 5, bowlingSkill: 9, position: 8  },
      { id: 'ind_9',  name: 'J. Bumrah',         role: 'bowl',      battingSkill: 2, bowlingSkill: 10,position: 9  },
      { id: 'ind_10', name: 'M. Siraj',          role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 10 },
      { id: 'ind_11', name: 'K. Yadav',          role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 11 },
    ],
  },

  pakistan: {
    id:      'pakistan',
    name:    'Pakistan',
    flag:    '🇵🇰',
    colour:  '#004000',
    accent:  '#FFFFFF',
    players: [
      { id: 'pak_1',  name: 'S. Masood',         role: 'bat',       battingSkill: 7, bowlingSkill: 1, position: 1  },
      { id: 'pak_2',  name: 'A. Abdullah',        role: 'bat',       battingSkill: 7, bowlingSkill: 1, position: 2  },
      { id: 'pak_3',  name: 'B. Azam',           role: 'bat',       battingSkill: 9, bowlingSkill: 2, position: 3  },
      { id: 'pak_4',  name: 'S. Khan',           role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 4  },
      { id: 'pak_5',  name: 'M. Rizwan',         role: 'wk',        battingSkill: 8, bowlingSkill: 1, position: 5  },
      { id: 'pak_6',  name: 'A. Shafique',       role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 6  },
      { id: 'pak_7',  name: 'F. Zaman',          role: 'allrounder',battingSkill: 6, bowlingSkill: 5, position: 7  },
      { id: 'pak_8',  name: 'S. Afridi',         role: 'bowl',      battingSkill: 4, bowlingSkill: 8, position: 8  },
      { id: 'pak_9',  name: 'N. Shah',           role: 'bowl',      battingSkill: 3, bowlingSkill: 9, position: 9  },
      { id: 'pak_10', name: 'H. Ali',            role: 'bowl',      battingSkill: 3, bowlingSkill: 8, position: 10 },
      { id: 'pak_11', name: 'A. Rauf',           role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 11 },
    ],
  },

  westindies: {
    id:      'westindies',
    name:    'West Indies',
    flag:    '🏏',
    colour:  '#7B0000',
    accent:  '#FFD700',
    players: [
      { id: 'wi_1',   name: 'K. Brathwaite',    role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 1  },
      { id: 'wi_2',   name: 'T. Chanderpaul',    role: 'bat',       battingSkill: 7, bowlingSkill: 1, position: 2  },
      { id: 'wi_3',   name: 'R. Chase',          role: 'allrounder',battingSkill: 7, bowlingSkill: 6, position: 3  },
      { id: 'wi_4',   name: 'C. Brathwaite',     role: 'allrounder',battingSkill: 7, bowlingSkill: 6, position: 4  },
      { id: 'wi_5',   name: 'J. Blackwood',      role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 5  },
      { id: 'wi_6',   name: 'J. Da Silva',       role: 'wk',        battingSkill: 6, bowlingSkill: 1, position: 6  },
      { id: 'wi_7',   name: 'A. Athanaze',       role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 7  },
      { id: 'wi_8',   name: 'K. Sinclair',       role: 'allrounder',battingSkill: 5, bowlingSkill: 6, position: 8  },
      { id: 'wi_9',   name: 'J. Seales',         role: 'bowl',      battingSkill: 3, bowlingSkill: 8, position: 9  },
      { id: 'wi_10',  name: 'A. Joseph',         role: 'bowl',      battingSkill: 2, bowlingSkill: 8, position: 10 },
      { id: 'wi_11',  name: 'S. Joseph',         role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 11 },
    ],
  },

  newzealand: {
    id:      'newzealand',
    name:    'New Zealand',
    flag:    '🇳🇿',
    colour:  '#000000',
    accent:  '#FFFFFF',
    players: [
      { id: 'nz_1',   name: 'T. Latham',         role: 'bat',       battingSkill: 7, bowlingSkill: 1, position: 1  },
      { id: 'nz_2',   name: 'D. Conway',         role: 'bat',       battingSkill: 8, bowlingSkill: 1, position: 2  },
      { id: 'nz_3',   name: 'K. Williamson',     role: 'bat',       battingSkill: 9, bowlingSkill: 3, position: 3  },
      { id: 'nz_4',   name: 'R. Taylor',         role: 'bat',       battingSkill: 8, bowlingSkill: 2, position: 4  },
      { id: 'nz_5',   name: 'D. Mitchell',       role: 'allrounder',battingSkill: 7, bowlingSkill: 5, position: 5  },
      { id: 'nz_6',   name: 'G. Phillips',       role: 'wk',        battingSkill: 7, bowlingSkill: 2, position: 6  },
      { id: 'nz_7',   name: 'M. Bracewell',      role: 'allrounder',battingSkill: 6, bowlingSkill: 6, position: 7  },
      { id: 'nz_8',   name: 'K. Jamieson',       role: 'allrounder',battingSkill: 5, bowlingSkill: 8, position: 8  },
      { id: 'nz_9',   name: 'T. Boult',          role: 'bowl',      battingSkill: 3, bowlingSkill: 8, position: 9  },
      { id: 'nz_10',  name: 'M. Henry',          role: 'bowl',      battingSkill: 2, bowlingSkill: 8, position: 10 },
      { id: 'nz_11',  name: 'A. Patel',          role: 'bowl',      battingSkill: 3, bowlingSkill: 7, position: 11 },
    ],
  },

  southafrica: {
    id:      'southafrica',
    name:    'South Africa',
    flag:    '🇿🇦',
    colour:  '#006400',
    accent:  '#FFD700',
    players: [
      { id: 'sa_1',   name: 'D. Elgar',          role: 'bat',       battingSkill: 7, bowlingSkill: 3, position: 1  },
      { id: 'sa_2',   name: 'T. de Zorzi',       role: 'bat',       battingSkill: 7, bowlingSkill: 1, position: 2  },
      { id: 'sa_3',   name: 'A. du Plessis',     role: 'bat',       battingSkill: 8, bowlingSkill: 2, position: 3  },
      { id: 'sa_4',   name: 'T. Bavuma',         role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 4  },
      { id: 'sa_5',   name: 'D. Bedingham',      role: 'bat',       battingSkill: 7, bowlingSkill: 2, position: 5  },
      { id: 'sa_6',   name: 'K. Verreynne',      role: 'wk',        battingSkill: 7, bowlingSkill: 1, position: 6  },
      { id: 'sa_7',   name: 'M. Jansen',         role: 'allrounder',battingSkill: 6, bowlingSkill: 8, position: 7  },
      { id: 'sa_8',   name: 'K. Maharaj',        role: 'allrounder',battingSkill: 5, bowlingSkill: 8, position: 8  },
      { id: 'sa_9',   name: 'K. Rabada',         role: 'bowl',      battingSkill: 4, bowlingSkill: 9, position: 9  },
      { id: 'sa_10',  name: 'L. Ngidi',          role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 10 },
      { id: 'sa_11',  name: 'N. Burger',         role: 'bowl',      battingSkill: 2, bowlingSkill: 7, position: 11 },
    ],
  },
};

export const TEAM_KEYS  = Object.keys(WORLD_TEAMS);
export const TEAM_LIST  = Object.values(WORLD_TEAMS);

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
