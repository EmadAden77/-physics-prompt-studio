import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LOCATION_CATALOG } from '../core/scene-builder.js';
import { locationsForScene } from '../core/scene-compatibility.js';
import {
  EXTRA_CLOTHING_OPTIONS,
  enrichClothingPrompt
} from '../core/expanded-catalogs.js';

test('unified Saudi location catalog is broad and unique', () => {
  assert.equal(LOCATION_CATALOG.length, 125);
  const values = LOCATION_CATALOG.map((item) => item.value);
  assert.equal(new Set(values).size, values.length, 'location values must be unique');
});

test('expanded clothing catalog is broad and unique', () => {
  assert.ok(EXTRA_CLOTHING_OPTIONS.length >= 30, `expected >=30 extra clothing options, got ${EXTRA_CLOTHING_OPTIONS.length}`);
  const values = EXTRA_CLOTHING_OPTIONS.map((item) => item.value);
  assert.equal(new Set(values).size, values.length, 'clothing values must be unique');
});

test('every unified location carries strong environmental realism and scene metadata', () => {
  for (const item of LOCATION_CATALOG) {
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

test('unified locations are scene-aware', () => {
  const car = locationsForScene('inside_car_selfie');
  assert.ok(car.some((item) => item.value === 'covered_parking_shade'));
  assert.ok(car.some((item) => item.value === 'office_basement_parking'));
  assert.ok(!car.some((item) => item.value === 'clinic_waiting_room'));

  const mirror = locationsForScene('mirror_selfie');
  assert.ok(mirror.some((item) => item.value === 'saudi_bedroom_livedin'));
  assert.ok(mirror.some((item) => item.value === 'gym_sink_mirror_area'));
  assert.ok(!mirror.some((item) => item.value === 'service_road'));
});

test('clothing realism enricher remains idempotent', () => {
  const baseClothing = 'a plain black cotton T-shirt';
  const enrichedClothing = enrichClothingPrompt(baseClothing);
  assert.match(enrichedClothing, /textile-specific weight, thickness, weave/i);
  assert.equal(enrichClothingPrompt(enrichedClothing), enrichedClothing);
});

test('browser app uses unified location catalog and keeps clothing enrichment', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /LOCATION_CATALOG/);
  assert.match(app, /locationsForScene\(sceneType\)/);
  assert.doesNotMatch(app, /extraLocationsForScene/);
  assert.doesNotMatch(app, /enrichLocationPrompt/);
  assert.match(app, /CLOTHING_PROMPT_BY_VALUE/);
  assert.match(app, /enrichClothingPrompt\(selectedClothingPrompt\(\)\)/);
});
