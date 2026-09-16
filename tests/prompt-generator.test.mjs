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
  assert.match(quiet.prompt, /no background people/i);
  assert.doesNotMatch(quiet.prompt, /1-2 independently behaving background people/i);
  assert.match(normal.prompt, /1-2 independently behaving background people/i);
  assert.match(lively.prompt, /5 to 7 background people/i);
  assert.doesNotMatch(lively.prompt, /3-5 independently behaving background people/i);
});

test('bedroom lively activity is corrected and no other people appear', () => {
  const result = generateImagePrompt({
    sceneType: 'mirror_bedroom_selfie',
    location: 'inside a Saudi bedroom with ordinary room lamps',
    backgroundActivity: 'lively',
    lighting: 'phone-screen-only lighting'
  });
  const scene = result.prompt.split('[SCENE]\n')[1].split('\n\n[SAUDI CULTURAL DRESS]')[0];
  assert.equal(result.config.background_activity, 'normal');
  assert.deepEqual(result.config.background_activity_allowed, ['quiet', 'normal']);
  assert.match(scene, /no other people appear in this frame/i);
  assert.doesNotMatch(scene, /5 to 7 background people/i);
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
  const scene = result.prompt.split('[SCENE]\n')[1].split('\n\n[SAUDI CULTURAL DRESS]')[0];
  assert.match(scene, /5 to 7 background people/i);
  assert.match(scene, /men in white thobes/i);
  assert.match(scene, /women in plain black abayas with black niqabs/i);
  assert.match(scene, /shopping bag/i);
  assert.match(scene, /walking, standing/i);
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
  const cameraGeometry = result.prompt.split('[CAMERA GEOMETRY]\n')[1].split('\n\n[PHYSICAL LIGHTING]')[0];
  assert.doesNotMatch(cameraGeometry, /21mm-equivalent|f\/\d/i);
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

test('formal looks contains 122 unique complete outfits', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  assert.equal(FORMAL_LOOKS.length, 122);
  const labels = FORMAL_LOOKS.map((look) => look.label);
  assert.equal(new Set(labels).size, 122);
  for (const look of FORMAL_LOOKS) assert.ok(look.label.includes(' + بنطال'), `not a complete outfit: ${look.label}`);
});

test('FORMAL_LOOKS contains the 15 timeless colour combinations', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const requiredCombos = [
    'قميص كحلي + بنطال رمادي',
    'قميص أزرق فاتح + بنطال كحلي',
    'قميص أبيض + بنطال بيج',
    'قميص زيتي + بنطال بني تبغي',
    'قميص أسود + بنطال فحمي',
    'قميص بيج + بنطال أبيض',
    'قميص رمادي + بنطال أسود',
    'قميص أخضر مريمي + بنطال كريمي',
    'قميص وردي + بنطال رمادي',
    'قميص أبيض + بنطال كحلي',
    'قميص عنابي + بنطال رمادي',
    'قميص أسود + بنطال بيج',
    'قميص أزرق فولاذي + بنطال كاكي',
    'قميص أبيض + بنطال زيتي',
    'قميص فحمي + بنطال رمادي فاتح'
  ];
  const aliases = {
    'قميص كحلي + بنطال رمادي': 'قميص كحلي + بنطال رمادي متوسط',
    'قميص رمادي + بنطال أسود': 'قميص رمادي متوسط + بنطال أسود',
    'قميص وردي + بنطال رمادي': 'قميص وردي فاتح + بنطال رمادي متوسط',
    'قميص عنابي + بنطال رمادي': 'قميص عنابي + بنطال رمادي متوسط'
  };
  const labels = FORMAL_LOOKS.map((look) => look.label);
  for (const combo of requiredCombos) {
    assert.ok(labels.includes(combo) || labels.includes(aliases[combo]), `Missing timeless combination: ${combo}`);
  }
});

test('no duplicate color pairs', async () => {
  const { FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const pairs = FORMAL_LOOKS.map((look) => look.label);
  assert.equal(new Set(pairs).size, pairs.length);
});

test('no clothing item duplicates a formal look', async () => {
  const { CLOTHING_OPTIONS, FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const clothingLabels = CLOTHING_OPTIONS.map((item) => item.label);
  const lookLabels = FORMAL_LOOKS.map((item) => item.label);
  const duplicates = clothingLabels.filter((label) => lookLabels.includes(label));
  assert.equal(duplicates.length, 0, `Duplicates: ${duplicates.join(', ')}`);
});

test('base clothing items contain no + outfit separator', async () => {
  const { CLOTHING_OPTIONS } = await import('../core/scene-builder.js');
  const withPlus = CLOTHING_OPTIONS.filter((item) => item.label.includes('+'));
  assert.equal(withPlus.length, 0, `Items with +: ${withPlus.map((item) => item.label).join(', ')}`);
});

test('CLOTHING_OPTIONS contains only the two base clothing groups', async () => {
  const { CLOTHING_OPTIONS } = await import('../core/scene-builder.js');
  const groups = [...new Set(CLOTHING_OPTIONS.map((item) => item.group))].sort();
  assert.deepEqual(groups, ['ثياب وتراث سعودي', 'كاجوال'].sort());
});

test('formal suits catalog contains 30 unique suits', async () => {
  const { FORMAL_SUITS } = await import('../core/scene-builder.js');
  assert.equal(FORMAL_SUITS.length, 30);
  const labels = FORMAL_SUITS.map((suit) => suit.label);
  assert.equal(new Set(labels).size, 30);
  const values = FORMAL_SUITS.map((suit) => suit.value);
  assert.equal(new Set(values).size, 30);
});

test('formal suits are distributed across 5 groups', async () => {
  const { FORMAL_SUITS } = await import('../core/scene-builder.js');
  const groups = new Set(FORMAL_SUITS.map((suit) => suit.group));
  assert.equal(groups.size, 5);
});

test('formal suits do not duplicate formal looks', async () => {
  const { FORMAL_SUITS, FORMAL_LOOKS } = await import('../core/scene-builder.js');
  const suitLabels = FORMAL_SUITS.map((suit) => suit.label);
  const lookLabels = FORMAL_LOOKS.map((look) => look.label);
  const duplicates = suitLabels.filter((label) => lookLabels.includes(label));
  assert.equal(duplicates.length, 0, `Duplicates: ${duplicates.join(', ')}`);
});

test('clothing UI group order is base, formal suits, then formal looks', async () => {
  const { CLOTHING_OPTIONS } = await import('../core/scene-builder.js');
  const baseGroups = [...new Set(CLOTHING_OPTIONS.map((item) => item.group))];
  assert.deepEqual([...baseGroups, 'بدلات رسمية كاملة', 'أطقم كاملة (قميص + بنطال)'], [
    'ثياب وتراث سعودي',
    'كاجوال',
    'بدلات رسمية كاملة',
    'أطقم كاملة (قميص + بنطال)'
  ]);
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

test('hair catalog contains 30 styling options across 7 groups', async () => {
  const { HAIR_STYLES } = await import('../core/scene-builder.js');
  assert.equal(HAIR_STYLES.length, 30);
  const groups = new Set(HAIR_STYLES.map((hair) => hair.group));
  assert.ok(groups.size >= 7);
  for (const style of HAIR_STYLES) {
    assert.ok(style.label.length > 5);
    assert.ok(style.prompt.length > 40);
  }
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

test('third-person scene does not mention front camera in accessories', () => {
  const result = generateImagePrompt({
    sceneType: 'third_person_portrait',
    location: 'day_parking'
  });
  const accessories = result.prompt.split('[CONTEXTUAL ACCESSORIES]\n')[1].split('\n\n[POSE & BODY MECHANICS]')[0];
  assert.doesNotMatch(accessories, /device: smartphone front camera/i);
  assert.match(accessories, /none held by the subject; photographed by another person/i);
  assert.match(result.prompt, /photographed by another person|not holding the camera/i);
});

test('formal look prompt is preserved verbatim in clothing section', async () => {
  const { EXTRA_CLOTHING_OPTIONS } = await import('../core/expanded-catalogs.js');
  const look = EXTRA_CLOTHING_OPTIONS.find((item) => item.value === 'navy_suit_lightblue_shirt');
  assert.ok(look, 'missing navy suit + light-blue shirt catalog entry');
  const result = generateImagePrompt({ clothing: look.prompt });
  const clothing = result.prompt.split('[CLOTHING]\n')[1].split('\n\n[CONTEXTUAL ACCESSORIES]')[0];
  assert.ok(clothing.startsWith(look.prompt), 'clothing section should begin with the exact selected catalog prompt');
  assert.match(clothing, /a navy two-piece suit with a light-blue dress shirt/i);
  assert.doesNotMatch(clothing, /a clean collared shirt with tailored trousers/i);
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
