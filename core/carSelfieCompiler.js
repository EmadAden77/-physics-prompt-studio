import {
  commonOption,
  getCameraOptic,
  getClothing,
  getFabric,
  getVehicle
} from '../data/carSelfieCommonCatalog.js';
import { analyzeInsideIntent } from '../data/carSelfieInsideCatalog.js';
import { analyzeOutsideIntent } from '../data/carSelfieOutsideCatalog.js';
import { carValidationStatus, normalizeCarState } from './carSelfieValidation.js';
import { compileInsideNegative, compileInsideSections } from './carSelfieInsideCompiler.js';
import { compileOutsideNegative, compileOutsideSections } from './carSelfieOutsideCompiler.js';

const prompt = (field, id) => commonOption(field, id)?.prompt || '';

const HARD_ACCEPTANCE = `HARD ACCEPTANCE CRITERIA (image FAILS if any is violated):
1. Skin must show visible pores, fine vellus hair, and subtle tonal variation. If skin appears perfectly smooth, airbrushed, or waxy, the image FAILS.
2. Hair must show visible individual strand separation and 2-4 physically plausible stray hairs. If hair appears uniformly glossy or helmet-like, the image FAILS.
3. Facial symmetry must be naturally imperfect. If the face is perfectly mirrored, the image FAILS.
4. Denim and other fabrics must show: seam bunching at shoulder/elbow, gravity-driven wrinkles, matte fiber response, and slight indigo/value variation. If fabric appears as a smooth painted surface, the image FAILS.
5. Camera tilt must be 1-3 degrees off-perfect-level. If composition is perfectly level and centered, the image FAILS.
6. Corneal reflections must show source-consistent catchlights. If eyes are glassy or have symmetrical artificial catchlights, the image FAILS.
7. No brand text, logo, or readable signage may appear in the frame unless explicitly requested. If visible brand text appears, the image FAILS.
8. Composition must be slightly off-center (subject not dead-center). If perfectly centered, the image FAILS.`;

export function analyzeCarSelfieIntent(request = '', mode = 'inside', baseState = {}) {
  return mode === 'outside' ? analyzeOutsideIntent(request, baseState) : analyzeInsideIntent(request, baseState);
}

function referenceRule(state) {
  if (state.referenceRole === 'none') return 'do not use a reference image';
  if (state.referenceRole === 'identity-appearance') return 'use the attached reference for identity and visible appearance only; all camera, mode, vehicle, lighting and physics rules remain authoritative';
  return 'use the attached reference for identity only; preserve identity-defining facial structure, apparent age, natural asymmetry, skin tone, hairline, visible hair density and facial-hair pattern; do not copy pose, clothing, background, camera angle or lighting';
}

function commonSections(state) {
  const lens = getCameraOptic(state.cameraLens);
  const clothing = getClothing(state.clothing);
  const fabric = getFabric(state.fabricType);
  const place = commonOption('place', state.place);
  const cameraDistortion = lens?.side === 'front'
    ? 'Preserve normal wide front-camera perspective: nearer facial planes may appear slightly larger, but do not beautify, flatten or telephoto-compress the face.'
    : 'Use perspective compression appropriate to the selected rear lens and real subject distance; do not simulate shallow DSLR bokeh beyond smartphone optics/computation.';

  return [
    `INITIAL INTENT: ${state.initialRequest.trim() || (state.mode === 'inside' ? 'natural in-car selfie' : 'natural self-portrait beside a parked car')}`,
    `XIAOMI 15 ULTRA CAMERA LOCK: ${lens?.prompt || ''}. Hardware authority: ${state.focalLength}mm equivalent, f/${state.aperture}. These values come from the selected optic and may not drift.`,
    `CAMERA PROCESSING: ${prompt('colorProfile', state.colorProfile)}; ${prompt('lowLightProcessing', state.lowLightProcessing)}; ${prompt('exposure', state.exposure)}; ${prompt('hdr', state.hdr)}; ${prompt('whiteBalance', state.whiteBalance)}. HDR/exposure/denoising may reveal or merge captured signal but never create physical illumination.`,
    `CAMERA GEOMETRY: ${state.focalLength}mm equivalent at ${state.distance}cm; yaw ${state.yaw}°; pitch ${state.pitch}°; roll ${state.roll}°. ${cameraDistortion}`,
    `PLACE: ${place?.prompt || ''}. ROAD/SURFACE: ${place?.surface || ''}. CURB: ${place?.curb || ''}. VEGETATION: ${place?.vegetation || ''}. PEOPLE/PRIVACY: ${place?.people || ''}. WEATHER: ${prompt('weather', state.weather)}.`,
    `PHYSICAL EXTERIOR LIGHTING: ${prompt('externalLight', state.externalLight)}. One source can create only its own coherent shadow/highlight family. A second opposing shadow requires a real second source with plausible position and intensity. Reflections obey incidence/view geometry.`,
    `SUBJECT: apparent age ${state.apparentAge}; ${prompt('expression', state.expression)}; ${prompt('gazeTarget', state.gazeTarget)}; ${prompt('skinDetail', state.skinDetail)}. Eye convergence, eyelids, cheeks, mouth corners and neck rotation must remain anatomically coupled; avoid uncanny symmetry, glassy eyes and waxy skin.`,
    `CLOTHING: ${clothing?.prompt || ''}. FABRIC TYPE: ${fabric?.prompt || ''}. LIGHT RESPONSE: ${prompt('fabricSheen', state.fabricSheen)}. WRINKLES: ${prompt('wrinkleProfile', state.wrinkleProfile)}. Folds follow gravity, joints, material stiffness and contact; highlights follow real fiber/finish response.`,
    `HAIR PHYSICS: ${prompt('hairProfile', state.hairProfile)}. ${prompt('hairMotion', state.hairMotion)}. ${prompt('hairSpecular', state.hairSpecular)}. Hair density and hairline are invariant across angle, light and motion; only visibility and strand orientation may change.`,
    `REFERENCE: ${referenceRule(state)}. Preserve natural identity, asymmetry and skin texture without cosmetic reinterpretation.`
  ];
}

export function compileCarSelfieDetailed(input = {}) {
  const state = normalizeCarState(input);
  const status = carValidationStatus(state);
  if (status.blocked) {
    return ['OUTPUT BLOCKED BY CAR PHYSICS CHECKER', ...status.issues.filter((item) => item.severity !== 'warning').map((item) => `- ${item.code}: ${item.message}`)].join('\n');
  }
  const modeSections = state.mode === 'outside' ? compileOutsideSections(state) : compileInsideSections(state);
  return [
    'CAR SELFIE PHYSICS STUDIO V7.1 — PHOTOREALISTIC PROMPT SPECIFICATION',
    '',
    `ACTIVE MODE: ${state.mode === 'outside' ? 'OUTSIDE BESIDE CAR' : 'INSIDE CAR'}. The inactive mode is forbidden and contributes zero fields or instructions.`,
    ...commonSections(state),
    ...modeSections,
    state.notes.trim() ? `USER NOTES: ${state.notes.trim()}` : '',
    '',
    'FORENSIC QA BEFORE FINALIZING: verify active-mode isolation, Xiaomi optic authority, camera support, arm reach or remote support, light-source causality, shadow directions, glass/paint reflections, fabric folds, fixed hair density, facial muscle coupling, privacy of strangers, vehicle contact/grounding and absence of impossible anatomy or floating objects.',
    HARD_ACCEPTANCE
  ].filter(Boolean).join('\n');
}

export function compileCarSelfieConcise(input = {}) {
  const state = normalizeCarState(input);
  const status = carValidationStatus(state);
  if (status.blocked) return compileCarSelfieDetailed(state);
  const lens = getCameraOptic(state.cameraLens);
  const vehicle = getVehicle(state.vehicleProfile);
  return `Photorealistic ${state.mode === 'inside' ? 'inside-car selfie' : 'outside self-portrait beside a parked car'} using Xiaomi 15 Ultra ${lens?.focalLengthEqMm}mm f/${lens?.aperture}. ${vehicle?.[state.mode === 'inside' ? 'insidePrompt' : 'outsidePrompt'] || ''}. ${state.distance}cm, yaw ${state.yaw}°, pitch ${state.pitch}°, roll ${state.roll}°. ${prompt('externalLight', state.externalLight)}. ${prompt('clothing', state.clothing)}; ${prompt('fabricType', state.fabricType)}; ${prompt('hairProfile', state.hairProfile)}; ${prompt('expression', state.expression)}. Enforce physical light causality, fixed hair density, real fabric folds, realistic skin, privacy-safe background people, deterministic geometry and absolute separation from the inactive mode.`;
}

export function compileCarSelfieNegative(input = {}) {
  const state = normalizeCarState(input);
  const common = 'no random mode mixing, no invented camera optics, no 75mm Xiaomi lens, no Leica rear look on front camera, no impossible arm reach, no floating phone, no impossible hand anatomy, no waxy skin, no glassy eyes, no changing hair density, no random fabric creases, no unexplained opposing shadows, no synthetic relighting, no HDR-created light, no identifiable stranger faces, no famous landmark or named city';
  return `${common}, ${state.mode === 'outside' ? compileOutsideNegative() : compileInsideNegative()}`;
}

export function compileCarSelfieJson(input = {}) {
  const state = normalizeCarState(input);
  const validation = carValidationStatus(state);
  const intent = analyzeCarSelfieIntent(state.initialRequest, state.mode, state);
  return JSON.stringify({
    version: 'car-selfie-v7.1',
    domain: 'isolated-car-selfie-dual-mode',
    deterministic: true,
    activeMode: state.mode,
    inactiveModeExcluded: state.mode === 'inside' ? 'outside' : 'inside',
    intent,
    state,
    validation,
    outputs: {
      detailed: compileCarSelfieDetailed(state),
      concise: compileCarSelfieConcise(state),
      negative: compileCarSelfieNegative(state)
    }
  }, null, 2);
}
