import test from 'node:test';
import assert from 'node:assert/strict';

import { HAIR_STYLES } from '../core/scene-builder.js';
import { generateImagePrompt, SCENE_TYPES } from '../core/prompt-generator.js';
import { hairStylesForScene, compatibilitySnapshot } from '../core/scene-compatibility.js';
import { EXTRA_SCENE_TYPES } from '../core/scene-type-expansion.js';

test('hair catalog keeps 30 explicit directional styles across 7 groups', () => {
  assert.equal(HAIR_STYLES.length, 30);
  assert.equal(new Set(HAIR_STYLES.map((style) => style.value)).size, 30);
  assert.equal(new Set(HAIR_STYLES.map((style) => style.group)).size, 7);

  const directionalGroups = new Map([
    ['ممشط للخلف', /BACKWARD/],
    ['ممشط للأمام', /FORWARD/],
    ['جانبي', /part|lateral/i],
    ['وسط', /CENTER|center|off-center/],
    ['غير مرتب', /random|unstyled|breeze/i]
  ]);

  for (const style of HAIR_STYLES) {
    const expectedDirection = directionalGroups.get(style.group);
    if (expectedDirection) assert.match(style.prompt, expectedDirection, `${style.value}: direction is not explicit`);
  }
});

test('hair-back-separated explicitly locks backward flow and a clear forehead', () => {
  const style = HAIR_STYLES.find((item) => item.value === 'hair-back-separated');
  assert.ok(style, 'hair-back-separated is missing');
  assert.match(style.prompt, /firmly combed BACKWARD from the forehead/);
  assert.match(style.prompt, /hairline remains fully visible/i);
  assert.match(style.prompt, /Absolutely no strands fall forward or cover the forehead/i);
});

test('selected hairstyle emits mandatory HAIR DIRECTION LOCK inside identity subject', () => {
  const style = HAIR_STYLES.find((item) => item.value === 'hair-back-separated');
  const result = generateImagePrompt({ sceneType: 'front_selfie', hairStyle: style.prompt });
  const identity = result.prompt.split('[IDENTITY / SUBJECT]\n')[1].split('\n\n[SCENE]')[0];

  assert.ok(identity.includes(style.prompt));
  assert.match(identity, /HAIR DIRECTION LOCK:/);
  assert.match(identity, /no strands may fall forward onto the forehead/i);
  assert.match(identity, /parting line must be clearly visible on the left side/i);
  assert.match(identity, /Ignore generic 'natural look' instructions that contradict the selected direction/i);
});

test('all base and expanded scene types expose all 30 hair styles', () => {
  const expectedValues = HAIR_STYLES.map((style) => style.value);
  const sceneTypes = [
    ...SCENE_TYPES.map((scene) => scene.value),
    ...EXTRA_SCENE_TYPES.map((scene) => scene.value)
  ];

  for (const sceneType of sceneTypes) {
    const styles = hairStylesForScene(sceneType);
    assert.equal(styles.length, 30, `${sceneType}: expected 30 hair styles`);
    assert.deepEqual(styles.map((style) => style.value), expectedValues, `${sceneType}: hair style catalog changed`);
  }
});

test('compatibility snapshot exposes the full hair catalog', () => {
  const snapshot = compatibilitySnapshot('inside_car_selfie', { hairStyle: HAIR_STYLES });
  assert.equal(snapshot.hairStyle.length, 30);
  assert.deepEqual(snapshot.hairStyle.map((style) => style.value), HAIR_STYLES.map((style) => style.value));
});
