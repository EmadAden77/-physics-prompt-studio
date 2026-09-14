import { commonOption, getVehicle } from '../data/carSelfieCommonCatalog.js';
import { OUTSIDE_CATALOG } from '../data/carSelfieOutsideCatalog.js';

const opt = (field, id) => (OUTSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;
const p = (field, id) => opt(field, id)?.prompt || '';

export function compileOutsideSections(state) {
  const vehicle = getVehicle(state.vehicleProfile);
  const lens = commonOption('cameraLens', state.cameraLens);
  const remoteRule = state.captureMode === 'remote-rear'
    ? 'The phone is physically supported on a stable mount/tripod and triggered by timer or remote. The subject does not hold it. This is a self-portrait beside the car, not a hand-held selfie.'
    : 'This is a genuine arm-length front-camera selfie. Phone distance and wrist/shoulder geometry must remain physically reachable.';
  const teleRule = lens?.id === 'rear-tele-70'
    ? 'Use the official 70mm Xiaomi 15 Ultra telephoto perspective. If the initial request says 75mm, normalize it to the real 70mm optic; do not invent a 75mm lens.'
    : '';

  return [
    `MODE: OUTSIDE BESIDE-CAR SELF-PORTRAIT ONLY. Do not introduce cabin seating, dashboard glow, cabin clutter or seat/steering instructions.`,
    `VEHICLE EXTERIOR: ${vehicle?.outsidePrompt || ''}; ${p('vehicleState', state.vehicleState)}. The car remains stationary with tires carrying real weight, contact patches and ground shadows.`,
    `EXTERIOR CAPTURE SUPPORT: ${p('captureMode', state.captureMode)}. ${remoteRule} ${teleRule}`,
    `STANDING POSE: ${p('standingPose', state.standingPose)}. Feet, pelvis, spine, shoulder rotation and any car contact must follow balance, reach and gravity.`,
    `PAINT & BODY PHYSICS: ${p('paintCondition', state.paintCondition)}. Paint reflections are environment-dependent and warped only by real panel curvature. Metallic/clearcoat highlights obey source direction and viewing angle.`,
    `GLASS PHYSICS: windshield and side glass combine transmission with angle-dependent Fresnel reflection. Reflected sky, poles, storefront spill or nearby objects must correspond to what the glass can physically see.`,
    `WHEELS & TIRES: wheel perspective matches body perspective; tires contact the ground with realistic flattening/contact shadow, no floating wheels, no impossible rim orientation.`,
    `OUTDOOR HAIR/POSE INTERACTION: clothing hems and loose hair may move only in the same coherent airflow direction supported by the selected weather. Contact with the car creates local fabric compression or fold changes only where contact occurs.`,
    `ANTI-AI-TELLS: preserve visible skin pores, age-appropriate facial lines, a few physically plausible stray hairs, source-consistent corneal reflections/catchlights, visible fabric fibers at realistic viewing distance, and small natural asymmetries/variations in skin, hair, stitching, paint micro-reflections and folds. Do not beautify, airbrush, perfectly groom, symmetrize or sterilize natural texture.`
  ];
}

export function compileOutsideNegative() {
  return [
    'no cabin clutter in outside mode',
    'no dashboard or seat instructions in outside mode',
    'no moving vehicle while subject stands beside it',
    'no rear Leica lens for hand-held front selfie',
    'no invented 75mm Xiaomi lens; use official 70mm telephoto',
    'no floating tires',
    'no impossible body-panel reflections',
    'no duplicated car reflections',
    'no person intersecting the vehicle',
    'no unsupported remote camera',
    'no studio key light unless physically present in the scene',
    'AI-generated look, plastic skin, over-smoothed skin, symmetric face, perfectly styled hair, glossy hair, uniform fabric, no wrinkles, oversaturated colors, HDR overprocessing, teal-orange grading, impossible lighting, dual shadows without dual sources, floating objects, cartoon, 3D render, digital art, illustration, airbrushed, retouched, beauty filter, smooth bokeh, artificial depth of field, fake lens flare, perfect composition, centered framing, dead eyes, missing corneal reflections, wrong finger count, extra fingers, deformed hands, gibberish text, watermark'
  ].join(', ');
}
