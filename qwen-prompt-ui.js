import { generateQwenImagePrompt, QWEN_PROMPT_ENGINE_CONFIG } from './core/qwen-prompt-engine.js';

const byId = (id) => document.getElementById(id);

const generateButton = byId('qwenGeneratePrompt');
const extraInput = byId('qwenPromptInstructions');
const status = byId('qwenPromptStatus');
const output = byId('promptOutput');
const mainStatus = byId('statusBadge');
const metricOneLabel = byId('metricOneLabel');
const metricOneValue = byId('metricOneValue');
const metricTwoLabel = byId('metricTwoLabel');
const metricTwoValue = byId('metricTwoValue');
const metricThreeLabel = byId('metricThreeLabel');
const metricThreeValue = byId('metricThreeValue');
const copyButton = byId('copyButton');

function selectedRecord(id) {
  const select = byId(id);
  const option = select?.selectedOptions?.[0];
  if (!option) return { value: '', label: '', prompt: '' };
  return {
    value: option.value || '',
    label: option.textContent?.trim() || '',
    prompt: option.dataset?.prompt?.trim() || ''
  };
}

function bestText(record) {
  return record.prompt || record.label || record.value || '';
}

function sceneState() {
  const sceneType = selectedRecord('sceneType');
  const location = selectedRecord('sceneLocation');
  const clothing = selectedRecord('sceneClothing');
  const hair = selectedRecord('hairStyle');
  const pose = selectedRecord('scenePose');
  const angle = selectedRecord('sceneAngle');
  const lighting = selectedRecord('sceneLighting');
  const camera = selectedRecord('cameraProfile');
  const aspectRatio = selectedRecord('aspectRatio');
  const expression = selectedRecord('expression');
  const background = selectedRecord('backgroundActivity');
  const realism = selectedRecord('realismLevel');
  const framing = selectedRecord('framing');

  return {
    sceneType: sceneType.value,
    sceneTypeLabel: sceneType.label,
    location: bestText(location),
    clothing: bestText(clothing),
    hairStyle: bestText(hair),
    pose: bestText(pose),
    angle: bestText(angle),
    lighting: bestText(lighting),
    lightingNotes: byId('lightingNotes')?.value || '',
    camera: bestText(camera),
    aspectRatio: bestText(aspectRatio),
    expression: bestText(expression),
    backgroundActivity: bestText(background),
    realismLevel: bestText(realism),
    framing: bestText(framing),
    cameraDistance: byId('cameraDistance')?.value || '',
    description: byId('sceneDescription')?.value || '',
    customConstraints: byId('customConstraints')?.value || '',
    identityReference: Boolean(byId('identityReference')?.checked)
  };
}

function setQwenStatus(text, state = 'idle') {
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}

function setOutputMetrics(prompt) {
  if (mainStatus) {
    mainStatus.className = 'status ready';
    mainStatus.textContent = 'READY';
  }
  if (metricOneLabel) metricOneLabel.textContent = 'المحرك';
  if (metricOneValue) metricOneValue.textContent = 'QWEN';
  if (metricTwoLabel) metricTwoLabel.textContent = 'الطول';
  if (metricTwoValue) metricTwoValue.textContent = String(prompt.split(/\s+/).filter(Boolean).length);
  if (metricThreeLabel) metricThreeLabel.textContent = 'المصدر';
  if (metricThreeValue) metricThreeValue.textContent = 'LOCAL AI';
  if (copyButton) copyButton.disabled = !prompt;
}

async function generateWithQwen() {
  if (!generateButton) return;
  generateButton.disabled = true;
  setQwenStatus('Qwen يبني Prompt واقعيًا…', 'working');

  try {
    const seed = Number(byId('seedInput')?.value) || 42;
    const prompt = await generateQwenImagePrompt(sceneState(), {
      seed,
      additionalInstructions: extraInput?.value || ''
    });

    if (!prompt) throw new Error('Qwen returned an empty prompt');
    if (output) output.value = prompt;
    setOutputMetrics(prompt);
    setQwenStatus(`Qwen جاهز — ${QWEN_PROMPT_ENGINE_CONFIG.model}`, 'ready');
  } catch (error) {
    setQwenStatus(`فشل Qwen: ${error?.message || error}`, 'error');
  } finally {
    generateButton.disabled = false;
  }
}

generateButton?.addEventListener('click', generateWithQwen);
setQwenStatus(`Qwen Prompt Engine — ${QWEN_PROMPT_ENGINE_CONFIG.model}`, 'idle');
