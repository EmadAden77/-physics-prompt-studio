import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EXTRA_SCENE_TYPES, baseSceneTypeFor, narrowOptions, sceneMeta } from '../core/scene-type-expansion.js';
import { compatibilitySnapshot } from '../core/scene-compatibility.js';
import { buildAutomaticSceneDescription } from '../core/automatic-scene-description.js';
import { SAUDI_LOCATIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from '../core/scene-builder.js';

test('expanded scene catalog is broad and unique', () => {
  assert.ok(EXTRA_SCENE_TYPES.length >= 75);
  assert.equal(new Set(EXTRA_SCENE_TYPES.map((item) => item.value)).size, EXTRA_SCENE_TYPES.length);
});

test('specialized scenes route to the correct base capture families', () => {
  assert.equal(baseSceneTypeFor('inside_car_driver_selfie'), 'inside_car_selfie');
  assert.equal(baseSceneTypeFor('mirror_elevator_selfie'), 'mirror_selfie');
  assert.equal(baseSceneTypeFor('third_person_walking_candid'), 'candid_third_person');
  assert.equal(baseSceneTypeFor('harsh_noon_outdoor_selfie'), 'outdoor_selfie');
  assert.equal(baseSceneTypeFor('three_people_group_selfie'), 'front_selfie');
  assert.equal(baseSceneTypeFor('lying_bed_selfie'), 'front_selfie');
  assert.equal(baseSceneTypeFor('third_person_full_body_walking'), 'full_body_third_person');
  assert.equal(baseSceneTypeFor('supermarket_selfie'), 'front_selfie');
});

test('specialized option narrowing prefers context-matched choices', () => {
  const lighting = [
    { value:'day_window', label:'window', prompt:'window daylight' },
    { value:'night_phone_screen', label:'phone', prompt:'phone screen light' },
    { value:'night_parking_led', label:'parking', prompt:'parking led' }
  ];
  const filtered = narrowOptions('phone_screen_only_selfie', 'lighting', lighting);
  assert.deepEqual(filtered.map((item) => item.value), ['night_phone_screen']);
});

test('supermarket metadata narrows its compatibility profile to real supermarket catalogs', () => {
  const meta = sceneMeta('supermarket_selfie');
  assert.ok(meta.location.includes('convenience'));
  assert.ok(meta.lighting.includes('retail'));
  assert.ok(meta.pose.includes('holding'));

  const profile = compatibilitySnapshot('supermarket_selfie', {
    location: SAUDI_LOCATIONS,
    pose: SELFIE_POSES,
    angle: SELFIE_ANGLES,
    lighting: LIGHTING_PROFILES
  });

  assert.deepEqual(
    narrowOptions('supermarket_selfie', 'location', profile.location).map((item) => item.value),
    ['supermarket_aisle', 'convenience_store', 'grocery_store']
  );
  assert.deepEqual(
    narrowOptions('supermarket_selfie', 'lighting', profile.lighting).map((item) => item.value),
    ['supermarket_fluorescent', 'retail_ceiling_led', 'mixed_retail']
  );
  assert.deepEqual(
    narrowOptions('supermarket_selfie', 'pose', profile.pose).map((item) => item.value),
    ['standing_relaxed', 'walking_slow', 'holding_basket']
  );
});

test('automatic description combines action context and physical coherence', () => {
  const text = buildAutomaticSceneDescription({
    smartSceneType:'inside_car_driver_selfie',
    location:'inside an ordinary Saudi parking area without landmarks',
    clothing:'a navy Saudi thobe with realistic folds',
    pose:'naturally seated in the driver seat',
    angle:'driver-held front camera at eye level',
    lighting:'parking LED spill through real glazing'
  });
  assert.match(text, /AUTO SCENE SYNTHESIS/i);
  assert.match(text, /driver-seat selfie/i);
  assert.match(text, /seat\/body contact/i);
  assert.match(text, /navy Saudi thobe/i);
  assert.match(text, /Anti-staging/i);
});

test('page loads the expansion layer after the main app', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const appIndex = html.indexOf('src="app.js"');
  const expansionIndex = html.indexOf('src="scene-expansion-ui.js"');
  assert.ok(appIndex >= 0);
  assert.ok(expansionIndex > appIndex);
});
