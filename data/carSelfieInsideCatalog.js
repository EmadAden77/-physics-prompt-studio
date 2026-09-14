import {
  COMMON_CATALOG,
  applyCommonIntent,
  commonCompatibility,
  commonOption,
  getCameraOptic,
  normalizeCommonDerivedState,
  normalizeIntentText
} from './carSelfieCommonCatalog.js';

const freeze = (items) => Object.freeze(items.map((item) => Object.freeze({ ...item })));

export const INSIDE_VEHICLE_STATES = freeze([
  { id: 'parked-off', label: 'متوقفة ومطفأة', moving: false, prompt: 'parked and fully stationary with the vehicle off' },
  { id: 'parked-engine-on', label: 'متوقفة والمحرك يعمل', moving: false, prompt: 'parked and fully stationary with the vehicle powered on' },
  { id: 'stopped-traffic', label: 'متوقفة مؤقتًا', moving: false, prompt: 'temporarily stopped with zero vehicle motion' },
  { id: 'moving', label: 'تسير على الطريق', moving: true, prompt: 'moving normally on the road' }
]);

export const INSIDE_SEATS = freeze([
  { id: 'driver-left', label: 'السائق الأمامي الأيسر', role: 'driver', prompt: 'the subject is physically seated in the front-left driver seat of a left-hand-drive vehicle' },
  { id: 'front-passenger-right', label: 'الراكب الأمامي الأيمن', role: 'passenger', prompt: 'the subject is physically seated in the front-right passenger seat of a left-hand-drive vehicle' }
]);

export const INSIDE_CAPTURE_MODES = freeze([
  {
    id: 'handheld-front',
    label: 'سيلفي يدوي بالكاميرا الأمامية',
    phoneHeld: true,
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'],
    allowedLensIds: ['front-21'],
    distanceRangeCm: [30, 50],
    maxAbsYawDeg: 35,
    maxAbsPitchDeg: 25,
    maxAbsRollDeg: 10,
    prompt: 'genuine subject-held Xiaomi 15 Ultra front-camera selfie at natural arm reach; the rear Leica cameras are not used'
  },
  {
    id: 'dashboard-fixed-front',
    label: 'الهاتف مثبت على الداشبورد · أمامية',
    phoneHeld: false,
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'],
    allowedLensIds: ['front-21'],
    distanceRangeCm: [45, 120],
    maxAbsYawDeg: 45,
    maxAbsPitchDeg: 30,
    maxAbsRollDeg: 8,
    prompt: 'Xiaomi 15 Ultra is securely mounted on the dashboard using the front camera, aimed naturally toward the subject'
  },
  {
    id: 'console-fixed-front',
    label: 'الهاتف مثبت قرب الكونسول · أمامية',
    phoneHeld: false,
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'],
    allowedLensIds: ['front-21'],
    distanceRangeCm: [40, 105],
    maxAbsYawDeg: 50,
    maxAbsPitchDeg: 35,
    maxAbsRollDeg: 10,
    prompt: 'Xiaomi 15 Ultra is securely mounted near the center console using the front camera, with physically reachable placement and no floating support'
  }
]);

export const INSIDE_HAND_POSES = freeze([
  { id: 'phone-outside-frame', label: 'يد التصوير خارج الكادر', captureIds: ['handheld-front'], roles: ['driver', 'passenger'], motion: ['parked-off', 'parked-engine-on', 'stopped-traffic'], prompt: 'camera-holding hand, wrist and forearm stay outside the crop; the other arm remains anatomically supported' },
  { id: 'lap-relaxed', label: 'اليدان مرتاحتان', captureIds: ['dashboard-fixed-front', 'console-fixed-front'], roles: ['driver', 'passenger'], motion: ['parked-off', 'parked-engine-on', 'stopped-traffic'], prompt: 'both hands rest naturally near the lap or seat support with believable shoulder, elbow and wrist geometry' },
  { id: 'one-hand-wheel', label: 'يد على المقود', captureIds: ['dashboard-fixed-front'], roles: ['driver'], motion: ['parked-engine-on', 'stopped-traffic', 'moving'], prompt: 'one hand rests naturally on the steering wheel while the other remains physically supported' },
  { id: 'both-hands-wheel', label: 'اليدان على المقود', captureIds: ['dashboard-fixed-front'], roles: ['driver'], motion: ['moving', 'parked-engine-on'], prompt: 'both hands are naturally placed on the steering wheel with realistic shoulder, elbow and wrist angles' },
  { id: 'passenger-relaxed', label: 'يد الراكب مرتاحة', captureIds: ['dashboard-fixed-front', 'console-fixed-front'], roles: ['passenger'], motion: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'], prompt: 'the passenger keeps hands naturally supported and never touches the steering wheel' }
]);

export const INSIDE_FRAMINGS = freeze([
  { id: 'face-dominant', label: 'وجه قريب', prompt: 'close face-dominant framing' },
  { id: 'head-shoulders', label: 'رأس وكتف', prompt: 'head-and-shoulders framing' },
  { id: 'chest-up', label: 'من الصدر وفوق', prompt: 'chest-up framing' },
  { id: 'upper-torso-context', label: 'أعلى الجذع مع المقصورة', prompt: 'head-and-upper-torso framing with enough cabin context to establish seat and LHD geometry' }
]);

export const INSIDE_CABIN_MATERIALS = freeze([
  { id: 'ivory-leather-dark-wood', label: 'جلد عاجي + خشب داكن', prompt: 'Ivory perforated leather seats, dark polished wood trim, realistic stitching, pressure creases and low-gloss wear' },
  { id: 'black-leather-aluminum', label: 'جلد أسود + ألمنيوم', prompt: 'black leather seats with brushed aluminum trim, realistic grain and restrained reflections' },
  { id: 'beige-leather-matte', label: 'جلد بيج + تطعيم مطفي', prompt: 'beige leather seating with matte trim and realistic contact compression' },
  { id: 'fabric-practical', label: 'قماش عملي', prompt: 'ordinary woven fabric seats with practical plastic trim and believable texture variation' }
]);

export const INSIDE_CLUSTER_TYPES = freeze([
  { id: 'period-digital', label: 'عدادات مناسبة للفترة', prompt: 'period-correct digital instrument cluster with believable luminance and no futuristic graphics' },
  { id: 'analog-hybrid', label: 'عدادات تناظرية/رقمية', prompt: 'analog-hybrid instrument cluster with restrained backlighting' },
  { id: 'modern-digital', label: 'عدادات رقمية حديثة', prompt: 'modern digital instrument cluster with physically plausible emissive brightness', incompatibleVehicles: ['l494-2017-white'] }
]);

export const INSIDE_ROOFS = freeze([
  { id: 'panoramic', label: 'سقف بانورامي', prompt: 'panoramic glass roof with angle-dependent reflections consistent with the exterior environment' },
  { id: 'solid-headliner', label: 'سقف داخلي عادي', prompt: 'solid fabric headliner with soft diffuse reflectance' }
]);

export const INSIDE_WINDOW_STATES = freeze([
  { id: 'closed', label: 'النوافذ مغلقة', prompt: 'windows fully closed; exterior wind cannot directly move hair or loose cabin items' },
  { id: 'driver-cracked', label: 'نافذة السائق مفتوحة قليلًا', prompt: 'driver window opened only slightly, allowing a weak localized air stream near that side' },
  { id: 'front-open', label: 'نافذة أمامية مفتوحة', prompt: 'one front side window is open enough for a coherent localized airflow; wind direction must match that opening and vehicle motion' }
]);

export const INSIDE_CLUTTER_ITEMS = Object.freeze({
  'coffee-cup': Object.freeze({ prompt: 'coffee cup seated in a cup holder or stable recess, with contact shadow and liquid remaining level under gravity' }),
  'water-bottle': Object.freeze({ prompt: 'water bottle resting in a holder or storage pocket, with transparent plastic reflections tied to real lights' }),
  'shopping-bag': Object.freeze({ prompt: 'shopping bag supported by the floor or seat, sagging under gravity and never floating' }),
  papers: Object.freeze({ prompt: 'a few papers lying on a seat or console with gravity-driven overlap and edges reacting only to real airflow' }),
  'charging-cable': Object.freeze({ prompt: 'charging cable connected or resting against real surfaces with gravity-driven sag and contact points' }),
  sunglasses: Object.freeze({ prompt: 'sunglasses resting on a tray or seat, with reflections limited to their lens orientation' }),
  tissues: Object.freeze({ prompt: 'tissue pack physically supported on a seat, console or door pocket' }),
  'personal-pouch': Object.freeze({ prompt: 'small personal pouch resting on a seat or floor with soft-body compression' }),
  keys: Object.freeze({ prompt: 'keys resting on a tray or pocket with small metal highlights and contact shadow' })
});

export const INSIDE_CLUTTER_LEVELS = freeze([
  { id: 'clean', label: 'نظيف تمامًا', itemIds: [], prompt: 'clean cabin with no loose personal clutter' },
  { id: 'minimal', label: 'شبه نظيف', itemIds: ['charging-cable'], prompt: 'almost clean cabin with one supported everyday item' },
  { id: 'light', label: 'فوضى خفيفة', itemIds: ['water-bottle', 'charging-cable', 'tissues'], prompt: 'light believable clutter with every item physically supported' },
  { id: 'moderate', label: 'فوضى متوسطة', itemIds: ['coffee-cup', 'water-bottle', 'shopping-bag', 'papers', 'charging-cable', 'sunglasses'], prompt: 'moderate everyday clutter distributed across plausible support surfaces' },
  { id: 'heavy', label: 'فوضى شديدة', itemIds: ['coffee-cup', 'water-bottle', 'shopping-bag', 'papers', 'charging-cable', 'sunglasses', 'tissues', 'personal-pouch', 'keys'], prompt: 'heavy but physically plausible lived-in clutter that does not float or intersect controls' }
]);

export const INSIDE_CABIN_EMITTERS = freeze([
  { id: 'none', label: 'بدون مصدر داخلي إضافي', allowedTimes: ['day', 'golden', 'night'], prompt: 'no additional cabin emitter beyond necessary instrument visibility' },
  { id: 'dashboard-only', label: 'توهج العدادات', allowedTimes: ['night', 'golden'], prompt: 'weak localized instrument-cluster emission with fast distance falloff' },
  { id: 'dashboard-phone', label: 'العدادات + شاشة الهاتف', allowedTimes: ['night'], prompt: 'weak localized dashboard glow plus a weak phone-screen contribution only where the screen physically faces the subject' },
  { id: 'dome-light', label: 'لمبة السقف', allowedTimes: ['night', 'golden'], prompt: 'real overhead dome light with close-source falloff and head/roof occlusion' }
]);

export const INSIDE_CATALOG = Object.freeze({
  ...COMMON_CATALOG,
  vehicleState: INSIDE_VEHICLE_STATES,
  seat: INSIDE_SEATS,
  captureMode: INSIDE_CAPTURE_MODES,
  handPose: INSIDE_HAND_POSES,
  framing: INSIDE_FRAMINGS,
  cabinMaterial: INSIDE_CABIN_MATERIALS,
  clusterType: INSIDE_CLUSTER_TYPES,
  roofType: INSIDE_ROOFS,
  windowState: INSIDE_WINDOW_STATES,
  clutterLevel: INSIDE_CLUTTER_LEVELS,
  cabinEmitter: INSIDE_CABIN_EMITTERS
});

export const INSIDE_DEFAULT_STATE = Object.freeze(normalizeCommonDerivedState({
  mode: 'inside',
  initialRequest: '',
  referenceAttached: false,
  referenceRole: 'identity-only',
  vehicleProfile: 'l494-2017-white',
  vehicleState: 'parked-engine-on',
  motion: 'stationary',
  seat: 'driver-left',
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
  handPose: 'phone-outside-frame',
  framing: 'chest-up',
  focalLength: 21,
  aperture: 2.0,
  distance: 45,
  yaw: 0,
  pitch: 0,
  roll: 2,
  cabinMaterial: 'ivory-leather-dark-wood',
  clusterType: 'period-digital',
  roofType: 'panoramic',
  windowState: 'closed',
  clutterLevel: 'light',
  cabinEmitter: 'dashboard-only',
  exposure: 'natural',
  hdr: 'auto-realistic',
  whiteBalance: 'auto',
  notes: ''
}));

const insideOption = (field, id) => (INSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;

export function getInsideClutterItems(levelId) {
  const level = insideOption('clutterLevel', levelId);
  return Object.freeze((level?.itemIds || []).map((id) => Object.freeze({ id, ...INSIDE_CLUTTER_ITEMS[id] })));
}

export function isInsideOptionCompatible(field, id, state) {
  if ((COMMON_CATALOG[field] || []).length && !commonCompatibility(field, id, state)) return false;
  const item = insideOption(field, id);
  if (!item) return false;
  const capture = insideOption('captureMode', state.captureMode);
  const seat = insideOption('seat', state.seat);
  const vehicleState = insideOption('vehicleState', state.vehicleState);
  const lens = getCameraOptic(state.cameraLens);

  if (field === 'captureMode' && !item.allowedMotion.includes(state.vehicleState)) return false;
  if (field === 'cameraLens') {
    if (!capture?.allowedLensIds.includes(item.id)) return false;
    if (item.side !== 'front') return false;
  }
  if (field === 'handPose') {
    if (!item.captureIds.includes(state.captureMode)) return false;
    if (!item.roles.includes(seat?.role)) return false;
    if (!item.motion.includes(state.vehicleState)) return false;
  }
  if (field === 'clusterType' && item.incompatibleVehicles?.includes(state.vehicleProfile)) return false;
  if (field === 'cabinEmitter' && !item.allowedTimes.includes(state.time)) return false;
  if (field === 'hairMotion' && ['light-breeze', 'moderate-breeze'].includes(item.id)) return false;
  if (field === 'place' && vehicleState?.moving && item.kind === 'semi-outdoor-stop') return false;
  if (field === 'lowLightProcessing' && item.stationaryOnly && vehicleState?.moving) return false;
  if (field === 'gazeTarget' && state.vehicleState === 'moving' && seat?.role === 'driver' && id !== 'road') return false;
  return true;
}

export function analyzeInsideIntent(request = '', base = INSIDE_DEFAULT_STATE) {
  const common = applyCommonIntent(request, { ...base, mode: 'inside' });
  const text = normalizeIntentText(request);
  const next = { ...common.next, mode: 'inside', cameraLens: 'front-21', colorProfile: 'front-natural' };
  const tags = [...common.tags, 'inside'];

  if (/(قيادة|يسوق|driving|moving)/.test(text)) {
    next.vehicleState = 'moving';
    next.motion = 'moving';
    next.captureMode = 'dashboard-fixed-front';
    next.handPose = 'both-hands-wheel';
    next.gazeTarget = 'road';
    next.lowLightProcessing = 'standard';
    tags.push('moving');
  } else {
    next.motion = 'stationary';
    if (/(مطفأة|engine off)/.test(text)) next.vehicleState = 'parked-off';
    else if (/(متوقف|واقف|parked|stationary)/.test(text)) next.vehicleState = 'parked-engine-on';
  }

  if (/(مثبت|داشبورد|dashboard)/.test(text)) {
    next.captureMode = 'dashboard-fixed-front';
    next.handPose = next.vehicleState === 'moving' ? 'both-hands-wheel' : 'one-hand-wheel';
  } else if (/(كونسول|console)/.test(text)) {
    next.captureMode = 'console-fixed-front';
    next.handPose = 'lap-relaxed';
  } else if (/(سيلفي|selfie)/.test(text) && next.vehicleState !== 'moving') {
    next.captureMode = 'handheld-front';
    next.handPose = 'phone-outside-frame';
    next.distance = 45;
  }

  if (/(فوضى شديدة|heavy clutter)/.test(text)) next.clutterLevel = 'heavy';
  else if (/(فوضى متوسطة|moderate clutter)/.test(text)) next.clutterLevel = 'moderate';
  else if (/(فوضى خفيفة|light clutter)/.test(text)) next.clutterLevel = 'light';
  else if (/(نظيف|clean)/.test(text)) next.clutterLevel = 'clean';

  if (/(نافذة مفتوحة|window open)/.test(text)) next.windowState = 'front-open';
  if (/(لمبة السقف|dome)/.test(text)) next.cabinEmitter = 'dome-light';
  if (next.time === 'day') next.cabinEmitter = 'none';

  const normalized = normalizeCommonDerivedState(next);
  return Object.freeze({ normalized: text, tags: Object.freeze(tags), recommended: normalized });
}
