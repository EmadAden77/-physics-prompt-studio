import { SELFIE_ANGLES } from './scene-builder.js';
import { compatibleOptions, getPoseCameraHint, MIRROR_ANGLES, THIRD_PERSON_ANGLES } from './scene-compatibility.js';

const SMART_ANGLE_VALUE = 'smart';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSeed(seed) {
  const numeric = Number(seed);
  if (!Number.isFinite(numeric)) return 42;
  return Math.min(999999, Math.max(1, Math.trunc(numeric)));
}

function seededIndex(seed, length) {
  if (!length) return -1;
  let value = normalizeSeed(seed) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) % length;
}

function promptForExplicitAngle(angle, captureType) {
  const value = clean(angle);
  if (!value || value === SMART_ANGLE_VALUE) return '';
  const capture = clean(captureType).toLowerCase();
  const catalog = capture.includes('third-person')
    ? THIRD_PERSON_ANGLES
    : capture.includes('mirror')
      ? MIRROR_ANGLES
      : SELFIE_ANGLES;
  return catalog.find((item) => item.value === value || item.prompt === value)?.prompt || value;
}

function smartSelfieAngle(sceneType, seed) {
  const candidates = compatibleOptions(sceneType || 'front_selfie', 'angle', SELFIE_ANGLES);
  if (!candidates.length) return '';
  return candidates[seededIndex(seed, candidates.length)]?.prompt || '';
}

export function resolveCameraAngle({
  sceneType = 'front_selfie',
  requestedSceneType = '',
  captureType = '',
  pose = '',
  angle = '',
  seed = 42,
  time = ''
} = {}) {
  void time;
  const requested = clean(requestedSceneType) || clean(sceneType);
  const capture = clean(captureType).toLowerCase();
  const bedroomSelfie = requested === 'bedroom_selfie' || requested === 'bedroom_mirror_selfie';
  const poseHint = bedroomSelfie ? getPoseCameraHint(pose) : null;
  if (poseHint) return poseHint;

  const explicit = promptForExplicitAngle(angle, captureType);
  if (explicit) return explicit;

  const wantsSmart = clean(angle) === SMART_ANGLE_VALUE;
  const smartAllowed = wantsSmart && !capture.includes('third-person') && !capture.includes('mirror');
  if (smartAllowed) {
    const smart = smartSelfieAngle(sceneType, seed);
    if (smart) return smart;
  }

  if (requested === 'bedroom_mirror_selfie' || capture.includes('mirror')) {
    return 'mirror-view camera at eye level, phone visible in reflection';
  }
  if (capture.includes('third-person')) {
    return 'Use a natural third-person smartphone angle appropriate to the framing.';
  }
  if (requested === 'bedroom_selfie') {
    return 'front camera at eye level with a tiny natural handheld roll';
  }
  return 'Use a natural eye-level or slightly off-axis camera angle.';
}

export { SMART_ANGLE_VALUE };
