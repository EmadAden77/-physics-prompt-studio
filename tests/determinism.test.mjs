import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  randomizeWithSeed,
  randomizationOptionsForScene,
  seededRandom,
  pickRandom
} from '../app.js';

const SCENES = [
  'front_selfie',
  'standing_selfie',
  'seated_selfie',
  'walking_selfie',
  'inside_car_selfie',
  'supermarket_selfie',
  'third_person_portrait'
].map((value) => ({ value }));

const RANDOMIZED_FIELDS = [
  'location','clothing','pose','angle','lighting','camera','framing',
  'expression','backgroundActivity','realismLevel','aspectRatio','hairStyle'
];

function testEnvironment() {
  return {
    sceneTypes: () => SCENES,
    optionsForScene: randomizationOptionsForScene,
    applyState: async (planned) => planned
  };
}

test('same seed produces identical scene state', async () => {
  const state1 = await randomizeWithSeed(42, testEnvironment());
  const state2 = await randomizeWithSeed(42, testEnvironment());
  assert.deepEqual(state1, state2);
});

test('different seeds produce different scenes', async () => {
  const state1 = await randomizeWithSeed(42, testEnvironment());
  const state2 = await randomizeWithSeed(999, testEnvironment());
  assert.ok(
    ['sceneType','location','clothing'].some((field) => state1[field] !== state2[field]),
    'different seeds should change sceneType, location, or clothing'
  );
});

test('randomize respects scene compatibility', async () => {
  const state = await randomizeWithSeed(42, testEnvironment());
  const compatible = randomizationOptionsForScene(state.sceneType);
  for (const field of RANDOMIZED_FIELDS) {
    const values = new Set((compatible[field] || []).map((item) => item.value));
    assert.ok(values.has(state[field]), `${field}=${state[field]} is not compatible with ${state.sceneType}`);
  }
});

test('randomize changes all fields broadly between different seeds', async () => {
  const state1 = await randomizeWithSeed(42, testEnvironment());
  const state2 = await randomizeWithSeed(999, testEnvironment());
  const changed = ['sceneType', ...RANDOMIZED_FIELDS].filter((field) => state1[field] !== state2[field]);
  assert.ok(changed.length > 5, `expected more than 5 changed fields, got ${changed.length}: ${changed.join(', ')}`);
});

test('seededRandom and pickRandom are deterministic', () => {
  const first = seededRandom(31415);
  const second = seededRandom(31415);
  const items = ['a','b','c','d','e'];
  const picks1 = Array.from({ length: 8 }, () => pickRandom(items, first));
  const picks2 = Array.from({ length: 8 }, () => pickRandom(items, second));
  assert.deepEqual(picks1, picks2);
});

test('new scene button uses crypto seeds and persists the visible seed input', () => {
  const app = fs.readFileSync('app.js', 'utf8');
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(app, /crypto\?\.getRandomValues|crypto\.getRandomValues|getRandomValues\(buffer\)/);
  assert.doesNotMatch(app, /Math\.random\s*\(/);
  assert.match(app, /localStorage\?\.setItem\(SEED_STORAGE_KEY/);
  assert.match(app, /localStorage\?\.getItem\(SEED_STORAGE_KEY/);
  assert.match(html, /id="seedInput"[^>]*min="1"[^>]*max="999999"/);
  assert.match(html, /id="randomButton"[^>]*>🎲 مشهد جديد<\/button>/);
});
