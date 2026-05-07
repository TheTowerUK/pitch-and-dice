import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SPECIAL_EVENT_CONFIG,
  SPECIAL_EVENTS,
  normalizeSpecialEventKey,
  isKnownSpecialEvent,
  getLockedSpecialEventConfig,
  getEligibleSpecialEvents,
} from '../src/engine/specialEvents.js';

const scriptFilePath = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(scriptFilePath), '..');
const SOUNDS_DIR = path.join(PROJECT_ROOT, 'src', 'assets', 'sounds');

let failures = 0;
const checks = [];

function check(name, predicate, detail = '') {
  const ok = !!predicate;
  checks.push({ name, ok, detail });
  if (!ok) failures++;
}

function canonicalKeysFromEligible(eligibleRolls) {
  return new Set(
    eligibleRolls
      .map((roll) => SPECIAL_EVENTS[roll]?.key)
      .filter(Boolean)
      .map((k) => normalizeSpecialEventKey(k))
      .filter(Boolean)
  );
}

function verifyAudioAssetForConfig(canonicalKey, config) {
  if (!config.audioKey?.startsWith('cmt_special_')) return false;
  const clipNum = config.audioKey.replace('cmt_special_', '');
  const file = path.join(SOUNDS_DIR, `special_${clipNum}.mp3`);
  return fs.existsSync(file);
}

// 1) Canonical approved keys
const approvedCanonical = [
  'no_ball',
  'dropped_catch',
  'drs_win',
  'drs_lose',
  'injury',
  'weather',
  'drinks_break',
  'legendary_ball',
  'new_ball',
];

const representedCanonicalInTable = new Set(
  Object.values(SPECIAL_EVENTS)
    .map((e) => normalizeSpecialEventKey(e.key))
    .filter(Boolean)
);

check(
  'Canonical key set exactly matches approved list',
  JSON.stringify(Object.keys(SPECIAL_EVENT_CONFIG).sort()) === JSON.stringify([...approvedCanonical].sort()),
  `found=${Object.keys(SPECIAL_EVENT_CONFIG).sort().join(', ')}`
);

// 2) Alias normalization
check('Alias drs_overturned -> drs_win', normalizeSpecialEventKey('drs_overturned') === 'drs_win');
check('Alias drs_lost -> drs_lose', normalizeSpecialEventKey('drs_lost') === 'drs_lose');
check('Alias new_ball_effect -> new_ball', normalizeSpecialEventKey('new_ball_effect') === 'new_ball');

// 3) Valid audio mapping presence
for (const canonical of approvedCanonical) {
  const cfg = getLockedSpecialEventConfig(canonical);
  check(`Config exists: ${canonical}`, !!cfg);
  check(`Audio key exists: ${canonical}`, !!cfg?.audioKey, `audioKey=${cfg?.audioKey}`);
  check(
    `Audio asset file exists: ${canonical}`,
    !!cfg && verifyAudioAssetForConfig(canonical, cfg),
    `audioKey=${cfg?.audioKey}`
  );
}

// 4) Unknown key rejection
check('Unknown key normalize -> null', normalizeSpecialEventKey('totally_fake_key') === null);
check('Unknown key isKnownSpecialEvent=false', isKnownSpecialEvent('totally_fake_key') === false);
check('Unknown key config -> null', getLockedSpecialEventConfig('totally_fake_key') === null);

// 5) Context gating examples via eligible pool
const stateBase = { balls: 40, wickets: 2, batsman: { runs: 22 }, partnership: { runs: 16 } };

const noBallContextOutcome = { type: 'no_ball' };
const catchWicketOutcome = { type: 'wicket', wicketType: 'CAUGHT OUTFIELD', drsEligible: false };
const drsOutcome = { type: 'wicket', wicketType: 'LBW', drsEligible: true };
const plainSingleOutcome = { type: 'runs', runs: 1 };

const noBallEligible = canonicalKeysFromEligible(getEligibleSpecialEvents(noBallContextOutcome, stateBase));
check('no_ball eligible in no-ball context', noBallEligible.has('no_ball'));

const catchEligible = canonicalKeysFromEligible(getEligibleSpecialEvents(catchWicketOutcome, stateBase));
check('dropped_catch eligible in catch context', catchEligible.has('dropped_catch'));

const drsEligible = canonicalKeysFromEligible(getEligibleSpecialEvents(drsOutcome, stateBase));
check('drs_win eligible in review context', drsEligible.has('drs_win'));
if (representedCanonicalInTable.has('drs_lose')) {
  check('drs_lose eligible in review context', drsEligible.has('drs_lose'));
}

const singleEligible = canonicalKeysFromEligible(getEligibleSpecialEvents(plainSingleOutcome, stateBase));
check('no_ball not eligible in plain single context', !singleEligible.has('no_ball'));
check('dropped_catch not eligible in plain single context', !singleEligible.has('dropped_catch'));
check('drs_win not eligible in plain single context', !singleEligible.has('drs_win'));
if (representedCanonicalInTable.has('drs_lose')) {
  check('drs_lose not eligible in plain single context', !singleEligible.has('drs_lose'));
}

// Print report
console.log('--- Special Event Lock Validation ---');
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'} | ${c.name}${c.detail ? ` | ${c.detail}` : ''}`);
}
console.log(`\nSummary: ${checks.length - failures}/${checks.length} passed`);

if (failures > 0) {
  process.exitCode = 1;
}

