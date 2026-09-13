import {
  CATALOG,
  FIELD_SPECS,
  FRAMINGS,
  LIGHT_SOURCES,
  REALISM_MODULES,
  MODULE_LEVELS
} from '../data/catalog.js';
import { fieldCoverageCm, minimumGroupWidthCm } from './geometry.js';
import { assertStateObject, normalizeState, optionById, STATE_FIELDS, MODULE_IDS } from './state.js';

const framingMap = new Map(FRAMINGS.map((item) => [item.id, item]));
const lightMap = new Map(LIGHT_SOURCES.map((item) => [item.id, item]));
const moduleLevelIds = new Set(MODULE_LEVELS.map(({ id }) => id));
const knownFields = new Set(STATE_FIELDS);
const namedCityPattern = /(الرياض|جدة|مكة|مكّة|المدينة|الدمام|الخبر|الطائف|أبها|ينبع|riyadh|jeddah|makkah|mecca|madinah|medina|dammam|khobar|taif|abha|yanbu)/i;

function issue(code, severity, field, message) {
  return Object.freeze({ code, severity, field, message });
}

function isStrict(state) {
  return REALISM_MODULES.some(({ id }) => state.modules[id] === 'strict');
}

function validateEnums(state, issues) {
  for (const [field, options] of Object.entries(CATALOG)) {
    const value = state[field];
    if (!options.some((option) => option.id === value)) {
      issues.push(issue('UNKNOWN_OPTION', 'fatal', field, `قيمة غير مدعومة في ${field}: ${value || '(فارغ)'}.`));
    }
  }
}

function validateNumbers(state, issues) {
  for (const [field, spec] of Object.entries(FIELD_SPECS)) {
    const value = state[field];
    if (!Number.isFinite(value)) {
      issues.push(issue('INVALID_NUMBER', 'fatal', field, `${field} يجب أن يكون رقمًا بوحدة ${spec.unit}.`));
      continue;
    }
    if (value < spec.min || value > spec.max) {
      issues.push(issue('NUMBER_OUT_OF_RANGE', 'fatal', field, `${field} خارج النطاق المسموح: ${spec.min}–${spec.max} ${spec.unit}.`));
    }
  }
}

function validateCustomFields(state, issues, strict) {
  const required = [
    ['location', 'customLocation', 'الموقع'],
    ['pose', 'customPose', 'الوضعية'],
    ['hair', 'customHair', 'الشعر'],
    ['beard', 'customBeard', 'اللحية'],
    ['glasses', 'customGlasses', 'النظارة'],
    ['clothing', 'customClothing', 'الملابس'],
    ['lightSource', 'customLightSource', 'مصدر الضوء']
  ];
  for (const [selector, textField, label] of required) {
    if (state[selector] === 'custom' && !state[textField]) {
      issues.push(issue('EMPTY_CUSTOM_VALUE', 'fatal', textField, `اخترت ${label} مخصصًا لكن الوصف فارغ.`));
    }
  }

  if (strict && state.location === 'custom') {
    issues.push(issue('STRICT_UNVERIFIED_LOCATION', 'error', 'location', 'الوضع الصارم لا يستطيع إثبات خصائص موقع مخصص غير مصنف؛ اختر موقعًا من الكتالوج.'));
  }
  if (strict && state.lightSource === 'custom') {
    issues.push(issue('STRICT_UNVERIFIED_LIGHT', 'error', 'lightSource', 'الوضع الصارم لا يستطيع إثبات فيزياء مصدر ضوء مخصص؛ اختر مصدرًا مصنفًا.'));
  }
  if (strict && state.pose === 'custom') {
    issues.push(issue('STRICT_UNVERIFIED_POSE', 'error', 'pose', 'الوضع الصارم لا يستطيع إثبات التلامس ووضعية الجسم في وصف مخصص؛ اختر وضعية مصنفة.'));
  }
}

function validateReference(state, issues) {
  if (state.referenceRole !== 'none' && !state.referenceAttached) {
    issues.push(issue('REFERENCE_ROLE_WITHOUT_FILE', 'fatal', 'referenceRole', 'تم اختيار دور للصورة المرجعية لكن لم تُرفق صورة.'));
  }
  if (state.referenceAttached && state.referenceRole === 'none') {
    issues.push(issue('UNUSED_REFERENCE_FILE', 'warning', 'referenceRole', 'أرفقت صورة مرجعية لكن دورها مضبوط على "بدون استخدام".'));
  }
  const referenceAppearance = [
    ['hair', state.hair],
    ['beard', state.beard],
    ['glasses', state.glasses]
  ];
  for (const [field, value] of referenceAppearance) {
    if (value === 'reference' && (!state.referenceAttached || state.referenceRole === 'none')) {
      issues.push(issue('REFERENCE_APPEARANCE_WITHOUT_ACTIVE_REFERENCE', 'fatal', field, `${field} مضبوط على المرجع لكن لا يوجد مرجع فعّال.`));
    }
  }
}

function validateGenericSaudiPolicy(state, issues) {
  const freeText = [state.customLocation, state.idea, state.notes].filter(Boolean).join(' ');
  if (namedCityPattern.test(freeText)) {
    issues.push(issue('NAMED_CITY_NOT_ALLOWED', 'fatal', 'location', 'سياسة التطبيق تمنع أسماء المدن والمعالم المحددة؛ استخدم وصفًا سعوديًا عامًا فقط.'));
  }
}

function validateCamera(state, issues) {
  const capture = optionById('captureType', state.captureType);
  const framing = framingMap.get(state.framing);
  const ratio = optionById('ratio', state.ratio);
  if (!capture || !framing || !ratio || !Number.isFinite(state.focalLength) || !Number.isFinite(state.distance)) return;

  const [minFocal, maxFocal] = capture.focalRangeMm;
  const [minDistance, maxDistance] = capture.distanceRangeCm;
  if (state.focalLength < minFocal || state.focalLength > maxFocal) {
    issues.push(issue('CAPTURE_FOCAL_MISMATCH', 'error', 'focalLength', `${capture.label}: البعد البؤري الواقعي المحدد هو ${minFocal}–${maxFocal} mm equivalent.`));
  }
  if (state.distance < minDistance || state.distance > maxDistance) {
    issues.push(issue('CAPTURE_DISTANCE_MISMATCH', 'error', 'distance', `${capture.label}: مسافة الالتقاط الواقعية المحددة هي ${minDistance}–${maxDistance} cm.`));
  }
  if (Math.abs(state.yaw) > capture.maxAbsYawDeg) issues.push(issue('CAPTURE_YAW_MISMATCH', 'error', 'yaw', `Yaw يتجاوز ±${capture.maxAbsYawDeg}° لهذا النوع من الالتقاط.`));
  if (Math.abs(state.pitch) > capture.maxAbsPitchDeg) issues.push(issue('CAPTURE_PITCH_MISMATCH', 'error', 'pitch', `Pitch يتجاوز ±${capture.maxAbsPitchDeg}° لهذا النوع من الالتقاط.`));
  if (Math.abs(state.roll) > capture.maxAbsRollDeg) issues.push(issue('CAPTURE_ROLL_MISMATCH', 'error', 'roll', `Roll يتجاوز ±${capture.maxAbsRollDeg}° لهذا النوع من الالتقاط.`));

  if (state.focalLength > 0 && state.distance > 0) {
    const coverage = fieldCoverageCm({ ratioId: state.ratio, focalLengthEqMm: state.focalLength, distanceCm: state.distance });
    const [minHeight, maxHeight] = framing.verticalCoverageCm;
    if (coverage.heightCm < minHeight || coverage.heightCm > maxHeight) {
      issues.push(issue(
        'FRAMING_OPTICS_MISMATCH',
        'error',
        'framing',
        `الهندسة الحالية تعطي تغطية رأسية تقريبية ${coverage.heightCm.toFixed(0)} cm، بينما كادر "${framing.label}" يحتاج تقريبًا ${minHeight}–${maxHeight} cm.`
      ));
    }

    const people = Number(state.people);
    if (state.captureType === 'front-selfie' && Number.isInteger(people)) {
      const requiredWidth = minimumGroupWidthCm(people);
      if (coverage.widthCm < requiredWidth) {
        issues.push(issue('SELFIE_GROUP_WIDTH_MISMATCH', 'error', 'people', `عرض مجال الرؤية التقريبي ${coverage.widthCm.toFixed(0)} cm لا يكفي لـ ${people} شخص/أشخاص؛ المطلوب تقريبًا ${requiredWidth} cm أو أكثر.`));
      }
    }
  }

  if (state.captureType === 'front-selfie' && ['three-quarter-body','full-body','environmental-portrait'].includes(state.framing)) {
    issues.push(issue('FRONT_SELFIE_FRAMING_IMPOSSIBLE', 'error', 'framing', 'هذا الكادر أوسع من مدى سيلفي أمامي محمول باليد ضمن المسافات المسموحة.'));
  }
}

function validateLighting(state, issues) {
  const source = lightMap.get(state.lightSource);
  const location = optionById('location', state.location);
  if (!source || !location) return;

  if (!source.times.includes(state.time)) {
    issues.push(issue('LIGHT_TIME_CONFLICT', 'error', 'lightSource', `مصدر الضوء "${source.label}" غير متوافق مع وقت "${optionById('time', state.time)?.label || state.time}".`));
  }
  if (!source.environments.includes(location.environment)) {
    issues.push(issue('LIGHT_ENVIRONMENT_CONFLICT', 'error', 'lightSource', `مصدر الضوء "${source.label}" غير متوافق مع بيئة الموقع (${location.environment}).`));
  }
  if (!source.directions.includes(state.lightDirection)) {
    issues.push(issue('LIGHT_DIRECTION_CONFLICT', 'error', 'lightDirection', `اتجاه الضوء المختار غير مدعوم فيزيائيًا لمصدر "${source.label}" ضمن نموذج التطبيق.`));
  }
  if (!source.falloffs.includes(state.lightFalloff)) {
    issues.push(issue('LIGHT_FALLOFF_CONFLICT', 'error', 'lightFalloff', `نمط هبوط الضوء المختار لا يطابق مصدر "${source.label}".`));
  }
  if (source.maxDistanceCm && state.distance > source.maxDistanceCm) {
    issues.push(issue('WEAK_SOURCE_DISTANCE_CONFLICT', 'error', 'distance', `مصدر "${source.label}" قريب وضعيف؛ المسافة ${state.distance} cm تتجاوز حد النموذج ${source.maxDistanceCm} cm.`));
  }
}

function validateVehicle(state, issues, strict) {
  if (state.vehicleScene === 'none') return;
  const location = optionById('location', state.location);
  const pose = optionById('pose', state.pose);
  if (location && location.parkable !== true) {
    issues.push(issue('VEHICLE_LOCATION_CONFLICT', 'error', 'location', 'مشهد السيارة يتطلب موقعًا يمكن الوقوف فيه فعليًا؛ الموقع الحالي غير مصنف كمكان صالح للتوقف.'));
  }
  if (pose && pose.posture !== 'seated') {
    issues.push(issue('VEHICLE_POSTURE_CONFLICT', 'error', 'pose', 'مشهد داخل السيارة يتطلب وضعية جلوس داخل المقصورة.'));
  }
  if (strict && state.location === 'custom') {
    issues.push(issue('STRICT_VEHICLE_CUSTOM_LOCATION', 'error', 'location', 'الوضع الصارم لا يثبت صلاحية الوقوف في موقع مخصص.'));
  }
  if (['three-quarter-body','full-body','environmental-portrait'].includes(state.framing)) {
    issues.push(issue('VEHICLE_INTERIOR_FRAMING_CONFLICT', 'error', 'framing', 'الكادر المختار لا يتوافق مع مساحة مقصورة السيارة من موضع تصوير داخلي طبيعي.'));
  }
}

function validateModules(input, state, issues) {
  if (input.modules !== undefined && (!input.modules || typeof input.modules !== 'object' || Array.isArray(input.modules))) {
    issues.push(issue('INVALID_MODULE_OBJECT', 'fatal', 'modules', 'modules يجب أن يكون كائنًا.'));
    return;
  }
  const rawModules = input.modules || {};
  for (const key of Object.keys(rawModules)) {
    if (!MODULE_IDS.includes(key)) issues.push(issue('UNKNOWN_MODULE', 'fatal', 'modules', `موديول غير معروف: ${key}.`));
  }
  for (const id of MODULE_IDS) {
    if (!moduleLevelIds.has(state.modules[id])) issues.push(issue('UNKNOWN_MODULE_LEVEL', 'fatal', `modules.${id}`, `مستوى غير معروف للموديول ${id}: ${state.modules[id]}.`));
  }
}

export function validateState(input) {
  assertStateObject(input);
  const state = normalizeState(input);
  const issues = [];
  const strict = isStrict(state);

  for (const key of Object.keys(input)) {
    if (!knownFields.has(key)) issues.push(issue('UNKNOWN_STATE_FIELD', 'fatal', key, `حقل حالة غير معروف: ${key}.`));
  }

  validateModules(input, state, issues);
  validateEnums(state, issues);
  validateNumbers(state, issues);
  validateCustomFields(state, issues, strict);
  validateReference(state, issues);
  validateGenericSaudiPolicy(state, issues);
  validateCamera(state, issues);
  validateLighting(state, issues);
  validateVehicle(state, issues, strict);

  return Object.freeze(issues);
}

export function validationStatus(input) {
  assertStateObject(input);
  const state = normalizeState(input);
  const issues = validateState(input);
  const strict = isStrict(state);
  const blocking = issues.filter((item) => item.severity === 'fatal' || (strict && item.severity === 'error'));
  return Object.freeze({ state, issues, strict, blocked: blocking.length > 0, blocking: Object.freeze(blocking) });
}
