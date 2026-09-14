import {
  CAR_CATALOG,
  CAR_DEFAULT_STATE,
  analyzeCarSelfieIntent,
  getCameraOptic,
  isCarOptionCompatible
} from './data/carSelfieCatalog.js';
import { normalizeCarState, carValidationStatus } from './core/carSelfieValidation.js';
import {
  compileCarSelfieDetailed,
  compileCarSelfieConcise,
  compileCarSelfieJson,
  compileCarSelfieNegative
} from './core/carSelfieCompiler.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'physics-prompt-studio-car-selfie-v2';
let activeView = 'detailed';
let referenceAttached = false;

function value(id) {
  return $(id)?.value ?? '';
}

function fill(field, state, preserve = true) {
  const select = $(field);
  if (!select) return;
  const current = select.value;
  const options = CAR_CATALOG[field] || [];
  select.replaceChildren(...options.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    const compatible = isCarOptionCompatible(field, item.id, state);
    option.disabled = !compatible;
    option.hidden = !compatible;
    return option;
  }));

  if (preserve && options.some((item) => item.id === current && isCarOptionCompatible(field, item.id, state))) {
    select.value = current;
  } else {
    const requested = state[field];
    if (options.some((item) => item.id === requested && isCarOptionCompatible(field, item.id, state))) {
      select.value = requested;
    } else {
      const first = options.find((item) => isCarOptionCompatible(field, item.id, state));
      if (first) select.value = first.id;
    }
  }
}

function populate(state) {
  for (const field of Object.keys(CAR_CATALOG)) fill(field, state, false);
}

function readState() {
  return normalizeCarState({
    initialRequest: value('initialRequest'),
    referenceAttached,
    referenceRole: value('referenceRole'),
    vehicleProfile: value('vehicleProfile'),
    vehicleState: value('vehicleState'),
    seat: value('seat'),
    captureMode: value('captureMode'),
    cameraLens: value('cameraLens'),
    colorProfile: value('colorProfile'),
    lowLightProcessing: value('lowLightProcessing'),
    time: value('time'),
    place: value('place'),
    weather: value('weather'),
    physicsMode: value('physicsMode'),
    apparentAge: value('apparentAge'),
    expression: value('expression'),
    clothing: value('clothing'),
    hairProfile: value('hairProfile'),
    handPose: value('handPose'),
    framing: value('framing'),
    distance: value('distance'),
    yaw: value('yaw'),
    pitch: value('pitch'),
    roll: value('roll'),
    cabinMaterial: value('cabinMaterial'),
    clusterType: value('clusterType'),
    roofType: value('roofType'),
    windowState: value('windowState'),
    clutterLevel: value('clutterLevel'),
    externalLight: value('externalLight'),
    cabinEmitter: value('cabinEmitter'),
    exposure: value('exposure'),
    hdr: value('hdr'),
    whiteBalance: value('whiteBalance'),
    notes: value('notes')
  });
}

function refilter(state) {
  for (const field of [
    'captureMode',
    'cameraLens',
    'colorProfile',
    'lowLightProcessing',
    'handPose',
    'place',
    'weather',
    'externalLight',
    'cabinEmitter'
  ]) {
    fill(field, state, true);
    state = readState();
  }
  return state;
}

function syncCameraHardware(state) {
  const optic = getCameraOptic(state.cameraLens);
  if (!optic) return;
  $('focalLength').value = String(optic.focalLengthEqMm);
  $('aperture').value = String(optic.aperture);
}

function setState(input) {
  const state = normalizeCarState(input);
  populate(state);
  for (const [key, val] of Object.entries(state)) {
    if ($(key) && key !== 'referenceAttached' && key !== 'focalLength' && key !== 'aperture') $(key).value = val;
  }
  referenceAttached = state.referenceAttached;
  const filtered = refilter(readState());
  syncCameraHardware(filtered);
  render();
}

function outputFor(state) {
  if (activeView === 'concise') return compileCarSelfieConcise(state);
  if (activeView === 'json') return compileCarSelfieJson(state);
  if (activeView === 'negative') return compileCarSelfieNegative();
  return compileCarSelfieDetailed(state);
}

function render() {
  let state = readState();
  state = refilter(state);
  state = readState();
  syncCameraHardware(state);

  const status = carValidationStatus(state);
  $('output').textContent = outputFor(state);
  $('issueCount').textContent = String(status.issues.length);
  $('liveState').textContent = status.blocked ? 'BLOCKED' : status.issues.length ? 'CHECK' : 'VALID';
  $('liveState').dataset.state = status.blocked ? 'blocked' : status.issues.length ? 'check' : 'valid';

  const list = status.issues.length
    ? status.issues
    : [{ severity: 'ok', code: 'OK', message: 'التركيبة متناسقة مع قواعد Xiaomi 15 Ultra وفيزياء المقصورة الحالية.' }];

  $('issues').replaceChildren(...list.map((item) => {
    const li = document.createElement('li');
    li.className = item.severity;
    li.textContent = `${item.code}: ${item.message}`;
    return li;
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyIntent() {
  const request = value('initialRequest');
  const analysis = analyzeCarSelfieIntent(request);
  setState({
    ...analysis.recommended,
    initialRequest: request,
    referenceAttached,
    referenceRole: value('referenceRole') || 'identity-only',
    notes: value('notes')
  });
  $('intentSummary').textContent = analysis.tags.length
    ? `تم: ${analysis.tags.join(' · ')}`
    : 'لم يجد كلمات حاسمة؛ طُبقت الحالة الافتراضية الحتمية.';
}

$('carForm').addEventListener('change', render);
$('carForm').addEventListener('input', render);
$('analyzeIntent').addEventListener('click', applyIntent);

$('referenceImage').addEventListener('change', (event) => {
  referenceAttached = Boolean(event.target.files?.length);
  $('fileStatus').textContent = referenceAttached ? `تم اختيار: ${event.target.files[0].name}` : 'لم تُرفق صورة';
  render();
});

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
  activeView = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item === button));
  render();
}));

$('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('output').textContent);
  $('copy').textContent = 'تم النسخ';
  setTimeout(() => { $('copy').textContent = 'نسخ'; }, 900);
});

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  setState(saved || CAR_DEFAULT_STATE);
} catch {
  setState(CAR_DEFAULT_STATE);
}
