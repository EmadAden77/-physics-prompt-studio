import test from 'node:test';
import assert from 'node:assert/strict';
import { INSIDE_DEFAULT_STATE } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE } from '../data/carSelfieOutsideCatalog.js';
import { normalizeCarState } from '../core/carSelfieValidation.js';
import {
  compileNarrative,
  countNarrativeWords,
  DRIVER_ANCHOR_SENTENCE,
  PASSENGER_ANCHOR_SENTENCE,
  EXTERIOR_ANCHOR_SENTENCE,
  NEGATIVE_LIST
} from '../core/carSelfieNarrativeCompiler.js';
import {
  compileCarSelfieDetailed,
  compileCarSelfieNegative,
  compileCarSelfieTechnicalSpec
} from '../core/carSelfieCompiler.js';

const inside = (patch = {}) => normalizeCarState({ ...structuredClone(INSIDE_DEFAULT_STATE), ...patch, mode: 'inside' });
const outside = (patch = {}) => normalizeCarState({ ...structuredClone(OUTSIDE_DEFAULT_STATE), ...patch, mode: 'outside' });

test('narrative prompts stay at or below 300 words', () => {
  const samples = [
    inside(),
    inside({ seat: 'front-passenger-right', clothing: 'denim-casual', fabricType: 'denim', clutterLevel: 'moderate', place: 'desert-road' }),
    inside({ clutterLevel: 'heavy', notes: 'keep the scene candid and ordinary with subtle everyday wear and a relaxed natural expression without staged advertising polish' }),
    outside(),
    outside({ captureMode: 'remote-rear', cameraLens: 'rear-tele-70', distance: 220, standingPose: 'lean-car', place: 'local-cafe-front' })
  ];
  const counts = samples.map((state) => countNarrativeWords(compileNarrative(state, state.mode)));
  counts.forEach((count) => assert.ok(count <= 300, `narrative exceeded 300 words: ${count}`));
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  console.log(`Narrative prompt average words: ${average.toFixed(1)}; samples=${counts.join(',')}`);
});

test('driver, passenger and exterior anchors are always present for their modes', () => {
  assert.ok(compileNarrative(inside({ seat: 'driver-left' }), 'inside').includes(DRIVER_ANCHOR_SENTENCE));
  assert.ok(compileNarrative(inside({ seat: 'front-passenger-right' }), 'inside').includes(PASSENGER_ANCHOR_SENTENCE));
  assert.ok(compileNarrative(outside(), 'outside').includes(EXTERIOR_ANCHOR_SENTENCE));
});

test('compileCarSelfieDetailed is now the narrative output', () => {
  const state = inside({ seat: 'driver-left', clutterLevel: 'light' });
  assert.equal(compileCarSelfieDetailed(state), compileNarrative(state, 'inside'));
  assert.doesNotMatch(compileCarSelfieDetailed(state), /PHOTOREALISTIC PROMPT SPECIFICATION|CAMERA PROCESSING:|HARD ACCEPTANCE CRITERIA/);
});

test('narrative tone contains no MUST, MANDATORY or FAIL tokens', () => {
  for (const state of [inside(), inside({ seat: 'front-passenger-right' }), outside()]) {
    const text = compileCarSelfieDetailed(state);
    assert.doesNotMatch(text, /\b(?:must|mandatory|fail)\b/i);
  }
});

test('unified negative list is returned exactly', () => {
  assert.equal(compileCarSelfieNegative(inside()), NEGATIVE_LIST);
  assert.equal(compileCarSelfieNegative(outside()), NEGATIVE_LIST);
  for (const phrase of ['no CGI','no plastic skin','no brand logos','no mirrored cabin','no missing steering wheel hint','no floating objects','no perfectly centered composition','no perfectly level camera']) {
    assert.ok(NEGATIVE_LIST.includes(phrase), `missing negative token: ${phrase}`);
  }
});

test('same state produces byte-identical narrative output', () => {
  const state = inside({ place: 'public-parking', clothing: 'denim-casual', fabricType: 'denim', roll: 2, clutterLevel: 'moderate' });
  assert.equal(compileCarSelfieDetailed(state), compileCarSelfieDetailed(state));
});

test('legacy technical spec remains available only as separate compiler output', () => {
  const state = inside();
  const narrative = compileCarSelfieDetailed(state);
  const legacy = compileCarSelfieTechnicalSpec(state);
  assert.notEqual(narrative, legacy);
  assert.match(legacy, /TECHNICAL SPEC \(LEGACY\)/);
  assert.match(legacy, /HARD ACCEPTANCE CRITERIA/);
});
