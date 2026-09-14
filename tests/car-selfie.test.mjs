import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCarModeFromIntent, XIAOMI_15_ULTRA_PROFILE } from '../data/carSelfieCommonCatalog.js';
import { INSIDE_DEFAULT_STATE, analyzeInsideIntent, isInsideOptionCompatible } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE, analyzeOutsideIntent, isOutsideOptionCompatible } from '../data/carSelfieOutsideCatalog.js';
import { carValidationStatus, compatibleOptions, normalizeCarState, validateCarState } from '../core/carSelfieValidation.js';
import { compileCarSelfieDetailed, compileCarSelfieJson, compileCarSelfieNegative } from '../core/carSelfieCompiler.js';

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

test('inside compiler does not leak outside standing instructions', () => {
  const out = compileCarSelfieDetailed(inside());
  assert.match(out, /MODE: INSIDE CAR SELFIE ONLY/);
  assert.doesNotMatch(out, /STANDING POSE:/);
  assert.doesNotMatch(out, /PAINT & BODY PHYSICS:/);
});

test('outside compiler does not leak cabin clutter or seating instructions', () => {
  const out = compileCarSelfieDetailed(outside());
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

test('hair density lock is emitted and mode-specific motion is enforced', () => {
  const out = compileCarSelfieDetailed(outside({ hairMotion: 'light-breeze' }));
  assert.match(out, /Hair density and hairline are invariant/i);
  const bad = inside({ hairMotion: 'light-breeze' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'HAIR_MOTION_MODE' || item.code === 'OUTDOOR_HAIR_MOTION_INSIDE'));
});

test('facial anatomy and skin micro-detail are emitted', () => {
  const out = compileCarSelfieDetailed(outside({ expression: 'small-smile', skinDetail: 'fine-lines' }));
  assert.match(out, /zygomatic|muscle|Eye convergence|eyelid/i);
  assert.match(out, /pores|fine age-appropriate lines/i);
});

test('physical light causality forbids unexplained opposing shadows', () => {
  const out = compileCarSelfieDetailed(outside({ time: 'day', externalLight: 'day-direct-sun', lowLightProcessing: 'standard' }));
  assert.match(out, /second opposing shadow requires a real second source/i);
  assert.match(out, /never create physical illumination/i);
});

test('outside body reflection and tire grounding rules are emitted', () => {
  const out = compileCarSelfieDetailed(outside());
  assert.match(out, /Paint reflections are environment-dependent/i);
  assert.match(out, /tires contact the ground/i);
  assert.match(out, /Fresnel reflection/i);
});

test('inside clutter obeys gravity/contact and is absent outside', () => {
  const inOut = compileCarSelfieDetailed(inside({ clutterLevel: 'moderate' }));
  assert.match(inOut, /gravity|contact shadow/i);
  const exOut = compileCarSelfieDetailed(outside());
  assert.doesNotMatch(exOut, /INTERIOR CLUTTER:/);
});

test('strict blocks errors while auto reports without blocking', () => {
  const badStrict = inside({ distance: 80, physicsMode: 'strict' });
  const badAuto = inside({ distance: 80, physicsMode: 'auto' });
  assert.equal(carValidationStatus(badStrict).blocked, true);
  assert.equal(carValidationStatus(badAuto).blocked, false);
  assert.ok(carValidationStatus(badAuto).issues.some((item) => item.severity === 'error'));
});

test('negative prompt is mode-aware', () => {
  assert.match(compileCarSelfieNegative(inside()), /no exterior standing pose/i);
  assert.match(compileCarSelfieNegative(outside()), /no cabin clutter/i);
});

test('mandatory Anti-AI-Tells are emitted in both modes', () => {
  for (const s of [inside(), outside()]) {
    const out = compileCarSelfieDetailed(s);
    assert.match(out, /ANTI-AI-TELLS:/);
    assert.match(out, /skin pores/i);
    assert.match(out, /facial lines/i);
    assert.match(out, /stray hairs/i);
    assert.match(out, /corneal reflections/i);
    assert.match(out, /fabric fibers/i);
    assert.match(out, /natural asymmetries|natural texture/i);
  }
});

test('negative prompt contains the mandatory anti-AI blacklist', () => {
  for (const s of [inside(), outside()]) {
    const neg = compileCarSelfieNegative(s);
    for (const token of ['AI-generated look','plastic skin','over-smoothed skin','symmetric face','perfectly styled hair','glossy hair','uniform fabric','no wrinkles','HDR overprocessing','teal-orange grading','dual shadows without dual sources','floating objects','3D render','airbrushed','beauty filter','artificial depth of field','fake lens flare','perfect composition','centered framing','dead eyes','missing corneal reflections','extra fingers','deformed hands','gibberish text','watermark']) {
      assert.ok(neg.toLowerCase().includes(token.toLowerCase()), `missing anti-AI token: ${token}`);
    }
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
});
