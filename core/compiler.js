import {
  ASPECT_RATIOS,
  FRAMINGS,
  REALISM_MODULES,
  VEHICLE_SCENES
} from '../data/catalog.js';
import { fieldCoverageCm } from './geometry.js';
import { normalizeState, optionById } from './state.js';
import { validationStatus } from './validation.js';

const ratioMap = new Map(ASPECT_RATIOS.map((item) => [item.id, item]));
const framingMap = new Map(FRAMINGS.map((item) => [item.id, item]));
const vehicleMap = new Map(VEHICLE_SCENES.map((item) => [item.id, item]));

function customPrompt(state, field, customField) {
  if (state[field] === 'custom') return state[customField];
  return optionById(field, state[field])?.prompt || '';
}

function referenceInstruction(state) {
  if (!state.referenceAttached || state.referenceRole === 'none') return '';
  if (state.referenceRole === 'identity-only') {
    return 'Use the attached image only as the identity source. Preserve facial identity and apparent age; do not copy clothing, pose, background, camera geometry, or lighting from the reference.';
  }
  if (state.referenceRole === 'identity-appearance') {
    return 'Use the attached image for identity and visible appearance. Explicit structured selections for clothing, hair, facial hair, glasses, pose, expression, camera geometry, location, and lighting override the reference.';
  }
  return 'Use the attached image as a broad visual reference, but every explicit structured selection below is authoritative when a conflict exists.';
}

function locationPrompt(state) {
  const base = customPrompt(state, 'location', 'customLocation');
  return `${base}. Keep the place generic and non-iconic: no named city, recognizable landmark, famous building, named venue, city-defining skyline, or tourist icon.`;
}

function subjectPrompt(state) {
  return {
    pose: customPrompt(state, 'pose', 'customPose'),
    expression: optionById('expression', state.expression)?.prompt || '',
    hair: customPrompt(state, 'hair', 'customHair'),
    beard: customPrompt(state, 'beard', 'customBeard'),
    glasses: customPrompt(state, 'glasses', 'customGlasses'),
    clothing: customPrompt(state, 'clothing', 'customClothing')
  };
}

function lightingPrompt(state) {
  return {
    source: customPrompt(state, 'lightSource', 'customLightSource'),
    direction: optionById('lightDirection', state.lightDirection)?.prompt || '',
    falloff: optionById('lightFalloff', state.lightFalloff)?.prompt || '',
    exposure: optionById('exposure', state.exposure)?.prompt || '',
    hdr: optionById('hdr', state.hdr)?.prompt || '',
    whiteBalance: optionById('whiteBalance', state.whiteBalance)?.prompt || ''
  };
}

function vehiclePrompt(state) {
  if (state.vehicleScene === 'none') return null;
  const vehicle = vehicleMap.get(state.vehicleScene);
  if (!vehicle) return null;
  return {
    line: `A ${vehicle.exterior} ${vehicle.model} is parked and stationary at ${customPrompt(state, 'location', 'customLocation')}.`,
    cabin: `Visible cabin details: ${vehicle.cabin}.`,
    constraints: 'Keep the cabin period-correct for the 2017 L494 generation. Do not substitute a newer Range Rover dashboard or interior.'
  };
}

function resolvedScene(state) {
  if (state.idea) return state.idea;
  if (state.vehicleScene !== 'none') return `The primary subject is seated naturally inside the selected stationary vehicle at the selected generic Saudi location.`;
  return `A photorealistic scene with ${state.people} subject${state.people === '1' ? '' : 's'} consistent with the structured selections below.`;
}

function realismInstructions(state) {
  const instructions = [];
  for (const module of REALISM_MODULES) {
    const level = state.modules[module.id];
    if (level === 'auto') instructions.push(module.auto);
    if (level === 'strict') instructions.push(module.strict);
  }
  return instructions;
}

function cameraPrompt(state) {
  const capture = optionById('captureType', state.captureType)?.prompt || '';
  const framing = framingMap.get(state.framing)?.prompt || '';
  return `${capture}; ${framing}; ${state.focalLength}mm equivalent focal length; optical camera-to-primary-subject distance ${state.distance}cm; yaw ${state.yaw}°; pitch ${state.pitch}°; roll ${state.roll}°. Numeric geometry is authoritative.`;
}

function blockedText(status) {
  const title = status.strict ? 'OUTPUT BLOCKED BY STRICT REALISM' : 'OUTPUT BLOCKED BY INVALID INPUT';
  return [title, ...status.blocking.map((item) => `- [${item.code}] ${item.message}`)].join('\n');
}

function prepare(input) {
  const status = validationStatus(input);
  return { ...status, state: normalizeState(input) };
}

export function compileDetailed(input) {
  const prepared = prepare(input);
  if (prepared.blocked) return blockedText(prepared);

  const { state } = prepared;
  const subject = subjectPrompt(state);
  const light = lightingPrompt(state);
  const vehicle = vehiclePrompt(state);
  const reference = referenceInstruction(state);
  const realism = realismInstructions(state);
  const ratio = ratioMap.get(state.ratio)?.prompt || state.ratio;
  const time = optionById('time', state.time)?.prompt || state.time;

  const lines = [
    'GENERATE ONE PHOTOREALISTIC IMAGE',
    '',
    'CONSTRAINT PRIORITY: structured fields below are authoritative. If free-text scene wording conflicts with them, follow the structured fields.',
    prepared.strict ? 'STRICT GATE: physical conflicts have already been rejected; do not relax or reinterpret the structured constraints.' : '',
    '',
    `CORE SCENE: ${resolvedScene(state)}`,
    `LOCATION: ${locationPrompt(state)}`,
    `TIME: ${time}.`,
    `CAPTURE GEOMETRY: ${cameraPrompt(state)}`,
    `SUBJECTS: ${state.people}; primary apparent age ${state.age} years.`,
    `POSE: ${subject.pose}.`,
    `EXPRESSION: ${subject.expression}.`,
    `HAIR: ${subject.hair}.`,
    `FACIAL HAIR: ${subject.beard}.`,
    `CLOTHING: ${subject.clothing}.`,
    `GLASSES: ${subject.glasses}.`,
    `ASPECT RATIO: ${ratio}.`
  ].filter(Boolean);

  if (vehicle) lines.push(`VEHICLE: ${vehicle.line}`, `VISIBLE CABIN DETAILS: ${vehicle.cabin}`, `VEHICLE CONSTRAINTS: ${vehicle.constraints}`);
  if (reference) lines.push(`REFERENCE: ${reference}`);

  lines.push(
    '',
    `PHYSICAL LIGHTING: ${light.source}; ${light.direction}; ${light.falloff}. Physical illumination alone determines received light, shadows, highlights, reflections, and local brightness.`,
    `CAMERA PROCESSING: ${light.exposure}; ${light.hdr}; ${light.whiteBalance}. Processing may reveal captured signal but must not invent illumination that never reached the scene.`
  );

  if (realism.length) {
    lines.push('', 'REALISM MODULES:');
    realism.forEach((text) => lines.push(`- ${text}`));
  }

  if (state.notes) lines.push('', `ADDITIONAL USER DETAILS: ${state.notes}`, 'Additional details are subordinate to the structured physical constraints above.');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function compileConcise(input) {
  const prepared = prepare(input);
  if (prepared.blocked) return blockedText(prepared);

  const { state } = prepared;
  const subject = subjectPrompt(state);
  const light = lightingPrompt(state);
  const vehicle = vehiclePrompt(state);
  const reference = referenceInstruction(state);
  const realism = realismInstructions(state).join(' ');
  const ratio = ratioMap.get(state.ratio)?.prompt || state.ratio;
  const time = optionById('time', state.time)?.prompt || state.time;

  return [
    'Create one photorealistic image.',
    `Scene: ${resolvedScene(state)}`,
    `Location: ${locationPrompt(state)}`,
    `Time: ${time}.`,
    `Capture: ${cameraPrompt(state)}`,
    `Subject: ${state.people} subject${state.people === '1' ? '' : 's'}; primary apparent age ${state.age} years; ${subject.pose}; ${subject.expression}; hair: ${subject.hair}; facial hair: ${subject.beard}; clothing: ${subject.clothing}; glasses: ${subject.glasses}.`,
    vehicle ? `Vehicle: ${vehicle.line} ${vehicle.cabin} ${vehicle.constraints}` : '',
    reference ? `Reference: ${reference}` : '',
    `Physical lighting: ${light.source}; ${light.direction}; ${light.falloff}. Processing: ${light.exposure}; ${light.hdr}; ${light.whiteBalance}.`,
    realism,
    state.notes ? `Additional details: ${state.notes}. Structured physical constraints remain authoritative.` : '',
    `Aspect ratio: ${ratio}.`
  ].filter(Boolean).join('\n');
}

export function compileNegative(input) {
  const prepared = prepare(input);
  if (prepared.blocked) return blockedText(prepared);

  const { state } = prepared;
  const negatives = [
    'named city', 'recognizable landmark', 'famous building', 'named tourist attraction', 'city-defining skyline',
    'impossible anatomy', 'extra fingers', 'extra limbs', 'floating objects', 'impossible contact',
    'inconsistent reflections', 'light without a physical source', 'lighting inconsistent with time or place',
    'plastic skin', 'over-smoothed skin', 'excessive HDR', 'artificial sharpening', 'camera geometry inconsistent with framing'
  ];

  if (state.referenceAttached && state.referenceRole === 'identity-only') {
    negatives.push('copying reference clothing', 'copying reference background', 'copying reference pose', 'copying reference lighting');
  }
  if (state.vehicleScene !== 'none') {
    negatives.push('newer Range Rover interior', 'incorrect SUV cabin', 'redesigned dashboard', 'vehicle in motion');
    if (state.captureType === 'front-selfie') negatives.push('third-person camera');
  }

  return negatives.join(', ');
}

export function compileJson(input) {
  const prepared = prepare(input);
  const { state } = prepared;
  const ratio = ratioMap.get(state.ratio);
  let coverage = null;
  if (ratio && Number.isFinite(state.focalLength) && state.focalLength > 0 && Number.isFinite(state.distance) && state.distance > 0) {
    coverage = fieldCoverageCm({ ratioId: state.ratio, focalLengthEqMm: state.focalLength, distanceCm: state.distance });
  }

  const payload = {
    status: {
      strict: prepared.strict,
      blocked: prepared.blocked,
      issues: prepared.issues
    },
    scene: {
      idea: state.idea,
      resolved: resolvedScene(state),
      location_id: state.location,
      location: locationPrompt(state),
      time: state.time,
      aspect_ratio: ratio ? { id: ratio.id, width: ratio.width, height: ratio.height, prompt: ratio.prompt } : null
    },
    reference: { attached: state.referenceAttached, role: state.referenceRole },
    capture: {
      type: state.captureType,
      framing: state.framing,
      focal_length: { value: state.focalLength, unit: 'mm equivalent' },
      optical_distance: { value: state.distance, unit: 'cm' },
      yaw: { value: state.yaw, unit: 'deg' },
      pitch: { value: state.pitch, unit: 'deg' },
      roll: { value: state.roll, unit: 'deg' },
      approximate_field_coverage: coverage ? { width: { value: Number(coverage.widthCm.toFixed(2)), unit: 'cm' }, height: { value: Number(coverage.heightCm.toFixed(2)), unit: 'cm' } } : null
    },
    subject: {
      count: Number(state.people),
      primary_apparent_age: { value: state.age, unit: 'years' },
      ...subjectPrompt(state)
    },
    vehicle: state.vehicleScene === 'none' ? { enabled: false } : { enabled: true, id: state.vehicleScene, ...vehiclePrompt(state) },
    lighting: {
      source: lightingPrompt(state).source,
      direction: lightingPrompt(state).direction,
      falloff: lightingPrompt(state).falloff
    },
    processing: {
      exposure: lightingPrompt(state).exposure,
      hdr: lightingPrompt(state).hdr,
      white_balance: lightingPrompt(state).whiteBalance
    },
    realism_modules: Object.fromEntries(REALISM_MODULES.map(({ id }) => [id, state.modules[id]])),
    notes: state.notes
  };

  return JSON.stringify(payload, null, 2);
}
