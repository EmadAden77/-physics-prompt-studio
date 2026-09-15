import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { generateImagePrompt, validateGeneratedPrompt, validateRealism } from '../core/prompt-generator.js';
import { addSensorNoise, XIAOMI_15_ULTRA_PRESET } from '../core/photo-post-processing.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from '../core/scene-builder.js';

const sceneTypes = ['front_selfie', 'inside_car_selfie', 'mirror_selfie', 'third_person_portrait'];

function sampleImage(width = 8, height = 8) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    data[i] = (80 + pixel * 3) % 256;
    data[i + 1] = (110 + pixel * 5) % 256;
    data[i + 2] = (140 + pixel * 7) % 256;
    data[i + 3] = 255;
  }
  return { width, height, data };
}

test('end-to-end prompt generation is deterministic and structurally valid', () => {
  for (const sceneType of sceneTypes) {
    const input = {
      sceneType,
      camera: 'xiaomi15_front',
      location: 'an ordinary Saudi setting with physically plausible practical lighting',
      realismLevel: 'strict'
    };
    const first = generateImagePrompt(input);
    const second = generateImagePrompt(input);

    assert.equal(first.prompt, second.prompt, `${sceneType} prompt is not deterministic`);
    assert.deepEqual(first.config, second.config, `${sceneType} config is not deterministic`);
    assert.equal(first.sections.length, 23, `${sceneType} must contain 23 mandatory sections`);
    assert.equal(first.validation.valid, true, `${sceneType} failed structural validation`);
    assert.equal(first.realism_validation.valid, true, `${sceneType} failed realism validation`);
    assert.equal(validateGeneratedPrompt(first.prompt, { realismPacket: first.realism_packet }).valid, true);
    assert.equal(validateRealism(first.prompt).valid, true);
  }
});

test('core catalog counts match the documented production baseline', () => {
  assert.equal(SAUDI_LOCATIONS.length, 43, 'SAUDI_LOCATIONS count changed');
  assert.equal(CLOTHING_OPTIONS.length, 30, 'CLOTHING_OPTIONS count changed');
  assert.equal(SELFIE_POSES.length, 15, 'SELFIE_POSES count changed');
  assert.equal(SELFIE_ANGLES.length, 16, 'SELFIE_ANGLES count changed');
  assert.equal(LIGHTING_PROFILES.length, 20, 'LIGHTING_PROFILES count changed');
});

test('sensor processing remains deterministic for identical image, settings and seed', () => {
  const source = sampleImage();
  const options = {
    iso: 1600,
    luma: XIAOMI_15_ULTRA_PRESET.lumaNoise,
    chroma: XIAOMI_15_ULTRA_PRESET.chromaNoise,
    seed: 42
  };
  const first = addSensorNoise(source, options);
  const second = addSensorNoise(source, options);

  assert.deepEqual([...first.data], [...second.data]);
  assert.deepEqual([...source.data], [...sampleImage().data], 'source image must not be mutated');
});

test('car studio is wired to prompt generation, realism validation and local photo processing', async () => {
  const [script, html] = await Promise.all([
    readFile(new URL('../car-selfie.js', import.meta.url), 'utf8'),
    readFile(new URL('../car-selfie.html', import.meta.url), 'utf8')
  ]);

  assert.match(script, /generateImagePrompt/);
  assert.match(script, /validateRealism/);
  assert.match(script, /processImageBlob/);
  assert.doesNotMatch(script, /Math\.random\s*\(/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.match(html, /<canvas\b[^>]*id=["']processedCanvas["']/i);
  assert.match(html, /<input\b[^>]*type=["']file["']/i);
  assert.match(html, /type=["']module["'][^>]*src=["']car-selfie\.js["']/i);
});
