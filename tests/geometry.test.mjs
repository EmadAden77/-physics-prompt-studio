import test from 'node:test';
import assert from 'node:assert/strict';
import { equivalentFrameDimensionsMm, fieldCoverageCm, minimumGroupWidthCm } from '../core/geometry.js';

const fullFrameDiagonal = Math.hypot(36, 24);

test('equivalent frame preserves 35mm-format diagonal for every aspect ratio', () => {
  for (const ratio of ['9:16', '4:5', '1:1', '16:9', '3:2']) {
    const frame = equivalentFrameDimensionsMm(ratio);
    assert.ok(Math.abs(Math.hypot(frame.widthMm, frame.heightMm) - fullFrameDiagonal) < 1e-9);
  }
});

test('coverage is deterministic and scales linearly with distance', () => {
  const a = fieldCoverageCm({ ratioId: '9:16', focalLengthEqMm: 24, distanceCm: 50 });
  const b = fieldCoverageCm({ ratioId: '9:16', focalLengthEqMm: 24, distanceCm: 100 });
  assert.equal(a.widthCm * 2, b.widthCm);
  assert.equal(a.heightCm * 2, b.heightCm);
  assert.ok(a.heightCm > 50 && a.heightCm < 105, 'default selfie geometry should fit chest-up envelope');
});

test('group width model is monotonic and bounded', () => {
  assert.equal(minimumGroupWidthCm(1), 35);
  assert.equal(minimumGroupWidthCm(5), 195);
  assert.throws(() => minimumGroupWidthCm(0), RangeError);
  assert.throws(() => minimumGroupWidthCm(6), RangeError);
});

test('geometry rejects invalid public inputs', () => {
  assert.throws(() => equivalentFrameDimensionsMm('unknown'), RangeError);
  assert.throws(() => fieldCoverageCm({ ratioId: '9:16', focalLengthEqMm: 0, distanceCm: 50 }), RangeError);
});
