import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateImagePrompt } from '../core/prompt-generator.js';

const GOLDEN_CASES = Object.freeze([
  {
    name: 'front-selfie-saudi-cafe',
    input: {
      sceneType: 'front_selfie',
      location: 'inside an ordinary Saudi cafe',
      clothing: 'a dark navy Saudi thobe',
      hairStyle: 'short natural side sweep with unchanged hairline and density',
      pose: 'standing naturally with relaxed shoulders',
      angle: 'eye level',
      lighting: 'warm practical ceiling lights',
      camera: 'xiaomi15_front',
      framing: 'chest_up',
      expression: 'neutral',
      backgroundActivity: 'normal',
      realismLevel: 'strict',
      aspectRatio: '9:16'
    }
  },
  {
    name: 'inside-car-night-phone-light',
    input: {
      sceneType: 'inside_car_selfie',
      location: 'inside a stationary left-hand-drive car at night in Saudi Arabia',
      clothing: 'a light-grey dress shirt with navy tailored trousers',
      pose: 'seated naturally with real seat contact',
      angle: 'eye level',
      lighting: 'phone-screen-only lighting',
      camera: 'xiaomi15_front',
      framing: 'chest_up',
      expression: 'neutral',
      backgroundActivity: 'quiet',
      realismLevel: 'raw',
      aspectRatio: '9:16'
    }
  },
  {
    name: 'mirror-bedroom-selfie',
    input: {
      sceneType: 'mirror_selfie',
      location: 'inside an ordinary Saudi bedroom',
      clothing: 'a navy band-collar shirt with charcoal tailored trousers',
      pose: 'standing naturally in front of the mirror',
      angle: 'eye level',
      lighting: 'warm practical room lighting',
      camera: 'xiaomi15_front',
      framing: 'waist_up',
      expression: 'neutral',
      backgroundActivity: 'quiet',
      realismLevel: 'strict',
      aspectRatio: '9:16'
    }
  },
  {
    name: 'third-person-beside-car',
    input: {
      sceneType: 'third_person_car_adjacent',
      location: 'ordinary Saudi outdoor parking area in daylight',
      clothing: 'a navy two-piece suit with a light-blue dress shirt',
      pose: 'standing naturally beside a parked vehicle',
      angle: 'eye level',
      lighting: 'direct natural daylight',
      camera: 'smartphone_rear',
      framing: 'three_quarter',
      expression: 'neutral',
      backgroundActivity: 'normal',
      realismLevel: 'strict',
      aspectRatio: '9:16'
    }
  },
  {
    name: 'supermarket-lively',
    input: {
      sceneType: 'supermarket_selfie',
      location: 'inside an ordinary Saudi supermarket',
      clothing: 'a casual light-blue Oxford shirt with beige chinos',
      pose: 'pausing naturally beside a shopping aisle',
      angle: 'slightly above eye level',
      lighting: 'broad retail ceiling lighting',
      camera: 'xiaomi15_front',
      framing: 'chest_up',
      expression: 'small closed-mouth smile',
      backgroundActivity: 'lively',
      realismLevel: 'strict',
      aspectRatio: '9:16'
    }
  }
]);

function fingerprint(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

test('golden prompt candidates are valid and emit stable fingerprints for locking', () => {
  for (const golden of GOLDEN_CASES) {
    const first = generateImagePrompt(golden.input);
    const second = generateImagePrompt(golden.input);
    assert.equal(first.validation.valid, true, `${golden.name}: structural validation failed`);
    assert.equal(first.realism_validation.valid, true, `${golden.name}: realism validation failed`);
    assert.equal(first.prompt, second.prompt, `${golden.name}: prompt is not deterministic`);
    const digest = fingerprint(first.prompt);
    assert.match(digest, /^[a-f0-9]{64}$/);
    console.log(`GOLDEN_PROMPT ${golden.name} ${digest}`);
  }
});
