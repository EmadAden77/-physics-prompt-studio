import test from 'node:test';
import assert from 'node:assert/strict';

import { randomizationOptionsForScene } from '../app.js';
import { SCENE_TYPES } from '../core/prompt-generator.js';
import { EXTRA_SCENE_TYPES, HOME_SCENE_TYPES } from '../core/scene-type-expansion.js';
import { locationsForScene, resolveCompatibleValue } from '../core/scene-compatibility.js';

test('required compatibility resolution fails loudly on an empty option list', () => {
  assert.throws(
    () => resolveCompatibleValue('', [], '', { required: true, fieldName: 'camera' }),
    /Invariant violation: required compatibility field "camera" has no valid options/
  );
  assert.equal(resolveCompatibleValue('', [], ''), '', 'optional compatibility values may intentionally remain empty');
});

test('required UI fields never reach an empty compatibility list', () => {
  const sceneTypes = new Set([
    ...SCENE_TYPES.map((item) => item.value),
    ...EXTRA_SCENE_TYPES.map((item) => item.value),
    ...HOME_SCENE_TYPES
  ]);

  for (const sceneType of sceneTypes) {
    const options = randomizationOptionsForScene(sceneType);
    for (const field of ['camera', 'framing', 'backgroundActivity']) {
      assert.ok(options[field]?.length > 0, `${sceneType}.${field} unexpectedly resolved to an empty required list`);
    }
  }
});

test('no selectable scene type produces empty required facets', () => {
  const allSceneTypes = [
    ...SCENE_TYPES.map((item) => item.value),
    ...EXTRA_SCENE_TYPES.map((item) => item.value)
  ];
  const requiredFacets = ['location', 'clothing', 'pose', 'lighting'];
  const failures = [];

  for (const sceneType of allSceneTypes) {
    const options = randomizationOptionsForScene(sceneType);
    for (const facet of requiredFacets) {
      if (!options[facet] || options[facet].length === 0) failures.push(`${sceneType}.${facet}`);
    }
  }

  assert.equal(failures.length, 0, `Empty facets found: ${failures.join(', ')}`);
});

test('full_body_third_person inherits all third_person_portrait locations', () => {
  const portrait = locationsForScene('third_person_portrait');
  const fullBody = locationsForScene('full_body_third_person');

  assert.equal(fullBody.length, portrait.length);
  assert.deepEqual(
    fullBody.map((location) => location.value).sort(),
    portrait.map((location) => location.value).sort()
  );
});

test('third_person_full_body_seated exposes the seated pose', () => {
  const options = randomizationOptionsForScene('third_person_full_body_seated');
  assert.ok(
    options.pose.some((pose) => pose.value === 'third_seated_relaxed'),
    'third_seated_relaxed must be exposed in third_person_full_body_seated'
  );
});

