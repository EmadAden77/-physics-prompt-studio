import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImagePrompt, validateGeneratedPrompt, validateRealism } from '../core/prompt-generator.js';
import { CLOTHING_CATALOG, HOME_CLOTHING, CLOTHING_STYLING, HAND_INTERACTIONS, HAND_PROPS, LIGHTING_PROFILES, POSE_HAND_USAGE, FURNITURE_GEOMETRY_RULES, MAJLIS_ANCHOR, LAPTOP_SCENE_CONTEXTS, LAPTOP_SCENE_SEATED_POSES, getAvailableProps, getRemainingHands } from '../core/scene-builder.js';
import { MIRROR_POSES, THIRD_PERSON_POSES } from '../core/scene-compatibility.js';
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
  const patterns={ sofa:/The sofa is a single discrete upholstered piece/i, armchair:/The armchair is a single discrete one-seat piece/i, chair:/The chair is a single discrete one-seat piece/i, table:/The table has a continuous top/i, desk:/The desk has a flat working surface/i, bed:/The bed has a continuous frame/i, counter:/The counter is a continuous solid structure/i, generic:/All furniture maintains a coherent 3D structure/i };
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
  assert.match(result.prompt, /Hair DENSITY, thickness, CURL PATTERN, and length must match the reference image EXACTLY/i);
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
  for (const profile of LIGHTING_PROFILES) assert.match(metadataSection(generateImagePrompt({ sceneType:'front_selfie', camera:'generic_front', lighting:profile.prompt, lightingValue:profile.value }).prompt),patterns[expected[profile.value]],profile.value);
});

test('phone LED flash uses the dedicated flash exposure range', () => {
  const metadata=metadataSection(generateImagePrompt({ sceneType:'bedroom_third_person', camera:'smartphone_rear', lightingValue:'phone_led_flash_only', lighting:'pitch-dark bedroom with the phone rear LED flash as the ONLY light source' }).prompt);
  assert.match(metadata,/ISO 100-400.*1\/60-1\/120s/i);
});

test('Xiaomi metadata uses the verified front-camera hardware profile and automatic exposure', () => {
  const midday=metadataSection(generateImagePrompt({ sceneType:'outdoor_selfie', camera:'xiaomi15_front', lightingValue:'blue_sky_noon', lighting:'strong high-elevation midday sun' }).prompt);
  const night=metadataSection(generateImagePrompt({ sceneType:'inside_car_selfie', camera:'xiaomi15_front', lightingValue:'night_car_practicals', lighting:'stationary car interior at night' }).prompt);
  assert.equal(midday,night);
  assert.match(midday,/32MP.*21mm equivalent.*f\/2\.0.*~90° FOV.*automatic smartphone exposure/is);
  assert.doesNotMatch(midday,/ISO \d/i);
});

test('free-text metadata fallback keeps explicit priority and does not treat car as night', () => {
  const cases=[
    ['phone screen only in darkness',/ISO 1600-3200.*1\/15-1\/30s/i],
    ['night street practical lighting',/ISO 800-1600.*1\/30-1\/60s/i],
    ['direct midday sun outdoors',/ISO 50-100.*1\/500-1\/1000s/i],
    ['ordinary office fluorescent ceiling lighting',/ISO 200-800.*1\/60-1\/125s/i],
    ['ambiguous available light',/plausible automatic ISO and shutter behavior/i]
  ];
  for(const [lighting,expected] of cases) assert.match(metadataSection(generateImagePrompt({ sceneType:'front_selfie', camera:'generic_front', lighting }).prompt),expected,lighting);
  const carDay=metadataSection(generateImagePrompt({ sceneType:'inside_car_selfie', camera:'generic_front', lighting:'daylight through car windows' }).prompt);
  assert.match(carDay,/ISO 200-800.*1\/60-1\/125s/i);
  assert.doesNotMatch(carDay,/ISO 800-1600.*1\/30-1\/60s/i);
});

test('unknown canonical lighting value never falls back to free-text classification', () => {
  const unknownCanonical=metadataSection(generateImagePrompt({ sceneType:'outdoor_selfie', camera:'generic_front', lighting:'direct midday sun outdoors', lightingValue:'future_unmapped_profile' }).prompt);
  const missing=metadataSection(generateImagePrompt({ sceneType:'front_selfie', camera:'generic_front' }).prompt);
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
    if(camera==='xiaomi15_front'){
      assert.match(day,/automatic smartphone exposure appropriate to the actual available light/i,camera);
      assert.equal(day,night,camera);
    } else {
      assert.match(day,/ISO 50-100.*1\/500-1\/1000s/i,camera);
      assert.match(night,/ISO 800-1600.*1\/30-1\/60s/i,camera);
    }
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
    [{ sceneType:'inside_car_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }, /Xiaomi 15 Ultra front-camera optical profile.*21mm-equivalent.*~90° diagonal.*mild residual optical imperfections/is],
    [{ sceneType:'mirror_selfie', camera:'smartphone_rear', framing:'three_quarter', cameraDistance:'1 m from the mirror' }, /26mm-equivalent.*~80° diagonal.*1-1\.5% barrel distortion.*6-10%/is],
    [{ sceneType:'full_body_third_person', camera:'smartphone_rear', framing:'full_body', cameraDistance:'3 m' }, /28mm-equivalent.*~75° diagonal.*0\.5-1% barrel distortion.*4-8%/is],
    [{ sceneType:'cafe_selfie', camera:'generic_front', framing:'close', cameraDistance:'45 cm' }, /24mm-equivalent.*~84° diagonal.*1\.5-2\.5% barrel distortion.*8-12%/is],
    [{ sceneType:'bedroom_selfie', camera:'xiaomi15_front', framing:'chest_up', cameraDistance:'50 cm' }, /Xiaomi 15 Ultra front-camera optical profile.*21mm-equivalent.*~90° diagonal.*mild residual optical imperfections/is]
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
  assert.match(front, /21mm-equivalent/i);
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
  assert.match(identity, /Hair DENSITY, thickness, CURL PATTERN, and length must match the reference image EXACTLY/i);
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
  assert.match(result.prompt, /short T-shirt sleeves/i);
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

test('sleeves-rolled follows category-specific garment styling', () => {
  const tshirt = generateImagePrompt({ sceneType:'front_selfie', clothingValue:'white_tshirt', clothingStyling:'sleeves-rolled' });
  const thobe = generateImagePrompt({ sceneType:'front_selfie', clothingValue:'white_thobe', clothingStyling:'sleeves-rolled' });
  const abaya = generateImagePrompt({ sceneType:'front_selfie', clothingValue:'black_abaya', clothingStyling:'sleeves-rolled' });
  assert.match(tshirt.prompt,/short T-shirt sleeves/i);
  assert.match(thobe.prompt,/thobe sleeves/i);
  assert.doesNotMatch(abaya.prompt,/thobe sleeves|T-shirt sleeves/i);
});

test('french-tuck never applies to thobe or abaya', () => {
  for (const clothing of ['a plain well-fitted white Saudi thobe...', 'a plain black abaya...']) {
    const result = generateImagePrompt({ sceneType: 'front_selfie', clothing, clothingStyling: 'french-tuck' });
    assert.doesNotMatch(result.prompt, /front hem tucked/i);
  }
});

test('top-buttons-open is scoped to the shirt category', () => {
  const shirt = generateImagePrompt({ sceneType:'front_selfie', clothingValue:'look-01', clothingStyling:'top-buttons-open' });
  const tshirt = generateImagePrompt({ sceneType:'front_selfie', clothingValue:'white_tshirt', clothingStyling:'top-buttons-open' });
  assert.match(shirt.prompt,/top two shirt buttons open/i);
  assert.doesNotMatch(tshirt.prompt,/top two shirt buttons open/i);
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
  assert.doesNotMatch(supermarket.prompt, /Roll the thobe sleeves|Roll the shirt sleeves|Roll the short T-shirt sleeves/i);
});

test('suit jacket styling does not apply to FORMAL_LOOKS shirt category', () => {
  const result = generateImagePrompt({ sceneType:'front_selfie', clothingValue:'look-01', clothingStyling:'suit-jacket-open' });
  assert.doesNotMatch(result.prompt,/suit or jacket open at the front/i);
});

test('quilted_vest_knit suit category rejects shirt sleeve styling', () => {
  const vest=CLOTHING_CATALOG.find((item)=>item.value==='quilted_vest_knit');
  assert.ok(vest);
  assert.equal(vest.category,'suit');
  const result=generateImagePrompt({ sceneType:'front_selfie', clothingValue:'quilted_vest_knit', clothingStyling:'sleeves-rolled' });
  assert.doesNotMatch(result.prompt,/shirt sleeves|thobe sleeves|T-shirt sleeves/i);
});

test('every clothing catalog item has non-empty garmentTags', () => {
  const all = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  assert.equal(all.length, 267);
  assert.equal(all.filter((item) => !Array.isArray(item.garmentTags) || item.garmentTags.length === 0).length, 0);
});

test('every general clothing item has a styling category and every clothing item retains a hand option', () => {
  const allowed=new Set(['thobe','shirt','tshirt','bisht','abaya','suit']);
  for(const item of CLOTHING_CATALOG) assert.ok(allowed.has(item.category),`Invalid styling category for ${item.value}`);
  for(const item of [...CLOTHING_CATALOG,...HOME_CLOTHING]) {
    const tags=new Set(item.garmentTags);
    const hands=HAND_INTERACTIONS.filter((option)=>option.applicableTo.includes('all') || option.applicableTo.some((tag)=>tags.has(tag)));
    assert.ok(hands.length>0,`No hand interaction options for ${item.value}`);
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
  assert.match(result.prompt,/13-inch iPad Pro/i);
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

test('third-person poses have explicit hand-usage entries with expected values', () => {
  const expected = {
    third_standing_relaxed:0,
    third_seated_relaxed:0,
    third_walking_candid:0,
    third_lean_wall:0,
    third_one_hand_pocket:1,
    third_interaction:1
  };
  assert.deepEqual(THIRD_PERSON_POSES.map(({ value }) => [value, POSE_HAND_USAGE[value]]), Object.entries(expected));
});

test('third one-hand-pocket pose prevents primary plus secondary from creating a third hand', () => {
  const result=generateImagePrompt({
    sceneType:'third_person_portrait',
    location:'saudi_office',
    poseValue:'third_one_hand_pocket',
    heldProp:'iphone-15-pro-black',
    secondaryProp:'pen-fountain'
  });
  assert.equal(result.config.held_prop,'iphone-15-pro-black');
  assert.equal(result.config.secondary_prop,'none');
  assert.match(result.prompt,/iPhone 15 Pro/i);
  assert.doesNotMatch(result.prompt,/fountain pen/i);
  assert.equal(result.sections.length,23);
});

test('third interaction pose consumes one hand and stacks with a separate hand interaction', () => {
  const collared=CLOTHING_CATALOG.find((item)=>item.garmentTags.includes('collared'));
  assert.ok(collared);
  const poseOnly=generateImagePrompt({
    sceneType:'third_person_portrait',
    location:'saudi_office',
    poseValue:'third_interaction',
    clothing:collared.prompt,
    heldProp:'ipad-pro-13'
  });
  assert.equal(poseOnly.config.held_prop,'ipad-pro-13');
  assert.match(poseOnly.prompt,/hand-count alternatives[^\n]*exactly one hand/i);

  const stacked=generateImagePrompt({
    sceneType:'third_person_portrait',
    location:'saudi_office',
    poseValue:'third_interaction',
    clothing:collared.prompt,
    handInteraction:'adjust-collar',
    heldProp:'ipad-pro-13'
  });
  assert.equal(stacked.config.held_prop,'none');
  assert.doesNotMatch(stacked.prompt,/13-inch iPad Pro/i);
  assert.match(stacked.prompt,/Fingers hooked inside the collar/i);
});

test('zero-use third standing pose keeps both hands available for a flexible prop', () => {
  const result=generateImagePrompt({
    sceneType:'third_person_portrait',
    location:'saudi_office',
    poseValue:'third_standing_relaxed',
    heldProp:'ipad-pro-13'
  });
  assert.equal(result.config.held_prop,'ipad-pro-13');
  assert.match(result.prompt,/hand-count alternatives[^\n]*exactly two hands/i);
  assert.equal(result.sections.length,23);
  assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
});

test('all six third-person poses generate valid 23-section prompts with correct hand budgets', () => {
  const fieldCases={
    third_standing_relaxed:{ heldProp:'ipad-pro-13', expectedHeld:'ipad-pro-13', expectedRemaining:0, clause:/exactly two hands/i },
    third_seated_relaxed:{ heldProp:'iphone-15-pro-black', expectedHeld:'iphone-15-pro-black', expectedRemaining:1 },
    third_walking_candid:{ heldProp:'iphone-15-pro-black', expectedHeld:'iphone-15-pro-black', expectedRemaining:1 },
    third_lean_wall:{ heldProp:'ipad-pro-13', expectedHeld:'ipad-pro-13', expectedRemaining:0, clause:/exactly two hands/i },
    third_one_hand_pocket:{ heldProp:'iphone-15-pro-black', secondaryProp:'pen-fountain', expectedHeld:'iphone-15-pro-black', expectedSecondary:'none', expectedRemaining:0 },
    third_interaction:{ heldProp:'ipad-pro-13', expectedHeld:'ipad-pro-13', expectedRemaining:0, clause:/exactly one hand/i }
  };
  for(const pose of THIRD_PERSON_POSES){
    const expected=fieldCases[pose.value];
    assert.ok(expected,pose.value);
    const result=generateImagePrompt({
      sceneType:'third_person_portrait',
      location:'saudi_office',
      poseValue:pose.value,
      heldProp:expected.heldProp,
      secondaryProp:expected.secondaryProp
    });
    assert.equal(result.config.held_prop,expected.expectedHeld,pose.value);
    if(expected.expectedSecondary) assert.equal(result.config.secondary_prop,expected.expectedSecondary,pose.value);
    if(expected.clause) assert.match(result.prompt,expected.clause,pose.value);
    assert.equal(
      getRemainingHands('third_person_portrait','third-person smartphone photograph',result.config.held_prop,pose.value),
      expected.expectedRemaining,
      pose.value
    );
    assert.equal(result.sections.length,23,pose.value);
    assert.equal(result.validation.valid,true,pose.value + ': ' + result.validation.errors.join(' | '));
    console.log(`THIRD_HAND_FIELD ${JSON.stringify({pose:pose.value,held:result.config.held_prop,secondary:result.config.secondary_prop,remaining:expected.expectedRemaining})}`);
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

test('explicit chest-up framing replaces the scene default in camera geometry', () => {
  const result=generateImagePrompt({ sceneType:'office_selfie', location:'home_office_room', framing:'chest_up' });
  const geometry=cameraGeometry(result.prompt);
  assert.equal((geometry.match(/chest-up/gi) || []).length,1);
  assert.match(geometry,/chest-up framing/i);
  assert.doesNotMatch(geometry,/chest-up to waist-up framing/i);
});

test('lean_counter falls back to generic furniture outside counter context', () => {
  const result=generateImagePrompt({ sceneType:'office_selfie', location:'home_office_room', poseValue:'lean_counter' });
  assert.deepEqual(furnitureKinds(result.prompt),['generic']);
});

test('lean_counter preserves counter furniture in canonical cafe context', () => {
  const result=generateImagePrompt({ sceneType:'cafe_selfie', location:'saudi_cafe', poseValue:'lean_counter' });
  assert.deepEqual(furnitureKinds(result.prompt),['counter']);
});

test('driver_seat bypasses legacy office-parking furniture matching', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_driver_selfie', location:'office_parking_outdoor', poseValue:'driver_seat' });
  assert.deepEqual(furnitureKinds(result.prompt),['generic']);
  assert.doesNotMatch(sceneSection(result.prompt),/The (?:desk|chair|counter)\b/i);
});

test('passenger_seat bypasses legacy office-parking furniture matching', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_passenger_selfie', location:'office_parking_outdoor', poseValue:'passenger_seat' });
  assert.deepEqual(furnitureKinds(result.prompt),['generic']);
  assert.doesNotMatch(sceneSection(result.prompt),/The (?:desk|chair|counter)\b/i);
});

test('door_open_car bypasses legacy office-parking furniture matching', () => {
  const result=generateImagePrompt({ sceneType:'door_open_car_selfie', location:'office_parking_outdoor', poseValue:'door_open_car' });
  assert.deepEqual(furnitureKinds(result.prompt),['generic']);
  assert.doesNotMatch(sceneSection(result.prompt),/The (?:desk|chair|counter)\b/i);
});

test('PR 9 field matrix covers six vehicle and bedroom cases', () => {
  const cases=[
    ['door-villa-garage',{ sceneType:'door_open_car_selfie',location:'villa_garage',poseValue:'door_open_car' },['generic']],
    ['door-office-parking',{ sceneType:'door_open_car_selfie',location:'office_parking_outdoor',poseValue:'door_open_car' },['generic']],
    ['driver-office-parking',{ sceneType:'inside_car_driver_selfie',location:'office_parking_outdoor',poseValue:'driver_seat' },['generic']],
    ['bedroom-selfie',{ sceneType:'bedroom_selfie',location:'saudi_bedroom_livedin' },['bed']],
    ['bedroom-mirror',{ sceneType:'bedroom_mirror_selfie',location:'saudi_bedroom_livedin' },['bed']],
    ['bedroom-third-person',{ sceneType:'bedroom_third_person',location:'saudi_bedroom_livedin' },['bed']]
  ];
  for(const [name,input,expectedFurniture] of cases){
    const result=generateImagePrompt(input);
    const scene=sceneSection(result.prompt);
    assert.equal(result.sections.length,23,name);
    assert.equal(result.validation.valid,true,`${name}: ${result.validation.errors.join(' | ')}`);
    assert.deepEqual(furnitureKinds(result.prompt),expectedFurniture,name);
    if(name.startsWith('bedroom-')){
      assert.match(scene,/bed[^.]*LEFT wall/i,name);
      assert.match(scene,/sliding mirrored or glass doors/i,name);
      assert.match(scene,/CURTAINS \/ BACK WALL:/i,name);
      assert.match(scene,/Do not add an armchair, a visible window, or a second nightstand/i,name);
    }
    console.log(`PR9_FIELD ${JSON.stringify({name,furniture:furnitureKinds(result.prompt),scene})}`);
  }
});

test('PR 8 field matrix preserves 23 sections and validation for five cases', () => {
  const cases=[
    ['office-standing',{ sceneType:'office_selfie',location:'home_office_room',poseValue:'standing_relaxed',framing:'chest_up' }],
    ['office-lean-counter',{ sceneType:'office_selfie',location:'home_office_room',poseValue:'lean_counter',framing:'chest_up' }],
    ['cafe-lean-counter',{ sceneType:'cafe_selfie',location:'saudi_cafe',poseValue:'lean_counter',framing:'chest_up' }],
    ['car-driver',{ sceneType:'inside_car_driver_selfie',location:'office_parking_outdoor',poseValue:'driver_seat',framing:'chest_up' }],
    ['car-passenger',{ sceneType:'inside_car_passenger_selfie',location:'office_parking_outdoor',poseValue:'passenger_seat',framing:'chest_up' }]
  ];
  for(const [name,input] of cases){
    const result=generateImagePrompt(input);
    assert.equal(result.sections.length,23,name);
    assert.equal(result.validation.valid,true,`${name}: ${result.validation.errors.join(' | ')}`);
    console.log(`PR8_FIELD ${JSON.stringify({name,cameraGeometry:cameraGeometry(result.prompt),scene:sceneSection(result.prompt)})}`);
  }
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

test('PR 10 seating physics regressions cover sofa chair and armchair', () => {
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /single discrete upholstered piece/i);
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /one unified frame/i);
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /two armrests/i);
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /When a subject is seated, the pelvis visibly compresses/i);
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /thighs align/i);
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /independent from every background sofa/i);

  assert.match(FURNITURE_GEOMETRY_RULES.chair, /single discrete one-seat piece/i);
  assert.match(FURNITURE_GEOMETRY_RULES.chair, /two narrow flat armrests/i);
  assert.match(FURNITURE_GEOMETRY_RULES.chair, /all four feet contacting the floor/i);
  assert.match(FURNITURE_GEOMETRY_RULES.chair, /When a subject is seated, the pelvis creates visible seat compression/i);
  assert.match(FURNITURE_GEOMETRY_RULES.chair, /thighs align with the seat plane/i);
  assert.match(FURNITURE_GEOMETRY_RULES.chair, /must not merge with a desk, sofa, wall, or background chair/i);

  assert.match(FURNITURE_GEOMETRY_RULES.armchair, /single discrete one-seat piece/i);
  assert.match(FURNITURE_GEOMETRY_RULES.armchair, /two rounded padded armrests/i);
  assert.match(FURNITURE_GEOMETRY_RULES.armchair, /four short wooden legs/i);
  assert.match(FURNITURE_GEOMETRY_RULES.armchair, /When a subject is seated, the pelvis visibly compresses/i);
  assert.match(FURNITURE_GEOMETRY_RULES.armchair, /back contacts the back cushion/i);
  assert.match(FURNITURE_GEOMETRY_RULES.armchair, /visually separate from every sofa and background chair/i);
});

test('PR 10 majlis sofa armrests cannot expand into blocks or extra seats', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa_geometry, /never become a block, seat, or additional cushion/i);
});

test('PR 10 sofa cushions keep one smooth upholstery treatment', () => {
  assert.match(FURNITURE_GEOMETRY_RULES.sofa, /smooth matte upholstery without pattern, print, or contrasting fabric/i);
});

test('PR 10 majlis sofas stay flush against their assigned walls', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa_geometry, /flush against the RIGHT wall/i);
  assert.match(MAJLIS_ANCHOR.side_sofas, /flush against the LEFT wall/i);
});

test('PR 10 negative constraints ban tufted upholstery', () => {
  const result=generateImagePrompt({ sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' });
  const negatives=result.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  assert.match(negatives,/tufted upholstery/i);
});

test('PR 10 majlis sofa upholstery explicitly rejects tufting quilting and buttons', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa,/no tufting, no buttons, no quilting/i);
});

test('PR 10 main majlis sofa explicitly bans tufting', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa,/no tufting/i);
});

test('PR 10 negative constraints ban dotted upholstery', () => {
  const result=generateImagePrompt({ sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' });
  const negatives=result.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  assert.match(negatives,/dotted upholstery/i);
});

test('PR 10 main majlis sofa keeps uniform monochrome upholstery', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa,/uniform monochrome surface/i);
});

test('PR 10 majlis sofa upholstery rejects visible texture artifacts', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa,/No dots, no speckles, no checkered or grid pattern/i);
});

test('PR 10 MAJLIS_ANCHOR is complete and frozen', () => {
  assert.deepEqual(Object.keys(MAJLIS_ANCHOR), ['room','main_sofa','main_sofa_geometry','side_sofas','coffee_table','rug','tv_unit','decor','fixed_layout_rule']);
  assert.equal(Object.isFrozen(MAJLIS_ANCHOR), true);
  for(const key of Object.keys(MAJLIS_ANCHOR)) assert.ok(MAJLIS_ANCHOR[key].length > 20, key);
});

test('PR 10 modern majlis anchor injects for default and all majlis variants', () => {
  const cases=[
    ['majlis-default',{ sceneType:'majlis_selfie' }],
    ['majlis-modern',{ sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' }],
    ['majlis-standing',{ sceneType:'majlis_standing_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' }],
    ['majlis-seated',{ sceneType:'majlis_seated_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' }]
  ];
  for(const [name,input] of cases){
    const scene=sceneSection(generateImagePrompt(input).prompt);
    assert.match(scene,/MAJLIS ANCHOR \(locked layout\)/i,name);
    assert.match(scene,/MAIN SOFA:/i,name);
    assert.match(scene,/SIDE SOFAS:/i,name);
  }
});

test('PR 10 traditional majlis locations never receive the modern anchor', () => {
  for(const location of ['traditional_majlis','traditional_saudi_majlis']){
    const scene=sceneSection(generateImagePrompt({ sceneType:'majlis_selfie',location,locationValue:location }).prompt);
    assert.doesNotMatch(scene,/MAJLIS ANCHOR \(locked layout\)/i,location);
  }
});

test('PR 10 majlis anchor does not leak to living-room or office scenes', () => {
  const controls=[
    ['living-room',{ sceneType:'living_room_selfie',location:'villa_living_room',locationValue:'villa_living_room' }],
    ['office',{ sceneType:'office_selfie',location:'saudi_office',locationValue:'saudi_office' }]
  ];
  for(const [name,input] of controls){
    assert.doesNotMatch(sceneSection(generateImagePrompt(input).prompt),/MAJLIS ANCHOR \(locked layout\)/i,name);
  }
});

test('PR 10 modern majlis prompts preserve 23 sections and validation', () => {
  const cases=[
    { sceneType:'majlis_selfie' },
    { sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa' },
    { sceneType:'majlis_standing_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' },
    { sceneType:'majlis_seated_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa' }
  ];
  for(const input of cases){
    const result=generateImagePrompt(input);
    assert.equal(result.sections.length,23,input.sceneType);
    assert.deepEqual(headings(result.prompt),canonical,input.sceneType);
    assert.equal(result.validation.valid,true,`${input.sceneType}: ${result.validation.errors.join(' | ')}`);
  }
});

test('PR 10 standing majlis does not emit seated sofa contact text', () => {
  const result=generateImagePrompt({ sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'standing_relaxed' });
  assert.deepEqual(furnitureKinds(result.prompt),['generic']);
  assert.doesNotMatch(sceneSection(result.prompt),/When a subject is seated|seated pelvis/i);
});

test('PR 10 traditional locationValue suppresses anchor when location text is empty', () => {
  for(const locationValue of ['traditional_majlis','traditional_saudi_majlis']){
    const scene=sceneSection(generateImagePrompt({ sceneType:'majlis_selfie',location:'',locationValue }).prompt);
    assert.doesNotMatch(scene,/MAJLIS ANCHOR \(locked layout\)/i,locationValue);
  }
});

test('PR 10 explicit modern majlis location drives anchor outside majlis scene prefix', () => {
  const result=generateImagePrompt({ sceneType:'front_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' });
  assert.match(sceneSection(result.prompt),/MAJLIS ANCHOR \(locked layout\)/i);
  assert.equal(result.sections.length,23);
  assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
});


test('PR 10 final patch keeps micro-realism fibers clothing-only', () => {
  const result=generateImagePrompt({ sceneType:'majlis_seated_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa' });
  const biological=result.prompt.split('[BIOLOGICAL_MICRO_REALISM]\n')[1].split('\n\n[CAMERA_METADATA_HINT]')[0];
  assert.match(biological,/CLOTHING fibers only/i);
});

test('PR 10 final patch removes the global uniform-fabric weave directive', () => {
  const result=generateImagePrompt({ sceneType:'majlis_seated_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa' });
  const negatives=result.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  assert.doesNotMatch(negatives,/uniform fabric without weave or fibers/i);
});

test('PR 10 final patch defines the main majlis sofa as an L-shaped sectional', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa_geometry,/L-shaped sectional/i);
});

test('PR 10 final patch uses the Xiaomi 21mm-equivalent lens profile', () => {
  const lens=lensPhysics(generateImagePrompt({ sceneType:'majlis_seated_selfie',camera:'xiaomi15_front',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa',framing:'chest_up' }).prompt);
  assert.match(lens,/21mm-equivalent/i);
});


test('PR 12 generic sofa rule contains no majlis-specific geometry', () => {
  assert.match(FURNITURE_GEOMETRY_RULES.sofa,/single discrete upholstered piece/i);
  assert.doesNotMatch(FURNITURE_GEOMETRY_RULES.sofa,/L-shaped|RIGHT wall|three-seat run|90 degrees/i);
});

test('PR 12 majlis anchor owns the full L-shaped sofa geometry', () => {
  assert.match(MAJLIS_ANCHOR.main_sofa_geometry,/ONE connected L-shaped sectional/i);
  assert.match(MAJLIS_ANCHOR.main_sofa_geometry,/flush against the RIGHT wall with no visible floor gap/i);
  assert.match(MAJLIS_ANCHOR.main_sofa_geometry,/short connected return projects inward/i);
});

test('PR 12 modern majlis scene composes material and geometry without leaking L-shape into generic furniture', () => {
  const scene=sceneSection(generateImagePrompt({ sceneType:'majlis_seated_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa' }).prompt);
  assert.match(scene,/MAIN SOFA:.*smooth matte light-sand upholstery.*ONE connected L-shaped sectional/is);
  const furniture=scene.split('FURNITURE GEOMETRY:')[1] || '';
  assert.match(furniture,/single discrete upholstered piece/i);
  assert.doesNotMatch(furniture,/L-shaped|RIGHT wall|three-seat run/i);
});

test('PR 12 majlis upholstery negatives follow the modern anchor scope exactly', () => {
  const modern=generateImagePrompt({ sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis' }).prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  const traditional=generateImagePrompt({ sceneType:'majlis_selfie',location:'traditional_saudi_majlis',locationValue:'traditional_saudi_majlis' }).prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  assert.match(modern,/tufted upholstery|dotted upholstery|visible linen grain on upholstery/i);
  assert.doesNotMatch(traditional,/tufted upholstery|dotted upholstery|visible linen grain on upholstery/i);
});

test('PR 12 bedroom keeps tufted headboard while majlis upholstery negatives stay absent', () => {
  const result=generateImagePrompt({ sceneType:'bedroom_selfie' });
  const scene=sceneSection(result.prompt);
  const negatives=result.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0];
  assert.match(scene,/dark tufted headboard/i);
  assert.doesNotMatch(negatives,/tufted upholstery|button-tufted cushions|quilted fabric|dotted upholstery/i);
});

test('PR 11 defines exactly 21 eligible seated poses and injects bedroom MacBook context for bed and floor sitting', () => {
  assert.equal(LAPTOP_SCENE_SEATED_POSES.size,21);
  assert.equal(LAPTOP_SCENE_SEATED_POSES.has('bedroom-laptop-bed'),false);
  assert.equal(LAPTOP_SCENE_SEATED_POSES.has('bedroom-laptop-armchair'),false);
  assert.match(LAPTOP_SCENE_CONTEXTS.bedroom_seated,/floor beside the subject for floor-sitting poses/i);
  for(const poseValue of ['bed-sitting-edge','bedroom-floor-cross']){
    const result=generateImagePrompt({ sceneType:'bedroom_selfie',poseValue });
    assert.match(sceneSection(result.prompt),/SCENE-SUPPORTED MACBOOK:.*modern MacBook/is,poseValue);
    assert.equal(result.sections.length,23,poseValue);
    assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
  }
});

test('PR 11 injects a closed scene-supported MacBook into seated majlis after the anchor and before furniture geometry', () => {
  const scene=sceneSection(generateImagePrompt({ sceneType:'majlis_selfie',location:'modern_saudi_majlis',locationValue:'modern_saudi_majlis',poseValue:'seated_sofa' }).prompt);
  assert.match(scene,/SCENE-SUPPORTED MACBOOK:.*closed modern MacBook.*coffee table.*away from the dallah/is);
  assert.ok(scene.indexOf('MAJLIS ANCHOR') < scene.indexOf('SCENE-SUPPORTED MACBOOK'));
  assert.ok(scene.indexOf('SCENE-SUPPORTED MACBOOK') < scene.indexOf('FURNITURE GEOMETRY'));
});

test('PR 11 injects an open scene-supported MacBook into seated office scenes', () => {
  const result=generateImagePrompt({ sceneType:'office_selfie',location:'saudi_office',locationValue:'saudi_office',poseValue:'seated_chair' });
  assert.match(sceneSection(result.prompt),/SCENE-SUPPORTED MACBOOK:.*open modern MacBook.*desk in front of the subject.*screen angled toward the user/is);
  assert.equal(result.sections.length,23);
  assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
});

test('PR 11 does not inject scene MacBook outside eligible seated bedroom majlis or office contexts', () => {
  const cases=[
    ['bedroom-standing',{ sceneType:'bedroom_selfie',poseValue:'bedroom-stand-relaxed' }],
    ['majlis-standing',{ sceneType:'majlis_selfie',location:'modern_saudi_majlis',poseValue:'standing_relaxed' }],
    ['office-standing',{ sceneType:'office_selfie',location:'saudi_office',poseValue:'standing_relaxed' }],
    ['car-seated',{ sceneType:'inside_car_selfie',poseValue:'driver_seat' }],
    ['cafe-seated',{ sceneType:'cafe_selfie',location:'saudi_cafe',poseValue:'seated_chair' }],
    ['outdoor',{ sceneType:'outdoor_selfie',poseValue:'seated_chair' }]
  ];
  for(const [name,input] of cases) assert.doesNotMatch(sceneSection(generateImagePrompt(input).prompt),/SCENE-SUPPORTED MACBOOK/i,name);
});

test('PR 11 prevents duplicate MacBooks without confusing laptop-bag with a MacBook', () => {
  for(const poseValue of ['bedroom-laptop-bed','bedroom-laptop-armchair']){
    assert.doesNotMatch(sceneSection(generateImagePrompt({ sceneType:'bedroom_selfie',poseValue }).prompt),/SCENE-SUPPORTED MACBOOK/i,poseValue);
  }
  const held=generateImagePrompt({ sceneType:'office_selfie',location:'saudi_office',poseValue:'seated_chair',heldProp:'macbook-pro-16' });
  assert.doesNotMatch(sceneSection(held.prompt),/SCENE-SUPPORTED MACBOOK/i);
  const bag=generateImagePrompt({ sceneType:'office_selfie',location:'saudi_office',poseValue:'seated_chair',heldProp:'laptop-bag' });
  assert.match(sceneSection(bag.prompt),/SCENE-SUPPORTED MACBOOK/i);
});

test('bedroom prompt contains furniture geometry rule', () => {
  const result = generateImagePrompt({ sceneType: 'bedroom_selfie' });
  assert.match(result.prompt, /FURNITURE GEOMETRY/i);
  assert.match(result.prompt, /continuous structural frame|continuous frame/i);
});

test('majlis prompt contains sofa geometry rule', () => {
  const result = generateImagePrompt({ sceneType: 'majlis_selfie', location: 'modern_saudi_majlis' });
  assert.match(result.prompt, /FURNITURE GEOMETRY/i);
  assert.match(result.prompt, /main sofa is ONE connected L-shaped sectional/i);
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

test('PR 13 biological micro-realism keeps stray hairs aligned with the selected hairstyle direction', () => {
  const result=generateImagePrompt({ hairStyle:'hair combed FORWARD onto the forehead with visible individual strands.' });
  const biological=result.prompt.split('[BIOLOGICAL_MICRO_REALISM]\n')[1].split('\n\n[CAMERA_METADATA_HINT]')[0];
  assert.match(biological,/directions consistent with the selected hairstyle direction/i);
  assert.match(biological,/Do not place stray hairs contradicting the selected direction/i);
});

test('PR 13 hair negatives follow the five resolved directions without cross-direction leakage', () => {
  const cases=[
    ['backward','hair deliberately combed BACKWARD from the forehead, hairline fully visible.','strands falling forward onto the forehead'],
    ['forward','hair combed FORWARD onto the forehead with visible individual strands.','backward-swept front hair'],
    ['side','hair parted on the LEFT side with a clear visible parting line. No forward-falling strands.','backward sweep that erases or overrides the selected side parting line'],
    ['center','hair parted down the CENTER with a clean visible parting line.','backward sweep that erases or overrides the selected center parting line'],
    ['messy','messy hair with random direction, no combing and natural soft volume.','uniformly slicked or cleanly combed hair that removes the selected disorder']
  ];
  const markers=cases.map(([, ,marker])=>marker);
  for(const [name,hairStyle,expected] of cases){
    const result=generateImagePrompt({ hairStyle });
    const negatives=result.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0].toLowerCase();
    assert.ok(negatives.includes(expected.toLowerCase()),`${name}: missing expected hair negative`);
    for(const other of markers.filter((marker)=>marker!==expected)){
      assert.equal(negatives.includes(other.toLowerCase()),false,`${name}: leaked another hair negative`);
    }
  }
});

test('PR 13 neutral hair selection adds no directional hair negatives', () => {
  const result=generateImagePrompt();
  const negatives=result.prompt.split('[NEGATIVE CONSTRAINTS]\n')[1].split('\n\n[FINAL VERIFICATION]')[0].toLowerCase();
  for(const marker of [
    'strands falling forward onto the forehead',
    'backward-swept front hair',
    'backward sweep that erases or overrides the selected side parting line',
    'backward sweep that erases or overrides the selected center parting line',
    'uniformly slicked or cleanly combed hair that removes the selected disorder'
  ]) assert.equal(negatives.includes(marker.toLowerCase()),false,marker);
});

test('PR 13 final verification requires unmistakably visible selected hair direction', () => {
  const result=generateImagePrompt({ hairStyle:'hair combed FORWARD onto the forehead with visible individual strands.' });
  const verification=result.prompt.split('[FINAL VERIFICATION]\n')[1];
  assert.match(verification,/the selected hair direction is unmistakably visible/i);
  assert.match(verification,/stray hairs \(if visible\) respect the selected direction/i);
});

test('PR 13 directional prompts contain no double periods and preserve canonical validation', () => {
  for(const hairStyle of [
    'hair deliberately combed BACKWARD from the forehead, hairline fully visible.',
    'hair combed FORWARD onto the forehead with visible individual strands.',
    'hair parted on the LEFT side with a clear visible parting line. No forward-falling strands.',
    'hair parted down the CENTER with a clean visible parting line.',
    'messy hair with random direction, no combing and natural soft volume.'
  ]){
    const result=generateImagePrompt({ hairStyle });
    assert.doesNotMatch(result.prompt,/\.\./);
    assert.equal(result.sections.length,23);
    assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
  }
});

function pr17Section(prompt, name, nextName) {
  return prompt.split(`[${name}]\n`)[1].split(`\n\n[${nextName}]\n`)[0];
}

const PR17_FORWARD_HAIR='hair combed FORWARD onto the forehead with visible individual strands.';

test('PR 17 HAIR_LOCK preserves density curl pattern top volume and length from the reference', () => {
  const result=generateImagePrompt({ hairStyle:PR17_FORWARD_HAIR });
  const identity=pr17Section(result.prompt,'IDENTITY / SUBJECT','SCENE');
  assert.match(identity,/Hair DENSITY, thickness, CURL PATTERN, and length must match the reference image EXACTLY/i);
  assert.match(identity,/top volume/i);
});

test('PR 17 HAIR_LOCK explicitly forbids top-volume inflation and added hair mass', () => {
  const result=generateImagePrompt({ hairStyle:PR17_FORWARD_HAIR });
  const identity=pr17Section(result.prompt,'IDENTITY / SUBJECT','SCENE');
  assert.match(identity,/Do not inflate top volume/i);
  assert.match(identity,/Do not add hair mass/i);
  assert.match(identity,/Do not stylize the curl tighter or looser than the reference/i);
});

test('PR 17 forward direction changes only the front section without volumetric restyling', () => {
  const result=generateImagePrompt({ hairStyle:PR17_FORWARD_HAIR });
  const identity=pr17Section(result.prompt,'IDENTITY / SUBJECT','SCENE');
  assert.match(identity,/ONLY the front section changes direction so strands fall forward onto the upper forehead/i);
  assert.match(identity,/Top volume, curl pattern, and total hair mass remain unchanged from the reference/i);
  assert.match(identity,/The change is directional, not volumetric/i);
});

test('PR 17 directional hair negatives reject inflated volume and exaggerated curls only when direction is specified', () => {
  const directed=generateImagePrompt({ hairStyle:PR17_FORWARD_HAIR });
  const directedNegatives=pr17Section(directed.prompt,'NEGATIVE CONSTRAINTS','FINAL VERIFICATION');
  assert.match(directedNegatives,/inflated hair volume/i);
  assert.match(directedNegatives,/exaggerated curl pattern/i);
  assert.match(directedNegatives,/added hair density/i);
  assert.match(directedNegatives,/exaggerated top lift/i);

  const neutral=generateImagePrompt({ hairStyle:'' });
  const neutralNegatives=pr17Section(neutral.prompt,'NEGATIVE CONSTRAINTS','FINAL VERIFICATION');
  assert.doesNotMatch(neutralNegatives,/inflated hair volume/i);
  assert.doesNotMatch(neutralNegatives,/exaggerated curl pattern/i);
});

test('PR 17 FINAL VERIFICATION checks reference hair identity while allowing only front-direction change', () => {
  const result=generateImagePrompt({ hairStyle:PR17_FORWARD_HAIR });
  const verification=result.prompt.split('[FINAL VERIFICATION]\n')[1];
  assert.match(verification,/hair density, curl pattern, top volume, and length match the reference/i);
  assert.match(verification,/only the direction of the front section has changed/i);
});

test('PR 17 fuel-station driver selfie preserves the canonical 23-section invariant', () => {
  const result=generateImagePrompt({
    sceneType:'inside_car_selfie',
    poseValue:'driver_seat',
    pose:'driver_seat',
    hairStyle:PR17_FORWARD_HAIR,
    location:'at a modern Saudi fuel station with canopy lighting, pumps, lane markings, convenience-store context, and correct safety clearances'
  });
  assert.equal(result.sections.length,23);
  assert.equal(result.validation.valid,true,result.validation.errors.join(' | '));
});

test('PR 18 inside_car_selfie injects the fixed Range Rover Sport CAR_ANCHOR', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_selfie' });
  const scene=sceneSection(result.prompt);
  assert.match(scene,/CAR INTERIOR ANCHOR:/i);
  assert.match(scene,/2017 Range Rover Sport Autobiography Dynamic L494, Saudi-spec/i);
  assert.match(scene,/Fuji White/i);
  assert.match(scene,/Ivory perforated leather seats/i);
  assert.match(scene,/left-hand drive \(Saudi-spec\)/i);
});

test('PR 18 inside_car_driver_selfie injects CAR_ANCHOR', () => {
  const scene=sceneSection(generateImagePrompt({ sceneType:'inside_car_driver_selfie' }).prompt);
  assert.match(scene,/CAR INTERIOR ANCHOR:.*Range Rover Sport/is);
});

test('PR 18 inside_car_passenger_selfie injects CAR_ANCHOR', () => {
  const scene=sceneSection(generateImagePrompt({ sceneType:'inside_car_passenger_selfie' }).prompt);
  assert.match(scene,/CAR INTERIOR ANCHOR:.*panoramic roof with visible glass panel/is);
});

test('PR 18 door-open and group car selfies both inject CAR_ANCHOR', () => {
  for(const sceneType of ['door_open_car_selfie','car_group_selfie']){
    const scene=sceneSection(generateImagePrompt({ sceneType }).prompt);
    assert.match(scene,/CAR INTERIOR ANCHOR:.*Fuji White/is,sceneType);
  }
});

test('PR 18 non-car scenes do not inject CAR_ANCHOR', () => {
  for(const sceneType of ['office_selfie','bedroom_selfie','majlis_selfie']){
    assert.doesNotMatch(sceneSection(generateImagePrompt({ sceneType }).prompt),/CAR INTERIOR ANCHOR:/i,sceneType);
  }
});

test('PR 18 car anchor precedes furniture geometry and preserves the canonical 23-section invariant', () => {
  for(const sceneType of ['inside_car_selfie','inside_car_driver_selfie','inside_car_passenger_selfie','door_open_car_selfie','car_group_selfie']){
    const result=generateImagePrompt({ sceneType });
    const scene=sceneSection(result.prompt);
    assert.ok(scene.indexOf('CAR INTERIOR ANCHOR:')>=0,sceneType);
    assert.ok(scene.indexOf('CAR INTERIOR ANCHOR:') < scene.indexOf('FURNITURE GEOMETRY:'),sceneType);
    assert.equal(result.sections.length,23,sceneType);
    assert.equal(result.validation.valid,true,`${sceneType}: ${result.validation.errors.join(' | ')}`);
  }
});

