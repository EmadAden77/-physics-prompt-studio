import { getCameraOptic, commonOption } from '../data/carSelfieCommonCatalog.js';
import { OUTSIDE_CATALOG, isOutsideOptionCompatible } from '../data/carSelfieOutsideCatalog.js';

const opt = (field, id) => (OUTSIDE_CATALOG[field] || []).find((item) => item.id === id) || null;
const add = (issues, severity, code, message, field) => issues.push(Object.freeze({ severity, code, message, field }));

export function validateOutsideState(state, issues = []) {
  const capture = opt('captureMode', state.captureMode);
  const lens = getCameraOptic(state.cameraLens);
  const place = commonOption('place', state.place);

  if (state.vehicleState !== 'parked-off' && state.vehicleState !== 'parked-engine-on') add(issues, 'error', 'OUTSIDE_VEHICLE_STATIONARY', 'وضع الخارج بجانب السيارة يتطلب مركبة متوقفة تمامًا.', 'vehicleState');
  if (!capture?.allowedLensIds.includes(state.cameraLens)) add(issues, 'error', 'OUTSIDE_CAPTURE_LENS', 'العدسة لا تتوافق مع هندسة الالتقاط الخارجية المختارة.', 'cameraLens');
  if (!isOutsideOptionCompatible('cameraLens', state.cameraLens, state)) add(issues, 'error', 'OUTSIDE_CAMERA_COMPATIBILITY', 'تركيبة العدسة والالتقاط الخارجية غير قابلة للتنفيذ.', 'cameraLens');

  if (state.distance < capture.distanceRangeCm[0] || state.distance > capture.distanceRangeCm[1]) add(issues, 'error', 'OUTSIDE_CAMERA_DISTANCE', `المسافة الواقعية لهذا الالتقاط هي ${capture.distanceRangeCm[0]}–${capture.distanceRangeCm[1]} سم.`, 'distance');
  if (Math.abs(state.yaw) > capture.maxAbsYawDeg || Math.abs(state.pitch) > capture.maxAbsPitchDeg || Math.abs(state.roll) > capture.maxAbsRollDeg) add(issues, 'error', 'OUTSIDE_CAMERA_ANGLE', 'Yaw/Pitch/Roll تتجاوز هندسة التقاط خارجية واقعية.', 'yaw');

  if (state.captureMode === 'handheld-front' && lens?.side !== 'front') add(issues, 'error', 'OUTSIDE_HANDHELD_FRONT_ONLY', 'السيلفي اليدوي الخارجي يستخدم الكاميرا الأمامية فقط.', 'cameraLens');
  if (state.captureMode === 'remote-rear' && lens?.side !== 'rear') add(issues, 'error', 'REMOTE_REAR_REQUIRED', 'التصوير الخلفي 23/70mm يتطلب هاتفًا ثابتًا أو مؤقتًا/ريموت، وليس سيلفي يدويًا.', 'cameraLens');
  if (state.cameraLens === 'rear-tele-70' && state.distance < 170) add(issues, 'error', 'TELE70_OUTSIDE_DISTANCE', 'عدسة 70mm تحتاج مسافة أكبر بجانب السيارة؛ استخدم تقريبًا 170 سم أو أكثر لتجنب كادر مختنق.', 'distance');

  if (state.hairMotion === 'cabin-airflow') add(issues, 'error', 'CABIN_AIRFLOW_OUTSIDE', 'هواء المكيف الداخلي لا ينتمي لوضع الوقوف خارج السيارة.', 'hairMotion');
  if (place?.kind === 'indoor-parking' && ['light-breeze', 'moderate-breeze'].includes(state.hairMotion)) add(issues, 'error', 'GARAGE_WIND_CONFLICT', 'موقف تحت الأرض لا يبرر نسمة خارجية مستمرة على الشعر.', 'hairMotion');
  if (state.hairMotion === 'moderate-breeze' && state.weather === 'indoor-controlled') add(issues, 'error', 'WEATHER_HAIR_CONFLICT', 'حركة الشعر المتوسطة تحتاج هواء خارجيًا فعليًا.', 'hairMotion');

  if (state.standingPose === 'open-rear-door' && state.framing === 'chest-up-car-context') add(issues, 'warning', 'DOOR_ACTION_CROP', 'الكادر القريب قد يخفي اليد/الباب ويجعل فعل فتح الباب غير مقروء؛ نصف جسم أو ثلاثة أرباع أوضح.', 'framing');
  if (state.standingPose === 'look-car' && state.gazeTarget !== 'car') add(issues, 'error', 'POSE_GAZE_CONFLICT', 'وضعية النظر إلى السيارة تتطلب Gaze Target = السيارة.', 'gazeTarget');
  if (state.standingPose === 'look-camera' && state.gazeTarget !== 'camera') add(issues, 'error', 'POSE_GAZE_CONFLICT', 'وضعية النظر للكاميرا تتطلب Gaze Target = الكاميرا.', 'gazeTarget');

  return issues;
}
