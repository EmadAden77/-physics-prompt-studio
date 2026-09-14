import { getCameraOptic } from '../data/carSelfieCommonCatalog.js';
import { INSIDE_CATALOG, getInsideClutterItems, isInsideOptionCompatible } from '../data/carSelfieInsideCatalog.js';

const opt = (field, id) => (INSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;
const add = (issues, severity, code, message, field) => issues.push(Object.freeze({ severity, code, message, field }));

export function validateInsideState(state, issues = []) {
  const capture = opt('captureMode', state.captureMode);
  const vehicleState = opt('vehicleState', state.vehicleState);
  const seat = opt('seat', state.seat);
  const hand = opt('handPose', state.handPose);
  const lens = getCameraOptic(state.cameraLens);
  const emitter = opt('cabinEmitter', state.cabinEmitter);
  const cluster = opt('clusterType', state.clusterType);

  if (!capture?.allowedMotion.includes(state.vehicleState)) add(issues, 'error', 'INSIDE_CAPTURE_MOTION', 'نوع الالتقاط الداخلي لا يتوافق مع حالة حركة السيارة.', 'captureMode');
  if (!capture?.allowedLensIds.includes(state.cameraLens) || lens?.side !== 'front') add(issues, 'error', 'INSIDE_FRONT_CAMERA_ONLY', 'وضع الداخل يستخدم كاميرا Xiaomi 15 Ultra الأمامية فقط؛ عدسات Leica الخلفية غير متاحة في هذا الوضع.', 'cameraLens');

  if (state.distance < capture.distanceRangeCm[0] || state.distance > capture.distanceRangeCm[1]) add(issues, 'error', 'INSIDE_CAMERA_DISTANCE', `المسافة الواقعية لهذا الالتقاط هي ${capture.distanceRangeCm[0]}–${capture.distanceRangeCm[1]} سم.`, 'distance');
  if (Math.abs(state.yaw) > capture.maxAbsYawDeg || Math.abs(state.pitch) > capture.maxAbsPitchDeg || Math.abs(state.roll) > capture.maxAbsRollDeg) add(issues, 'error', 'INSIDE_CAMERA_ANGLE', 'Yaw/Pitch/Roll تتجاوز هندسة ذراع أو تثبيت واقعية داخل المقصورة.', 'yaw');

  if (vehicleState?.moving && capture?.phoneHeld) add(issues, 'error', 'HANDHELD_WHILE_MOVING', 'السائق أو الراكب لا يمسك الهاتف للتصوير أثناء حركة السيارة في الوضع الصارم.', 'captureMode');
  if (vehicleState?.moving && seat?.role === 'driver' && state.captureMode !== 'dashboard-fixed-front') add(issues, 'error', 'MOVING_DRIVER_MOUNT', 'السائق أثناء الحركة يحتاج هاتفًا مثبتًا على الداشبورد.', 'captureMode');
  if (hand && !isInsideOptionCompatible('handPose', hand.id, state)) add(issues, 'error', 'INSIDE_HAND_POSE', 'وضع اليدين لا يتوافق مع المقعد أو الحركة أو تثبيت الهاتف.', 'handPose');
  if (vehicleState?.moving && seat?.role === 'driver' && state.gazeTarget !== 'road') add(issues, 'error', 'DRIVER_GAZE', 'السائق أثناء الحركة يجب أن يبقى نظره على الطريق، لا على الكاميرا أو المقصورة.', 'gazeTarget');

  if (emitter && !emitter.allowedTimes.includes(state.time)) add(issues, 'error', 'CABIN_EMITTER_TIME', 'مصدر الإضاءة الداخلي لا يتوافق مع الوقت.', 'cabinEmitter');
  if (state.time === 'day' && state.cabinEmitter !== 'none') add(issues, 'warning', 'DAY_CABIN_EMITTER_WEAK', 'المصدر الداخلي نهارًا يجب أن يبقى أضعف بكثير من ضوء الشمس والسماء.', 'cabinEmitter');
  if (state.vehicleProfile === 'l494-2017-white' && cluster?.id === 'modern-digital') add(issues, 'error', 'L494_PERIOD_CLUSTER', 'عدادات حديثة لا تتوافق مع L494 2017 وقد تدفع المولد إلى مقصورة جيل أحدث.', 'clusterType');

  if (state.hairMotion === 'light-breeze' || state.hairMotion === 'moderate-breeze') add(issues, 'error', 'OUTDOOR_HAIR_MOTION_INSIDE', 'حركة شعر بسبب نسمة خارجية لا تنتمي لوضع داخل السيارة.', 'hairMotion');
  if (state.windowState === 'closed' && /breeze/.test(state.hairMotion)) add(issues, 'error', 'CLOSED_WINDOW_WIND', 'النوافذ المغلقة تمنع الرياح الخارجية من تحريك الشعر.', 'windowState');

  const clutter = getInsideClutterItems(state.clutterLevel);
  if (vehicleState?.moving && seat?.role === 'driver' && state.clutterLevel === 'heavy') add(issues, 'error', 'HEAVY_CLUTTER_DRIVER', 'الفوضى الشديدة أثناء القيادة قد تعيق التحكم والوصول للكونسول؛ خفّضها في الوضع الصارم.', 'clutterLevel');
  if (clutter.some((item) => !item.prompt)) add(issues, 'fatal', 'CLUTTER_PHYSICS_MISSING', 'عنصر فوضى بلا قواعد تماس/جاذبية.', 'clutterLevel');

  return issues;
}
