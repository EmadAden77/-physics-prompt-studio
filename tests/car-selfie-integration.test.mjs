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

test('car-selfie.html exposes a processing canvas', () => {
  assert.match(html, /<canvas\b[^>]*id=["']processedCanvas["'][^>]*>/i);
});

test('car-selfie.html exposes an image file input', () => {
  assert.match(html, /<input\b[^>]*id=["']imageUpload["'][^>]*type=["']file["'][^>]*>/i);
});
