import { commonOption, getVehicle } from '../data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG, getInsideClutterItems } from '../data/carSelfieInsideCatalog.js';

const opt = (field, id) => (INSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;
const p = (field, id) => opt(field, id)?.prompt || '';

const HARD_ACCEPTANCE = `HARD ACCEPTANCE CRITERIA (image FAILS if any is violated):
1. Skin must show visible pores, fine vellus hair, and subtle tonal variation. If skin appears perfectly smooth, airbrushed, or waxy, the image FAILS.
2. Hair must show visible individual strand separation and 2-4 physically plausible stray hairs. If hair appears uniformly glossy or helmet-like, the image FAILS.
3. Facial symmetry must be naturally imperfect. If the face is perfectly mirrored, the image FAILS.
4. Denim and other fabrics must show: seam bunching at shoulder/elbow, gravity-driven wrinkles, matte fiber response, and slight indigo/value variation. If fabric appears as a smooth painted surface, the image FAILS.
5. Camera tilt must be 1-3 degrees off-perfect-level. If composition is perfectly level and centered, the image FAILS.
6. Corneal reflections must show source-consistent catchlights. If eyes are glassy or have symmetrical artificial catchlights, the image FAILS.
7. No brand text, logo, or readable signage may appear in the frame unless explicitly requested. If visible brand text appears, the image FAILS.
8. Composition must be slightly off-center (subject not dead-center). If perfectly centered, the image FAILS.`;

const SAUDI_STREET_SIGNATURE = `SAUDI STREET VISUAL SIGNATURE (visible through window):
- Asphalt must show visible oil stains, aggregate grain, and faded white line remnants.
- Curb must be a low concrete or stone edge with practical wear and dust accumulation.
- Visible vegetation must be date palm trunk silhouettes or ghaf/sidr foliage — never lush tropical greenery.
- Street lighting must be warm LED or sodium with visible fixture housing on a pole, and the emitted pool of light on the asphalt must show realistic falloff.
- The horizon must show low-rise Saudi urban structures or open desert edge, never recognizable landmarks, towers, or named cities.
- The distant background must be slightly hazy from dust or humidity, not artificially clean.`;

const CLUTTER_VISIBILITY_BUDGET = `CLUTTER VISIBILITY BUDGET:
- At most 2 clutter items may be clearly visible in the frame at any time.
- The remaining clutter items exist in the cabin but must be out of frame or in deep background with soft focus.
- No clutter item may dominate the frame or draw attention away from the subject.
- No clutter item may be a branded product with visible logo or text.`;

export function compileInsideSections(state) {
  const vehicle = getVehicle(state.vehicleProfile);
  const clutterItems = getInsideClutterItems(state.clutterLevel);
  const clutterText = clutterItems.length
    ? clutterItems.map((item) => item.prompt).join(' ')
    : 'No loose clutter is present.';
  const motion = opt('vehicleState', state.vehicleState);
  const seat = opt('seat', state.seat);
  const place = commonOption('place', state.place);

  const driverAnchor = `LHD VISUAL ANCHOR (mandatory, non-negotiable):
- The subject is in the FRONT-LEFT seat of a LEFT-HAND-DRIVE vehicle.
- In the final image, the driver-side window/door with exterior view MUST appear on the RIGHT side of the frame.
- The center console, passenger area, and interior structure MUST appear on the LEFT side of the frame.
- A sliver of the steering wheel rim or the top of the instrument cluster MUST be partially visible at the bottom-left of the frame (out of focus) as physical proof of the driver seat.
- If the visible window with exterior view appears on the LEFT side of the frame, or the interior cabin appears on the RIGHT side of the frame, the image is WRONG and must be regenerated.
- The steering wheel and cluster are on the physical LEFT of the subject, not mirrored.
- Do not mirror the cabin under any circumstance.`;

  const passengerAnchor = `LHD VISUAL ANCHOR (mandatory, non-negotiable):
- The subject is in the FRONT-RIGHT passenger seat of a LEFT-HAND-DRIVE vehicle.
- The steering wheel and instrument cluster remain physically on the vehicle's LEFT side and must not migrate to the passenger side.
- The cabin must preserve one coherent non-mirrored LHD layout with the center console physically between driver and passenger.
- Do not mirror the cabin under any circumstance.`;

  const lhdAnchor = seat?.role === 'driver' ? driverAnchor : passengerAnchor;

  const motionRule = motion?.moving
    ? 'Vehicle is moving. Camera support, hands, gaze and shutter/motion behavior must reflect real driving. No hand-held selfie while moving.'
    : 'Vehicle is fully stationary. Do not imply wheel rotation, road streaking or driving motion.';

  const showSaudiStreetSignature = state.windowState !== 'closed' && place?.kind !== 'indoor-parking';

  return [
    `MODE: INSIDE CAR SELFIE ONLY. Do not introduce exterior standing poses or exterior body-interaction instructions.`,
    `VEHICLE & SEATING: ${vehicle?.insidePrompt || ''}. ${p('vehicleState', state.vehicleState)}. ${p('seat', state.seat)}.\n${lhdAnchor}`,
    `INSIDE CAPTURE SUPPORT: ${p('captureMode', state.captureMode)}. ${motionRule}`,
    `HANDS & CONTACT: ${p('handPose', state.handPose)}. Shoulder, elbow, wrist, seat contact and gravity must remain anatomically plausible.`,
    `CABIN MATERIALS: ${p('cabinMaterial', state.cabinMaterial)}; ${p('clusterType', state.clusterType)}; ${p('roofType', state.roofType)}. Leather/fabric compression, stitching, trim roughness and reflections must match real material response.`,
    `WINDOW/AIRFLOW: ${p('windowState', state.windowState)}. Hair and loose-item motion may only respond to airflow that can physically enter or originate inside the cabin.`,
    showSaudiStreetSignature ? SAUDI_STREET_SIGNATURE : '',
    `INTERIOR CLUTTER: ${p('clutterLevel', state.clutterLevel)}. ${clutterText} Every object has support, gravity, contact shadow and inertia consistent with vehicle state; nothing floats, clips through controls or blocks safe operation.`,
    clutterItems.length ? CLUTTER_VISIBILITY_BUDGET : '',
    `CABIN EMITTER: ${p('cabinEmitter', state.cabinEmitter)}. Dashboard/phone/dome sources are local emitters with rapid or realistic distance falloff. They cannot light the entire torso, roof or rear cabin without sufficient physical reach.`,
    `REFLECTIONS INSIDE: windshield, side glass, panoramic glass and glossy trim reflect only sources/environments visible to their surface orientation. No duplicated face, decorative highlights or impossible mirror geometry.`,
    `ANTI-AI-TELLS: preserve visible skin pores, age-appropriate facial lines, a few physically plausible stray hairs, source-consistent corneal reflections/catchlights, visible fabric fibers at realistic viewing distance, and small natural asymmetries/variations in skin, hair, stitching and folds. Do not beautify, airbrush, perfectly groom, symmetrize or sterilize natural texture.`,
    HARD_ACCEPTANCE
  ].filter(Boolean);
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
    'no passenger-seat selfie when driver seat is specified',
    'no window on the left side of frame in driver-seat selfie',
    'no mirrored LHD cabin',
    'no missing steering wheel hint in driver seat context',
    'no passenger-side seat positioning',
    'no brand logos',
    'no readable text on any object',
    'no perfectly centered composition',
    'no perfectly level camera',
    'no airbrushed skin',
    'no helmet-like glossy hair',
    'no perfectly symmetric face',
    'AI-generated look, plastic skin, over-smoothed skin, symmetric face, perfectly styled hair, glossy hair, uniform fabric, no wrinkles, oversaturated colors, HDR overprocessing, teal-orange grading, impossible lighting, dual shadows without dual sources, floating objects, cartoon, 3D render, digital art, illustration, airbrushed, retouched, beauty filter, smooth bokeh, artificial depth of field, fake lens flare, perfect composition, centered framing, dead eyes, missing corneal reflections, wrong finger count, extra fingers, deformed hands, gibberish text, watermark'
  ].join(', ');
}
