import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  newSeed,
  normalizeSeed,
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

test('normalizeSeed clamps invalid and out-of-range values', () => {
  assert.equal(normalizeSeed(undefined), 42);
  assert.equal(normalizeSeed('not-a-number'), 42);
  assert.equal(normalizeSeed(0), 1);
  assert.equal(normalizeSeed(-50), 1);
  assert.equal(normalizeSeed(1.9), 1);
  assert.equal(normalizeSeed('250'), 250);
  assert.equal(normalizeSeed(999999.9), 999999);
  assert.equal(normalizeSeed(1000000), 999999);
});

test('newSeed uses crypto.getRandomValues and maps into the supported range', (t) => {
  const sourceValue = 1234567890;
  const mockedGetRandomValues = t.mock.method(globalThis.crypto, 'getRandomValues', (buffer) => {
    buffer[0] = sourceValue;
    return buffer;
  });

  const seed = newSeed();
  assert.equal(seed, (sourceValue % 999999) + 1);
  assert.ok(seed >= 1 && seed <= 999999);
  assert.equal(mockedGetRandomValues.mock.callCount(), 1);
  assert.equal(mockedGetRandomValues.mock.calls[0].arguments[0] instanceof Uint32Array, true);
});

test('new scene button persists the visible seed input without Math.random', () => {
  const app = fs.readFileSync('app.js', 'utf8');
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(app, /Math\.random\s*\(/);
  assert.match(app, /localStorage\?\.setItem\(SEED_STORAGE_KEY/);
  assert.match(app, /localStorage\?\.getItem\(SEED_STORAGE_KEY/);
  assert.match(html, /id="seedInput"[^>]*min="1"[^>]*max="999999"/);
  assert.match(html, /id="randomButton"[^>]*>🎲 مشهد جديد<\/button>/);
});
