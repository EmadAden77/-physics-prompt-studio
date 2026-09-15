import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const js = await readFile(new URL('../car-selfie.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../car-selfie.html', import.meta.url), 'utf8');

test('car-selfie.js imports prompt generation and realism validation', () => {
  assert.match(js, /import\s*\{[^}]*generateImagePrompt[^}]*validateRealism[^}]*\}\s*from\s*['"]\.\/core\/prompt-generator\.js['"]/s);
});

test('car-selfie.js imports processImageBlob', () => {
  assert.match(js, /import\s*\{[^}]*processImageBlob[^}]*\}\s*from\s*['"]\.\/core\/photo-post-processing\.js['"]/s);
});

test('car-selfie.js does not use Math.random()', () => {
  assert.doesNotMatch(js, /Math\.random\s*\(/);
});

test('inside and outside modes hide irrelevant fields and reset their defaults', () => {
  assert.match(js, /seatField\.hidden\s*=\s*!inside/);
  assert.match(js, /standingPoseField\.hidden\s*=\s*inside/);
  assert.match(js, /seat\.value\s*=\s*['"]driver_seat['"]/);
  assert.match(js, /standingPose\.value\s*=\s*['"]door_open_car['"]/);
});

test('local image processing and processed download remain wired', () => {
  assert.match(js, /processImageBlob\s*\(/);
  assert.match(js, /function\s+downloadProcessedImage\s*\(/);
  assert.match(js, /downloadProcessed\.addEventListener\s*\(\s*['"]click['"]/);
});

test('car-selfie.html exposes a processing canvas', () => {
  assert.match(html, /<canvas\b[^>]*id=["']processedCanvas["'][^>]*>/i);
});

test('car-selfie.html exposes an image file input', () => {
  assert.match(html, /<input\b[^>]*id=["']imageUpload["'][^>]*type=["']file["'][^>]*>/i);
});
