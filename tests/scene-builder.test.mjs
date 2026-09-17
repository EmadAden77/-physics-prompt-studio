import test from 'node:test';
import assert from 'node:assert/strict';
import { compilePrompt, validatePacket } from '../core/prompt-optimizer.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES, normalizeSceneContext } from '../core/scene-builder.js';
import { generateImagePrompt } from '../core/prompt-generator.js';

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

test('SAUDI_SIGNAGE_RULE exists and is descriptive', async () => {
  const { SAUDI_SIGNAGE_RULE } = await import('../core/scene-builder.js');
  assert.ok(SAUDI_SIGNAGE_RULE.length > 50);
  assert.match(SAUDI_SIGNAGE_RULE, /Arabic/i);
  assert.match(SAUDI_SIGNAGE_RULE, /unreadable/i);
});

test('Saudi scene prompt contains signage rule', () => {
  for (const location of ['ordinary_saudi_street', 'alahsa_residential', 'yanbu_residential_coastal']) {
    const result = generateImagePrompt({ location });
    assert.match(result.prompt, /SIGNAGE REALISM/i, location);
  }
});

test('non-Saudi scene does not contain Saudi signage rule', () => {
  const result = generateImagePrompt({ location: 'an ordinary residential street in Paris, France' });
  assert.doesNotMatch(result.prompt, /SIGNAGE REALISM/i);
});

test('negatives include pseudo-text bans', () => {
  const result = generateImagePrompt({ location: 'supermarket_aisle' });
  assert.match(result.prompt, /pseudo-Arabic/i);
  assert.match(result.prompt, /gibberish text/i);
});

test('formal looks contains 122 unique complete outfits', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  assert.equal(FORMAL_LOOKS.length, 122);
  const labels = FORMAL_LOOKS.map((look) => look.label);
  assert.equal(new Set(labels).size, 122);
  for (const look of FORMAL_LOOKS) assert.ok(look.label.includes(' + بنطال'), `not a complete outfit: ${look.label}`);
});

test('FORMAL_LOOKS contains the 15 timeless colour combinations', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const requiredCombos = [
    'قميص كحلي + بنطال رمادي',
    'قميص أزرق فاتح + بنطال كحلي',
    'قميص أبيض + بنطال بيج',
    'قميص زيتي + بنطال بني تبغي',
    'قميص أسود + بنطال فحمي',
    'قميص بيج + بنطال أبيض',
    'قميص رمادي + بنطال أسود',
    'قميص أخضر مريمي + بنطال كريمي',
    'قميص وردي + بنطال رمادي',
    'قميص أبيض + بنطال كحلي',
    'قميص عنابي + بنطال رمادي',
    'قميص أسود + بنطال بيج',
    'قميص أزرق فولاذي + بنطال كاكي',
    'قميص أبيض + بنطال زيتي',
    'قميص فحمي + بنطال رمادي فاتح'
  ];
  const aliases = {
    'قميص كحلي + بنطال رمادي': 'قميص كحلي + بنطال رمادي متوسط',
    'قميص رمادي + بنطال أسود': 'قميص رمادي متوسط + بنطال أسود',
    'قميص وردي + بنطال رمادي': 'قميص وردي فاتح + بنطال رمادي متوسط',
    'قميص عنابي + بنطال رمادي': 'قميص عنابي + بنطال رمادي متوسط'
  };
  const labels = FORMAL_LOOKS.map((look) => look.label);
  for (const combo of requiredCombos) {
    assert.ok(labels.includes(combo) || labels.includes(aliases[combo]), `Missing timeless combination: ${combo}`);
  }
});

test('no duplicate color pairs', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const pairs = FORMAL_LOOKS.map((look) => look.label);
  assert.equal(new Set(pairs).size, pairs.length);
});

test('no clothing item duplicates a formal look', async () => {
  const { CLOTHING_OPTIONS, FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const clothingLabels = CLOTHING_OPTIONS.map((item) => item.label);
  const lookLabels = FORMAL_LOOKS.map((item) => item.label);
  const duplicates = clothingLabels.filter((label) => lookLabels.includes(label));
  assert.equal(duplicates.length, 0, `Duplicates: ${duplicates.join(', ')}`);
});

test('base clothing items contain no + outfit separator', async () => {
  const { CLOTHING_OPTIONS } = await import('../core/scene-builder.js');
  const withPlus = CLOTHING_OPTIONS.filter((item) => item.label.includes('+'));
  assert.equal(withPlus.length, 0, `Items with +: ${withPlus.map((item) => item.label).join(', ')}`);
});

test('CLOTHING_OPTIONS contains only the two base clothing groups', async () => {
  const { CLOTHING_OPTIONS } = await import('../core/scene-builder.js');
  const groups = [...new Set(CLOTHING_OPTIONS.map((item) => item.group))].sort();
  assert.deepEqual(groups, ['ثياب وتراث سعودي', 'كاجوال'].sort());
});

test('formal suits catalog contains 30 unique suits', async () => {
  const { FORMAL_SUITS } = await import('../core/scene-builder.js');
  assert.equal(FORMAL_SUITS.length, 30);
  const labels = FORMAL_SUITS.map((suit) => suit.label);
  assert.equal(new Set(labels).size, 30);
  const values = FORMAL_SUITS.map((suit) => suit.value);
  assert.equal(new Set(values).size, 30);
});

test('formal suits are distributed across 5 groups', async () => {
  const { FORMAL_SUITS } = await import('../core/scene-builder.js');
  const groups = new Set(FORMAL_SUITS.map((suit) => suit.group));
  assert.equal(groups.size, 5);
});

test('formal suits do not duplicate formal looks', async () => {
  const { FORMAL_SUITS, FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const suitLabels = FORMAL_SUITS.map((suit) => suit.label);
  const lookLabels = FORMAL_LOOKS.map((look) => look.label);
  const duplicates = suitLabels.filter((label) => lookLabels.includes(label));
  assert.equal(duplicates.length, 0, `Duplicates: ${duplicates.join(', ')}`);
});

test('hair catalog contains 30 styling options across 7 groups', async () => {
  const { HAIR_STYLES } = await import('../core/scene-builder.js');
  assert.equal(HAIR_STYLES.length, 30);
  const groups = new Set(HAIR_STYLES.map((hair) => hair.group));
  assert.ok(groups.size >= 7);
  for (const style of HAIR_STYLES) {
    assert.ok(style.label.length > 5);
    assert.ok(style.prompt.length > 40);
  }
});

test('all 40 bedroom poses expose a non-empty cameraHint', async () => {
  const { BEDROOM_POSES } = await import('../core/scene-builder.js');
  assert.equal(BEDROOM_POSES.length, 40);
  for (const pose of BEDROOM_POSES) {
    assert.equal(typeof pose.cameraHint, 'string', `cameraHint is not a string for ${pose.value}`);
    assert.ok(pose.cameraHint.trim().length > 0, `missing cameraHint for ${pose.value}`);
  }
});
