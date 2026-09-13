import { SAUDI_LOCATIONS, CLOTHING } from '../data/catalog.js';
import {
  HAIRSTYLES,
  BEARDS,
  GLASSES_OPTIONS,
  EXTRA_POSES,
  EXTRA_ANGLES,
  EXTRA_FRAMINGS,
  EXTRA_LIGHT_SOURCES,
  EXTRA_LOCATIONS
} from '../data/extensions.js';

const map3 = (items) => new Map(items.map(([key, , english]) => [key, english]));
const locationMap = map3([...SAUDI_LOCATIONS, ...EXTRA_LOCATIONS]);
const clothingMap = map3(CLOTHING);
const hairMap = map3(HAIRSTYLES);
const beardMap = map3(BEARDS);
const glassesMap = map3(GLASSES_OPTIONS);
const extraPoseMap = map3(EXTRA_POSES);
const extraAngleMap = map3(EXTRA_ANGLES);
const extraFramingMap = map3(EXTRA_FRAMINGS);
const extraLightMap = map3(EXTRA_LIGHT_SOURCES);

const captureMap = {
  'front-selfie': 'subject-held smartphone front-camera selfie',
  'rear-camera': 'smartphone rear-camera photograph',
  'third-person': 'third-person photograph taken by another person',
  'mirror-selfie': 'mirror selfie',
  candid: 'candid spontaneous photograph',
  cctv: 'fixed CCTV-style surveillance-camera frame'
};

const timeMap = {
  morning: 'morning',
  noon: 'noon',
  afternoon: 'afternoon',
  sunset: 'sunset',
  evening: 'evening',
  night: 'night'
};

const angleMap = new Map([
  ['eye-level', 'natural eye-level angle'],
  ['slightly-high', 'slightly above eye level'],
  ['slightly-low', 'slightly below eye level'],
  ['three-quarter-left', 'left three-quarter angle'],
  ['three-quarter-right', 'right three-quarter angle'],
  ['off-center', 'natural off-center handheld angle'],
  ['low-diagonal', 'slightly low diagonal angle'],
  ['high-diagonal', 'slightly high diagonal angle'],
  ...extraAngleMap
]);

const framingMap = new Map([
  ['close-head-shoulders', 'close head-and-shoulders framing'],
  ['chest-up', 'chest-up framing'],
  ['half-body', 'half-body framing'],
  ['three-quarter-body', 'three-quarter-body framing'],
  ['full-body', 'full-body framing'],
  ...extraFramingMap
]);

const poseMap = new Map([
  ['natural-standing', 'standing naturally'],
  ['natural-seated', 'seated naturally'],
  ['walking', 'walking naturally'],
  ['casual-lean', 'casually leaning'],
  ['waiting', 'standing as if casually waiting'],
  ['hands-relaxed', 'relaxed body language with natural hand placement'],
  ...extraPoseMap
]);

const expressionMap = {
  neutral: 'neutral calm expression',
  'small-smile': 'very small closed-mouth smile',
  focused: 'natural focused expression',
  thoughtful: 'quiet thoughtful expression',
  tired: 'mild natural tiredness'
};

const lightMap = new Map([
  ['daylight', 'natural daylight'],
  ['open-shade', 'open shade'],
  ['window-light', 'window light'],
  ['street-lights', 'ordinary street lighting'],
  ['parking-lights', 'ordinary parking-area lighting'],
  ['indoor-practical', 'indoor practical lighting'],
  ['storefront-mixed', 'mixed storefront and ambient practical lighting'],
  ['phone-screen', 'phone-screen light'],
  ['front-flash', 'smartphone front flash'],
  ['custom', 'custom physical light source'],
  ...extraLightMap
]);

const realismText = {
  anatomy: {
    auto: 'Keep human anatomy believable and naturally proportioned.',
    strict: 'Strictly enforce correct human anatomy, joint orientation, limb proportions, facial structure, and natural asymmetry.'
  },
  contact: {
    auto: 'Keep weight, support, and contact with surfaces physically plausible.',
    strict: 'Strictly enforce contact physics: body weight, compression, support, gravity, and object-surface contact must agree.'
  },
  skin: {
    auto: 'Use believable skin, hair, and beard texture without plastic smoothing.',
    strict: 'Strictly preserve skin micro-texture, pores, fine hair, beard density variation, and natural non-uniformity without beauty-filter smoothing.'
  },
  materials: {
    auto: 'Render materials with plausible texture and light response.',
    strict: 'Strictly enforce material physics: fabric, leather, glass, metal, wood, paint, and skin must respond differently to light and contact.'
  },
  reflections: {
    auto: 'Keep reflections and highlights consistent with viewing geometry.',
    strict: 'Strictly enforce reflection geometry, highlight direction, occlusion, and surface roughness.'
  },
  atmosphere: {
    auto: 'Keep background depth and atmospheric separation believable.',
    strict: 'Strictly enforce atmospheric depth, distance contrast, haze, and scale cues without artificial blur.'
  },
  motion: {
    auto: 'Keep motion and shutter behavior internally consistent.',
    strict: 'Strictly enforce motion/shutter consistency: moving subjects, camera shake, and static objects must show compatible blur behavior.'
  },
  imperfections: {
    auto: 'Allow restrained real-camera imperfections.',
    strict: 'Strictly preserve controlled camera imperfections such as slight edge softness, mild sensor noise, small white-balance error, and realistic dynamic-range limits.'
  },
  environment: {
    auto: 'Keep people and objects naturally integrated with the environment.',
    strict: 'Strictly enforce environmental interaction: wind, gravity, dust, fabric movement, shadows, footprints, contact, and local activity must have plausible causes.'
  }
};

const INDOOR_LOCATION_KEYS = new Set([
  'modern-majlis',
  'living-room',
  'bedroom',
  'office-interior',
  'restaurant-interior',
  'cafe-interior',
  'small-office-lobby',
  'building-corridor',
  'home-entry-hall'
]);

const NAMED_CITY_PATTERN = /(الرياض|جدة|مكة|مكّة|المدينة|الدمام|الخبر|الطائف|أبها|ينبع|riyadh|jeddah|makkah|mecca|madinah|medina|dammam|khobar|taif|abha|yanbu)/i;

const customOrMap = (key, customValue, map, fallback = '') => {
  if (key === 'custom') return customValue?.trim() || fallback;
  return map.get(key) || key || fallback;
};

const toFiniteNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function referenceInstruction(state) {
  if (!state.referenceAttached || state.referenceRole === 'none') return '';
  if (state.referenceRole === 'identity-only') {
    return 'REFERENCE: use the attached image only as the identity source for the referenced person. Preserve facial identity and apparent age, but do not copy its clothing, pose, background, camera angle, or lighting.';
  }
  if (state.referenceRole === 'identity-appearance') {
    return 'REFERENCE: use the attached image for identity and visible appearance cues. Explicit current clothing, hair, beard, glasses, pose, and expression selections override conflicting reference details. Do not automatically copy the reference background, camera angle, or lighting.';
  }
  return 'REFERENCE: use the attached image as a broad visual reference. Explicit current scene and appearance selections take priority whenever they differ from the reference.';
}

function locationBase(state) {
  return customOrMap(state.location, state.customLocation, locationMap, 'a generic location in Saudi Arabia');
}

function locationInstruction(state) {
  return `${locationBase(state)}. Keep the place ordinary and non-iconic: no recognizable landmark, famous building, named venue, city-defining skyline, or tourist icon.`;
}

function vehicleInstruction(state) {
  if (state.vehicleScene !== 'rrs-2017-white-interior') return null;
  return {
    model: '2017 Range Rover Sport L494',
    exterior: 'white',
    line: `A white 2017 Range Rover Sport is parked and stationary at ${locationBase(state)}.`,
    cabin: 'Visible cabin details should match a 2017 Range Rover Sport L494: Ivory leather seats, dark wood trim, panoramic roof, black-and-Ivory steering wheel.',
    constraints: 'Keep the vehicle interior realistic and period-appropriate. Do not redesign the cabin as a newer model. No newer Range Rover interior.'
  };
}

function cameraInstruction(state) {
  const angle = customOrMap(state.angle, state.customAngle, angleMap, 'natural camera angle');
  const framing = customOrMap(state.framing, state.customFraming, framingMap, 'natural framing');
  const focal = state.focalLength ? `${state.focalLength}mm equivalent focal length` : 'natural smartphone focal length';
  const distance = state.distance ? `camera distance about ${state.distance} cm` : 'natural camera distance';
  const rotations = [
    state.yaw !== '' ? `yaw ${state.yaw}°` : '',
    state.pitch !== '' ? `pitch ${state.pitch}°` : '',
    state.roll !== '' ? `roll ${state.roll}°` : ''
  ].filter(Boolean);

  return [
    captureMap[state.captureType] || state.captureType || 'photograph',
    angle,
    framing,
    focal,
    distance,
    ...rotations
  ].filter(Boolean).join('; ');
}

function lightingInstruction(state) {
  const source = customOrMap(state.lightSource, state.customLightSource, lightMap, 'scene-appropriate physical lighting');
  return {
    physical: [source, `direction: ${state.lightDirection || 'natural direction'}`, `reach/falloff: ${state.lightFalloff || 'natural distance-based falloff'}`].join('; '),
    processing: [`exposure: ${state.exposure || 'natural'}`, `HDR/computational processing: ${state.hdr || 'low'}`, `white balance: ${state.whiteBalance || 'neutral'}`].join('; ')
  };
}

function appearance(state) {
  return {
    pose: customOrMap(state.pose, state.customPose, poseMap, 'natural pose'),
    hair: customOrMap(state.hair, state.customHair, hairMap, 'natural hair'),
    beard: customOrMap(state.beard, state.customBeard, beardMap, 'natural facial hair'),
    glasses: customOrMap(state.glasses, state.customGlasses, glassesMap, 'no glasses'),
    clothing: customOrMap(state.clothing, state.customClothing, clothingMap, 'scene-appropriate clothing')
  };
}

function realismInstructions(state) {
  return Object.entries(state.modules || {})
    .filter(([, level]) => level && level !== 'off')
    .map(([name, level]) => realismText[name]?.[level])
    .filter(Boolean);
}

function resolvedScene(state, vehicle) {
  if (state.idea?.trim()) return state.idea.trim();
  if (vehicle) return `A ${state.age || 35}-year-old man is seated inside a white 2017 Range Rover Sport at the selected Saudi location.`;
  return 'Create the selected scene.';
}

export function validateState(state) {
  const warnings = [];
  const age = toFiniteNumber(state.age);
  const distance = toFiniteNumber(state.distance);
  const focal = toFiniteNumber(state.focalLength);

  if (!state.idea?.trim()) warnings.push('الفكرة الأساسية فارغة.');
  if (state.referenceRole !== 'none' && !state.referenceAttached) warnings.push('تم اختيار دور للصورة المرجعية لكن لم تُرفق صورة.');
  if (state.referenceAttached && state.referenceRole === 'none') warnings.push('أرفقت صورة مرجعية لكن دورها مضبوط على "بدون استخدام".');

  if (state.time === 'night' && ['daylight', 'open-shade', 'soft-cloudy-daylight'].includes(state.lightSource)) {
    warnings.push('الوقت ليل لكن مصدر الضوء نهاري.');
  }
  if (state.time === 'noon' && ['street-lights', 'parking-lights', 'parking-pole-led'].includes(state.lightSource)) {
    warnings.push('الوقت ظهر بينما مصدر الضوء المختار إنارة ليلية؛ راجع الاختيار إن لم يكن مقصودًا.');
  }

  if (age !== null && (age < 1 || age > 100)) warnings.push('العمر الظاهر خارج النطاق المعتاد.');
  if (distance !== null && (distance < 10 || distance > 500)) warnings.push('مسافة الكاميرا خارج النطاق المدعوم في الواجهة.');
  if (focal !== null && (focal < 12 || focal > 150)) warnings.push('البعد البؤري خارج النطاق المدعوم في الواجهة.');

  if (distance !== null && distance < 20 && ['half-body', 'three-quarter-body', 'full-body', 'waist-up', 'environmental-portrait'].includes(state.framing)) {
    warnings.push('المسافة قصيرة جدًا مقارنة بالكادر المختار.');
  }

  if (state.captureType === 'front-selfie') {
    if (distance !== null && (distance < 25 || distance > 90)) warnings.push('مسافة الكاميرا غير معتادة لسيلفي أمامي محمول باليد؛ راجع المسافة إذا لم تكن مقصودة.');
    if (focal !== null && (focal < 18 || focal > 35)) warnings.push('البعد البؤري غير معتاد لسيلفي هاتف أمامي؛ راجع العدسة إذا لم يكن ذلك مقصودًا.');
    if (['three-quarter-body', 'full-body'].includes(state.framing)) warnings.push('الكادر المختار واسع جدًا لسيلفي أمامي بطول ذراع عادي.');
    if (state.framing === 'half-body' && distance !== null && distance < 40) warnings.push('نصف الجسم مع هذه المسافة القصيرة غير مريح هندسيًا لسيلفي أمامي.');
  }

  if (state.captureType === 'cctv' && ['close-head-shoulders', 'face-dominant'].includes(state.framing)) {
    warnings.push('الكادر القريب جدًا غير معتاد لكاميرا مراقبة ثابتة.');
  }

  if (state.vehicleScene === 'rrs-2017-white-interior') {
    if (INDOOR_LOCATION_KEYS.has(state.location)) warnings.push('تم اختيار مشهد داخل السيارة مع موقع داخلي لا يمكن أن تكون السيارة متوقفة داخله؛ اختر موقفًا أو شارعًا أو مدخلًا خارجيًا.');
    if (state.pose !== 'natural-seated' && state.pose !== 'custom') warnings.push('مشهد داخل السيارة يتطلب عادة وضعية جلوس؛ راجع الوضعية إذا لم يكن الاستثناء مقصودًا.');
    if (state.captureType === 'front-selfie' && ['three-quarter-body', 'full-body'].includes(state.framing)) warnings.push('الكادر الواسع جدًا غير واقعي غالبًا لسيلفي أمامي من داخل المقصورة.');
  }

  const customFields = [
    ['location', 'customLocation', 'الموقع'],
    ['pose', 'customPose', 'الوضعية'],
    ['hair', 'customHair', 'الشعر'],
    ['beard', 'customBeard', 'اللحية'],
    ['glasses', 'customGlasses', 'النظارة'],
    ['clothing', 'customClothing', 'الملابس'],
    ['angle', 'customAngle', 'الزاوية'],
    ['framing', 'customFraming', 'الكادر'],
    ['lightSource', 'customLightSource', 'مصدر الضوء']
  ];

  customFields.forEach(([key, customKey, label]) => {
    if (state[key] === 'custom' && !state[customKey]?.trim()) warnings.push(`اخترت ${label} مخصصًا لكن الوصف فارغ.`);
  });

  if (state.location === 'custom' && state.customLocation?.trim() && NAMED_CITY_PATTERN.test(state.customLocation)) {
    warnings.push('الموقع المخصص يحتوي اسم مدينة؛ سياسة التطبيق تفضّل مواقع سعودية عامة بدون أسماء مدن أو معالم محددة.');
  }

  return warnings;
}

export function compileDetailed(state) {
  const light = lightingInstruction(state);
  const realism = realismInstructions(state);
  const subject = appearance(state);
  const vehicle = vehicleInstruction(state);
  const reference = referenceInstruction(state);

  const lines = [
    'GENERATE ONE PHOTOREALISTIC IMAGE',
    '',
    `CORE SCENE: ${resolvedScene(state, vehicle)}`,
    `LOCATION: ${locationInstruction(state)}`,
    `TIME: ${timeMap[state.time] || state.time || 'unspecified'}.`,
    `CAPTURE: ${cameraInstruction(state)}.`,
    `SUBJECTS: ${state.people || '1'} person${String(state.people || '1') === '1' ? '' : 's'}; apparent age ${state.age || 'unspecified'}.`,
    `POSE: ${subject.pose}.`,
    `EXPRESSION: ${expressionMap[state.expression] || state.expression || 'natural expression'}.`,
    `HAIR: ${subject.hair}.`,
    `FACIAL HAIR: ${subject.beard}.`,
    `CLOTHING: ${subject.clothing}.`,
    `GLASSES: ${subject.glasses}.`,
    `ASPECT RATIO: ${state.ratio || 'unspecified'}.`
  ];

  if (vehicle) {
    lines.push(
      `VEHICLE: ${vehicle.line}`,
      `VISIBLE CABIN DETAILS: ${vehicle.cabin}`,
      `VEHICLE CONSTRAINTS: ${vehicle.constraints}`
    );
  }

  if (reference) lines.push(`REFERENCE: ${reference.replace(/^REFERENCE:\s*/i, '')}`);

  lines.push(
    '',
    `PHYSICAL LIGHTING: ${light.physical}. Physical illumination alone determines which surfaces receive light, shadow direction, highlights, and local brightness.`,
    `CAMERA PROCESSING: ${light.processing}. Exposure, ISO-like gain, HDR, and computational processing may reveal captured signal but must not invent physical illumination that never reached the subject.`
  );

  if (realism.length) {
    lines.push('', 'REALISM MODULES:');
    realism.forEach((item) => lines.push(`- ${item}`));
  }

  if (state.notes?.trim()) lines.push('', `ADDITIONAL USER DETAILS: ${state.notes.trim()}`);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function compileConcise(state) {
  const reference = referenceInstruction(state);
  const light = lightingInstruction(state);
  const realism = realismInstructions(state).join(' ');
  const subject = appearance(state);
  const vehicle = vehicleInstruction(state);

  return [
    'Create one photorealistic image.',
    `Scene: ${resolvedScene(state, vehicle)}`,
    `Location: ${locationInstruction(state)}`,
    `Time: ${timeMap[state.time] || state.time || 'unspecified'}. Capture: ${cameraInstruction(state)}.`,
    `Subject: ${state.people || '1'} person${String(state.people || '1') === '1' ? '' : 's'}, apparent age ${state.age || 'unspecified'}, ${subject.pose}, ${expressionMap[state.expression] || state.expression || 'natural expression'}, hair: ${subject.hair}, facial hair: ${subject.beard}, clothing: ${subject.clothing}, glasses: ${subject.glasses}.`,
    vehicle ? `Vehicle: ${vehicle.line} ${vehicle.cabin} ${vehicle.constraints}` : '',
    reference,
    `Physical lighting: ${light.physical}. Camera processing: ${light.processing}. Do not use processing to invent light that did not physically reach the scene.`,
    realism,
    state.notes?.trim() ? `Additional details: ${state.notes.trim()}` : '',
    `Aspect ratio: ${state.ratio || 'unspecified'}.`
  ].filter(Boolean).join('\n');
}

export function compileNegative(state) {
  const negatives = [
    'recognizable landmark',
    'famous building',
    'named tourist attraction',
    'city-defining skyline',
    'impossible anatomy',
    'extra fingers or limbs',
    'floating objects',
    'impossible contact',
    'inconsistent reflections',
    'light without a physical source',
    'plastic skin',
    'over-smoothed skin',
    'excessive HDR',
    'artificial sharpening'
  ];

  if (state.referenceAttached && state.referenceRole === 'identity-only') {
    negatives.push('copying reference clothing', 'copying reference background', 'copying reference pose');
  }

  if (state.vehicleScene === 'rrs-2017-white-interior') {
    negatives.push('newer Range Rover interior', 'incorrect SUV cabin', 'redesigned dashboard', 'vehicle in motion');
    if (state.captureType === 'front-selfie') negatives.push('third-person camera');
  }

  return negatives.join(', ');
}

export function compileJson(state) {
  const subject = appearance(state);
  const vehicle = vehicleInstruction(state);

  const payload = {
    scene: {
      idea: state.idea || '',
      resolved_scene: resolvedScene(state, vehicle),
      location: locationInstruction(state),
      time: state.time || null,
      aspect_ratio: state.ratio || null
    },
    reference: {
      attached: Boolean(state.referenceAttached),
      role: state.referenceRole || 'none'
    },
    capture: {
      type: state.captureType || null,
      angle: customOrMap(state.angle, state.customAngle, angleMap, null),
      framing: customOrMap(state.framing, state.customFraming, framingMap, null),
      focal_length_equivalent_mm: toFiniteNumber(state.focalLength),
      distance_cm: toFiniteNumber(state.distance),
      yaw_deg: toFiniteNumber(state.yaw),
      pitch_deg: toFiniteNumber(state.pitch),
      roll_deg: toFiniteNumber(state.roll)
    },
    subject: {
      people: toFiniteNumber(state.people),
      apparent_age: toFiniteNumber(state.age),
      pose: subject.pose,
      expression: expressionMap[state.expression] || state.expression || null,
      hair: subject.hair,
      facial_hair: subject.beard,
      clothing: subject.clothing,
      glasses: subject.glasses
    },
    vehicle: vehicle
      ? {
          enabled: true,
          scene: state.vehicleScene,
          model: vehicle.model,
          exterior_color: vehicle.exterior,
          cabin: vehicle.cabin,
          constraints: vehicle.constraints
        }
      : { enabled: false, scene: 'none' },
    lighting: {
      physical_source: customOrMap(state.lightSource, state.customLightSource, lightMap, null),
      direction: state.lightDirection || null,
      falloff: state.lightFalloff || null
    },
    processing: {
      exposure: state.exposure || null,
      hdr: state.hdr || null,
      white_balance: state.whiteBalance || null
    },
    realism_modules: state.modules || {},
    notes: state.notes || ''
  };

  return JSON.stringify(payload, null, 2);
}
