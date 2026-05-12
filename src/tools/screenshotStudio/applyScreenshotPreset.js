import { FORMATS } from '../../constants/theme';
import { DEFAULT_BATSMAN, DEFAULT_BOWLER } from '../../engine/playerEngine';
import { DEFAULT_FIELD } from '../../engine/fieldEngine';
import { makeSquadState, setBowler } from '../../engine/teamEngine';
import { GAME_TEAMS } from '../../engine/teamsData';
import { ENABLE_SCREENSHOT_STUDIO, getScreenshotPreset } from './screenshotPresets';

const DISMISSALS = ['CAUGHT', 'BOWLED', 'RUN OUT', 'LBW', 'CAUGHT SLIP', 'STUMPED'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const makePartnership = (runs = 24, balls = 18) => ({
  runs,
  balls,
  batters: [],
  startedAtWicket: 0,
});

const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

const buildRunSeries = (runs, wickets, balls) => {
  const totalBalls = Math.max(0, balls || 0);
  if (!totalBalls) return [];

  const wicketBalls = Array.from({ length: Math.min(wickets || 0, 10) }, (_, index) => (
    clamp(Math.round(((index + 1) / ((wickets || 0) + 1)) * totalBalls), 1, totalBalls)
  ));

  let cumulative = 0;
  return Array.from({ length: totalBalls }, (_, index) => {
    const ball = index + 1;
    const baseline = Math.floor((runs * ball) / totalBalls);
    const pulse = [0, 1, 0, 2, 0, 4, 0, 1, 0, 6][index % 10];
    cumulative = Math.max(cumulative, Math.min(runs, baseline + pulse));
    if (ball === totalBalls) cumulative = runs;
    return {
      ball,
      runs: cumulative,
      wickets: wicketBalls.filter((wicketBall) => wicketBall <= ball).length,
    };
  });
};

const buildRecentBalls = (runs, wickets) => {
  const pattern = [
    { type: 'runs', runs: 1 },
    { type: 'dot', runs: 0 },
    { type: 'four', runs: 4 },
    { type: 'runs', runs: 2 },
    { type: 'dot', runs: 0 },
    { type: 'six', runs: 6 },
  ];
  const balls = pattern.slice(0, 6);
  if (wickets > 0) balls[balls.length - 1] = { type: 'wicket', runs: 0 };
  if (runs < 40) balls[2] = { type: 'runs', runs: 1 };
  return balls;
};

const distributeRuns = (totalRuns, wickets, strikerRuns = null) => {
  const scores = Array(11).fill(0);
  let remaining = totalRuns;
  const battingStart = Math.min(wickets, 10);

  if (strikerRuns != null) {
    scores[battingStart] = Math.min(strikerRuns, remaining);
    remaining -= scores[battingStart];
  }

  for (let i = 0; i < 11 && remaining > 0; i += 1) {
    if (i === battingStart && strikerRuns != null) continue;
    const cap = i < 4 ? 34 : i < 7 ? 22 : 12;
    const allotment = Math.min(remaining, Math.max(1, Math.floor(remaining / Math.max(1, 11 - i))), cap);
    scores[i] += allotment;
    remaining -= allotment;
  }

  if (remaining > 0) scores[Math.min(battingStart, 10)] += remaining;
  return scores;
};

const buildBattingSquad = (team, preset) => {
  const squad = makeSquadState(team);
  const wickets = clamp(preset.wickets || 0, 0, 10);
  const scores = distributeRuns(preset.runs || 0, wickets, preset.strikerRuns);
  const currentBatsmen = wickets >= 10 ? [] : [wickets, Math.min(wickets + 1, 10)];
  const ballsPerRun = Math.max(1, Math.round((preset.balls || 1) / Math.max(1, currentBatsmen.length + wickets)));

  return {
    ...squad,
    currentBatsmen,
    nextBatsmanIdx: wickets >= 10 ? 11 : Math.min(wickets + 2, 11),
    scorecard: squad.scorecard.map((entry, index) => {
      const dismissed = index < wickets;
      const batting = currentBatsmen.includes(index);
      const hasBatted = dismissed || batting || scores[index] > 0;
      const runs = scores[index] || 0;
      return {
        ...entry,
        runs,
        balls: hasBatted ? Math.max(1, Math.ceil(runs / 2) + (index % 3) * ballsPerRun) : 0,
        fours: Math.floor(runs / 22),
        sixes: Math.floor(runs / 38),
        dismissal: dismissed ? DISMISSALS[index % DISMISSALS.length] : null,
        batting,
        batted: hasBatted,
      };
    }),
  };
};

const buildBowlingSquad = (team, preset) => {
  const squad = setBowler(makeSquadState(team), 7);
  const bowler = squad.players[squad.currentBowlerIdx] || squad.players[7] || squad.players[0];
  const bowlerId = bowler?.id;
  const completedOvers = Math.floor((preset.balls || 0) / 6);

  return {
    ...squad,
    oversBowled: bowlerId ? { [bowlerId]: completedOvers } : {},
    runsConceded: bowlerId ? { [bowlerId]: preset.runs || 0 } : {},
    wicketsTaken: bowlerId ? { [bowlerId]: preset.wickets || 0 } : {},
  };
};

const getTeams = (preset) => {
  const [battingId, bowlingId] = preset.pairing || [];
  const fallbackTeams = Object.values(GAME_TEAMS);
  return {
    battingTeam: GAME_TEAMS[battingId] || fallbackTeams[0],
    bowlingTeam: GAME_TEAMS[bowlingId] || fallbackTeams[1] || fallbackTeams[0],
  };
};

const makeInningsSummary = (preset, battingTeam, bowlingTeam, maxBalls) => {
  const inningsRuns = preset.innings1Runs ?? preset.runs ?? 0;
  const inningsWickets = preset.innings1Wickets ?? preset.wickets ?? 0;
  const inningsBalls = preset.innings1Balls ?? Math.min(maxBalls, preset.balls || maxBalls);

  return {
    runs: inningsRuns,
    wickets: inningsWickets,
    balls: inningsBalls,
    teamName: battingTeam.name,
    bowlingTeamName: bowlingTeam.name,
    boundaries: Math.floor(inningsRuns / 32),
    sixes: Math.floor(inningsRuns / 48),
    dots: Math.max(0, Math.floor(inningsBalls / 3)),
    score: `${inningsRuns}/${inningsWickets}`,
    overs: formatOvers(inningsBalls),
    battingTeam: {
      id: battingTeam.id,
      name: battingTeam.name,
      flag: battingTeam.flag,
      colour: battingTeam.colour,
    },
    bowlingTeam: {
      id: bowlingTeam.id,
      name: bowlingTeam.name,
      flag: bowlingTeam.flag,
      colour: bowlingTeam.colour,
    },
    battingSquad: buildBattingSquad(battingTeam, {
      ...preset,
      runs: inningsRuns,
      wickets: inningsWickets,
      balls: inningsBalls,
      strikerRuns: null,
    }),
    bowlingSquad: buildBowlingSquad(bowlingTeam, {
      ...preset,
      runs: inningsRuns,
      wickets: inningsWickets,
      balls: inningsBalls,
    }),
    commentary: [],
    cumulativeRunSeries: Array.isArray(preset.innings1Series)
      ? preset.innings1Series
      : buildRunSeries(inningsRuns, inningsWickets, inningsBalls),
  };
};

export const applyScreenshotPreset = (baseState, presetId) => {
  if (!ENABLE_SCREENSHOT_STUDIO) return baseState;

  const preset = getScreenshotPreset(presetId);
  if (!preset) return baseState;

  const { battingTeam, bowlingTeam } = getTeams(preset);
  const format = preset.format || baseState.format || 'T20';
  const maxBalls = (FORMATS[format]?.overs || 20) * 6;
  const battingSquad = buildBattingSquad(battingTeam, preset);
  const bowlingSquad = buildBowlingSquad(bowlingTeam, preset);
  const strikerIdx = battingSquad.currentBatsmen[0] ?? 0;
  const nonStrikerIdx = battingSquad.currentBatsmen[1] ?? strikerIdx;
  const bowlerIdx = bowlingSquad.currentBowlerIdx ?? 7;
  const striker = battingSquad.players[strikerIdx] || battingSquad.players[0];
  const nonStriker = battingSquad.players[nonStrikerIdx] || striker;
  const bowler = bowlingSquad.players[bowlerIdx] || bowlingSquad.players[0];
  const legacyBatters = battingSquad.scorecard
    .filter((entry) => entry.batted)
    .map((entry, index) => ({
      number: index + 1,
      playerId: entry.playerId,
      name: entry.name,
      runs: entry.runs,
      balls: entry.balls,
      out: !!entry.dismissal,
    }));
  const legacyStrikerIndex = Math.max(0, legacyBatters.findIndex((entry) => entry.playerId === striker?.id));
  const legacyNonStrikerIndex = Math.max(0, legacyBatters.findIndex((entry) => entry.playerId === nonStriker?.id));
  const innings1Stats = preset.innings === 2
    ? makeInningsSummary(preset, bowlingTeam, battingTeam, maxBalls)
    : null;

  return {
    ...baseState,
    format,
    captureMode: true,
    gameMode: 'batting',
    innings: preset.innings || 1,
    target: preset.target || null,
    innings1Stats,
    gamePhase: preset.gamePhase || 'batting',
    deliveryPhase: preset.deliveryPhase || 'idle',
    runs: preset.runs || 0,
    wickets: preset.wickets || 0,
    balls: preset.balls || 0,
    boundaries: Math.floor((preset.runs || 0) / 34),
    sixes: Math.floor((preset.runs || 0) / 52),
    dots: Math.max(0, Math.floor((preset.balls || 0) / 3)),
    momentum: preset.momentum || 0,
    overBalls: Array.isArray(preset.overBalls)
      ? preset.overBalls.slice(0, 6)
      : buildRecentBalls(preset.runs || 0, preset.wickets || 0).slice(0, (preset.balls || 0) % 6),
    recentBalls: buildRecentBalls(preset.runs || 0, preset.wickets || 0),
    commentary: [
      { ball: 'CAPTURE MODE', text: `${battingTeam.name} ${preset.runs}/${preset.wickets} after ${formatOvers(preset.balls || 0)}.`, style: 'normal' },
    ],
    field: { ...DEFAULT_FIELD },
    partnership: makePartnership(Math.min(54, Math.max(12, Math.floor((preset.runs || 0) / 3))), Math.max(8, Math.floor((preset.balls || 1) / 4))),
    freeHit: false,
    drsReviews: 1,
    pendingMilestone: preset.pendingMilestone || null,
    rollingState: null,
    pendingInningsEnd: false,
    pendingNextOver: null,
    lastPressureIndex: null,
    selectedShot: preset.selectedShot || 'work',
    selectedAggression: preset.selectedAggression || 'balanced',
    selectedBowling: preset.selectedBowling || 'stock',
    pitchType: preset.pitchType || 'flat',
    battingSquad,
    bowlingSquad,
    batsman: {
      ...DEFAULT_BATSMAN,
      name: striker?.name || DEFAULT_BATSMAN.name,
      skill: striker?.battingSkill || DEFAULT_BATSMAN.skill,
      runs: battingSquad.scorecard[strikerIdx]?.runs || 0,
      ballsFaced: battingSquad.scorecard[strikerIdx]?.balls || 0,
    },
    bowler: {
      ...DEFAULT_BOWLER,
      name: bowler?.name || DEFAULT_BOWLER.name,
      skill: bowler?.bowlingSkill || DEFAULT_BOWLER.skill,
      ballsBowled: preset.balls || 0,
      wickets: preset.wickets || 0,
    },
    batters: legacyBatters,
    strikerIndex: legacyStrikerIndex,
    nonStrikerIndex: battingSquad.currentBatsmen.length > 1 ? legacyNonStrikerIndex : legacyStrikerIndex,
    nextBatterNumber: Math.min(11, (preset.wickets || 0) + 3),
    currentPartnershipRuns: Math.min(54, Math.max(8, Math.floor((preset.runs || 0) / 4))),
    currentPartnershipBalls: Math.max(6, Math.floor((preset.balls || 1) / 5)),
    lastStrikeChangeReason: 'capture_mode',
    currentBatter: legacyBatters[legacyStrikerIndex] || {
      number: 1,
      name: striker?.name || DEFAULT_BATSMAN.name,
      runs: battingSquad.scorecard[strikerIdx]?.runs || 0,
      balls: battingSquad.scorecard[strikerIdx]?.balls || 0,
      out: false,
    },
    lastOutcome: preset.lastOutcome || null,
    lastWicket: preset.lastWicket || null,
    pendingEvent: preset.pendingEvent || null,
    lastSpecialEventType: preset.pendingEvent?.key || null,
    lastSpecialEventAt: preset.pendingEvent ? preset.balls || 0 : null,
    specialEventCooldownsByType: {},
    pendingOutcome: null,
    queuedResult: null,
    queuedCommentary: null,
    queuedAudio: null,
    aiDecision: null,
    cumulativeRunSeries: Array.isArray(preset.innings2Series)
      ? preset.innings2Series
      : buildRunSeries(preset.runs || 0, preset.wickets || 0, preset.balls || 0),
  };
};
