import {
  CAR_CATALOG,
  CAR_DEFAULT_STATE,
  CAR_CLUTTER_LEVELS,
  getCameraOptic,
  getFabricProfile,
  isCarOptionCompatible
} from '../data/carSelfieCatalog.js';

const opt = (field, id) => (CAR_CATALOG[field] || []).find((item) => item.id === id);
const issue = (severity, code, message, field) => Object.freeze({ severity, code, message, field });

const LEGACY_LIGHT_MAP = Object.freeze({
  'day-window-light': ['day-direct-sun', 'none'],
  'golden-window-light': ['golden-sun', 'none'],
  'dashboard-glow': ['dark-road-ambient', 'dashboard-only'],
  'streetlight-spill': ['night-led-street', 'dashboard-only'],
  'parking-light-spill': ['night-parking-led', 'dashboard-only'],
  'phone-screen-fill': ['dark-road-ambient', 'phone-only'],
  'dome-light': ['dark-road-ambient', 'dome-light']
});

export function normalizeCarState(input = {}) {
  const s = { ...CAR_DEFAULT_STATE, ...input };

  if (input.locationContext && !input.place) s.place = input.locationContext === 'generic-parking' ? 'public-parking' :
    input.locationContext === 'residential-street' ? 'quiet-residential-street' :
    input.locationContext === 'roadside-stop' ? 'desert-road' :
    input.locationContext === 'villa-driveway' ? 'villa-driveway' :
    input.locationContext === 'ordinary-road' ? 'highway-service-road' :
    CAR_DEFAULT_STATE.place;

  if (input.lightSource && !input.externalLight) {
    const mapped = LEGACY_LIGHT_MAP[input.lightSource];
    if (mapped) [s.externalLight, s.cabinEmitter] = mapped;
  }
  if (s.physicsMode === 'advisory') s.physicsMode = 'auto';

  s.initialRequest = String(s.initialRequest ?? '');
  s.notes = String(s.notes ?? '');
  s.referenceAttached = Boolean(s.referenceAttached);
  for (const key of ['apparentAge', 'distance', 'yaw', 'pitch', 'roll']) s[key] = Number(s[key]);

  const optic = getCameraOptic(s.cameraLens);
  if (optic) {
    s.focalLength = optic.focalLengthEqMm;
    s.aperture = optic.aperture;
  } else {
    s.focalLength = Number(s.focalLength);
    s.aperture = Number(s.aperture);
  }
  return s;
}

function validateCatalogOptions(s, issues) {
  for (const [field, options] of Object.entries(CAR_CATALOG)) {
    if (!options.some((item) => item.id === s[field])) issues.push(issue('fatal', 'UNKNOWN_OPTION', `قيمة غير معروفة في ${field}.`, field));
  }
}

function validateCamera(s, issues) {
  const capture = opt('captureMode', s.captureMode);
  const lens = getCameraOptic(s.cameraLens);
  const color = opt('colorProfile', s.colorProfile);
  const lowLight = opt('lowLightProcessing', s.lowLightProcessing);
  if (!capture || !lens || !color || !lowLight) return;

  if (!capture.allowedMotion.includes(s.vehicleState)) issues.push(issue('error', 'CAPTURE_MOTION_CONFLICT', 'نوع الالتقاط لا يتوافق مع حالة حركة المركبة.', 'captureMode'));
  if (!capture.allowedCameraSides.includes(lens.side) || !lens.allowedCapture.includes(capture.id)) issues.push(issue('error', 'CAMERA_CAPTURE_SIDE_CONFLICT', 'العدسة المختارة لا يمكن استخدامها مع هندسة الالتقاط الحالية.', 'cameraLens'));
  if (!color.allowedCameraSides.includes(lens.side)) issues.push(issue('error', 'COLOR_PROFILE_CAMERA_CONFLICT', 'ملف الألوان غير متوافق مع جهة الكاميرا. Leica Authentic/Vibrant خاص بالعدسات الخلفية هنا.', 'colorProfile'));
  if (!lowLight.allowedCameraSides.includes(lens.side) || !lowLight.allowedTimes.includes(s.time)) issues.push(issue('error', 'LOW_LIGHT_PROFILE_CONFLICT', 'معالجة الإضاءة المنخفضة لا تتوافق مع الكاميرا أو الوقت المحدد.', 'lowLightProcessing'));
  if (lowLight.requiresStationary && s.vehicleState === 'moving') issues.push(issue('error', 'MULTIFRAME_WHILE_MOVING', 'المعالجة الليلية متعددة الإطارات تتطلب مشهدًا ثابتًا؛ أثناء الحركة استخدم معالجة قياسية مع ضوضاء/غالق واقعيين.', 'lowLightProcessing'));

  if (s.focalLength !== lens.focalLengthEqMm || s.aperture !== lens.aperture) issues.push(issue('fatal', 'CAMERA_HARDWARE_DRIFT', 'البعد البؤري أو فتحة العدسة لا تطابق Xiaomi 15 Ultra. القيم يجب أن تأتي من ملف العدسة فقط.', 'cameraLens'));

  if (capture.id === 'handheld-front') {
    if (lens.id !== 'front-21') issues.push(issue('error', 'FRONT_SELFIE_OPTIC_LOCK', 'السيلفي اليدوي الأمامي يجب أن يستخدم كاميرا Xiaomi 15 Ultra الأمامية فقط.', 'cameraLens'));
    if (s.distance < 30 || s.distance > 50) issues.push(issue('error', 'ARM_REACH_DISTANCE', 'السيلفي اليدوي يتطلب مسافة ذراع واقعية تقريبًا 30–50 سم.', 'distance'));
    if (Math.abs(s.yaw) > 35 || Math.abs(s.pitch) > 25 || Math.abs(s.roll) > 10) issues.push(issue('error', 'ARM_REACH_ANGLE', 'زوايا السيلفي اليدوي خرجت عن نطاق ذراع/معصم طبيعي.', 'yaw'));
  } else {
    if (s.distance < capture.distanceRangeCm[0] || s.distance > capture.distanceRangeCm[1]) issues.push(issue('error', 'CAR_DISTANCE_CONFLICT', `هذا الالتقاط يتوقع مسافة ${capture.distanceRangeCm[0]}–${capture.distanceRangeCm[1]} سم تقريبًا.`, 'distance'));
    if (Math.abs(s.yaw) > capture.maxAbsYawDeg || Math.abs(s.pitch) > capture.maxAbsPitchDeg || Math.abs(s.roll) > capture.maxAbsRollDeg) issues.push(issue('error', 'CAPTURE_ANGLE_CONFLICT', 'Yaw/Pitch/Roll لا تتوافق مع موضع تثبيت الهاتف داخل المقصورة.', 'yaw'));
  }

  if (lens.id === 'rear-tele-70' && s.distance < 75) issues.push(issue('error', 'TELEPHOTO_DISTANCE_CONFLICT', 'عدسة 70mm داخل المقصورة تحتاج مسافة أكبر لتجنب كادر/منظور غير منطقي؛ استخدم 75 سم أو أكثر.', 'distance'));
  if (lens.id === 'rear-ultratele-100' && s.distance < 100) issues.push(issue('error', 'ULTRATELE_DISTANCE_CONFLICT', 'عدسة 100mm داخل المقصورة تحتاج مسافة لا تقل تقريبًا عن 100 سم وكادرًا شديد الضيق.', 'distance'));
}

function validateMotionAndHands(s, issues) {
  const motion = opt('vehicleState', s.vehicleState);
  const capture = opt('captureMode', s.captureMode);
  const seat = opt('seat', s.seat);
  const hand = opt('handPose', s.handPose);
  if (motion?.moving && capture?.phoneHeld) issues.push(issue('error', 'HANDHELD_WHILE_MOVING', 'السيلفي اليدوي أثناء تحرك المركبة مرفوض؛ الهاتف يجب أن يكون مثبتًا فعليًا.', 'captureMode'));
  if (motion?.moving && seat?.role === 'driver' && s.captureMode !== 'dashboard-fixed') issues.push(issue('error', 'DRIVER_MOVING_CAPTURE', 'السائق أثناء الحركة يحتاج كاميرا مثبتة على لوحة القيادة.', 'captureMode'));
  if (motion?.moving && seat?.role === 'driver' && !['both-hands-wheel', 'one-hand-wheel'].includes(s.handPose)) issues.push(issue('error', 'DRIVER_HANDS_CONFLICT', 'وضع اليدين لا يتوافق مع قيادة متحركة واقعية.', 'handPose'));
  if (hand && !isCarOptionCompatible('handPose', hand.id, s)) issues.push(issue('error', 'HAND_POSE_COMPATIBILITY', 'وضع اليدين غير متوافق مع المقعد أو الحركة أو تثبيت الهاتف.', 'handPose'));
  if (motion?.moving && seat?.role === 'driver' && ['side-glance', 'mild-surprise'].includes(s.expression)) issues.push(issue('warning', 'DRIVER_ATTENTION_WARNING', 'التعبير المختار ممكن لحظةً لكنه أقل اتساقًا مع قيادة مركزة؛ لا تجعل العينين بعيدتين عن الطريق مدة غير منطقية.', 'expression'));
}

function validatePlaceAndWeather(s, issues) {
  const place = opt('place', s.place);
  const weather = opt('weather', s.weather);
  if (place && !place.allowedVehicleStates.includes(s.vehicleState)) issues.push(issue('error', 'PLACE_MOTION_CONFLICT', 'المكان المختار لا يتوافق مع حالة المركبة الحالية.', 'place'));
  if (place && weather && (!place.allowedWeather.includes(weather.id) || !weather.compatiblePlaces.includes(place.placeKind))) issues.push(issue('error', 'WEATHER_PLACE_CONFLICT', 'الطقس المختار لا يتوافق مع نوع المكان.', 'weather'));

  const forbidden = ['riyadh', 'jeddah', 'mecca', 'medina', 'الرياض', 'جدة', 'مكة', 'المدينة', 'kingdom centre', 'برج المملكة'];
  const text = `${place?.label || ''} ${place?.prompt || ''}`.toLowerCase();
  if (forbidden.some((term) => text.includes(term))) issues.push(issue('fatal', 'NAMED_LOCATION_LEAK', 'قائمة الأماكن يجب أن تبقى عامة دون مدينة أو معلم معروف.', 'place'));
}

function validateLighting(s, issues) {
  const place = opt('place', s.place);
  const external = opt('externalLight', s.externalLight);
  const emitter = opt('cabinEmitter', s.cabinEmitter);
  if (external) {
    if (!external.allowedTimes.includes(s.time)) issues.push(issue('error', 'EXTERNAL_LIGHT_TIME', 'الإضاءة الخارجية لا تتوافق مع الوقت.', 'externalLight'));
    if (place && !external.allowedPlaceKinds.includes(place.placeKind)) issues.push(issue('error', 'EXTERNAL_LIGHT_PLACE', 'مصدر الإضاءة الخارجي لا يتوافق مع بنية المكان.', 'externalLight'));
  }
  if (emitter && !emitter.allowedTimes.includes(s.time)) issues.push(issue('error', 'CABIN_LIGHT_TIME', 'مصدر الإضاءة الداخلي لا يتوافق مع الوقت.', 'cabinEmitter'));
  if (emitter?.requiresPhoneFacingSubject && !['handheld-front', 'dashboard-fixed', 'center-console-fixed', 'rearview-mirror'].includes(s.captureMode)) issues.push(issue('error', 'PHONE_EMITTER_GEOMETRY', 'إضاءة شاشة الهاتف تتطلب أن تواجه الشاشة الشخص فعليًا.', 'cabinEmitter'));
  if (s.time === 'day' && s.cabinEmitter !== 'none') issues.push(issue('warning', 'CABIN_EMITTER_DAY', 'يمكن تشغيل مصدر داخلي نهارًا، لكنه يجب أن يبقى أضعف بكثير من الشمس/السماء ولا يغيّر اتجاه الظلال الرئيسي.', 'cabinEmitter'));
  if (s.hdr === 'auto-realistic' && s.externalLight === 'dark-road-ambient' && s.cabinEmitter === 'none') issues.push(issue('warning', 'HDR_CANNOT_CREATE_LIGHT', 'HDR لن يجعل الوجه مضاءً إذا لم يصل إليه ضوء فعلي؛ اقبل ظلالًا عميقة وضوضاء واقعية.', 'hdr'));
}

function validateHairAndFabric(s, issues) {
  const hair = opt('hairProfile', s.hairProfile);
  const fabric = getFabricProfile(s.clothing);
  if (hair && hair.densityLock !== true) issues.push(issue('fatal', 'HAIR_DENSITY_UNLOCKED', 'كل ملف شعر يجب أن يفرض ثبات الكثافة وخط الشعر.', 'hairProfile'));
  if (!fabric) issues.push(issue('fatal', 'FABRIC_PHYSICS_MISSING', 'قطعة الملابس بلا ملف فيزياء قماش مرتبط.', 'clothing'));
  if (s.hairProfile === 'covered' && !['black-abaya-hijab', 'embroidered-abaya', 'neutral-abaya-chiffon-hijab'].includes(s.clothing)) issues.push(issue('warning', 'COVERED_HAIR_WITHOUT_HEAD_COVER', 'تم اختيار شعر مغطى بدون قطعة ملابس تتضمن غطاء رأس؛ تأكد أن الملاحظات تذكر الغطاء.', 'hairProfile'));
}

function validateMirrorAndReflections(s, issues) {
  if (s.captureMode === 'rearview-mirror') {
    const lens = getCameraOptic(s.cameraLens);
    if (lens?.side !== 'rear') issues.push(issue('error', 'MIRROR_REAR_CAMERA_REQUIRED', 'تصوير المرآة الداخلية في هذا النظام يتطلب عدسة خلفية موجهة إلى سطح المرآة.', 'cameraLens'));
    if (Math.abs(s.yaw) > 35 || Math.abs(s.pitch) > 25) issues.push(issue('error', 'MIRROR_LINE_OF_SIGHT', 'زاوية الكاميرا تكسر خط النظر الواقعي للمرآة الداخلية.', 'yaw'));
  }
}

function validateCabinAndClutter(s, issues) {
  if (s.vehicleProfile === 'l494-2017-white' && s.clusterType === 'modern-digital') issues.push(issue('error', 'PERIOD_CABIN_CONFLICT', 'عدادات حديثة قد تحوّل L494 2017 إلى مقصورة جيل أحدث.', 'clusterType'));
  const clutter = CAR_CLUTTER_LEVELS.find((item) => item.id === s.clutterLevel);
  if (s.vehicleState === 'moving' && clutter?.id === 'heavy') issues.push(issue('warning', 'HEAVY_CLUTTER_MOVING', 'الفوضى الشديدة أثناء الحركة يجب أن تبقى خارج مسار الدواسات والمقود وأن تتحرك فقط ضمن قيود الجاذبية/التسارع.', 'clutterLevel'));
}

export function validateCarState(input = {}) {
  const s = normalizeCarState(input);
  const issues = [];
  validateCatalogOptions(s, issues);
  if (!Number.isFinite(s.apparentAge) || s.apparentAge < 1 || s.apparentAge > 100) issues.push(issue('fatal', 'AGE_RANGE', 'العمر الظاهر يجب أن يكون بين 1 و100.', 'apparentAge'));
  if (!Number.isFinite(s.distance) || s.distance < 20 || s.distance > 250) issues.push(issue('fatal', 'DISTANCE_RANGE', 'المسافة البصرية خارج نطاق المقصورة 20–250 سم.', 'distance'));
  if (!Number.isFinite(s.yaw) || !Number.isFinite(s.pitch) || !Number.isFinite(s.roll) || Math.abs(s.yaw) > 60 || Math.abs(s.pitch) > 40 || Math.abs(s.roll) > 20) issues.push(issue('fatal', 'ANGLE_RANGE', 'زاوية الكاميرا خارج النطاق العام للمقصورة.', 'yaw'));

  validateCamera(s, issues);
  validateMotionAndHands(s, issues);
  validatePlaceAndWeather(s, issues);
  validateLighting(s, issues);
  validateHairAndFabric(s, issues);
  validateMirrorAndReflections(s, issues);
  validateCabinAndClutter(s, issues);

  for (const field of ['captureMode', 'cameraLens', 'colorProfile', 'lowLightProcessing', 'handPose', 'place', 'weather', 'externalLight', 'cabinEmitter']) {
    if (opt(field, s[field]) && !isCarOptionCompatible(field, s[field], s)) issues.push(issue('error', 'OPTION_COMPATIBILITY', `الخيار ${field} غير متناسق مع حالة السيارة الحالية.`, field));
  }
  if (s.referenceRole !== 'none' && !s.referenceAttached) issues.push(issue('warning', 'CAR_REFERENCE_NOT_ATTACHED', 'تم اختيار دور مرجعي دون صورة مرفقة.', 'referenceRole'));
  return Object.freeze(issues);
}

export function carValidationStatus(input = {}) {
  const s = normalizeCarState(input);
  const issues = validateCarState(s);
  const strict = s.physicsMode === 'strict';
  const blocked = issues.some((item) => item.severity === 'fatal' || (strict && item.severity === 'error'));
  return Object.freeze({ issues, strict, blocked });
}
