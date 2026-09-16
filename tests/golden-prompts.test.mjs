import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateImagePrompt } from '../core/prompt-generator.js';

const GOLDEN_CASES = Object.freeze([
  {
    name: 'front-selfie-saudi-cafe',
    expected: 'a658c1cd1ab35d3d222cb64512a5bd0e1d030a0dac7a53e40bd34fa4ac208b19',
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
    expected: '44d9ac999f3416bb87f012ba5970111c53dcf1de98052cadc4016b0c07b7c3f7',
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
    expected: 'af3a89af610bda6bc3a4aa7c8b55cd3b357420d101360f830f7ddada964f2621',
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
    expected: 'ecf662b6a72b6c328ede7387e70a56a844f69eaf8b53e72fd8a74c721856cb64',
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
    expected: '94582dedf392b17917d7ba78b80dd01a92674b09e3673c95ed23a83aec46c2cb',
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

test('golden prompts remain byte-for-byte stable across critical scene families', () => {
  for (const golden of GOLDEN_CASES) {
    const first = generateImagePrompt(golden.input);
    const second = generateImagePrompt(golden.input);
    assert.equal(first.validation.valid, true, `${golden.name}: structural validation failed`);
    assert.equal(first.realism_validation.valid, true, `${golden.name}: realism validation failed`);
    assert.equal(first.prompt, second.prompt, `${golden.name}: prompt is not deterministic`);

    const digest = fingerprint(first.prompt);
    assert.equal(
      digest,
      golden.expected,
      `${golden.name}: golden prompt changed. Review the generated prompt intentionally before updating this fingerprint.`
    );
  }
});
