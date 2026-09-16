import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compatibleOptions, compatibilitySnapshot, locationsForScene, recommendedDefaults, resolveCompatibleValue, resolveContextAwareConstraints } from '../core/scene-compatibility.js';
import { LOCATION_CATALOG, SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from '../core/scene-builder.js';
import { CAMERA_PROFILES, FRAMING_OPTIONS, SCENE_TYPES } from '../core/prompt-generator.js';
import { baseSceneTypeFor } from '../core/scene-type-expansion.js';

const catalogs = {
  location: LOCATION_CATALOG,
  clothing: CLOTHING_OPTIONS,
  pose: SELFIE_POSES,
  angle: SELFIE_ANGLES,
  lighting: LIGHTING_PROFILES,
  camera: CAMERA_PROFILES,
  framing: FRAMING_OPTIONS
};

const values = (items) => items.map((item) => item.value);

test('LOCATION_CATALOG is single source of truth', () => {
  assert.equal(LOCATION_CATALOG.length, 125);
  assert.equal(new Set(LOCATION_CATALOG.map((item) => item.value)).size, 125, 'location values must be unique');
  for (const loc of LOCATION_CATALOG) {
    assert.ok(Array.isArray(loc.sceneTypes), `${loc.value}: sceneTypes must be an array`);
    assert.ok(loc.sceneTypes.length > 0, `${loc.value}: missing sceneTypes`);
  }
});

test('LOCATION_CATALOG is now 125', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  assert.equal(LOCATION_CATALOG.length, 125);
});

test('there are exactly 20 military locations', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  const military = LOCATION_CATALOG.filter(l => l.value.startsWith('military_'));
  assert.equal(military.length, 20);
});

test('military_meal_selfie exposes at least 20 locations', async () => {
  const { locationsForScene } = await import('../core/scene-compatibility.js');
  const meal = locationsForScene('military_meal_selfie');
  assert.ok(meal.length >= 20, `Only ${meal.length} locations`);
});

test('every military location explicitly forbids emblems and weapons', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  const military = LOCATION_CATALOG.filter(l => l.value.startsWith('military_'));
  for (const loc of military) {
    assert.match(loc.prompt, /no emblems|without any emblems|no identifiable emblems/i,
      `${loc.value}: missing emblems prohibition`);
    assert.match(loc.prompt, /no visible weapons|without weapons|no weapons|no emblems[^.]*\bweapons\b/i,
      `${loc.value}: missing weapons prohibition`);
  }
});

test('military_meal_selfie does not leak civilian locations', async () => {
  const { locationsForScene } = await import('../core/scene-compatibility.js');
  const meal = locationsForScene('military_meal_selfie');
  const values = meal.map(l => l.value);
  assert.ok(!values.includes('saudi_office'));
  assert.ok(!values.includes('modern_saudi_majlis'));
  assert.ok(!values.includes('specialty_coffee'));
});

test('SAUDI_LOCATIONS is a derived alias of LOCATION_CATALOG', () => {
  assert.equal(SAUDI_LOCATIONS.length, LOCATION_CATALOG.length);
  assert.deepEqual(
    SAUDI_LOCATIONS.map((location) => location.value).sort(),
    LOCATION_CATALOG.map((location) => location.value).sort()
  );
  assert.ok(SAUDI_LOCATIONS.every((location) => !Object.hasOwn(location, 'sceneTypes')));
});

test('no legacy location arrays remain', async () => {
  const src = await readFile('core/scene-compatibility.js', 'utf8');
  for (const legacy of ['MAJLIS_LOCATIONS', 'CAR_LOCATIONS', 'OUTDOOR_LOCATIONS', 'WALKING_LOCATIONS', 'SEATED_LOCATIONS', 'MIRROR_LOCATIONS', 'CAFE_LOCATIONS', 'OFFICE_LOCATIONS']) {
    assert.ok(!src.includes(legacy), `${legacy} still present`);
  }
});

test('no keyword location arrays in scene-type-expansion', async () => {
  const src = await readFile('core/scene-type-expansion.js', 'utf8');
  assert.ok(!/location:\s*\[/.test(src), 'keyword location arrays still present');
});

test('variants inherit from baseType when they have no direct location mapping', () => {
  const variantLocations = locationsForScene('high_angle_selfie');
  const baseLocations = locationsForScene('front_selfie');
  assert.deepEqual(values(variantLocations), values(baseLocations));
});

test('specialized location mappings override broad base inheritance', () => {
  assert.deepEqual(values(locationsForScene('supermarket_selfie')), ['supermarket_aisle', 'convenience_store', 'grocery_store']);
  assert.deepEqual(values(locationsForScene('gym_wash_area_selfie')), ['gym_sink_mirror_area']);
});

test('no leakage between scene families', () => {
  const carValues = values(locationsForScene('inside_car_selfie'));
  assert.ok(!carValues.includes('government_office_hall'));
  assert.ok(!carValues.includes('supermarket_aisle'));
  assert.ok(!carValues.includes('saudi_office'));

  const officeValues = values(locationsForScene('office_selfie'));
  assert.ok(!officeValues.includes('desert_roadside'));
  assert.ok(!officeValues.includes('gulf_beach'));
  assert.ok(!officeValues.includes('supermarket_aisle'));
});

test('every location sceneType resolves to a valid base sceneType', () => {
  const validBaseTypes = new Set(SCENE_TYPES.map((scene) => scene.value));
  for (const loc of LOCATION_CATALOG) {
    for (const sceneType of loc.sceneTypes) {
      const base = baseSceneTypeFor(sceneType);
      assert.ok(validBaseTypes.has(base), `${loc.value}: invalid base sceneType "${sceneType}" -> "${base}"`);
    }
  }
});

test('inside-car selfie exposes only car-compatible pose, angle and camera choices', () => {
  const snapshot = compatibilitySnapshot('inside_car_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['driver_seat', 'passenger_seat']);
  assert.deepEqual(values(snapshot.angle), ['driver_eye_level', 'driver_slight_high', 'driver_low']);
  assert.equal(values(snapshot.camera).includes('smartphone_rear'), false);
  assert.equal(values(snapshot.lighting).includes('car_daylight'), true);
  assert.equal(values(snapshot.lighting).includes('night_majlis_warm'), false);
  assert.ok(values(snapshot.location).includes('villa_driveway'));
  assert.ok(values(snapshot.location).includes('covered_parking_shade'));
  assert.ok(!values(snapshot.location).includes('supermarket_aisle'));
});

test('majlis selfie only exposes explicitly mapped majlis locations and lighting', () => {
  const snapshot = compatibilitySnapshot('majlis_selfie', catalogs);
  assert.deepEqual(values(snapshot.location), ['modern_saudi_majlis', 'traditional_majlis']);
  assert.equal(values(snapshot.lighting).includes('night_majlis_warm'), true);
  assert.equal(values(snapshot.lighting).includes('night_gas_station'), false);
  assert.equal(values(snapshot.lighting).includes('night_phone_screen'), false);
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
  assert.ok(values(snapshot.location).includes('saudi_bedroom_livedin'));
  assert.ok(values(snapshot.location).includes('gym_sink_mirror_area'));
  assert.ok(!values(snapshot.location).includes('service_road'));
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

test('office selfie uses all explicit office locations and excludes unrelated locations', () => {
  const snapshot = compatibilitySnapshot('office_selfie', catalogs);
  const locationValues = values(snapshot.location);
  for (const expected of ['saudi_office', 'real_estate_office', 'home_office_room', 'coworking_space', 'office_break_room', 'office_corridor', 'meeting_room']) {
    assert.ok(locationValues.includes(expected), `${expected} should be office-compatible`);
  }
  assert.ok(!locationValues.includes('desert_roadside'));
  assert.ok(!locationValues.includes('supermarket_aisle'));
  assert.equal(values(snapshot.lighting).includes('night_office_led'), true);
  assert.equal(values(snapshot.lighting).includes('night_car_practicals'), false);
  assert.equal(values(snapshot.lighting).includes('night_phone_screen'), false);
});

test('supermarket scene only exposes supermarket-compatible locations', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
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

test('bedroom scene does not allow lively background activity', () => {
  const snapshot = compatibilitySnapshot('mirror_selfie', catalogs);
  assert.deepEqual(snapshot.backgroundActivityAllowed, ['quiet', 'normal']);

  const resolved = resolveContextAwareConstraints({
    sceneType: 'mirror_selfie',
    requestedSceneType: 'mirror_bedroom_selfie',
    location: 'inside a Saudi bedroom',
    backgroundActivity: 'lively',
    lighting: 'warm room lamp'
  });
  assert.equal(resolved.backgroundActivity, 'normal');
  assert.deepEqual(resolved.backgroundActivityAllowed, ['quiet', 'normal']);
  assert.match(resolved.warnings.join(' '), /النشاط تغيّر إلى normal/);
});

test('mosques and libraries are quiet-only while car interiors are quiet-only', () => {
  const mosque = resolveContextAwareConstraints({ sceneType: 'front_selfie', location: 'inside a Saudi mosque', backgroundActivity: 'lively' });
  const library = resolveContextAwareConstraints({ sceneType: 'front_selfie', location: 'inside a library reading room', backgroundActivity: 'normal' });
  const car = resolveContextAwareConstraints({ sceneType: 'inside_car_selfie', location: 'inside a stationary car', backgroundActivity: 'lively' });
  assert.equal(mosque.backgroundActivity, 'quiet');
  assert.equal(library.backgroundActivity, 'quiet');
  assert.equal(car.backgroundActivity, 'quiet');
});

test('phone-screen-only lighting is not allowed in well-lit indoor scene', () => {
  const resolved = resolveContextAwareConstraints({
    sceneType: 'mirror_selfie',
    requestedSceneType: 'mirror_bedroom_selfie',
    location: 'inside a Saudi bedroom with normal room lamps',
    backgroundActivity: 'quiet',
    lighting: 'phone-screen-only lighting'
  });
  assert.doesNotMatch(resolved.lighting, /phone-screen-only/i);
  assert.match(resolved.lighting, /warm practical room lamp|room ceiling light/i);
  assert.match(resolved.warnings.join(' '), /الإضاءة تغيّرت/);
});

test('phone-screen-only remains allowed in a naturally dark car and excludes other visible sources', () => {
  const resolved = resolveContextAwareConstraints({
    sceneType: 'inside_car_selfie',
    location: 'inside a stationary car at night',
    backgroundActivity: 'quiet',
    lighting: 'phone-screen-only lighting'
  });
  assert.match(resolved.lighting, /phone-screen-only/i);
  assert.match(resolved.lighting, /No other light sources visible in frame/i);
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
