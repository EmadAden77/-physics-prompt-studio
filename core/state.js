import { CATALOG, DEFAULT_STATE, FIELD_SPECS, REALISM_MODULES, MODULE_LEVELS } from '../data/catalog.js';

export const STATE_FIELDS = Object.freeze(Object.keys(DEFAULT_STATE));
export const MODULE_IDS = Object.freeze(REALISM_MODULES.map(({ id }) => id));
export const MODULE_LEVEL_IDS = Object.freeze(MODULE_LEVELS.map(({ id }) => id));

const numericFields = new Set(Object.keys(FIELD_SPECS));
const textFields = new Set([
  'idea', 'referenceRole', 'captureType', 'time', 'location', 'customLocation', 'vehicleScene', 'people', 'ratio',
  'pose', 'customPose', 'expression', 'clothing', 'customClothing', 'hair', 'customHair', 'beard', 'customBeard',
  'glasses', 'customGlasses', 'framing', 'lightSource', 'customLightSource', 'lightDirection', 'lightFalloff',
  'exposure', 'hdr', 'whiteBalance', 'notes'
]);

export function assertStateObject(value, name = 'state') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be a plain object`);
  }
}

export function toFiniteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function optionById(field, id) {
  const options = CATALOG[field];
  if (!Array.isArray(options)) return null;
  return options.find((option) => option.id === id) || null;
}

export function normalizeState(input) {
  assertStateObject(input);
  const state = { ...DEFAULT_STATE, ...input };

  for (const field of numericFields) {
    state[field] = toFiniteNumber(state[field]);
  }

  for (const field of textFields) {
    state[field] = String(state[field] ?? '').trim();
  }

  state.referenceAttached = Boolean(state.referenceAttached);

  const incomingModules = input.modules && typeof input.modules === 'object' && !Array.isArray(input.modules)
    ? input.modules
    : {};
  state.modules = Object.fromEntries(MODULE_IDS.map((id) => [id, String(incomingModules[id] ?? DEFAULT_STATE.modules[id] ?? 'auto')]));

  return state;
}

export function hasStrictModule(input) {
  const state = normalizeState(input);
  return MODULE_IDS.some((id) => state.modules[id] === 'strict');
}

export function cloneDefaultState() {
  return {
    ...DEFAULT_STATE,
    modules: { ...DEFAULT_STATE.modules }
  };
}
