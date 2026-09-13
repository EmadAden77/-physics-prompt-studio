import assert from 'node:assert/strict';
import {
  compileDetailed,
  compileConcise,
  compileNegative,
  compileJson,
  validateState
} from '../core/compiler.js';
import {
  CAPTURE_TYPES,
  TIMES,
  SAUDI_LOCATIONS,
  ANGLES,
  FRAMINGS,
  POSES,
  EXPRESSIONS,
  CLOTHING,
  LIGHT_SOURCES,
  REALISM_MODULES
} from '../data/catalog.js';
import {
  HAIRSTYLES,
  BEARDS,
  GLASSES_OPTIONS,
  EXTRA_POSES,
  EXTRA_ANGLES,
  EXTRA_FRAMINGS,
  EXTRA_LIGHT_SOURCES,
  EXTRA_LOCATIONS
} from '../data/extensions.js';
import { PRESETS } from '../data/presets.js';

const keys = (items) => new Set(items.map(([key]) => key));
const mergedKeys = (...groups) => new Set(groups.flat().map(([key]) => key));
const modules = Object.fromEntries(REALISM_MODULES.map(([key]) => [key, 'auto']));

const baseState = {
  idea: 'a man standing naturally on an ordinary Saudi commercial street',
  referenceAttached: false,
  referenceRole: 'none',
  captureType: 'front-selfie',
  time: 'night',
  location: 'commercial-street',
  customLocation: '',
  vehicleScene: 'none',
  people: '1',
  ratio: '9:16 vertical',
  age: '35',
  pose: 'natural-standing',
  customPose: '',
  expression: 'neutral',
  clothing: 'black-tee',
  customClothing: '',
  hair: 'short-natural',
  customHair: '',
  beard: 'short-trimmed',
  customBeard: '',
  glasses: 'none',
  customGlasses: '',
  angle: 'eye-level',
  customAngle: '',
  framing: 'chest-up',
  customFraming: '',
  focalLength: '24',
  distance: '50',
  yaw: '0',
  pitch: '0',
  roll: '2',
  lightSource: 'street-lights',
  customLightSource: '',
  lightDirection: 'front-side natural direction',
  lightFalloff: 'natural distance-based falloff',
  exposure: 'natural',
  hdr: 'low',
  whiteBalance: 'neutral with small natural error',
  modules,
  notes: ''
};

assert.deepEqual(validateState(baseState), [], 'default valid state should not warn');
assert.match(compileDetailed(baseState), /^GENERATE ONE PHOTOREALISTIC IMAGE/m);
assert.match(compileDetailed(baseState), /\n\nCORE SCENE:/, 'detailed output should preserve section spacing');
assert.match(compileConcise(baseState), /^Create one photorealistic image\./);
assert.match(compileNegative(baseState), /recognizable landmark/);
assert.doesNotThrow(() => JSON.parse(compileJson(baseState)));

const emptyNumberState = { ...baseState, focalLength: '', distance: '', yaw: '', pitch: '', roll: '' };
const emptyNumberJson = JSON.parse(compileJson(emptyNumberState));
assert.equal(emptyNumberJson.capture.focal_length_equivalent_mm, null);
assert.equal(emptyNumberJson.capture.distance_cm, null);
assert.equal(emptyNumberJson.capture.yaw_deg, null);

const vehicleState = {
  ...baseState,
  idea: 'A 35-year-old man is seated inside a white 2017 Range Rover Sport parked at night in a generic Saudi parking area.',
  location: 'public-parking',
  vehicleScene: 'rrs-2017-white-interior',
  pose: 'natural-seated',
  clothing: 'navy-shirt',
  lightSource: 'parking-lights'
};
const vehicleWarnings = validateState(vehicleState);
assert.deepEqual(vehicleWarnings, [], `vehicle preset state should be valid: ${vehicleWarnings.join(' | ')}`);
const vehiclePrompt = compileDetailed(vehicleState);
assert.match(vehiclePrompt, /2017 Range Rover Sport L494/);
assert.match(vehiclePrompt, /Ivory leather seats/);
assert.match(vehiclePrompt, /panoramic roof/);
assert.match(compileNegative(vehicleState), /newer Range Rover interior/);

const indoorVehicleWarnings = validateState({ ...vehicleState, location: 'living-room' });
assert.ok(indoorVehicleWarnings.some((warning) => warning.includes('موقع داخلي')), 'vehicle + indoor location should warn');

const standingVehicleWarnings = validateState({ ...vehicleState, pose: 'natural-standing' });
assert.ok(standingVehicleWarnings.some((warning) => warning.includes('وضعية جلوس')), 'vehicle + standing pose should warn');

const badSelfieWarnings = validateState({
  ...baseState,
  focalLength: '85',
  distance: '150',
  framing: 'full-body'
});
assert.ok(badSelfieWarnings.length >= 3, 'implausible selfie geometry should raise multiple warnings');
assert.ok(badSelfieWarnings.some((warning) => warning.includes('سيلفي')));

const attachedUnusedReference = validateState({ ...baseState, referenceAttached: true, referenceRole: 'none' });
assert.ok(attachedUnusedReference.some((warning) => warning.includes('بدون استخدام')));

const missingReference = validateState({ ...baseState, referenceRole: 'identity-only' });
assert.ok(missingReference.some((warning) => warning.includes('لم تُرفق صورة')));

const customCityWarnings = validateState({
  ...baseState,
  location: 'custom',
  customLocation: 'a quiet residential street in Riyadh'
});
assert.ok(customCityWarnings.some((warning) => warning.includes('اسم مدينة')));

const strictAnatomy = {
  ...baseState,
  modules: Object.fromEntries(REALISM_MODULES.map(([key]) => [key, key === 'anatomy' ? 'strict' : 'off']))
};
assert.match(compileDetailed(strictAnatomy), /Strictly enforce correct human anatomy/);
assert.doesNotMatch(compileDetailed(strictAnatomy), /Keep human anatomy believable/);

const presetIds = PRESETS.map(({ id }) => id);
assert.equal(new Set(presetIds).size, presetIds.length, 'preset IDs must be unique');

const allowed = {
  captureType: keys(CAPTURE_TYPES),
  time: keys(TIMES),
  location: mergedKeys(SAUDI_LOCATIONS, EXTRA_LOCATIONS),
  vehicleScene: new Set(['none', 'rrs-2017-white-interior']),
  pose: mergedKeys(POSES, EXTRA_POSES),
  expression: keys(EXPRESSIONS),
  clothing: new Set([...keys(CLOTHING), 'custom']),
  hair: keys(HAIRSTYLES),
  beard: keys(BEARDS),
  glasses: keys(GLASSES_OPTIONS),
  angle: mergedKeys(ANGLES, EXTRA_ANGLES),
  framing: mergedKeys(FRAMINGS, EXTRA_FRAMINGS),
  lightSource: mergedKeys(LIGHT_SOURCES, EXTRA_LIGHT_SOURCES)
};

const knownPresetFields = new Set([
  'idea', 'captureType', 'time', 'location', 'customLocation', 'vehicleScene', 'people', 'ratio', 'age',
  'pose', 'customPose', 'expression', 'clothing', 'customClothing', 'hair', 'customHair', 'beard', 'customBeard',
  'glasses', 'customGlasses', 'angle', 'customAngle', 'framing', 'customFraming', 'focalLength', 'distance',
  'yaw', 'pitch', 'roll', 'lightSource', 'customLightSource', 'lightDirection', 'lightFalloff', 'exposure', 'hdr',
  'whiteBalance', 'notes'
]);

for (const preset of PRESETS) {
  assert.ok(preset.id && preset.label && preset.values, 'every preset needs id, label, and values');
  for (const [field, value] of Object.entries(preset.values)) {
    assert.ok(knownPresetFields.has(field), `preset ${preset.id} contains unknown field ${field}`);
    if (allowed[field]) assert.ok(allowed[field].has(value), `preset ${preset.id} has unsupported ${field}: ${value}`);
  }
}

console.log('compiler-smoke: ok');
