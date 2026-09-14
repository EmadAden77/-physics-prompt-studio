import {
  COMMON_CATALOG,
  commonCompatibility,
  commonOption,
  getCameraOptic,
  getClothing,
  getFabric,
  normalizeCommonDerivedState
} from '../data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG, INSIDE_DEFAULT_STATE, isInsideOptionCompatible } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_CATALOG, OUTSIDE_DEFAULT_STATE, isOutsideOptionCompatible } from '../data/carSelfieOutsideCatalog.js';
import { validateInsideState } from './carSelfieInsideValidation.js';
import { validateOutsideState } from './carSelfieOutsideValidation.js';

const issue = (severity, code, message, field) => Object.freeze({ severity, code, message, field });
const COMMON_KEYS = Object.freeze([
  'mode','initialRequest','referenceAttached','referenceRole','vehicleProfile','cameraLens','colorProfile','lowLightProcessing',
  'time','place','weather','externalLight','physicsMode','apparentAge','expression','gazeTarget','skinDetail','clothing','fabricType',
  'fabricSheen','wrinkleProfile','hairProfile','hairMotion','hairSpecular','framing','focalLength','aperture','distance','yaw','pitch','roll',
  'exposure','hdr','whiteBalance','notes','motion'
]);
const INSIDE_KEYS = Object.freeze(['vehicleState','seat','captureMode','handPose','cabinMaterial','clusterType','roofType','windowState','clutterLevel','cabinEmitter']);
const OUTSIDE_KEYS = Object.freeze(['vehicleState','captureMode','standingPose','paintCondition']);

function pick(input, keys) {
  const out = {};
  for (const key of keys) if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = input[key];
  return out;
}

export function catalogForMode(mode) {
  return mode === 'outside' ? OUTSIDE_CATALOG : INSIDE_CATALOG;
}

export function defaultStateForMode(mode) {
  return mode === 'outside' ? OUTSIDE_DEFAULT_STATE : INSIDE_DEFAULT_STATE;
}

export function normalizeCarState(input = {}) {
  const mode = input.mode === 'outside' ? 'outside' : 'inside';
  const defaults = defaultStateForMode(mode);
  const allowed = [...COMMON_KEYS, ...(mode === 'outside' ? OUTSIDE_KEYS : INSIDE_KEYS)];
  const state = { ...defaults, ...pick(input, allowed), mode };
  state.motion = mode === 'inside' && state.vehicleState === 'moving' ? 'moving' : 'stationary';
  state.initialRequest = String(state.initialRequest ?? '');
  state.notes = String(state.notes ?? '');
  state.referenceAttached = Boolean(state.referenceAttached);
  for (const key of ['apparentAge','distance','yaw','pitch','roll']) state[key] = Number(state[key]);
  const derived = normalizeCommonDerivedState(state);
  return { ...derived, mode };
}

export function isOptionCompatible(field, id, input = {}) {
  const state = normalizeCarState(input);
  if ((COMMON_CATALOG[field] || []).length && !commonCompatibility(field, id, state)) return false;
  return state.mode === 'outside' ? isOutsideOptionCompatible(field, id, state) : isInsideOptionCompatible(field, id, state);
}

export function compatibleOptions(field, input = {}) {
  const state = normalizeCarState(input);
  const catalog = catalogForMode(state.mode);
  return Object.freeze((catalog[field] || []).filter((item) => isOptionCompatible(field, item.id, state)));
}

function validateCommon(state, issues) {
  const catalog = catalogForMode(state.mode);
  const relevantFields = [...Object.keys(COMMON_CATALOG), ...(state.mode === 'outside' ? OUTSIDE_KEYS : INSIDE_KEYS)];
  for (const field of new Set(relevantFields)) {
    const options = catalog[field];
    if (options && !options.some((item) => item.id === state[field])) issues.push(issue('fatal', 'UNKNOWN_OPTION', `قيمة غير معروفة في ${field}.`, field));
  }

  if (!Number.isFinite(state.apparentAge) || state.apparentAge < 1 || state.apparentAge > 100) issues.push(issue('fatal', 'AGE_RANGE', 'العمر الظاهر يجب أن يكون بين 1 و100.', 'apparentAge'));
  if (!Number.isFinite(state.distance) || state.distance < 20 || state.distance > 600) issues.push(issue('fatal', 'DISTANCE_RANGE', 'مسافة الكاميرا خارج المجال المدعوم 20–600 سم.', 'distance'));
  if (![state.yaw,state.pitch,state.roll].every(Number.isFinite) || Math.abs(state.yaw) > 60 || Math.abs(state.pitch) > 40 || Math.abs(state.roll) > 20) issues.push(issue('fatal', 'ANGLE_RANGE', 'Yaw/Pitch/Roll خارج المجال العام المدعوم.', 'yaw'));

  const lens = getCameraOptic(state.cameraLens);
  if (!lens) issues.push(issue('fatal', 'CAMERA_LENS_MISSING', 'عدسة Xiaomi غير معروفة.', 'cameraLens'));
  else if (state.focalLength !== lens.focalLengthEqMm || state.aperture !== lens.aperture) issues.push(issue('fatal', 'CAMERA_HARDWARE_DRIFT', 'البعد البؤري والفتحة مشتقان من العتاد ولا يجوز تجاوزهما يدويًا.', 'cameraLens'));

  if (!commonCompatibility('colorProfile', state.colorProfile, state)) issues.push(issue('error', 'COLOR_PROFILE_CAMERA', 'بصمة الألوان لا تتوافق مع جهة الكاميرا؛ Leica للعدسات الخلفية فقط.', 'colorProfile'));
  if (!commonCompatibility('lowLightProcessing', state.lowLightProcessing, state)) issues.push(issue('error', 'LOW_LIGHT_CONFLICT', 'معالجة الإضاءة المنخفضة لا تتوافق مع العدسة/الوقت/الحركة.', 'lowLightProcessing'));
  if (!commonCompatibility('weather', state.weather, state)) issues.push(issue('error', 'WEATHER_PLACE_CONFLICT', 'الطقس لا يتوافق مع المكان.', 'weather'));
  if (!commonCompatibility('externalLight', state.externalLight, state)) issues.push(issue('error', 'EXTERNAL_LIGHT_CONFLICT', 'الإضاءة الخارجية لا تتوافق مع الوقت أو نوع المكان.', 'externalLight'));

  const place = commonOption('place', state.place);
  const forbidden = ['riyadh','jeddah','mecca','medina','الرياض','جدة','مكة','المدينة','kingdom centre','برج المملكة'];
  const placeText = `${place?.label || ''} ${place?.prompt || ''}`.toLowerCase();
  if (forbidden.some((term) => placeText.includes(term))) issues.push(issue('fatal', 'NAMED_LOCATION_LEAK', 'الأماكن يجب أن تبقى عامة بلا مدن أو معالم معروفة.', 'place'));

  const clothing = getClothing(state.clothing);
  const fabric = getFabric(state.fabricType);
  if (!clothing?.fabrics.includes(state.fabricType)) issues.push(issue('error', 'CLOTHING_FABRIC_CONFLICT', 'نوع القماش لا يتوافق مع قطعة الملابس المختارة.', 'fabricType'));
  if (!fabric?.sheen.includes(state.fabricSheen)) issues.push(issue('error', 'FABRIC_SHEEN_CONFLICT', 'تفاعل القماش مع الضوء لا يتوافق مع نوع القماش.', 'fabricSheen'));
  if (!fabric?.wrinkles.includes(state.wrinkleProfile)) issues.push(issue('error', 'FABRIC_WRINKLE_CONFLICT', 'نمط التجاعيد لا يتوافق مع صلابة/دراپ القماش.', 'wrinkleProfile'));

  const hair = commonOption('hairProfile', state.hairProfile);
  if (hair?.densityLock !== true) issues.push(issue('fatal', 'HAIR_DENSITY_UNLOCKED', 'كثافة الشعر وخط الشعر يجب أن يبقيا ثابتين دائمًا.', 'hairProfile'));
  if (!commonCompatibility('hairMotion', state.hairMotion, state)) issues.push(issue('error', 'HAIR_MOTION_MODE', 'حركة الشعر لا تتوافق مع وضع الداخل/الخارج.', 'hairMotion'));
  if (!commonCompatibility('gazeTarget', state.gazeTarget, state)) issues.push(issue('error', 'GAZE_MODE_CONFLICT', 'اتجاه النظر لا يتوافق مع وضع التصوير.', 'gazeTarget'));

  if (state.referenceRole !== 'none' && !state.referenceAttached) issues.push(issue('warning', 'REFERENCE_NOT_ATTACHED', 'تم اختيار استخدام مرجع هوية بدون صورة مرفقة.', 'referenceRole'));
  if (state.hdr === 'auto-realistic' && state.time === 'night' && state.externalLight === 'night-signage-spill') issues.push(issue('warning', 'HDR_SIGNAL_ONLY', 'HDR يحمي الإشارة الموجودة لكنه لا يخلق ضوءًا على أسطح لم يصلها المصدر فعليًا.', 'hdr'));
}

export function validateCarState(input = {}) {
  const state = normalizeCarState(input);
  const issues = [];
  validateCommon(state, issues);
  if (state.mode === 'outside') validateOutsideState(state, issues);
  else validateInsideState(state, issues);
  return Object.freeze(issues);
}

export function carValidationStatus(input = {}) {
  const state = normalizeCarState(input);
  const issues = validateCarState(state);
  const strict = state.physicsMode === 'strict';
  const blocked = issues.some((item) => item.severity === 'fatal' || (strict && item.severity === 'error'));
  return Object.freeze({ state: Object.freeze({ ...state }), issues, strict, blocked });
}
