import { BEDROOM_POSES, SELFIE_POSES, SELFIE_ANGLES } from './scene-builder.js';
import { getPoseCameraHint } from './scene-compatibility.js';

function normalizeSeed(seed) {
  const numeric = Number(seed);
  if (!Number.isFinite(numeric)) return 42;
  return Math.trunc(numeric) || 42;
}

function hash(value = '') {
  let state = 2166136261;
  for (const char of String(value)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  return state >>> 0;
}

function seededRandom(seed) {
  let state = (normalizeSeed(seed) >>> 0) || 1;
  return function nextSeededValue() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function canonicalPoseValue(poseValue = '') {
  const bedroomPose = BEDROOM_POSES.find((pose) => pose.value === poseValue || pose.prompt === poseValue);
  if (bedroomPose) return bedroomPose.value;
  const selfiePose = SELFIE_POSES.find((pose) => pose.value === poseValue || pose.prompt === poseValue);
  return selfiePose?.value || String(poseValue || '');
}

function promptForAngle(value) {
  return SELFIE_ANGLES.find((angle) => angle.value === value)?.prompt || SELFIE_ANGLES.find((angle) => angle.value === 'eye_centered')?.prompt || 'front camera at approximately eye level';
}

export function getCandidatesForPose(poseValue, framing, sceneType) {
  const pose = canonicalPoseValue(poseValue);
  void sceneType;

  if (/^bed-(lying|reclining|propped)/.test(pose)) {
    return ['slightly_high_center', 'high_offcenter', 'eye_centered'];
  }

  if (/^bedroom-floor|floor_|squatting/.test(pose)) {
    return ['slightly_high_center', 'high_offcenter', 'eye_centered'];
  }

  if (/seated_|sofa-|chair_/.test(pose)) {
    return ['eye_centered', 'eye_three_quarter_left', 'eye_three_quarter_right', 'slightly_high_center'];
  }

  if (/standing_|stand-|lean_/.test(pose)) {
    return ['eye_centered', 'eye_three_quarter_left', 'eye_three_quarter_right', 'slightly_low_center', 'low_offcenter'];
  }

  if (/walking/.test(pose)) {
    return ['eye_three_quarter_left', 'eye_three_quarter_right', 'slightly_high_center', 'chest_up'];
  }

  if (/coffee|tea|cup|book/.test(pose)) {
    return ['close_face', 'chest_up', 'eye_centered'];
  }

  if (/close_face|close/.test(String(framing || ''))) {
    return ['close_face', 'eye_centered', 'slightly_high_center'];
  }

  if (framing === 'full_body' || framing === 'three_quarter') {
    return ['eye_centered', 'eye_three_quarter_left', 'eye_three_quarter_right', 'slightly_low_center'];
  }

  return ['eye_centered', 'eye_three_quarter_left', 'eye_three_quarter_right'];
}

export function resolveSmartAngle({ sceneType, poseValue, framing, time, seed = 42 } = {}) {
  void time;
  const bedroomHint = getPoseCameraHint(poseValue);
  if (bedroomHint) return bedroomHint;

  const candidates = getCandidatesForPose(poseValue, framing, sceneType);
  const mixedSeed = normalizeSeed(seed) + hash(`${canonicalPoseValue(poseValue)}|${sceneType || ''}|${framing || ''}`);
  const rng = seededRandom(mixedSeed);
  const picked = candidates[Math.floor(rng() * candidates.length)] || 'eye_centered';
  return promptForAngle(picked);
}
