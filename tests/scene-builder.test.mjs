import test from 'node:test';
import assert from 'node:assert/strict';
import { compilePrompt, validatePacket } from '../core/prompt-optimizer.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES, normalizeSceneContext } from '../core/scene-builder.js';

test('scene catalog is broad across requested categories', () => {
  assert.ok(SAUDI_LOCATIONS.length >= 40);
  assert.ok(CLOTHING_OPTIONS.length >= 25);
  assert.ok(SELFIE_POSES.length >= 12);
  assert.ok(SELFIE_ANGLES.length >= 12);
  assert.ok(LIGHTING_PROFILES.length >= 15);
});

test('scene controls do not modify original_prompt', () => {
  const source = 'Create a realistic selfie. Return the prompt only.';
  const packet = compilePrompt(source, { scene: { location: 'inside a Saudi majlis', clothing: 'a white thobe' } });
  assert.equal(packet.original_prompt, source);
  assert.equal(packet.scene_context.location.value, 'inside a Saudi majlis');
});

test('scene controls enter relevant context and constraint map once', () => {
  const packet = compilePrompt('Create a realistic selfie.', { scene: { location: 'on an ordinary Saudi street', angle: 'front camera slightly above eye level', lighting: 'night LED street fixtures with real falloff' } });
  const context = packet.sections.find((section) => section.name === 'relevant_context');
  assert.ok(context.text.includes('ordinary Saudi street'));
  assert.ok(packet.compiled_prompt.text.includes('real falloff'));
  const sceneItems = packet.constraint_map.filter((item) => item.source_kind === 'scene_control');
  assert.equal(sceneItems.length, 3);
  assert.equal(new Set(sceneItems.map((item) => item.source_key)).size, 3);
  assert.equal(validatePacket(packet).valid, true);
});

test('empty scene values are discarded', () => {
  const normalized = normalizeSceneContext({ location: ' ', clothing: '', angle: 'eye level' });
  assert.deepEqual(Object.keys(normalized), ['angle']);
});
