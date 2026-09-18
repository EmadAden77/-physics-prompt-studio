import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CLOTHING_CATALOG, LOCATION_CATALOG } from '../core/scene-builder.js';
import { locationsForScene } from '../core/scene-compatibility.js';
import * as expandedCatalogs from '../core/expanded-catalogs.js';

const { enrichClothingPrompt } = expandedCatalogs;

test('unified Saudi location catalog is broad and unique', () => {
  assert.equal(LOCATION_CATALOG.length, 125);
  const values = LOCATION_CATALOG.map((item) => item.value);
  assert.equal(new Set(values).size, values.length, 'location values must be unique');
});

test('EXTRA_CLOTHING_OPTIONS is merged and no longer exported separately', () => {
  assert.equal(expandedCatalogs.EXTRA_CLOTHING_OPTIONS, undefined);
});

test('every unified location carries strong environmental realism and scene metadata', () => {
  for (const item of LOCATION_CATALOG) {
    assert.match(item.prompt, /ordinary, non-iconic, and non-identifiable/i, item.value);
    assert.match(item.prompt, /surface wear, small maintenance imperfections/i, item.value);
    assert.match(item.prompt, /material-specific reflections/i, item.value);
    assert.ok(Array.isArray(item.sceneTypes) && item.sceneTypes.length > 0, `${item.value} needs scene compatibility metadata`);
  }
});

test('migrated clothing options carry material-specific fabric physics', () => {
  const overrideValues = new Set([
    'bisht_thobe',
    'suit-navy-lightblue',
    'suit-charcoal-white',
    'look-02'
  ]);
  const migrated = CLOTHING_CATALOG.filter(
    (item) =>
      /textile-specific weight, thickness, weave/i.test(item.prompt) &&
      !overrideValues.has(item.value)
  );
  for (const item of migrated) {
    assert.match(item.prompt, /textile-specific weight, thickness, weave/i, item.value);
    assert.match(item.prompt, /gravity-driven drape/i, item.value);
    assert.match(item.prompt, /no plastic-like smoothness/i, item.value);
  }
  assert.ok(migrated.length >= 30, `Expected at least 30 migrated items with fabric suffix, got ${migrated.length}`);
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
