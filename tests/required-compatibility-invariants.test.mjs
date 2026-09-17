import test from 'node:test';
import assert from 'node:assert/strict';

import { randomizationOptionsForScene } from '../app.js';
import { SCENE_TYPES } from '../core/prompt-generator.js';
import { EXTRA_SCENE_TYPES, HOME_SCENE_TYPES } from '../core/scene-type-expansion.js';
import { resolveCompatibleValue } from '../core/scene-compatibility.js';

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
