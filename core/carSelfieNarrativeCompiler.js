import {
  commonOption,
  getCameraOptic,
  getClothing,
  getFabric,
  getVehicle
} from '../data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_CATALOG } from '../data/carSelfieOutsideCatalog.js';

const option = (catalog, field, id) => (catalog[field] || []).find((item) => item.id === id) || null;
const commonText = (field, id) => commonOption(field, id)?.prompt || '';
const words = (value = '') => String(value).trim().split(/\s+/u).filter(Boolean);
export const countNarrativeWords = (value = '') => words(value).length;

export const NEGATIVE_LIST = 'no CGI, no 3D render, no digital art, no illustration, no vector, no plastic skin, no airbrushed skin, no beauty filter, no smooth flawless skin, no brand logos, no readable text, no mirrored cabin, no window on the wrong side, no missing steering wheel hint, no floating objects, no impossibly symmetric face, no perfectly centered composition, no perfectly level camera';

export const DRIVER_ANCHOR_SENTENCE = "LHD VISUAL ANCHOR: The driver-side window with exterior view appears on the RIGHT half of the frame. The steering wheel's top rim is partially visible at the bottom-center-left. The passenger area appears on the LEFT side. The cabin is NOT mirrored.";
export const PASSENGER_ANCHOR_SENTENCE = 'PASSENGER VISUAL ANCHOR: The passenger-side window with exterior view appears on the LEFT half of the frame. The center console is at the RIGHT of the frame. The cabin is NOT mirrored.';
export const EXTERIOR_ANCHOR_SENTENCE = "EXTERIOR ANCHOR: The subject stands beside the vehicle with visible ground contact. The car's full profile or three-quarter view is visible. Real tire contact patches and ground shadows are present.";

const CLUTTER_BUDGET = Object.freeze({
  clean: 'a clean cabin with no loose items visible',
  minimal: 'one small supported item, out of the frame center',
  light: 'at most one clearly visible supported item',
  moderate: 'at most two clearly visible supported items, the rest out of frame',
  heavy: 'up to three clearly visible supported items, all physically supported'
});

function anchorFor(state, mode) {
  if (mode === 'outside') return EXTERIOR_ANCHOR_SENTENCE;
  return state.seat === 'front-passenger-right' ? PASSENGER_ANCHOR_SENTENCE : DRIVER_ANCHOR_SENTENCE;
}

function clippedNotes(value = '') {
  return words(value).slice(0, 24).join(' ');
}

function narrativeParts(state, mode, compression = 0) {
  const inside = mode !== 'outside';
  const catalog = inside ? INSIDE_CATALOG : OUTSIDE_CATALOG;
  const vehicle = getVehicle(state.vehicleProfile);
  const lens = getCameraOptic(state.cameraLens);
  const clothing = getClothing(state.clothing);
  const fabric = getFabric(state.fabricType);
  const vehicleState = option(catalog, 'vehicleState', state.vehicleState);
  const place = commonOption('place', state.place);
  const notes = clippedNotes(state.notes);

  const cameraProcessing = compression >= 1
    ? `The phone keeps natural smartphone contrast, restrained HDR, realistic low-light noise and mixed-light white balance.`
    : `The Xiaomi processing keeps natural smartphone contrast, restrained HDR, realistic low-light noise and subtle mixed-light white balance, revealing only light that physically reaches the scene rather than inventing studio illumination.`;

  const placeDetails = compression >= 2
    ? `${place?.prompt || 'an ordinary Saudi setting'}, with believable road surfaces, sparse local vegetation and anonymous background people.`
    : `${place?.prompt || 'an ordinary Saudi setting'}, with ${place?.surface || 'believable asphalt'}, ${place?.curb || 'practical curb edges'}, ${place?.vegetation || 'sparse local vegetation'}, and ${place?.people || 'anonymous background people kept visually secondary'}.`;

  const clothingDescription = compression >= 3
    ? `${clothing?.prompt || 'simple everyday clothing'} in ${fabric?.label || state.fabricType}`
    : `${clothing?.prompt || 'simple everyday clothing'}, made from ${fabric?.prompt || state.fabricType}, with ${commonText('fabricSheen', state.fabricSheen)} and ${commonText('wrinkleProfile', state.wrinkleProfile)}`;

  const subject = `This is a candid, photorealistic smartphone photograph of one person around ${state.apparentAge}, with ${commonText('expression', state.expression)}, ${commonText('gazeTarget', state.gazeTarget)}, visible pores, fine facial texture and natural asymmetry. Hair keeps its real density and hairline, with individual strands and a few ordinary flyaways rather than a sculpted glossy shape. The person wears ${clothingDescription}.`;

  const camera = `The photograph is taken with a Xiaomi 15 Ultra using the ${lens?.focalLengthEqMm || state.focalLength}mm-equivalent lens at f/${lens?.aperture || state.aperture}, about ${state.distance}cm from the subject, with yaw ${state.yaw}°, pitch ${state.pitch}° and a natural ${state.roll}° roll. ${cameraProcessing}`;

  const environment = `The setting is ${placeDetails} It is ${commonText('time', state.time)} with ${commonText('weather', state.weather)}. The scene is lit by ${commonText('externalLight', state.externalLight)}, with believable falloff, reflections and shadow direction.`;

  let modeStory;
  if (inside) {
    const seat = option(INSIDE_CATALOG, 'seat', state.seat);
    const clutter = CLUTTER_BUDGET[state.clutterLevel] || CLUTTER_BUDGET.light;
    modeStory = `The subject is ${seat?.prompt || 'seated naturally in the front cabin'} of ${vehicle?.insidePrompt || 'the parked vehicle'}, ${vehicleState?.prompt || 'fully stationary'}. The cabin feels lived-in but controlled: ${clutter}. Upholstery, glass and trim react naturally to the available light, and loose objects remain supported by real surfaces and gravity.`;
  } else {
    const pose = option(OUTSIDE_CATALOG, 'standingPose', state.standingPose);
    modeStory = `The subject is outside beside ${vehicle?.outsidePrompt || 'the parked vehicle'}, ${vehicleState?.prompt || 'fully stationary'}, ${pose?.prompt || 'standing naturally beside it'}. Paint and glass carry restrained reflections from the real surroundings, while the tires sit firmly on the ground with ordinary contact shadows.`;
  }

  const finish = `The image feels like an ordinary real photo: slightly off-center, subtly imperfect, with realistic skin, fabric fibers, corneal catchlights, believable hands and no polished advertising finish.${notes ? ` The requested detail is kept naturally in the scene: ${notes}.` : ''}`;

  return [subject, camera, environment, modeStory, anchorFor(state, mode), finish];
}

export function compileNarrative(state = {}, mode = state.mode || 'inside') {
  let compression = 0;
  let prompt = narrativeParts(state, mode, compression).join(' ');

  if (countNarrativeWords(prompt) > 300) {
    compression = 1;
    prompt = narrativeParts(state, mode, compression).join(' ');
  }
  if (countNarrativeWords(prompt) > 300) {
    compression = 2;
    prompt = narrativeParts(state, mode, compression).join(' ');
  }
  if (countNarrativeWords(prompt) > 300) {
    compression = 3;
    prompt = narrativeParts(state, mode, compression).join(' ');
  }

  if (countNarrativeWords(prompt) > 300) {
    throw new Error(`Narrative prompt exceeded 300-word budget after deterministic compression: ${countNarrativeWords(prompt)}`);
  }

  return prompt;
}
