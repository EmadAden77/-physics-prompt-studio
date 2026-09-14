import { detectCarModeFromIntent } from './data/carSelfieCommonCatalog.js';
import { INSIDE_DEFAULT_STATE } from './data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE } from './data/carSelfieOutsideCatalog.js';
import {
  analyzeCarSelfieIntent,
  compileCarSelfieDetailed,
  compileCarSelfieTechnicalSpec
} from './core/carSelfieCompiler.js';
import {
  carValidationStatus,
  compatibleOptions,
  defaultStateForMode,
  normalizeCarState
} from './core/carSelfieValidation.js';
import { buildCarSelfieEngineeringSpec } from './core/carSelfieEngineeringSpec.js';
import { compileCarSelfieMinimalPrompt, countPromptWords } from './core/carSelfieMinimalPrompt.js';
import { countNarrativeWords } from './core/carSelfieNarrativeCompiler.js';
import {
  buildCarSelfieAcceptance,
  createCarSelfieAcceptanceReport,
  formatCarSelfieAcceptance
} from './core/carSelfieAcceptance.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'physics-prompt-studio-car-selfie-v9';
const LEGACY_STORAGE_KEYS = ['physics-prompt-studio-car-selfie-v8', 'physics-prompt-studio-car-selfie-v7'];

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
const MODEL_VIEWS = new Set(['narrative', 'compact', 'legacy']);
const ALL_VIEWS = new Set(['narrative', 'compact', 'legacy', 'engineering', 'acceptance']);

let activeMode = 'inside';
let activeStep = 1;
let activeView = 'narrative';
let preferredPromptMode = 'narrative';
let referenceAttached = false;
let intentTyping = false;
let states = {
  inside: normalizeCarState(INSIDE_DEFAULT_STATE),
  outside: normalizeCarState(OUTSIDE_DEFAULT_STATE)
};
let acceptanceMarks = { inside: {}, outside: {} };

const activeFields = () => [...COMMON_FIELDS, ...(activeMode === 'outside' ? OUTSIDE_FIELDS : INSIDE_FIELDS)];

function fillSelect(field, state) {
  const select = $(field);
  if (!select) return;
  const options = compatibleOptions(field, state);
  if (!options.length) return;
  const current = select.value || state[field];
  select.replaceChildren(...options.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    return option;
  }));
  if (options.some((item) => item.id === current)) select.value = current;
  else if (options.some((item) => item.id === state[field])) select.value = state[field];
  else select.value = options[0].id;
}

function writeSimpleFields(state) {
  for (const field of NUMERIC_FIELDS) if ($(field)) $(field).value = state[field];
  for (const field of ['initialRequest','notes','referenceRole']) if ($(field)) $(field).value = state[field] ?? '';
  if ($('focalLength')) $('focalLength').value = `${state.focalLength} mm`;
  if ($('aperture')) $('aperture').value = `f/${state.aperture}`;
  if ($('promptMode')) $('promptMode').value = preferredPromptMode;
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
    for (const field of SELECT_FIELDS) fillSelect(field, state);
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
    ? 'الوضع النشط: داخل السيارة. المخرج الافتراضي وصف سردي واحد، بينما القياسات الهندسية وقائمة القبول تبقيان خارج النص المرسل للنموذج.'
    : 'الوضع النشط: خارج السيارة بجانبها. المحرك يصف الصورة بصياغة سردية طبيعية ويترك القياسات التفصيلية لطبقة التحقق.';
}

function blockedMessage(status) {
  return ['OUTPUT BLOCKED BY CAR PHYSICS CHECKER', ...status.issues.filter((item) => item.severity !== 'warning').map((item) => `- ${item.code}: ${item.message}`)].join('\n');
}

function outputFor(state, status) {
  if (activeView === 'engineering') return JSON.stringify(buildCarSelfieEngineeringSpec(state), null, 2);
  if (activeView === 'acceptance') return formatCarSelfieAcceptance(state);
  if (activeView === 'legacy') return compileCarSelfieTechnicalSpec(state);
  if (activeView === 'compact') {
    if (status.blocked) return blockedMessage(status);
    return compileCarSelfieMinimalPrompt(state);
  }
  return compileCarSelfieDetailed(state);
}

function syncOutputTabs() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === activeView);
  });
}

function updateOutputMeta(state) {
  if (!$('outputMeta')) return;
  if (activeView === 'narrative') {
    const text = compileCarSelfieDetailed(state);
    const words = text.startsWith('OUTPUT BLOCKED') ? 0 : countNarrativeWords(text);
    $('outputMeta').textContent = words ? `${words} كلمة · سردي · يُرسل للنموذج` : 'محجوب بواسطة Conflict Checker';
    $('outputMeta').dataset.kind = 'model';
  } else if (activeView === 'compact') {
    const words = countPromptWords(compileCarSelfieMinimalPrompt(state));
    $('outputMeta').textContent = `${words} كلمة · مضغوط جدًا · يُرسل للنموذج`;
    $('outputMeta').dataset.kind = 'model';
  } else if (activeView === 'legacy') {
    $('outputMeta').textContent = 'Technical Spec (legacy) · للمقارنة فقط';
    $('outputMeta').dataset.kind = 'model';
  } else if (activeView === 'engineering') {
    $('outputMeta').textContent = 'مواصفات داخلية للتحقق · لا تُرسل للنموذج';
    $('outputMeta').dataset.kind = 'internal';
  } else {
    $('outputMeta').textContent = 'قائمة تحقق بشرية بعد التوليد · لا تُرسل للنموذج';
    $('outputMeta').dataset.kind = 'internal';
  }
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
    ? 'هذه معاينة هندسية داخلية، بينما البرومبت السردي يكتفي بوصف الصورة وVisual Anchor واحد.'
    : remote
      ? 'الهاتف على دعم ثابت، والوصف السردي يذكر النتيجة المرئية فقط.'
      : 'الهاتف عند مسافة ذراع، والقياسات الدقيقة تبقى في طبقة Engineering.';

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

function setAcceptanceMark(id, mark) {
  const current = acceptanceMarks[activeMode][id];
  if (current === mark) delete acceptanceMarks[activeMode][id];
  else acceptanceMarks[activeMode][id] = mark;
  renderAcceptance(states[activeMode]);
  saveState();
}

function renderAcceptance(state) {
  const items = buildCarSelfieAcceptance(state);
  const marks = acceptanceMarks[activeMode];
  const container = $('acceptanceChecklist');
  container.replaceChildren(...items.map((item) => {
    const row = document.createElement('div');
    row.className = 'acceptance-row';
    row.dataset.result = marks[item.id] || 'unset';

    const label = document.createElement('span');
    label.textContent = item.label;

    const actions = document.createElement('div');
    actions.className = 'acceptance-actions';
    const pass = document.createElement('button');
    pass.type = 'button';
    pass.textContent = '✓';
    pass.className = marks[item.id] === 'pass' ? 'selected pass' : 'pass';
    pass.setAttribute('aria-label', `قبول: ${item.label}`);
    pass.addEventListener('click', () => setAcceptanceMark(item.id, 'pass'));

    const fail = document.createElement('button');
    fail.type = 'button';
    fail.textContent = '✗';
    fail.className = marks[item.id] === 'fail' ? 'selected fail' : 'fail';
    fail.setAttribute('aria-label', `رفض: ${item.label}`);
    fail.addEventListener('click', () => setAcceptanceMark(item.id, 'fail'));

    actions.append(pass, fail);
    row.append(label, actions);
    return row;
  }));

  const values = Object.values(marks);
  const passed = values.filter((value) => value === 'pass').length;
  const failed = values.filter((value) => value === 'fail').length;
  $('acceptanceProgress').textContent = `${passed}/${items.length} ناجح · ${failed} مرفوض`;
  $('acceptanceReport').textContent = createCarSelfieAcceptanceReport(state, marks);
}

function resetAcceptance(mode = activeMode) {
  acceptanceMarks[mode] = {};
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeMode, preferredPromptMode, states, acceptanceMarks }));
}

function render(seed = states[activeMode]) {
  showModeBlocks();
  const state = stabilizeUi(seed);
  const status = carValidationStatus(state);
  states[activeMode] = state;
  syncOutputTabs();
  $('output').textContent = outputFor(state, status);
  updateOutputMeta(state);
  renderIssues(status);
  updatePreview(state, status);
  renderAcceptance(state);
  saveState();
}

function switchMode(mode, requestOverride = null) {
  if (mode !== 'inside' && mode !== 'outside') return;
  if (activeMode !== mode) states[activeMode] = collectDomState();
  activeMode = mode;
  if (requestOverride !== null) {
    states[activeMode] = normalizeCarState({ ...states[activeMode], initialRequest: requestOverride, mode: activeMode });
    resetAcceptance(activeMode);
  }
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
  resetAcceptance(activeMode);
  $('intentSummary').textContent = analysis.tags.length ? `تحليل حتمي: ${analysis.tags.join(' · ')}` : 'لم يجد كلمات حاسمة؛ استخدم إعدادات الوضع الافتراضية الحتمية.';
  render(states[activeMode]);
}

function handleControlChange(event) {
  const target = event.target;
  if (!target.id || ['initialRequest','referenceImage','promptMode'].includes(target.id)) return;
  states[activeMode] = collectDomState();
  resetAcceptance(activeMode);
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

function setView(view) {
  if (!ALL_VIEWS.has(view)) return;
  activeView = view;
  if (MODEL_VIEWS.has(view)) preferredPromptMode = view;
  if ($('promptMode')) $('promptMode').value = preferredPromptMode;
  render(states[activeMode]);
}

function loadSavedState() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    const saved = JSON.parse(current || legacy || 'null');
    if (!saved?.states) return;
    states = {
      inside: normalizeCarState({ ...INSIDE_DEFAULT_STATE, ...saved.states.inside, mode: 'inside' }),
      outside: normalizeCarState({ ...OUTSIDE_DEFAULT_STATE, ...saved.states.outside, mode: 'outside' })
    };
    activeMode = saved.activeMode === 'outside' ? 'outside' : 'inside';
    preferredPromptMode = ['narrative','compact','legacy'].includes(saved.preferredPromptMode) ? saved.preferredPromptMode : 'narrative';
    activeView = preferredPromptMode;
    acceptanceMarks = {
      inside: saved.acceptanceMarks?.inside || {},
      outside: saved.acceptanceMarks?.outside || {}
    };
  } catch {
    states = { inside: normalizeCarState(INSIDE_DEFAULT_STATE), outside: normalizeCarState(OUTSIDE_DEFAULT_STATE) };
    acceptanceMarks = { inside: {}, outside: {} };
    preferredPromptMode = 'narrative';
    activeView = 'narrative';
  }
}

for (const button of document.querySelectorAll('[data-mode-select]')) {
  button.addEventListener('click', () => switchMode(button.dataset.modeSelect));
}
for (const button of document.querySelectorAll('[data-step-target]')) {
  button.addEventListener('click', () => setStep(button.dataset.stepTarget));
}
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => setView(button.dataset.view));
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
  if (!['initialRequest','notes','promptMode'].includes(event.target.id)) handleControlChange(event);
  if (event.target.id === 'notes') {
    states[activeMode] = collectDomState();
    resetAcceptance(activeMode);
    render(states[activeMode]);
  }
});

$('promptMode').addEventListener('change', (event) => {
  preferredPromptMode = ['narrative','compact','legacy'].includes(event.target.value) ? event.target.value : 'narrative';
  setView(preferredPromptMode);
});

$('referenceImage').addEventListener('change', (event) => {
  referenceAttached = Boolean(event.target.files?.length);
  $('fileStatus').textContent = referenceAttached ? `تم اختيار: ${event.target.files[0].name}` : 'لم تُرفق صورة';
  states[activeMode] = normalizeCarState({ ...collectDomState(), referenceAttached });
  resetAcceptance(activeMode);
  render(states[activeMode]);
});

$('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('output').textContent);
  $('copy').textContent = 'تم النسخ';
  setTimeout(() => { $('copy').textContent = 'نسخ'; }, 900);
});

$('acceptanceReportButton').addEventListener('click', () => {
  $('acceptanceReport').textContent = createCarSelfieAcceptanceReport(states[activeMode], acceptanceMarks[activeMode]);
  $('acceptanceReport').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

loadSavedState();
referenceAttached = Boolean(states[activeMode].referenceAttached);
setStep(1);
render(states[activeMode]);