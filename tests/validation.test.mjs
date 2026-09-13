import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, REALISM_MODULES } from '../data/catalog.js';
import { PRESETS } from '../data/presets.js';
import { validateState, validationStatus } from '../core/validation.js';

const state = (patch = {}) => ({ ...DEFAULT_STATE, ...patch, modules: { ...DEFAULT_STATE.modules, ...(patch.modules || {}) } });
const strictModules = Object.fromEntries(REALISM_MODULES.map(({ id }) => [id, id === 'lighting' ? 'strict' : 'auto']));

test('default state is valid', () => {
  assert.deepEqual(validateState(state()), []);
  assert.equal(validationStatus(state()).blocked, false);
});

test('every shipped preset is physically valid', () => {
  for (const preset of PRESETS) {
    const issues = validateState(state(preset.values));
    assert.deepEqual(issues, [], `${preset.id}: ${issues.map((item) => item.code).join(', ')}`);
  }
});

test('strict mode blocks physical light/time conflict', () => {
  const sample = state({ time: 'night', lightSource: 'daylight', lightDirection: 'side', lightFalloff: 'distant-uniform', modules: strictModules });
  const status = validationStatus(sample);
  assert.ok(status.issues.some((item) => item.code === 'LIGHT_TIME_CONFLICT'));
  assert.equal(status.blocked, true);
});

test('auto mode reports physical conflict but remains advisory', () => {
  const sample = state({ time: 'night', lightSource: 'daylight', lightDirection: 'side', lightFalloff: 'distant-uniform' });
  const status = validationStatus(sample);
  assert.ok(status.issues.some((item) => item.code === 'LIGHT_TIME_CONFLICT'));
  assert.equal(status.blocked, false);
});

test('fatal schema errors block regardless of strict mode', () => {
  const status = validationStatus(state({ focalLength: 'not-a-number' }));
  assert.ok(status.issues.some((item) => item.severity === 'fatal'));
  assert.equal(status.blocked, true);
});

test('removed angle field is rejected instead of silently ignored', () => {
  const status = validationStatus({ ...state(), angle: 'eye-level' });
  assert.ok(status.issues.some((item) => item.code === 'UNKNOWN_STATE_FIELD' && item.field === 'angle'));
  assert.equal(status.blocked, true);
});

test('reference-dependent appearance requires an active reference', () => {
  const status = validationStatus(state({ hair: 'reference' }));
  assert.ok(status.issues.some((item) => item.code === 'REFERENCE_APPEARANCE_WITHOUT_ACTIVE_REFERENCE'));
  assert.equal(status.blocked, true);
});

test('vehicle interior rejects non-parkable highway location', () => {
  const sample = state({ vehicleScene: 'rrs-2017-white-interior', location: 'highway', pose: 'natural-seated' });
  assert.ok(validateState(sample).some((item) => item.code === 'VEHICLE_LOCATION_CONFLICT'));
});

test('weak phone-screen source rejects excessive camera/source distance', () => {
  const sample = state({ captureType: 'third-person', distance: 200, focalLength: 50, framing: 'half-body', location: 'living-room', time: 'night', lightSource: 'phone-screen', lightDirection: 'front', lightFalloff: 'inverse-square-near' });
  assert.ok(validateState(sample).some((item) => item.code === 'WEAK_SOURCE_DISTANCE_CONFLICT'));
});

test('front selfie validates horizontal group coverage', () => {
  const sample = state({ people: '3' });
  assert.ok(validateState(sample).some((item) => item.code === 'SELFIE_GROUP_WIDTH_MISMATCH'));
});

test('named city policy is fatal', () => {
  const status = validationStatus(state({ idea: 'portrait at night in Riyadh' }));
  assert.ok(status.issues.some((item) => item.code === 'NAMED_CITY_NOT_ALLOWED'));
  assert.equal(status.blocked, true);
});

test('strict mode rejects unverifiable custom physical categories', () => {
  const sample = state({ location: 'custom', customLocation: 'a generic Saudi courtyard', modules: strictModules });
  assert.ok(validationStateCodes(sample).includes('STRICT_UNVERIFIED_LOCATION'));
  assert.equal(validationStatus(sample).blocked, true);
});

test('validation order is deterministic', () => {
  const sample = state({ people: '5', lightSource: 'daylight', time: 'night', lightDirection: 'mixed', lightFalloff: 'mixed-local' });
  assert.deepEqual(validateState(sample), validateState(sample));
});

function validationStateCodes(sample) {
  return validateState(sample).map((item) => item.code);
}
