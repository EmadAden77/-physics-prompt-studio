import test from 'node:test';
import assert from 'node:assert/strict';
import { INSIDE_DEFAULT_STATE } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE } from '../data/carSelfieOutsideCatalog.js';
import { normalizeCarState } from '../core/carSelfieValidation.js';
import { buildCarSelfieEngineeringSpec } from '../core/carSelfieEngineeringSpec.js';
import {
  compileCarSelfieMinimalPrompt,
  countPromptWords,
  INSIDE_VISUAL_ANCHOR
} from '../core/carSelfieMinimalPrompt.js';
import { buildCarSelfieAcceptance, formatCarSelfieAcceptance } from '../core/carSelfieAcceptance.js';

const inside = (patch = {}) => normalizeCarState({ ...structuredClone(INSIDE_DEFAULT_STATE), ...patch, mode: 'inside' });
const outside = (patch = {}) => normalizeCarState({ ...structuredClone(OUTSIDE_DEFAULT_STATE), ...patch, mode: 'outside' });

test('minimal prompt stays within the 250-word hard budget', () => {
  const samples = [
    inside(),
    inside({ place: 'desert-road', clothing: 'denim-casual', fabricType: 'denim', windowState: 'driver-cracked', clutterLevel: 'moderate' }),
    outside(),
    outside({ captureMode: 'remote-rear', cameraLens: 'rear-tele-70', distance: 220, standingPose: 'lean-car', place: 'local-cafe-front' })
  ];
  const counts = samples.map((state) => countPromptWords(compileCarSelfieMinimalPrompt(state)));
  for (const count of counts) assert.ok(count <= 250, `minimal prompt exceeded budget: ${count}`);
  const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  console.log(`Minimal prompt average words: ${average.toFixed(1)}; samples=${counts.join(',')}`);
});

test('inside driver minimal prompt always includes exact mandatory visual anchor', () => {
  const prompt = compileCarSelfieMinimalPrompt(inside({ seat: 'driver-left' }));
  assert.ok(prompt.includes(INSIDE_VISUAL_ANCHOR));
  assert.match(prompt, /driver's door window with exterior street view appears on the RIGHT half of the frame/);
  assert.match(prompt, /steering wheel's top rim is partially visible at the bottom-center-left/);
});

test('every minimal prompt contains exactly one visual anchor section', () => {
  for (const state of [inside(), outside()]) {
    const prompt = compileCarSelfieMinimalPrompt(state);
    assert.equal((prompt.match(/VISUAL ANCHOR:/g) || []).length, 1);
  }
});

test('same normalized state produces exactly the same minimal prompt', () => {
  const state = inside({ initialRequest: 'natural in-car selfie', place: 'public-parking', roll: 2 });
  assert.equal(compileCarSelfieMinimalPrompt(state), compileCarSelfieMinimalPrompt(state));
});

test('engineering spec is deterministic and model-delivery is false', () => {
  const state = inside();
  const a = buildCarSelfieEngineeringSpec(state);
  const b = buildCarSelfieEngineeringSpec(state);
  assert.deepEqual(a, b);
  assert.equal(a.model_delivery, false);
  assert.equal(a.coordinate_system.origin, 'driver_eye');
  assert.equal(typeof a.camera_position.x_cm, 'number');
  assert.equal(typeof a.camera_position.y_cm, 'number');
  assert.equal(typeof a.camera_position.z_cm, 'number');
});

test('each engineering requirement has a corresponding acceptance check', () => {
  for (const state of [inside(), outside()]) {
    const spec = buildCarSelfieEngineeringSpec(state);
    const acceptanceIds = new Set(buildCarSelfieAcceptance(state).map((item) => item.id));
    for (const [key, value] of Object.entries(spec)) {
      if (!value || typeof value !== 'object' || Array.isArray(value) || !value.acceptance_id) continue;
      assert.ok(acceptanceIds.has(value.acceptance_id), `${key} maps to missing acceptance id: ${value.acceptance_id}`);
    }
  }
});

test('acceptance layer contains 10 to 15 manual checks per mode', () => {
  for (const state of [inside(), outside()]) {
    const items = buildCarSelfieAcceptance(state);
    assert.ok(items.length >= 10 && items.length <= 15, `unexpected checklist size: ${items.length}`);
    assert.equal(new Set(items.map((item) => item.id)).size, items.length, 'acceptance ids must be unique');
  }
});

test('inside acceptance includes all mandatory user-facing checks', () => {
  const text = formatCarSelfieAcceptance(inside());
  for (const phrase of [
    'نافذة السائق',
    'حافة المقود',
    'شعار أو نص مقروء',
    'مسام',
    'شعيرات',
    'أسفلت',
    'عنصرين',
    'مصدر أو مصادر محددة',
    'ظل ثانٍ',
    '1-3 درجات'
  ]) assert.ok(text.includes(phrase), `missing acceptance phrase: ${phrase}`);
});

test('engineering and acceptance details do not leak into compact prompt', () => {
  const prompt = compileCarSelfieMinimalPrompt(inside());
  assert.doesNotMatch(prompt, /camera_position|subject_seat_anchors|acceptance_id|CLUTTER VISIBILITY BUDGET|HARD ACCEPTANCE CRITERIA/);
  assert.match(prompt, /^\[SUBJECT\]:/m);
  assert.match(prompt, /^\[MODE\]:/m);
  assert.match(prompt, /^\[VEHICLE\]:/m);
  assert.match(prompt, /^\[CAMERA\]:/m);
  assert.match(prompt, /^\[ENVIRONMENT\]:/m);
  assert.match(prompt, /^\[LIGHT\]:/m);
  assert.match(prompt, /^\[QUALITY\]:/m);
});
