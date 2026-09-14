import { commonOption, getVehicle } from '../data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG, getInsideClutterItems } from '../data/carSelfieInsideCatalog.js';

const opt = (field, id) => (INSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;
const p = (field, id) => opt(field, id)?.prompt || '';

export function compileInsideSections(state) {
  const vehicle = getVehicle(state.vehicleProfile);
  const clutterItems = getInsideClutterItems(state.clutterLevel);
  const clutterText = clutterItems.length
    ? clutterItems.map((item) => item.prompt).join(' ')
    : 'No loose clutter is present.';
  const motion = opt('vehicleState', state.vehicleState);
  const seat = opt('seat', state.seat);

  const lhd = seat?.role === 'driver'
    ? 'LEFT-HAND-DRIVE LOCK: subject is in the front-left driver seat; steering wheel and cluster are physically left, center console is to the driver’s right. Never mirror the cabin.'
    : 'LEFT-HAND-DRIVE LOCK: subject is in the front-right passenger seat; steering wheel and cluster remain physically on the left side. Never mirror the cabin.';

  const motionRule = motion?.moving
    ? 'Vehicle is moving. Camera support, hands, gaze and shutter/motion behavior must reflect real driving. No hand-held selfie while moving.'
    : 'Vehicle is fully stationary. Do not imply wheel rotation, road streaking or driving motion.';

  return [
    `MODE: INSIDE CAR SELFIE ONLY. Do not introduce exterior standing poses or exterior body-interaction instructions.`,
    `VEHICLE & SEATING: ${vehicle?.insidePrompt || ''}; ${p('vehicleState', state.vehicleState)}; ${p('seat', state.seat)}. ${lhd}`,
    `INSIDE CAPTURE SUPPORT: ${p('captureMode', state.captureMode)}. ${motionRule}`,
    `HANDS & CONTACT: ${p('handPose', state.handPose)}. Shoulder, elbow, wrist, seat contact and gravity must remain anatomically plausible.`,
    `CABIN MATERIALS: ${p('cabinMaterial', state.cabinMaterial)}; ${p('clusterType', state.clusterType)}; ${p('roofType', state.roofType)}. Leather/fabric compression, stitching, trim roughness and reflections must match real material response.`,
    `WINDOW/AIRFLOW: ${p('windowState', state.windowState)}. Hair and loose-item motion may only respond to airflow that can physically enter or originate inside the cabin.`,
    `INTERIOR CLUTTER: ${p('clutterLevel', state.clutterLevel)}. ${clutterText} Every object has support, gravity, contact shadow and inertia consistent with vehicle state; nothing floats, clips through controls or blocks safe operation.`,
    `CABIN EMITTER: ${p('cabinEmitter', state.cabinEmitter)}. Dashboard/phone/dome sources are local emitters with rapid or realistic distance falloff. They cannot light the entire torso, roof or rear cabin without sufficient physical reach.`,
    `REFLECTIONS INSIDE: windshield, side glass, panoramic glass and glossy trim reflect only sources/environments visible to their surface orientation. No duplicated face, decorative highlights or impossible mirror geometry.`,
    `ANTI-AI-TELLS: preserve visible skin pores, age-appropriate facial lines, a few physically plausible stray hairs, source-consistent corneal reflections/catchlights, visible fabric fibers at realistic viewing distance, and small natural asymmetries/variations in skin, hair, stitching and folds. Do not beautify, airbrush, perfectly groom, symmetrize or sterilize natural texture.`
  ];
}

export function compileInsideNegative() {
  return [
    'no exterior standing pose in inside mode',
    'no rear Leica lens in genuine inside front-camera selfie mode',
    'no right-hand-drive mirroring',
    'no steering wheel on passenger side',
    'no duplicated steering wheel',
    'no newer-generation cabin for L494 2017',
    'no floating phone or unsupported arm',
    'no hand-held selfie while vehicle is moving',
    'no floating clutter',
    'no dashboard glow lighting the entire cabin',
    'no exterior wind moving hair through closed windows',
    'AI-generated look, plastic skin, over-smoothed skin, symmetric face, perfectly styled hair, glossy hair, uniform fabric, no wrinkles, oversaturated colors, HDR overprocessing, teal-orange grading, impossible lighting, dual shadows without dual sources, floating objects, cartoon, 3D render, digital art, illustration, airbrushed, retouched, beauty filter, smooth bokeh, artificial depth of field, fake lens flare, perfect composition, centered framing, dead eyes, missing corneal reflections, wrong finger count, extra fingers, deformed hands, gibberish text, watermark'
  ].join(', ');
}
