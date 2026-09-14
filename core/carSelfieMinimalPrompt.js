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
const text = (field, id) => commonOption(field, id)?.prompt || id || '';

export const INSIDE_VISUAL_ANCHOR = "VISUAL ANCHOR: Taken by the driver himself with the front camera. In the resulting image, the driver's door window with exterior street view appears on the RIGHT half of the frame. The steering wheel's top rim is partially visible at the bottom-center-left. The passenger area appears on the LEFT side. The cabin is NOT mirrored.";

export const OUTSIDE_VISUAL_ANCHOR = 'VISUAL ANCHOR: The person is physically beside the parked vehicle with real ground contact; body, car, camera and reflections share one coherent viewpoint, and no cabin-seat geometry is introduced.';

export function countPromptWords(value = '') {
  const trimmed = String(value).trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

export function compileCarSelfieMinimalPrompt(state = {}) {
  const inside = state.mode !== 'outside';
  const catalog = inside ? INSIDE_CATALOG : OUTSIDE_CATALOG;
  const vehicle = getVehicle(state.vehicleProfile);
  const lens = getCameraOptic(state.cameraLens);
  const clothing = getClothing(state.clothing);
  const fabric = getFabric(state.fabricType);
  const vehicleState = option(catalog, 'vehicleState', state.vehicleState);
  const modeText = inside ? 'inside car' : 'outside beside car';
  const vehicleText = inside ? vehicle?.insidePrompt : vehicle?.outsidePrompt;
  const anchor = inside ? INSIDE_VISUAL_ANCHOR : OUTSIDE_VISUAL_ANCHOR;

  const lines = [
    `[SUBJECT]: one person, apparent age ${state.apparentAge}, ${text('expression', state.expression)}, ${clothing?.prompt || state.clothing}, ${fabric?.prompt || state.fabricType}.`,
    `[MODE]: ${modeText}.`,
    `[VEHICLE]: ${vehicleText || state.vehicleProfile}, parked, ${vehicleState?.prompt || state.vehicleState}.`,
    `[CAMERA]: Xiaomi 15 Ultra ${lens?.focalLengthEqMm || state.focalLength}mm f/${lens?.aperture || state.aperture}, ${state.distance}cm, yaw ${state.yaw}°, pitch ${state.pitch}°, roll ${state.roll}°.` ,
    `[ENVIRONMENT]: ${text('place', state.place)}, ${text('time', state.time)}, ${text('weather', state.weather)}.`,
    `[LIGHT]: ${text('externalLight', state.externalLight)}.`,
    `[${anchor}]`,
    `[QUALITY]: photorealistic iPhone-style photo, not AI-generated.`
  ];

  const prompt = lines.join('\n');
  const words = countPromptWords(prompt);
  if (words > 250) throw new Error(`Minimal car-selfie prompt exceeded 250-word budget: ${words}`);
  return prompt;
}
