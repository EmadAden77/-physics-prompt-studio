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
    'Control Physics Prompt Studio.',
    'Return exactly ONE JSON object and nothing else.',
    `Allowed fields: ${AI_CONTROL_FIELDS.join(', ')}.`,
    'Allowed actions: set, generate, randomize, reset.',
    'Change only what the user explicitly requests.',
    'For select fields, value may be an exact app value OR a short human label. Put the human wording in label when exact value is unknown.',
    'Do not generate the final image prompt.',
    'Schema:',
    '{"actions":[{"type":"set","field":"sceneType","value":"","label":"سيلفي داخل السيارة"}],"generate":true,"summary":""}',
    `Current state: ${JSON.stringify(context.state)}`
  ].join('\n');
}

async function getControlPlan(command, context) {
  const seed = Number(context.state.seed) || 42;
  const raw = await askLocalQwen([
    { role: 'system', content: controlPrompt(context) },
    { role: 'user', content: command }
  ], { seed });

  try {
    return { plan: parseQwenJson(raw), raw, repaired: false };
  } catch {
    const repairRaw = await askLocalQwen([
      {
        role: 'system',
        content: 'Return exactly ONE valid JSON object only. No markdown, no explanation. Schema: {"actions":[{"type":"set","field":"sceneType","value":"","label":""}],"generate":true,"summary":""}'
      },
      {
        role: 'user',
        content: `User request: ${command}\nConvert this previous reply into the required JSON object: ${raw.slice(0, 1200)}`
      }
    ], { seed });
    return { plan: parseQwenJson(repairRaw), raw: repairRaw, repaired: true };
  }
}

async function runAiCommand() {
  const command = commandInput?.value.trim();
  if (!command || !runButton) return;

  runButton.disabled = true;
  setStatus('Qwen يفكر محليًا…', 'working');
  if (result) result.textContent = '';

  let lastRaw = '';
  try {
    const context = getAppControlContext();
    const response = await getControlPlan(command, context);
    lastRaw = response.raw;
    const plan = response.plan;
    const applied = await applyAiControlPlan(plan);
    const failed = applied.filter((item) => item.applied === false);

    if (result) {
      result.textContent = JSON.stringify({
        summary: plan.summary || '',
        repaired: response.repaired,
        applied,
        rejected: failed
      }, null, 2);
    }

    setStatus(failed.length ? `تم مع ${failed.length} خيار مرفوض` : 'Qwen متصل — تم التنفيذ', failed.length ? 'warning' : 'ready');
  } catch (error) {
    setStatus('Qwen رد بصيغة غير قابلة للتنفيذ', 'error');
    if (result) result.textContent = `ERROR: ${error?.message || error}${lastRaw ? `\n\nRAW:\n${lastRaw.slice(0, 1200)}` : ''}`;
  } finally {
    runButton.disabled = false;
  }
}

runButton?.addEventListener('click', runAiCommand);
commandInput?.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runAiCommand();
});

setStatus(`Local AI: ${LOCAL_QWEN_CONFIG.model}`, 'idle');
