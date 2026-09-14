import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SAUDI_NO_LANDMARKS_LOCK,
  enforceSaudiNoLandmarks,
  mergeSaudiNoLandmarksConstraint
} from '../core/saudi-location-lock.js';

test('Saudi location lock explicitly bans recognizable landmarks', () => {
  for (const phrase of ['ordinary, non-iconic, non-identifiable location', 'recognizable landmark', 'signature skyline', 'named venue']) {
    assert.equal(SAUDI_NO_LANDMARKS_LOCK.includes(phrase), true, `missing rule phrase: ${phrase}`);
  }
});

test('selected Saudi location receives no-landmarks enforcement', () => {
  const result = enforceSaudiNoLandmarks('on an ordinary residential street in Riyadh');
  assert.match(result, /no recognizable landmarks/i);
  assert.match(result, /non-iconic/i);
  assert.match(result, /signature skyline/i);
});

test('empty automatic location remains empty while global hard lock still exists', () => {
  assert.equal(enforceSaudiNoLandmarks(''), '');
  assert.equal(mergeSaudiNoLandmarksConstraint(''), SAUDI_NO_LANDMARKS_LOCK);
});

test('hard lock is merged with custom constraints exactly once', () => {
  const merged = mergeSaudiNoLandmarksConstraint('Keep the expression neutral.');
  assert.match(merged, /SAUDI LOCATION LOCK — CRITICAL/);
  assert.match(merged, /Keep the expression neutral/);
  const second = mergeSaudiNoLandmarksConstraint(merged);
  assert.equal(second, merged);
});

test('browser app enforces the lock in both auto generation and optimizer scene context', () => {
  const app = fs.readFileSync('app.js', 'utf8');
  assert.match(app, /enforceSaudiNoLandmarks\(selectedPrompt\(controls\.location\)\)/);
  assert.match(app, /mergeSaudiNoLandmarksConstraint\(controls\.customConstraints\.value\)/);
  assert.match(app, /مكان سعودي عادي بدون معالم/);
});
