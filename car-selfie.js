import { generateImagePrompt, validateRealism } from './core/prompt-generator.js';
import { processImageBlob, XIAOMI_15_ULTRA_PRESET } from './core/photo-post-processing.js';
import { SAUDI_LOCATIONS, CLOTHING_OPTIONS, SELFIE_ANGLES, LIGHTING_PROFILES } from './core/scene-builder.js';

const IPHONE_15_PRO_MAX_PRESET = Object.freeze({
  iso: 'auto',
  lumaNoise: 0.38,
  chromaNoise: 0.18,
  chromaticAberration: 0.32,
  vignette: 0.075,
  wbDrift: 0.014,
  sharpnessReduction: 0.045,
  jpegQuality: 0.95,
  hdrHalo: 0.030
});

const VEHICLES = Object.freeze([
  {
    value: 'range_rover_l494_2017_white',
    label: 'Range Rover Sport L494 2017 أبيض',
    prompt: 'a stationary white 2017 Range Rover Sport L494 with recognizable production-correct SUV proportions, realistic body panels, glazing, wheels and cabin geometry'
  },
  {
    value: 'generic_luxury_suv',
    label: 'SUV فاخرة عامة',
    prompt: 'a stationary contemporary luxury SUV with coherent production-style body proportions, premium but believable materials, correct wheels, glazing and cabin geometry'
  },
  {
    value: 'generic_suv',
    label: 'SUV عادية',
    prompt: 'a stationary ordinary contemporary SUV with practical trim, correct body proportions, realistic wheels, glazing and cabin geometry'
  },
  {
    value: 'generic_sedan',
    label: 'سيدان',
    prompt: 'a stationary contemporary sedan with realistic production proportions, correct doors, wheels, glazing and cabin geometry'
  }
]);

const VEHICLE_STATES = Object.freeze([
  { value: 'parked', label: 'متوقفة', prompt: 'The vehicle is fully parked and stationary with no driving action.' },
  { value: 'parked_engine_on', label: 'متوقفة والمحرك يعمل', prompt: 'The vehicle is fully parked and stationary while the engine remains on; do not depict motion or active driving.' }
]);

const SEATS = Object.freeze([
  { value: 'driver_seat', label: 'السائق', prompt: 'seated naturally in the driver seat of the stationary vehicle, with correct seat support, cabin side mapping and reachable subject-held phone geometry' },
  { value: 'passenger_seat', label: 'الراكب', prompt: 'seated naturally in the front passenger seat of the stationary vehicle, with correct seat support, cabin side mapping and reachable subject-held phone geometry' }
]);

const OUTSIDE_POSES = Object.freeze([
  { value: 'door_open_car', label: 'بجانب باب مفتوح', prompt: 'standing naturally beside the stationary vehicle with one door open, preserving realistic door clearance, body-to-car spacing and subject-held selfie reach' },
  { value: 'standing_relaxed', label: 'وقوف مريح بجانب السيارة', prompt: 'standing relaxed beside the stationary vehicle with natural weight distribution, realistic distance from the body panels and subject-held selfie reach' }
]);

const TIMES = Object.freeze([
  { value: 'day', label: 'نهار', prompt: 'daytime' },
  { value: 'sunset', label: 'غروب', prompt: 'sunset / golden-hour period' },
  { value: 'night', label: 'ليل', prompt: 'nighttime' }
]);

const PLACE_VALUES_BY_TIME = Object.freeze({
  day: ['day_parking', 'gas_station', 'ordinary_saudi_street'],
  sunset: ['day_parking', 'gas_station', 'ordinary_saudi_street'],
  night: ['night_parking', 'gas_station', 'ordinary_saudi_street']
});

const INSIDE_DRIVER_ANGLES = Object.freeze(['driver_eye_level', 'driver_slight_high', 'driver_low', 'seated_high_three_quarter']);
const INSIDE_PASSENGER_ANGLES = Object.freeze(['eye_centered', 'eye_three_quarter_left', 'eye_three_quarter_right', 'slightly_high_center', 'seated_high_three_quarter']);
const OUTSIDE_ANGLES = Object.freeze(['doorway_three_quarter', 'eye_centered', 'eye_three_quarter_left', 'eye_three_quarter_right', 'slightly_high_center', 'slightly_high_three_quarter', 'low_offcenter', 'waist_up']);

const modeButtons = [...document.querySelectorAll('[data-mode]')];
const previewButtons = [...document.querySelectorAll('[data-preview]')];
const modeLabel = document.getElementById('modeLabel');
const seatField = document.getElementById('seatField');
const standingPoseField = document.getElementById('standingPoseField');
const vehicle = document.getElementById('vehicle');
const vehicleState = document.getElementById('vehicleState');
const seat = document.getElementById('seat');
const standingPose = document.getElementById('standingPose');
const timeOfDay = document.getElementById('timeOfDay');
const place = document.getElementById('place');
const clothing = document.getElementById('clothing');
const selfieAngle = document.getElementById('selfieAngle');
const lighting = document.getElementById('lighting');
const request = document.getElementById('request');
const output = document.getElementById('output');
const generatePromptButton = document.getElementById('generatePrompt');
const copyPromptButton = document.getElementById('copyPrompt');
const clearAll = document.getElementById('clearAll');
const realismBadge = document.getElementById('realismBadge');
const validationAlert = document.getElementById('validationAlert');
const imageUpload = document.getElementById('imageUpload');
const processingPreset = document.getElementById('processingPreset');
const isoMode = document.getElementById('isoMode');
const manualIsoField = document.getElementById('manualIsoField');
const manualIso = document.getElementById('manualIso');
const seedInput = document.getElementById('seed');
const jpegQuality = document.getElementById('jpegQuality');
const reprocessImage = document.getElementById('reprocessImage');
const downloadProcessed = document.getElementById('downloadProcessed');
const processingStatus = document.getElementById('processingStatus');
const originalPanel = document.getElementById('originalPanel');
const processedPanel = document.getElementById('processedPanel');
const originalPreview = document.getElementById('originalPreview');
const processedCanvas = document.getElementById('processedCanvas');

let currentMode = 'inside';
let uploadedBlob = null;
let processedBlob = null;
let originalObjectUrl = '';

function clearSelect(select) {
  while (select.firstChild) select.removeChild(select.firstChild);
}

function appendOptions(select, items, grouped = false) {
  clearSelect(select);
  if (!grouped) {
    for (const item of items) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.append(option);
    }
    return;
  }

  const groups = new Map();
  for (const item of items) {
    const groupName = item.group || 'خيارات';
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(item);
  }

  for (const [groupName, groupItems] of groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupName;
    for (const item of groupItems) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      optgroup.append(option);
    }
    select.append(optgroup);
  }
}

function byValue(items, value) {
  return items.find((item) => item.value === value) || items[0];
}

function catalogSubset(items, values) {
  const allowed = new Set(values);
  return items.filter((item) => allowed.has(item.value));
}

function refreshPlaces() {
  const previous = place.value;
  const allowed = PLACE_VALUES_BY_TIME[timeOfDay.value] || PLACE_VALUES_BY_TIME.day;
  const items = catalogSubset(SAUDI_LOCATIONS, allowed);
  appendOptions(place, items);
  if (items.some((item) => item.value === previous)) place.value = previous;
}

function refreshAngles() {
  const previous = selfieAngle.value;
  const values = currentMode === 'inside'
    ? (seat.value === 'passenger_seat' ? INSIDE_PASSENGER_ANGLES : INSIDE_DRIVER_ANGLES)
    : OUTSIDE_ANGLES;
  const items = catalogSubset(SELFIE_ANGLES, values);
  appendOptions(selfieAngle, items);
  if (items.some((item) => item.value === previous)) selfieAngle.value = previous;
}

function lightingValuesForScene() {
  const period = timeOfDay.value;
  if (currentMode === 'inside') {
    if (period === 'night') return ['night_car_practicals', 'night_car_screen_only'];
    if (period === 'sunset') return ['golden_hour', 'car_daylight'];
    return ['car_daylight'];
  }

  if (period === 'sunset') return ['golden_hour'];
  if (period === 'day') return ['day_direct_sun', 'day_open_shade', 'day_overcast', 'blue_sky_noon'];
  if (place.value === 'gas_station') return ['night_gas_station'];
  if (place.value === 'night_parking') return ['night_parking_led'];
  return ['night_led_street'];
}

function refreshLighting() {
  const previous = lighting.value;
  const items = catalogSubset(LIGHTING_PROFILES, lightingValuesForScene());
  appendOptions(lighting, items, true);
  if (items.some((item) => item.value === previous)) lighting.value = previous;
}

function setMode(nextMode) {
  currentMode = nextMode === 'outside' ? 'outside' : 'inside';
  for (const button of modeButtons) {
    const active = button.dataset.mode === currentMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  }
  const inside = currentMode === 'inside';
  seatField.classList.toggle('is-hidden', !inside);
  standingPoseField.classList.toggle('is-hidden', inside);
  modeLabel.textContent = inside ? 'سيلفي داخل السيارة' : 'سيلفي بالخارج بجانب السيارة';
  refreshAngles();
  refreshLighting();
}

function selectedPose() {
  return currentMode === 'inside' ? byValue(SEATS, seat.value) : byValue(OUTSIDE_POSES, standingPose.value);
}

function sceneDescription() {
  const chosenVehicle = byValue(VEHICLES, vehicle.value);
  const chosenState = byValue(VEHICLE_STATES, vehicleState.value);
  const chosenTime = byValue(TIMES, timeOfDay.value);
  const notes = String(request.value || '').trim();
  return [
    `Vehicle: ${chosenVehicle.prompt}.`,
    chosenState.prompt,
    `Time context: ${chosenTime.prompt}.`,
    notes ? `Additional user scene notes: ${notes}.` : ''
  ].filter(Boolean).join(' ');
}

function renderValidation(check) {
  realismBadge.classList.remove('pass', 'fail', 'neutral');
  validationAlert.classList.add('is-hidden');
  validationAlert.innerHTML = '';

  if (check.valid) {
    realismBadge.textContent = 'REALISM: PASS';
    realismBadge.classList.add('pass');
    if (check.warnings.length) {
      validationAlert.classList.remove('is-hidden');
      validationAlert.classList.add('warning');
      validationAlert.textContent = `تحذيرات واقعية غير مانعة: ${check.warnings.map((item) => item.message).join(' | ')}`;
    }
    return;
  }

  realismBadge.textContent = 'REALISM: FAIL';
  realismBadge.classList.add('fail');
  validationAlert.classList.remove('is-hidden');
  validationAlert.classList.remove('warning');
  validationAlert.textContent = check.errors.map((item) => item.message).join(' | ');
}

function generateCarPrompt() {
  const placeItem = byValue(SAUDI_LOCATIONS, place.value);
  const clothingItem = byValue(CLOTHING_OPTIONS, clothing.value);
  const angleItem = byValue(SELFIE_ANGLES, selfieAngle.value);
  const lightingItem = byValue(LIGHTING_PROFILES, lighting.value);
  const poseItem = selectedPose();
  const chosenVehicle = byValue(VEHICLES, vehicle.value);

  const result = generateImagePrompt({
    sceneType: currentMode === 'inside' ? 'inside_car_selfie' : 'outdoor_selfie',
    camera: 'xiaomi15_front',
    location: placeItem.prompt,
    clothing: clothingItem.prompt,
    pose: poseItem.prompt,
    angle: angleItem.prompt,
    lighting: lightingItem.prompt,
    framing: currentMode === 'inside' ? 'chest_up' : 'waist_up',
    realismLevel: 'strict',
    description: sceneDescription(),
    customConstraints: `Keep ${chosenVehicle.label} visually coherent and stationary. Preserve physically correct vehicle scale, glazing, wheel geometry, doors, seat support and subject-to-vehicle contact. Do not depict driving.`
  });

  output.value = result.prompt;
  copyPromptButton.disabled = !result.prompt;
  renderValidation(validateRealism(result.prompt));
}

async function copyPrompt() {
  const text = output.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyPromptButton.textContent = 'تم النسخ';
    window.setTimeout(() => { copyPromptButton.textContent = 'نسخ'; }, 1200);
  } catch {
    output.focus();
    output.select();
    document.execCommand('copy');
  }
}

function activeProcessingPreset() {
  const base = processingPreset.value === 'iphone' ? IPHONE_15_PRO_MAX_PRESET : XIAOMI_15_ULTRA_PRESET;
  const quality = Math.min(1, Math.max(0.5, Number(jpegQuality.value) || base.jpegQuality));
  const iso = isoMode.value === 'manual' ? Math.max(50, Number(manualIso.value) || 800) : 'auto';
  return Object.freeze({ ...base, iso, jpegQuality: quality });
}

function activeSeed() {
  const value = Number(seedInput.value);
  return Number.isFinite(value) ? Math.trunc(value) : 42;
}

async function drawBlobOnCanvas(blob, canvas) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
    if (typeof bitmap.close === 'function') bitmap.close();
    return;
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    if (typeof image.decode === 'function') await image.decode();
    else await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function processUploadedImage() {
  if (!uploadedBlob) return;
  processingStatus.textContent = 'تجري المعالجة محليًا...';
  reprocessImage.disabled = true;
  downloadProcessed.disabled = true;

  try {
    const preset = activeProcessingPreset();
    processedBlob = await processImageBlob(uploadedBlob, preset, {
      seed: activeSeed(),
      format: 'jpeg'
    });
    await drawBlobOnCanvas(processedBlob, processedCanvas);
    processedPanel.querySelector('.preview-placeholder')?.classList.add('is-hidden');
    processingStatus.textContent = `تمت المعالجة. Seed ${activeSeed()} · JPEG ${preset.jpegQuality.toFixed(2)} · ISO ${preset.iso}`;
    downloadProcessed.disabled = false;
    showPreview('processed');
  } catch (error) {
    processedBlob = null;
    processingStatus.textContent = `تعذرت المعالجة: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    reprocessImage.disabled = !uploadedBlob;
  }
}

function showPreview(kind) {
  const processed = kind === 'processed';
  originalPanel.classList.toggle('active', !processed);
  processedPanel.classList.toggle('active', processed);
  for (const button of previewButtons) button.classList.toggle('active', button.dataset.preview === kind);
}

function loadOriginalPreview(file) {
  if (originalObjectUrl) URL.revokeObjectURL(originalObjectUrl);
  originalObjectUrl = URL.createObjectURL(file);
  originalPreview.src = originalObjectUrl;
  originalPreview.closest('.preview-panel')?.querySelector('.preview-placeholder')?.classList.add('is-hidden');
  showPreview('original');
}

function downloadProcessedImage() {
  if (!processedBlob) return;
  const url = URL.createObjectURL(processedBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `car-selfie-processed-seed-${activeSeed()}.jpg`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resetPromptArea() {
  request.value = '';
  output.value = '';
  copyPromptButton.disabled = true;
  realismBadge.textContent = 'REALISM: WAITING';
  realismBadge.classList.remove('pass', 'fail');
  realismBadge.classList.add('neutral');
  validationAlert.classList.add('is-hidden');
  validationAlert.textContent = '';
}

appendOptions(vehicle, VEHICLES);
appendOptions(vehicleState, VEHICLE_STATES);
appendOptions(seat, SEATS);
appendOptions(standingPose, OUTSIDE_POSES);
appendOptions(timeOfDay, TIMES);
appendOptions(clothing, CLOTHING_OPTIONS, true);
refreshPlaces();
refreshAngles();
refreshLighting();
setMode('inside');

modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
previewButtons.forEach((button) => button.addEventListener('click', () => showPreview(button.dataset.preview)));
seat.addEventListener('change', refreshAngles);
timeOfDay.addEventListener('change', () => { refreshPlaces(); refreshLighting(); });
place.addEventListener('change', refreshLighting);
generatePromptButton.addEventListener('click', generateCarPrompt);
copyPromptButton.addEventListener('click', copyPrompt);
clearAll.addEventListener('click', resetPromptArea);
isoMode.addEventListener('change', () => manualIsoField.classList.toggle('is-hidden', isoMode.value !== 'manual'));
imageUpload.addEventListener('change', async () => {
  const file = imageUpload.files?.[0];
  if (!file) return;
  uploadedBlob = file;
  processedBlob = null;
  loadOriginalPreview(file);
  reprocessImage.disabled = false;
  processingStatus.textContent = `تم تحميل ${file.name}.`;
  await processUploadedImage();
});
reprocessImage.addEventListener('click', processUploadedImage);
downloadProcessed.addEventListener('click', downloadProcessedImage);
window.addEventListener('beforeunload', () => {
  if (originalObjectUrl) URL.revokeObjectURL(originalObjectUrl);
});
