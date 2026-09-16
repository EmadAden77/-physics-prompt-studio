import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCATION_CATALOG,
  SAUDI_LOCATIONS,
  CLOTHING_OPTIONS,
  FORMAL_LOOKS,
  HAIR_STYLES,
  SELFIE_POSES,
  SELFIE_ANGLES,
  LIGHTING_PROFILES
} from '../core/scene-builder.js';
import { EXTRA_CLOTHING_OPTIONS, HOME_CLOTHING, HOME_SELFIE_POSES } from '../core/expanded-catalogs.js';
import { SCENE_TYPES, CAMERA_PROFILES, FRAMING_OPTIONS } from '../core/prompt-generator.js';
import {
  MIRROR_POSES,
  MIRROR_ANGLES,
  THIRD_PERSON_POSES,
  THIRD_PERSON_ANGLES,
  hasCompatibilityProfile,
  validateCompatibilityCatalogs
} from '../core/scene-compatibility.js';
import { EXTRA_SCENE_TYPES, baseSceneTypeFor } from '../core/scene-type-expansion.js';

function allFiles(dir = '.') {
  const ignored = new Set(['.git', 'node_modules']);
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...allFiles(full));
    else output.push(full.replace(/^\.\//, ''));
  }
  return output.sort();
}

function uniqueValues(name, items) {
  const values = items.map((item) => item.value);
  assert.equal(new Set(values).size, values.length, `${name} contains duplicate values`);
  for (const item of items) {
    assert.ok(item.value, `${name} contains an empty value`);
    assert.ok(item.label, `${name}.${item.value} has no label`);
    assert.ok(item.prompt, `${name}.${item.value} has no prompt`);
  }
}

function haystack(item) {
  return `${item.value || ''} ${item.label || ''} ${item.group || ''} ${item.prompt || ''}`.toLowerCase();
}

const combined = {
  location: LOCATION_CATALOG,
  clothing: [...CLOTHING_OPTIONS, ...EXTRA_CLOTHING_OPTIONS, ...HOME_CLOTHING, ...FORMAL_LOOKS],
  pose: [...SELFIE_POSES, ...HOME_SELFIE_POSES, ...MIRROR_POSES, ...THIRD_PERSON_POSES],
  angle: [...SELFIE_ANGLES, ...MIRROR_ANGLES, ...THIRD_PERSON_ANGLES],
  lighting: LIGHTING_PROFILES,
  camera: CAMERA_PROFILES,
  framing: FRAMING_OPTIONS
};

const HOME_SCENE_VALUES = [
  'reclining_bed_selfie','lying_bed_selfie','morning_bed_selfie','night_bed_selfie','sofa_relaxed_selfie',
  'sofa_lying_selfie','floor_seated_selfie','floor_leaning_wall_selfie','reading_at_home_selfie','tea_at_home_selfie',
  'friday_morning_selfie','home_evening_selfie','window_light_home_selfie','balcony_morning_selfie','home_couch_blanket_selfie'
];

const HOME_POSE_VALUES = [
  'reclining_bed','sitting_bed_cross','seated_bed_edge','pillow_propped','lying_back','lying_side','lying_stomach',
  'sofa_lean_back','sofa_corner','sofa_one_knee','sofa_stretched','sofa_lying_side','floor_cross_legs','floor_back_wall',
  'floor_one_knee_up','squatting'
];

test('audit tree and exact line counts are reproducible', () => {
  const files = allFiles();
  const counts = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, 'utf8').split(/\r?\n/).length]));
  assert.ok(files.length >= 32);
  assert.equal(files.includes('core/prompt-generator.js'), true);
  assert.equal(files.includes('core/photo-post-processing.js'), true);
  console.log(`AUDIT_TREE ${JSON.stringify(files)}`);
  console.log(`AUDIT_LINE_COUNTS ${JSON.stringify(counts)}`);
});

test('every catalog has unique usable values', () => {
  for (const [name, items] of Object.entries({
    LOCATION_CATALOG,
    SAUDI_LOCATIONS,
    CLOTHING_OPTIONS,
    EXTRA_CLOTHING_OPTIONS,
    HOME_CLOTHING,
    FORMAL_LOOKS,
    HAIR_STYLES,
    SELFIE_POSES,
    HOME_SELFIE_POSES,
    SELFIE_ANGLES,
    LIGHTING_PROFILES,
    CAMERA_PROFILES,
    FRAMING_OPTIONS,
    MIRROR_POSES,
    MIRROR_ANGLES,
    THIRD_PERSON_POSES,
    THIRD_PERSON_ANGLES
  })) uniqueValues(name, items);
});

test('compatibility profiles reference only real values and leave no base catalog item orphaned', () => {
  const result = validateCompatibilityCatalogs({
    location: LOCATION_CATALOG,
    clothing: [...CLOTHING_OPTIONS, ...HOME_CLOTHING, ...FORMAL_LOOKS],
    pose: [...SELFIE_POSES, ...HOME_SELFIE_POSES],
    angle: SELFIE_ANGLES,
    lighting: LIGHTING_PROFILES,
    camera: CAMERA_PROFILES,
    framing: FRAMING_OPTIONS
  });
  assert.equal(result.valid, true, result.errors.join('\n'));
  for (const [kind, values] of Object.entries(result.unused)) {
    assert.deepEqual(values, [], `${kind} has unused catalog values: ${values.join(', ')}`);
  }
});

test('every expanded scene maps to a real base type and every declared filter matches real options', () => {
  const baseTypes = new Set(SCENE_TYPES.map((item) => item.value));
  for (const scene of EXTRA_SCENE_TYPES) {
    assert.ok(baseTypes.has(baseSceneTypeFor(scene.value)), `${scene.value} has missing base type ${scene.baseType}`);
    for (const kind of ['clothing', 'pose', 'angle', 'lighting']) {
      const words = scene[kind];
      if (!Array.isArray(words) || !words.length) continue;
      const matches = combined[kind].filter((item) => words.some((word) => haystack(item).includes(String(word).toLowerCase())));
      assert.ok(matches.length > 0, `${scene.value}.${kind} filter matches no catalog option: ${words.join(', ')}`);
    }
  }
});

test('home relaxation expansion has exactly 15 unique scenes', () => {
  const relaxation = EXTRA_SCENE_TYPES.filter((scene) => scene.group === 'سيلفي استرخاء');
  assert.equal(relaxation.length, 15);
  assert.deepEqual(relaxation.map((scene) => scene.value).sort(), [...HOME_SCENE_VALUES].sort());
  assert.equal(new Set(relaxation.map((scene) => scene.value)).size, 15);
  for (const sceneType of HOME_SCENE_VALUES) assert.equal(hasCompatibilityProfile(sceneType), true, `${sceneType} needs a direct compatibility profile`);
});

test('home catalogs add 15 scoped clothing options and 16 new poses without changing base pose count', () => {
  assert.equal(SELFIE_POSES.length, 16, 'base SELFIE_POSES contract must stay backward compatible');
  assert.equal(HOME_CLOTHING.length, 15);
  assert.equal(HOME_SELFIE_POSES.length, 16);
  assert.deepEqual(HOME_SELFIE_POSES.map((item) => item.value).sort(), [...HOME_POSE_VALUES].sort());
  const homeScenes = new Set(HOME_SCENE_VALUES);
  for (const item of HOME_CLOTHING) {
    assert.ok(Array.isArray(item.sceneTypes) && item.sceneTypes.length > 0, `${item.value} must declare sceneTypes`);
    for (const sceneType of item.sceneTypes) assert.ok(homeScenes.has(sceneType), `${item.value} references non-home scene ${sceneType}`);
  }
});

test('home clothing and poses reach app scene options without leaking to ordinary office scenes', async () => {
  const { randomizationOptionsForScene } = await import('../app.js');
  const morning = randomizationOptionsForScene('morning_bed_selfie');
  const morningClothing = new Set(morning.clothing.map((item) => item.value));
  const morningPoses = new Set(morning.pose.map((item) => item.value));
  assert.ok(morningClothing.has('pj-cotton-navy'));
  assert.ok(morningClothing.has('bathrobe-cream'));
  assert.ok(!morningClothing.has('tshirt-jeans-home'));
  assert.deepEqual([...morningPoses].sort(), ['pillow_propped','reclining_bed','sitting_bed_cross'].sort());

  const floor = randomizationOptionsForScene('floor_seated_selfie');
  assert.ok(floor.pose.some((item) => item.value === 'squatting'));
  const office = randomizationOptionsForScene('office_selfie');
  const homeValues = new Set(HOME_CLOTHING.map((item) => item.value));
  assert.equal(office.clothing.some((item) => homeValues.has(item.value)), false);
});

test('main UI exposes and app reads every scene-builder control', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const app = fs.readFileSync('app.js', 'utf8');
  const ids = [
    'sceneType','sceneLocation','sceneClothing','hairStyle','scenePose','sceneAngle','sceneLighting','cameraProfile',
    'aspectRatio','expression','backgroundActivity','realismLevel','framing','sceneDescription','cameraDistance',
    'lightingNotes','customConstraints','identityReference','seedInput'
  ];
  for (const id of ids) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `HTML missing #${id}`);
    assert.ok(app.includes(`$('${id}')`), `app.js does not read #${id}`);
  }
  assert.match(app, /LOCATION_CATALOG/);
  assert.match(app, /HAIR_STYLES/);
  assert.match(app, /FORMAL_LOOKS/);
  assert.match(app, /EXTRA_CLOTHING_OPTIONS/);
  assert.match(app, /HOME_CLOTHING/);
  assert.match(app, /HOME_SELFIE_POSES/);
});

test('unified location catalog remains complete and the legacy alias stays derived', () => {
  assert.equal(LOCATION_CATALOG.length, 125);
  assert.equal(SAUDI_LOCATIONS.length, LOCATION_CATALOG.length);
  for (const location of LOCATION_CATALOG) {
    assert.ok(Array.isArray(location.sceneTypes));
    assert.ok(location.sceneTypes.length > 0, `${location.value} has no sceneTypes`);
  }
  assert.deepEqual(
    SAUDI_LOCATIONS.map((item) => item.value).sort(),
    LOCATION_CATALOG.map((item) => item.value).sort()
  );
});

test('production JavaScript contains no nondeterministic clock or random APIs', () => {
  const files = allFiles().filter((file) => file.endsWith('.js') && !file.startsWith('tests/'));
  const patterns = [
    [/Math\.random\s*\(/, 'Math.random()'],
    [/Date\.now\s*\(/, 'Date.now()'],
    [/\bnew\s+Date\s*\(/, 'new Date()'],
    [/performance\.now\s*\(/, 'performance.now()']
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const [pattern, label] of patterns) assert.doesNotMatch(source, pattern, `${file} uses ${label}`);
  }
});
