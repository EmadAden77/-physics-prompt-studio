import {
  CAR_CATALOG,
  CAR_DEFAULT_STATE,
  XIAOMI_15_ULTRA_PROFILE,
  analyzeCarSelfieIntent,
  getCameraOptic,
  getClutterItems,
  getFabricProfile
} from '../data/carSelfieCatalog.js';
import { normalizeCarState, carValidationStatus } from './carSelfieValidation.js';

const opt = (field, id) => (CAR_CATALOG[field] || []).find((item) => item.id === id);
const p = (field, id) => opt(field, id)?.prompt || '';

function referenceRule(s) {
  if (s.referenceRole === 'none') return 'do not use a reference image';
  if (s.referenceRole === 'identity-only') return 'use the attached reference only for identity. Preserve facial structure, head shape, apparent age, natural asymmetry, skin tone, eye spacing, nose, jaw, hairline, visible hair density, beard density and beard gaps. Do not copy pose, clothing, background, camera angle or lighting.';
  return 'use the attached reference for identity and visible appearance only. Cabin, camera, physical lighting and geometry rules remain authoritative.';
}

function cameraRule(s) {
  const lens = getCameraOptic(s.cameraLens);
  const color = opt('colorProfile', s.colorProfile);
  const low = opt('lowLightProcessing', s.lowLightProcessing);
  if (!lens) return '';
  const sideRule = lens.side === 'front'
    ? 'This is the real front camera path: no Leica rear-lens branding, no OIS claim, fixed focus, and front-camera perspective behavior.'
    : 'This is a rear Leica optical path. Leica Authentic/Vibrant may affect color rendering only; it cannot change geometry, exposure causality or the physical light that reached the sensor.';
  return `${lens.prompt}. Fixed optical values: ${lens.focalLengthEqMm}mm equivalent, f/${lens.aperture}. ${color?.prompt || ''}. ${low?.prompt || ''}. ${sideRule}`;
}

function perspectiveRule(s) {
  const lens = getCameraOptic(s.cameraLens);
  if (!lens) return '';
  if (lens.focalLengthEqMm <= 23) return 'Wide smartphone perspective must be physically visible: nearby facial planes may show mild natural perspective expansion, but no artificial face slimming, no impossible edge stretching and no DSLR-like compression.';
  if (lens.focalLengthEqMm >= 70) return 'Telephoto perspective must show real compression and a narrower field of view. Do not fake a wide cabin view while keeping 70–100mm optics.';
  return 'Perspective must match the selected focal length and subject distance.';
}

function motionRule(s) {
  const motion = opt('vehicleState', s.vehicleState);
  if (!motion?.moving) return 'The vehicle is stationary. No wheel-rotation cues, road streaks, inertial lean or motion blur may appear. Loose items settle under gravity with ordinary contact.';
  return 'The vehicle is moving. The phone must be physically mounted for the driver. Exterior motion softness follows the direction and magnitude of motion only. Shutter time must remain short enough to preserve a believable face; small loose objects may shift only in directions explained by acceleration, braking or turns.';
}

function handheldRule(s) {
  const capture = opt('captureMode', s.captureMode);
  if (!capture?.phoneHeld) return 'The phone is physically mounted. No hand or arm may pretend to hold the camera, and the camera viewpoint must coincide with a plausible mount location.';
  if (capture.id === 'handheld-front') return 'The subject genuinely holds the phone at about 30–50 cm. Shoulder rotation, elbow flexion, wrist pitch and phone orientation must all be reachable. The phone-holding hand may remain outside frame, but no floating wrist, partial phantom arm or impossible camera position is allowed.';
  return 'The phone is genuinely hand-held for the mirror composition. The arm must remain anatomically supported and the device orientation must match the reflection path.';
}

function seatGeometryRule(s) {
  const seat = opt('seat', s.seat);
  if (seat?.role === 'driver') return 'LEFT-HAND-DRIVE SPATIAL LOCK: subject in front-left driver seat; steering wheel physically left; instrument cluster behind that wheel; center console physically to the driver’s right; driver door and side window on the driver’s left. Never mirror into right-hand drive.';
  return 'LEFT-HAND-DRIVE CABIN LOCK: subject in front-right passenger seat; steering wheel and instrument cluster remain on the physical left side of the cabin; center console lies to the passenger’s left. Never mirror the cabin.';
}

function lightRule(s) {
  const external = opt('externalLight', s.externalLight);
  const emitter = opt('cabinEmitter', s.cabinEmitter);
  return `${external?.prompt || ''}. ${emitter?.prompt || ''}. Every visible shadow, highlight and reflection must be traceable to one of these selected sources. A second shadow direction is permitted only if a second real selected source reaches that surface. Exposure, HDR and denoising reveal or combine captured signal; they never create illumination on a surface that received none.`;
}

function reflectionRule(s) {
  if (s.captureMode === 'rearview-mirror') return 'REAR-VIEW MIRROR LAW: treat the mirror as one real reflective plane. Camera ray, mirror normal and reflected subject ray must obey equal incidence/reflection angles. The reflected face, phone and cabin orientation must remain coherent; no duplicated subject, impossible hidden phone or contradictory left/right cabin.';
  return 'GLASS REFLECTION LAW: windshield, side glass and panoramic roof show angle-dependent reflections only from exterior sky/lights or cabin sources they can physically see. Polished metal/wood highlights follow surface normals. No decorative floating highlights or duplicated objects.';
}

function placeRule(s) {
  const place = opt('place', s.place);
  const weather = opt('weather', s.weather);
  if (!place) return '';
  return `${place.prompt}. Ground/road: ${place.surface}. Edge treatment: ${place.curb}. Vegetation: ${place.vegetation}. Background people/privacy: ${place.people}. Weather/air: ${weather?.prompt || ''}. Keep the Saudi environment generic: no named city, famous landmark, readable venue branding or city-defining skyline.`;
}

function clothingRule(s) {
  const clothing = opt('clothing', s.clothing);
  const fabric = getFabricProfile(s.clothing);
  if (!clothing || !fabric) return '';
  return `${clothing.prompt}. FABRIC PHYSICS (${fabric.label}): surface ${fabric.roughness}; folds ${fabric.wrinkle}; optical response ${fabric.light}; seated/contact behavior ${fabric.compression}. Fabric may not shine, wrinkle or drape like a different material.`;
}

function hairRule(s) {
  const hair = opt('hairProfile', s.hairProfile);
  const window = opt('windowState', s.windowState);
  const moving = opt('vehicleState', s.vehicleState)?.moving;
  const airflow = s.windowState === 'closed'
    ? 'Windows are closed: exterior wind cannot move hair. Only tiny gravity/pose settling is allowed.'
    : moving
      ? 'Real airflow may enter from the selected open window. Only exposed loose strands move in the physically correct direction and magnitude.'
      : 'The open window allows only weak ambient airflow; do not invent dramatic hair motion.';
  return `${hair?.prompt || ''}. HAIR DENSITY LOCK: visible density, hairline coverage and strand population remain constant across lighting, angle and motion. Specular highlights follow strand tangents and real light direction; brightness changes may not masquerade as density changes. ${hair?.airflowResponse || ''}. ${window?.prompt || ''}. ${airflow}`;
}

function faceRule(s) {
  const expression = opt('expression', s.expression);
  return `${expression?.prompt || ''}. Muscle basis: ${expression?.muscleRule || ''}. FACIAL ANATOMY: eyelids, pupils, sclera exposure, mouth corners, cheeks and jaw must move as one anatomically coupled expression. Preserve natural asymmetry. Skin must retain pores, fine lines, peach fuzz, tiny tonal variation and physically plausible subsurface/specular response. No waxy smoothing, glass eyes, doubled catchlights without matching sources, or uncanny symmetry.`;
}

function clutterRule(s) {
  const level = opt('clutterLevel', s.clutterLevel);
  const items = getClutterItems(s.clutterLevel);
  if (!level) return '';
  if (!items.length) return `${level.prompt}. No loose objects should appear unless the user notes explicitly add them.`;
  const descriptions = items.map((item) => `${item.prompt}; ${item.physics}`).join(' | ');
  return `${level.prompt}. CLUTTER SET: ${descriptions}. Gravity is always downward relative to the vehicle floor. Every item needs real support/contact, contact shadow and material-appropriate reflection. During motion, inertia may shift loose items only consistently with acceleration; nothing floats, clips through trim, blocks pedals or intersects the steering wheel.`;
}

function nightNoiseRule(s) {
  if (s.time !== 'night') return 'Day/golden capture should not contain fake high-ISO night grain or computational night smearing.';
  const low = opt('lowLightProcessing', s.lowLightProcessing);
  const moving = opt('vehicleState', s.vehicleState)?.moving;
  return moving
    ? 'LOW-LIGHT SENSOR BEHAVIOR: favor a shorter exposure to protect the face from motion smear; accept realistic shadow noise, limited dynamic range and small local clipping. Do not erase all noise.'
    : `LOW-LIGHT SENSOR BEHAVIOR: ${low?.prompt || ''}. Multi-frame alignment may reduce noise only where frames align; moving hands, people outside or reflections may retain slight residual noise/ghost risk. Do not invent texture that was never captured.`;
}

export function compileCarSelfieDetailed(input = {}) {
  const s = normalizeCarState(input);
  const status = carValidationStatus(s);
  if (status.blocked) return ['OUTPUT BLOCKED BY STRICT CAR SELFIE PHYSICS', ...status.issues.filter((item) => item.severity !== 'warning').map((item) => `- ${item.code}: ${item.message}`)].join('\n');

  const autoWarnings = status.issues.length ? `AUTO CHECK NOTES: ${status.issues.map((item) => `${item.code}: ${item.message}`).join(' | ')}` : '';

  return [
    'GENERATE ONE PHOTOREALISTIC IMAGE — XIAOMI 15 ULTRA CAR SELFIE PHYSICS V2',
    '',
    `INITIAL INTENT: ${s.initialRequest.trim() || 'natural in-car selfie'}`,
    `VEHICLE: ${p('vehicleProfile', s.vehicleProfile)}; ${p('vehicleState', s.vehicleState)}.`,
    `PLACE / SAUDI STREET PHYSICS: ${placeRule(s)}`,
    `SEATING: ${p('seat', s.seat)}. ${seatGeometryRule(s)}`,
    `CAPTURE TYPE LOCK: ${p('captureMode', s.captureMode)}. ${handheldRule(s)}`,
    `XIAOMI 15 ULTRA CAMERA LOCK: ${cameraRule(s)}`,
    `CAMERA GEOMETRY: ${p('framing', s.framing)}; optical subject distance ${s.distance}cm; yaw ${s.yaw}°; pitch ${s.pitch}°; roll ${s.roll}°. Focal length and aperture are hardware-derived and cannot be overridden. ${perspectiveRule(s)}`,
    `MOTION / SHUTTER CONSISTENCY: ${motionRule(s)} ${nightNoiseRule(s)}`,
    `SUBJECT: apparent age ${s.apparentAge}; ${faceRule(s)}`,
    `CLOTHING: ${clothingRule(s)}`,
    `HAIR PHYSICS: ${hairRule(s)}`,
    `HANDS / CONTACT: ${p('handPose', s.handPose)}. Correct shoulder rotation, elbow support, wrist angle, seat contact, gravity and steering-wheel contact. No hovering fingers or unsupported limbs.`,
    `REFERENCE: ${referenceRule(s)} No beautification, de-aging, face slimming, eye enlargement, synthetic symmetry or skin smoothing.`,
    `CABIN MATERIALS: ${p('cabinMaterial', s.cabinMaterial)}; ${p('clusterType', s.clusterType)}; ${p('roofType', s.roofType)}. Materials must show correct roughness, leather compression, stitching, reflection geometry and restrained wear.`,
    `CAR INTERIOR CLUTTER: ${clutterRule(s)}`,
    `PHYSICAL LIGHTING: ${lightRule(s)}`,
    `CAMERA PROCESSING: ${p('exposure', s.exposure)}; ${p('hdr', s.hdr)}; ${p('whiteBalance', s.whiteBalance)}. Computational processing must never create a shadow/highlight direction unsupported by physical sources.`,
    `REFLECTION GEOMETRY: ${reflectionRule(s)}`,
    'DEPTH / CABIN LOGIC: dashboard scale, seat spacing, roof height, pillars, mirrors, windows and center console must agree with one coherent cabin. No impossible cabin expansion, floating controls or newer-generation parts when a period-specific profile is selected.',
    s.notes.trim() ? `USER NOTES: ${s.notes.trim()}` : '',
    autoWarnings,
    '',
    'FORENSIC QA BEFORE FINALIZING: verify Xiaomi lens/aperture identity, front-vs-rear camera path, Leica profile eligibility, LHD geometry, arm reach, seat side, steering-wheel location, hand contact, mirror reflection rays, window reflections, direct-sun/streetlight direction, secondary-shadow causality, dashboard/phone falloff, HDR causality, noise/shutter consistency, fabric roughness/folds, hair-density lock, facial muscle anatomy, skin microtexture, clutter gravity/contact/inertia, Saudi road/curb/vegetation logic, stranger privacy, and absence of impossible anatomy or mirrored cabin logic.'
  ].filter(Boolean).join('\n');
}

export function compileCarSelfieConcise(input = {}) {
  const s = normalizeCarState(input);
  const status = carValidationStatus(s);
  if (status.blocked) return compileCarSelfieDetailed(s);
  const lens = getCameraOptic(s.cameraLens);
  return `Photorealistic Xiaomi 15 Ultra in-car image. ${p('vehicleProfile', s.vehicleProfile)}; ${p('vehicleState', s.vehicleState)}; ${p('seat', s.seat)}; ${p('captureMode', s.captureMode)}. Camera hardware locked to ${lens?.focalLengthEqMm}mm eq f/${lens?.aperture}, ${p('colorProfile', s.colorProfile)}; ${p('framing', s.framing)} at ${s.distance}cm, yaw ${s.yaw}°, pitch ${s.pitch}°, roll ${s.roll}°. LHD cabin never mirrored. ${placeRule(s)} Subject age ${s.apparentAge}; ${p('expression', s.expression)}; ${clothingRule(s)} ${hairRule(s)} ${p('handPose', s.handPose)}. ${clutterRule(s)} Lighting: ${lightRule(s)} ${reflectionRule(s)} Preserve realistic smartphone HDR/noise limits, skin pores, fabric response, gravity, contact and motion/shutter physics.`;
}

export function compileCarSelfieNegative() {
  return [
    'no right-hand-drive mirroring',
    'no steering wheel on passenger side',
    'no duplicated steering wheel',
    'no 75mm Xiaomi 15 Ultra rear lens; use the real 70mm telephoto if telephoto is selected',
    'no Leica Authentic/Vibrant on the front camera',
    'no f/1.63 claim on the front camera',
    'no front-camera OIS claim',
    'no handheld driver selfie while the car is moving',
    'no arm reach beyond plausible geometry',
    'no impossible mirror reflection',
    'no duplicated face in glass or mirrors',
    'no unexplained opposing shadow directions',
    'no HDR-generated illumination',
    'no dashboard or phone glow lighting the whole cabin',
    'no zero-noise night shadows',
    'no plastic skin or glassy eyes',
    'no changing hair density or hairline',
    'no synthetic fabric gloss inconsistent with material',
    'no floating clutter or gravity-defying bottles/papers/cables',
    'no famous Saudi landmark or named city',
    'no clear identifiable stranger faces',
    'no newer-generation cabin for period-specific L494',
    'no impossible bokeh or DSLR-like depth rendering'
  ].join(', ');
}

export function compileCarSelfieJson(input = {}) {
  const s = normalizeCarState(input);
  const intent = analyzeCarSelfieIntent(s.initialRequest);
  const validation = carValidationStatus(s);
  return JSON.stringify({
    version: 'car-selfie-v2-xiaomi-physics',
    domain: 'isolated-car-selfie',
    deterministic: true,
    cameraAuthority: XIAOMI_15_ULTRA_PROFILE,
    intent,
    state: s,
    validation,
    outputs: {
      detailed: compileCarSelfieDetailed(s),
      concise: compileCarSelfieConcise(s),
      negative: compileCarSelfieNegative()
    }
  }, null, 2);
}

export { analyzeCarSelfieIntent, CAR_DEFAULT_STATE };
