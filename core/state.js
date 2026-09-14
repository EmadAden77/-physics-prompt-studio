import { DEFAULT_STATE, FIELD_SPECS, REALISM_MODULES } from '../data/catalog.js';

const numericFields = new Set(Object.keys(FIELD_SPECS));
const textFields = new Set([
  'idea','referenceRole','captureType','time','location','customLocation','people','ratio','pose','customPose','expression','hair','customHair','beard','customBeard','glasses','customGlasses','clothing','customClothing','framing','lightSource','customLightSource','lightDirection','lightFalloff','exposure','hdr','whiteBalance','notes'
]);

export function normalizeState(input = {}) {
  const base = structuredClone(DEFAULT_STATE);
  const state = { ...base, ...input, modules: { ...base.modules, ...(input.modules || {}) } };
  for (const key of numericFields) state[key] = Number(state[key]);
  for (const key of textFields) state[key] = state[key] == null ? '' : String(state[key]);
  state.referenceAttached = Boolean(state.referenceAttached);
  for (const module of REALISM_MODULES) {
    if (!['off','auto','strict'].includes(state.modules[module.id])) state.modules[module.id] = 'auto';
  }
  return state;
}

export function deterministicStateJson(input = {}) {
  const state = normalizeState(input);
  return JSON.stringify(state, Object.keys(state).sort());
}
