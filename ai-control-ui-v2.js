import { askLocalQwen, parseQwenJson, LOCAL_QWEN_CONFIG } from './core/ai-bridge.js';
import { AI_CONTROL_FIELDS, applyAiControlPlan, getAppControlContext } from './core/app-controller.js';

const commandInput = document.getElementById('aiCommand');
const runButton = document.getElementById('aiRunButton');
const status = document.getElementById('aiConnectionStatus');
const result = document.getElementById('aiControlResult');

const DIRECT_ACTIONS = new Set(['generate', 'randomize', 'reset']);

function setStatus(text, state = 'idle') {
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}

function controlPrompt(context) {
  return [
    'Control Physics Prompt Studio by returning a small action plan.',
    'Return exactly ONE JSON object and nothing else.',
    `Allowed fields: ${AI_CONTROL_FIELDS.join(', ')}.`,
    'Allowed action types inside actions: set, generate, randomize, reset.',
    'IMPORTANT: each requested concept must be a separate atomic field change.',
    'Never combine scene type, time, lighting, angle, clothing, pose, or other concepts into one invented value.',
    'Example: "سيلفي داخل السيارة بالليل والزاوية ذكية" means separate sceneType, lighting, and angle actions.',
    'For select fields, prefer value:"" plus a short human label unless you know the exact app value. Never invent an internal value.',
    'If the user says not to change something, emit NO action for that field. Example: "لا تغير الهوية" means no identityReference action.',
    'generate and summary are TOP-LEVEL keys only; never place them as objects inside actions.',
    'Do not generate the final image prompt. Change app state only.',
    'Required shape:',
    '{"actions":[{"type":"set","field":"sceneType","value":"","label":"سيلفي داخل السيارة"},{"type":"set","field":"lighting","value":"","label":"ليل"},{"type":"set","field":"angle","value":"smart","label":"ذكي"}],"generate":true,"summary":""}',
    `Current state: ${JSON.stringify(context.state)}`
  ].join('\n');
}

function normalizePlan(rawPlan) {
  const root = Array.isArray(rawPlan)
    ? { actions: rawPlan }
    : (rawPlan && typeof rawPlan === 'object' ? rawPlan : {});

  const sourceActions = Array.isArray(root.actions) ? root.actions : [];
  const actions = [];
  let generate = root.generate === true;
  let summary = typeof root.summary === 'string' ? root.summary : '';

  for (const source of sourceActions) {
    if (!source || typeof source !== 'object') continue;

    let action = source;
    if (!action.type) {
      if (action.generate === true) generate = true;
      if (!summary && typeof action.summary === 'string') summary = action.summary;
      if (AI_CONTROL_FIELDS.includes(action.field)) {
        action = { ...action, type: 'set' };
      } else {
        continue;
      }
    }

    if (action.type === 'set') {
      if (!AI_CONTROL_FIELDS.includes(action.field)) continue;
      const valueType = typeof action.value;
      const value = ['string', 'number', 'boolean'].includes(valueType) ? action.value : '';
      const label = typeof action.label === 'string' ? action.label : '';
      actions.push({ type: 'set', field: action.field, value, label });
      continue;
    }

    if (DIRECT_ACTIONS.has(action.type)) {
      actions.push({ type: action.type });
    }
  }

  return { actions, generate, summary };
}

function parseOrThrow(raw, stage) {
  try {
    return normalizePlan(parseQwenJson(raw));
  } catch (error) {
    const wrapped = new Error(`${stage}: ${error?.message || error}`);
    wrapped.raw = raw;
    throw wrapped;
  }
}

async function getControlPlan(command, context) {
  const seed = Number(context.state.seed) || 42;
  const raw = await askLocalQwen([
    { role: 'system', content: controlPrompt(context) },
    { role: 'user', content: command }
  ], { seed });

  try {
    return { plan: normalizePlan(parseQwenJson(raw)), raw, repaired: false };
  } catch {
    const repairRaw = await askLocalQwen([
      {
        role: 'system',
        content: [
          'Repair the previous reply into exactly ONE valid JSON object only.',
          'No markdown and no explanation.',
          'Keep each concept as a separate set action.',
          'Never invent combined values such as sceneType-with-time.',
          'generate and summary must be top-level keys.',
          'Shape: {"actions":[{"type":"set","field":"sceneType","value":"","label":"سيلفي داخل السيارة"}],"generate":true,"summary":""}'
        ].join(' ')
      },
      {
        role: 'user',
        content: `User request: ${command}\nPrevious reply: ${raw.slice(0, 1200)}`
      }
    ], { seed });

    return { plan: parseOrThrow(repairRaw, 'repair parse failed'), raw: repairRaw, repaired: true };
  }
}

async function runAiCommand() {
  const command = commandInput?.value.trim();
  if (!command || !runButton) return;

  runButton.disabled = true;
  setStatus('Qwen يفكر محليًا…', 'working');
  if (result) result.textContent = '';

  try {
    const context = getAppControlContext();
    const response = await getControlPlan(command, context);
    const plan = response.plan;
    const applied = await applyAiControlPlan(plan);
    const failed = applied.filter((item) => item.applied === false);

    if (result) {
      result.textContent = JSON.stringify({
        summary: plan.summary || '',
        repaired: response.repaired,
        plan,
        applied,
        rejected: failed
      }, null, 2);
    }

    setStatus(failed.length ? `تم مع ${failed.length} خيار مرفوض` : 'Qwen متصل — تم التنفيذ', failed.length ? 'warning' : 'ready');
  } catch (error) {
    setStatus('Qwen رد بصيغة غير قابلة للتنفيذ', 'error');
    const raw = typeof error?.raw === 'string' ? error.raw : '';
    if (result) result.textContent = `ERROR: ${error?.message || error}${raw ? `\n\nRAW:\n${raw.slice(0, 1600)}` : ''}`;
  } finally {
    runButton.disabled = false;
  }
}

runButton?.addEventListener('click', runAiCommand);
commandInput?.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') runAiCommand();
});

setStatus(`Local AI: ${LOCAL_QWEN_CONFIG.model}`, 'idle');
