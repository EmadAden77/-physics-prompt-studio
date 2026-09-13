import {
  REFERENCE_ROLES,
  CAPTURE_TYPES,
  TIMES,
  SAUDI_LOCATIONS,
  ANGLES,
  FRAMINGS,
  POSES,
  EXPRESSIONS,
  CLOTHING,
  LIGHT_SOURCES,
  REALISM_MODULES,
  MODULE_LEVELS
} from './data/catalog.js';

import {
  compileDetailed,
  compileConcise,
  compileNegative,
  compileJson,
  validateState
} from './core/compiler.js';

const $ = (id) => document.getElementById(id);
let activeView = 'detailed';
let referenceAttached = false;

function fillSelect(id, items, defaultValue) {
  const select = $(id);
  if (!select) return;
  select.innerHTML = '';
  items.forEach((item) => {
    const [value, label] = item;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
  if (defaultValue) select.value = defaultValue;
}

function buildCatalogs() {
  fillSelect('referenceRole', REFERENCE_ROLES, 'identity-only');
  fillSelect('captureType', CAPTURE_TYPES, 'front-selfie');
  fillSelect('time', TIMES, 'night');
  fillSelect('location', SAUDI_LOCATIONS, 'commercial-street');
  fillSelect('angle', ANGLES, 'eye-level');
  fillSelect('framing', FRAMINGS, 'chest-up');
  fillSelect('pose', POSES, 'natural-standing');
  fillSelect('expression', EXPRESSIONS, 'neutral');
  fillSelect('clothing', CLOTHING, 'black-tee');
  fillSelect('lightSource', LIGHT_SOURCES, 'street-lights');

  const moduleGrid = $('realismModules');
  moduleGrid.innerHTML = '';
  REALISM_MODULES.forEach(([key, label]) => {
    const card = document.createElement('label');
    card.className = 'module-card';
    const title = document.createElement('span');
    title.textContent = label;
    const select = document.createElement('select');
    select.id = `module_${key}`;
    MODULE_LEVELS.forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    select.value = 'auto';
    card.append(title, select);
    moduleGrid.appendChild(card);
  });
}

function value(id) {
  const el = $(id);
  return el ? String(el.value ?? '').trim() : '';
}

function readModules() {
  return Object.fromEntries(
    REALISM_MODULES.map(([key]) => [key, value(`module_${key}`) || 'off'])
  );
}

function readState() {
  return {
    idea: value('idea'),
    referenceAttached,
    referenceRole: value('referenceRole'),
    captureType: value('captureType'),
    time: value('time'),
    location: value('location'),
    people: value('people'),
    ratio: value('ratio'),
    age: value('age'),
    pose: value('pose'),
    expression: value('expression'),
    clothing: value('clothing'),
    hair: value('hair'),
    glasses: value('glasses'),
    angle: value('angle'),
    framing: value('framing'),
    focalLength: value('focalLength'),
    distance: value('distance'),
    yaw: value('yaw'),
    pitch: value('pitch'),
    roll: value('roll'),
    lightSource: value('lightSource'),
    lightDirection: value('lightDirection'),
    lightFalloff: value('lightFalloff'),
    exposure: value('exposure'),
    hdr: value('hdr'),
    whiteBalance: value('whiteBalance'),
    modules: readModules(),
    notes: value('notes')
  };
}

function compileForView(state) {
  if (activeView === 'concise') return compileConcise(state);
  if (activeView === 'json') return compileJson(state);
  if (activeView === 'negative') return compileNegative(state);
  return compileDetailed(state);
}

function renderWarnings(state) {
  const warnings = validateState(state);
  const box = $('warnings');
  const checklist = $('checklist');
  const count = $('warningCount');
  count.textContent = String(warnings.length);

  if (!warnings.length) {
    box.classList.remove('visible');
    box.innerHTML = '';
    checklist.innerHTML = '<li class="ok">لا يوجد تعارض واضح في الاختيارات الحالية.</li><li class="ok">الموقع سعودي عام بدون معلم معروف.</li><li class="ok">الإضاءة الفيزيائية منفصلة عن المعالجة.</li>';
    return;
  }

  box.classList.add('visible');
  box.innerHTML = `<strong>تنبيهات قبل النسخ:</strong><ul>${warnings.map((w) => `<li>${w}</li>`).join('')}</ul>`;
  checklist.innerHTML = warnings.map((w) => `<li class="warn">${w}</li>`).join('');
}

function render() {
  const state = readState();
  $('output').textContent = compileForView(state);
  renderWarnings(state);
}

function setActiveView(view) {
  activeView = view;
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  render();
}

async function copyOutput() {
  const text = $('output').textContent || '';
  if (!text) return;
  const button = $('copy');
  const old = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'تم النسخ';
  } catch {
    button.textContent = 'انسخ يدويًا';
  }
  setTimeout(() => { button.textContent = old; }, 1000);
}

function bindEvents() {
  $('promptForm').addEventListener('submit', (event) => event.preventDefault());

  $('promptForm').addEventListener('input', render);
  $('promptForm').addEventListener('change', render);

  $('referenceImage').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    referenceAttached = Boolean(file);
    $('uploadZone').classList.toggle('has-file', referenceAttached);
    $('fileStatus').textContent = file
      ? `تم اختيار: ${file.name}`
      : 'تبقى الصورة على جهازك؛ التطبيق يستخدم فقط اختيارك لدورها في البرومبت.';
    render();
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => setActiveView(button.dataset.view));
  });

  $('copy').addEventListener('click', copyOutput);
}

buildCatalogs();
bindEvents();
render();
