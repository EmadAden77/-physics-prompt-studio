import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImagePrompt } from '../core/prompt-generator.js';

function laptopBedroom(overrides = {}) {
  return generateImagePrompt({
    sceneType: 'bedroom_selfie',
    location: 'saudi_bedroom_livedin',
    locationValue: 'saudi_bedroom_livedin',
    pose: 'bedroom-laptop-bed',
    poseValue: 'bedroom-laptop-bed',
    expression: 'focused-mild',
    camera: 'xiaomi15_front',
    identityReference: true,
    backgroundActivity: 'quiet',
    realismLevel: 'strict',
    aspectRatio: '9:16',
    ...overrides
  });
}

test('bedroom rebuild uses a physically wider room and a full-width king-size bed', () => {
  const { prompt, validation } = laptopBedroom();

  assert.equal(validation.valid, true);
  assert.match(prompt, /5\.4 m LEFT-to-RIGHT by 6\.2 m FRONT-to-BACK/i);
  assert.match(prompt, /king-size bed/i);
  assert.match(prompt, /180 x 200 cm/i);
  assert.match(prompt, /at least about 1\.4 m of clear usable walking width/i);
  assert.match(prompt, /never as a narrow corridor or tunnel/i);
  assert.match(prompt, /never as a narrow bench, daybed, elongated strip/i);
  assert.doesNotMatch(prompt, /roughly 4m x 5m/i);
  assert.doesNotMatch(prompt, /queen-size bed/i);
});

test('bedroom laptop pose locks the laptop onto both thighs with usable hinge and hand geometry', () => {
  const { prompt, config } = laptopBedroom();

  assert.match(config.pose, /centered across BOTH upper thighs/i);
  assert.match(config.pose, /100–115 degrees/i);
  assert.match(config.pose, /wrist stays nearly neutral/i);
  assert.match(prompt, /LAPTOP \/ BODY CONTACT/i);
  assert.match(prompt, /supported by both thighs/i);
  assert.match(prompt, /roughly transverse to the pelvis/i);
  assert.match(prompt, /each visible finger remains anatomically separate/i);
});

test('bedroom laptop selfie uses true eye-level camera geometry and limits arm distortion', () => {
  const { prompt, config } = laptopBedroom();

  assert.match(config.angle, /true eye level/i);
  assert.match(config.angle, /45–60 cm/i);
  assert.match(config.angle, /±5 degrees/i);
  assert.match(config.angle, /forearm must not become grossly enlarged/i);
  assert.match(prompt, /mild near-lens enlargement is acceptable/i);
  assert.match(prompt, /never stretch the forearm, inflate its width/i);
});

test('wardrobe remains a genuine mirror and the rug remains broad rather than a runner', () => {
  const { prompt } = laptopBedroom();

  assert.match(prompt, /genuine clear reflective mirrors/i);
  assert.match(prompt, /not smoked glass, black glass, transparent glazing/i);
  assert.match(prompt, /approximately 2\.2 x 3\.0 m/i);
  assert.match(prompt, /never rendered as a thin runner/i);
});

test('reference identity does not copy the reference expression', () => {
  const { prompt } = laptopBedroom({ expression: 'neutral-calm' });

  assert.match(prompt, /REFERENCE EXPRESSION SEPARATION/i);
  assert.match(prompt, /Do not copy its smile, mouth shape, gaze direction/i);
  assert.match(prompt, /selected expression in this prompt overrides the reference expression/i);
  assert.match(prompt, /no deliberate smile/i);
});

test('bedroom lighting retains source-driven asymmetry and mixed white balance', () => {
  const { prompt } = laptopBedroom();

  assert.match(prompt, /must not equalize both sides into invisible frontal fill/i);
  assert.match(prompt, /Preserve their different local white-balance contributions/i);
  assert.match(prompt, /Do not cosmetically equalize illumination across the face/i);
  assert.match(prompt, /local noise and mixed white-balance differences/i);
});
