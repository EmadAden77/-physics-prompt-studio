import {
  COMMON_CATALOG,
  applyCommonIntent,
  commonCompatibility,
  getCameraOptic,
  normalizeCommonDerivedState,
  normalizeIntentText
} from './carSelfieCommonCatalog.js';

const freeze = (items) => Object.freeze(items.map((item) => Object.freeze({ ...item })));

export const OUTSIDE_VEHICLE_STATES = freeze([
  { id: 'parked-off', label: 'متوقفة ومطفأة', moving: false, prompt: 'parked and fully stationary with the engine off' },
  { id: 'parked-engine-on', label: 'متوقفة والمحرك يعمل', moving: false, prompt: 'parked and fully stationary with the engine running' }
]);

export const OUTSIDE_CAPTURE_MODES = freeze([
  {
    id: 'handheld-front',
    label: 'سيلفي يدوي بالكاميرا الأمامية',
    allowedLensIds: ['front-21'],
    phoneHeld: true,
    distanceRangeCm: [30, 50],
    maxAbsYawDeg: 40,
    maxAbsPitchDeg: 30,
    maxAbsRollDeg: 12,
    prompt: 'genuine subject-held Xiaomi 15 Ultra front-camera selfie while standing beside the parked vehicle'
  },
  {
    id: 'remote-rear',
    label: 'هاتف ثابت/ريموت بالخلفية',
    allowedLensIds: ['rear-main-23', 'rear-tele-70'],
    phoneHeld: false,
    distanceRangeCm: [100, 600],
    maxAbsYawDeg: 50,
    maxAbsPitchDeg: 30,
    maxAbsRollDeg: 8,
    prompt: 'Xiaomi 15 Ultra rear camera is physically fixed on a stable support and triggered by timer or remote; this is a self-portrait, not a hand-held selfie'
  }
]);

export const OUTSIDE_STANDING_POSES = freeze([
  {
    id: 'driver-door',
    label: 'واقف بجانب باب السائق',
    prompt: 'standing naturally beside the driver door with believable foot spacing, pelvis balance, shoulder orientation and no body intersection with the vehicle'
  },
  {
    id: 'lean-car',
    label: 'متكئ على السيارة',
    prompt: 'lightly leaning on a rigid body panel with visible contact, small clothing compression and body weight still supported through the feet; never dent the car unnaturally'
  },
  {
    id: 'open-rear-door',
    label: 'يفتح الباب الخلفي',
    prompt: 'opening the rear door with a reachable arm arc, realistic hand contact on the handle, door hinge geometry and body clearance'
  },
  {
    id: 'look-camera',
    label: 'واقف وينظر للكاميرا',
    prompt: 'standing beside the vehicle with relaxed weight distribution and gaze naturally aligned to the camera position'
  },
  {
    id: 'look-car',
    label: 'واقف وينظر للسيارة',
    prompt: 'standing close to the vehicle while turning the head and upper torso naturally toward the car without twisting the spine unnaturally'
  }
]);

export const OUTSIDE_FRAMINGS = freeze([
  { id: 'chest-up-car-context', label: 'صدر وفوق + جزء من السيارة', prompt: 'chest-up self-portrait with a physically reachable slice of the nearby vehicle visible' },
  { id: 'half-body-car', label: 'نصف جسم مع السيارة', prompt: 'half-body framing with enough vehicle context to show real contact and standing geometry' },
  { id: 'three-quarter-car', label: 'ثلاثة أرباع الجسم مع السيارة', prompt: 'three-quarter-body framing with ground contact, vehicle wheel/body context and believable camera distance' }
]);

export const OUTSIDE_PAINT_CONDITIONS = freeze([
  { id: 'clean-gloss', label: 'طلاء نظيف لامع', prompt: 'clean glossy automotive paint with environment reflections warped by the real body curvature and bounded by panel orientation' },
  { id: 'light-dust', label: 'غبار خفيف على الطلاء', prompt: 'light realistic dust film softening some reflections while leaving clearer wiped/contact areas and no uniform CGI coating' },
  { id: 'road-wear', label: 'أثر استخدام يومي خفيف', prompt: 'subtle road film and tiny realistic surface variation without fake damage or exaggerated scratches' }
]);

export const OUTSIDE_CATALOG = Object.freeze({
  ...COMMON_CATALOG,
  vehicleState: OUTSIDE_VEHICLE_STATES,
  captureMode: OUTSIDE_CAPTURE_MODES,
  standingPose: OUTSIDE_STANDING_POSES,
  framing: OUTSIDE_FRAMINGS,
  paintCondition: OUTSIDE_PAINT_CONDITIONS
});

export const OUTSIDE_DEFAULT_STATE = Object.freeze(normalizeCommonDerivedState({
  mode: 'outside',
  initialRequest: '',
  referenceAttached: false,
  referenceRole: 'identity-only',
  vehicleProfile: 'l494-2017-white',
  vehicleState: 'parked-off',
  motion: 'stationary',
  captureMode: 'handheld-front',
  cameraLens: 'front-21',
  colorProfile: 'front-natural',
  lowLightProcessing: 'front-night-balanced',
  time: 'night',
  place: 'public-parking',
  weather: 'dry-clear',
  externalLight: 'night-parking-led',
  physicsMode: 'strict',
  apparentAge: 35,
  expression: 'neutral',
  gazeTarget: 'camera',
  skinDetail: 'natural-pores',
  clothing: 'polo',
  fabricType: 'pique-cotton',
  fabricSheen: 'matte',
  wrinkleProfile: 'natural',
  hairProfile: 'reference-locked',
  hairMotion: 'still',
  hairSpecular: 'natural-low',
  standingPose: 'driver-door',
  framing: 'chest-up-car-context',
  paintCondition: 'clean-gloss',
  focalLength: 21,
  aperture: 2.0,
  distance: 45,
  yaw: 0,
  pitch: 0,
  roll: 2,
  exposure: 'natural',
  hdr: 'auto-realistic',
  whiteBalance: 'auto',
  notes: ''
}));

const outsideOption = (field, id) => (OUTSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;

export function isOutsideOptionCompatible(field, id, state) {
  if ((COMMON_CATALOG[field] || []).length && !commonCompatibility(field, id, state)) return false;
  const item = outsideOption(field, id);
  if (!item) return false;
  const capture = outsideOption('captureMode', state.captureMode);
  const lens = getCameraOptic(state.cameraLens);

  if (field === 'cameraLens' && !capture?.allowedLensIds.includes(item.id)) return false;
  if (field === 'captureMode') return true;
  if (field === 'lowLightProcessing' && item.stationaryOnly && state.vehicleState !== 'parked-off' && state.vehicleState !== 'parked-engine-on') return false;
  if (field === 'hairMotion' && item.id === 'cabin-airflow') return false;
  if (field === 'gazeTarget' && id === 'road') return false;
  return true;
}

export function analyzeOutsideIntent(request = '', base = OUTSIDE_DEFAULT_STATE) {
  const common = applyCommonIntent(request, { ...base, mode: 'outside', motion: 'stationary' });
  const text = normalizeIntentText(request);
  const next = { ...common.next, mode: 'outside', vehicleState: 'parked-off', motion: 'stationary' };
  const tags = [...common.tags, 'outside'];

  if (/(75\s*mm|70\s*mm|مقربة|telephoto)/.test(text)) {
    next.captureMode = 'remote-rear';
    next.cameraLens = 'rear-tele-70';
    next.colorProfile = 'leica-authentic';
    next.distance = 220;
    next.framing = 'half-body-car';
    tags.push('remote-70mm');
  } else if (/(23\s*mm|خلفية|rear camera)/.test(text)) {
    next.captureMode = 'remote-rear';
    next.cameraLens = 'rear-main-23';
    next.colorProfile = 'leica-authentic';
    next.distance = 160;
    tags.push('remote-23mm');
  } else {
    next.captureMode = 'handheld-front';
    next.cameraLens = 'front-21';
    next.colorProfile = 'front-natural';
    next.distance = 45;
  }

  if (/(متكئ|lean)/.test(text)) next.standingPose = 'lean-car';
  else if (/(يفتح الباب الخلفي|rear door)/.test(text)) next.standingPose = 'open-rear-door';
  else if (/(ينظر للسيارة|look.*car)/.test(text)) { next.standingPose = 'look-car'; next.gazeTarget = 'car'; }
  else if (/(ينظر للكاميرا|look.*camera)/.test(text)) { next.standingPose = 'look-camera'; next.gazeTarget = 'camera'; }
  else if (/(باب السائق|driver door)/.test(text)) next.standingPose = 'driver-door';

  if (/(غبار على السيارة|dusty car|غبار خفيف)/.test(text)) next.paintCondition = 'light-dust';
  if (/(نسمة|breeze)/.test(text)) next.hairMotion = 'light-breeze';
  if (/(هواء متوسط|windy)/.test(text)) next.hairMotion = 'moderate-breeze';

  const normalized = normalizeCommonDerivedState(next);
  return Object.freeze({ normalized: text, tags: Object.freeze(tags), recommended: normalized });
}
