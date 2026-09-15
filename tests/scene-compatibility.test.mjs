import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibleOptions, compatibilitySnapshot, recommendedDefaults, resolveCompatibleValue } from '../core/scene-compatibility.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from '../core/scene-builder.js';
import { CAMERA_PROFILES, FRAMING_OPTIONS } from '../core/prompt-generator.js';

const catalogs = {
  location: SAUDI_LOCATIONS,
  clothing: CLOTHING_OPTIONS,
  pose: SELFIE_POSES,
  angle: SELFIE_ANGLES,
  lighting: LIGHTING_PROFILES,
  camera: CAMERA_PROFILES,
  framing: FRAMING_OPTIONS
};

const values = (items) => items.map((item) => item.value);

test('inside-car selfie exposes only car-compatible pose, angle and camera choices', () => {
  const snapshot = compatibilitySnapshot('inside_car_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['driver_seat', 'passenger_seat']);
  assert.deepEqual(values(snapshot.angle), ['driver_eye_level', 'driver_slight_high', 'driver_low']);
  assert.equal(values(snapshot.camera).includes('smartphone_rear'), false);
  assert.equal(values(snapshot.lighting).includes('car_daylight'), true);
  assert.equal(values(snapshot.lighting).includes('night_majlis_warm'), false);
});

test('majlis selfie only exposes majlis-compatible locations and lighting', () => {
  const snapshot = compatibilitySnapshot('majlis_selfie', catalogs);
  assert.deepEqual(values(snapshot.location), ['modern_saudi_majlis', 'traditional_majlis', 'villa_living_room']);
  assert.equal(values(snapshot.lighting).includes('night_majlis_warm'), true);
  assert.equal(values(snapshot.lighting).includes('night_gas_station'), false);
  assert.equal(values(snapshot.pose).includes('driver_seat'), false);
});

test('walking selfie removes seated and vehicle-only choices', () => {
  const snapshot = compatibilitySnapshot('walking_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['walking_slow']);
  assert.equal(values(snapshot.angle).includes('driver_eye_level'), false);
  assert.equal(values(snapshot.location).includes('modern_saudi_majlis'), false);
  assert.equal(values(snapshot.location).includes('boulevard_walkway'), true);
});

test('mirror selfie receives mirror-specific pose and angle catalogs', () => {
  const snapshot = compatibilitySnapshot('mirror_selfie', catalogs);
  assert.equal(values(snapshot.pose).every((value) => value.startsWith('mirror_')), true);
  assert.equal(values(snapshot.angle).every((value) => value.startsWith('mirror_')), true);
  assert.equal(values(snapshot.angle).includes('driver_eye_level'), false);
});

test('third-person scenes never expose selfie camera geometry', () => {
  const portrait = compatibilitySnapshot('third_person_portrait', catalogs);
  const fullBody = compatibilitySnapshot('full_body_third_person', catalogs);
  assert.deepEqual(values(portrait.camera), ['smartphone_rear']);
  assert.equal(values(portrait.pose).every((value) => value.startsWith('third_')), true);
  assert.equal(values(portrait.angle).every((value) => value.startsWith('third_')), true);
  assert.deepEqual(values(fullBody.framing), ['full_body']);
  assert.equal(values(fullBody.angle).includes('driver_eye_level'), false);
});

test('office selfie excludes unrelated locations and car lighting', () => {
  const snapshot = compatibilitySnapshot('office_selfie', catalogs);
  assert.deepEqual(values(snapshot.location), ['saudi_office', 'real_estate_office']);
  assert.equal(values(snapshot.lighting).includes('night_office_led'), true);
  assert.equal(values(snapshot.lighting).includes('night_car_practicals'), false);
});

test('supermarket scene only exposes supermarket-compatible locations', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  assert.ok(snapshot.location.length >= 3);
  assert.ok(snapshot.location.every((location) => /supermarket|grocery|convenience|store/i.test(location.value)));
  assert.ok(!snapshot.location.some((location) => /boulevard|street|corniche/i.test(location.value)));
  assert.deepEqual(values(snapshot.location), ['supermarket_aisle', 'convenience_store', 'grocery_store']);
});

test('supermarket scene only exposes supermarket-compatible lighting', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  assert.ok(snapshot.lighting.length >= 3);
  assert.ok(snapshot.lighting.every((lighting) => /supermarket|retail|fluorescent|store/i.test(lighting.value)));
  assert.ok(!snapshot.lighting.some((lighting) => /office|majlis|cafe/i.test(lighting.value)));
  assert.deepEqual(values(snapshot.lighting), ['supermarket_fluorescent', 'retail_ceiling_led', 'mixed_retail']);
});

test('supermarket scene exposes only compatible poses and framing', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['standing_relaxed', 'walking_slow', 'holding_basket']);
  assert.deepEqual(values(snapshot.framing), ['chest_up', 'waist_up', 'three_quarter']);
  assert.equal(values(snapshot.pose).includes('lean_counter'), false);
  assert.equal(values(snapshot.framing).includes('full_body'), false);
});

test('changing sceneType resets incompatible selections', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  const defaults = recommendedDefaults('supermarket_selfie');

  assert.equal(snapshot.location.some((item) => item.value === 'boulevard_walkway'), false, 'boulevard should not be compatible with supermarket');
  assert.equal(resolveCompatibleValue('boulevard_walkway', snapshot.location, defaults.location), 'supermarket_aisle');
  assert.equal(resolveCompatibleValue('night_office_led', snapshot.lighting, defaults.lighting), 'supermarket_fluorescent');
  assert.equal(resolveCompatibleValue('lean_counter', snapshot.pose, defaults.pose), 'walking_slow');
  assert.equal(resolveCompatibleValue('driver_eye_level', snapshot.angle, defaults.angle), 'eye_centered');
  assert.equal(resolveCompatibleValue('full_body', snapshot.framing, defaults.framing), 'chest_up');
});

test('clothing remains available when it is physically compatible with the scene', () => {
  const options = compatibleOptions('inside_car_selfie', 'clothing', CLOTHING_OPTIONS);
  assert.equal(options.length, CLOTHING_OPTIONS.length);
});

test('recommended defaults switch camera and framing by capture type', () => {
  assert.deepEqual(recommendedDefaults('inside_car_selfie'), { camera: 'xiaomi15_front', framing: 'chest_up' });
  assert.deepEqual(recommendedDefaults('mirror_selfie'), { camera: 'smartphone_rear', framing: 'waist_up' });
  assert.deepEqual(recommendedDefaults('full_body_third_person'), { camera: 'smartphone_rear', framing: 'full_body' });
  assert.deepEqual(recommendedDefaults('supermarket_selfie'), {
    location: 'supermarket_aisle',
    pose: 'walking_slow',
    angle: 'eye_centered',
    lighting: 'supermarket_fluorescent',
    camera: 'xiaomi15_front',
    framing: 'chest_up'
  });
});
