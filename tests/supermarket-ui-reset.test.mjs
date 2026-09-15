import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('scene change resets incompatible fields before scheduling prompt generation', () => {
  for (const field of ['location', 'pose', 'angle', 'lighting']) {
    assert.match(app, new RegExp(`restoreCompatibleSelection\\(controls\\.${field}`), `${field} reset is not wired`);
  }
  assert.match(app, /controls\.framing\.value\s*=\s*resolveCompatibleValue/);
  assert.match(app, /controls\.sceneType\.addEventListener\('change',[\s\S]*?applySceneCompatibility\(\);\s*scheduleGenerate\(\);/);
});

test('supermarket uses its explicit compatibility profile instead of generic front-selfie options', () => {
  assert.match(app, /sceneType\s*===\s*'supermarket_selfie'\s*\?\s*sceneType\s*:\s*baseSceneType/);
  assert.match(app, /compatibilityType\s*===\s*'supermarket_selfie'\s*\?\s*\[\]\s*:\s*extraLocationsForScene/);
  assert.match(app, /narrowOptions\(sceneType, kind, options\)/);
});
