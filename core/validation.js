import { CATALOG, FIELD_SPECS, REALISM_MODULES } from '../data/catalog.js';
import { normalizeState } from './state.js';
import { sceneCoverageCm, withinRange } from './geometry.js';

const cityTokens = ['riyadh','jeddah','mecca','makkah','medina','madinah','dammam','khobar','الرياض','جدة','مكة','المدينة','الدمام','الخبر'];
const optionById = (field, id) => (CATALOG[field] || []).find((item) => item.id === id);
function push(issues, severity, code, message, field) { issues.push(Object.freeze({ severity, code, message, field })); }
export function isStrict(state) { return REALISM_MODULES.some((module) => state.modules?.[module.id] === 'strict'); }
function validateKnownOptions(state, issues) { for (const [field, options] of Object.entries(CATALOG)) if (!options.some((option) => option.id === state[field])) push(issues, 'fatal', 'UNKNOWN_OPTION', `قيمة غير معروفة في ${field}.`, field); }
function validateNumbers(state, issues) { for (const [field, spec] of Object.entries(FIELD_SPECS)) { const value=state[field]; if(!Number.isFinite(value)) push(issues,'fatal','INVALID_NUMBER',`${field} يجب أن يكون رقمًا صالحًا.`,field); else if(value<spec.min||value>spec.max) push(issues,'fatal','OUT_OF_RANGE',`${field} خارج النطاق ${spec.min}–${spec.max} ${spec.unit}.`,field); } }
function validateReference(state, issues) { if(state.referenceRole!=='none'&&!state.referenceAttached) push(issues,'warning','REFERENCE_NOT_ATTACHED','تم اختيار دور للمرجع لكن لا توجد صورة مرجعية مرفقة محليًا.','referenceRole'); }
function validateCustomFields(state, issues) {
  const pairs=[['location','customLocation','CUSTOM_LOCATION_EMPTY'],['pose','customPose','CUSTOM_POSE_EMPTY'],['hair','customHair','CUSTOM_HAIR_EMPTY'],['beard','customBeard','CUSTOM_BEARD_EMPTY'],['glasses','customGlasses','CUSTOM_GLASSES_EMPTY'],['clothing','customClothing','CUSTOM_CLOTHING_EMPTY'],['lightSource','customLightSource','CUSTOM_LIGHT_EMPTY']];
  for(const [selector,textField,code] of pairs) if(state[selector]==='custom'&&!state[textField].trim()) push(issues,'fatal',code,`الخيار المخصص في ${selector} يحتاج وصفًا.`,textField);
  if(state.location==='custom'){const lower=state.customLocation.toLowerCase();if(cityTokens.some(token=>lower.includes(token)))push(issues,'fatal','NAMED_LOCATION_FORBIDDEN','الموقع المخصص يجب أن يبقى سعوديًا عامًا بلا اسم مدينة أو معلم محدد.','customLocation');}
}
function validateCapture(state, issues) {
  const capture=optionById('captureType',state.captureType); if(!capture)return;
  if(!withinRange(state.focalLength,capture.focalRangeMm))push(issues,'error','CAPTURE_FOCAL_CONFLICT',`البعد البؤري غير متناسق مع نوع الالتقاط؛ النطاق المتوقع ${capture.focalRangeMm[0]}–${capture.focalRangeMm[1]}mm.`,'focalLength');
  if(!withinRange(state.distance,capture.distanceRangeCm))push(issues,'error','CAPTURE_DISTANCE_CONFLICT',`المسافة غير متناسقة مع نوع الالتقاط؛ النطاق المتوقع ${capture.distanceRangeCm[0]}–${capture.distanceRangeCm[1]}cm.`,'distance');
  if(Math.abs(state.yaw)>capture.maxAbsYawDeg)push(issues,'error','CAPTURE_YAW_CONFLICT','Yaw يتجاوز النطاق المنطقي لنوع الالتقاط.','yaw');
  if(Math.abs(state.pitch)>capture.maxAbsPitchDeg)push(issues,'error','CAPTURE_PITCH_CONFLICT','Pitch يتجاوز النطاق المنطقي لنوع الالتقاط.','pitch');
  if(Math.abs(state.roll)>capture.maxAbsRollDeg)push(issues,'error','CAPTURE_ROLL_CONFLICT','Roll يتجاوز النطاق المنطقي لنوع الالتقاط.','roll');
}
function validateLighting(state, issues) {
  const source=optionById('lightSource',state.lightSource); const location=optionById('location',state.location); if(!source||state.lightSource==='custom')return;
  if(source.allowedTimes&&!source.allowedTimes.includes(state.time))push(issues,'error','LIGHT_TIME_CONFLICT','مصدر الضوء المختار لا يتوافق مع الوقت.','lightSource');
  if(source.allowedEnvironments&&location?.environment!=='unknown'&&!source.allowedEnvironments.includes(location?.environment))push(issues,'error','LIGHT_ENVIRONMENT_CONFLICT','مصدر الضوء لا يتوافق مع بيئة الموقع.','lightSource');
  if(source.directions&&!source.directions.includes(state.lightDirection))push(issues,'error','LIGHT_DIRECTION_CONFLICT','اتجاه الضوء لا يتوافق مع المصدر الفيزيائي.','lightDirection');
  if(source.falloffs&&!source.falloffs.includes(state.lightFalloff))push(issues,'error','LIGHT_FALLOFF_CONFLICT','نمط سقوط الضوء لا يتوافق مع المصدر الفيزيائي.','lightFalloff');
}
function validateFraming(state, issues) { const framing=optionById('framing',state.framing);if(!framing)return;const coverage=sceneCoverageCm({distanceCm:state.distance,focalLengthMm:state.focalLength,ratio:state.ratio});if(Number.isFinite(coverage.heightCm)&&!withinRange(coverage.heightCm,framing.verticalCoverageCm,12))push(issues,'warning','FRAMING_GEOMETRY_MISMATCH',`الهندسة الحالية تعطي تغطية رأسية تقريبية ${coverage.heightCm.toFixed(0)}cm، وهي بعيدة عن الكادر المختار.`,'framing'); }
export function validateState(input={}){const state=normalizeState(input);const issues=[];validateKnownOptions(state,issues);validateNumbers(state,issues);validateReference(state,issues);validateCustomFields(state,issues);validateCapture(state,issues);validateLighting(state,issues);validateFraming(state,issues);if(Number(state.people)>1&&state.captureType==='front-selfie'&&state.distance<40)push(issues,'warning','GROUP_SELFIE_SPACE','سيلفي المجموعة على هذه المسافة قد يضغط الوجوه عند الحواف.','distance');return Object.freeze(issues);}
export function validationStatus(input={}){const state=normalizeState(input);const issues=validateState(state);const strict=isStrict(state);const blocked=issues.some(issue=>issue.severity==='fatal'||(strict&&issue.severity==='error'));return Object.freeze({issues,strict,blocked,counts:Object.freeze({fatal:issues.filter(i=>i.severity==='fatal').length,error:issues.filter(i=>i.severity==='error').length,warning:issues.filter(i=>i.severity==='warning').length})});}
