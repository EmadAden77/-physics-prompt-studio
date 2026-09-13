import {
  CATALOG,
  DEFAULT_STATE,
  FIELD_SPECS,
  REALISM_MODULES,
  MODULE_LEVELS
} from './data/catalog.js';
import { PRESETS } from './data/presets.js';
import { compileDetailed, compileConcise, compileNegative, compileJson } from './core/compiler.js';
import { validationStatus } from './core/validation.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'physics-prompt-studio-v4';
let activeView = 'detailed';
let referenceAttached = false;

const SECTION_FIELDS = Object.freeze({
  reference: ['idea', 'referenceRole'],
  scene: ['captureType', 'time', 'location', 'customLocation', 'vehicleScene', 'people', 'ratio'],
  subject: ['age', 'pose', 'customPose', 'expression', 'hair', 'customHair', 'beard', 'customBeard', 'glasses', 'customGlasses', 'clothing', 'customClothing'],
  camera: ['framing', 'focalLength', 'distance', 'yaw', 'pitch', 'roll'],
  lighting: ['lightSource', 'customLightSource', 'lightDirection', 'lightFalloff', 'exposure', 'hdr', 'whiteBalance'],
  notes: ['notes']
});

const CUSTOM_VISIBILITY = Object.freeze({
  location: 'customLocationWrap',
  pose: 'customPoseWrap',
  hair: 'customHairWrap',
  beard: 'customBeardWrap',
  glasses: 'customGlassesWrap',
  clothing: 'customClothingWrap',
  lightSource: 'customLightSourceWrap'
});

function fillSelect(id, options, selectedValue) {
  const select = $(id);
  if (!select) throw new Error(`Missing select #${id}`);
  const wanted = String(selectedValue ?? select.value ?? '');
  select.replaceChildren(...options.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    return option;
  }));
  select.value = options.some((item) => item.id === wanted) ? wanted : String(options[0]?.id ?? '');
}

function applyNumericSpecs() {
  for (const [id, spec] of Object.entries(FIELD_SPECS)) {
    const input = $(id);
    if (!input) throw new Error(`Missing numeric input #${id}`);
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.dataset.unit = spec.unit;
  }
}

function buildCatalogs() {
  for (const [field, options] of Object.entries(CATALOG)) {
    fillSelect(field, options, DEFAULT_STATE[field]);
  }

  const preset = $('preset');
  preset.replaceChildren(new Option('اختر Preset...', ''), ...PRESETS.map((item) => new Option(item.label, item.id)));

  const moduleGrid = $('realismModules');
  moduleGrid.replaceChildren(...REALISM_MODULES.map((module) => {
    const card = document.createElement('label');
    card.className = 'module-card';
    const title = document.createElement('span');
    title.textContent = module.label;
    const select = document.createElement('select');
    select.id = `module_${module.id}`;
    for (const level of MODULE_LEVELS) select.appendChild(new Option(level.label, level.id));
    select.value = DEFAULT_STATE.modules[module.id];
    card.append(title, select);
    return card;
  }));

  applyNumericSpecs();
}

function value(id) {
  const element = $(id);
  return element ? String(element.value ?? '').trim() : '';
}

function readModules() {
  return Object.fromEntries(REALISM_MODULES.map(({ id }) => [id, value(`module_${id}`)]));
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
    framing: value('framing'),
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

function setFieldValue(id, nextValue) {
  const element = $(id);
  if (!element) return false;
  const normalized = String(nextValue ?? '');
  if (element.tagName === 'SELECT' && ![...element.options].some((option) => option.value === normalized)) return false;
  element.value = normalized;
  return true;
}

function applyStateToForm(state) {
  for (const [key, nextValue] of Object.entries(state)) {
    if (key === 'modules' || key === 'referenceAttached') continue;
    setFieldValue(key, nextValue);
  }
  for (const module of REALISM_MODULES) setFieldValue(`module_${module.id}`, state.modules?.[module.id] ?? DEFAULT_STATE.modules[module.id]);
}

function compileForView(state) {
  if (activeView === 'concise') return compileConcise(state);
  if (activeView === 'json') return compileJson(state);
  if (activeView === 'negative') return compileNegative(state);
  return compileDetailed(state);
}

function updateCustomVisibility() {
  for (const [selectId, wrapId] of Object.entries(CUSTOM_VISIBILITY)) {
    const wrap = $(wrapId);
    if (wrap) wrap.hidden = value(selectId) !== 'custom';
  }
}

function renderIssues(status) {
  const box = $('warnings');
  const checklist = $('checklist');
  $('warningCount').textContent = String(status.issues.length);

  if (!status.issues.length) {
    box.classList.remove('visible');
    box.replaceChildren();
    checklist.innerHTML = '<li class="ok">الحالة متسقة مع النموذج الفيزيائي الحالي.</li><li class="ok">الهندسة الرقمية هي المصدر الوحيد لزاوية الكاميرا.</li><li class="ok">الموقع سعودي عام بلا اسم مدينة أو معلم محدد.</li>';
    return;
  }

  box.classList.add('visible');
  const blockingText = status.blocked ? '<strong>الإخراج متوقف حتى معالجة التعارضات المانعة.</strong>' : '<strong>تنبيهات الحالة الحالية:</strong>';
  box.innerHTML = `${blockingText}<ul>${status.issues.map((item) => `<li><b>${item.severity.toUpperCase()}</b> · ${item.message}</li>`).join('')}</ul>`;
  checklist.innerHTML = status.issues.map((item) => `<li class="${item.severity === 'warning' ? 'warn' : 'error'}">${item.message}</li>`).join('');
}

function render() {
  updateCustomVisibility();
  const state = readState();
  const status = validationStatus(state);
  $('output').textContent = compileForView(state);
  renderIssues(status);

  const badge = $('liveState');
  badge.textContent = status.blocked ? 'BLOCKED' : status.strict ? 'STRICT' : 'VALID';
  badge.classList.toggle('blocked', status.blocked);
  badge.classList.toggle('strict', !status.blocked && status.strict);
}

function setActiveView(view) {
  activeView = view;
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  render();
}

async function copyOutput() {
  const text = $('output').textContent || '';
  if (!text) return;
  const button = $('copy');
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'تم النسخ';
  } catch {
    button.textContent = 'انسخ يدويًا';
  }
  window.setTimeout(() => { button.textContent = original; }, 900);
}

function saveLocalState() {
  const state = readState();
  const serializable = { ...state, referenceAttached: false };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable)); } catch {}
}

function restoreLocalState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
  applyStateToForm({ ...DEFAULT_STATE, ...saved, modules: { ...DEFAULT_STATE.modules, ...(saved.modules || {}) } });
}

function clearReferenceFile() {
  $('referenceImage').value = '';
  referenceAttached = false;
  $('uploadZone').classList.remove('has-file');
  $('fileStatus').textContent = 'تبقى الصورة على جهازك؛ التطبيق يسجل فقط ما إذا كان المرجع مرفقًا ودوره.';
}

function resetSection(section) {
  if (section === 'realism') {
    for (const module of REALISM_MODULES) setFieldValue(`module_${module.id}`, DEFAULT_STATE.modules[module.id]);
  } else {
    for (const id of SECTION_FIELDS[section] || []) setFieldValue(id, DEFAULT_STATE[id]);
  }
  if (section === 'scene') $('locationSearch').value = '';
  if (section === 'subject') $('clothingSearch').value = '';
  if (section === 'reference') clearReferenceFile();
  restoreFilteredCatalogs();
  saveLocalState();
  render();
}

function resetAll() {
  $('locationSearch').value = '';
  $('clothingSearch').value = '';
  restoreFilteredCatalogs();
  applyStateToForm(DEFAULT_STATE);
  clearReferenceFile();
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  render();
}

function filterOptions(selectId, query) {
  const options = CATALOG[selectId];
  const current = value(selectId);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((item) => `${item.id} ${item.label} ${item.prompt || ''}`.toLowerCase().includes(normalizedQuery))
    : options;
  const currentOption = options.find((item) => item.id === current);
  const withCurrent = currentOption && !filtered.some((item) => item.id === current) ? [currentOption, ...filtered] : filtered;
  fillSelect(selectId, withCurrent, current);
  render();
}

function restoreFilteredCatalogs() {
  fillSelect('location', CATALOG.location, value('location') || DEFAULT_STATE.location);
  fillSelect('clothing', CATALOG.clothing, value('clothing') || DEFAULT_STATE.clothing);
}

function applyPreset() {
  const preset = PRESETS.find((item) => item.id === value('preset'));
  if (!preset) return;
  const currentReferenceRole = value('referenceRole');
  $('locationSearch').value = '';
  $('clothingSearch').value = '';
  restoreFilteredCatalogs();
  const next = {
    ...DEFAULT_STATE,
    ...preset.values,
    referenceRole: currentReferenceRole,
    modules: { ...DEFAULT_STATE.modules }
  };
  applyStateToForm(next);
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
    $('fileStatus').textContent = file ? `تم اختيار: ${file.name}.` : 'تبقى الصورة على جهازك؛ التطبيق يسجل فقط ما إذا كان المرجع مرفقًا ودوره.';
    render();
  });

  $('locationSearch').addEventListener('input', (event) => filterOptions('location', event.target.value));
  $('clothingSearch').addEventListener('input', (event) => filterOptions('clothing', event.target.value));
  $('applyPreset').addEventListener('click', applyPreset);
  $('resetAll').addEventListener('click', resetAll);
  $('copy').addEventListener('click', copyOutput);
  document.querySelectorAll('[data-reset]').forEach((button) => button.addEventListener('click', () => resetSection(button.dataset.reset)));
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setActiveView(button.dataset.view)));
}

buildCatalogs();
restoreLocalState();
bindEvents();
render();
