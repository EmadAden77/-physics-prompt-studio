const FIELD_IDS = Object.freeze({
  sceneType: 'sceneType',
  location: 'sceneLocation',
  clothing: 'sceneClothing',
  hairStyle: 'hairStyle',
  pose: 'scenePose',
  angle: 'sceneAngle',
  lighting: 'sceneLighting',
  lightingNotes: 'lightingNotes',
  camera: 'cameraProfile',
  aspectRatio: 'aspectRatio',
  expression: 'expression',
  backgroundActivity: 'backgroundActivity',
  realismLevel: 'realismLevel',
  framing: 'framing',
  cameraDistance: 'cameraDistance',
  description: 'sceneDescription',
  customConstraints: 'customConstraints',
  identityReference: 'identityReference',
  seed: 'seedInput'
});

const BUTTON_IDS = Object.freeze({
  generate: 'generateButton',
  randomize: 'randomButton',
  reset: 'resetButton'
});

function el(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function optionRecords(select) {
  if (!select?.options) return [];
  return [...select.options]
    .filter((option) => !option.hidden)
    .filter((option) => {
      const group = option.parentElement?.tagName === 'OPTGROUP' ? option.parentElement : null;
      return !group?.hidden;
    })
    .map((option) => ({
      value: option.value,
      label: option.textContent?.trim() || '',
      prompt: option.dataset?.prompt || ''
    }));
}

function resolveSelectValue(select, requestedValue, requestedLabel = '') {
  const options = optionRecords(select);
  const exactValue = options.find((item) => item.value === requestedValue);
  if (exactValue) return exactValue.value;

  const needle = normalize(requestedLabel || requestedValue);
  if (!needle) return null;

  const exactLabel = options.find((item) => normalize(item.label) === needle);
  if (exactLabel) return exactLabel.value;

  const partial = options.find((item) => {
    const haystack = normalize(`${item.value} ${item.label} ${item.prompt}`);
    return haystack.includes(needle) || needle.includes(normalize(item.label));
  });
  return partial?.value ?? null;
}

function dispatchControl(control) {
  control.dispatchEvent(new Event('change', { bubbles: true }));
  if (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA') {
    control.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function getAppControlContext() {
  const state = {};
  const allowed = {};

  for (const [field, id] of Object.entries(FIELD_IDS)) {
    const control = el(id);
    if (!control) continue;
    state[field] = control.type === 'checkbox' ? control.checked : control.value;
    if (control.tagName === 'SELECT') {
      allowed[field] = optionRecords(control).map(({ value, label }) => ({ value, label }));
    }
  }

  return Object.freeze({ state, allowed });
}

async function setField(field, value, label = '') {
  const id = FIELD_IDS[field];
  const control = id ? el(id) : null;
  if (!control) return { field, applied: false, reason: 'unknown_field' };

  if (control.tagName === 'SELECT') {
    const resolved = resolveSelectValue(control, String(value ?? ''), label);
    if (resolved === null) return { field, applied: false, reason: 'invalid_option' };
    control.value = resolved;
  } else if (control.type === 'checkbox') {
    control.checked = Boolean(value);
  } else if (control.type === 'number') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return { field, applied: false, reason: 'invalid_number' };
    control.value = String(Math.trunc(numeric));
  } else {
    control.value = String(value ?? '').slice(0, 4000);
  }

  dispatchControl(control);
  if (field === 'sceneType') await Promise.resolve();
  return { field, applied: true, value: control.type === 'checkbox' ? control.checked : control.value };
}

export async function applyAiControlPlan(plan = {}) {
  const actions = Array.isArray(plan.actions) ? plan.actions : [];
  const results = [];

  const sceneActions = actions.filter((action) => action?.type === 'set' && action.field === 'sceneType');
  const otherActions = actions.filter((action) => !(action?.type === 'set' && action.field === 'sceneType'));

  for (const action of [...sceneActions, ...otherActions]) {
    if (!action || typeof action !== 'object') continue;

    if (action.type === 'set') {
      results.push(await setField(action.field, action.value, action.label));
      continue;
    }

    if (action.type === 'generate' || action.type === 'randomize' || action.type === 'reset') {
      el(BUTTON_IDS[action.type])?.click();
      results.push({ action: action.type, applied: true });
    }
  }

  if (plan.generate === true && !actions.some((action) => action?.type === 'generate')) {
    el(BUTTON_IDS.generate)?.click();
    results.push({ action: 'generate', applied: true });
  }

  return Object.freeze(results);
}

export const AI_CONTROL_FIELDS = Object.freeze(Object.keys(FIELD_IDS));
