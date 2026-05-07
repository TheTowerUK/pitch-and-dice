import { SHOT_CONFIG, OUTCOME_TABLES, AGGRESSION_CONFIG, rollDie } from '../src/engine/diceEngine.js';
import { getMomentumTier, getEffectiveDiceSides, applyMomentumMod } from '../src/engine/momentumEngine.js';
import { getNetSkillMod } from '../src/engine/playerEngine.js';
import { applyPitchMod } from '../src/engine/pitchEngine.js';
import { applyBowlingMod, resolveForcedCheck } from '../src/engine/bowlingEngine.js';
import { getFieldMod } from '../src/engine/fieldEngine.js';
import { getPressureTier, applyPressureMod } from '../src/engine/pressureEngine.js';

const N = Number(process.argv[2] || 120000);
const SHOTS = ['work', 'drive', 'power', 'slog'];
const MATCHUPS = [
  { name: 'b2_vs_bowl8', bat: 2, bowl: 8 },
  { name: 'b5_vs_bowl5', bat: 5, bowl: 5 },
  { name: 'b8_vs_bowl2', bat: 8, bowl: 2 },
];

const FIELD = { slip: 2, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 3 };

const LEGACY_SLOG_10 = { type: 'six', runs: 6, label: 'SIX!', detail: 'Out of the ground! Absolutely massive!' };

function resolveBall(mode, params) {
  const {
    shot = 'work',
    aggression = 'balanced',
    bowling = 'stock',
    momentum = 0,
    bat = 5,
    bowl = 5,
    pitch = 'flat',
    target = null,
    runs = 0,
    ballsRemaining = 120,
    innings = 1,
    freeHit = false,
  } = params;

  const baseSides = SHOT_CONFIG[shot].sides;
  const tier = getMomentumTier(momentum);
  const netSkillMod = getNetSkillMod(bat, bowl);
  const forced = resolveForcedCheck(bowling, rollDie, aggression, netSkillMod);

  if (forced) {
    if (freeHit && forced.type === 'wicket') return { type: 'dot', runs: 0 };
    return forced;
  }

  const effectiveSides = getEffectiveDiceSides(shot, baseSides, tier);
  const raw = rollDie(effectiveSides);
  const afterBowling = applyBowlingMod(raw, effectiveSides, bowling);
  const afterPitch = applyPitchMod(afterBowling, effectiveSides, pitch);
  const afterField = Math.max(1, Math.min(effectiveSides, afterPitch + getFieldMod(shot, FIELD)));
  const afterAgg = Math.max(1, Math.min(effectiveSides, afterField + AGGRESSION_CONFIG[aggression].mod));
  const afterMomentum = applyMomentumMod(afterAgg, effectiveSides, tier);

  const afterSkill = Math.max(1, Math.min(effectiveSides, afterMomentum + netSkillMod));

  let afterPressure = afterSkill;
  if (target && innings === 2) {
    const totalBalls = params.totalBalls ?? 120;
    const ballsBowled = totalBalls - ballsRemaining;
    afterPressure = applyPressureMod(
      afterSkill,
      effectiveSides,
      getPressureTier({
        format: params.format || 'T20',
        innings: 2,
        target,
        runs,
        balls: ballsBowled,
        wickets: params.wickets ?? 3,
        momentum: params.momentum ?? 0,
        recentBalls: params.recentBalls ?? [],
        lastPressureIndex: null,
        maxBalls: totalBalls,
      }),
    );
  }

  const rawShift = afterPressure - raw;
  const cap = mode === 'legacy' ? 1 : (Math.abs(netSkillMod) >= 3 ? 2 : 1);
  const cappedShift = Math.max(-cap, Math.min(cap, rawShift));
  const cappedResult = Math.max(1, Math.min(effectiveSides, raw + cappedShift));
  const idx = Math.max(1, Math.min(baseSides, cappedResult));

  let outcome = { ...OUTCOME_TABLES[shot][idx] };

  if (mode === 'legacy' && shot === 'slog' && idx === 10) {
    outcome = LEGACY_SLOG_10;
  }

  if (mode === 'patched') {
    if (
      netSkillMod <= -2 &&
      outcome.runs === 6 &&
      (shot === 'power' || shot === 'slog')
    ) {
      const sixSuppressChance = netSkillMod <= -3 ? 0.60 : 0.40;
      if (Math.random() < sixSuppressChance) {
        outcome = { type: 'four', runs: 4, label: 'FOUR!', detail: 'Suppressed six by elite bowling pressure.' };
      }
    } else if (
      netSkillMod >= 1 &&
      outcome.type === 'wicket' &&
      (shot === 'drive' || shot === 'power' || shot === 'slog')
    ) {
      const wicketReprieveChance = netSkillMod >= 3 ? 0.70 : (netSkillMod >= 2 ? 0.55 : 0.40);
      if (Math.random() < wicketReprieveChance) {
        outcome = { type: 'four', runs: 4, label: 'FOUR!', detail: 'Strong batter wicket reprieve.' };
      }
    }
  }

  if (freeHit && outcome.type === 'wicket') return { type: 'dot', runs: 0 };
  return outcome;
}

function sample(mode, config, shot) {
  const totals = { dot: 0, one: 0, two: 0, four: 0, six: 0, wicket: 0, other: 0 };

  for (let i = 0; i < N; i++) {
    const o = resolveBall(mode, { ...config, shot });
    if (o.type === 'wicket') totals.wicket++;
    else if (o.runs === 0) totals.dot++;
    else if (o.runs === 1) totals.one++;
    else if (o.runs === 2) totals.two++;
    else if (o.runs === 4) totals.four++;
    else if (o.runs === 6) totals.six++;
    else totals.other++;
  }

  const pct = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / N]));
  return {
    ...pct,
    fourSixStreak: Math.pow(pct.six, 4),
  };
}

function fmt(v) {
  return `${(v * 100).toFixed(2)}%`;
}

console.log(`probability-report n=${N}`);
console.log('Assumptions: stock bowling, balanced aggression, flat pitch, neutral momentum, no specials/underdog.');

for (const matchup of MATCHUPS) {
  console.log(`\n=== ${matchup.name} (bat ${matchup.bat} vs bowl ${matchup.bowl}) ===`);
  for (const shot of SHOTS) {
    const legacy = sample('legacy', matchup, shot);
    const patched = sample('patched', matchup, shot);
    console.log(
      [
        `${shot.padEnd(5)} | legacy six ${fmt(legacy.six)} wicket ${fmt(legacy.wicket)} dot ${fmt(legacy.dot)} 4x6 ${fmt(legacy.fourSixStreak)}`,
        `patched six ${fmt(patched.six)} wicket ${fmt(patched.wicket)} dot ${fmt(patched.dot)} 4x6 ${fmt(patched.fourSixStreak)}`,
      ].join(' || ')
    );
    console.log(
      `        breakdown patched: 1=${fmt(patched.one)} 2=${fmt(patched.two)} 4=${fmt(patched.four)} 6=${fmt(patched.six)} W=${fmt(patched.wicket)}`
    );
  }
}
