import { SAUDI_LOCATIONS, CLOTHING } from '../data/catalog.js';

const locationMap = new Map(SAUDI_LOCATIONS.map(([key, , en]) => [key, en]));
const clothingMap = new Map(CLOTHING.map(([key, , en]) => [key, en]));

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

const angleMap = {
  'eye-level': 'natural eye-level angle',
  'slightly-high': 'slightly above eye level',
  'slightly-low': 'slightly below eye level',
  'three-quarter-left': 'left three-quarter angle',
  'three-quarter-right': 'right three-quarter angle',
  'off-center': 'natural off-center handheld angle',
  'low-diagonal': 'slightly low diagonal angle',
  'high-diagonal': 'slightly high diagonal angle'
};

const framingMap = {
  'close-head-shoulders': 'close head-and-shoulders framing',
  'chest-up': 'chest-up framing',
  'half-body': 'half-body framing',
  'three-quarter-body': 'three-quarter-body framing',
  'full-body': 'full-body framing'
};

const poseMap = {
  'natural-standing': 'standing naturally',
  'natural-seated': 'seated naturally',
  walking: 'walking naturally',
  'casual-lean': 'casually leaning',
  waiting: 'standing as if casually waiting',
  'hands-relaxed': 'relaxed body language with natural hand placement'
};

const expressionMap = {
  neutral: 'neutral calm expression',
  'small-smile': 'very small closed-mouth smile',
  focused: 'natural focused expression',
  thoughtful: 'quiet thoughtful expression',
  tired: 'mild natural tiredness'
};

const lightMap = {
  daylight: 'natural daylight',
  'open-shade': 'open shade',
  'window-light': 'window light',
  'street-lights': 'ordinary street lighting',
  'parking-lights': 'ordinary parking-area lighting',
  'indoor-practical': 'indoor practical lighting',
  'storefront-mixed': 'mixed storefront and ambient practical lighting',
  'phone-screen': 'phone-screen light',
  'front-flash': 'smartphone front flash',
  custom: 'custom lighting described in the notes'
};

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

function referenceInstruction(state) {
  if (!state.referenceAttached || state.referenceRole === 'none') return '';
  if (state.referenceRole === 'identity-only') {
    return 'REFERENCE: use the attached image only as the identity source for the referenced person. Preserve facial identity and apparent age, but do not copy its clothing, pose, background, camera angle, or lighting.';
  }
  if (state.referenceRole === 'identity-appearance') {
    return 'REFERENCE: use the attached image for the person’s identity and visible appearance. Do not automatically copy the reference background, camera angle, or lighting.';
  }
  return 'REFERENCE: use the attached image as a broad visual reference, while following the current scene selections whenever they differ.';
}

function locationInstruction(state) {
  const base = locationMap.get(state.location) || 'a generic location in Saudi Arabia';
  return `${base}. Keep the place ordinary and non-iconic: no recognizable landmark, famous building, named venue, city-defining skyline, or tourist icon.`;
}

function cameraInstruction(state) {
  const parts = [
    captureMap[state.captureType] || state.captureType,
    angleMap[state.angle] || state.angle,
    framingMap[state.framing] || state.framing,
    `${state.focalLength}mm equivalent focal length`,
    `camera distance about ${state.distance} cm`,
    `yaw ${state.yaw}°`,
    `pitch ${state.pitch}°`,
    `roll ${state.roll}°`
  ];
  return parts.filter(Boolean).join('; ');
}

function lightingInstruction(state) {
  const physical = [
    lightMap[state.lightSource] || state.lightSource,
    `direction: ${state.lightDirection}`,
    `reach/falloff: ${state.lightFalloff}`
  ].join('; ');
  const processing = [
    `exposure: ${state.exposure}`,
    `HDR/computational processing: ${state.hdr}`,
    `white balance: ${state.whiteBalance}`
  ].join('; ');
  return { physical, processing };
}

function realismInstructions(state) {
  return Object.entries(state.modules || {})
    .filter(([, level]) => level && level !== 'off')
    .map(([name, level]) => realismText[name]?.[level])
    .filter(Boolean);
}

export function validateState(state) {
  const warnings = [];
  const age = Number(state.age);
  const distance = Number(state.distance);
  const focal = Number(state.focalLength);

  if (!state.idea?.trim()) warnings.push('الفكرة الأساسية فارغة.');
  if (state.referenceRole !== 'none' && !state.referenceAttached) warnings.push('تم اختيار دور للصورة المرجعية لكن لم تُرفق صورة.');
  if (state.time === 'night' && ['daylight', 'open-shade'].includes(state.lightSource)) warnings.push('الوقت ليل لكن مصدر الضوء نهاري.');
  if (state.time === 'noon' && ['street-lights', 'parking-lights'].includes(state.lightSource)) warnings.push('الوقت ظهر بينما مصدر الضوء المختار إنارة ليلية؛ راجع الاختيار إن لم يكن مقصودًا.');
  if (Number.isFinite(age) && (age < 1 || age > 100)) warnings.push('العمر الظاهر خارج النطاق المعتاد.');
  if (Number.isFinite(distance) && distance < 20 && ['half-body', 'three-quarter-body', 'full-body'].includes(state.framing)) warnings.push('المسافة قصيرة جدًا مقارنة بالكادر المختار.');
  if (Number.isFinite(focal) && (focal < 12 || focal > 150)) warnings.push('البعد البؤري غير معتاد لهذا النوع من الصور.');
  if (state.captureType === 'cctv' && state.framing === 'close-head-shoulders') warnings.push('الكادر القريب جدًا غير معتاد لكاميرا مراقبة ثابتة.');
  return warnings;
}

export function compileDetailed(state) {
  const light = lightingInstruction(state);
  const realism = realismInstructions(state);
  const lines = [
    'GENERATE ONE PHOTOREALISTIC IMAGE',
    '',
    `CORE SCENE: ${state.idea.trim() || 'Create the selected scene.'}`,
    `LOCATION: ${locationInstruction(state)}`,
    `TIME: ${timeMap[state.time] || state.time}.`,
    `CAPTURE: ${cameraInstruction(state)}.`,
    `SUBJECTS: ${state.people} person${String(state.people) === '1' ? '' : 's'}; apparent age ${state.age || 'unspecified'}.`,
    `POSE: ${poseMap[state.pose] || state.pose}.`,
    `EXPRESSION: ${expressionMap[state.expression] || state.expression}.`,
    `HAIR: ${state.hair || 'natural and scene-appropriate'}.`,
    `CLOTHING: ${clothingMap.get(state.clothing) || state.clothing}.`,
    `GLASSES: ${state.glasses}.`,
    `ASPECT RATIO: ${state.ratio}.`,
    referenceInstruction(state),
    '',
    `PHYSICAL LIGHTING: ${light.physical}. Physical illumination alone determines which surfaces receive light, shadow direction, highlights, and local brightness.`,
    `CAMERA PROCESSING: ${light.processing}. Exposure, ISO-like gain, HDR, and computational processing may reveal captured signal but must not invent physical illumination that never reached the subject.`,
  ].filter(Boolean);

  if (realism.length) {
    lines.push('', 'REALISM MODULES:');
    realism.forEach((item) => lines.push(`- ${item}`));
  }

  if (state.notes?.trim()) lines.push('', `ADDITIONAL USER DETAILS: ${state.notes.trim()}`);
  return lines.join('\n');
}

export function compileConcise(state) {
  const ref = referenceInstruction(state);
  const light = lightingInstruction(state);
  const realism = realismInstructions(state).join(' ');
  return [
    `Create one photorealistic image of ${state.idea.trim() || 'the selected scene'} in ${locationInstruction(state)}`,
    `Time: ${timeMap[state.time] || state.time}. Capture: ${cameraInstruction(state)}.`,
    `Subject: ${state.people} person${String(state.people) === '1' ? '' : 's'}, apparent age ${state.age || 'unspecified'}, ${poseMap[state.pose] || state.pose}, ${expressionMap[state.expression] || state.expression}, ${clothingMap.get(state.clothing) || state.clothing}, glasses: ${state.glasses}, hair: ${state.hair || 'natural'}.`,
    ref,
    `Physical lighting: ${light.physical}. Camera processing: ${light.processing}. Do not use processing to invent light that did not physically reach the scene.`,
    realism,
    state.notes?.trim() ? `Additional details: ${state.notes.trim()}` : '',
    `Aspect ratio: ${state.ratio}.`
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
  if (state.referenceAttached && state.referenceRole === 'identity-only') negatives.push('copying reference clothing', 'copying reference background', 'copying reference pose');
  return negatives.join(', ');
}

export function compileJson(state) {
  const payload = {
    scene: {
      idea: state.idea,
      location: locationInstruction(state),
      time: state.time,
      aspect_ratio: state.ratio
    },
    reference: {
      attached: state.referenceAttached,
      role: state.referenceRole
    },
    capture: {
      type: state.captureType,
      angle: state.angle,
      framing: state.framing,
      focal_length_equivalent_mm: Number(state.focalLength),
      distance_cm: Number(state.distance),
      yaw_deg: Number(state.yaw),
      pitch_deg: Number(state.pitch),
      roll_deg: Number(state.roll)
    },
    subject: {
      people: Number(state.people),
      apparent_age: Number(state.age),
      pose: state.pose,
      expression: state.expression,
      hair: state.hair,
      clothing: state.clothing,
      glasses: state.glasses
    },
    lighting: {
      physical_source: state.lightSource,
      direction: state.lightDirection,
      falloff: state.lightFalloff
    },
    processing: {
      exposure: state.exposure,
      hdr: state.hdr,
      white_balance: state.whiteBalance
    },
    realism_modules: state.modules,
    notes: state.notes
  };
  return JSON.stringify(payload, null, 2);
}
