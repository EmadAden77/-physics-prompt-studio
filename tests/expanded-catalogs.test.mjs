import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  EXTRA_SAUDI_LOCATIONS,
  EXTRA_CLOTHING_OPTIONS,
  extraLocationsForScene,
  enrichLocationPrompt,
  enrichClothingPrompt
} from '../core/expanded-catalogs.js';

test('expanded Saudi location catalog is broad and unique', () => {
  assert.ok(EXTRA_SAUDI_LOCATIONS.length >= 40, `expected >=40 extra locations, got ${EXTRA_SAUDI_LOCATIONS.length}`);
  const values = EXTRA_SAUDI_LOCATIONS.map((item) => item.value);
  assert.equal(new Set(values).size, values.length, 'location values must be unique');
});

test('expanded clothing catalog is broad and unique', () => {
  assert.ok(EXTRA_CLOTHING_OPTIONS.length >= 30, `expected >=30 extra clothing options, got ${EXTRA_CLOTHING_OPTIONS.length}`);
  const values = EXTRA_CLOTHING_OPTIONS.map((item) => item.value);
  assert.equal(new Set(values).size, values.length, 'clothing values must be unique');
});

test('every added location carries strong environmental realism and no-landmark language', () => {
  for (const item of EXTRA_SAUDI_LOCATIONS) {
    assert.match(item.prompt, /ordinary, non-iconic, and non-identifiable/i, item.value);
    assert.match(item.prompt, /surface wear, small maintenance imperfections/i, item.value);
    assert.match(item.prompt, /material-specific reflections/i, item.value);
    assert.ok(Array.isArray(item.sceneTypes) && item.sceneTypes.length > 0, `${item.value} needs scene compatibility metadata`);
  }
});

test('every added clothing option carries material-specific fabric physics', () => {
  for (const item of EXTRA_CLOTHING_OPTIONS) {
    assert.match(item.prompt, /textile-specific weight, thickness, weave/i, item.value);
    assert.match(item.prompt, /gravity-driven drape/i, item.value);
    assert.match(item.prompt, /no plastic-like smoothness/i, item.value);
  }
});

test('expanded locations are scene-aware', () => {
  const car = extraLocationsForScene('inside_car_selfie');
  assert.ok(car.some((item) => item.value === 'covered_parking_shade'));
  assert.ok(car.some((item) => item.value === 'office_basement_parking'));
  assert.ok(!car.some((item) => item.value === 'clinic_waiting_room'));

  const mirror = extraLocationsForScene('mirror_selfie');
  assert.ok(mirror.some((item) => item.value === 'saudi_bedroom_livedin'));
  assert.ok(mirror.some((item) => item.value === 'gym_sink_mirror_area'));
  assert.ok(!mirror.some((item) => item.value === 'service_road'));
});

test('realism enrichers improve old catalog prompts and are idempotent', () => {
  const baseLocation = 'inside an ordinary Saudi cafe';
  const enrichedLocation = enrichLocationPrompt(baseLocation);
  assert.match(enrichedLocation, /surface wear, small maintenance imperfections/i);
  assert.equal(enrichLocationPrompt(enrichedLocation), enrichedLocation);

  const baseClothing = 'a plain black cotton T-shirt';
  const enrichedClothing = enrichClothingPrompt(baseClothing);
  assert.match(enrichedClothing, /textile-specific weight, thickness, weave/i);
  assert.equal(enrichClothingPrompt(enrichedClothing), enrichedClothing);
});

test('browser app wires expanded catalogs into generation and optimizer scene context', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /EXTRA_CLOTHING_OPTIONS/);
  assert.match(app, /extraLocationsForScene\(baseSceneType\)/);
  assert.match(app, /enrichLocationPrompt\(selectedPrompt\(controls\.location\)\)/);
  assert.match(app, /enrichClothingPrompt\(selectedPrompt\(controls\.clothing\)\)/);
});
