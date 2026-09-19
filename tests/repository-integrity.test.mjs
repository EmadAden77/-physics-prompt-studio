import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCATION_CATALOG,
  SAUDI_LOCATIONS,
  CLOTHING_CATALOG,
  HAIR_STYLES,
  SELFIE_POSES,
  SELFIE_ANGLES,
  LIGHTING_PROFILES
} from '../core/scene-builder.js';
import { SCENE_TYPES, CAMERA_PROFILES, FRAMING_OPTIONS } from '../core/prompt-generator.js';
import {
  MIRROR_POSES,
  MIRROR_ANGLES,
  THIRD_PERSON_POSES,
  THIRD_PERSON_ANGLES,
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

function cryptoRandomUsageErrors(file, source) {
  const matches = [...source.matchAll(/(?:globalThis\.)?crypto\.getRandomValues\s*\(/g)];
  if (file !== 'app.js') {
    return matches.map(() => `${file} uses crypto.getRandomValues() outside the approved newSeed() exception`);
  }

  const errors = [];
  if (matches.length !== 1) {
    errors.push(`app.js must contain exactly one crypto.getRandomValues() call inside newSeed(); found ${matches.length}`);
  }

  const newSeedStart = source.indexOf('export function newSeed');
  if (newSeedStart < 0) {
    errors.push('app.js is missing export function newSeed()');
    return errors;
  }

  const nextExport = source.indexOf('\nexport function ', newSeedStart + 1);
  const newSeedEnd = nextExport < 0 ? source.length : nextExport;
  for (const match of matches) {
    if (match.index < newSeedStart || match.index >= newSeedEnd) {
      errors.push('app.js uses crypto.getRandomValues() outside newSeed()');
    }
  }
  return errors;
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
  clothing: CLOTHING_CATALOG,
  pose: [...SELFIE_POSES, ...MIRROR_POSES, ...THIRD_PERSON_POSES],
  angle: [...SELFIE_ANGLES, ...MIRROR_ANGLES, ...THIRD_PERSON_ANGLES],
  lighting: LIGHTING_PROFILES,
  camera: CAMERA_PROFILES,
  framing: FRAMING_OPTIONS
};

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
    CLOTHING_CATALOG,
    HAIR_STYLES,
    SELFIE_POSES,
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
    clothing: CLOTHING_CATALOG,
    pose: SELFIE_POSES,
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
  assert.match(app, /CLOTHING_CATALOG/);
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

test('crypto.getRandomValues exception guard rejects scope drift', () => {
  const validApp = `export function newSeed() {
  globalThis.crypto.getRandomValues(new Uint32Array(1));
}
export function seededRandom() {}`;
  const outsideNewSeed = `export function newSeed() {
  return 42;
}
export function seededRandom() {
  globalThis.crypto.getRandomValues(new Uint32Array(1));
}`;
  const duplicateInsideNewSeed = `export function newSeed() {
  globalThis.crypto.getRandomValues(new Uint32Array(1));
  globalThis.crypto.getRandomValues(new Uint32Array(1));
}
export function seededRandom() {}`;

  assert.deepEqual(cryptoRandomUsageErrors('app.js', validApp), []);
  assert.ok(cryptoRandomUsageErrors('app.js', outsideNewSeed).length > 0);
  assert.ok(cryptoRandomUsageErrors('app.js', duplicateInsideNewSeed).length > 0);
  assert.ok(cryptoRandomUsageErrors('core/example.js', validApp).length > 0);
});

test('production JavaScript contains no nondeterministic clock or random APIs except newSeed entropy', () => {
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
    assert.deepEqual(cryptoRandomUsageErrors(file, source), [], `${file} violates the crypto.getRandomValues() exception contract`);
  }
});
