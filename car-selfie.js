import { COMMON_CATALOG, detectCarModeFromIntent } from './data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG, INSIDE_DEFAULT_STATE } from './data/carSelfieInsideCatalog.js';
import { OUTSIDE_CATALOG, OUTSIDE_DEFAULT_STATE } from './data/carSelfieOutsideCatalog.js';
import {
  analyzeCarSelfieIntent,
  compileCarSelfieConcise,
  compileCarSelfieDetailed,
  compileCarSelfieJson,
  compileCarSelfieNegative
} from './core/carSelfieCompiler.js';
import {
  carValidationStatus,
  compatibleOptions,
  defaultStateForMode,
  normalizeCarState
} from './core/carSelfieValidation.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'physics-prompt-studio-car-selfie-v7';
const SELECT_FIELDS = Object.freeze([
  'vehicleProfile','vehicleState','seat','standingPose','paintCondition','captureMode','cameraLens','colorProfile','lowLightProcessing','framing',
  'expression','gazeTarget','skinDetail','clothing','fabricType','fabricSheen','wrinkleProfile','hairProfile','hairMotion','hairSpecular','handPose',
  'place','weather','time','externalLight','exposure','hdr','whiteBalance','physicsMode','cabinMaterial','clusterType','roofType','windowState','clutterLevel','cabinEmitter'
]);
const NUMERIC_FIELDS = Object.freeze(['apparentAge','distance','yaw','pitch','roll']);
const COMMON_FIELDS = Object.freeze([
  'initialRequest','referenceRole','vehicleProfile','captureMode','cameraLens','colorProfile','lowLightProcessing','framing','apparentAge','distance','yaw','pitch','roll',
  'expression','gazeTarget','skinDetail','clothing','fabricType','fabricSheen','wrinkleProfile','hairProfile','hairMotion','hairSpecular','place','weather','time',
  'externalLight','exposure','hdr','whiteBalance','physicsMode','notes'
]);
const INSIDE_FIELDS = Object.freeze(['vehicleState','seat','handPose','cabinMaterial','clusterType','roofType','windowState','clutterLevel','cabinEmitter']);
const OUTSIDE_FIELDS = Object.freeze(['vehicleState','standingPose','paintCondition']);

let activeMode = 'inside';
let activeStep = 1;
let activeView = 'detailed';
let referenceAttached = false;
let intentTyping = false;
let states = {
  inside: normalizeCarState(INSIDE_DEFAULT_STATE),
  outside: normalizeCarState(OUTSIDE_DEFAULT_STATE)
};

const catalogForActiveMode = () => activeMode === 'outside' ? OUTSIDE_CATALOG : INSIDE_CATALOG;
const activeFields = () => [...COMMON_FIELDS, ...(activeMode === 'outside' ? OUTSIDE_FIELDS : INSIDE_FIELDS)];

function fillSelect(field, state) {
  const select = $(field);
  if (!select) return;
  const options = compatibleOptions(field, state);
  const current = select.value || state[field];
  select.replaceChildren(...options.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    return option;
  }));
  if (options.some((item) => item.id === current)) select.value = current;
  else if (options.some((item) => item.id === state[field])) select.value = state[field];
  else if (options[0]) select.value = options[0].id;
}

function writeSimpleFields(state) {
  for (const field of NUMERIC_FIELDS) if ($(field)) $(field).value = state[field];
  for (const field of ['initialRequest','notes','referenceRole']) if ($(field)) $(field).value = state[field] ?? '';
  if ($('focalLength')) $('focalLength').value = `${state.focalLength} mm`;
  if ($('aperture')) $('aperture').value = `f/${state.aperture}`;
}

function collectDomState() {
  const base = { ...states[activeMode], mode: activeMode, referenceAttached };
  for (const field of activeFields()) {
    const element = $(field);
    if (!element) continue;
    base[field] = NUMERIC_FIELDS.includes(field) ? Number(element.value) : element.value;
  }
  return normalizeCarState(base);
}

function stabilizeUi(seedState) {
  let state = normalizeCarState(seedState);
  for (let pass = 0; pass < 3; pass += 1) {
    for (const field of SELECT_FIELDS) {
      if (!$(field)) continue;
      if (!catalogForActiveMode()[field] && !COMMON_CATALOG[field]) continue;
      fillSelect(field, state);
    }
    writeSimpleFields(state);
    state = collectDomState();
  }
  states[activeMode] = state;
  writeSimpleFields(state);
  return state;
}

function showModeBlocks() {
  document.querySelectorAll('[data-mode-only]').forEach((element) => {
    element.hidden = element.dataset.modeOnly !== activeMode;
  });
  document.querySelectorAll('[data-mode-select]').forEach((button) => {
    const on = button.dataset.modeSelect === activeMode;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', String(on));
  });
  $('previewMode').textContent = activeMode === 'inside' ? 'INSIDE' : 'OUTSIDE';
  $('modeSummary').textContent = activeMode === 'inside'
    ? 'الوضع النشط: داخل السيارة. المتاح هو المقعد، المقصورة، LHD، اليدان، النوافذ، الفوضى والمصادر الداخلية. جميع تعليمات الوقوف بجانب السيارة محذوفة من الحالة النشطة.'
    : 'الوضع النشط: خارج السيارة بجانبها. المتاح هو وضعية الوقوف، الطلاء، الهيكل والزجاج والإطارات. جميع تعليمات المقعد والعدادات والفوضى والمصادر الداخلية محذوفة من الحالة النشطة.';
}

function outputFor(state) {
  if (activeView === 'concise') return compileCarSelfieConcise(state);
  if (activeView === 'json') return compileCarSelfieJson(state);
  if (activeView === 'negative') return compileCarSelfieNegative(state);
  return compileCarSelfieDetailed(state);
}

function updatePreview(state, status) {
  const inside = state.mode === 'inside';
  const remote = state.mode === 'outside' && state.captureMode === 'remote-rear';
  const cameraGroup = $('cameraGroup');
  const cameraPhone = $('cameraPhone');
  const cameraDot = $('cameraDot');
  const personDot = $('personDot');
  const ray = $('cameraRay');

  let cameraX = 106;
  let cameraY = 103;
  let personX = 145;
  let personY = 103;
  if (!inside) {
    personX = 82;
    personY = 105;
    cameraX = remote ? 292 : 32;
    cameraY = remote ? 94 : 88;
  }

  personDot.setAttribute('cx', personX);
  personDot.setAttribute('cy', personY);
  cameraPhone.setAttribute('x', cameraX - 9);
  cameraPhone.setAttribute('y', cameraY - 9);
  cameraDot.setAttribute('cx', cameraX);
  cameraDot.setAttribute('cy', cameraY - 2);
  cameraGroup.setAttribute('transform', `rotate(${state.roll} ${cameraX} ${cameraY})`);
  ray.setAttribute('x1', cameraX);
  ray.setAttribute('y1', cameraY);
  ray.setAttribute('x2', personX + state.yaw * 0.45);
  ray.setAttribute('y2', personY - state.pitch * 0.35);
  $('previewLabel').textContent = inside ? 'الكاميرا داخل السيارة' : remote ? 'كاميرا خلفية ثابتة خارج السيارة' : 'سيلفي أمامي بجانب السيارة';
  $('yawReadout').textContent = `${state.yaw}°`;
  $('pitchReadout').textContent = `${state.pitch}°`;
  $('rollReadout').textContent = `${state.roll}°`;
  $('previewNote').textContent = inside
    ? 'المؤشر داخل المقصورة. اتجاه الخط يتغير مع Yaw/Pitch، والهاتف يدور بصريًا مع Roll.'
    : remote
      ? 'الهاتف خارج السيارة على دعم ثابت/ريموت. هذا يسمح بعدسة Leica الخلفية 23mm أو 70mm دون ادعاء سيلفي يدوي مستحيل.'
      : 'الهاتف عند مسافة ذراع خارج السيارة ويستخدم الكاميرا الأمامية فقط.';

  const mini = document.querySelector('.mini-status');
  mini.dataset.state = status.blocked ? 'blocked' : status.issues.length ? 'check' : 'valid';
  $('miniStatus').textContent = status.blocked ? 'BLOCKED' : status.issues.length ? 'CHECK' : 'VALID';
  $('miniIssues').textContent = `${status.issues.length} تعارضات`;
}

function renderIssues(status) {
  $('issueCount').textContent = String(status.issues.length);
  $('liveState').textContent = status.blocked ? 'BLOCKED' : status.issues.length ? 'CHECK' : 'VALID';
  $('liveState').dataset.state = status.blocked ? 'blocked' : status.issues.length ? 'check' : 'valid';
  const rows = status.issues.length ? status.issues : [{ severity: 'ok', code: 'OK', message: 'الحالة متناسقة مع الوضع النشط وقواعد الفيزياء.' }];
  $('issues').replaceChildren(...rows.map((item) => {
    const li = document.createElement('li');
    li.className = item.severity;
    li.textContent = `${item.code}: ${item.message}`;
    return li;
  }));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeMode, states }));
}

function render(seed = states[activeMode]) {
  showModeBlocks();
  const state = stabilizeUi(seed);
  const status = carValidationStatus(state);
  $('output').textContent = outputFor(state);
  renderIssues(status);
  updatePreview(state, status);
  saveState();
}

function switchMode(mode, requestOverride = null) {
  if (mode !== 'inside' && mode !== 'outside') return;
  if (activeMode !== mode) states[activeMode] = collectDomState();
  activeMode = mode;
  if (requestOverride !== null) states[activeMode] = normalizeCarState({ ...states[activeMode], initialRequest: requestOverride, mode: activeMode });
  referenceAttached = Boolean(states[activeMode].referenceAttached);
  render(states[activeMode]);
}

function applyIntent({ realtime = false } = {}) {
  const request = $('initialRequest').value;
  const detectedMode = detectCarModeFromIntent(request, activeMode);
  if (detectedMode !== activeMode) switchMode(detectedMode, request);
  const referenceRole = $('referenceRole').value || 'identity-only';
  const analysis = analyzeCarSelfieIntent(request, activeMode, defaultStateForMode(activeMode));
  states[activeMode] = normalizeCarState({
    ...analysis.recommended,
    mode: activeMode,
    initialRequest: request,
    referenceAttached,
    referenceRole,
    notes: realtime ? states[activeMode].notes : $('notes').value
  });
  $('intentSummary').textContent = analysis.tags.length ? `تحليل حتمي: ${analysis.tags.join(' · ')}` : 'لم يجد كلمات حاسمة؛ استخدم إعدادات الوضع الافتراضية الحتمية.';
  render(states[activeMode]);
}

function handleControlChange(event) {
  const target = event.target;
  if (!target.id || target.id === 'initialRequest' || target.id === 'referenceImage') return;
  states[activeMode] = collectDomState();
  render(states[activeMode]);
}

function setStep(step) {
  activeStep = Math.min(6, Math.max(1, Number(step) || 1));
  document.querySelectorAll('[data-step]').forEach((section) => section.classList.toggle('active', Number(section.dataset.step) === activeStep));
  document.querySelectorAll('[data-step-target]').forEach((button) => button.classList.toggle('active', Number(button.dataset.stepTarget) === activeStep));
  $('prevStep').disabled = activeStep === 1;
  $('nextStep').disabled = activeStep === 6;
  $('nextStep').textContent = activeStep === 5 ? 'عرض المخرجات' : 'التالي';
}

for (const button of document.querySelectorAll('[data-mode-select]')) {
  button.addEventListener('click', () => switchMode(button.dataset.modeSelect));
}
for (const button of document.querySelectorAll('[data-step-target]')) {
  button.addEventListener('click', () => setStep(button.dataset.stepTarget));
}
$('prevStep').addEventListener('click', () => setStep(activeStep - 1));
$('nextStep').addEventListener('click', () => setStep(activeStep + 1));
$('analyzeIntent').addEventListener('click', () => applyIntent({ realtime: false }));

$('initialRequest').addEventListener('input', () => {
  if (intentTyping) return;
  intentTyping = true;
  try { applyIntent({ realtime: true }); } finally { intentTyping = false; }
});

document.querySelector('.wizard').addEventListener('change', handleControlChange);
document.querySelector('.wizard').addEventListener('input', (event) => {
  if (event.target.id !== 'initialRequest' && event.target.id !== 'notes') handleControlChange(event);
  if (event.target.id === 'notes') {
    states[activeMode] = collectDomState();
    render(states[activeMode]);
  }
});

$('referenceImage').addEventListener('change', (event) => {
  referenceAttached = Boolean(event.target.files?.length);
  $('fileStatus').textContent = referenceAttached ? `تم اختيار: ${event.target.files[0].name}` : 'لم تُرفق صورة';
  states[activeMode] = normalizeCarState({ ...collectDomState(), referenceAttached });
  render(states[activeMode]);
});

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
  activeView = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item === button));
  render(states[activeMode]);
}));

$('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('output').textContent);
  $('copy').textContent = 'تم النسخ';
  setTimeout(() => { $('copy').textContent = 'نسخ'; }, 900);
});

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved?.states) {
    states = {
      inside: normalizeCarState({ ...INSIDE_DEFAULT_STATE, ...saved.states.inside, mode: 'inside' }),
      outside: normalizeCarState({ ...OUTSIDE_DEFAULT_STATE, ...saved.states.outside, mode: 'outside' })
    };
    activeMode = saved.activeMode === 'outside' ? 'outside' : 'inside';
  }
} catch {
  states = { inside: normalizeCarState(INSIDE_DEFAULT_STATE), outside: normalizeCarState(OUTSIDE_DEFAULT_STATE) };
}

setStep(1);
render(states[activeMode]);
