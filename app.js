import {
  REFERENCE_ROLES,
  CAPTURE_TYPES,
  TIMES,
  SAUDI_LOCATIONS,
  ANGLES,
  FRAMINGS,
  POSES,
  EXPRESSIONS,
  CLOTHING,
  LIGHT_SOURCES,
  REALISM_MODULES,
  MODULE_LEVELS
} from './data/catalog.js';

import {
  HAIRSTYLES,
  BEARDS,
  GLASSES_OPTIONS,
  EXTRA_POSES,
  EXTRA_ANGLES,
  EXTRA_FRAMINGS,
  EXTRA_LIGHT_SOURCES,
  EXTRA_LOCATIONS
} from './data/extensions.js';

import { PRESETS } from './data/presets.js';

import {
  compileDetailed,
  compileConcise,
  compileNegative,
  compileJson,
  validateState
} from './core/compiler.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'prompt-studio-modular-v3';
let activeView = 'detailed';
let referenceAttached = false;

const mergeOptions = (items) => [...new Map(items.map((item) => [item[0], item])).values()];

const LOCATIONS = mergeOptions([...SAUDI_LOCATIONS, ...EXTRA_LOCATIONS]);
const CLOTHING_OPTIONS = mergeOptions([...CLOTHING, ['custom', 'مخصص', 'custom clothing']]);
const POSE_OPTIONS = mergeOptions([...POSES, ...EXTRA_POSES]);
const ANGLE_OPTIONS = mergeOptions([...ANGLES, ...EXTRA_ANGLES]);
const FRAMING_OPTIONS = mergeOptions([...FRAMINGS, ...EXTRA_FRAMINGS]);
const LIGHT_OPTIONS = mergeOptions([...LIGHT_SOURCES, ...EXTRA_LIGHT_SOURCES]);
const VEHICLE_SCENES = [
  ['none', 'بدون سيارة'],
  ['rrs-2017-white-interior', 'داخل رنج روفر سبورت 2017 بيضاء']
];

const DEFAULTS = {
  referenceRole: 'none',
  captureType: 'front-selfie',
  time: 'night',
  location: 'commercial-street',
  vehicleScene: 'none',
  people: '1',
  ratio: '9:16 vertical',
  age: '35',
  pose: 'natural-standing',
  expression: 'neutral',
  clothing: 'black-tee',
  hair: 'reference',
  beard: 'reference',
  glasses: 'reference',
  angle: 'eye-level',
  framing: 'chest-up',
  focalLength: '24',
  distance: '50',
  yaw: '0',
  pitch: '0',
  roll: '2',
  lightSource: 'street-lights',
  lightDirection: 'front-side natural direction',
  lightFalloff: 'natural distance-based falloff',
  exposure: 'natural',
  hdr: 'low',
  whiteBalance: 'neutral with small natural error',
  idea: '',
  notes: '',
  customLocation: '',
  customPose: '',
  customHair: '',
  customBeard: '',
  customGlasses: '',
  customClothing: '',
  customAngle: '',
  customFraming: '',
  customLightSource: ''
};

const SECTION_FIELDS = {
  reference: ['idea', 'referenceRole'],
  scene: ['captureType', 'time', 'location', 'customLocation', 'vehicleScene', 'people', 'ratio'],
  subject: ['age', 'pose', 'customPose', 'expression', 'hair', 'customHair', 'beard', 'customBeard', 'glasses', 'customGlasses', 'clothing', 'customClothing'],
  camera: ['angle', 'customAngle', 'framing', 'customFraming', 'focalLength', 'distance', 'yaw', 'pitch', 'roll'],
  lighting: ['lightSource', 'customLightSource', 'lightDirection', 'lightFalloff', 'exposure', 'hdr', 'whiteBalance'],
  notes: ['notes']
};

const PRESET_RESET_FIELDS = [
  'idea', 'captureType', 'time', 'location', 'customLocation', 'vehicleScene', 'people', 'ratio',
  'pose', 'customPose', 'expression', 'clothing', 'customClothing', 'angle', 'customAngle',
  'framing', 'customFraming', 'focalLength', 'distance', 'yaw', 'pitch', 'roll',
  'lightSource', 'customLightSource', 'lightDirection', 'lightFalloff', 'exposure', 'hdr', 'whiteBalance'
];

const CUSTOM_VISIBILITY = {
  location: 'customLocationWrap',
  pose: 'customPoseWrap',
  hair: 'customHairWrap',
  beard: 'customBeardWrap',
  glasses: 'customGlassesWrap',
  clothing: 'customClothingWrap',
  angle: 'customAngleWrap',
  framing: 'customFramingWrap',
  lightSource: 'customLightSourceWrap'
};

function fillSelect(id, items, defaultValue, preserveValue) {
  const select = $(id);
  if (!select) return;
  const wanted = preserveValue ?? select.value ?? defaultValue;
  select.innerHTML = '';
  items.forEach(([optionValue, label]) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = label;
    select.appendChild(option);
  });
  const hasWanted = [...select.options].some((option) => option.value === String(wanted));
  select.value = hasWanted ? String(wanted) : (defaultValue || select.options[0]?.value || '');
}

function setFieldValue(id, nextValue) {
  const el = $(id);
  if (!el) return false;
  const normalized = String(nextValue ?? '');
  if (el.tagName === 'SELECT' && ![...el.options].some((option) => option.value === normalized)) return false;
  el.value = normalized;
  return true;
}

function restoreFullSearchCatalogs() {
  fillSelect('location', LOCATIONS, DEFAULTS.location, value('location'));
  fillSelect('clothing', CLOTHING_OPTIONS, DEFAULTS.clothing, value('clothing'));
}

function buildCatalogs() {
  fillSelect('referenceRole', REFERENCE_ROLES, DEFAULTS.referenceRole);
  fillSelect('captureType', CAPTURE_TYPES, DEFAULTS.captureType);
  fillSelect('time', TIMES, DEFAULTS.time);
  fillSelect('location', LOCATIONS, DEFAULTS.location);
  fillSelect('vehicleScene', VEHICLE_SCENES, DEFAULTS.vehicleScene);
  fillSelect('angle', ANGLE_OPTIONS, DEFAULTS.angle);
  fillSelect('framing', FRAMING_OPTIONS, DEFAULTS.framing);
  fillSelect('pose', POSE_OPTIONS, DEFAULTS.pose);
  fillSelect('expression', EXPRESSIONS, DEFAULTS.expression);
  fillSelect('clothing', CLOTHING_OPTIONS, DEFAULTS.clothing);
  fillSelect('hair', HAIRSTYLES, DEFAULTS.hair);
  fillSelect('beard', BEARDS, DEFAULTS.beard);
  fillSelect('glasses', GLASSES_OPTIONS, DEFAULTS.glasses);
  fillSelect('lightSource', LIGHT_OPTIONS, DEFAULTS.lightSource);

  const preset = $('preset');
  preset.innerHTML = '<option value="">اختر Preset...</option>';
  PRESETS.forEach(({ id, label }) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
    preset.appendChild(option);
  });

  const moduleGrid = $('realismModules');
  moduleGrid.innerHTML = '';
  REALISM_MODULES.forEach(([key, label]) => {
    const card = document.createElement('label');
    card.className = 'module-card';
    const title = document.createElement('span');
    title.textContent = label;
    const select = document.createElement('select');
    select.id = `module_${key}`;
    MODULE_LEVELS.forEach(([moduleValue, text]) => {
      const option = document.createElement('option');
      option.value = moduleValue;
      option.textContent = text;
      select.appendChild(option);
    });
    select.value = 'auto';
    card.append(title, select);
    moduleGrid.appendChild(card);
  });
}

function value(id) {
  const el = $(id);
  return el ? String(el.value ?? '').trim() : '';
}

function readModules() {
  return Object.fromEntries(REALISM_MODULES.map(([key]) => [key, value(`module_${key}`) || 'off']));
}

function readState() {
  return {
    idea: value('idea'),
    referenceAttached,
    referenceRole: value('referenceRole'),
    captureType: value('captureType'),
    time: value('time'),
    location: value('location'),
    customLocation: value('customLocation'),
    vehicleScene: value('vehicleScene'),
    people: value('people'),
    ratio: value('ratio'),
    age: value('age'),
    pose: value('pose'),
    customPose: value('customPose'),
    expression: value('expression'),
    clothing: value('clothing'),
    customClothing: value('customClothing'),
    hair: value('hair'),
    customHair: value('customHair'),
    beard: value('beard'),
    customBeard: value('customBeard'),
    glasses: value('glasses'),
    customGlasses: value('customGlasses'),
    angle: value('angle'),
    customAngle: value('customAngle'),
    framing: value('framing'),
    customFraming: value('customFraming'),
    focalLength: value('focalLength'),
    distance: value('distance'),
    yaw: value('yaw'),
    pitch: value('pitch'),
    roll: value('roll'),
    lightSource: value('lightSource'),
    customLightSource: value('customLightSource'),
    lightDirection: value('lightDirection'),
    lightFalloff: value('lightFalloff'),
    exposure: value('exposure'),
    hdr: value('hdr'),
    whiteBalance: value('whiteBalance'),
    modules: readModules(),
    notes: value('notes')
  };
}

function compileForView(state) {
  if (activeView === 'concise') return compileConcise(state);
  if (activeView === 'json') return compileJson(state);
  if (activeView === 'negative') return compileNegative(state);
  return compileDetailed(state);
}

function renderWarnings(state) {
  const warnings = validateState(state);
  const box = $('warnings');
  const checklist = $('checklist');
  $('warningCount').textContent = String(warnings.length);

  if (!warnings.length) {
    box.classList.remove('visible');
    box.innerHTML = '';
    checklist.innerHTML = '<li class="ok">لا يوجد تعارض واضح في الاختيارات الحالية.</li><li class="ok">الموقع سعودي عام بدون معلم معروف.</li><li class="ok">الإضاءة الفيزيائية منفصلة عن المعالجة.</li>';
    return;
  }

  box.classList.add('visible');
  box.innerHTML = `<strong>تنبيهات قبل النسخ:</strong><ul>${warnings.map((warning) => `<li>${warning}</li>`).join('')}</ul>`;
  checklist.innerHTML = warnings.map((warning) => `<li class="warn">${warning}</li>`).join('');
}

function updateCustomVisibility() {
  Object.entries(CUSTOM_VISIBILITY).forEach(([selectId, wrapId]) => {
    const wrap = $(wrapId);
    if (wrap) wrap.hidden = value(selectId) !== 'custom';
  });
}

function render() {
  updateCustomVisibility();
  const state = readState();
  $('output').textContent = compileForView(state);
  renderWarnings(state);
}

function setActiveView(view) {
  activeView = view;
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  render();
}

async function copyOutput() {
  const text = $('output').textContent || '';
  if (!text) return;
  const button = $('copy');
  const old = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'تم النسخ';
  } catch {
    button.textContent = 'انسخ يدويًا';
  }
  setTimeout(() => { button.textContent = old; }, 1000);
}

function saveLocalState() {
  const values = {};
  document.querySelectorAll('#promptForm input:not([type="file"]):not([type="search"]), #promptForm select, #promptForm textarea').forEach((el) => {
    if (el.id) values[el.id] = el.value;
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
}

function restoreLocalState() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { saved = null; }
  if (!saved || typeof saved !== 'object') return;
  Object.entries(saved).forEach(([id, savedValue]) => setFieldValue(id, savedValue));
}

function resetFields(ids) {
  ids.forEach((id) => setFieldValue(id, DEFAULTS[id] ?? ''));
}

function resetSection(section) {
  if (section === 'scene') {
    $('locationSearch').value = '';
    fillSelect('location', LOCATIONS, DEFAULTS.location, DEFAULTS.location);
  }
  if (section === 'subject') {
    $('clothingSearch').value = '';
    fillSelect('clothing', CLOTHING_OPTIONS, DEFAULTS.clothing, DEFAULTS.clothing);
  }

  if (section === 'realism') {
    REALISM_MODULES.forEach(([key]) => setFieldValue(`module_${key}`, 'auto'));
  } else {
    resetFields(SECTION_FIELDS[section] || []);
  }

  if (section === 'reference') {
    $('referenceImage').value = '';
    referenceAttached = false;
    $('uploadZone').classList.remove('has-file');
    $('fileStatus').textContent = 'تبقى الصورة على جهازك؛ التطبيق يستخدم فقط اختيارك لدورها في البرومبت.';
  }

  saveLocalState();
  render();
}

function resetAll() {
  $('locationSearch').value = '';
  $('clothingSearch').value = '';
  fillSelect('location', LOCATIONS, DEFAULTS.location, DEFAULTS.location);
  fillSelect('clothing', CLOTHING_OPTIONS, DEFAULTS.clothing, DEFAULTS.clothing);
  Object.keys(DEFAULTS).forEach((id) => setFieldValue(id, DEFAULTS[id]));
  REALISM_MODULES.forEach(([key]) => setFieldValue(`module_${key}`, 'auto'));
  $('referenceImage').value = '';
  referenceAttached = false;
  $('uploadZone').classList.remove('has-file');
  $('fileStatus').textContent = 'تبقى الصورة على جهازك؛ التطبيق يستخدم فقط اختيارك لدورها في البرومبت.';
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  render();
}

function filterCatalog(selectId, items, query, defaultValue) {
  const select = $(selectId);
  const current = select.value;
  const q = query.trim().toLowerCase();
  let filtered = !q ? items : items.filter((item) => item.join(' ').toLowerCase().includes(q));
  const currentItem = items.find(([key]) => key === current);
  if (currentItem && !filtered.some(([key]) => key === current)) filtered = [currentItem, ...filtered];
  fillSelect(selectId, filtered, defaultValue, current);
  render();
}

function applyPreset() {
  const preset = PRESETS.find((item) => item.id === value('preset'));
  if (!preset) return;

  $('locationSearch').value = '';
  $('clothingSearch').value = '';
  restoreFullSearchCatalogs();
  resetFields(PRESET_RESET_FIELDS);

  Object.entries(preset.values).forEach(([id, presetValue]) => {
    if (!setFieldValue(id, presetValue)) console.warn(`Preset ${preset.id}: unsupported value for ${id}`);
  });

  saveLocalState();
  render();
}

function bindEvents() {
  const form = $('promptForm');
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', () => { saveLocalState(); render(); });
  form.addEventListener('change', () => { saveLocalState(); render(); });

  $('referenceImage').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    referenceAttached = Boolean(file);
    $('uploadZone').classList.toggle('has-file', referenceAttached);
    $('fileStatus').textContent = file
      ? `تم اختيار: ${file.name}. حدّد دور الصورة المرجعية لاستخدامها في البرومبت.`
      : 'تبقى الصورة على جهازك؛ التطبيق يستخدم فقط اختيارك لدورها في البرومبت.';
    render();
  });

  $('locationSearch').addEventListener('input', (event) => filterCatalog('location', LOCATIONS, event.target.value, DEFAULTS.location));
  $('clothingSearch').addEventListener('input', (event) => filterCatalog('clothing', CLOTHING_OPTIONS, event.target.value, DEFAULTS.clothing));
  $('applyPreset').addEventListener('click', applyPreset);
  $('resetAll').addEventListener('click', resetAll);
  document.querySelectorAll('[data-reset]').forEach((button) => button.addEventListener('click', () => resetSection(button.dataset.reset)));
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setActiveView(button.dataset.view)));
  $('copy').addEventListener('click', copyOutput);
}

buildCatalogs();
restoreLocalState();
bindEvents();
render();
