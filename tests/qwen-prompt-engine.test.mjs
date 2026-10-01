import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeterministicCoverageAnchor,
  buildQwenRepairBrief,
  buildQwenSceneBrief,
  validateQwenCoverage
} from '../core/qwen-prompt-engine.js';

const strictOfficeSelfie = {
  sceneType: 'office_selfie',
  sceneTypeLabel: 'سيلفي مكتب',
  captureType: 'subject-held front-camera smartphone selfie',
  location: 'مساحة عمل مشتركة',
  clothing: 'a navy band-collar shirt with light-grey tailored trousers',
  clothingLabel: 'قميص كحلي بياقة دائرية + بنطال رمادي فاتح',
  hairStyle: 'ممشط للخلف مع رفع خفيف',
  pose: 'اليد الحرة في الجيب',
  angle: 'front camera slightly above eye level at a subtle three-quarter angle',
  angleMode: 'smart',
  lighting: 'مكتب — LED أبيض',
  camera: 'Xiaomi 15 Ultra front camera with a natural wide selfie look',
  cameraLabel: 'Xiaomi 15 Ultra — Front',
  aspectRatio: '9:16 عمودي',
  expression: 'محايد هادئ',
  backgroundActivity: 'طبيعي',
  realismLevel: 'واقعية صارمة',
  framing: 'chest-up framing',
  framingLabel: 'من الصدر'
};

test('Qwen scene brief preserves resolved camera and explicit selected fields', () => {
  const brief = buildQwenSceneBrief(strictOfficeSelfie, 'Keep the office ordinary.');

  assert.match(brief, /subject-held front-camera smartphone selfie/);
  assert.match(brief, /Resolved camera angle: front camera slightly above eye level/);
  assert.match(brief, /Xiaomi 15 Ultra/);
  assert.match(brief, /9:16/);
  assert.match(brief, /LED/);
  assert.match(brief, /chest-up framing/);
  assert.match(brief, /Keep the office ordinary/);
  assert.match(brief, /hard scene facts/);
});

test('Qwen coverage catches generic office omissions and contamination', () => {
  const generic = 'An ordinary selfie in a Saudi coworking space with a navy shirt, a calm expression, office furniture, natural imperfections, and ordinary vehicles when relevant.';
  const result = validateQwenCoverage(generic, strictOfficeSelfie);

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('vertical 9:16 composition'));
  assert.ok(result.missing.includes('selected Xiaomi 15 Ultra camera'));
  assert.ok(result.missing.includes('front-camera capture'));
  assert.ok(result.missing.includes('believable selfie camera geometry'));
  assert.ok(result.missing.some((item) => item.startsWith('resolved camera angle:')));
  assert.ok(result.missing.includes('selected chest-up framing'));
  assert.ok(result.missing.includes('selected LED light source'));
  assert.ok(result.missing.includes('selected hand-in-pocket pose'));
  assert.ok(result.missing.includes('selected clothing color: light grey'));
  assert.ok(result.missing.includes('office-only background without vehicles, streets or traffic'));
  assert.ok(result.missing.includes('strict photographic realism cues'));
});

test('Qwen coverage accepts a physically explicit strict-realism office selfie prompt', () => {
  const complete = `A vertical 9:16 subject-held selfie captured with the Xiaomi 15 Ultra front camera at realistic arm's-length distance with near-field smartphone perspective. Use the front camera slightly above eye level at a subtle three-quarter angle, framed chest-up. The subject wears a navy band-collar shirt with light-grey tailored trousers. The free hand rests naturally in the trouser pocket with believable elbow angle, shoulder response and cloth tension. The Saudi coworking office is illuminated by overhead white LED fixtures with coherent highlights, shadows and light falloff. Preserve visible skin texture, slight facial asymmetry, fabric wrinkles, mild edge softness and restrained computational HDR.`;
  const result = validateQwenCoverage(complete, strictOfficeSelfie);

  assert.deepEqual(result, { ok: true, missing: [] });
});

test('Qwen repair brief asks for one coherent correction instead of negative-prompt stacking', () => {
  const repair = buildQwenRepairBrief('Camera: Xiaomi 15 Ultra — Front', 'An ordinary office selfie.', [
    'selected Xiaomi 15 Ultra camera',
    'physical lighting causality'
  ]);

  assert.match(repair, /Revise the previous image prompt once/);
  assert.match(repair, /selected Xiaomi 15 Ultra camera/);
  assert.match(repair, /physical lighting causality/);
  assert.match(repair, /Keep the same scene intent/);
});

test('deterministic coverage anchor restores hard scene facts after one repair pass', () => {
  const anchor = buildDeterministicCoverageAnchor(strictOfficeSelfie, [
    'selected Xiaomi 15 Ultra camera',
    'front-camera capture',
    `resolved camera angle: ${strictOfficeSelfie.angle}`,
    'selected chest-up framing',
    'selected clothing color: light grey',
    'office-only background without vehicles, streets or traffic'
  ]);

  assert.match(anchor, /Xiaomi 15 Ultra front camera/);
  assert.match(anchor, /slightly above eye level/);
  assert.match(anchor, /chest-up framing/);
  assert.match(anchor, /light-grey tailored trousers/);
  assert.match(anchor, /no vehicles, streets, roadway or traffic elements/);
});
