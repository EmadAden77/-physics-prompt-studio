import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRealismPacket, renderRealismGuidance } from '../core/realistic-image-generator.js';

test('car scenario uses car-selfie context and ordinary cabin background', () => {
  const packet = buildRealismPacket({
    sceneType: 'inside_car_selfie',
    captureType: 'subject-held front-camera smartphone selfie',
    location: 'inside a stationary car'
  });
  assert.equal(packet.template_type, 'Car Selfie');
  assert.match(packet.action, /stationary car/i);
  assert.ok(packet.background.elements.some((item) => /seat|door trim|dashboard/i.test(item)));
});

test('outdoor scenario favors activity rather than a static portrait', () => {
  const packet = buildRealismPacket({
    sceneType: 'walking_selfie',
    location: 'an ordinary Saudi street'
  });
  assert.equal(packet.template_type, 'Street/Outdoor Photo');
  assert.match(packet.action, /walking|pausing|leaning/i);
});

test('product guidance never invents advertisement-style placement', () => {
  const empty = buildRealismPacket({});
  assert.match(empty.product_integration, /Do not invent a hero product/i);
  const withDescription = buildRealismPacket({ description: 'holding a water bottle after training' });
  assert.match(withDescription.product_integration, /integrate it as something naturally used/i);
});

test('rendered guidance exposes observable background items and consistency checklist', () => {
  const packet = buildRealismPacket({ sceneType: 'office_selfie', location: 'inside an ordinary office' });
  const guidance = renderRealismGuidance(packet);
  assert.match(guidance.background, /Observable background elements/i);
  assert.match(guidance.consistency, /action-driven rather than static/i);
});

test('outdoor selfie in parking is not classified as car interior', async () => {
  const { buildRealismPacket } = await import('../core/realistic-image-generator.js');
  const packet = buildRealismPacket({
    sceneType: 'outdoor_selfie',
    captureType: 'subject-held front-camera smartphone selfie',
    location: 'night_parking'
  });
  assert.notEqual(packet.template_type, 'Car Selfie');
  assert.doesNotMatch(packet.action, /seated.*car/i);
});

test('explicit inside_car_selfie is still classified as car', async () => {
  const { buildRealismPacket } = await import('../core/realistic-image-generator.js');
  const packet = buildRealismPacket({
    sceneType: 'inside_car_selfie',
    captureType: 'subject-held front-camera smartphone selfie',
    location: 'night_parking'
  });
  assert.equal(packet.template_type, 'Car Selfie');
});

test('villa driveway outdoor selfie is not car interior', async () => {
  const { buildRealismPacket } = await import('../core/realistic-image-generator.js');
  const packet = buildRealismPacket({
    sceneType: 'outdoor_selfie',
    captureType: 'subject-held front-camera smartphone selfie',
    location: 'villa_driveway'
  });
  assert.notEqual(packet.template_type, 'Car Selfie');
});
