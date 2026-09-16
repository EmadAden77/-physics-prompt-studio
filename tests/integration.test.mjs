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

  assert.equal(SELFIE_POSES.length, 32, 'SELFIE_POSES count changed');
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

const { HOME_CLOTHING, LOCATION_CATALOG } = await import('../core/scene-builder.js');
const { HOME_SCENE_TYPES, EXTRA_SCENE_TYPES, sceneMeta } = await import('../core/scene-type-expansion.js');
const { homeClothingForScene, compatibleOptions, locationsForScene } = await import('../core/scene-compatibility.js');
const { randomizationOptionsForScene, buildSeededSceneState, resolveHomeSceneInput } = await import('../app.js');

const homePoseValues = ['reclining_bed','sitting_bed_cross','seated_bed_edge','pillow_propped',
  'lying_back','lying_side','lying_stomach','sofa_lean_back','sofa_corner','sofa_one_knee',
  'sofa_stretched','sofa_lying_side','floor_cross_legs','floor_back_wall','floor_one_knee_up','squatting'];

test('home expansion preserves original scenes and exposes 15 unique scenes, 15 outfits and 16 linked poses', () => {
  assert.equal(HOME_SCENE_TYPES.length, 15);
  assert.equal(HOME_CLOTHING.length, 15);
  assert.equal(new Set(EXTRA_SCENE_TYPES.map((item) => item.value)).size, EXTRA_SCENE_TYPES.length);
  for (const value of ['reclining_bed_selfie','lying_bed_selfie','sofa_relaxed_selfie','floor_seated_selfie']) {
    assert.ok(HOME_SCENE_TYPES.includes(value));
  }
  const homePoses = SELFIE_POSES.filter((item) => item.sceneTypes);
  assert.deepEqual(homePoses.map((item) => item.value), homePoseValues);
  for (const item of [...HOME_CLOTHING, ...homePoses]) {
    assert.ok(item.sceneTypes.length > 0, `${item.value} is unreachable`);
    for (const scene of item.sceneTypes) assert.ok(HOME_SCENE_TYPES.includes(scene));
  }
  const clothes = [...CLOTHING_OPTIONS, ...FORMAL_LOOKS, ...FORMAL_SUITS, ...HOME_CLOTHING];
  assert.equal(new Set(clothes.map((item) => item.value)).size, clothes.length);
});

test('home UI options have real locations and exact pose, clothing and light compatibility', () => {
  for (const scene of HOME_SCENE_TYPES) {
    const options = randomizationOptionsForScene(scene);
    for (const field of ['location','pose','angle','lighting','camera','framing','clothing']) {
      assert.ok(options[field].length > 0, `${scene}.${field} is empty`);
    }
    assert.deepEqual(options.clothing, homeClothingForScene(scene));
    for (const pose of options.pose) assert.ok(sceneMeta(scene).pose.includes(pose.value));
    for (const location of options.location) assert.ok(LOCATION_CATALOG.includes(location));
    assert.deepEqual(options.backgroundActivity.map((item) => item.value), ['quiet','normal']);
  }
  for (const scene of ['reclining_bed_selfie','lying_bed_selfie','morning_bed_selfie','night_bed_selfie']) {
    assert.deepEqual(locationsForScene(scene).map((item) => item.value), ['saudi_bedroom_livedin']);
  }
  assert.deepEqual(randomizationOptionsForScene('night_bed_selfie').lighting.map((item) => item.value), ['night_home_warm','night_phone_screen']);
  assert.deepEqual(randomizationOptionsForScene('morning_bed_selfie').lighting.map((item) => item.value), ['day_window']);
  assert.deepEqual(randomizationOptionsForScene('sofa_lying_selfie').pose.map((item) => item.value), ['sofa_lying_side']);
  for (const value of ['desert_campsite_simple','wadi_picnic_edge']) {
    assert.ok(locationsForScene('floor_seated_selfie').some((item) => item.value === value));
  }
});

test('home-only poses and clothes do not leak into car, office, walking or third-person choices', () => {
  for (const scene of ['inside_car_selfie','office_selfie','walking_selfie','third_person_portrait']) {
    const options = randomizationOptionsForScene(scene);
    assert.ok(options.pose.every((item) => !homePoseValues.includes(item.value)));
    assert.ok(options.clothing.every((item) => !HOME_CLOTHING.includes(item)));
    assert.deepEqual(homeClothingForScene(scene), []);
  }
  assert.deepEqual(compatibleOptions('inside_car_selfie', 'pose', SELFIE_POSES).map((item) => item.value), ['driver_seat','passenger_seat']);
});

test('home automatic fields reach the generated prompt and explicit fields remain unchanged', () => {
  for (const sceneType of HOME_SCENE_TYPES) {
    const input = resolveHomeSceneInput({ sceneType });
    const result = generateImagePrompt(input);
    assert.ok(result.validation.valid, result.validation.errors.join('\n'));
    assert.ok(result.realism_validation.valid);
    for (const field of ['location','clothing','pose','angle','lighting']) {
      assert.ok(input[field], `${sceneType}.${field} was left automatic`);
      assert.ok(result.prompt.includes(input[field]), `${sceneType}.${field} did not reach output`);
    }
    assert.equal(generateImagePrompt(input).prompt, result.prompt);
  }
  const explicit = {
    sceneType: 'lying_bed_selfie', location: 'my own bedroom', clothing: 'my cotton shirt',
    pose: 'lying on the right side', angle: 'phone in the left hand', lighting: 'a bedside lamp'
  };
  assert.deepEqual(resolveHomeSceneInput(explicit), explicit);
  const other = { sceneType: 'inside_car_selfie' };
  assert.equal(resolveHomeSceneInput(other), other);
});

test('seeded home choices remain deterministic and never pair outdoor floor seating with room lighting', () => {
  for (const scene of HOME_SCENE_TYPES) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const state = buildSeededSceneState(seed, [scene]);
      assert.deepEqual(buildSeededSceneState(seed, [scene]), state);
      const options = randomizationOptionsForScene(scene, state.location);
      for (const field of ['location','clothing','pose','lighting']) {
        assert.ok(options[field].some((item) => item.value === state[field]), `${scene}.${field} invalid`);
      }
      if (scene === 'floor_seated_selfie') {
        const outdoors = ['desert_campsite_simple','wadi_picnic_edge'].includes(state.location);
        assert.equal(state.lighting === 'day_open_shade', outdoors);
      }
    }
  }
});


test('night bed screen lighting survives output without inventing a room lamp', () => {
  const lighting = LIGHTING_PROFILES.find((item) => item.value === 'night_phone_screen').prompt;
  const result = generateImagePrompt(resolveHomeSceneInput({ sceneType: 'night_bed_selfie', lighting }));
  assert.ok(result.config.lighting.includes(lighting));
  assert.ok(!result.config.context_warnings.some((warning) => warning.includes('phone-screen-only')));
  assert.ok(!result.config.description.includes('bedside lamp'));
});
