import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAR_DEFAULT_STATE,
  CAR_CAMERA_LENSES,
  CAR_CLOTHING,
  CAR_PLACES,
  FABRIC_LIBRARY,
  XIAOMI_15_ULTRA_PROFILE,
  analyzeCarSelfieIntent,
  getCameraOptic,
  getClutterItems,
  getFabricProfile,
  isCarOptionCompatible
} from '../data/carSelfieCatalog.js';
import { normalizeCarState, validateCarState, carValidationStatus } from '../core/carSelfieValidation.js';
import { compileCarSelfieDetailed, compileCarSelfieJson, compileCarSelfieNegative } from '../core/carSelfieCompiler.js';

const state = (patch = {}) => ({ ...structuredClone(CAR_DEFAULT_STATE), ...patch });

test('intent analysis is deterministic', () => {
  const q = 'سيلفي ليلي داخل رنج روفر 2017 متوقفة، ثوب أبيض، بدون ابتسامة';
  assert.deepEqual(analyzeCarSelfieIntent(q), analyzeCarSelfieIntent(q));
  const r = analyzeCarSelfieIntent(q).recommended;
  assert.equal(r.time, 'night');
  assert.equal(r.vehicleProfile, 'l494-2017-white');
  assert.equal(r.vehicleState, 'parked-engine-on');
  assert.equal(r.clothing, 'white-thobe');
  assert.equal(r.expression, 'neutral');
});

test('Xiaomi 15 Ultra hardware profile is locked to real optical values', () => {
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.main23.focalLengthEqMm, 23);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.main23.aperture, 1.63);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.tele70.focalLengthEqMm, 70);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.rear.tele70.aperture, 1.8);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.front.megapixels, 32);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.front.aperture, 2.0);
  assert.equal(XIAOMI_15_ULTRA_PROFILE.front.focus, 'fixed');
  assert.ok(!CAR_CAMERA_LENSES.some((lens) => lens.focalLengthEqMm === 75));
});

test('legacy or user-entered focal/aperture values cannot override selected hardware', () => {
  const s = normalizeCarState(state({ cameraLens: 'rear-main-23', focalLength: 75, aperture: 9 }));
  assert.equal(s.focalLength, 23);
  assert.equal(s.aperture, 1.63);
});

test('75mm intent deterministically maps to official 70mm telephoto', () => {
  const analysis = analyzeCarSelfieIntent('استخدم عدسة 75mm داخل السيارة');
  assert.equal(analysis.recommended.cameraLens, 'rear-tele-70');
  assert.ok(analysis.tags.includes('75→70-official'));
});

test('front selfie cannot use Leica color profile', () => {
  const s = state({ captureMode: 'handheld-front', cameraLens: 'front-21', colorProfile: 'leica-authentic' });
  assert.equal(isCarOptionCompatible('colorProfile', 'leica-authentic', s), false);
  assert.ok(validateCarState(s).some((item) => item.code === 'COLOR_PROFILE_CAMERA_CONFLICT'));
});

test('handheld front selfie enforces 30-50cm arm reach', () => {
  const bad = state({ distance: 65 });
  assert.ok(validateCarState(bad).some((item) => item.code === 'ARM_REACH_DISTANCE'));
  assert.equal(carValidationStatus(bad).blocked, true);
  const good = state({ distance: 45 });
  assert.ok(!validateCarState(good).some((item) => item.code === 'ARM_REACH_DISTANCE'));
});

test('moving driver requires mounted camera and compatible hands', () => {
  const r = analyzeCarSelfieIntent('سيلفي ليلي أثناء القيادة على الطريق').recommended;
  assert.equal(r.vehicleState, 'moving');
  assert.equal(r.captureMode, 'dashboard-fixed');
  assert.equal(r.handPose, 'both-hands-wheel');
  const bad = state({ vehicleState: 'moving', captureMode: 'handheld-front', handPose: 'phone-outside-frame' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'HANDHELD_WHILE_MOVING'));
});

test('multi-frame night processing is blocked while moving', () => {
  const bad = state({ vehicleState: 'moving', captureMode: 'dashboard-fixed', cameraLens: 'rear-main-23', colorProfile: 'leica-authentic', lowLightProcessing: 'rear-super-night-2', handPose: 'both-hands-wheel', place: 'highway-service-road', externalLight: 'night-led-street' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'MULTIFRAME_WHILE_MOVING'));
});

test('Saudi places encode road, curb, vegetation and stranger privacy', () => {
  for (const place of CAR_PLACES) {
    assert.ok(place.surface);
    assert.ok(place.curb);
    assert.ok(place.vegetation);
    assert.ok(place.people);
    assert.match(place.people, /(face|faces|anonymous|identifiable|unrecognizable|unreadable)/i);
  }
});

test('Saudi place catalog contains no named city or famous landmark', () => {
  const text = JSON.stringify(CAR_PLACES).toLowerCase();
  for (const forbidden of ['riyadh', 'jeddah', 'mecca', 'medina', 'الرياض', 'جدة', 'مكة', 'المدينة', 'kingdom centre', 'برج المملكة']) assert.ok(!text.includes(forbidden), `named location leaked: ${forbidden}`);
});

test('weather must match place physics', () => {
  const bad = state({ place: 'underground-parking', weather: 'coastal-humid', externalLight: 'underground-led' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'WEATHER_PLACE_CONFLICT'));
});

test('day and night light sources cannot cross time domains', () => {
  const bad = state({ time: 'night', externalLight: 'day-direct-sun' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'EXTERNAL_LIGHT_TIME'));
});

test('physical lighting output forbids unexplained second shadows and HDR relighting', () => {
  const out = compileCarSelfieDetailed(state());
  assert.match(out, /second shadow direction/i);
  assert.match(out, /never create illumination/i);
  assert.match(out, /dashboard/i);
});

test('every clothing option has a physical fabric profile', () => {
  assert.ok(Object.keys(FABRIC_LIBRARY).length >= 8);
  assert.ok(CAR_CLOTHING.length >= 20);
  for (const clothing of CAR_CLOTHING) {
    const fabric = getFabricProfile(clothing.id);
    assert.ok(fabric, `missing fabric for ${clothing.id}`);
    assert.ok(fabric.roughness);
    assert.ok(fabric.wrinkle);
    assert.ok(fabric.light);
    assert.ok(fabric.compression);
  }
});

test('compiler emits fabric physics for selected clothing', () => {
  const out = compileCarSelfieDetailed(state({ clothing: 'linen-shirt' }));
  assert.match(out, /FABRIC PHYSICS/i);
  assert.match(out, /linen|كتان/i);
  assert.match(out, /creases/i);
});

test('hair density remains locked regardless of lighting and window state', () => {
  const out = compileCarSelfieDetailed(state({ hairProfile: 'short-wavy', windowState: 'open' }));
  assert.match(out, /HAIR DENSITY LOCK/i);
  assert.match(out, /remain constant/i);
  assert.match(out, /real airflow/i);
});

test('closed windows forbid exterior wind-driven hair motion', () => {
  const out = compileCarSelfieDetailed(state({ windowState: 'closed', hairProfile: 'medium-wavy' }));
  assert.match(out, /exterior wind cannot move hair/i);
});

test('facial expression output includes muscle and skin micro-realism', () => {
  const out = compileCarSelfieDetailed(state({ expression: 'small-smile' }));
  assert.match(out, /Muscle basis/i);
  assert.match(out, /zygomatic/i);
  assert.match(out, /pores/i);
  assert.match(out, /waxy smoothing/i);
});

test('rear-view mirror mode enforces reflection law and rear camera', () => {
  const good = state({ captureMode: 'rearview-mirror', cameraLens: 'rear-main-23', colorProfile: 'leica-authentic', lowLightProcessing: 'rear-super-night-2', handPose: 'mirror-phone-held', distance: 90 });
  assert.match(compileCarSelfieDetailed(good), /equal incidence\/reflection angles/i);
  const bad = state({ captureMode: 'rearview-mirror', cameraLens: 'front-21', handPose: 'mirror-phone-held' });
  assert.ok(validateCarState(bad).some((item) => item.code === 'MIRROR_REAR_CAMERA_REQUIRED'));
});

test('clutter levels are deterministic and obey contact/gravity rules', () => {
  assert.equal(getClutterItems('clean').length, 0);
  assert.ok(getClutterItems('light').length >= 3);
  assert.ok(getClutterItems('heavy').length >= 8);
  const out = compileCarSelfieDetailed(state({ clutterLevel: 'heavy' }));
  assert.match(out, /Gravity is always downward/i);
  assert.match(out, /contact shadow/i);
  assert.match(out, /nothing floats/i);
});

test('strict mode blocks errors while auto mode only reports them', () => {
  const conflict = { time: 'night', externalLight: 'day-direct-sun' };
  assert.equal(carValidationStatus(state({ ...conflict, physicsMode: 'strict' })).blocked, true);
  const autoStatus = carValidationStatus(state({ ...conflict, physicsMode: 'auto' }));
  assert.equal(autoStatus.blocked, false);
  assert.ok(autoStatus.issues.some((item) => item.severity === 'error'));
});

test('LHD lock remains mandatory', () => {
  const out = compileCarSelfieDetailed(state());
  assert.match(out, /LEFT-HAND-DRIVE SPATIAL LOCK/);
  assert.match(out, /steering wheel physically left/i);
  assert.match(out, /center console physically to the driver’s right/i);
});

test('period-specific L494 rejects modern cluster', () => {
  assert.ok(validateCarState(state({ clusterType: 'modern-digital' })).some((item) => item.code === 'PERIOD_CABIN_CONFLICT'));
});

test('negative prompt guards camera, physics, privacy and density failures', () => {
  const neg = compileCarSelfieNegative();
  assert.match(neg, /no 75mm/i);
  assert.match(neg, /no Leica Authentic\/Vibrant on the front camera/i);
  assert.match(neg, /no changing hair density/i);
  assert.match(neg, /no floating clutter/i);
  assert.match(neg, /no clear identifiable stranger faces/i);
});

test('car JSON is deterministic', () => {
  const s = state({ initialRequest: 'ليل داخل سيارة فاخرة أمام مقهى محلي' });
  assert.equal(compileCarSelfieJson(s), compileCarSelfieJson(s));
});

test('catalog camera focal values are unique and authoritative', () => {
  assert.deepEqual(CAR_CAMERA_LENSES.map((lens) => lens.focalLengthEqMm), [21, 23, 70, 100]);
  for (const lens of CAR_CAMERA_LENSES) assert.equal(getCameraOptic(lens.id)?.focalLengthEqMm, lens.focalLengthEqMm);
});
