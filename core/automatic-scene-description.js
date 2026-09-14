import { sceneMeta, baseSceneTypeFor } from './scene-type-expansion.js';

function clean(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function familyPhysics(baseType, smartValue) {
  if (/mirror/i.test(baseType) || /mirror/i.test(smartValue)) {
    return 'Keep the phone, hand, body and mirror plane geometrically consistent. The reflected phone must exist in the mirror, no duplicate viewpoints are allowed, and intended readable text should remain legible to the viewer.';
  }
  if (/inside_car/i.test(baseType) || /car/i.test(smartValue)) {
    return 'Keep the camera reachable at ordinary arm length, preserve seat/body contact, coherent cabin left-right geometry, correct glazing reflections, dashboard/seat scale and realistic light falloff through the cabin.';
  }
  if (/third_person|full_body|candid/i.test(baseType)) {
    return 'The subject is not holding the camera. Preserve realistic photographer distance, perspective, body scale, ground or seat contact and environmental depth. Never introduce selfie-arm geometry.';
  }
  if (/walking/i.test(baseType) || /walking/i.test(smartValue)) {
    return 'Preserve believable gait phase, torso balance, arm reach, mild handheld instability, background parallax and subtle motion cues without frozen fashion-pose stiffness.';
  }
  return 'Keep camera reach, body support, perspective, contact mechanics, lighting causality, material response and environmental scale physically coherent.';
}

function contextImperfections(smartValue) {
  if (/gym|workout/i.test(smartValue)) return 'Allow subtle sweat, mild facial flushing, loose hair strands and realistic athletic-fabric tension.';
  if (/rain|wet/i.test(smartValue)) return 'Allow wet-surface reflections, small water accumulation, damp fabric response and imperfect specular breakup.';
  if (/wind/i.test(smartValue)) return 'Let hair, loose fabric and headwear respond asymmetrically to wind direction and gravity.';
  if (/night|phone_screen/i.test(smartValue)) return 'Allow shadow noise, modest highlight clipping, local color casts and stronger falloff into dark background areas.';
  return 'Allow small posture asymmetry, ordinary fabric wrinkles, subtle environmental wear, mild handheld imperfection and non-uniform background spacing.';
}

export function buildAutomaticSceneDescription(input = {}) {
  const smartValue = clean(input.smartSceneType || input.sceneType || 'front_selfie');
  const meta = sceneMeta(smartValue);
  const baseType = baseSceneTypeFor(smartValue);
  const sceneLabel = clean(meta?.label || input.sceneLabel || smartValue.replaceAll('_', ' '));
  const scenePrompt = clean(meta?.prompt || input.scenePrompt);
  const location = clean(input.location);
  const clothing = clean(input.clothing);
  const pose = clean(input.pose);
  const angle = clean(input.angle);
  const lighting = clean(input.lighting);
  const lightingNotes = clean(input.lightingNotes);

  const details = [
    scenePrompt ? `Scene action: ${scenePrompt}.` : '',
    location ? `Location context: ${location}.` : '',
    clothing ? `Clothing behavior: ${clothing}.` : '',
    pose ? `Body action: ${pose}.` : '',
    angle ? `Camera relation: ${angle}.` : '',
    lighting ? `Physical light: ${lighting}.` : '',
    lightingNotes ? `Additional light direction: ${lightingNotes}.` : ''
  ].filter(Boolean).join(' ');

  return [
    `AUTO SCENE SYNTHESIS — ${sceneLabel}.`,
    details,
    `Physical coherence: ${familyPhysics(baseType, smartValue)}`,
    `Authentic imperfections: ${contextImperfections(smartValue)}`,
    'Context consistency: accessories, background objects, clothing, expression and activity must all make sense together. Prefer an ordinary real moment over a staged pose or showroom presentation.',
    'Anti-staging: no invisible studio key light, no advertising pose, no impossible camera placement, no generic luxury substitution, and no background element that conflicts with the selected activity.'
  ].filter(Boolean).join(' ');
}
