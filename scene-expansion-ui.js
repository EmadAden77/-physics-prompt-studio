import { EXTRA_SCENE_TYPES, sceneMeta, narrowOptions } from './core/scene-type-expansion.js';
import { buildAutomaticSceneDescription } from './core/automatic-scene-description.js';

const $ = (id) => document.getElementById(id);
const controls = {
  sceneType: $('sceneType'),
  location: $('sceneLocation'),
  clothing: $('sceneClothing'),
  pose: $('scenePose'),
  angle: $('sceneAngle'),
  lighting: $('sceneLighting'),
  lightingNotes: $('lightingNotes'),
  hiddenDescription: $('sceneDescription'),
  reset: $('resetButton')
};

function appendExpandedSceneTypes() {
  const groups = new Map();
  for (const item of EXTRA_SCENE_TYPES) {
    const group = item.group || 'مشاهد إضافية';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item);
  }
  for (const [group, items] of groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group;
    for (const item of items) {
      const option = document.createElement('option');
      option.value = item.baseType;
      option.textContent = item.label;
      option.dataset.smartSceneType = item.value;
      option.dataset.prompt = item.prompt;
      optgroup.append(option);
    }
    controls.sceneType.append(optgroup);
  }
}

function selectedSceneKey() {
  return controls.sceneType.selectedOptions[0]?.dataset.smartSceneType || controls.sceneType.value || 'front_selfie';
}

function optionRecords(select) {
  return [...select.options]
    .filter((option) => option.value)
    .map((option) => ({
      value: option.value,
      label: option.textContent || '',
      group: option.parentElement?.tagName === 'OPTGROUP' ? option.parentElement.label : '',
      prompt: option.dataset.prompt || ''
    }));
}

function applyNarrowing(select, kind) {
  const key = selectedSceneKey();
  const records = optionRecords(select);
  const allowed = narrowOptions(key, kind, records);
  const allowedValues = new Set(allowed.map((item) => item.value));

  for (const option of select.options) {
    if (!option.value) {
      option.hidden = false;
      continue;
    }
    option.hidden = !allowedValues.has(option.value);
  }

  for (const group of select.querySelectorAll('optgroup')) {
    group.hidden = [...group.querySelectorAll('option')].every((option) => option.hidden);
  }

  if (select.selectedOptions[0]?.hidden) select.value = '';
}

function applySpecializedFilters() {
  const key = selectedSceneKey();
  if (!sceneMeta(key)) return;
  applyNarrowing(controls.location, 'location');
  applyNarrowing(controls.clothing, 'clothing');
  applyNarrowing(controls.pose, 'pose');
  applyNarrowing(controls.angle, 'angle');
  applyNarrowing(controls.lighting, 'lighting');
}

function selectedPrompt(select) {
  return select.selectedOptions[0]?.dataset.prompt || '';
}

function createUserDescriptionField() {
  const original = controls.hiddenDescription;
  const label = original?.closest('label');
  if (!original || !label) return null;

  const userField = document.createElement('textarea');
  userField.id = 'userSceneDescription';
  userField.rows = original.rows || 3;
  userField.placeholder = 'أضف فكرتك الخاصة إن أردت. الوصف التلقائي للمشهد سيُدمج معها بدون أن يمسح كلامك.';
  userField.value = original.value;

  original.hidden = true;
  original.setAttribute('aria-hidden', 'true');
  label.append(userField);

  const note = document.createElement('small');
  note.className = 'hint';
  note.textContent = 'يُضاف تلقائيًا وصف متماسك للفعل والمكان والملابس والزاوية والإضاءة والفيزياء.';
  label.append(note);
  return userField;
}

const userDescription = createUserDescriptionField();
let automaticText = '';

function composeAutomaticText() {
  const smartSceneType = selectedSceneKey();
  const selectedTypeOption = controls.sceneType.selectedOptions[0];
  return buildAutomaticSceneDescription({
    smartSceneType,
    sceneLabel: selectedTypeOption?.textContent || '',
    scenePrompt: selectedTypeOption?.dataset.prompt || '',
    location: selectedPrompt(controls.location),
    clothing: selectedPrompt(controls.clothing),
    pose: selectedPrompt(controls.pose),
    angle: selectedPrompt(controls.angle),
    lighting: selectedPrompt(controls.lighting),
    lightingNotes: controls.lightingNotes.value
  });
}

function syncDescription({ dispatch = true } = {}) {
  automaticText = composeAutomaticText();
  const userText = userDescription?.value.trim() || '';
  controls.hiddenDescription.value = [userText, automaticText].filter(Boolean).join('\n\n');
  if (dispatch) controls.hiddenDescription.dispatchEvent(new Event('input', { bubbles: true }));
}

function refreshSpecializedScene() {
  applySpecializedFilters();
  syncDescription();
}

appendExpandedSceneTypes();
refreshSpecializedScene();

controls.sceneType.addEventListener('change', () => queueMicrotask(refreshSpecializedScene));
for (const control of [controls.location, controls.clothing, controls.pose, controls.angle, controls.lighting, controls.lightingNotes]) {
  control.addEventListener('change', () => syncDescription());
  control.addEventListener('input', () => syncDescription());
}
userDescription?.addEventListener('input', () => syncDescription());
controls.reset?.addEventListener('click', () => queueMicrotask(() => {
  if (userDescription) userDescription.value = '';
  refreshSpecializedScene();
}));
