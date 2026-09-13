import { ASPECT_RATIOS } from '../data/catalog.js';

const FULL_FRAME_DIAGONAL_MM = Math.hypot(36, 24);
const ratioMap = new Map(ASPECT_RATIOS.map((ratio) => [ratio.id, ratio]));

function assertPositiveFinite(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive finite number`);
}

export function equivalentFrameDimensionsMm(ratioId) {
  const ratio = ratioMap.get(ratioId);
  if (!ratio) throw new RangeError(`unknown aspect ratio: ${ratioId}`);
  const scale = FULL_FRAME_DIAGONAL_MM / Math.hypot(ratio.width, ratio.height);
  return Object.freeze({
    widthMm: ratio.width * scale,
    heightMm: ratio.height * scale,
    diagonalMm: FULL_FRAME_DIAGONAL_MM
  });
}

export function fieldCoverageCm({ ratioId, focalLengthEqMm, distanceCm }) {
  assertPositiveFinite(focalLengthEqMm, 'focalLengthEqMm');
  assertPositiveFinite(distanceCm, 'distanceCm');
  const frame = equivalentFrameDimensionsMm(ratioId);
  return Object.freeze({
    widthCm: distanceCm * frame.widthMm / focalLengthEqMm,
    heightCm: distanceCm * frame.heightMm / focalLengthEqMm
  });
}

export function minimumGroupWidthCm(people) {
  if (!Number.isInteger(people) || people < 1 || people > 5) throw new RangeError('people must be an integer from 1 to 5');
  return 35 + (people - 1) * 40;
}
