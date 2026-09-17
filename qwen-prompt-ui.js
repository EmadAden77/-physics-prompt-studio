import { generateQwenImagePrompt, QWEN_PROMPT_ENGINE_CONFIG } from './core/qwen-prompt-engine.js';
import { resolveCameraAngle } from './core/camera-angle-resolver.js';
import { SCENE_TYPES } from './core/prompt-generator.js';
import { baseSceneTypeFor } from './core/scene-type-expansion.js';

const byId = (id) => document.getElementById(id);

const generateButton = byId('qwenGeneratePrompt');
const extraInput = byId('qwenPromptInstructions');
const status = byId('qwenPromptStatus');

function ensureQwenOutputUi() {
  const existingOutput = byId('qwenPromptOutput');
  if (existingOutput) {
    return {
      output: existingOutput,
      copyButton: byId('qwenCopyPrompt')
    };
  }

  const section = byId('qwenPromptEngineTitle')?.closest('section');
  if (!section) return { output: null, copyButton: null };

  const wrapper = document.createElement('div');
  wrapper.className = 'advanced-grid';
  wrapper.style.marginTop = '1rem';

  const label = document.createElement('label');
  label.className = 'field span-2';

  const title = document.createElement('span');
  title.textContent = 'Prompt الناتج من Qwen';

  const output = document.createElement('textarea');
  output.id = 'qwenPromptOutput';
  output.className = 'prompt-output';
  output.rows = 18;
  output.readOnly = true;
  output.placeholder = 'سيظهر هنا Prompt الذي يولده Qwen، مستقلًا عن نتيجة Physics Engine.';

  label.append(title, output);
  wrapper.append(label);

  const actions = document.createElement('div');
  actions.className = 'actions result-actions';

  const copyButton = document.createElement('button');
  copyButton.id = 'qwenCopyPrompt';
  copyButton.className = 'secondary';
  copyButton.type = 'button';
  copyButton.disabled = true;
  copyButton.textContent = 'نسخ Qwen Prompt';

  actions.append(copyButton);
  section.append(wrapper, actions);

  return { output, copyButton };
}

const qwenUi = ensureQwenOutputUi();
const output = qwenUi.output;
const copyButton = qwenUi.copyButton;

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

function captureTypeForScene(sceneTypeValue) {
  const baseType = baseSceneTypeFor(sceneTypeValue || 'front_selfie') || sceneTypeValue || 'front_selfie';
  return SCENE_TYPES.find((item) => item.value === baseType)?.capture
    || SCENE_TYPES.find((item) => item.value === sceneTypeValue)?.capture
    || '';
}

function sceneState(seed = 42) {
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
  const captureType = captureTypeForScene(sceneType.value);
  const baseSceneType = baseSceneTypeFor(sceneType.value || 'front_selfie') || sceneType.value || 'front_selfie';
  const resolvedAngle = resolveCameraAngle({
    sceneType: baseSceneType,
    requestedSceneType: sceneType.value,
    captureType,
    pose: pose.value || bestText(pose),
    angle: angle.value || bestText(angle),
    seed
  });

  return {
    sceneType: sceneType.value,
    sceneTypeLabel: sceneType.label,
    captureType,
    location: bestText(location),
    clothing: bestText(clothing),
    clothingLabel: clothing.label,
    hairStyle: bestText(hair),
    pose: bestText(pose),
    angle: resolvedAngle || bestText(angle),
    angleMode: angle.value,
    lighting: bestText(lighting),
    lightingNotes: byId('lightingNotes')?.value || '',
    camera: bestText(camera),
    cameraLabel: camera.label,
    aspectRatio: bestText(aspectRatio),
    expression: bestText(expression),
    backgroundActivity: bestText(background),
    realismLevel: bestText(realism),
    framing: bestText(framing),
    framingLabel: framing.label,
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

async function copyQwenPrompt() {
  const text = output?.value || '';
  if (!text) return;
  await navigator.clipboard.writeText(text);
  if (!copyButton) return;
  const previous = copyButton.textContent;
  copyButton.textContent = 'تم النسخ ✓';
  setTimeout(() => { copyButton.textContent = previous; }, 1300);
}

function handleQwenPhase(phase, details = []) {
  if (phase === 'generating') {
    setQwenStatus('Qwen يولد الآن…', 'working');
    return;
  }
  if (phase === 'repairing') {
    setQwenStatus(`Qwen يراجع الواقعية… ${details.length ? `(${details.length})` : ''}`, 'working');
    return;
  }
  if (phase === 'anchoring') {
    setQwenStatus('Qwen يثبت القيود الصريحة…', 'working');
    return;
  }
  if (phase === 'complete') {
    setQwenStatus(`Qwen جاهز — ${QWEN_PROMPT_ENGINE_CONFIG.model}`, 'ready');
  }
}

async function generateWithQwen() {
  if (!generateButton) return;
  generateButton.disabled = true;
  if (copyButton) copyButton.disabled = true;
  if (output) output.value = '';
  setQwenStatus('Qwen يبدأ التوليد…', 'working');

  try {
    const seed = Number(byId('seedInput')?.value) || 42;
    const prompt = await generateQwenImagePrompt(sceneState(seed), {
      seed,
      additionalInstructions: extraInput?.value || '',
      onPhase: handleQwenPhase,
      onProgress: (text) => {
        if (!output) return;
        output.value = text;
        output.scrollTop = output.scrollHeight;
      }
    });

    if (!prompt) throw new Error('Qwen returned an empty prompt');
    if (output) output.value = prompt;
    if (copyButton) copyButton.disabled = false;
    setQwenStatus(`Qwen جاهز — ${QWEN_PROMPT_ENGINE_CONFIG.model}`, 'ready');
  } catch (error) {
    setQwenStatus(`فشل Qwen: ${error?.message || error}`, 'error');
  } finally {
    generateButton.disabled = false;
  }
}

generateButton?.addEventListener('click', generateWithQwen);
copyButton?.addEventListener('click', copyQwenPrompt);
setQwenStatus(`Qwen Prompt Engine — ${QWEN_PROMPT_ENGINE_CONFIG.model}`, 'idle');
