import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { generateImagePrompt, validateGeneratedPrompt, validateRealism } from '../core/prompt-generator.js';
import { addSensorNoise, XIAOMI_15_ULTRA_PRESET } from '../core/photo-post-processing.js';
import { CLOTHING_OPTIONS, FORMAL_SUITS, FORMAL_LOOKS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from '../core/scene-builder.js';

const sceneTypes = ['front_selfie', 'inside_car_selfie', 'mirror_selfie', 'third_person_portrait'];

function sampleImage(width = 8, height = 8) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    data[i] = (80 + pixel * 3) % 256;
    data[i + 1] = (110 + pixel * 5) % 256;
    data[i + 2] = (140 + pixel * 7) % 256;
    data[i + 3] = 255;
  }
  return { width, height, data };
}

test('end-to-end prompt generation is deterministic and structurally valid', () => {
  for (const sceneType of sceneTypes) {
    const input = {
      sceneType,
      camera: 'xiaomi15_front',
      location: 'an ordinary Saudi setting with physically plausible practical lighting',
      realismLevel: 'strict'
    };
    const first = generateImagePrompt(input);
    const second = generateImagePrompt(input);

    assert.equal(first.prompt, second.prompt, `${sceneType} prompt is not deterministic`);
    assert.deepEqual(first.config, second.config, `${sceneType} config is not deterministic`);
    assert.equal(first.sections.length, 23, `${sceneType} must contain 23 mandatory sections`);
    assert.equal(first.validation.valid, true, `${sceneType} failed structural validation`);
    assert.equal(first.realism_validation.valid, true, `${sceneType} failed realism validation`);
    assert.equal(validateGeneratedPrompt(first.prompt, { realismPacket: first.realism_packet }).valid, true);
    assert.equal(validateRealism(first.prompt).valid, true);
  }
});

test('core catalog counts match the documented production baseline', () => {
  assert.equal(CLOTHING_OPTIONS.length, 25, 'CLOTHING_OPTIONS count changed');
  assert.equal(FORMAL_SUITS.length, 30, 'FORMAL_SUITS count changed');
  assert.equal(FORMAL_LOOKS.length, 122, 'FORMAL_LOOKS count changed');
  assert.equal(CLOTHING_OPTIONS.length + FORMAL_SUITS.length, 55, 'combined base clothing and formal suits count changed');

  const clothingLabels = new Set(CLOTHING_OPTIONS.map((item) => item.label));
  const duplicateSuitLabels = FORMAL_SUITS.filter((item) => clothingLabels.has(item.label)).map((item) => item.label);
  assert.deepEqual(duplicateSuitLabels, [], `CLOTHING_OPTIONS and FORMAL_SUITS duplicate labels: ${duplicateSuitLabels.join(', ')}`);

  const clothingValues = new Set(CLOTHING_OPTIONS.map((item) => item.value));
  const duplicateSuitValues = FORMAL_SUITS.filter((item) => clothingValues.has(item.value)).map((item) => item.value);
  assert.deepEqual(duplicateSuitValues, [], `CLOTHING_OPTIONS and FORMAL_SUITS duplicate values: ${duplicateSuitValues.join(', ')}`);

  assert.equal(SELFIE_POSES.length, 16, 'SELFIE_POSES count changed');
  assert.equal(SELFIE_ANGLES.length, 16, 'SELFIE_ANGLES count changed');
  assert.equal(LIGHTING_PROFILES.length, 23, 'LIGHTING_PROFILES count changed');
});

test('FORMAL_LOOKS contains the two newly added timeless combinations', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const labels = FORMAL_LOOKS.map((look) => look.label);
  assert.ok(labels.includes('قميص بيج + بنطال أبيض'));
  assert.ok(labels.includes('قميص أزرق فولاذي + بنطال كاكي'));
});

test('SAUDI_LOCATIONS is a derived alias of LOCATION_CATALOG', async () => {
  const { SAUDI_LOCATIONS, LOCATION_CATALOG } = await import('../core/scene-builder.js');
  assert.equal(SAUDI_LOCATIONS.length, LOCATION_CATALOG.length);
  assert.equal(SAUDI_LOCATIONS.length, 125);
  assert.deepEqual(
    SAUDI_LOCATIONS.map((location) => location.value).sort(),
    LOCATION_CATALOG.map((location) => location.value).sort()
  );
});

test('office_selfie has expanded location coverage', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  const officeLocations = LOCATION_CATALOG.filter((location) => location.sceneTypes.includes('office_selfie'));
  assert.ok(officeLocations.length >= 15, `office_selfie location coverage is ${officeLocations.length}; expected at least 15`);
});

test('LOCATION_CATALOG contains 125 locations', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  assert.equal(LOCATION_CATALOG.length, 125);
});

test('new office locations expose their required sceneTypes', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  const requiredSceneTypes = new Map([
    ['government_office_hall', ['office_selfie', 'public_office_selfie']],
    ['administrative_reception', ['office_selfie', 'public_office_selfie']],
    ['service_counter_area', ['office_selfie', 'public_office_selfie']],
    ['public_waiting_area', ['office_selfie', 'public_office_selfie']],
    ['municipal_office', ['office_selfie', 'public_office_selfie', 'desk_work_selfie']],
    ['government_corridor', ['office_selfie', 'public_office_selfie', 'corridor_hallway_selfie']],
    ['open_plan_office', ['office_selfie', 'desk_work_selfie']],
    ['meeting_room_glass', ['office_selfie', 'desk_work_selfie']],
    ['executive_office', ['office_selfie', 'desk_work_selfie']],
    ['office_pantry', ['office_selfie', 'interaction_shot']],
    ['coworking_lounge', ['office_selfie', 'desk_work_selfie']],
    ['office_parking_outdoor', ['office_selfie', 'outdoor_selfie']],
    ['hotel_business_center', ['office_selfie', 'desk_work_selfie']]
  ]);

  for (const [value, sceneTypesForLocation] of requiredSceneTypes) {
    const location = LOCATION_CATALOG.find((item) => item.value === value);
    assert.ok(location, `missing LOCATION_CATALOG entry: ${value}`);
    for (const sceneType of sceneTypesForLocation) {
      assert.ok(location.sceneTypes.includes(sceneType), `${value} missing sceneType: ${sceneType}`);
    }
  }
});

test('sensor processing remains deterministic for identical image, settings and seed', () => {
  const source = sampleImage();
  const options = {
    iso: 1600,
    luma: XIAOMI_15_ULTRA_PRESET.lumaNoise,
    chroma: XIAOMI_15_ULTRA_PRESET.chromaNoise,
    seed: 42
  };
  const first = addSensorNoise(source, options);
  const second = addSensorNoise(source, options);

  assert.deepEqual([...first.data], [...second.data]);
  assert.deepEqual([...source.data], [...sampleImage().data], 'source image must not be mutated');
});

test('car studio is wired to prompt generation, realism validation and local photo processing', async () => {
  const [script, html] = await Promise.all([
    readFile(new URL('../car-selfie.js', import.meta.url), 'utf8'),
    readFile(new URL('../car-selfie.html', import.meta.url), 'utf8')
  ]);

  assert.match(script, /generateImagePrompt/);
  assert.match(script, /validateRealism/);
  assert.match(script, /processImageBlob/);
  assert.doesNotMatch(script, /Math\.random\s*\(/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.match(html, /<canvas\b[^>]*id=["']processedCanvas["']/i);
  assert.match(html, /<input\b[^>]*type=["']file["']/i);
  assert.match(html, /type=["']module["'][^>]*src=["']car-selfie\.js["']/i);
});
