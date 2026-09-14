import { compilePrompt, createLedger } from './core/prompt-optimizer.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from './core/scene-builder.js';
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

const $ = (id) => document.getElementById(id);
const controls = {
  sceneType: $('sceneType'), location: $('sceneLocation'), clothing: $('sceneClothing'), pose: $('scenePose'), angle: $('sceneAngle'),
  lighting: $('sceneLighting'), lightingNotes: $('lightingNotes'), camera: $('cameraProfile'), aspectRatio: $('aspectRatio'),
  expression: $('expression'), backgroundActivity: $('backgroundActivity'), realismLevel: $('realismLevel'), framing: $('framing'),
  cameraDistance: $('cameraDistance'), description: $('sceneDescription'), customConstraints: $('customConstraints'), identityReference: $('identityReference')
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

let currentMode = 'auto';
let latestResult = null;
let generateTimer = null;

function populateGrouped(select, options) {
  const groups = new Map();
  for (const item of options) {
    const group = item.group || 'خيارات';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  for (const [label, items] of groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;
    for (const item of items) optgroup.append(makeOption(item));
    select.append(optgroup);
  }
}

function populateFlat(select, options) {
  for (const item of options) select.append(makeOption(item));
}

function makeOption(item) {
  const option = document.createElement('option');
  option.value = item.value;
  option.textContent = item.label;
  option.dataset.prompt = item.prompt || '';
  return option;
}

populateGrouped(controls.location, SAUDI_LOCATIONS);
populateGrouped(controls.clothing, CLOTHING_OPTIONS);
populateFlat(controls.pose, SELFIE_POSES);
populateFlat(controls.angle, SELFIE_ANGLES);
populateGrouped(controls.lighting, LIGHTING_PROFILES);
populateFlat(controls.sceneType, SCENE_TYPES);
populateFlat(controls.camera, CAMERA_PROFILES);
populateFlat(controls.aspectRatio, ASPECT_RATIOS);
populateFlat(controls.expression, EXPRESSIONS);
populateFlat(controls.backgroundActivity, BACKGROUND_ACTIVITY);
populateFlat(controls.realismLevel, REALISM_LEVELS);
populateFlat(controls.framing, FRAMING_OPTIONS);

controls.sceneType.value = 'front_selfie';
controls.camera.value = 'xiaomi15_front';
controls.aspectRatio.value = '9:16';
controls.expression.value = 'neutral';
controls.backgroundActivity.value = 'normal';
controls.realismLevel.value = 'strict';
controls.framing.value = 'chest_up';

function selectedPrompt(select) {
  return select.selectedOptions[0]?.dataset.prompt || '';
}

function autoInput() {
  return {
    sceneType: controls.sceneType.value,
    camera: controls.camera.value,
    aspectRatio: controls.aspectRatio.value,
    expression: controls.expression.value,
    backgroundActivity: controls.backgroundActivity.value,
    realismLevel: controls.realismLevel.value,
    framing: controls.framing.value,
    location: selectedPrompt(controls.location),
    clothing: selectedPrompt(controls.clothing),
    pose: selectedPrompt(controls.pose),
    angle: selectedPrompt(controls.angle),
    lighting: selectedPrompt(controls.lighting),
    lightingNotes: controls.lightingNotes.value,
    cameraDistance: controls.cameraDistance.value,
    description: controls.description.value,
    customConstraints: controls.customConstraints.value,
    identityReference: controls.identityReference.checked
  };
}

function sceneForOptimizer() {
  return {
    location: selectedPrompt(controls.location),
    clothing: selectedPrompt(controls.clothing),
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
  detailsOutput.textContent = JSON.stringify({ config: result.config, validation: result.validation }, null, 2);
  packetOutput.textContent = JSON.stringify(result, null, 2);
  setStatus(result.validation.valid ? 'ready' : 'invalid');
  setMetrics(['الوضع', 'AUTO'], ['الأقسام', String(result.sections.length)], ['التحقق', result.validation.valid ? 'PASS' : 'FAIL']);
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

function randomOption(select) {
  const options = [...select.options].filter((option) => option.value);
  if (!options.length) return;
  select.value = options[Math.floor(Math.random() * options.length)].value;
}

function randomize() {
  [controls.location, controls.clothing, controls.pose, controls.angle, controls.lighting, controls.expression, controls.backgroundActivity, controls.framing].forEach(randomOption);
  generateNow();
}

function resetAll() {
  controls.sceneType.value = 'front_selfie';
  controls.location.value = '';
  controls.clothing.value = '';
  controls.pose.value = '';
  controls.angle.value = '';
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

copyButton.addEventListener('click', copyPrompt);
txtButton.addEventListener('click', () => download('physics-prompt-studio.txt', output.value, 'text/plain;charset=utf-8'));
jsonButton.addEventListener('click', () => latestResult && download('physics-prompt-studio.json', JSON.stringify(latestResult.data, null, 2), 'application/json;charset=utf-8'));
generateButton.addEventListener('click', generateNow);
optimizeButton.addEventListener('click', optimizeNow);
randomButton.addEventListener('click', randomize);
resetButton.addEventListener('click', resetAll);
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === button.dataset.tab));
}));
Object.values(controls).forEach((control) => {
  if (!control) return;
  control.addEventListener('change', scheduleGenerate);
  control.addEventListener('input', scheduleGenerate);
});
sourcePrompt.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') optimizeNow();
});

setMode('auto');
