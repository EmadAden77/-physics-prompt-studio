import { askLocalQwen, parseQwenJson, LOCAL_QWEN_CONFIG } from './core/ai-bridge.js';
import { AI_CONTROL_FIELDS, applyAiControlPlan, getAppControlContext } from './core/app-controller.js';

const commandInput = document.getElementById('aiCommand');
const runButton = document.getElementById('aiRunButton');
const status = document.getElementById('aiConnectionStatus');
const result = document.getElementById('aiControlResult');

function setStatus(text, state = 'idle') {
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}

function controlPrompt(context) {
  return [
    'You are the local controller for Physics Prompt Studio.',
    'Return JSON only. Never return JavaScript, HTML, markdown or explanations.',
    'Your job is to translate the user request into safe application control actions.',
    `Allowed fields: ${AI_CONTROL_FIELDS.join(', ')}.`,
    'Allowed action types: set, generate, randomize, reset.',
    'Use exact option values from allowedOptions when possible.',
    'If an exact value is unknown, include a short label that matches the visible option text after sceneType changes.',
    'Do not invent fields or option values.',
    'Preserve fields the user did not ask to change.',
    'Prefer changing sceneType first when the requested scene requires it.',
    'Do not write the final image prompt yourself. The existing Physics Prompt Studio engine remains authoritative.',
    'Output schema:',
    '{"actions":[{"type":"set","field":"sceneType","value":"front_selfie","label":""}],"generate":true,"summary":"short Arabic summary"}',
    `Current state: ${JSON.stringify(context.state)}`,
    `Currently visible allowed options: ${JSON.stringify(context.allowed)}`
  ].join('\n');
}

async function runAiCommand() {
  const command = commandInput?.value.trim();
  if (!command || !runButton) return;

  runButton.disabled = true;
  setStatus('Qwen يفكر محليًا…', 'working');
  if (result) result.textContent = '';

  try {
    const context = getAppControlContext();
    const raw = await askLocalQwen([
      { role: 'system', content: controlPrompt(context) },
      { role: 'user', content: command }
    ], { seed: Number(context.state.seed) || 42 });

    const plan = parseQwenJson(raw);
    const applied = await applyAiControlPlan(plan);
    const failed = applied.filter((item) => item.applied === false);

    if (result) {
      result.textContent = JSON.stringify({
        summary: plan.summary || '',
        applied,
        rejected: failed
      }, null, 2);
    }

    setStatus(failed.length ? `تم مع ${failed.length} خيار مرفوض` : 'Qwen متصل — تم التنفيذ', failed.length ? 'warning' : 'ready');
  } catch (error) {
    setStatus('Qwen غير متصل', 'error');
    if (result) result.textContent = `ERROR: ${error?.message || error}`;
  } finally {
    runButton.disabled = false;
  }
}

runButton?.addEventListener('click', runAiCommand);
commandInput?.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runAiCommand();
});

setStatus(`Local AI: ${LOCAL_QWEN_CONFIG.model}`, 'idle');
