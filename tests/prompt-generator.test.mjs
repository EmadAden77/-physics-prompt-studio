import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImagePrompt, validateGeneratedPrompt, validateRealism } from '../core/prompt-generator.js';

const canonical = [
  'GOAL','ACTION-DRIVEN AUTHENTICITY','CAPTURE TYPE LOCK — CRITICAL','IDENTITY / SUBJECT','SCENE','SAUDI CULTURAL DRESS',
  'OBSERVABLE BACKGROUND ELEMENTS','CLOTHING','CONTEXTUAL ACCESSORIES','POSE & BODY MECHANICS','CAMERA GEOMETRY',
  'PHYSICAL LIGHTING','MIRROR RULES','PRODUCT INTEGRATION','PHYSICAL / MATERIAL REALISM','SMARTPHONE IMAGE BEHAVIOR',
  'LENS_PHYSICS','BIOLOGICAL_MICRO_REALISM','CAMERA_METADATA_HINT','AUTHENTIC IMPERFECTIONS',
  'USER CONSTRAINTS','NEGATIVE CONSTRAINTS','FINAL VERIFICATION'
];

function headings(prompt) {
  return [...prompt.matchAll(/^\[([^\]]+)\]$/gm)].map((match) => match[1]);
}

function cameraGeometry(prompt) {
  return prompt.split('[CAMERA GEOMETRY]\n')[1].split('\n\n[PHYSICAL LIGHTING]')[0];
}

function observableBackground(prompt) {
  return prompt.split('[OBSERVABLE BACKGROUND ELEMENTS]\n')[1].split('\n\n[CLOTHING]')[0];
}

test('generates a complete prompt without free-form source text', () => {
  const result = generateImagePrompt();
  assert.equal(result.validation.valid, true);
  assert.ok(result.prompt.includes('[GOAL]'));
  assert.ok(result.prompt.includes('[ACTION-DRIVEN AUTHENTICITY]'));
  assert.ok(result.prompt.includes('[FINAL VERIFICATION]'));
  assert.ok(result.prompt.length > 3000);
});

test('generated prompt has exactly the 23 canonical sections in order', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.deepEqual(headings(result.prompt), canonical);
  assert.equal(result.sections.length, 23);
  assert.equal(result.prompt.includes('[HAIR_STYLE_LOCK]'), false);
  assert.equal(result.prompt.includes('[SAUDI CULTURAL DRESS]'), true);
  assert.equal(result.prompt.includes('[CONTROLLED PHYSICAL IMPERFECTIONS]'), false);
});

test('selected scene controls are injected into the generated prompt', () => {
  const result = generateImagePrompt({
    sceneType: 'standing_selfie',
    location: 'inside a modern Saudi majlis',
    clothing: 'a dark navy Saudi thobe',
    pose: 'standing naturally near the seating edge',
    angle: 'slightly above eye level',
    lighting: 'warm practical ceiling lights',
    aspectRatio: '9:16'
  });
  for (const token of ['modern Saudi majlis','dark navy Saudi thobe','standing naturally','slightly above eye level','warm practical ceiling lights']) {
    assert.ok(result.prompt.includes(token), `missing ${token}`);
  }
});

test('physical lighting explicitly separates illumination from exposure processing', () => {
  const result = generateImagePrompt({ lighting: 'localized white LED parking lights' });
  assert.ok(result.prompt.includes('Physical illumination alone determines'));
  assert.ok(result.prompt.includes('Exposure, ISO, HDR'));
  assert.equal(validateGeneratedPrompt(result.prompt, { realismPacket: result.realism_packet, sceneType: { capture: result.config.capture_type }, saudiContext: result.config.saudi_context }).valid, true);
});

test('raw realism adds specific underexposure instructions', () => {
  const result = generateImagePrompt({ realismLevel: 'raw' });
  const lighting = result.prompt.split('[PHYSICAL LIGHTING]\n')[1].split('\n\n[MIRROR RULES]')[0];
  assert.match(lighting, /Deliberately underexposed in midtones and shadows/i);
  assert.match(lighting, /visible noise in shadow regions/i);
  assert.match(lighting, /Do not lift shadows with HDR/i);
  assert.match(lighting, /Slight motion blur from handheld capture is acceptable/i);
  assert.match(lighting, /White balance may be slightly off-neutral/i);
});

test('selfie modes lock reachable subject-held geometry', () => {
  const result = generateImagePrompt({ sceneType: 'inside_car_selfie' });
  assert.ok(result.prompt.includes('subject-held smartphone selfie'));
  assert.match(result.prompt, /reachable|arm-reach|arm length/i);
  assert.match(result.prompt, /third-person viewpoint|third-person camera/i);
});

test('pose section does not fallback to scene prompt when pose selected', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', pose: 'standing_relaxed' });
  const poseSection = result.prompt.split('[POSE & BODY MECHANICS]\n')[1].split('\n\n[CAMERA GEOMETRY]')[0];
  assert.match(poseSection, /standing naturally/i);
  assert.doesNotMatch(poseSection, /a casual subject-held front-camera smartphone selfie/i);
});

test('third-person mode does not silently become selfie capture', () => {
  const result = generateImagePrompt({ sceneType: 'third_person_portrait', camera: 'smartphone_rear' });
  assert.ok(result.prompt.includes('third-person smartphone photograph'));
  assert.ok(result.prompt.includes('The subject is not holding the camera'));
  assert.match(result.prompt, /selfie arm/i);
});

test('identity reference can be disabled', () => {
  const result = generateImagePrompt({ identityReference: false });
  assert.ok(result.prompt.includes('No reference identity is required'));
  assert.equal(result.config.identity_reference, false);
});

test('selected hair style affects identity while length density and hairline remain locked', () => {
  const style = 'hair parted on the left side with a clean visible line, natural fall on both sides, density and hairline unchanged';
  const result = generateImagePrompt({ sceneType: 'front_selfie', hairStyle: style });
  assert.ok(result.prompt.includes(style));
  assert.match(result.prompt, /Hair length, density, hairline shape/i);
  assert.match(result.prompt, /Do not shorten, lengthen, thin, thicken/i);
  assert.equal(result.config.hair_style, style);
});

test('realism JSON packet exposes required subject accessories photography and background fields', () => {
  const result = generateImagePrompt({ sceneType: 'cafe_selfie' });
  assert.equal(result.realism_packet.methodology, 'REALISTIC IMAGE GENERATOR');
  for (const key of ['subject', 'accessories', 'photography', 'background']) assert.ok(result.realism_packet[key], `missing ${key}`);
  assert.ok(Array.isArray(result.realism_packet.background.elements));
  assert.ok(Array.isArray(result.realism_packet.imperfections));
});

test('background activity controls people count without cross-section conflict', () => {
  const quiet = generateImagePrompt({ sceneType: 'front_selfie', backgroundActivity: 'quiet' });
  const normal = generateImagePrompt({ sceneType: 'front_selfie', backgroundActivity: 'normal' });
  const lively = generateImagePrompt({ sceneType: 'front_selfie', backgroundActivity: 'lively' });
  assert.match(quiet.prompt, /no other people appear in this frame/i);
  assert.doesNotMatch(quiet.prompt, /1-2 independently behaving background people/i);
  assert.match(normal.prompt, /1-2 independently behaving background people/i);
  assert.match(lively.prompt, /5 to 7 distinct background people/i);
  assert.doesNotMatch(lively.prompt, /3-5 independently behaving background people/i);
});

test('background human integrity rules are present when people are requested', () => {
  const result = generateImagePrompt({ backgroundActivity: 'lively' });
  assert.match(result.prompt, /perspective-consistent scale/i);
  assert.match(result.prompt, /ground contact/i);
  assert.match(result.prompt, /distinct identities/i);
});

test('background human integrity rules are absent when quiet', () => {
  const result = generateImagePrompt({ backgroundActivity: 'quiet' });
  assert.doesNotMatch(result.prompt, /perspective-consistent scale/i);
});

test('negatives include deformed background people bans', () => {
  const result = generateImagePrompt({ backgroundActivity: 'normal' });
  assert.match(result.prompt, /deformed background people/i);
  assert.match(result.prompt, /cloned background faces/i);
});

test('bedroom lively activity is corrected and no other people appear', () => {
  const result = generateImagePrompt({
    sceneType: 'mirror_bedroom_selfie',
    location: 'inside a Saudi bedroom with ordinary room lamps',
    backgroundActivity: 'lively',
    lighting: 'phone-screen-only lighting'
  });
  const background = observableBackground(result.prompt);
  assert.equal(result.config.background_activity, 'normal');
  assert.deepEqual(result.config.background_activity_allowed, ['quiet', 'normal']);
  assert.match(background, /no other people appear in this frame/i);
  assert.doesNotMatch(background, /5 to 7 background people/i);
  assert.match(result.config.context_warnings.join(' '), /النشاط تغيّر إلى normal/);
  assert.match(result.config.context_warnings.join(' '), /الإضاءة تغيّرت/);
  assert.doesNotMatch(result.config.lighting, /phone-screen-only/i);
});

test('lively Saudi retail scene specifies people types and actions', () => {
  const result = generateImagePrompt({
    sceneType: 'supermarket_selfie',
    location: 'inside an ordinary Saudi supermarket',
    backgroundActivity: 'lively',
    lighting: 'broad retail ceiling lighting'
  });
  const background = observableBackground(result.prompt);
  assert.match(background, /5 to 7 distinct background people/i);
  assert.match(background, /men in white thobes/i);
  assert.match(background, /women in plain black abayas with black niqabs/i);
  assert.match(background, /shopping bag/i);
  assert.match(background, /walking, standing/i);
});

test('dark car phone-only lighting excludes other visible light sources', () => {
  const result = generateImagePrompt({
    sceneType: 'inside_car_selfie',
    location: 'inside a stationary car at night in Saudi Arabia',
    backgroundActivity: 'quiet',
    lighting: 'phone-screen-only lighting',
    lightingNotes: 'add a warm cabin lamp'
  });
  const lighting = result.prompt.split('[PHYSICAL LIGHTING]\n')[1].split('\n\n[MIRROR RULES]')[0];
  assert.match(lighting, /No other light sources visible in frame/i);
  assert.doesNotMatch(lighting, /warm cabin lamp/i);
});

test('mirror selfie always emits mirror rules and final text-orientation guidance', () => {
  const result = generateImagePrompt({ sceneType: 'mirror_selfie' });
  assert.notEqual(result.realism_packet.subject.mirror_rules, 'not_applicable');
  assert.match(result.realism_packet.subject.mirror_rules, /forward and legible/i);
  assert.match(result.realism_packet.subject.mirror_rules, /reflection geometry/i);
  assert.ok(result.prompt.includes('[MIRROR RULES]'));
});

test('non-mirror scenes explicitly mark mirror rules not applicable', () => {
  const result = generateImagePrompt({ sceneType: 'inside_car_selfie' });
  assert.equal(result.realism_packet.subject.mirror_rules, 'not_applicable');
  assert.ok(result.prompt.includes('Mirror rules: not applicable'));
});

test('gym context is action-driven and receives fitness-specific imperfections and accessories', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', location: 'inside a modern Saudi gym', description: 'post-workout selfie after finishing a set' });
  assert.equal(result.realism_packet.template_type, 'Gym/Fitness Selfie');
  assert.match(result.realism_packet.action, /post-workout|recovering|water bottle/i);
  assert.match(result.realism_packet.accessories.jewelry, /no luxury jewelry/i);
  assert.ok(result.realism_packet.imperfections.some((item) => /sweat|flushed/i.test(item)));
});

test('camera wording is simpler while physical geometry remains enforced separately', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', camera: 'xiaomi15_front' });
  assert.ok(result.prompt.includes('Xiaomi 15 Ultra front camera with a natural wide selfie look'));
  const geometry = cameraGeometry(result.prompt);
  assert.doesNotMatch(geometry, /21mm-equivalent|f\/\d/i);
  assert.ok(result.prompt.includes('[CAMERA GEOMETRY]'));
});

test('camera metadata follows the selected camera instead of always claiming Xiaomi', () => {
  const iphone = generateImagePrompt({ sceneType: 'front_selfie', camera: 'iphone15pm_front' });
  const metadata = iphone.prompt.split('[CAMERA_METADATA_HINT]\n')[1].split('\n\n[AUTHENTIC IMPERFECTIONS]')[0];
  assert.match(metadata, /iPhone 15 Pro Max/i);
  assert.doesNotMatch(metadata, /Xiaomi 15 Ultra/i);
});

test('every generated prompt contains the three mandatory realism sections', () => {
  for (const sceneType of ['front_selfie', 'inside_car_selfie', 'mirror_selfie', 'third_person_portrait']) {
    const result = generateImagePrompt({ sceneType });
    assert.ok(result.prompt.includes('[LENS_PHYSICS]'), sceneType);
    assert.ok(result.prompt.includes('[BIOLOGICAL_MICRO_REALISM]'), sceneType);
    assert.ok(result.prompt.includes('[CAMERA_METADATA_HINT]'), sceneType);
    assert.equal(result.validation.valid, true, `${sceneType} failed validation: ${result.validation.errors.join(' | ')}`);
  }
});

test('realism sections include physical photographic language', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.match(result.prompt, /chromatic aberration/i);
  assert.match(result.prompt, /visible skin pores/i);
  assert.match(result.prompt, /corneal reflections/i);
  assert.match(result.prompt, /stray hairs/i);
  assert.match(result.prompt, /vignetting/i);
});

test('negatives include anti-AI-tell bans', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  const negativeSection = result.prompt.split('[NEGATIVE CONSTRAINTS]')[1]?.split('[FINAL VERIFICATION]')[0] || '';
  for (const phrase of ['plastic skin', 'symmetric face', 'beauty filtering', 'missing corneal reflections']) assert.ok(negativeSection.toLowerCase().includes(phrase), phrase);
});

test('negative constraints use positive framing without double negatives', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  const negativeSection = result.prompt.split('[NEGATIVE CONSTRAINTS]')[1]?.split('[FINAL VERIFICATION]')[0] || '';
  const lines = negativeSection.split(',').map((s) => s.trim()).filter(Boolean);
  const doubleNegatives = lines.filter((line) => /^no /i.test(line));
  assert.equal(doubleNegatives.length, 0, `Double negatives found: ${doubleNegatives.join(' | ')}`);
});

test('cultural dress rules are in a separate section', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.match(result.prompt, /SAUDI CULTURAL DRESS|cultural context — saudi/i);
});

test('validateRealism rejects positive banned terms', () => {
  const bad = 'A portrait with perfect skin and studio lighting, beautifully airbrushed';
  const result = validateRealism(bad);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.message.includes('perfect skin')));
  assert.ok(result.errors.some((e) => e.message.includes('studio lighting')));
});

test('validateRealism does not reject explicitly negated banned terms', () => {
  const text = 'visible skin pores, chromatic aberration, corneal reflections, stray hairs. Do not use studio lighting. No DSLR bokeh.';
  assert.equal(validateRealism(text).valid, true);
});

test('validateRealism accepts physically plausible prompts', () => {
  const good = 'A photo with visible skin pores, chromatic aberration near corners, corneal reflections showing the scene, and 5-12 stray hairs in the visible hair mass';
  const result = validateRealism(good);
  assert.equal(result.valid, true);
});

test('every generated prompt passes validateRealism', () => {
  for (const sceneType of ['front_selfie', 'inside_car_selfie', 'mirror_selfie', 'third_person_portrait']) {
    const result = generateImagePrompt({ sceneType });
    assert.equal(result.realism_validation.valid, true, `${sceneType} failed realism validation: ${result.realism_validation.errors.map((e) => e.message).join(' | ')}`);
  }
});

test('generated prompt exposes realism_validation in output object', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.ok(result.realism_validation, 'missing realism_validation');
  assert.equal(typeof result.realism_validation.valid, 'boolean');
  assert.ok(Array.isArray(result.realism_validation.errors));
  assert.ok(Array.isArray(result.realism_validation.warnings));
});

test('every Saudi scene enforces cultural dress lock in the dedicated section', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', location: 'inside an ordinary Saudi cafe' });
  const scene = result.prompt.split('[SCENE]\n')[1].split('\n\n[SAUDI CULTURAL DRESS]')[0];
  const culture = result.prompt.split('[SAUDI CULTURAL DRESS]\n')[1].split('\n\n[OBSERVABLE BACKGROUND ELEMENTS]')[0];
  assert.doesNotMatch(scene, /CULTURAL CONTEXT — SAUDI/);
  assert.match(culture, /CULTURAL CONTEXT — SAUDI/);
  assert.match(culture, /black abaya/i);
  assert.match(culture, /black niqab/i);
  assert.match(culture, /Do not show exposed hair, uncovered female faces, or Western-style female clothing/i);
});

test('Saudi cultural rules stay out of technical negative constraints and non-Saudi scenes do not receive Saudi rules', () => {
  const saudi = generateImagePrompt({ sceneType: 'front_selfie', location: 'saudi_office' });
  const culture = saudi.prompt.split('[SAUDI CULTURAL DRESS]\n')[1].split('\n\n[OBSERVABLE BACKGROUND ELEMENTS]')[0];
  const negatives = saudi.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  assert.match(culture, /uncovered female faces/i);
  assert.match(culture, /Western-style female clothing/i);
  assert.doesNotMatch(negatives, /uncovered female faces|Western-style female clothing|exposed women'?s hair/i);
  const paris = generateImagePrompt({ sceneType: 'front_selfie', location: 'inside a cafe in Paris, France' });
  assert.equal(paris.config.saudi_context, false);
  assert.doesNotMatch(paris.prompt, /CULTURAL CONTEXT — SAUDI/i);
  const parisCulture = paris.prompt.split('[SAUDI CULTURAL DRESS]\n')[1].split('\n\n[OBSERVABLE BACKGROUND ELEMENTS]')[0];
  assert.match(parisCulture, /Not applicable/i);
});

test('hair style lock is merged into IDENTITY SUBJECT rather than emitted as an extra section', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  const identity = result.prompt.split('[IDENTITY / SUBJECT]\n')[1].split('\n\n[SCENE]')[0];
  assert.match(identity, /Hair length, density, hairline shape/i);
  assert.match(identity, /Do not shorten/i);
  assert.equal(result.prompt.includes('[HAIR_STYLE_LOCK]'), false);
});

test('expanded scene type values resolve to their real base capture family', () => {
  const result = generateImagePrompt({ sceneType: 'inside_car_driver_selfie' });
  assert.equal(result.config.requested_scene_type, 'inside_car_driver_selfie');
  assert.equal(result.config.scene_type, 'inside_car_selfie');
  assert.match(result.prompt, /driver-seat selfie/i);
});

test('third-person car scene does not use car-interior action or imperfections', () => {
  const result = generateImagePrompt({
    sceneType: 'third_person_car_adjacent',
    location: 'day_parking'
  });
  assert.equal(result.realism_packet.template_type, 'Third-Person Photo Beside a Parked Car');
  assert.match(result.prompt, /standing beside a parked vehicle/i);
  assert.doesNotMatch(result.prompt, /cabin shadow noise/i);
  assert.doesNotMatch(result.prompt, /seated naturally in a stationary car/i);
  assert.doesNotMatch(result.prompt, /minor fabric creasing from the seat/i);
  assert.equal(result.config.camera, 'smartphone_rear');
});

test('third-person scene does not duplicate device semantics in accessories', () => {
  const result = generateImagePrompt({
    sceneType: 'third_person_portrait',
    location: 'day_parking'
  });
  const accessories = result.prompt.split('[CONTEXTUAL ACCESSORIES]\n')[1].split('\n\n[POSE & BODY MECHANICS]')[0];
  assert.doesNotMatch(accessories, /device:/i);
  assert.doesNotMatch(accessories, /none held by the subject; photographed by another person/i);
  assert.match(result.prompt, /photographed by another person|not holding the camera/i);
});

test('formal look prompt is preserved verbatim in clothing section', async () => {
  const { CLOTHING_CATALOG } = await import('../core/scene-builder.js');
  const look = CLOTHING_CATALOG.find((item) => item.value === 'suit-navy-lightblue');
  assert.ok(look, 'missing navy suit + light-blue shirt catalog entry');
  const result = generateImagePrompt({ clothing: look.prompt });
  const clothing = result.prompt.split('[CLOTHING]\n')[1].split('\n\n[CONTEXTUAL ACCESSORIES]')[0];
  assert.ok(clothing.startsWith(look.prompt), 'clothing section should begin with the exact selected catalog prompt');
  assert.match(clothing, /a navy two-piece suit with a light-blue dress shirt/i);
  assert.doesNotMatch(clothing, /a clean collared shirt with tailored trousers/i);
});


test('expressions catalog contains 25 anatomical expressions', async () => {
  const { EXPRESSIONS } = await import('../core/prompt-generator.js');
  assert.equal(EXPRESSIONS.length, 25);
});

test('every expression mentions an anatomical muscle or feature', async () => {
  const { EXPRESSIONS } = await import('../core/prompt-generator.js');
  const anatomy = /zygomaticus|orbicularis|corrugator|frontalis|levator|mentalis|procerus|depressor|risorius|lip|eyelid|brow|cheek|mouth|jaw|chin/i;
  for (const expr of EXPRESSIONS) {
    assert.match(expr.prompt, anatomy, `${expr.value} has no anatomical detail`);
  }
});

test('only laughing-soft reveals teeth', async () => {
  const { EXPRESSIONS } = await import('../core/prompt-generator.js');
  const teeth = EXPRESSIONS.filter(e => /\bteeth\b/i.test(e.prompt));
  assert.equal(teeth.length, 1);
  assert.equal(teeth[0].value, 'laughing-soft');
});

test('expressions catalog has no duplicate values or labels', async () => {
  const { EXPRESSIONS } = await import('../core/prompt-generator.js');
  const values = EXPRESSIONS.map(e => e.value);
  const labels = EXPRESSIONS.map(e => e.label);
  assert.equal(new Set(values).size, values.length);
  assert.equal(new Set(labels).size, labels.length);
});

test('bedroom_selfie does not contain mirror rules', () => {
  const result = generateImagePrompt({ sceneType: 'bedroom_selfie' });
  assert.match(result.prompt, /Mirror rules: not applicable/i);
  assert.doesNotMatch(result.prompt, /true mirror selfie/i);
  assert.doesNotMatch(result.prompt, /mirror smudges/i);
  assert.doesNotMatch(result.prompt, /candid mirror moment/i);
});

test('bedroom_mirror_selfie contains mirror rules', () => {
  const result = generateImagePrompt({ sceneType: 'bedroom_mirror_selfie' });
  assert.match(result.prompt, /true mirror selfie/i);
  const mirrorSection = result.prompt.split('[MIRROR RULES]\n')[1].split('\n\n[PRODUCT INTEGRATION]')[0];
  assert.doesNotMatch(mirrorSection, /Mirror rules: not applicable/i);
});

test('detectScenario prioritizes captureType over keyword haystack', async () => {
  const { buildRealismPacket } = await import('../core/realistic-image-generator.js');
  const packet = buildRealismPacket({
    sceneType: 'bedroom_selfie',
    captureType: 'subject-held front-camera smartphone selfie',
    description: 'a bedroom with a mirror on the wardrobe door'
  });
  assert.notEqual(packet.template_type, 'Mirror Selfie');
  assert.doesNotMatch(packet.action, /mirror moment/i);
});

test('bedroom with mirror furniture is not classified as mirror selfie', async () => {
  const { buildRealismPacket } = await import('../core/realistic-image-generator.js');
  const packet = buildRealismPacket({
    sceneType: 'bedroom_selfie',
    captureType: 'subject-held front-camera smartphone selfie',
    location: 'a bedroom with a full-length mirror on the wardrobe door'
  });
  assert.equal(packet.subject.mirror_rules, 'not_applicable');
});

test('bed-lying-side uses mattress-level camera hint', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: 'bed-lying-side'
  });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /mattress level|beside the face/i);
  assert.doesNotMatch(geometry, /yaw 0°, pitch 0°/i);
});

test('bed-lying-back uses overhead camera hint', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: 'bed-lying-back'
  });
  assert.match(cameraGeometry(result.prompt), /above the face|pointing downward/i);
});

test('standing poses still use eye level', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: 'bedroom-stand-relaxed'
  });
  assert.match(cameraGeometry(result.prompt), /eye level/i);
});

test('bedroom camera hint resolves the pose prompt used by the UI, not only the pose value', async () => {
  const { BEDROOM_POSES } = await import('../core/scene-builder.js');
  const side = BEDROOM_POSES.find((item) => item.value === 'bed-lying-side');
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: side.prompt,
    angle: 'front camera at approximately eye level, yaw 0°, pitch 0°, with a tiny natural handheld roll'
  });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /mattress level|beside the face/i);
  assert.doesNotMatch(geometry, /yaw 0°, pitch 0°/i);
});

test('bedroom third-person capture never receives a front-camera bedroom pose hint', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_third_person',
    pose: 'bed-lying-side'
  });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /third-person smartphone shooting distance/i);
  assert.doesNotMatch(geometry, /mattress level|beside the face/i);
});

test('non-bedroom selfie keeps the previous default camera-angle fallback', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /natural eye-level or slightly off-axis camera angle/i);
  assert.doesNotMatch(geometry, /front camera at eye level with a tiny natural handheld roll/i);
});

test('pose cameraHint wins over explicit angle in bedroom scenes', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: 'bed-lying-back',
    angle: 'eye_centered'
  });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /above the face|pointing downward/i);
  assert.doesNotMatch(geometry, /eye level.*yaw 0/i);
});

test('explicit angle remains authoritative outside bedroom', () => {
  const result = generateImagePrompt({
    sceneType: 'front_selfie',
    pose: 'standing_relaxed',
    angle: 'eye_centered'
  });
  assert.match(cameraGeometry(result.prompt), /eye level/i);
  assert.equal(result.config.angle_locked_by_pose, false);
});

test('pose with cameraHint shows warning in config', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: 'bed-lying-side'
  });
  assert.equal(result.config.angle_locked_by_pose, true);
});

test('standing bedroom pose keeps explicit angle authoritative', () => {
  const result = generateImagePrompt({
    sceneType: 'bedroom_selfie',
    pose: 'bedroom-stand-relaxed',
    angle: 'slightly_low_center'
  });
  assert.equal(result.config.angle_locked_by_pose, false);
  assert.match(cameraGeometry(result.prompt), /slightly below eye level|gentle upward pitch/i);
});

test('smart angle is deterministic for the same standing seed', () => {
  const first = generateImagePrompt({ sceneType: 'standing_selfie', pose: 'standing_relaxed', angle: 'smart', seed: 42 });
  const second = generateImagePrompt({ sceneType: 'standing_selfie', pose: 'standing_relaxed', angle: 'smart', seed: 42 });
  assert.equal(first.config.angle, second.config.angle);
  assert.equal(cameraGeometry(first.prompt), cameraGeometry(second.prompt));
});

test('smart angle varies for different standing seeds', () => {
  const seedOne = generateImagePrompt({ sceneType: 'standing_selfie', pose: 'standing_relaxed', angle: 'smart', seed: 1 });
  const seedFortyTwo = generateImagePrompt({ sceneType: 'standing_selfie', pose: 'standing_relaxed', angle: 'smart', seed: 42 });
  assert.notEqual(seedOne.config.angle, seedFortyTwo.config.angle);
});

test('bed-lying-side smart angle still yields the bedroom cameraHint', () => {
  const result = generateImagePrompt({ sceneType: 'bedroom_selfie', pose: 'bed-lying-side', angle: 'smart', seed: 999 });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /mattress level|beside the face/i);
  assert.equal(result.config.angle_locked_by_pose, true);
});

test('third-person smart request never resolves through SELFIE_ANGLES', async () => {
  const { SELFIE_ANGLES } = await import('../core/scene-builder.js');
  const result = generateImagePrompt({ sceneType: 'third_person_portrait', angle: 'smart', seed: 42 });
  const geometry = cameraGeometry(result.prompt);
  assert.match(geometry, /natural third-person smartphone angle/i);
  for (const selfieAngle of SELFIE_ANGLES) assert.equal(geometry.includes(selfieAngle.prompt), false, selfieAngle.value);
});

test('seeded randomizer keeps angle smart instead of choosing an explicit angle', async () => {
  const { buildSeededSceneState } = await import('../app.js');
  const state = buildSeededSceneState(42, [{ value:'standing_selfie' }], () => ({
    location:[{ value:'ordinary_saudi_street' }], clothing:[{ value:'thobe-white' }], pose:[{ value:'standing_relaxed' }],
    angle:[{ value:'eye_centered' },{ value:'slightly_high_center' }], lighting:[{ value:'day_open_shade' }], camera:[{ value:'xiaomi15_front' }],
    framing:[{ value:'chest_up' }], expression:[{ value:'neutral' }], backgroundActivity:[{ value:'normal' }], realismLevel:[{ value:'strict' }],
    aspectRatio:[{ value:'9:16' }], hairStyle:[{ value:'natural' }]
  }));
  assert.equal(state.angle, 'smart');
});

test('validateRealism rejects a positive banned term in its own clause', () => {
  const text = 'A portrait with perfect skin. visible skin pores, chromatic aberration, corneal reflections, stray hairs.';
  assert.equal(validateRealism(text).valid, false);
});

test('validateRealism keeps negation local to the same clause', () => {
  const text = 'Do not use studio lighting. visible skin pores, chromatic aberration, corneal reflections, stray hairs.';
  assert.equal(validateRealism(text).valid, true);
});

test('validateRealism does not let negation cross sentence boundaries', () => {
  const text = 'No DSLR bokeh. Realistic DSLR bokeh was requested. visible skin pores, chromatic aberration, corneal reflections, stray hairs.';
  assert.equal(validateRealism(text).valid, false);
});

test('validateRealism does not let negative-section scope hide a later positive clause', () => {
  const text = '[NEGATIVE CONSTRAINTS]\nAvoid: no DSLR bokeh.\n\n[SCENE]\nA scene with DSLR bokeh.\n\nvisible skin pores, chromatic aberration, corneal reflections, stray hairs.';
  assert.equal(validateRealism(text).valid, false);
});