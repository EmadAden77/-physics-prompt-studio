import { compilePrompt, createLedger } from './core/prompt-optimizer.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from './core/scene-builder.js';

const sourcePrompt = document.getElementById('sourcePrompt');
const surface = document.getElementById('surface');
const compileButton = document.getElementById('compileButton');
const clearButton = document.getElementById('clearButton');
const copyButton = document.getElementById('copyButton');
const downloadButton = document.getElementById('downloadButton');
const compiledOutput = document.getElementById('compiledOutput');
const packetOutput = document.getElementById('packetOutput');
const ledgerOutput = document.getElementById('ledgerOutput');
const statusBadge = document.getElementById('statusBadge');
const constraintCount = document.getElementById('constraintCount');
const warningCount = document.getElementById('warningCount');
const surfaceValue = document.getElementById('surfaceValue');
const sceneLocation = document.getElementById('sceneLocation');
const sceneClothing = document.getElementById('sceneClothing');
const scenePose = document.getElementById('scenePose');
const sceneAngle = document.getElementById('sceneAngle');
const sceneLighting = document.getElementById('sceneLighting');
const lightingNotes = document.getElementById('lightingNotes');

let latestPacket = null;

function populateSelect(select, options) {
  const grouped = new Map();
  for (const item of options) {
    const group = item.group || 'خيارات';
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(item);
  }
  for (const [group, items] of grouped) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group;
    for (const item of items) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      option.dataset.prompt = item.prompt;
      optgroup.append(option);
    }
    select.append(optgroup);
  }
}

function populateFlatSelect(select, options) {
  for (const item of options) {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    option.dataset.prompt = item.prompt;
    select.append(option);
  }
}

populateSelect(sceneLocation, SAUDI_LOCATIONS);
populateSelect(sceneClothing, CLOTHING_OPTIONS);
populateFlatSelect(scenePose, SELFIE_POSES);
populateFlatSelect(sceneAngle, SELFIE_ANGLES);
populateSelect(sceneLighting, LIGHTING_PROFILES);

function selectedPrompt(select) {
  return select.selectedOptions[0]?.dataset.prompt || '';
}

function buildScene() {
  return {
    location: selectedPrompt(sceneLocation),
    clothing: selectedPrompt(sceneClothing),
    pose: selectedPrompt(scenePose),
    angle: selectedPrompt(sceneAngle),
    lighting: selectedPrompt(sceneLighting),
    lighting_notes: lightingNotes.value.trim()
  };
}

function setStatus(status) {
  statusBadge.className = `status ${status}`;
  statusBadge.textContent = status.toUpperCase();
}

function render(packet) {
  latestPacket = packet;
  const ledger = createLedger(packet);
  compiledOutput.value = packet.compiled_prompt.text;
  packetOutput.textContent = JSON.stringify(packet, null, 2);
  ledgerOutput.textContent = JSON.stringify(ledger, null, 2);
  constraintCount.textContent = String(packet.constraint_map.length);
  warningCount.textContent = String(packet.validation.warnings.length);
  surfaceValue.textContent = packet.target_surface;
  setStatus(packet.status);
  copyButton.disabled = !packet.compiled_prompt.text;
  downloadButton.disabled = false;
}

function compile() {
  const prompt = sourcePrompt.value;
  if (!prompt.trim()) {
    latestPacket = null;
    compiledOutput.value = '';
    packetOutput.textContent = 'أدخل Prompt أولاً.';
    ledgerOutput.textContent = 'أدخل Prompt أولاً.';
    constraintCount.textContent = '0';
    warningCount.textContent = '0';
    surfaceValue.textContent = '—';
    setStatus('invalid');
    copyButton.disabled = true;
    downloadButton.disabled = true;
    sourcePrompt.focus();
    return;
  }
  render(compilePrompt(prompt, { surface: surface.value, scene: buildScene() }));
}

function reset() {
  sourcePrompt.value = '';
  surface.value = 'unknown';
  sceneLocation.value = '';
  sceneClothing.value = '';
  scenePose.value = '';
  sceneAngle.value = '';
  sceneLighting.value = '';
  lightingNotes.value = '';
  compiledOutput.value = '';
  packetOutput.textContent = 'لا توجد نتيجة بعد.';
  ledgerOutput.textContent = 'لا توجد نتيجة بعد.';
  constraintCount.textContent = '0';
  warningCount.textContent = '0';
  surfaceValue.textContent = '—';
  latestPacket = null;
  setStatus('idle');
  copyButton.disabled = true;
  downloadButton.disabled = true;
  sourcePrompt.focus();
}

async function copyCompiled() {
  if (!latestPacket?.compiled_prompt.text) return;
  await navigator.clipboard.writeText(latestPacket.compiled_prompt.text);
  const original = copyButton.textContent;
  copyButton.textContent = 'تم النسخ ✓';
  setTimeout(() => { copyButton.textContent = original; }, 1400);
}

function downloadPacket() {
  if (!latestPacket) return;
  const blob = new Blob([JSON.stringify(latestPacket, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'prompt-optimizer-packet.json';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function switchTab(button) {
  const target = button.dataset.tab;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === target));
}

compileButton.addEventListener('click', compile);
clearButton.addEventListener('click', reset);
copyButton.addEventListener('click', copyCompiled);
downloadButton.addEventListener('click', downloadPacket);
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => switchTab(tab)));
sourcePrompt.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') compile();
});
