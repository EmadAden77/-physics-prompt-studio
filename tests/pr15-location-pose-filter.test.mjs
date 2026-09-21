import test from 'node:test';
import assert from 'node:assert/strict';

import { LOCATION_CATALOG, SELFIE_POSES, getAvailablePoses } from '../core/scene-builder.js';
import { generateImagePrompt } from '../core/prompt-generator.js';

const poseValues = (locationValue) => new Set(
  getAvailablePoses('front_selfie', locationValue).map((pose) => pose.value)
);

test('PR 15 assigns a supported requires tag to every SELFIE_POSES entry', () => {
  const allowed = new Set(['neutral','chair','sofa','counter','railing','wall','table']);
  assert.equal(SELFIE_POSES.length, 34);
  for (const pose of SELFIE_POSES) assert.equal(allowed.has(pose.requires), true, pose.value);
});

test('PR 15 airport terminal excludes lean_railing', () => {
  assert.equal(poseValues('airport_terminal').has('lean_railing'), false);
});

test('PR 15 airport terminal includes lean_wall', () => {
  assert.equal(poseValues('airport_terminal').has('lean_wall'), true);
});

test('PR 15 airport terminal excludes seated_sofa', () => {
  assert.equal(poseValues('airport_terminal').has('seated_sofa'), false);
});

test('PR 15 palm farm excludes seated_sofa', () => {
  assert.equal(poseValues('palm_farm').has('seated_sofa'), false);
});

test('PR 15 palm farm excludes seated_legs_crossed', () => {
  assert.equal(poseValues('palm_farm').has('seated_legs_crossed'), false);
});

test('PR 15 palm farm keeps standing_arms_crossed as neutral', () => {
  assert.equal(poseValues('palm_farm').has('standing_arms_crossed'), true);
});

test('PR 15 Saudi office includes seated_legs_crossed', () => {
  assert.equal(poseValues('saudi_office').has('seated_legs_crossed'), true);
});

test('PR 15 Saudi office excludes lean_railing', () => {
  assert.equal(poseValues('saudi_office').has('lean_railing'), false);
});

test('PR 15 modern Saudi majlis allows sofa but not chair poses', () => {
  const values = poseValues('modern_saudi_majlis');
  assert.equal(values.has('seated_sofa'), true);
  assert.equal(values.has('seated_legs_crossed'), false);
});

test('PR 15 empty and unlisted locations keep the full SELFIE_POSES fallback', () => {
  const expected = SELFIE_POSES.map((pose) => pose.value);
  assert.deepEqual(getAvailablePoses('front_selfie', '').map((pose) => pose.value), expected);
  assert.deepEqual(getAvailablePoses('front_selfie', 'khobar_corniche').map((pose) => pose.value), expected);
});

test('PR 15 scoped locations and fallbacks preserve the 23-section prompt invariant', () => {
  for (const locationValue of [
    'airport_terminal',
    'boulevard_walkway',
    'palm_farm',
    'saudi_office',
    'saudi_cafe',
    'modern_saudi_majlis',
    '',
    'khobar_corniche'
  ]) {
    const poseValue = getAvailablePoses('front_selfie', locationValue)[0]?.value || '';
    const location = LOCATION_CATALOG.find((item) => item.value === locationValue)?.prompt || '';
    const result = generateImagePrompt({ sceneType:'front_selfie', location, locationValue, poseValue });
    assert.equal(result.sections.length, 23, locationValue || 'empty');
    assert.equal(result.validation.valid, true, result.validation.errors.join(' | '));
  }
});
