import {
  commonOption,
  getCameraOptic,
  getClothing,
  getFabric,
  getVehicle
} from '../data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_CATALOG } from '../data/carSelfieOutsideCatalog.js';
import {
  INSIDE_DRIVER_MASTER_PROFILE,
  usesInsideDriverMasterProfile
} from '../data/carSelfieInsideMasterProfile.js';

const option = (catalog, field, id) => (catalog[field] || []).find((item) => item.id === id) || null;
const words = (value = '') => String(value).trim().split(/\s+/u).filter(Boolean);
export const countNarrativeWords = (value = '') => words(value).length;

export const NEGATIVE_LIST = 'no CGI, no 3D render, no digital art, no illustration, no vector, no plastic skin, no airbrushed skin, no beauty filter, no smooth flawless skin, no brand logos, no readable text, no mirrored cabin, no window on the wrong side, no missing steering wheel hint, no floating objects, no impossibly symmetric face, no perfectly centered composition, no perfectly level camera, no DSLR optics, no synthetic relighting, no newer-generation Range Rover interior';

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

const EXPRESSION_TEXT = Object.freeze({
  neutral: 'a calm neutral expression',
  'small-smile': 'a slight natural closed-mouth smile',
  focused: 'a focused natural expression',
  'mild-surprise': 'a subtle candid look of mild surprise',
  'tired-natural': 'a naturally tired, relaxed expression'
});

const GAZE_TEXT = Object.freeze({
  camera: 'looking naturally toward the camera',
  road: 'eyes directed naturally toward the road',
  side: 'with a subtle side glance',
  car: 'looking naturally toward the car'
});

function compactPhrase(value = '', maxWords = 10) {
  const firstClause = String(value).split(/[.;]/u)[0].trim();
  const list = words(firstClause);
  return list.length <= maxWords ? firstClause : list.slice(0, maxWords).join(' ');
}

function commonPhrase(field, id, maxWords = 9) {
  return compactPhrase(commonOption(field, id)?.prompt || String(id || '').replaceAll('-', ' '), maxWords);
}

function anchorFor(state, mode) {
  if (mode === 'outside') return EXTERIOR_ANCHOR_SENTENCE;
  return state.seat === 'front-passenger-right' ? PASSENGER_ANCHOR_SENTENCE : DRIVER_ANCHOR_SENTENCE;
}

function clippedNotes(value = '') {
  return words(value).slice(0, 8).join(' ');
}

function cleanNarrativeTone(value) {
  return String(value)
    .replace(/\bmandatory\b/gi, 'fixed')
    .replace(/\bmust\b/gi, 'is expected to')
    .replace(/\bfails?\b/gi, 'breaks the intended realism');
}

function narrativeParts(state, mode, compression = 0) {
  const inside = mode !== 'outside';
  const masterDriver = usesInsideDriverMasterProfile({ ...state, mode });
  const master = INSIDE_DRIVER_MASTER_PROFILE;
  const catalog = inside ? INSIDE_CATALOG : OUTSIDE_CATALOG;
  const vehicle = getVehicle(state.vehicleProfile);
  const lens = getCameraOptic(state.cameraLens);
  const clothing = getClothing(state.clothing);
  const fabric = getFabric(state.fabricType);
  const vehicleState = option(catalog, 'vehicleState', state.vehicleState);
  const place = commonOption('place', state.place);
  const notes = clippedNotes(state.notes);

  const expression = EXPRESSION_TEXT[state.expression] || commonPhrase('expression', state.expression, 6);
  const gaze = GAZE_TEXT[state.gazeTarget] || commonPhrase('gazeTarget', state.gazeTarget, 6);

  const cameraProcessing = compression >= 1
    ? 'The phone keeps natural contrast, restrained HDR and believable noise.'
    : masterDriver
      ? 'Night processing keeps natural contrast, retained pores and shadow noise; exposure and HDR reveal captured light without inventing illumination.'
      : 'The phone keeps natural smartphone contrast, restrained HDR, believable low-light noise and mixed-light white balance without synthetic relighting.';

  const placeDetails = compression >= 2
    ? compactPhrase(place?.prompt || 'an ordinary Saudi setting', 8)
    : `${compactPhrase(place?.prompt || 'an ordinary Saudi setting', 9)}, with ${compactPhrase(place?.surface || 'believable asphalt', 6)}, practical curb wear and sparse local vegetation`;

  const clothingDescription = compression >= 3
    ? `${compactPhrase(clothing?.prompt || 'simple everyday clothing', 5)} in ${fabric?.label || state.fabricType}`
    : `${compactPhrase(clothing?.prompt || 'simple everyday clothing', 7)}, ${compactPhrase(fabric?.prompt || state.fabricType, 6)}, natural wrinkles and restrained sheen`;

  const identitySentence = masterDriver && state.referenceAttached
    ? 'The attached reference defines identity only: facial structure, asymmetry, skin tone, hairline, hair density and facial-hair pattern stay faithful, while pose, clothing, background and lighting come from this scene.'
    : '';

  const subject = `A candid photorealistic smartphone photo shows one person around ${state.apparentAge}, with ${expression}, ${gaze}. Skin has visible pores, fine texture and natural asymmetry. Hair keeps its real density and hairline, with separated strands and a few ordinary flyaways. The person wears ${clothingDescription}. ${identitySentence}`;

  const captureSentence = masterDriver
    ? 'It is a genuine self-held front-camera selfie; the phone stays outside the frame and the wide perspective remains physically consistent.'
    : '';
  const camera = `Shot on a Xiaomi 15 Ultra with the ${lens?.focalLengthEqMm || state.focalLength}mm-equivalent lens at f/${lens?.aperture || state.aperture}, about ${state.distance}cm away, yaw ${state.yaw}°, pitch ${state.pitch}° and a natural ${state.roll}° roll. ${captureSentence} ${cameraProcessing}`;

  const lightSentence = masterDriver
    ? 'Roadside light reaches only surfaces physically exposed to it, with visible falloff across the face, torso and deeper cabin.'
    : 'Falloff, reflections and shadow direction feel physically coherent.';
  const environment = `Around the subject is ${placeDetails}. It is ${commonPhrase('time', state.time, 4)} with ${commonPhrase('weather', state.weather, 6)}, lit by ${commonPhrase('externalLight', state.externalLight, 8)}. ${lightSentence}`;

  let modeStory;
  if (inside) {
    const seat = option(INSIDE_CATALOG, 'seat', state.seat);
    const clutter = CLUTTER_BUDGET[state.clutterLevel] || CLUTTER_BUDGET.light;
    const periodCue = masterDriver && state.vehicleProfile === master.vehicleLock.vehicleProfile
      ? 'The Ebony/Ivory cabin is period-correct for 2017, with Ivory perforated leather, dark polished wood, realistic seat compression and no newer-generation dashboard or steering design.'
      : '';
    modeStory = `The subject is ${compactPhrase(seat?.prompt || 'seated naturally in the front cabin', 9)} inside ${compactPhrase(vehicle?.insidePrompt || 'the parked vehicle', 10)}, ${compactPhrase(vehicleState?.prompt || 'fully stationary', 5)}. ${periodCue} The cabin looks ordinary and controlled: ${clutter}. Every visible loose item rests naturally on a real surface under gravity.`;
  } else {
    const pose = option(OUTSIDE_CATALOG, 'standingPose', state.standingPose);
    modeStory = `The subject is beside ${compactPhrase(vehicle?.outsidePrompt || 'the parked vehicle', 10)}, ${compactPhrase(vehicleState?.prompt || 'fully stationary', 5)}, ${compactPhrase(pose?.prompt || 'standing naturally beside it', 9)}. Paint and glass carry restrained environmental reflections, while the tires sit firmly on the ground with ordinary contact shadows.`;
  }

  const finish = masterDriver
    ? `The result feels like an ordinary unedited Xiaomi front-camera night photo, with subtle shadow noise, mild edge softness, natural skin and material texture, slightly off-center handheld framing and no commercial polish.${notes ? ` A small requested detail remains natural: ${notes}.` : ''}`
    : `The frame is slightly off-center and naturally imperfect, with fabric fibers, corneal catchlights, believable hands and no advertising polish.${notes ? ` A small requested detail remains natural: ${notes}.` : ''}`;

  return [subject, camera, environment, modeStory, anchorFor(state, mode), finish];
}

export function compileNarrative(state = {}, mode = state.mode || 'inside') {
  let compression = 0;
  let prompt = cleanNarrativeTone(narrativeParts(state, mode, compression).join(' '));

  if (countNarrativeWords(prompt) > 300) {
    compression = 1;
    prompt = cleanNarrativeTone(narrativeParts(state, mode, compression).join(' '));
  }
  if (countNarrativeWords(prompt) > 300) {
    compression = 2;
    prompt = cleanNarrativeTone(narrativeParts(state, mode, compression).join(' '));
  }
  if (countNarrativeWords(prompt) > 300) {
    compression = 3;
    prompt = cleanNarrativeTone(narrativeParts(state, mode, compression).join(' '));
  }

  if (countNarrativeWords(prompt) > 300) {
    throw new Error(`Narrative prompt exceeded 300-word budget after deterministic compression: ${countNarrativeWords(prompt)}`);
  }

  return prompt;
}
