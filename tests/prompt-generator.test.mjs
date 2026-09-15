import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImagePrompt, validateGeneratedPrompt } from '../core/prompt-generator.js';

test('generates a complete prompt without free-form source text', () => {
  const result = generateImagePrompt();
  assert.equal(result.validation.valid, true);
  assert.ok(result.prompt.includes('[GOAL]'));
  assert.ok(result.prompt.includes('[ACTION-DRIVEN AUTHENTICITY]'));
  assert.ok(result.prompt.includes('[FINAL VERIFICATION]'));
  assert.ok(result.prompt.length > 3000);
});

test('selected scene controls are injected into the generated prompt', () => {
  const result = generateImagePrompt({
    sceneType: 'standing_selfie',
    location: 'inside a modern Saudi majlis',
    clothing: 'a dark navy Saudi thobe',
    pose: 'standing naturally near the seating edge',
    angle: 'slightly above eye level',
    lighting: 'warm practical ceiling lights',
    aspectRatio: '9:16'
  });
  for (const token of ['modern Saudi majlis','dark navy Saudi thobe','standing naturally','slightly above eye level','warm practical ceiling lights']) {
    assert.ok(result.prompt.includes(token), `missing ${token}`);
  }
});

test('physical lighting explicitly separates illumination from exposure processing', () => {
  const result = generateImagePrompt({ lighting: 'localized white LED parking lights' });
  assert.ok(result.prompt.includes('Physical illumination alone determines'));
  assert.ok(result.prompt.includes('Exposure, ISO, HDR'));
  assert.equal(validateGeneratedPrompt(result.prompt, { realismPacket: result.realism_packet }).valid, true);
});

test('selfie modes lock reachable subject-held geometry', () => {
  const result = generateImagePrompt({ sceneType: 'inside_car_selfie' });
  assert.ok(result.prompt.includes('subject-held smartphone selfie'));
  assert.match(result.prompt, /reachable|arm-reach|arm length/i);
  assert.ok(result.prompt.includes('no third-person viewpoint'));
});

test('third-person mode does not silently become selfie capture', () => {
  const result = generateImagePrompt({ sceneType: 'third_person_portrait', camera: 'smartphone_rear' });
  assert.ok(result.prompt.includes('third-person smartphone photograph'));
  assert.ok(result.prompt.includes('The subject is not holding the camera'));
  assert.ok(result.prompt.includes('no selfie arm'));
});

test('identity reference can be disabled', () => {
  const result = generateImagePrompt({ identityReference: false });
  assert.ok(result.prompt.includes('No reference identity is required'));
  assert.equal(result.config.identity_reference, false);
});

test('realism JSON packet exposes required subject accessories photography and background fields', () => {
  const result = generateImagePrompt({ sceneType: 'cafe_selfie' });
  assert.equal(result.realism_packet.methodology, 'REALISTIC IMAGE GENERATOR');
  for (const key of ['subject', 'accessories', 'photography', 'background']) assert.ok(result.realism_packet[key], `missing ${key}`);
  assert.ok(Array.isArray(result.realism_packet.background.elements));
  assert.ok(Array.isArray(result.realism_packet.imperfections));
});

test('mirror selfie always emits mirror rules and final text-orientation guidance', () => {
  const result = generateImagePrompt({ sceneType: 'mirror_selfie' });
  assert.notEqual(result.realism_packet.subject.mirror_rules, 'not_applicable');
  assert.match(result.realism_packet.subject.mirror_rules, /forward and legible/i);
  assert.match(result.realism_packet.subject.mirror_rules, /reflection geometry/i);
  assert.ok(result.prompt.includes('[MIRROR RULES]'));
});

test('non-mirror scenes explicitly mark mirror rules not applicable', () => {
  const result = generateImagePrompt({ sceneType: 'inside_car_selfie' });
  assert.equal(result.realism_packet.subject.mirror_rules, 'not_applicable');
  assert.ok(result.prompt.includes('Mirror rules: not applicable'));
});

test('gym context is action-driven and receives fitness-specific imperfections and accessories', () => {
  const result = generateImagePrompt({
    sceneType: 'front_selfie',
    location: 'inside a modern Saudi gym',
    description: 'post-workout selfie after finishing a set'
  });
  assert.equal(result.realism_packet.template_type, 'Gym/Fitness Selfie');
  assert.match(result.realism_packet.action, /post-workout|recovering|water bottle/i);
  assert.match(result.realism_packet.accessories.jewelry, /no luxury jewelry/i);
  assert.ok(result.realism_packet.imperfections.some((item) => /sweat|flushed|flyaways/i.test(item)));
});

test('camera wording is simpler while physical geometry remains enforced separately', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', camera: 'xiaomi15_front' });
  assert.ok(result.prompt.includes('Xiaomi 15 Ultra front camera with a natural wide selfie look'));
  const cameraGeometry = result.prompt.split('[CAMERA GEOMETRY]\n')[1].split('\n\n[PHYSICAL LIGHTING]')[0];
  assert.doesNotMatch(cameraGeometry, /21mm-equivalent|f\/\d/i);
  assert.ok(result.prompt.includes('[CAMERA GEOMETRY]'));
});

test('every generated prompt contains the three mandatory realism sections', () => {
  for (const sceneType of ['front_selfie', 'inside_car_selfie', 'mirror_selfie', 'third_person_portrait']) {
    const result = generateImagePrompt({ sceneType });
    assert.ok(result.prompt.includes('[LENS_PHYSICS]'), sceneType);
    assert.ok(result.prompt.includes('[BIOLOGICAL_MICRO_REALISM]'), sceneType);
    assert.ok(result.prompt.includes('[CAMERA_METADATA_HINT]'), sceneType);
    assert.equal(result.validation.valid, true, `${sceneType} failed validation`);
  }
});

test('realism sections include physical photographic language', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.match(result.prompt, /chromatic aberration/i);
  assert.match(result.prompt, /visible skin pores/i);
  assert.match(result.prompt, /corneal reflections/i);
  assert.match(result.prompt, /stray hairs/i);
  assert.match(result.prompt, /vignetting/i);
});

test('negatives include anti-AI-tell bans', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  for (const phrase of ['no plastic skin', 'no perfectly symmetric face', 'no beauty filter', 'no missing corneal reflections']) {
    assert.ok(result.prompt.toLowerCase().includes(phrase), phrase);
  }
});
