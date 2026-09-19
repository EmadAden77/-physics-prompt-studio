import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImagePrompt, validateGeneratedPrompt, validateRealism } from '../core/prompt-generator.js';
import { CLOTHING_CATALOG, HOME_CLOTHING, CLOTHING_STYLING, HAND_INTERACTIONS, HAND_PROPS, LIGHTING_PROFILES, POSE_HAND_USAGE, getAvailableProps, getRemainingHands } from '../core/scene-builder.js';
import { MIRROR_POSES } from '../core/scene-compatibility.js';
import { buildRealismPacket } from '../core/realistic-image-generator.js';

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
function lensPhysics(prompt) {
  return prompt.split('[LENS_PHYSICS]\n')[1].split('\n\n[BIOLOGICAL_MICRO_REALISM]')[0];
}
function actionSection(prompt) {
  return prompt.split('[ACTION-DRIVEN AUTHENTICITY]\n')[1].split('\n\n[CAPTURE TYPE LOCK — CRITICAL]')[0];
}
function metadataSection(prompt) {
  return prompt.split('[CAMERA_METADATA_HINT]\n')[1].split('\n\n[AUTHENTIC IMPERFECTIONS]')[0];
}
function sceneSection(prompt) {
  return prompt.split('[SCENE]\n')[1].split('\n\n[SAUDI CULTURAL DRESS]')[0];
}
function furnitureKinds(prompt) {
  const scene=sceneSection(prompt);
  const patterns={ sofa:/The sofa maintains/i, armchair:/The armchair is a single-seat/i, chair:/The chair has four legs/i, table:/The table has a continuous top/i, desk:/The desk has a flat working surface/i, bed:/The bed has a continuous frame/i, counter:/The counter is a continuous solid structure/i, generic:/All furniture maintains a coherent 3D structure/i };
  return Object.entries(patterns).filter(([,pattern])=>pattern.test(scene)).map(([kind])=>kind);
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
  const iphone = generateImagePrompt({ sceneType: 'front_selfie', camera: 'iphone15pm_front', lightingValue:'day_direct_sun', lighting:'direct daytime sunlight' });
  const metadata = metadataSection(iphone.prompt);
  assert.match(metadata, /iPhone 15 Pro Max/i);
  assert.doesNotMatch(metadata, /Xiaomi 15 Ultra/i);
  assert.match(metadata, /ISO 50-100.*1\/500-1\/1000s/i);
});

test('canonical lighting values map deterministically to metadata exposure classes', () => {
  const expected = {
    day_direct_sun:'midday',day_open_shade:'soft_day',day_overcast:'soft_day',day_window:'window_day',golden_hour:'golden',blue_sky_noon:'midday',car_daylight:'window_day',
    supermarket_fluorescent:'bright_indoor',retail_ceiling_led:'bright_indoor',mixed_retail:'bright_indoor',night_led_street:'night',night_parking_led:'night',night_storefront:'night',night_gas_station:'night',night_corniche:'night',night_desert_vehicle:'night',
    night_majlis_warm:'warm_indoor',night_cafe_mixed:'warm_indoor',night_office_led:'bright_indoor',night_home_warm:'warm_indoor',night_phone_screen:'very_low',night_car_practicals:'night',night_car_screen_only:'very_low',screen_flash_only:'very_low',phone_led_flash_only:'flash',low_key_bedroom:'very_low'
  };
  const patterns = {
    midday:/ISO 50-100.*1\/500-1\/1000s/i,golden:/ISO 100-200.*1\/250-1\/500s/i,soft_day:/ISO 100-250.*1\/125-1\/250s/i,window_day:/ISO 100-320.*1\/100-1\/200s/i,
    warm_indoor:/ISO 400-800.*1\/60-1\/100s/i,bright_indoor:/ISO 200-500.*1\/100-1\/125s/i,night:/ISO 800-1600.*1\/30-1\/60s/i,very_low:/ISO 1600-3200.*1\/15-1\/30s/i,flash:/ISO 100-400.*1\/60-1\/120s/i,unknown:/plausible automatic ISO and shutter behavior/i
  };
  assert.equal(LIGHTING_PROFILES.length,26);
  assert.deepEqual(new Set(LIGHTING_PROFILES.map((item)=>item.value)),new Set(Object.keys(expected)));
  for (const profile of LIGHTING_PROFILES) assert.match(metadataSection(generateImagePrompt({ sceneType:'front_selfie', lighting:profile.prompt, lightingValue:profile.value }).prompt),patterns[expected[profile.value]],profile.value);
});

test('phone LED flash uses the dedicated flash exposure range', () => {
  const metadata=metadataSection(generateImagePrompt({ sceneType:'bedroom_third_person', camera:'smartphone_rear', lightingValue:'phone_led_flash_only', lighting:'pitch-dark bedroom with the phone rear LED flash as the ONLY light source' }).prompt);
  assert.match(metadata,/ISO 100-400.*1\/60-1\/120s/i);
});

test('Xiaomi midday and night metadata differ by lighting', () => {
  const midday=metadataSection(generateImagePrompt({ sceneType:'outdoor_selfie', camera:'xiaomi15_front', lightingValue:'blue_sky_noon', lighting:'strong high-elevation midday sun' }).prompt);
  const night=metadataSection(generateImagePrompt({ sceneType:'inside_car_selfie', camera:'xiaomi15_front', lightingValue:'night_car_practicals', lighting:'stationary car interior at night' }).prompt);
  assert.notEqual(midday,night);
  assert.match(midday,/ISO 50-100.*1\/500-1\/1000s/i);
  assert.match(night,/ISO 800-1600.*1\/30-1\/60s/i);
});

test('free-text metadata fallback keeps explicit priority and does not treat car as night', () => {
  const cases=[
    ['phone screen only in darkness',/ISO 1600-3200.*1\/15-1\/30s/i],
    ['night street practical lighting',/ISO 800-1600.*1\/30-1\/60s/i],
    ['direct midday sun outdoors',/ISO 50-100.*1\/500-1\/1000s/i],
    ['ordinary office fluorescent ceiling lighting',/ISO 200-800.*1\/60-1\/125s/i],
    ['ambiguous available light',/plausible automatic ISO and shutter behavior/i]
  ];
  for(const [lighting,expected] of cases) assert.match(metadataSection(generateImagePrompt({ sceneType:'front_selfie', lighting }).prompt),expected,lighting);
  const carDay=metadataSection(generateImagePrompt({ sceneType:'inside_car_selfie', lighting:'daylight through car windows' }).prompt);
  assert.match(carDay,/ISO 200-800.*1\/60-1\/125s/i);
  assert.doesNotMatch(carDay,/ISO 800-1600.*1\/30-1\/60s/i);
});

test('unknown canonical lighting value never falls back to free-text classification', () => {
  const unknownCanonical=metadataSection(generateImagePrompt({ sceneType:'outdoor_selfie', lighting:'direct midday sun outdoors', lightingValue:'future_unmapped_profile' }).prompt);
  const missing=metadataSection(generateImagePrompt({ sceneType:'front_selfie' }).prompt);
  for(const metadata of [unknownCanonical,missing]) {
    assert.match(metadata,/plausible automatic ISO and shutter behavior/i);
    assert.doesNotMatch(metadata,/ISO \d/i);
  }
});

test('all camera types use lighting-consistent metadata without file references', () => {
  const cameras=['xiaomi15_front','iphone15pm_front','generic_front','smartphone_rear'];
  for(const camera of cameras) {
    const day=metadataSection(generateImagePrompt({ sceneType:camera==='smartphone_rear'?'third_person_portrait':'outdoor_selfie', camera, lighting:'direct daytime sunlight', lightingValue:'day_direct_sun' }).prompt);
    const night=metadataSection(generateImagePrompt({ sceneType:camera==='smartphone_rear'?'third_person_portrait':'front_selfie', camera, lighting:'night scene with practical fixtures', lightingValue:'night_led_street' }).prompt);
    assert.match(day,/ISO 50-100.*1\/500-1\/1000s/i,camera);
    assert.match(night,/ISO 800-1600.*1\/30-1\/60s/i,camera);
    assert.doesNotMatch(day+night,/File reference|IMG_20250915_143022/i,camera);
  }
});

test('camera metadata field verification matrix covers ten representative cases', () => {
  const byValue=new Map(LIGHTING_PROFILES.map((item)=>[item.value,item.prompt]));
  const cases=[
    ['midday-xiaomi','outdoor_selfie','xiaomi15_front','blue_sky_noon'],
    ['golden-xiaomi','outdoor_selfie','xiaomi15_front','golden_hour'],
    ['overcast-iphone','outdoor_selfie','iphone15pm_front','day_overcast'],
    ['window-generic','office_selfie','generic_front','day_window'],
    ['warm-majlis','majlis_selfie','xiaomi15_front','night_home_warm'],
    ['car-night-xiaomi','inside_car_selfie','xiaomi15_front','night_car_practicals'],
    ['screen-bedroom','bedroom_selfie','xiaomi15_front','night_phone_screen'],
    ['office-iphone','office_selfie','iphone15pm_front','night_office_led'],
    ['sun-rear','third_person_portrait','smartphone_rear','day_direct_sun'],
    ['unknown-generic','front_selfie','generic_front','']
  ];
  for(const [name,sceneType,camera,lightingValue] of cases) {
    const result=generateImagePrompt({ sceneType,camera,lightingValue,lighting:lightingValue ? byValue.get(lightingValue) : '' });
    const metadata=metadataSection(result.prompt);
    assert.equal(result.sections.length,23,name);
    assert.equal(result.validation.valid,true,`${name}: ${result.validation.errors.join(' | ')}`);
    assert.doesNotMatch(metadata,/File reference|IMG_20250915_143022/i,name);
    console.log(`METADATA_FIELD ${JSON.stringify({name,sceneType,camera,lightingValue:lightingValue||'absent',metadata})}`);
  }
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

test('lens physics profiles vary across representative scene and capture combinations', () => {
  const cases = [
    [{ sceneType:'inside_car_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }, /23mm-equivalent.*~86° diagonal.*2-3% barrel distortion.*10-15%/is],
    [{ sceneType:'mirror_selfie', camera:'smartphone_rear', framing:'three_quarter', cameraDistance:'1 m from the mirror' }, /26mm-equivalent.*~80° diagonal.*1-1\.5% barrel distortion.*6-10%/is],
    [{ sceneType:'full_body_third_person', camera:'smartphone_rear', framing:'full_body', cameraDistance:'3 m' }, /28mm-equivalent.*~75° diagonal.*0\.5-1% barrel distortion.*4-8%/is],
    [{ sceneType:'cafe_selfie', camera:'generic_front', framing:'close', cameraDistance:'45 cm' }, /24mm-equivalent.*~84° diagonal.*1\.5-2\.5% barrel distortion.*8-12%/is],
    [{ sceneType:'bedroom_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }, /23mm-equivalent.*~86° diagonal.*2-3% barrel distortion.*10-15%/is]
  ];
  for (const [input, expected] of cases) {
    const result = generateImagePrompt(input);
    const lens = lensPhysics(result.prompt);
    assert.match(lens, expected);
    for (const token of [/chromatic aberration/i, /vignetting/i, /barrel distortion/i]) assert.match(lens, token);
    assert.equal(result.validation.valid, true, result.validation.errors.join(' | '));
  }
});

test('car interior and rear-camera mirror selfie emit different lens physics', () => {
  const car = lensPhysics(generateImagePrompt({ sceneType:'inside_car_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }).prompt);
  const mirror = lensPhysics(generateImagePrompt({ sceneType:'mirror_selfie', camera:'smartphone_rear', framing:'three_quarter', cameraDistance:'1 m from the mirror' }).prompt);
  assert.notEqual(car, mirror);
});

test('framing changes edge visibility wording without changing the focal profile', () => {
  const base = { sceneType:'third_person_portrait', camera:'smartphone_rear', cameraDistance:'2.5 m' };
  const close = lensPhysics(generateImagePrompt({ ...base, framing:'close' }).prompt);
  const wide = lensPhysics(generateImagePrompt({ ...base, framing:'three_quarter' }).prompt);
  assert.match(close, /28mm-equivalent.*~75° diagonal/is);
  assert.match(wide, /28mm-equivalent.*~75° diagonal/is);
  assert.match(close, /crop some outer-edge falloff/i);
  assert.doesNotMatch(wide, /crop some outer-edge falloff/i);
});

test('Xiaomi front and smartphone rear remain distinct camera profiles', () => {
  const front = lensPhysics(generateImagePrompt({ sceneType:'mirror_selfie', camera:'xiaomi15_front', framing:'waist_up' }).prompt);
  const rear = lensPhysics(generateImagePrompt({ sceneType:'mirror_selfie', camera:'smartphone_rear', framing:'waist_up' }).prompt);
  assert.match(front, /23mm-equivalent/i);
  assert.match(rear, /26mm-equivalent/i);
  assert.notEqual(front, rear);
});

test('camera distance can narrow a third-person profile without using framing as the cause', () => {
  const near = lensPhysics(generateImagePrompt({ sceneType:'third_person_portrait', camera:'smartphone_rear', framing:'three_quarter', cameraDistance:'1 m' }).prompt);
  const far = lensPhysics(generateImagePrompt({ sceneType:'third_person_portrait', camera:'smartphone_rear', framing:'three_quarter', cameraDistance:'3 m' }).prompt);
  assert.match(near, /26mm-equivalent.*~80° diagonal/is);
  assert.match(far, /28mm-equivalent.*~75° diagonal/is);
  assert.notEqual(near, far);
});

test('field verification matrix generates ten valid prompts across lens contexts', () => {
  const cases = [
    ['car-xiaomi-medium',{ sceneType:'inside_car_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }],
    ['car-iphone-close',{ sceneType:'inside_car_selfie', camera:'iphone15pm_front', framing:'close', cameraDistance:'45 cm' }],
    ['mirror-rear-medium',{ sceneType:'mirror_selfie', camera:'smartphone_rear', framing:'three_quarter', cameraDistance:'1 m from the mirror' }],
    ['mirror-xiaomi-medium',{ sceneType:'mirror_selfie', camera:'xiaomi15_front', framing:'waist_up', cameraDistance:'80 cm from the mirror' }],
    ['outdoor-third-full',{ sceneType:'full_body_third_person', location:'an ordinary outdoor Saudi walkway', camera:'smartphone_rear', framing:'full_body', cameraDistance:'3 m' }],
    ['outdoor-third-close',{ sceneType:'third_person_portrait', location:'an ordinary outdoor Saudi walkway', camera:'smartphone_rear', framing:'close', cameraDistance:'1 m' }],
    ['cafe-generic-close',{ sceneType:'cafe_selfie', camera:'generic_front', framing:'close', cameraDistance:'45 cm' }],
    ['cafe-xiaomi-medium',{ sceneType:'cafe_selfie', camera:'xiaomi15_front', framing:'waist_up', cameraDistance:'55 cm' }],
    ['bedroom-xiaomi-medium',{ sceneType:'bedroom_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }],
    ['bedroom-mirror-rear-full',{ sceneType:'bedroom_mirror_selfie', camera:'smartphone_rear', framing:'full_body', cameraDistance:'1.2 m from the mirror' }]
  ];
  for (const [name,input] of cases) {
    const result = generateImagePrompt(input);
    const lens = lensPhysics(result.prompt);
    assert.equal(result.validation.valid, true, `${name}: ${result.validation.errors.join(' | ')}`);
    assert.match(lens, /chromatic aberration/i, name);
    assert.match(lens, /vignetting/i, name);
    assert.match(lens, /barrel distortion/i, name);
    console.log(`LENS_FIELD ${JSON.stringify({ name, lens })}`);
  }
});

test('pose-derived action field matrix covers ten scene capture combinations', () => {
  const cases = [
    ['standing-selfie',{ sceneType:'front_selfie', pose:'standing_relaxed', poseValue:'standing_relaxed' },/stand naturally.*while taking the selfie/i],
    ['walking-selfie',{ sceneType:'outdoor_selfie', pose:'walking_slow', poseValue:'walking_slow' },/walk naturally.*while taking the selfie/i],
    ['seated-cafe',{ sceneType:'cafe_selfie', pose:'seated_chair', poseValue:'seated_chair' },/remain naturally seated.*while taking the selfie/i],
    ['mirror-standing',{ sceneType:'mirror_selfie', pose:'mirror_standing_relaxed', poseValue:'mirror_standing_relaxed' },/stand naturally.*while taking the mirror selfie/i],
    ['mirror-adjust',{ sceneType:'mirror_selfie', pose:'mirror_adjust_clothing', poseValue:'mirror_adjust_clothing' },/gently adjust a small section of clothing.*while taking the mirror selfie/i],
    ['driver',{ sceneType:'inside_car_selfie', pose:'driver_seat', poseValue:'driver_seat' },/driver in a stationary car.*while taking the selfie/i],
    ['passenger',{ sceneType:'inside_car_selfie', pose:'passenger_seat', poseValue:'passenger_seat' },/front passenger in a stationary car.*while taking the selfie/i],
    ['third-walking',{ sceneType:'third_person_portrait', pose:'third_walking_candid', poseValue:'third_walking_candid' },/walk naturally.*while another person photographs the subject/i],
    ['bed-lying',{ sceneType:'bedroom_selfie', pose:'bed-lying-back', poseValue:'bed-lying-back' },/lie naturally with a relaxed posture.*while taking the selfie/i],
    ['armchair-seated',{ sceneType:'bedroom_selfie', pose:'armchair-sit-lean-back', poseValue:'armchair-sit-lean-back' },/remain naturally seated.*while taking the selfie/i]
  ];
  for (const [name,input,expected] of cases) {
    const result=generateImagePrompt(input);
    const action=actionSection(result.prompt);
    assert.match(action,expected,name);
    assert.equal(result.sections.length,23,name);
    assert.equal(headings(result.prompt).filter((heading)=>heading==='ACTION-DRIVEN AUTHENTICITY').length,1,name);
    assert.equal(result.validation.valid,true,`${name}: ${result.validation.errors.join(' | ')}`);
    console.log(`ACTION_FIELD ${JSON.stringify({ name, action })}`);
  }
});

test('different poses in the same selfie scene produce different actions', () => {
  const standing=actionSection(generateImagePrompt({ sceneType:'outdoor_selfie', pose:'standing_relaxed', poseValue:'standing_relaxed' }).prompt);
  const walking=actionSection(generateImagePrompt({ sceneType:'outdoor_selfie', pose:'walking_slow', poseValue:'walking_slow' }).prompt);
  assert.notEqual(standing,walking);
});

test('mirror seated and clothing-adjust poses produce different actions', () => {
  const seated=actionSection(generateImagePrompt({ sceneType:'mirror_selfie', pose:'mirror_seated', poseValue:'mirror_seated' }).prompt);
  const adjust=actionSection(generateImagePrompt({ sceneType:'mirror_selfie', pose:'mirror_adjust_clothing', poseValue:'mirror_adjust_clothing' }).prompt);
  assert.notEqual(seated,adjust);
});

test('driver and passenger poses keep distinct stationary-car actions', () => {
  const driver=actionSection(generateImagePrompt({ sceneType:'inside_car_selfie', pose:'driver_seat', poseValue:'driver_seat' }).prompt);
  const passenger=actionSection(generateImagePrompt({ sceneType:'inside_car_selfie', pose:'passenger_seat', poseValue:'passenger_seat' }).prompt);
  assert.match(driver,/driver in a stationary car/i);
  assert.match(passenger,/front passenger in a stationary car/i);
  assert.notEqual(driver,passenger);
});

test('all intentionally unmapped poses fall back to the scenario profile action', () => {
  const unmapped=['holding_basket','coffee_hand','hand_on_head','one_hand_pocket','close_relaxed','bedroom-phone-only','third_interaction','bed-reclining-headboard','bed-propped-pillows'];
  for (const poseValue of unmapped) {
    const sceneType=poseValue.startsWith('bed-') || poseValue.startsWith('bedroom-') ? 'bedroom_selfie' : poseValue.startsWith('third_') ? 'third_person_portrait' : 'cafe_selfie';
    const result=generateImagePrompt({ sceneType, pose:poseValue, poseValue });
    const action=actionSection(result.prompt);
    assert.match(action,/capture a real in-between moment while sitting, standing, talking, waiting, drinking, or moving naturally/i,poseValue);
  }
});

test('pose-derived action does not leak visibility-sensitive face detail', () => {
  const sensitive=/eyes|gaze|pupils|pores|skin|sweat|flushed|cheeks|mouth|lips|smile|grin|teeth|expression/i;
  const mapped=['standing_relaxed','seated_chair','walking_slow','lean_wall','adjust_clothing','driver_seat','passenger_seat','bed-lying-back','mirror_adjust_clothing','third_walking_candid'];
  for (const poseValue of mapped) {
    const sceneType=poseValue.startsWith('mirror_') ? 'mirror_selfie' : poseValue.startsWith('third_') ? 'third_person_portrait' : poseValue==='driver_seat' || poseValue==='passenger_seat' ? 'inside_car_selfie' : poseValue.startsWith('bed-') ? 'bedroom_selfie' : 'outdoor_selfie';
    assert.doesNotMatch(actionSection(generateImagePrompt({ sceneType, pose:poseValue, poseValue }).prompt),sensitive,poseValue);
  }
});

test('explicit API action remains higher priority than pose-derived action', () => {
  const packet=buildRealismPacket({
    sceneType:'front_selfie',
    requestedSceneType:'front_selfie',
    captureType:'subject-held front-camera smartphone selfie',
    pose:'walking_slow',
    poseValue:'walking_slow',
    action:'capture an explicitly requested action'
  });
  assert.equal(packet.action,'capture an explicitly requested action');
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

test('clothing styling is injected when selected', () => {
  const result = generateImagePrompt({
    sceneType: 'front_selfie',
    clothing: 'white_tshirt',
    clothingStyling: 'sleeves-rolled'
  });
  assert.match(result.prompt, /rolled up to the elbows/i);
});

test('default clothing styling adds nothing', () => {
  const result = generateImagePrompt({
    sceneType: 'front_selfie',
    clothingStyling: 'default'
  });
  assert.doesNotMatch(result.prompt, /rolled up to the elbows/i);
  assert.doesNotMatch(result.prompt, /French Tuck|french-tuck/i);
});

test('hand interaction is injected when selected', () => {
  const result = generateImagePrompt({
    sceneType: 'front_selfie',
    clothing: 'suit-navy-lightblue',
    handInteraction: 'pocket-hands'
  });
  assert.match(result.prompt, /side pockets/i);
});

test('new negative terms are present', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  for (const term of [
    'melted fabric',
    'floating clothes',
    'deformed abs',
    'impossible anatomy',
    'morphing sofa',
    'split furniture',
    'merged furniture',
    'disconnected armrest',
    'two sofas merged'
  ]) {
    assert.match(result.prompt.toLowerCase(), new RegExp(term, 'i'));
  }
});

test('no duplicate negative terms', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  const negativeSection = result.prompt.split('[NEGATIVE CONSTRAINTS]')[1].split('[FINAL VERIFICATION]')[0];
  const terms = negativeSection.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean);
  assert.equal(new Set(terms).size, terms.length, 'Duplicate negative terms found');
});

test('23 sections are preserved', () => {
  const result = generateImagePrompt({
    sceneType: 'front_selfie',
    clothing: 'suit-navy-lightblue',
    clothingStyling: 'sleeves-rolled',
    handInteraction: 'pocket-hands'
  });
  assert.equal(result.sections.length, 23);
});

test('sleeves-rolled only applies to garments explicitly tagged sleeved', () => {
  const tshirt = generateImagePrompt({ sceneType: 'front_selfie', clothing: 'a plain white crew-neck cotton T-shirt...', clothingStyling: 'sleeves-rolled' });
  assert.match(tshirt.prompt, /rolled up to the elbows/i);
  for (const clothing of ['a plain black abaya...', 'a plain well-fitted white Saudi thobe...']) {
    const result = generateImagePrompt({ sceneType: 'front_selfie', clothing, clothingStyling: 'sleeves-rolled' });
    assert.doesNotMatch(result.prompt, /rolled up to the elbows/i);
  }
});

test('french-tuck never applies to thobe or abaya', () => {
  for (const clothing of ['a plain well-fitted white Saudi thobe...', 'a plain black abaya...']) {
    const result = generateImagePrompt({ sceneType: 'front_selfie', clothing, clothingStyling: 'french-tuck' });
    assert.doesNotMatch(result.prompt, /front hem tucked/i);
  }
});

test('top-buttons-open only applies to buttoned tops', () => {
  const shirt = generateImagePrompt({ sceneType: 'front_selfie', clothing: 'a crisp white oxford cotton shirt...', clothingStyling: 'top-buttons-open' });
  assert.match(shirt.prompt, /Top 2-3 buttons unbuttoned/i);
  const tshirt = generateImagePrompt({ sceneType: 'front_selfie', clothing: 'a plain white crew-neck cotton T-shirt...', clothingStyling: 'top-buttons-open' });
  assert.doesNotMatch(tshirt.prompt, /Top 2-3 buttons unbuttoned/i);
});

test('pocket-hands applies to pocketed garments only', () => {
  const pants = generateImagePrompt({ sceneType: 'front_selfie', clothing: 'a navy two-piece suit with a light-blue dress shirt...', handInteraction: 'pocket-hands' });
  assert.match(pants.prompt, /side pockets/i);
  const abaya = generateImagePrompt({ sceneType: 'front_selfie', clothing: 'a plain black abaya...', handInteraction: 'pocket-hands' });
  assert.doesNotMatch(abaya.prompt, /side pockets/i);
});

test('wipe-sweat applies to all garments', () => {
  for (const clothing of ['a plain well-fitted white Saudi thobe...', 'a plain white crew-neck cotton T-shirt...', 'a plain black abaya...']) {
    const result = generateImagePrompt({ sceneType: 'front_selfie', clothing, handInteraction: 'wipe-sweat' });
    assert.match(result.prompt, /towel wiping the forehead/i);
  }
});

test('scene-aware filtering disables styling in supermarket_selfie', () => {
  const supermarket = generateImagePrompt({ sceneType: 'supermarket_selfie', clothing: 'white_tshirt', clothingStyling: 'sleeves-rolled' });
  assert.doesNotMatch(supermarket.prompt, /rolled up to the elbows/i);
});

test('fully-open never applies to FORMAL_LOOKS', () => {
  const formalLook = CLOTHING_CATALOG.find((item) => item.value === 'look-01');
  const result = generateImagePrompt({ sceneType: 'front_selfie', clothing: formalLook.prompt, clothingStyling: 'fully-open' });
  assert.doesNotMatch(result.prompt, /Outer layer fully unbuttoned or unzipped/i);
});

test('quilted_vest_knit does not allow sleeves-rolled', () => {
  const vest = CLOTHING_CATALOG.find((item) => item.value === 'quilted_vest_knit');
  assert.ok(vest);
  assert.equal(vest.garmentTags.includes('sleeved'), false);
  const result = generateImagePrompt({ sceneType: 'front_selfie', clothing: vest.prompt, clothingStyling: 'sleeves-rolled' });
  assert.doesNotMatch(result.prompt, /rolled up to the elbows/i);
});

test('every clothing catalog item has non-empty garmentTags', () => {
  const all = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  assert.equal(all.length, 267);
  assert.equal(all.filter((item) => !Array.isArray(item.garmentTags) || item.garmentTags.length === 0).length, 0);
});

test('every clothing item retains at least one styling and hand option', () => {
  const all = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  for (const item of all) {
    const tags = new Set(item.garmentTags);
    const styling = CLOTHING_STYLING.filter((option) => option.applicableTo.includes('all') || option.applicableTo.some((tag) => tags.has(tag)));
    const hands = HAND_INTERACTIONS.filter((option) => option.applicableTo.includes('all') || option.applicableTo.some((tag) => tags.has(tag)));
    assert.ok(styling.length > 0, `No clothing styling options for ${item.value}`);
    assert.ok(hands.length > 0, `No hand interaction options for ${item.value}`);
  }
});


test('handheld selfie has 1 hand and no laptop', () => {
  const props = getAvailableProps('front_selfie', 'subject-held front-camera smartphone selfie', 'saudi_cafe');
  assert.ok(!props.some((p) => p.value === 'macbook-pro-16'));
});

test('third-person in office allows laptop', () => {
  const props = getAvailableProps('third_person_portrait', 'third-person smartphone photograph', 'saudi_office');
  assert.ok(props.some((p) => p.value === 'macbook-pro-16'));
});

test('third-person in parking does NOT allow laptop', () => {
  const props = getAvailableProps('third_person_portrait', 'third-person smartphone photograph', 'day_parking');
  assert.ok(!props.some((p) => p.value === 'macbook-pro-16'));
});

test('pose holding_basket blocks heldProp', () => {
  const props = getAvailableProps('front_selfie', 'subject-held front-camera smartphone selfie', 'supermarket_aisle', 'holding_basket');
  assert.equal(props.length, 0);
});

test('pose coffee_hand blocks additional heldProp', () => {
  const props = getAvailableProps('cafe_selfie', 'subject-held front-camera smartphone selfie', 'saudi_cafe', 'coffee_hand');
  assert.equal(props.length, 0);
});

test('two-hands primary disables secondary budget', () => {
  assert.equal(getRemainingHands('third_person_portrait', 'third-person smartphone photograph', 'macbook-pro-16'), 0);
});

test('pocket-hands consumes both subject hands', () => {
  assert.equal(getRemainingHands('third_person_portrait', 'third-person smartphone photograph', 'none', '', 'pocket-hands'), 0);
});


test('mirror poses have explicit hand-usage entries with expected values', () => {
  const expected = {
    mirror_standing_relaxed:0,
    mirror_one_hand_pocket:1,
    mirror_adjust_clothing:1,
    mirror_seated:0,
    mirror_full_length:0
  };
  assert.deepEqual(MIRROR_POSES.map(({ value }) => [value, POSE_HAND_USAGE[value]]), Object.entries(expected));
});

test('mirror hand conflicts silently drop the requested held prop', () => {
  for (const poseValue of ['mirror_one_hand_pocket', 'mirror_adjust_clothing']) {
    const result = generateImagePrompt({
      sceneType:'mirror_selfie',
      poseValue,
      heldProp:'iphone-15-pro-black',
      camera:'xiaomi15_front'
    });
    assert.doesNotMatch(result.prompt, /iPhone 15 Pro/i, poseValue);
    assert.equal(result.sections.length, 23, poseValue);
    assert.equal(result.validation.valid, true, `${poseValue}: ${result.validation.errors.join(' | ')}`);
  }
});

test('zero-use mirror poses keep one held-prop hand available', () => {
  for (const poseValue of ['mirror_standing_relaxed', 'mirror_seated', 'mirror_full_length']) {
    const result = generateImagePrompt({
      sceneType:'mirror_selfie',
      poseValue,
      heldProp:'iphone-15-pro-black',
      camera:'xiaomi15_front'
    });
    assert.match(result.prompt, /iPhone 15 Pro/i, poseValue);
  }
});

test('unmapped pose preserves the existing zero-usage fallback', () => {
  const capture = 'mirror selfie using a smartphone visible in the reflection';
  assert.equal(getRemainingHands('mirror_selfie', capture, 'none', 'future_pose_value'), 1);
  const props = getAvailableProps('mirror_selfie', capture, '', 'future_pose_value');
  assert.ok(props.some((prop) => prop.value === 'iphone-15-pro-black'));
});


test('flexible primary resolves to one hand in selfie and two hands in third-person', () => {
  const selfie=generateImagePrompt({ sceneType:'office_selfie', location:'saudi_office', heldProp:'ipad-pro-13' });
  const third=generateImagePrompt({ sceneType:'third_person_portrait', location:'saudi_office', heldProp:'ipad-pro-13' });
  assert.match(selfie.prompt,/hand-count alternatives[^\n]*exactly one hand/i);
  assert.match(third.prompt,/hand-count alternatives[^\n]*exactly two hands/i);
  assert.equal(selfie.sections.length,23);
  assert.equal(third.sections.length,23);
});

test('third-person pose consuming one hand resolves flexible primary to one hand', () => {
  const result=generateImagePrompt({ sceneType:'third_person_portrait', location:'saudi_cafe', poseValue:'one_hand_pocket', heldProp:'nintendo-switch' });
  assert.match(result.prompt,/Nintendo Switch/i);
  assert.match(result.prompt,/hand-count alternatives[^\n]*exactly one hand/i);
});

test('two-hand flexible primary drops a requested one-hand secondary prop', () => {
  const result=generateImagePrompt({ sceneType:'third_person_portrait', location:'saudi_office', heldProp:'ipad-pro-13', secondaryProp:'iphone-15-pro-black' });
  assert.equal(result.config.held_prop,'ipad-pro-13');
  assert.equal(result.config.secondary_prop,'none');
  assert.doesNotMatch(result.prompt,/iPhone 15 Pro/i);
});

test('one-hand primary leaves one hand for a flexible secondary prop', () => {
  const result=generateImagePrompt({ sceneType:'third_person_portrait', location:'saudi_office', heldProp:'iphone-15-pro-black', secondaryProp:'ipad-pro-13' });
  assert.equal(result.config.secondary_prop,'ipad-pro-13');
  assert.match(result.prompt,/iPad Pro 13/i);
  assert.match(result.prompt,/hand-count alternatives[^\n]*exactly one hand/i);
});

test('zero hand budget silently drops a flexible prop without an error', () => {
  const cases=[
    { sceneType:'mirror_selfie', location:'saudi_office', poseValue:'mirror_one_hand_pocket', heldProp:'ipad-pro-13' },
    { sceneType:'third_person_portrait', location:'saudi_office', poseValue:'third_standing_relaxed', handInteraction:'pocket-hands', clothing:'a navy two-piece suit with a light-blue dress shirt...', heldProp:'ipad-pro-13' }
  ];
  for(const input of cases){
    const result=generateImagePrompt(input);
    assert.equal(result.config.held_prop,'none');
    assert.doesNotMatch(result.prompt,/iPad Pro 13/i);
    assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
  }
});

test('flexible grip field matrix covers ten cases and preserves the 23-section schema', () => {
  const cases=[
    ['selfie-ipad',{sceneType:'office_selfie',location:'saudi_office',poseValue:'standing_relaxed',heldProp:'ipad-pro-13'},'1','1',/exactly one hand/i],
    ['mirror-ipad',{sceneType:'mirror_selfie',location:'saudi_office',poseValue:'mirror_standing_relaxed',heldProp:'ipad-pro-13'},'1','1',/exactly one hand/i],
    ['third-ipad',{sceneType:'third_person_portrait',location:'saudi_office',heldProp:'ipad-pro-13'},'1','2',/exactly two hands/i],
    ['third-pose-switch',{sceneType:'third_person_portrait',location:'saudi_cafe',poseValue:'one_hand_pocket',heldProp:'nintendo-switch'},'1','1',/exactly one hand/i],
    ['third-exhausted',{sceneType:'third_person_portrait',location:'saudi_office',poseValue:'third_standing_relaxed',handInteraction:'pocket-hands',clothing:'a navy two-piece suit with a light-blue dress shirt...',heldProp:'ipad-pro-13'},'dropped','dropped',null],
    ['third-flex-primary-secondary',{sceneType:'third_person_portrait',location:'saudi_office',heldProp:'ipad-pro-13',secondaryProp:'iphone-15-pro-black'},'1+1','2+dropped',/exactly two hands/i],
    ['third-one-primary-flex-secondary',{sceneType:'third_person_portrait',location:'saudi_office',heldProp:'iphone-15-pro-black',secondaryProp:'ipad-pro-13'},'1+1','1+1',/exactly one hand/i],
    ['selfie-pose-paperback',{sceneType:'office_selfie',location:'saudi_office',poseValue:'one_hand_pocket',heldProp:'book-paperback'},'dropped','dropped',null],
    ['mirror-pose-paperback',{sceneType:'mirror_selfie',location:'saudi_office',poseValue:'mirror_one_hand_pocket',heldProp:'book-paperback'},'dropped','dropped',null],
    ['third-iphone-control',{sceneType:'third_person_portrait',location:'saudi_office',heldProp:'iphone-15-pro-black'},'1','1',null]
  ];
  for(const [name,input,before,after,clause] of cases){
    const result=generateImagePrompt(input);
    if(clause) assert.match(result.prompt,clause,name);
    if(after==='dropped') assert.equal(result.config.held_prop,'none',name);
    if(name==='third-flex-primary-secondary') assert.equal(result.config.secondary_prop,'none',name);
    if(name==='third-one-primary-flex-secondary') assert.equal(result.config.secondary_prop,'ipad-pro-13',name);
    if(name==='third-iphone-control') assert.equal(getRemainingHands('third_person_portrait','third-person smartphone photograph','iphone-15-pro-black'),1,name);
    assert.equal(result.sections.length,23,name);
    assert.equal(result.validation.valid,true,`${name}: ${result.validation.errors.join(' | ')}`);
    console.log(`FLEX_GRIP_FIELD ${JSON.stringify({name,scene:input.sceneType,pose:input.poseValue||'',prop:input.heldProp,secondary:input.secondaryProp||'none',before,after})}`);
  }
});

test('no alcohol, tobacco, or pork in props', () => {
  for (const prop of HAND_PROPS) {
    const text = `${prop.value} ${prop.label} ${prop.prompt}`.toLowerCase();
    assert.doesNotMatch(text, /wine|beer|whisky|vodka|alcohol|tobacco|cigarette|cigar|shisha|hookah|pork|bacon/i);
  }
});

test('held prop is injected into prompt when valid', () => {
  const result = generateImagePrompt({ sceneType: 'cafe_selfie', heldProp: 'cappuccino-cup' });
  assert.match(result.prompt, /cappuccino cup/i);
  assert.match(result.prompt, /grip tension/i);
});

test('MacBook never injects in handheld selfie', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', location: 'saudi_cafe', heldProp: 'macbook-pro-16' });
  assert.doesNotMatch(result.prompt, /MacBook Pro/i);
});

test('MacBook injects for third-person office context', () => {
  const result = generateImagePrompt({ sceneType: 'third_person_portrait', location: 'saudi_office', heldProp: 'macbook-pro-16' });
  assert.match(result.prompt, /MacBook Pro/i);
});

test('23 sections preserved with held props', () => {
  const result = generateImagePrompt({ sceneType: 'cafe_selfie', heldProp: 'cappuccino-cup' });
  assert.equal(result.sections.length, 23);
});

test('pose-aware office furniture distinguishes seated chair from standing and keeps desk-work exception', () => {
  const seated=generateImagePrompt({ sceneType:'office_selfie', location:'saudi_office', poseValue:'seated_chair' });
  const standing=generateImagePrompt({ sceneType:'office_selfie', location:'saudi_office', poseValue:'standing_relaxed' });
  const deskWork=generateImagePrompt({ sceneType:'desk_work_selfie', location:'saudi_office', poseValue:'seated_chair' });
  assert.deepEqual(furnitureKinds(seated.prompt),['chair']);
  assert.deepEqual(furnitureKinds(standing.prompt),['generic']);
  assert.deepEqual(furnitureKinds(deskWork.prompt),['chair','desk']);
});

test('pose-aware majlis furniture distinguishes sofa support from chair support', () => {
  const sofa=generateImagePrompt({ sceneType:'majlis_selfie', location:'modern_saudi_majlis', poseValue:'seated_sofa' });
  const chair=generateImagePrompt({ sceneType:'majlis_selfie', location:'modern_saudi_majlis', poseValue:'seated_chair' });
  assert.deepEqual(furnitureKinds(sofa.prompt),['sofa']);
  assert.deepEqual(furnitureKinds(chair.prompt),['chair']);
});

test('pose-aware cafe furniture removes table and counter for non-interacting poses', () => {
  const chair=generateImagePrompt({ sceneType:'cafe_selfie', location:'saudi_cafe', poseValue:'seated_chair' });
  const standing=generateImagePrompt({ sceneType:'cafe_selfie', location:'saudi_cafe', poseValue:'standing_relaxed' });
  assert.deepEqual(furnitureKinds(chair.prompt),['chair']);
  assert.deepEqual(furnitureKinds(standing.prompt),['generic']);
});

test('pose-aware bedroom furniture selects bed, floor-generic, and armchair semantics', () => {
  const bed=generateImagePrompt({ sceneType:'bedroom_selfie', poseValue:'bed-lying-back' });
  const floor=generateImagePrompt({ sceneType:'bedroom_selfie', poseValue:'bedroom-floor-cross' });
  const armchair=generateImagePrompt({ sceneType:'bedroom_selfie', poseValue:'armchair-sit-lean-back' });
  assert.deepEqual(furnitureKinds(bed.prompt),['bed']);
  assert.deepEqual(furnitureKinds(floor.prompt),['generic']);
  assert.deepEqual(furnitureKinds(armchair.prompt),['armchair']);
});

test('missing and unmapped poses preserve legacy furniture behavior', () => {
  const missing=generateImagePrompt({ sceneType:'office_selfie', location:'saudi_office' });
  const unknown=generateImagePrompt({ sceneType:'office_selfie', location:'saudi_office', poseValue:'future_pose_value' });
  const mirrorSeated=generateImagePrompt({ sceneType:'bedroom_mirror_selfie', poseValue:'mirror_seated' });
  const thirdSeated=generateImagePrompt({ sceneType:'third_person_portrait', location:'saudi_office', poseValue:'third_seated_relaxed' });
  assert.deepEqual(furnitureKinds(missing.prompt),['chair','desk']);
  assert.deepEqual(furnitureKinds(unknown.prompt),['chair','desk']);
  assert.deepEqual(furnitureKinds(mirrorSeated.prompt),['bed']);
  assert.deepEqual(furnitureKinds(thirdSeated.prompt),['chair','desk']);
});

test('pose-aware furniture keeps the 23-section schema and validation', () => {
  for(const input of [
    { sceneType:'office_selfie', location:'saudi_office', poseValue:'standing_relaxed' },
    { sceneType:'bedroom_selfie', poseValue:'armchair-sit-feet-floor' },
    { sceneType:'majlis_selfie', location:'modern_saudi_majlis', poseValue:'seated_sofa' }
  ]){
    const result=generateImagePrompt(input);
    assert.equal(result.sections.length,23);
    assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
  }
});

test('furniture geometry field verification matrix covers ten pose-aware cases', () => {
  const cases=[
    ['office-chair','office_selfie','saudi_office','seated_chair',['chair','desk'],['chair']],
    ['office-standing','office_selfie','saudi_office','standing_relaxed',['chair','desk'],['generic']],
    ['desk-work-chair','desk_work_selfie','saudi_office','seated_chair',['table','desk'],['chair','desk']],
    ['majlis-sofa','majlis_selfie','modern_saudi_majlis','seated_sofa',['sofa'],['sofa']],
    ['majlis-chair','majlis_selfie','modern_saudi_majlis','seated_chair',['sofa'],['chair']],
    ['cafe-standing','cafe_selfie','saudi_cafe','standing_relaxed',['table','counter'],['generic']],
    ['bedroom-bed','bedroom_selfie','', 'bed-lying-back',['bed'],['bed']],
    ['bedroom-floor','bedroom_selfie','', 'bedroom-floor-cross',['bed'],['generic']],
    ['bedroom-armchair','bedroom_selfie','', 'armchair-sit-lean-back',['bed'],['armchair']],
    ['office-unknown','office_selfie','saudi_office','future_pose_value',['chair','desk'],['chair','desk']]
  ];
  for(const [name,sceneType,location,poseValue,before,after] of cases){
    const result=generateImagePrompt({ sceneType,location,poseValue });
    assert.deepEqual(furnitureKinds(result.prompt),after,name);
    assert.equal(result.sections.length,23,name);
    assert.equal(result.validation.valid,true,`${name}: ${result.validation.errors.join(' | ')}`);
    console.log(`FURNITURE_FIELD ${JSON.stringify({name,sceneType,poseValue,before,after})}`);
  }
});

test('bedroom prompt contains furniture geometry rule', () => {
  const result = generateImagePrompt({ sceneType: 'bedroom_selfie' });
  assert.match(result.prompt, /FURNITURE GEOMETRY/i);
  assert.match(result.prompt, /continuous structural frame|continuous frame/i);
});

test('majlis prompt contains sofa geometry rule', () => {
  const result = generateImagePrompt({ sceneType: 'majlis_selfie', location: 'modern_saudi_majlis' });
  assert.match(result.prompt, /FURNITURE GEOMETRY/i);
  assert.match(result.prompt, /sofa maintains a continuous/i);
});

test('cafe prompt contains table geometry rule', () => {
  const result = generateImagePrompt({ sceneType: 'cafe_selfie', location: 'saudi_cafe' });
  assert.match(result.prompt, /FURNITURE GEOMETRY/i);
  assert.match(result.prompt, /table|chair/i);
});

test('generic geometry rule used when no specific furniture in scene', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', location: 'desert_roadside' });
  assert.match(result.prompt, /FURNITURE GEOMETRY/i);
  assert.match(result.prompt, /coherent 3D structure/i);
});

test('23 sections preserved with furniture geometry', () => {
  const result = generateImagePrompt({ sceneType: 'bedroom_selfie' });
  assert.equal(result.sections.length, 23);
});

test('negative constraints include furniture grounding bans', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.match(result.prompt, /furniture with disconnected legs/i);
  assert.match(result.prompt, /furniture floating above the ground/i);
});

test('every base and expanded scene emits furniture geometry guidance', async () => {
  const { SCENE_TYPES } = await import('../core/prompt-generator.js');
  const { EXTRA_SCENE_TYPES } = await import('../core/scene-type-expansion.js');
  for (const scene of [...SCENE_TYPES, ...EXTRA_SCENE_TYPES]) {
    const result = generateImagePrompt({ sceneType: scene.value });
    const sceneSection = result.prompt.split('[SCENE]\n')[1].split('\n\n[SAUDI CULTURAL DRESS]')[0];
    assert.match(sceneSection, /FURNITURE GEOMETRY:/i, scene.value);
  }
});

test('heldProp prompt is injected without concat bug', () => {
  const result = generateImagePrompt({
    sceneType: 'majlis_selfie',
    location: 'modern_saudi_majlis',
    heldProp: 'iphone-15-pro-black'
  });
  const accessories = result.prompt.split('[CONTEXTUAL ACCESSORIES]\n')[1].split('\n\n[POSE')[0];
  assert.match(accessories, /iPhone 15 Pro/i);
  assert.doesNotMatch(accessories, /fits the action a black iPhone/i);
  assert.doesNotMatch(accessories, /water bottle/i);
});

test('iPhone appears once in final prompt', () => {
  const result = generateImagePrompt({
    sceneType: 'majlis_selfie',
    location: 'modern_saudi_majlis',
    heldProp: 'iphone-15-pro-black'
  });
  const matches = result.prompt.match(/iPhone 15 Pro/gi) || [];
  assert.equal(matches.length, 1, `iPhone mentioned ${matches.length} times`);
});

test('23 sections preserved after heldProp override', () => {
  const result = generateImagePrompt({
    sceneType: 'majlis_selfie',
    location: 'modern_saudi_majlis',
    heldProp: 'iphone-15-pro-black'
  });
  assert.equal(result.sections.length, 23);
});
