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

test('bedroom rebuild follows the supplied room reference instead of invented exact dimensions', () => {
  const { prompt, validation } = laptopBedroom();

  assert.equal(validation.valid, true);
  assert.match(prompt, /supplied room reference/i);
  assert.match(prompt, /longer FRONT-to-BACK than it is wide/i);
  assert.match(prompt, /large open central floor zone/i);
  assert.match(prompt, /never as a narrow corridor or tunnel/i);
  assert.match(prompt, /Do not invent exact metric room dimensions/i);
  assert.match(prompt, /Do not rely on unverified exact metric room or mattress dimensions/i);
  assert.match(prompt, /broad full-width adult mattress/i);
  assert.match(prompt, /rather than a narrow bench or endless strip/i);
});

test('reference layout corrects legacy wall placement and ceiling inventory', () => {
  const { prompt } = laptopBedroom();

  assert.match(prompt, /LEFT wall = the bed\/headboard zone plus the high wall-mounted split air conditioner/i);
  assert.match(prompt, /chair positioned near the BACK curtains slightly right of center/i);
  assert.match(prompt, /multiple small recessed circular downlights/i);
  assert.match(prompt, /rather than a fixed six-light grid/i);
  assert.match(prompt, /placing the air conditioner on the FRONT wall/i);
  assert.match(prompt, /the chair on the FRONT wall/i);
  assert.match(prompt, /treat that legacy wording as obsolete/i);
});

test('right-wall storage preserves reflective panels plus open hanging and drawer sections', () => {
  const { prompt } = laptopBedroom();

  assert.match(prompt, /long dark-wood built-in storage system/i);
  assert.match(prompt, /reflective or mirrored panels together with open hanging bays, shelves and drawers/i);
  assert.match(prompt, /Do not simplify the entire run into featureless black glass/i);
  assert.match(prompt, /physically correct left-right reversal/i);
});

test('rug, glossy tile and lived-in clutter preserve the observed room character', () => {
  const { prompt } = laptopBedroom();

  assert.match(prompt, /large broad rectangular beige-to-greige low-pile rug/i);
  assert.match(prompt, /surrounded by visible glossy tile on all sides/i);
  assert.match(prompt, /several naturally scattered footwear pairs/i);
  assert.match(prompt, /dark soft bag near the back\/right storage-curtain area/i);
  assert.match(prompt, /lived-in and imperfect, not showroom-clean/i);
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

test('reference identity does not copy the reference expression', () => {
  const { prompt } = laptopBedroom({ expression: 'neutral-calm' });

  assert.match(prompt, /REFERENCE EXPRESSION SEPARATION/i);
  assert.match(prompt, /Do not copy its smile, mouth shape, gaze direction/i);
  assert.match(prompt, /selected expression in this prompt overrides the reference expression/i);
  assert.match(prompt, /no deliberate smile/i);
});

test('bedroom lighting preserves practical-source causality and phone-screen-only override', () => {
  const { prompt } = laptopBedroom();

  assert.match(prompt, /most fixtures are dark while only a small subset is illuminated/i);
  assert.match(prompt, /bright specular reflections on the glossy tile/i);
  assert.match(prompt, /Do not invent frontal fill, ring light, studio softbox light/i);
  assert.match(prompt, /Phone-screen-only scenes must override all room practical lights/i);
  assert.match(prompt, /Do not cosmetically equalize illumination across the face/i);
});
