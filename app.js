import { compilePrompt, createLedger } from './core/prompt-optimizer.js';
import { LOCATION_CATALOG, CLOTHING_CATALOG, HOME_CLOTHING, HAIR_STYLES, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from './core/scene-builder.js';
import { enrichClothingPrompt } from './core/expanded-catalogs.js';
import {
  generateImagePrompt,
  SCENE_TYPES,
  CAMERA_PROFILES,
  ASPECT_RATIOS,
  EXPRESSIONS,
  BACKGROUND_ACTIVITY,
  REALISM_LEVELS,
  FRAMING_OPTIONS
} from './core/prompt-generator.js';
import { compatibilitySnapshot, getPoseCameraHint, locationsForScene, recommendedDefaults, resolveCompatibleValue } from './core/scene-compatibility.js';
import { baseSceneTypeFor, narrowOptions, sceneMeta, HOME_SCENE_TYPES } from './core/scene-type-expansion.js';
import { enforceSaudiNoLandmarks, mergeSaudiNoLandmarksConstraint } from './core/saudi-location-lock.js';

const HAS_DOM = typeof document !== 'undefined';
const $ = (id) => HAS_DOM ? document.getElementById(id) : null;
const controls = {
  sceneType: $('sceneType'),
  location: $('sceneLocation'),
  clothing: $('sceneClothing'),
  clothingStyling: $('clothingStyling'),
  handInteraction: $('handInteraction'),
  hairStyle: $('hairStyle'),
  pose: $('scenePose'),
  angle: $('sceneAngle'),
  lighting: $('sceneLighting'),
  lightingNotes: $('lightingNotes'),
  camera: $('cameraProfile'),
  aspectRatio: $('aspectRatio'),
  expression: $('expression'),
  backgroundActivity: $('backgroundActivity'),
  realismLevel: $('realismLevel'),
  framing: $('framing'),
  cameraDistance: $('cameraDistance'),
  description: $('sceneDescription'),
  customConstraints: $('customConstraints'),
  identityReference: $('identityReference'),
  seedInput: $('seedInput')
};
const sourcePrompt = $('sourcePrompt');
const surface = $('surface');
const output = $('promptOutput');
const detailsOutput = $('detailsOutput');
const packetOutput = $('packetOutput');
const statusBadge = $('statusBadge');
const metricOneLabel = $('metricOneLabel');
const metricOneValue = $('metricOneValue');
const metricTwoLabel = $('metricTwoLabel');
const metricTwoValue = $('metricTwoValue');
const metricThreeLabel = $('metricThreeLabel');
const metricThreeValue = $('metricThreeValue');
const copyButton = $('copyButton');
const txtButton = $('txtButton');
const jsonButton = $('jsonButton');
const generateButton = $('generateButton');
const optimizeButton = $('optimizeButton');
const randomButton = $('randomButton');
const resetButton = $('resetButton');
const cameraAngleHint = $('cameraAngleHint');
const clothingStylingHint = $('clothingStylingHint');

const GENERAL_CLOTHING_OPTIONS = CLOTHING_CATALOG;
const CATALOGS = {
  location: LOCATION_CATALOG,
  generalClothing: GENERAL_CLOTHING_OPTIONS,
  bedroomClothing: HOME_CLOTHING,
  hairStyle: HAIR_STYLES,
  pose: SELFIE_POSES,
  angle: SELFIE_ANGLES,
  lighting: LIGHTING_PROFILES,
  camera: CAMERA_PROFILES,
  framing: FRAMING_OPTIONS
};
const CLOTHING_PROMPT_BY_VALUE = new Map(
  [...CATALOGS.generalClothing, ...CATALOGS.bedroomClothing].map((item) => [item.value, item.prompt || ''])
);
const RANDOMIZED_FIELDS = Object.freeze([
  'location','clothing','pose','angle','lighting','camera','framing',
  'expression','backgroundActivity','realismLevel','aspectRatio','hairStyle'
]);
const CORE_VISUAL_FIELDS = Object.freeze(['sceneType','location','clothing','hairStyle','pose','lighting']);
const SEED_STORAGE_KEY = 'physicsPromptStudioSeed';
const CLOTHING_STYLING_SCENE_TYPES = Object.freeze([
  'front_selfie','standing_selfie','seated_selfie','walking_selfie',
  'office_selfie','cafe_selfie','majlis_selfie','outdoor_selfie',
  'inside_car_selfie','military_meal_selfie',
  'bedroom_selfie','bedroom_third_person',
  'third_person_portrait','full_body_third_person','candid_third_person'
]);

let currentMode = 'auto';
let latestResult = null;
let generateTimer = null;
let currentSeed = 42;

function makeOption(item) {
  const option = document.createElement('option');
  option.value = item.value;
  option.textContent = item.label;
  option.dataset.prompt = item.prompt || '';
  return option;
}

function uniqueByValue(options) {
  const seen = new Set();
  return options.filter((item) => {
    if (!item?.value || seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

function populateGrouped(select, options) {
  const existingValues = new Set([...select.options].map((option) => option.value).filter(Boolean));
  const groups = new Map();
  for (const item of uniqueByValue(options)) {
    const group = item.group || 'خيارات';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  for (const [label, items] of groups) {
    const pendingItems = items.filter((item) => !existingValues.has(item.value));
    if (!pendingItems.length) continue;
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;
    for (const item of pendingItems) {
      optgroup.append(makeOption(item));
      existingValues.add(item.value);
    }
    select.append(optgroup);
  }
}

function populateFlat(select, options) {
  const existing = new Set([...select.options].map((option) => option.value).filter(Boolean));
  for (const item of uniqueByValue(options)) {
    if (existing.has(item.value)) continue;
    select.append(makeOption(item));
    existing.add(item.value);
  }
}

function rebuildOptionalSelect(select, options, placeholder, grouped = false) {
  const previous = select.value;
  const unique = uniqueByValue(options);
  const isAngleSelect = select === controls.angle;
  select.replaceChildren();
  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = placeholder;
  select.append(auto);
  if (isAngleSelect) select.append(makeOption({ value:'smart', label:'ذكي — زاوية حتمية حسب Seed', prompt:'smart' }));
  if (grouped) populateGrouped(select, unique);
  else populateFlat(select, unique);
  if (isAngleSelect && previous === 'smart') select.value = 'smart';
  else if (previous && unique.some((item) => item.value === previous)) select.value = previous;
  else select.value = isAngleSelect ? 'smart' : '';
}

function rebuildRequiredSelect(select, options, preferredValue) {
  const previous = select.value;
  const unique = uniqueByValue(options);
  select.replaceChildren();
  populateFlat(select, unique);
  select.value = resolveCompatibleValue(previous, unique, preferredValue, {
    required: true,
    fieldName: select.id || 'required-select'
  });
}

function selectedSceneType() {
  return controls.sceneType?.value || 'front_selfie';
}

function specializedOptions(sceneType, kind, options) {
  if (!sceneMeta(sceneType)) return options;
  const narrowed = narrowOptions(sceneType, kind, options);
  return narrowed.length === 0 ? options : narrowed;
}

function restoreCompatibleSelection(control, previousValue, options, preferredValue = '') {
  if (!previousValue) return;
  control.value = resolveCompatibleValue(previousValue, options, preferredValue);
}

function showAllOptions(select) {
  if (!select) return;
  for (const option of select.options) option.hidden = false;
  for (const group of select.querySelectorAll?.('optgroup') || []) group.hidden = false;
}

function sceneCompatibilityData(sceneType, locationValue = '') {
  const baseSceneType = baseSceneTypeFor(sceneType);
  let compatibilityType = sceneType === 'supermarket_selfie' ? sceneType : baseSceneType;
  if (HOME_SCENE_TYPES.includes(sceneType)) compatibilityType = sceneType;
  const clothingCatalog = HOME_SCENE_TYPES.includes(sceneType) ? CATALOGS.bedroomClothing : CATALOGS.generalClothing;
  const compatible = compatibilitySnapshot(compatibilityType, { ...CATALOGS, clothing: clothingCatalog });
  const defaults = recommendedDefaults(compatibilityType);
  const locationCandidates = locationsForScene(sceneType);
  let lighting = specializedOptions(sceneType, 'lighting', compatible.lighting);
  if (sceneType === 'floor_seated_selfie') {
    const outdoors = ['desert_campsite_simple', 'wadi_picnic_edge'].includes(locationValue);
    lighting = lighting.filter((item) => outdoors ? item.value === 'day_open_shade' : item.value !== 'day_open_shade');
  }
  return {
    baseSceneType,
    compatibilityType,
    compatible,
    defaults,
    options: {
      location: locationCandidates,
      clothing: specializedOptions(sceneType, 'clothing', compatible.clothing),
      pose: specializedOptions(sceneType, 'pose', compatible.pose),
      angle: specializedOptions(sceneType, 'angle', compatible.angle),
      lighting,
      camera: compatible.camera,
      framing: compatible.framing,
      expression: EXPRESSIONS,
      backgroundActivity: BACKGROUND_ACTIVITY.filter((item) => compatible.backgroundActivityAllowed.includes(item.value)),
      realismLevel: REALISM_LEVELS,
      aspectRatio: ASPECT_RATIOS,
      hairStyle: CATALOGS.hairStyle
    }
  };
}

function applySceneCompatibility() {
  const sceneType = selectedSceneType();
  const { compatibilityType, compatible, defaults, options } = sceneCompatibilityData(sceneType, controls.location.value);
  const previous = {
    location: controls.location.value,
    pose: controls.pose.value,
    angle: controls.angle.value,
    lighting: controls.lighting.value,
    framing: controls.framing.value
  };

  rebuildOptionalSelect(controls.clothing, options.clothing, 'تلقائي — ملابس متناسقة مع المشهد', true);
  showAllOptions(controls.clothing);
  rebuildOptionalSelect(controls.location, options.location, 'تلقائي — مكان سعودي واقعي جدًا بدون معالم', true);
  rebuildOptionalSelect(controls.pose, options.pose, 'تلقائي — وضعية متناسقة مع نوع المشهد');
  rebuildOptionalSelect(controls.angle, options.angle, 'تلقائي — زاوية متناسقة مع نوع المشهد');
  rebuildOptionalSelect(controls.lighting, options.lighting, 'تلقائي — إضاءة متناسقة مع نوع المشهد', true);
  rebuildRequiredSelect(controls.camera, compatible.camera, defaults.camera);
  rebuildRequiredSelect(controls.framing, options.framing, defaults.framing);
  rebuildRequiredSelect(controls.backgroundActivity, options.backgroundActivity, 'normal');

  restoreCompatibleSelection(controls.location, previous.location, options.location, defaults.location);
  restoreCompatibleSelection(controls.pose, previous.pose, options.pose, defaults.pose);
  if (previous.angle === 'smart') controls.angle.value = 'smart';
  else restoreCompatibleSelection(controls.angle, previous.angle, options.angle, defaults.angle);
  restoreCompatibleSelection(controls.lighting, previous.lighting, options.lighting, defaults.lighting);
  controls.framing.value = resolveCompatibleValue(previous.framing, options.framing, defaults.framing, {
    required: true,
    fieldName: 'framing'
  });
  updateClothingStylingAvailability();
  updatePoseCameraLock();
  return compatibilityType;
}

function selectedPrompt(select, promptByValue = null) {
  const option = select?.selectedOptions?.[0];
  if (!option) return '';
  const catalogPrompt = promptByValue?.get(option.value) || '';
  return catalogPrompt || option.dataset.prompt || '';
}

function selectedClothingPrompt() {
  return selectedPrompt(controls.clothing, CLOTHING_PROMPT_BY_VALUE);
}

function updateClothingStylingAvailability() {
  if (!controls.clothingStyling) return false;
  const sceneType = selectedSceneType();
  const clothingDescriptor = `${controls.clothing?.value || ''} ${selectedClothingPrompt()}`;
  const supported = CLOTHING_STYLING_SCENE_TYPES.includes(sceneType)
    && sceneType !== 'supermarket_selfie'
    && !/\b(?:thobe|bisht)\b/i.test(clothingDescriptor);
  controls.clothingStyling.disabled = !supported;
  if (!supported) controls.clothingStyling.value = 'default';
  if (clothingStylingHint) clothingStylingHint.hidden = supported;
  return supported;
}

function updatePoseCameraLock() {
  if (!controls.angle) return null;
  const sceneType = selectedSceneType();
  const poseHint = sceneType.startsWith('bedroom_') ? getPoseCameraHint(controls.pose?.value || selectedPrompt(controls.pose)) : null;
  const locked = Boolean(poseHint);
  controls.angle.disabled = locked;
  if (cameraAngleHint) {
    cameraAngleHint.hidden = !locked;
    cameraAngleHint.textContent = locked ? `زاوية الكاميرا محكومة بالوضعية. ${poseHint}` : '';
  }
  return poseHint;
}

// Fill only automatic fields for home scenes; explicit user selections remain authoritative.
export function resolveHomeSceneInput(input) {
  if (!HOME_SCENE_TYPES.includes(input.sceneType)) return input;
  const options = sceneCompatibilityData(input.sceneType).options;
  const resolved = { ...input };
  for (const field of ['location', 'clothing', 'pose', 'angle', 'lighting']) {
    if (!resolved[field]?.trim()) resolved[field] = options[field][0]?.prompt || '';
  }
  return resolved;
}

function autoInput() {
  return resolveHomeSceneInput({
    sceneType: controls.sceneType.value,
    camera: controls.camera.value,
    aspectRatio: controls.aspectRatio.value,
    expression: controls.expression.value,
    backgroundActivity: controls.backgroundActivity.value,
    realismLevel: controls.realismLevel.value,
    framing: controls.framing.value,
    location: enforceSaudiNoLandmarks(selectedPrompt(controls.location)),
    clothing: enrichClothingPrompt(selectedClothingPrompt()),
    clothingStyling: controls.clothingStyling.value,
    handInteraction: controls.handInteraction.value,
    hairStyle: selectedPrompt(controls.hairStyle),
    pose: selectedPrompt(controls.pose),
    angle: selectedPrompt(controls.angle),
    seed: currentSeed,
    lighting: selectedPrompt(controls.lighting),
    lightingNotes: controls.lightingNotes.value,
    cameraDistance: controls.cameraDistance.value,
    description: controls.description.value,
    customConstraints: mergeSaudiNoLandmarksConstraint(controls.customConstraints.value),
    identityReference: controls.identityReference.checked
  });
}

function sceneForOptimizer() {
  const clothingPrompt = enrichClothingPrompt(selectedClothingPrompt());
  const hairPrompt = selectedPrompt(controls.hairStyle);
  return {
    location: enforceSaudiNoLandmarks(selectedPrompt(controls.location)),
    clothing: [clothingPrompt, hairPrompt ? `Hair styling: ${hairPrompt}` : ''].filter(Boolean).join(' '),
    pose: selectedPrompt(controls.pose),
    angle: selectedPrompt(controls.angle),
    lighting: selectedPrompt(controls.lighting),
    lighting_notes: controls.lightingNotes.value.trim()
  };
}

function setStatus(status) {
  statusBadge.className = `status ${status}`;
  statusBadge.textContent = status.toUpperCase();
}

function setMetrics(a, b, c) {
  [[metricOneLabel, metricOneValue, a], [metricTwoLabel, metricTwoValue, b], [metricThreeLabel, metricThreeValue, c]].forEach(([label, value, item]) => {
    label.textContent = item[0];
    value.textContent = item[1];
  });
}

function renderAuto(result) {
  latestResult = { type: 'auto', data: result };
  output.value = result.prompt;
  detailsOutput.textContent = JSON.stringify({ config: result.config, realism_packet: result.realism_packet, validation: result.validation, realism_validation: result.realism_validation }, null, 2);
  packetOutput.textContent = JSON.stringify(result, null, 2);
  const valid = result.validation.valid && result.realism_validation.valid;
  setStatus(valid ? 'ready' : 'invalid');
  setMetrics(['الوضع', 'AUTO'], ['الأقسام', String(result.sections.length)], ['التحقق', valid ? 'PASS' : 'FAIL']);
  enableExports(Boolean(result.prompt));
}

function generateNow() {
  if (currentMode !== 'auto') return;
  renderAuto(generateImagePrompt(autoInput()));
}

function scheduleGenerate() {
  if (currentMode !== 'auto') return;
  clearTimeout(generateTimer);
  generateTimer = setTimeout(generateNow, 90);
}

function optimizeNow() {
  const prompt = sourcePrompt.value;
  if (!prompt.trim()) {
    setStatus('invalid');
    output.value = '';
    detailsOutput.textContent = 'ألصق Prompt موجود أولاً.';
    packetOutput.textContent = 'لا توجد نتيجة.';
    enableExports(false);
    sourcePrompt.focus();
    return;
  }
  const packet = compilePrompt(prompt, { surface: surface.value, scene: sceneForOptimizer() });
  latestResult = { type: 'optimize', data: packet };
  output.value = packet.compiled_prompt.text;
  detailsOutput.textContent = JSON.stringify(createLedger(packet), null, 2);
  packetOutput.textContent = JSON.stringify(packet, null, 2);
  setStatus(packet.status);
  setMetrics(['الوضع', 'OPTIMIZE'], ['القيود', String(packet.constraint_map.length)], ['التحقق', packet.validation.valid ? 'PASS' : 'FAIL']);
  enableExports(Boolean(packet.compiled_prompt.text));
}

function enableExports(enabled) {
  copyButton.disabled = !enabled;
  txtButton.disabled = !enabled;
  jsonButton.disabled = !enabled;
}

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $('autoPanel').hidden = mode !== 'auto';
  $('optimizerPanel').hidden = mode !== 'optimize';
  if (mode === 'auto') generateNow();
  else {
    output.value = '';
    detailsOutput.textContent = 'ألصق Prompt واضغط “تحسين Prompt”.';
    packetOutput.textContent = 'لا توجد نتيجة بعد.';
    setStatus('idle');
    setMetrics(['الوضع', 'OPTIMIZE'], ['القيود', '0'], ['التحقق', '—']);
    enableExports(false);
  }
}

export function normalizeSeed(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 42;
  return Math.min(999999, Math.max(1, Math.trunc(numeric)));
}

export function newSeed() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('crypto.getRandomValues() is required to generate a new seed');
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return (buffer[0] % 999999) + 1;
}

export function seededRandom(seed) {
  let state = (normalizeSeed(seed) >>> 0) || 1;
  return function nextSeededValue() {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 4294967296;
  };
}

export function pickRandom(array, rng) {
  if (!array || array.length === 0) return null;
  const index = Math.floor(rng() * array.length);
  return array[index];
}

function valueRecord(item) {
  return typeof item === 'string' ? { value: item } : item;
}

export function randomizationOptionsForScene(sceneType, locationValue = '') {
  const options = sceneCompatibilityData(sceneType, locationValue).options;
  return { ...options, angle: [{ value:'smart', label:'ذكي — زاوية حتمية حسب Seed', prompt:'smart' }, ...options.angle] };
}

export function buildSeededSceneState(seed, sceneTypes, optionsForScene = randomizationOptionsForScene) {
  const normalized = normalizeSeed(seed);
  const rng = seededRandom(normalized);
  const scenes = (sceneTypes || []).map(valueRecord).filter((item) => item?.value);
  const pickedScene = pickRandom(scenes, rng);
  if (!pickedScene) return Object.freeze({ seed: normalized, sceneType: '' });

  const state = { seed: normalized, sceneType: pickedScene.value };
  let options = optionsForScene(pickedScene.value) || {};
  for (const field of RANDOMIZED_FIELDS) {
    if (field === 'angle') {
      state.angle = 'smart';
      continue;
    }
    const picked = pickRandom((options[field] || []).map(valueRecord).filter((item) => item?.value), rng);
    state[field] = picked?.value || '';
    if (field === 'location' && pickedScene.value === 'floor_seated_selfie') options = optionsForScene(pickedScene.value, state.location) || {};
  }
  return Object.freeze(state);
}

function selectableOptions(select) {
  return [...select.options].filter((option) => {
    if (!option.value || option.hidden) return false;
    const group = option.parentElement?.tagName === 'OPTGROUP' ? option.parentElement : null;
    return !group?.hidden;
  });
}

function captureRandomizedState() {
  const state = { seed: currentSeed, sceneType: controls.sceneType.value };
  for (const field of RANDOMIZED_FIELDS) state[field] = controls[field]?.value || '';
  return state;
}

function browserRandomizationEnvironment() {
  if (!HAS_DOM) throw new Error('Browser randomization requires a DOM');
  return {
    sceneTypes: () => selectableOptions(controls.sceneType).map((option) => ({ value: option.value })),
    optionsForScene: randomizationOptionsForScene,
    async applyState(planned, seed) {
      controls.sceneType.value = planned.sceneType;
      controls.sceneType.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();

      for (const field of RANDOMIZED_FIELDS) {
        const select = controls[field];
        if (!select) continue;
        const visible = selectableOptions(select);
        const validValues = new Set(visible.map((option) => option.value));
        if (planned[field] && validValues.has(planned[field])) select.value = planned[field];
        else if (visible[0]) select.value = visible[0].value;
      }

      currentSeed = normalizeSeed(seed);
      controls.seedInput.value = String(currentSeed);
      globalThis.localStorage?.setItem(SEED_STORAGE_KEY, String(currentSeed));

      for (const field of RANDOMIZED_FIELDS) {
        const select = controls[field];
        if (select) select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      scheduleGenerate();
      return Object.freeze({ ...captureRandomizedState(), seed: currentSeed });
    }
  };
}

export async function randomizeWithSeed(seed, environment = null) {
  const env = environment || browserRandomizationEnvironment();
  const normalized = normalizeSeed(seed);
  const planned = buildSeededSceneState(normalized, env.sceneTypes(), env.optionsForScene);
  return env.applyState ? (await env.applyState(planned, normalized)) : planned;
}

function coreVisualFieldsChanged(before, after) {
  return CORE_VISUAL_FIELDS.every((field) => before[field] !== after[field]);
}

async function randomizeNewScene() {
  const before = captureRandomizedState();
  const env = browserRandomizationEnvironment();
  const sceneTypes = env.sceneTypes();
  let candidateSeed = newSeed();
  let planned = buildSeededSceneState(candidateSeed, sceneTypes, env.optionsForScene);

  for (let attempt = 0; attempt < 96 && !coreVisualFieldsChanged(before, planned); attempt += 1) {
    candidateSeed = newSeed();
    planned = buildSeededSceneState(candidateSeed, sceneTypes, env.optionsForScene);
  }

  currentSeed = candidateSeed;
  return randomizeWithSeed(currentSeed, env);
}

function loadSavedSeed() {
  const stored = globalThis.localStorage?.getItem(SEED_STORAGE_KEY);
  currentSeed = normalizeSeed(stored || 42);
  controls.seedInput.value = String(currentSeed);
}

function resetAll() {
  controls.sceneType.value = 'front_selfie';
  applySceneCompatibility();
  controls.location.value = '';
  controls.clothing.value = '';
  controls.clothingStyling.value = 'default';
  controls.handInteraction.value = 'none';
  controls.hairStyle.value = '';
  controls.pose.value = '';
  controls.angle.value = 'smart';
  controls.lighting.value = '';
  controls.lightingNotes.value = '';
  controls.camera.value = 'xiaomi15_front';
  controls.aspectRatio.value = '9:16';
  controls.expression.value = 'neutral';
  controls.backgroundActivity.value = 'normal';
  controls.realismLevel.value = 'strict';
  controls.framing.value = 'chest_up';
  controls.cameraDistance.value = '';
  controls.description.value = '';
  controls.customConstraints.value = '';
  controls.identityReference.checked = true;
  currentSeed = 42;
  controls.seedInput.value = '42';
  globalThis.localStorage?.setItem(SEED_STORAGE_KEY, '42');
  sourcePrompt.value = '';
  surface.value = 'unknown';
  if (currentMode === 'auto') generateNow();
  else setMode('optimize');
}

async function copyPrompt() {
  const text = output.value;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  const before = copyButton.textContent;
  copyButton.textContent = 'تم النسخ ✓';
  setTimeout(() => { copyButton.textContent = before; }, 1300);
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

if (HAS_DOM) {
  populateFlat(controls.sceneType, SCENE_TYPES);
  populateGrouped(controls.clothing, CATALOGS.generalClothing);
  populateGrouped(controls.hairStyle, CATALOGS.hairStyle);
  populateFlat(controls.aspectRatio, ASPECT_RATIOS);
  populateFlat(controls.expression, EXPRESSIONS);
  populateFlat(controls.backgroundActivity, BACKGROUND_ACTIVITY);
  populateFlat(controls.realismLevel, REALISM_LEVELS);

  controls.sceneType.value = 'front_selfie';
  controls.clothingStyling.value = 'default';
  controls.handInteraction.value = 'none';
  controls.aspectRatio.value = '9:16';
  controls.expression.value = 'neutral';
  controls.backgroundActivity.value = 'normal';
  controls.realismLevel.value = 'strict';
  applySceneCompatibility();
  loadSavedSeed();

  copyButton.addEventListener('click', copyPrompt);
  txtButton.addEventListener('click', () => download('physics-prompt-studio.txt', output.value, 'text/plain;charset=utf-8'));
  jsonButton.addEventListener('click', () => latestResult && download('physics-prompt-studio.json', JSON.stringify(latestResult.data, null, 2), 'application/json;charset=utf-8'));
  generateButton.addEventListener('click', generateNow);
  optimizeButton.addEventListener('click', optimizeNow);
  randomButton.addEventListener('click', randomizeNewScene);
  resetButton.addEventListener('click', resetAll);
  controls.seedInput.addEventListener('change', async () => {
    currentSeed = normalizeSeed(controls.seedInput.value);
    controls.seedInput.value = String(currentSeed);
    await randomizeWithSeed(currentSeed);
  });
  controls.location.addEventListener('change', () => {
    if (selectedSceneType() === 'floor_seated_selfie') applySceneCompatibility();
  });
  controls.sceneType.addEventListener('change', () => {
    applySceneCompatibility();
    scheduleGenerate();
  });
  controls.clothing.addEventListener('change', () => {
    updateClothingStylingAvailability();
    scheduleGenerate();
  });
  controls.pose.addEventListener('change', () => {
    updatePoseCameraLock();
    scheduleGenerate();
  });
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === button.dataset.tab));
  }));
  Object.values(controls).forEach((control) => {
    if (!control || control === controls.sceneType || control === controls.seedInput || control === controls.pose || control === controls.clothing) return;
    control.addEventListener('change', scheduleGenerate);
    control.addEventListener('input', scheduleGenerate);
  });
  sourcePrompt.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') optimizeNow();
  });

  setMode('auto');
}
