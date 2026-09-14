import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCarModeFromIntent, XIAOMI_15_ULTRA_PROFILE } from '../data/carSelfieCommonCatalog.js';
import { INSIDE_DEFAULT_STATE, analyzeInsideIntent, isInsideOptionCompatible } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE, analyzeOutsideIntent, isOutsideOptionCompatible } from '../data/carSelfieOutsideCatalog.js';
import { carValidationStatus, compatibleOptions, normalizeCarState, validateCarState } from '../core/carSelfieValidation.js';
import {
  compileCarSelfieDetailed,
  compileCarSelfieJson,
  compileCarSelfieNegative,
  compileCarSelfieTechnicalSpec
} from '../core/carSelfieCompiler.js';
import { NEGATIVE_LIST } from '../core/carSelfieNarrativeCompiler.js';

const inside = (patch = {}) => normalizeCarState({ ...structuredClone(INSIDE_DEFAULT_STATE), ...patch, mode: 'inside' });
const outside = (patch = {}) => normalizeCarState({ ...structuredClone(OUTSIDE_DEFAULT_STATE), ...patch, mode: 'outside' });

test('mode detection is deterministic', () => {
  assert.equal(detectCarModeFromIntent('واقف بجانب السيارة', 'inside'), 'outside');
  assert.equal(detectCarModeFromIntent('سيلفي داخل السيارة', 'outside'), 'inside');
  assert.equal(detectCarModeFromIntent('سيلفي عفوي', 'inside'), 'inside');
});

test('inside normalized state contains no outside-only fields', () => {
  const s = normalizeCarState({ ...INSIDE_DEFAULT_STATE, mode: 'inside', standingPose: 'lean-car', paintCondition: 'light-dust' });
  assert.equal('standingPose' in s, false);
  assert.equal('paintCondition' in s, false);
});

test('outside normalized state contains no inside-only fields', () => {
  const s = normalizeCarState({ ...OUTSIDE_DEFAULT_STATE, mode: 'outside', seat: 'driver-left', clutterLevel: 'heavy', cabinEmitter: 'dome-light' });
  assert.equal('seat' in s, false);
  assert.equal('clutterLevel' in s, false);
  assert.equal('cabinEmitter' in s, false);
});

test('legacy inside technical compiler does not leak outside instructions', () => {
  const out = compileCarSelfieTechnicalSpec(inside());
  assert.match(out, /MODE: INSIDE CAR SELFIE ONLY/);
  assert.doesNotMatch(out, /STANDING POSE:/);
  assert.doesNotMatch(out, /PAINT & BODY PHYSICS:/);
});

test('legacy outside technical compiler does not leak cabin instructions', () => {
  const out = compileCarSelfieTechnicalSpec(outside());
  assert.match(out, /MODE: OUTSIDE BESIDE-CAR SELF-PORTRAIT ONLY/);
  assert.doesNotMatch(out, /INTERIOR CLUTTER:/);
  assert.doesNotMatch(out, /CABIN EMITTER:/);
  assert.doesNotMatch(out, /VEHICLE & SEATING:/);
});

test('Xiaomi 15 Ultra front and rear optical authority is correct', () => {
  assert.equal(XIAOMI_15_ULTRA_PROFILE.front.focalLengthEqMm, 21);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.front.aperture, 2.0);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.main23.focalLengthEqMm, 23);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.tele70.focalLengthEqMm, 70);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.tele70.aperture, 1.8);
});

test('inside mode never offers rear Leica lenses', () => {
  const ids = compatibleOptions('cameraLens', inside()).map((item) => item.id);
  assert.deepEqual(ids, ['front-21']);
  assert.equal(isInsideOptionCompatible('cameraLens', 'rear-tele-70', inside()), false);
});

test('outside hand-held selfie only offers front camera', () => {
  const ids = compatibleOptions('cameraLens', outside({ captureMode: 'handheld-front' })).map((item) => item.id);
  assert.deepEqual(ids, ['front-21']);
});

test('outside remote mode enables official 23mm and 70mm rear lenses', () => {
  const s = outside({ captureMode: 'remote-rear', cameraLens: 'rear-main-23', colorProfile: 'leica-authentic', distance: 180 });
  const ids = compatibleOptions('cameraLens', s).map((item) => item.id);
  assert.deepEqual(ids, ['rear-main-23', 'rear-tele-70']);
  assert.equal(isOutsideOptionCompatible('cameraLens', 'front-21', s), false);
});

test('75mm outside intent maps deterministically to official 70mm rear telephoto and remote capture', () => {
  const a = analyzeOutsideIntent('واقف بجانب السيارة بعدسة 75mm');
  const b = analyzeOutsideIntent('واقف بجانب السيارة بعدسة 75mm');
  assert.deepEqual(a, b);
  assert.equal(a.recommended.cameraLens, 'rear-tele-70');
  assert.equal(a.recommended.captureMode, 'remote-rear');
  assert.equal(a.recommended.focalLength, 70);
});

test('front camera cannot retain Leica color profile', () => {
  const s = inside({ colorProfile: 'leica-authentic' });
  assert.equal(s.colorProfile, 'front-natural');
  assert.deepEqual(compatibleOptions('colorProfile', s).map((item) => item.id), ['front-natural', 'front-balanced']);
});

test('hardware focal and aperture override attempted drift', () => {
  const s = normalizeCarState({ ...OUTSIDE_DEFAULT_STATE, mode: 'outside', cameraLens: 'rear-tele-70', focalLength: 75, aperture: 9 });
  assert.equal(s.focalLength, 70);
  assert.equal(s.aperture, 1.8);
});

test('inside intent stays deterministic and keeps front camera', () => {
  const a = analyzeInsideIntent('سيلفي ليلي داخل السيارة متوقفة بثوب أبيض وفوضى خفيفة');
  const b = analyzeInsideIntent('سيلفي ليلي داخل السيارة متوقفة بثوب أبيض وفوضى خفيفة');
  assert.deepEqual(a, b);
  assert.equal(a.recommended.mode, 'inside');
  assert.equal(a.recommended.cameraLens, 'front-21');
  assert.equal(a.recommended.clothing, 'white-thobe');
  assert.equal(a.recommended.clutterLevel, 'light');
});

test('outside intent selects standing pose from text', () => {
  const r = analyzeOutsideIntent('بالخارج بجانب السيارة متكئ على السيارة ليلًا');
  assert.equal(r.recommended.standingPose, 'lean-car');
  assert.equal(r.recommended.mode, 'outside');
});

test('inside handheld selfie enforces arm reach', () => {
  const s = inside({ captureMode: 'handheld-front', distance: 70 });
  assert.ok(validateCarState(s).some((item) => item.code === 'INSIDE_CAMERA_DISTANCE'));
  assert.equal(carValidationStatus(s).blocked, true);
});

test('moving inside driver blocks hand-held capture', () => {
  const s = inside({ vehicleState: 'moving', motion: 'moving', captureMode: 'handheld-front', gazeTarget: 'road' });
  assert.ok(validateCarState(s).some((item) => item.code === 'INSIDE_CAPTURE_MOTION' || item.code === 'HANDHELD_WHILE_MOVING'));
});

test('outside car must be stationary', () => {
  const s = outside({ vehicleState: 'moving' });
  assert.ok(validateCarState(s).some((item) => item.code === 'UNKNOWN_OPTION' || item.code === 'OUTSIDE_VEHICLE_STATIONARY'));
});

test('70mm outside remote capture requires realistic distance', () => {
  const s = outside({ captureMode: 'remote-rear', cameraLens: 'rear-tele-70', colorProfile: 'leica-authentic', lowLightProcessing: 'standard', distance: 120 });
  assert.ok(validateCarState(s).some((item) => item.code === 'TELE70_OUTSIDE_DISTANCE'));
});

test('fabric type filters from selected clothing', () => {
  const s = inside({ clothing: 'white-thobe' });
  const ids = compatibleOptions('fabricType', s).map((item) => item.id);
  assert.deepEqual(ids, ['cotton-poplin', 'poly-cotton']);
});

test('narrative keeps fixed hair density while validation enforces airflow compatibility', () => {
  const out = compileCarSelfieDetailed(outside({ hairMotion: 'light-breeze' }));
  assert.match(out, /Hair keeps its real density and hairline/i);
  const bad = inside({ hairMotion: 'light-breeze' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'HAIR_MOTION_MODE' || item.code === 'OUTDOOR_HAIR_MOTION_INSIDE'));
});

test('narrative emits natural skin and facial detail without technical muscle lists', () => {
  const out = compileCarSelfieDetailed(outside({ expression: 'small-smile', skinDetail: 'fine-lines' }));
  assert.match(out, /slight natural closed-mouth smile/i);
  assert.match(out, /visible pores|fine facial texture/i);
  assert.doesNotMatch(out, /zygomatic activation|orbicularis/i);
});

test('legacy technical output retains explicit physical light causality', () => {
  const out = compileCarSelfieTechnicalSpec(outside({ time: 'day', externalLight: 'day-direct-sun', lowLightProcessing: 'standard' }));
  assert.match(out, /second opposing shadow requires a real second source/i);
  assert.match(out, /never create physical illumination/i);
});

test('legacy outside technical output retains body reflection and tire grounding rules', () => {
  const out = compileCarSelfieTechnicalSpec(outside());
  assert.match(out, /Paint reflections are environment-dependent/i);
  assert.match(out, /tires contact the ground/i);
  assert.match(out, /Fresnel reflection/i);
});

test('narrative clutter obeys gravity and remains absent from outside mode', () => {
  const inOut = compileCarSelfieDetailed(inside({ clutterLevel: 'moderate' }));
  assert.match(inOut, /at most two clearly visible supported items/i);
  assert.match(inOut, /gravity/i);
  const exOut = compileCarSelfieDetailed(outside());
  assert.doesNotMatch(exOut, /clutter|loose object/i);
});

test('strict blocks errors while auto reports without blocking', () => {
  const badStrict = inside({ distance: 80, physicsMode: 'strict' });
  const badAuto = inside({ distance: 80, physicsMode: 'auto' });
  assert.equal(carValidationStatus(badStrict).blocked, true);
  assert.equal(carValidationStatus(badAuto).blocked, false);
  assert.ok(carValidationStatus(badAuto).issues.some((item) => item.severity === 'error'));
});

test('negative prompt is unified across modes', () => {
  assert.equal(compileCarSelfieNegative(inside()), NEGATIVE_LIST);
  assert.equal(compileCarSelfieNegative(outside()), NEGATIVE_LIST);
});

test('narrative embeds anti-AI realism as natural visual description', () => {
  for (const s of [inside(), outside()]) {
    const out = compileCarSelfieDetailed(s);
    assert.match(out, /visible pores/i);
    assert.match(out, /flyaways/i);
    assert.match(out, /fabric fibers/i);
    assert.match(out, /corneal catchlights/i);
    assert.match(out, /natural asymmetry/i);
  }
});

test('negative prompt contains the V9 compact anti-AI list', () => {
  const neg = compileCarSelfieNegative(inside());
  for (const token of ['no CGI','no 3D render','no plastic skin','no airbrushed skin','no beauty filter','no brand logos','no readable text','no mirrored cabin','no floating objects','no impossibly symmetric face','no perfectly centered composition','no perfectly level camera']) {
    assert.ok(neg.toLowerCase().includes(token.toLowerCase()), `missing V9 negative token: ${token}`);
  }
});

test('JSON output is deterministic and records inactive mode exclusion', () => {
  const s = outside({ initialRequest: 'واقف بجانب السيارة' });
  const a = compileCarSelfieJson(s);
  const b = compileCarSelfieJson(s);
  assert.equal(a, b);
  const json = JSON.parse(a);
  assert.equal(json.activeMode, 'outside');
  assert.equal(json.inactiveModeExcluded, 'inside');
  assert.equal(json.version, 'car-selfie-v9-narrative');
});
