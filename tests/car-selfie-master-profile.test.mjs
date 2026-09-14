import test from 'node:test';
import assert from 'node:assert/strict';
import { INSIDE_DEFAULT_STATE } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE } from '../data/carSelfieOutsideCatalog.js';
import {
  INSIDE_DRIVER_MASTER_PROFILE,
  usesInsideDriverMasterProfile
} from '../data/carSelfieInsideMasterProfile.js';
import { normalizeCarState } from '../core/carSelfieValidation.js';
import { compileNarrative, countNarrativeWords, DRIVER_ANCHOR_SENTENCE } from '../core/carSelfieNarrativeCompiler.js';
import { buildCarSelfieEngineeringSpec } from '../core/carSelfieEngineeringSpec.js';
import { buildCarSelfieAcceptance } from '../core/carSelfieAcceptance.js';

const inside = (patch = {}) => normalizeCarState({ ...structuredClone(INSIDE_DEFAULT_STATE), ...patch, mode: 'inside' });
const outside = (patch = {}) => normalizeCarState({ ...structuredClone(OUTSIDE_DEFAULT_STATE), ...patch, mode: 'outside' });

test('adopted master profile activates only for inside driver-left', () => {
  assert.equal(usesInsideDriverMasterProfile(inside({ seat: 'driver-left' })), true);
  assert.equal(usesInsideDriverMasterProfile(inside({ seat: 'front-passenger-right' })), false);
  assert.equal(usesInsideDriverMasterProfile(outside()), false);
});

test('master profile keeps Xiaomi front-camera and LHD constants', () => {
  const profile = INSIDE_DRIVER_MASTER_PROFILE;
  assert.equal(profile.captureLock.device, 'Xiaomi 15 Ultra');
  assert.equal(profile.captureLock.camera, 'front');
  assert.equal(profile.captureLock.focalLengthEqMm, 21);
  assert.equal(profile.captureLock.aperture, 2.0);
  assert.equal(profile.captureLock.distanceCm, 45);
  assert.equal(profile.finalImageAnchor.driverWindowFrameSide, 'right-half');
  assert.equal(profile.finalImageAnchor.passengerAreaFrameSide, 'left-half');
  assert.equal(profile.finalImageAnchor.steeringWheelHintRegion, 'bottom-center-left');
  assert.equal(profile.finalImageAnchor.cabinMirrored, false);
});

test('inside driver narrative derives identity, capture, period cabin and light causality from master profile', () => {
  const state = inside({
    seat: 'driver-left',
    referenceAttached: true,
    referenceRole: 'identity-only',
    vehicleProfile: 'l494-2017-white',
    place: 'desert-road',
    weather: 'light-dust',
    externalLight: 'night-led-street',
    clothing: 'navy-thobe',
    fabricType: 'cotton-poplin',
    clutterLevel: 'clean',
    distance: 45,
    yaw: 0,
    pitch: 0,
    roll: 2
  });
  const prompt = compileNarrative(state, 'inside');
  assert.ok(prompt.includes(DRIVER_ANCHOR_SENTENCE));
  assert.match(prompt, /reference defines identity only/i);
  assert.match(prompt, /genuine self-held front-camera selfie/i);
  assert.match(prompt, /period-correct for 2017/i);
  assert.match(prompt, /no newer-generation dashboard or steering design/i);
  assert.match(prompt, /Roadside light reaches only surfaces physically exposed/i);
  assert.match(prompt, /exposure and HDR reveal captured light without inventing illumination/i);
  assert.match(prompt, /real density and hairline/i);
  assert.match(prompt, /plain navy Saudi thobe/i);
  assert.ok(countNarrativeWords(prompt) <= 300);
});

test('master profile augments realism without overriding selected scene clothing or place', () => {
  const state = inside({ seat: 'driver-left', clothing: 'white-thobe', fabricType: 'cotton-poplin', place: 'quiet-residential-street' });
  const prompt = compileNarrative(state, 'inside');
  assert.match(prompt, /plain white Saudi thobe/i);
  assert.match(prompt, /Saudi residential street/i);
  assert.doesNotMatch(prompt, /plain navy Saudi thobe/i);
});

test('engineering layer exposes adopted master profile but does not deliver it to the model', () => {
  const spec = buildCarSelfieEngineeringSpec(inside({ seat: 'driver-left' }));
  assert.equal(spec.model_delivery, false);
  assert.equal(spec.master_profile.active, true);
  assert.equal(spec.master_profile.id, 'inside-driver-master-v1');
  assert.equal(spec.master_profile.identity_reference_role, 'identity-only');
  assert.equal(spec.master_profile.capture_type, 'self-held-front-camera');
  assert.equal(spec.master_profile.driver_window_frame_side, 'right-half');
  assert.equal(spec.master_profile.acceptance_id, 'master-driver-profile');
});

test('acceptance layer contains the adopted master-driver verification item', () => {
  const items = buildCarSelfieAcceptance(inside({ seat: 'driver-left' }));
  const master = items.find((item) => item.id === 'master-driver-profile');
  assert.ok(master);
  assert.match(master.label, /المرجع للهوية فقط/);
  assert.match(master.label, /L494 2017/);
  assert.match(master.label, /كثافة الشعر ثابتة/);
});

test('master narrative remains deterministic', () => {
  const state = inside({ seat: 'driver-left', referenceAttached: true, place: 'desert-road', clothing: 'navy-thobe', fabricType: 'cotton-poplin' });
  assert.equal(compileNarrative(state, 'inside'), compileNarrative(state, 'inside'));
});
