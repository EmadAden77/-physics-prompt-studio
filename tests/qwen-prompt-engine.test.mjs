import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQwenRepairBrief,
  buildQwenSceneBrief,
  validateQwenCoverage
} from '../core/qwen-prompt-engine.js';

const strictOfficeSelfie = {
  sceneType: 'office_selfie',
  sceneTypeLabel: 'سيلفي مكتب',
  location: 'مساحة عمل مشتركة',
  clothing: 'قميص كحلي + بنطال بيج',
  hairStyle: 'ممشط للخلف مع رفع خفيف',
  pose: 'اليد الحرة في الجيب',
  angle: 'ذكي — زاوية حتمية حسب Seed',
  lighting: 'مكتب — LED أبيض',
  camera: 'Xiaomi 15 Ultra — Front',
  aspectRatio: '9:16 عمودي',
  expression: 'محايد هادئ',
  backgroundActivity: 'طبيعي',
  realismLevel: 'واقعية صارمة',
  framing: 'من الصدر'
};

test('Qwen scene brief preserves explicit selected fields', () => {
  const brief = buildQwenSceneBrief(strictOfficeSelfie, 'Keep the office ordinary.');

  assert.match(brief, /Xiaomi 15 Ultra/);
  assert.match(brief, /9:16/);
  assert.match(brief, /LED/);
  assert.match(brief, /اليد الحرة في الجيب/);
  assert.match(brief, /Keep the office ordinary/);
  assert.match(brief, /hard scene facts/);
});

test('Qwen coverage catches the omissions seen in generic office output', () => {
  const generic = 'An ordinary selfie in a Saudi coworking space with a navy shirt, beige trousers, a calm expression, office furniture and natural imperfections.';
  const result = validateQwenCoverage(generic, strictOfficeSelfie);

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('vertical 9:16 composition'));
  assert.ok(result.missing.includes('selected Xiaomi 15 Ultra camera'));
  assert.ok(result.missing.includes('front-camera capture'));
  assert.ok(result.missing.includes('believable selfie camera geometry'));
  assert.ok(result.missing.includes('selected LED light source'));
  assert.ok(result.missing.includes('selected hand-in-pocket pose'));
  assert.ok(result.missing.includes('strict photographic realism cues'));
});

test('Qwen coverage accepts a physically explicit strict-realism selfie prompt', () => {
  const complete = `A vertical 9:16 subject-held selfie captured with the Xiaomi 15 Ultra front camera at realistic arm's-length distance with near-field smartphone perspective. The free hand rests naturally in the trouser pocket with believable elbow angle, shoulder response and cloth tension. The Saudi coworking office is illuminated by overhead white LED fixtures with coherent highlights, shadows and light falloff. Preserve visible skin texture, slight facial asymmetry, fabric wrinkles, mild edge softness and restrained computational HDR.`;
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
