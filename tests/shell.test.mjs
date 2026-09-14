import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');

test('rules-engine directories are removed', () => {
  assert.equal(exists('core'), false);
  assert.equal(exists('data'), false);
  assert.equal(exists('docs'), false);
});

test('application shell remains', () => {
  for (const file of ['index.html','app.js','styles.css','car-selfie.html','car-selfie.js','car-selfie.css']) {
    assert.equal(exists(file), true, `missing ${file}`);
  }
});

test('car shell contains no prompt engine hooks', () => {
  const source = `${read('car-selfie.html')}\n${read('car-selfie.js')}`;
  for (const token of ['compileCarSelfie','NEGATIVE_LIST','HARD ACCEPTANCE','VISUAL ANCHOR','Physics Checker','Master Profile']) {
    assert.equal(source.includes(token), false, `unexpected legacy rule token: ${token}`);
  }
});
