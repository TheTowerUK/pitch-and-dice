// ═══════════════════════════════════════════════════════
//  teamEngine.js
//  Squad management — batting order, bowler selection,
//  player stats tracking, scorecard management.
//  Pure JS — no framework dependencies.
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────
//  INITIAL SQUAD STATE
//  Created from a team object at match start
// ─────────────────────────────────────────
export const makeSquadState = (team) => ({
  teamId:       team.id,
  teamName:     team.name,
  flag:         team.flag,
  colour:       team.colour,
  players:      team.players.slice().sort((a, b) => a.position - b.position),
  // Batting tracking
  currentBatsmen: [0, 1],   // indices into players array
  nextBatsmanIdx: 2,
  scorecard: team.players.map(p => ({
    playerId:  p.id,
    name:      p.name,
    role:      p.role,
    runs:      0,
    balls:     0,
    fours:     0,
    sixes:     0,
    dismissal: null,    // null = not out / yet to bat, string = how out
    batting:   false,   // currently at crease
    batted:    false,   // has batted
  })),
  // Bowling tracking
  oversBowled:  {},    // { playerId: overCount }
  currentBowlerIdx: null,
});

// ─────────────────────────────────────────
//  GET CURRENT BATSMEN
// ─────────────────────────────────────────
export const getCurrentBatsmen = (squadState) => {
  const { players, currentBatsmen } = squadState;
  return currentBatsmen.map(idx => players[idx]).filter(Boolean);
};

// ─────────────────────────────────────────
//  GET STRIKER (batsman facing)
//  By convention index 0 = striker
// ─────────────────────────────────────────
export const getStriker = (squadState) => {
  const { players, currentBatsmen } = squadState;
  return players[currentBatsmen[0]] || null;
};

// ─────────────────────────────────────────
//  GET CURRENT BOWLER
// ─────────────────────────────────────────
export const getCurrentBowler = (squadState) => {
  const { players, currentBowlerIdx } = squadState;
  if (currentBowlerIdx === null) return null;
  return players[currentBowlerIdx] || null;
};

// ─────────────────────────────────────────
//  SEND IN NEXT BATSMAN (on wicket)
//  Returns updated squadState
// ─────────────────────────────────────────
export const sendInNextBatsman = (squadState, wicketBatsmanIdx) => {
  const { currentBatsmen, nextBatsmanIdx, players, scorecard } = squadState;

  if (nextBatsmanIdx >= players.length) return squadState; // all out

  // Mark dismissed batsman in scorecard
  const newScorecard = scorecard.map((entry, i) => {
    if (players[currentBatsmen[0]]?.id === entry.playerId && wicketBatsmanIdx === 0) {
      return { ...entry, batting: false, batted: true };
    }
    return entry;
  });

  // Replace dismissed batsman with next in order
  const newBatsmen = currentBatsmen.map((idx, i) =>
    i === 0 ? nextBatsmanIdx : idx
  );

  // Mark new batsman as batting in scorecard
  const newBatsmanId = players[nextBatsmanIdx]?.id;
  const finalScorecard = newScorecard.map(entry => ({
    ...entry,
    batting: entry.playerId === newBatsmanId ? true : entry.batting,
    batted:  entry.playerId === newBatsmanId ? true : entry.batted,
  }));

  return {
    ...squadState,
    currentBatsmen:  newBatsmen,
    nextBatsmanIdx:  nextBatsmanIdx + 1,
    scorecard:       finalScorecard,
  };
};

// ─────────────────────────────────────────
//  UPDATE BATSMAN STATS (per ball)
// ─────────────────────────────────────────
export const updateBatsmanStats = (squadState, runs, isFour, isSix) => {
  const striker = getStriker(squadState);
  if (!striker) return squadState;

  const newScorecard = squadState.scorecard.map(entry => {
    if (entry.playerId !== striker.id) return entry;
    return {
      ...entry,
      runs:   entry.runs + runs,
      balls:  entry.balls + 1,
      fours:  isFour ? entry.fours + 1 : entry.fours,
      sixes:  isSix  ? entry.sixes + 1 : entry.sixes,
      batting: true,
      batted:  true,
    };
  });

  return { ...squadState, scorecard: newScorecard };
};

// ─────────────────────────────────────────
//  SET DISMISSAL
// ─────────────────────────────────────────
export const setDismissal = (squadState, wicketType) => {
  const striker = getStriker(squadState);
  if (!striker) return squadState;

  const newScorecard = squadState.scorecard.map(entry => {
    if (entry.playerId !== striker.id) return entry;
    return { ...entry, dismissal: wicketType, batting: false, batted: true };
  });

  return { ...squadState, scorecard: newScorecard };
};

// ─────────────────────────────────────────
//  SET CURRENT BOWLER
// ─────────────────────────────────────────
export const setBowler = (squadState, playerIdx) => ({
  ...squadState,
  currentBowlerIdx: playerIdx,
});

// ─────────────────────────────────────────
//  UPDATE BOWLER STATS (per over)
// ─────────────────────────────────────────
export const updateBowlerOvers = (squadState) => {
  const bowler = getCurrentBowler(squadState);
  if (!bowler) return squadState;

  const current = squadState.oversBowled[bowler.id] || 0;
  return {
    ...squadState,
    oversBowled: {
      ...squadState.oversBowled,
      [bowler.id]: current + 1,
    },
    currentBowlerIdx: null, // reset for next over selection
  };
};

// ─────────────────────────────────────────
//  GET AVAILABLE BOWLERS
//  Filters out batsmen + enforces over limits
// ─────────────────────────────────────────
export const getAvailableBowlers = (squadState, format) => {
  const maxOvers = {
    T20:  4,
    ODI:  10,
    Test: 999,
  }[format] || 4;

  return squadState.players
    .map((player, idx) => ({ player, idx }))
    .filter(({ player, idx }) => {
      // Must have bowling skill > 3
      if (player.bowlingSkill <= 3) return false;
      // Cannot exceed over limit
      const bowled = squadState.oversBowled[player.id] || 0;
      if (bowled >= maxOvers) return false;
      // Cannot be currently batting
      if (squadState.currentBatsmen.includes(idx)) return false;
      return true;
    });
};

// ─────────────────────────────────────────
//  AI BOWLER SELECTION
//  Picks best available bowler for situation
// ─────────────────────────────────────────
export const getAIBowlerSelection = (squadState, format, momentum, pitchType) => {
  const available = getAvailableBowlers(squadState, format);
  if (available.length === 0) return null;

  // On turning pitch — prefer spin (role allrounder or bowl with high skill)
  if (pitchType === 'turning' || pitchType === 'deteriorating') {
    const spinners = available.filter(({ player }) =>
      player.role === 'bowl' && player.bowlingSkill >= 7
    );
    if (spinners.length > 0) {
      return spinners.sort((a, b) => b.player.bowlingSkill - a.player.bowlingSkill)[0].idx;
    }
  }

  // Pick highest bowling skill available
  const sorted = available.sort((a, b) => b.player.bowlingSkill - a.player.bowlingSkill);
  return sorted[0].idx;
};

// ─────────────────────────────────────────
//  SCORECARD HELPERS
// ─────────────────────────────────────────
export const getScorecardRows = (squadState) =>
  squadState.scorecard.filter(e => e.batted || e.batting);

export const getYetToBat = (squadState) =>
  squadState.scorecard.filter(e => !e.batted && !e.batting);

export const getStrikeRate = (runs, balls) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';

export const formatDismissal = (dismissal) =>
  dismissal || 'not out';
