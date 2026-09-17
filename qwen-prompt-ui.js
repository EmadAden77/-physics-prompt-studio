import { generateQwenImagePrompt, QWEN_PROMPT_ENGINE_CONFIG } from './core/qwen-prompt-engine.js';

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

async function copyQwenPrompt() {
  const text = output?.value || '';
  if (!text) return;
  await navigator.clipboard.writeText(text);
  if (!copyButton) return;
  const previous = copyButton.textContent;
  copyButton.textContent = 'تم النسخ ✓';
  setTimeout(() => { copyButton.textContent = previous; }, 1300);
}

async function generateWithQwen() {
  if (!generateButton) return;
  generateButton.disabled = true;
  if (copyButton) copyButton.disabled = true;
  setQwenStatus('Qwen يبني Prompt واقعيًا…', 'working');

  try {
    const seed = Number(byId('seedInput')?.value) || 42;
    const prompt = await generateQwenImagePrompt(sceneState(), {
      seed,
      additionalInstructions: extraInput?.value || ''
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
