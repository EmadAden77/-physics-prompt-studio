import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { clothingForScene, clothingSceneCoherence, compatibleOptions, compatibilitySnapshot, locationsForScene, recommendedDefaults, resolveCompatibleValue, resolveContextAwareConstraints } from '../core/scene-compatibility.js';
import { LOCATION_CATALOG, SAUDI_LOCATIONS, CLOTHING_CATALOG, HOME_CLOTHING, BEDROOM_POSES, BEDROOM_ANCHOR, BEDROOM_CLUTTER_LEVELS, BEDROOM_REALISM_RULES, getBedroomRealismRules, SELFIE_POSES, SELFIE_ANGLES, LIGHTING_PROFILES } from '../core/scene-builder.js';
import { BEDROOM_THIRD_PERSON_POSES } from '../core/scene-compatibility.js';
import { CAMERA_PROFILES, FRAMING_OPTIONS, SCENE_TYPES, generateImagePrompt } from '../core/prompt-generator.js';
import { baseSceneTypeFor, EXTRA_SCENE_TYPES } from '../core/scene-type-expansion.js';

const catalogs = {
  location: LOCATION_CATALOG,
  clothing: CLOTHING_CATALOG,
  pose: SELFIE_POSES,
  angle: SELFIE_ANGLES,
  lighting: LIGHTING_PROFILES,
  camera: CAMERA_PROFILES,
  framing: FRAMING_OPTIONS
};

const values = (items) => items.map((item) => item.value);

test('LOCATION_CATALOG is single source of truth', () => {
  assert.equal(LOCATION_CATALOG.length, 125);
  assert.equal(new Set(LOCATION_CATALOG.map((item) => item.value)).size, 125, 'location values must be unique');
  for (const loc of LOCATION_CATALOG) {
    assert.ok(Array.isArray(loc.sceneTypes), `${loc.value}: sceneTypes must be an array`);
    assert.ok(loc.sceneTypes.length > 0, `${loc.value}: missing sceneTypes`);
  }
});

test('LOCATION_CATALOG is now 125', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  assert.equal(LOCATION_CATALOG.length, 125);
});

test('there are exactly 20 military locations', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  const military = LOCATION_CATALOG.filter(l => l.value.startsWith('military_'));
  assert.equal(military.length, 20);
});

test('military_meal_selfie exposes at least 20 locations', async () => {
  const { locationsForScene } = await import('../core/scene-compatibility.js');
  const meal = locationsForScene('military_meal_selfie');
  assert.ok(meal.length >= 20, `Only ${meal.length} locations`);
});

test('every military location explicitly forbids emblems and weapons', async () => {
  const { LOCATION_CATALOG } = await import('../core/scene-builder.js');
  const military = LOCATION_CATALOG.filter(l => l.value.startsWith('military_'));
  for (const loc of military) {
    assert.match(loc.prompt, /no emblems|without any emblems|no identifiable emblems/i,
      `${loc.value}: missing emblems prohibition`);
    assert.match(loc.prompt, /no visible weapons|without weapons|no weapons|no emblems[^.]*\bweapons\b/i,
      `${loc.value}: missing weapons prohibition`);
  }
});

test('military_meal_selfie does not leak civilian locations', async () => {
  const { locationsForScene } = await import('../core/scene-compatibility.js');
  const meal = locationsForScene('military_meal_selfie');
  const locationValues = meal.map(l => l.value);
  assert.ok(!locationValues.includes('saudi_office'));
  assert.ok(!locationValues.includes('modern_saudi_majlis'));
  assert.ok(!locationValues.includes('specialty_coffee'));
});

test('SAUDI_LOCATIONS is a derived alias of LOCATION_CATALOG', () => {
  assert.equal(SAUDI_LOCATIONS.length, LOCATION_CATALOG.length);
  assert.deepEqual(
    SAUDI_LOCATIONS.map((location) => location.value).sort(),
    LOCATION_CATALOG.map((location) => location.value).sort()
  );
  assert.ok(SAUDI_LOCATIONS.every((location) => !Object.hasOwn(location, 'sceneTypes')));
});

test('no legacy location arrays remain', async () => {
  const src = await readFile('core/scene-compatibility.js', 'utf8');
  for (const legacy of ['MAJLIS_LOCATIONS', 'CAR_LOCATIONS', 'OUTDOOR_LOCATIONS', 'WALKING_LOCATIONS', 'SEATED_LOCATIONS', 'MIRROR_LOCATIONS', 'CAFE_LOCATIONS', 'OFFICE_LOCATIONS']) {
    assert.ok(!src.includes(legacy), `${legacy} still present`);
  }
});

test('no keyword location arrays in scene-type-expansion', async () => {
  const src = await readFile('core/scene-type-expansion.js', 'utf8');
  assert.ok(!/location:\s*\[/.test(src), 'keyword location arrays still present');
});

test('variants inherit from baseType when they have no direct location mapping', () => {
  const variantLocations = locationsForScene('high_angle_selfie');
  const baseLocations = locationsForScene('front_selfie');
  assert.deepEqual(values(variantLocations), values(baseLocations));
});

test('specialized location mappings override broad base inheritance', () => {
  assert.deepEqual(values(locationsForScene('supermarket_selfie')), ['supermarket_aisle', 'convenience_store', 'grocery_store']);
  assert.deepEqual(values(locationsForScene('gym_wash_area_selfie')), ['gym_sink_mirror_area']);
});

test('no leakage between scene families', () => {
  const carValues = values(locationsForScene('inside_car_selfie'));
  assert.ok(!carValues.includes('government_office_hall'));
  assert.ok(!carValues.includes('supermarket_aisle'));
  assert.ok(!carValues.includes('saudi_office'));

  const officeValues = values(locationsForScene('office_selfie'));
  assert.ok(!officeValues.includes('desert_roadside'));
  assert.ok(!officeValues.includes('gulf_beach'));
  assert.ok(!officeValues.includes('supermarket_aisle'));
});

test('every location sceneType resolves to a valid base sceneType', () => {
  const validBaseTypes = new Set(SCENE_TYPES.map((scene) => scene.value));
  for (const loc of LOCATION_CATALOG) {
    for (const sceneType of loc.sceneTypes) {
      const base = baseSceneTypeFor(sceneType);
      assert.ok(validBaseTypes.has(base), `${loc.value}: invalid base sceneType "${sceneType}" -> "${base}"`);
    }
  }
});

test('inside-car selfie exposes only car-compatible pose, angle and camera choices', () => {
  const snapshot = compatibilitySnapshot('inside_car_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['driver_seat', 'passenger_seat']);
  assert.deepEqual(values(snapshot.angle), ['driver_eye_level', 'driver_slight_high', 'driver_low']);
  assert.equal(values(snapshot.camera).includes('smartphone_rear'), false);
  assert.equal(values(snapshot.lighting).includes('car_daylight'), true);
  assert.equal(values(snapshot.lighting).includes('night_majlis_warm'), false);
  assert.ok(values(snapshot.location).includes('villa_driveway'));
  assert.ok(values(snapshot.location).includes('covered_parking_shade'));
  assert.ok(!values(snapshot.location).includes('supermarket_aisle'));
});

test('majlis selfie only exposes explicitly mapped majlis locations and lighting', () => {
  const snapshot = compatibilitySnapshot('majlis_selfie', catalogs);
  assert.deepEqual(values(snapshot.location), ['modern_saudi_majlis', 'traditional_majlis']);
  assert.equal(values(snapshot.lighting).includes('night_majlis_warm'), true);
  assert.equal(values(snapshot.lighting).includes('night_gas_station'), false);
  assert.equal(values(snapshot.lighting).includes('night_phone_screen'), false);
  assert.equal(values(snapshot.pose).includes('driver_seat'), false);
});

test('walking selfie removes seated and vehicle-only choices', () => {
  const snapshot = compatibilitySnapshot('walking_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['walking_slow', 'walking_looking_back']);
  assert.equal(values(snapshot.angle).includes('driver_eye_level'), false);
  assert.equal(values(snapshot.location).includes('modern_saudi_majlis'), false);
  assert.equal(values(snapshot.location).includes('boulevard_walkway'), true);
});

test('mirror selfie receives mirror-specific pose and angle catalogs', () => {
  const snapshot = compatibilitySnapshot('mirror_selfie', catalogs);
  assert.equal(values(snapshot.pose).every((value) => value.startsWith('mirror_')), true);
  assert.equal(values(snapshot.angle).every((value) => value.startsWith('mirror_')), true);
  assert.equal(values(snapshot.angle).includes('driver_eye_level'), false);
  assert.ok(values(snapshot.location).includes('saudi_bedroom_livedin'));
  assert.ok(values(snapshot.location).includes('gym_sink_mirror_area'));
  assert.ok(!values(snapshot.location).includes('service_road'));
});

test('third-person scenes never expose selfie camera geometry', () => {
  const portrait = compatibilitySnapshot('third_person_portrait', catalogs);
  const fullBody = compatibilitySnapshot('full_body_third_person', catalogs);
  assert.deepEqual(values(portrait.camera), ['smartphone_rear']);
  assert.equal(values(portrait.pose).every((value) => value.startsWith('third_')), true);
  assert.equal(values(portrait.angle).every((value) => value.startsWith('third_')), true);
  assert.deepEqual(values(fullBody.framing), ['full_body']);
  assert.equal(values(fullBody.angle).includes('driver_eye_level'), false);
});

test('office selfie uses all explicit office locations and excludes unrelated locations', () => {
  const snapshot = compatibilitySnapshot('office_selfie', catalogs);
  const locationValues = values(snapshot.location);
  for (const expected of ['saudi_office', 'real_estate_office', 'home_office_room', 'coworking_space', 'office_break_room', 'office_corridor', 'meeting_room']) {
    assert.ok(locationValues.includes(expected), `${expected} should be office-compatible`);
  }
  assert.ok(!locationValues.includes('desert_roadside'));
  assert.ok(!locationValues.includes('supermarket_aisle'));
  assert.equal(values(snapshot.lighting).includes('night_office_led'), true);
  assert.equal(values(snapshot.lighting).includes('night_car_practicals'), false);
  assert.equal(values(snapshot.lighting).includes('night_phone_screen'), false);
});

test('supermarket scene only exposes supermarket-compatible locations', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  assert.deepEqual(values(snapshot.location), ['supermarket_aisle', 'convenience_store', 'grocery_store']);
});

test('supermarket scene only exposes supermarket-compatible lighting', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  assert.ok(snapshot.lighting.length >= 3);
  assert.ok(snapshot.lighting.every((lighting) => /supermarket|retail|fluorescent|store/i.test(lighting.value)));
  assert.ok(!snapshot.lighting.some((lighting) => /office|majlis|cafe/i.test(lighting.value)));
  assert.deepEqual(values(snapshot.lighting), ['supermarket_fluorescent', 'retail_ceiling_led', 'mixed_retail']);
});

test('supermarket scene exposes only compatible poses and framing', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  assert.deepEqual(values(snapshot.pose), ['standing_relaxed', 'walking_slow', 'holding_basket']);
  assert.deepEqual(values(snapshot.framing), ['chest_up', 'waist_up', 'three_quarter']);
  assert.equal(values(snapshot.pose).includes('lean_counter'), false);
  assert.equal(values(snapshot.framing).includes('full_body'), false);
});

test('changing sceneType resets incompatible selections', () => {
  const snapshot = compatibilitySnapshot('supermarket_selfie', catalogs);
  const defaults = recommendedDefaults('supermarket_selfie');

  assert.equal(snapshot.location.some((item) => item.value === 'boulevard_walkway'), false, 'boulevard should not be compatible with supermarket');
  assert.equal(resolveCompatibleValue('boulevard_walkway', snapshot.location, defaults.location), 'supermarket_aisle');
  assert.equal(resolveCompatibleValue('night_office_led', snapshot.lighting, defaults.lighting), 'supermarket_fluorescent');
  assert.equal(resolveCompatibleValue('lean_counter', snapshot.pose, defaults.pose), 'walking_slow');
  assert.equal(resolveCompatibleValue('driver_eye_level', snapshot.angle, defaults.angle), 'eye_centered');
  assert.equal(resolveCompatibleValue('full_body', snapshot.framing, defaults.framing), 'chest_up');
});

test('bedroom scene does not allow lively background activity', () => {
  const snapshot = compatibilitySnapshot('bedroom_mirror_selfie', catalogs);
  assert.deepEqual(snapshot.backgroundActivityAllowed, ['quiet', 'normal']);

  const resolved = resolveContextAwareConstraints({
    sceneType: 'mirror_selfie',
    requestedSceneType: 'bedroom_mirror_selfie',
    location: 'inside a Saudi bedroom',
    backgroundActivity: 'lively',
    lighting: 'warm room lamp'
  });
  assert.equal(resolved.backgroundActivity, 'normal');
  assert.deepEqual(resolved.backgroundActivityAllowed, ['quiet', 'normal']);
  assert.match(resolved.warnings.join(' '), /النشاط تغيّر إلى normal/);
});

test('mosques and libraries are quiet-only while car interiors are quiet-only', () => {
  const mosque = resolveContextAwareConstraints({ sceneType: 'front_selfie', location: 'inside a Saudi mosque', backgroundActivity: 'lively' });
  const library = resolveContextAwareConstraints({ sceneType: 'front_selfie', location: 'inside a library reading room', backgroundActivity: 'normal' });
  const car = resolveContextAwareConstraints({ sceneType: 'inside_car_selfie', location: 'inside a stationary car', backgroundActivity: 'lively' });
  assert.equal(mosque.backgroundActivity, 'quiet');
  assert.equal(library.backgroundActivity, 'quiet');
  assert.equal(car.backgroundActivity, 'quiet');
});

test('phone-screen-only remains allowed in the bedroom studio when explicitly selected as the sole source', () => {
  const resolved = resolveContextAwareConstraints({
    sceneType: 'front_selfie',
    requestedSceneType: 'bedroom_selfie',
    location: 'inside the fixed Saudi bedroom',
    backgroundActivity: 'quiet',
    lighting: 'phone-screen-only lighting'
  });
  assert.match(resolved.lighting, /phone-screen-only/i);
  assert.match(resolved.lighting, /No other light sources visible in frame/i);
  assert.ok(!resolved.warnings.some((warning) => warning.includes('الإضاءة تغيّرت')));
});

test('phone-screen-only remains allowed in a naturally dark car and excludes other visible sources', () => {
  const resolved = resolveContextAwareConstraints({
    sceneType: 'inside_car_selfie',
    location: 'inside a stationary car at night',
    backgroundActivity: 'quiet',
    lighting: 'phone-screen-only lighting'
  });
  assert.match(resolved.lighting, /phone-screen-only/i);
  assert.match(resolved.lighting, /No other light sources visible in frame/i);
});

test('clothing remains available when it is physically compatible with the scene', () => {
  const options = compatibleOptions('inside_car_selfie', 'clothing', CLOTHING_CATALOG);
  assert.equal(options.length, CLOTHING_CATALOG.length);
});

test('recommended defaults switch camera and framing by capture type', () => {
  assert.deepEqual(recommendedDefaults('inside_car_selfie'), { camera: 'xiaomi15_front', framing: 'chest_up' });
  assert.deepEqual(recommendedDefaults('mirror_selfie'), { camera: 'smartphone_rear', framing: 'waist_up' });
  assert.deepEqual(recommendedDefaults('full_body_third_person'), { camera: 'smartphone_rear', framing: 'full_body' });
  assert.deepEqual(recommendedDefaults('supermarket_selfie'), {
    location: 'supermarket_aisle',
    pose: 'walking_slow',
    angle: 'eye_centered',
    lighting: 'supermarket_fluorescent',
    camera: 'xiaomi15_front',
    framing: 'chest_up'
  });
});

test('BEDROOM_ANCHOR is complete', () => {
  for (const key of ['room', 'coordinate_frame', 'door', 'bed', 'bedroom_chair', 'wardrobe', 'mirror', 'dresser', 'nightstand', 'curtains', 'air_conditioner', 'ceiling', 'rug', 'circulation', 'fixed_daily_items', 'materials', 'fixed_layout_rule']) {
    assert.ok(BEDROOM_ANCHOR[key], `missing BEDROOM_ANCHOR.${key}`);
    assert.ok(BEDROOM_ANCHOR[key].length > 20, `${key} is too short`);
  }
});

test('BEDROOM_POSES has exactly 40 positions in 9 groups with 37 direct and 3 mirror poses', () => {
  assert.equal(BEDROOM_POSES.length, 40);
  const groups = new Set(BEDROOM_POSES.map((pose) => pose.group));
  assert.equal(groups.size, 9);
  assert.equal(BEDROOM_POSES.filter((pose) => pose.group === 'مرآة').length, 3);
  assert.equal(BEDROOM_POSES.filter((pose) => pose.group !== 'مرآة').length, 37);
});

test('HOME_CLOTHING has exactly 58 items with explicit color catalogs', () => {
  assert.equal(HOME_CLOTHING.length, 58);
  assert.equal(HOME_CLOTHING.filter((item) => item.value.startsWith('tee-')).length, 15);
  assert.equal(HOME_CLOTHING.filter((item) => item.value.startsWith('shorts-')).length, 12);
  assert.ok(HOME_CLOTHING.every((item) => !Object.hasOwn(item, 'sceneTypes')));
});

test('bedroom scenes are only 3 and old bedroom/home-relaxation scenes are gone', () => {
  const bedroomScenes = EXTRA_SCENE_TYPES.filter((scene) => scene.value.startsWith('bedroom_'));
  assert.deepEqual(values(bedroomScenes), ['bedroom_selfie', 'bedroom_mirror_selfie', 'bedroom_third_person']);
  const removed = [
    'mirror_bedroom_selfie','reclining_bed_selfie','lying_bed_selfie','morning_bed_selfie','night_bed_selfie',
    'sofa_relaxed_selfie','sofa_lying_selfie','floor_seated_selfie','floor_leaning_wall_selfie','reading_at_home_selfie',
    'tea_at_home_selfie','friday_morning_selfie','home_evening_selfie','window_light_home_selfie','balcony_morning_selfie','home_couch_blanket_selfie'
  ];
  const sceneValues = new Set(EXTRA_SCENE_TYPES.map((scene) => scene.value));
  for (const value of removed) assert.equal(sceneValues.has(value), false, `${value} still exists`);
});

test('every bedroom prompt contains the rewritten locked room anchor', () => {
  for (const sceneType of ['bedroom_selfie', 'bedroom_mirror_selfie', 'bedroom_third_person']) {
    const result = generateImagePrompt({ sceneType });
    assert.match(result.prompt, /ROOM ANCHOR/i);
    assert.match(result.prompt, /bed[^.]*LEFT wall/i);
    assert.match(result.prompt, /sliding mirrored or reflective glass doors/i);
    assert.match(result.prompt, /RIGHT-WALL STORAGE:/i);
    assert.match(result.prompt, /CURTAINS \/ BACK WALL:/i);
    assert.match(result.prompt, /Fully closed black(?:-to-charcoal)? curtains/i);
    assert.match(result.prompt, /Exactly one [^.]*nightstand exists/i);
    assert.match(result.prompt, /BEDROOM CHAIR:/i);
    assert.match(result.prompt, /Do not add a second nightstand, second chair, sofa, desk, television, freestanding mirror or visible window/i);
    assert.match(result.prompt, /BEDROOM PHYSICS \/ CONTINUITY:/i);
    assert.match(result.prompt, /WARDROBE REFLECTION PHYSICS:/i);
    assert.match(result.prompt, /ROOM CLUTTER:/i);
  }
});

test('bedroom clutter levels preserve the fixed furniture model and never invent a visible window', () => {
  for (const level of ['clean', 'minimal', 'light', 'moderate', 'heavy']) {
    assert.doesNotMatch(BEDROOM_CLUTTER_LEVELS[level], /visible window|second nightstand|second chair/i, level);
  }
  assert.match(BEDROOM_CLUTTER_LEVELS.moderate, /fixed bag, two shoe pairs and draped chair garment remain in their locked zones/i);
});

test('bedroom poses preserve the curtained wall and use only wardrobe reflective panels', () => {
  for (const pose of BEDROOM_POSES) {
    const description = `${pose.prompt} ${pose.cameraHint}`;
    assert.doesNotMatch(description, /(?<!invent a )visible window|separate framed mirror|bedroom mirror|window frame|exterior view/i, pose.value);
  }
  const curtainPose = BEDROOM_POSES.find((pose) => pose.value === 'bedroom-stand-curtains');
  assert.match(curtainPose.prompt, /fully closed back-wall curtains/i);
  assert.equal(BEDROOM_POSES.some((pose) => pose.value === 'bedroom-stand-window'), false);
  const legacy=generateImagePrompt({sceneType:'bedroom_selfie',pose:'bedroom-stand-window'});
  assert.match(legacy.prompt, /standing on the grounded floor near the fully closed back-wall curtains/i);
  for (const pose of BEDROOM_POSES.filter((item) => item.group === 'مرآة')) {
    assert.match(pose.prompt, /RIGHT-wall wardrobe/i, pose.value);
    assert.match(pose.cameraHint, /wardrobe reflective panel/i, pose.value);
  }
});

test('floor poses and third-person bedroom poses obey the fixed room geometry', () => {
  for (const pose of BEDROOM_POSES.filter((item) => item.value.startsWith('bedroom-floor-'))) {
    assert.match(getBedroomRealismRules(pose.value).join(' '), /FLOOR-SEATED PHYSICS:/, pose.value);
  }
  assert.equal(BEDROOM_THIRD_PERSON_POSES.length, 6);
  assert.deepEqual(values(compatibleOptions('bedroom_third_person','pose',[])), values(BEDROOM_THIRD_PERSON_POSES));
  for (const pose of BEDROOM_THIRD_PERSON_POSES) {
    assert.match(pose.prompt, /bed|wardrobe|curtain/i, pose.value);
    const result = generateImagePrompt({sceneType:'bedroom_third_person',pose:pose.value});
    assert.ok(result.prompt.includes(pose.prompt), pose.value);
  }
  assert.match(getBedroomRealismRules('third_seated_relaxed').join(' '), /BED PHYSICS:/);
  assert.match(getBedroomRealismRules('third_interaction').join(' '), /CURTAIN PHYSICS:/);
});

test('bedroom object poses allocate the phone hand and preserve body support', () => {
  for (const value of ['bedroom-laptop-bed', 'bedroom-laptop-armchair', 'bedroom-cup-bed', 'bedroom-tea-armchair', 'bedroom-book-bed', 'bed-lying-reading']) {
    const pose = BEDROOM_POSES.find((item) => item.value === value);
    assert.match(pose.prompt, /free hand/i, value);
    assert.match(pose.prompt, /other hand|other arm|one hand holds the phone/i, value);
    assert.match(pose.prompt, /compressing (?:the mattress|its seat)/i, value);
  }
  for (const value of ['bedroom-laptop-armchair', 'bedroom-tea-armchair']) {
    assert.match(BEDROOM_POSES.find((item) => item.value === value).prompt, /feet grounded|front-wall bedroom chair/i);
  }
});

test('bed sitting back support uses the headboard and phone-only stays standing', () => {
  for (const value of ['bed-sitting-back-wall','bed-sitting-legs-extended']) {
    const pose=BEDROOM_POSES.find((item)=>item.value===value);
    assert.match(pose.prompt,/attached.*headboard/i,value);
    assert.match(pose.prompt,/pillow/i,value);
    assert.match(pose.prompt,/pelvis.*compressing the mattress/i,value);
    assert.match(getBedroomRealismRules(value).join(' '),/BED PHYSICS:/,value);
    assert.ok(generateImagePrompt({sceneType:'bedroom_selfie',pose:value}).prompt.includes(pose.prompt),value);
  }
  const only=BEDROOM_POSES.find((item)=>item.value==='bedroom-phone-only');
  assert.match(only.prompt,/standing.*both feet grounded/i);
  assert.doesNotMatch(getBedroomRealismRules(only.value).join(' '),/BED PHYSICS:/);
});

test('bedroom hand interaction cannot reuse a hand holding a cup or book', () => {
  for (const pose of ['bedroom-cup-bed','bedroom-book-bed']) {
    const result=generateImagePrompt({sceneType:'bedroom_selfie',pose,handInteraction:'wipe-sweat'});
    assert.doesNotMatch(result.prompt, /wip(?:e|ing) sweat with (?:the )?(?:free |one )?hand/i, pose);
  }
});

test('bedroom realism packet is pose-aware without weakening the continuity lock', () => {
  const bedRules = getBedroomRealismRules('bed-lying-side', 'subject-held front-camera selfie').join(' ');
  const chairRules = getBedroomRealismRules('armchair-sit-lean-back', 'subject-held front-camera selfie').join(' ');
  const curtainRules = getBedroomRealismRules('bedroom-curtain-touch', 'subject-held front-camera selfie').join(' ');
  assert.match(bedRules, /BED PHYSICS:/i);
  assert.match(chairRules, /CHAIR PHYSICS:/i);
  assert.match(curtainRules, /CURTAIN PHYSICS:/i);
  for (const rules of [bedRules, chairRules, curtainRules]) {
    assert.match(rules, /CONTINUITY LOCK:/i);
    assert.match(rules, /WARDROBE REFLECTION PHYSICS:/i);
  }
  assert.match(BEDROOM_REALISM_RULES.scale, /ROOM SCALE:/i);
});

test('bedroom selfie exposes 37 non-mirror poses and mirror scene exposes only 3 mirror poses', () => {
  const direct = compatibleOptions('bedroom_selfie', 'pose', []);
  const mirror = compatibleOptions('bedroom_mirror_selfie', 'pose', []);
  assert.equal(direct.length, 37);
  assert.ok(direct.every((pose) => pose.group !== 'مرآة'));
  assert.equal(mirror.length, 3);
  assert.ok(mirror.every((pose) => pose.group === 'مرآة'));
});

test('bedroom scenes expose only their intended lighting sets', () => {
  assert.deepEqual(values(compatibleOptions('bedroom_selfie', 'lighting', LIGHTING_PROFILES)), [
    'day_window', 'night_home_warm', 'night_phone_screen', 'screen_flash_only', 'low_key_bedroom'
  ]);
  assert.deepEqual(values(compatibleOptions('bedroom_mirror_selfie', 'lighting', LIGHTING_PROFILES)), [
    'day_window', 'night_home_warm', 'night_phone_screen'
  ]);
  assert.deepEqual(values(compatibleOptions('bedroom_third_person', 'lighting', LIGHTING_PROFILES)), [
    'day_window', 'night_home_warm', 'night_phone_screen', 'phone_led_flash_only', 'low_key_bedroom'
  ]);
});

test('non-bedroom prompts do not contain the bedroom anchor', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie', location: 'inside an ordinary Saudi cafe' });
  assert.doesNotMatch(result.prompt, /ROOM ANCHOR/i);
  assert.doesNotMatch(result.prompt, /This is a locked room layout/i);
});

test('office_selfie does NOT expose any HOME_CLOTHING item', async () => {
  const allClothing = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  const options = compatibleOptions('office_selfie', 'clothing', allClothing);
  const homeClothingValues = new Set(HOME_CLOTHING.map((item) => item.value));
  const leaked = options.filter((item) => homeClothingValues.has(item.value));
  assert.equal(leaked.length, 0, `Leaked: ${leaked.map((item) => item.value).join(', ')}`);
});

test('front_selfie does NOT expose any HOME_CLOTHING item', async () => {
  const allClothing = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  const options = compatibleOptions('front_selfie', 'clothing', allClothing);
  const homeClothingValues = new Set(HOME_CLOTHING.map((item) => item.value));
  const leaked = options.filter((item) => homeClothingValues.has(item.value));
  assert.equal(leaked.length, 0);
});

test('inside_car_selfie does NOT expose any HOME_CLOTHING item', async () => {
  const allClothing = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  const options = compatibleOptions('inside_car_selfie', 'clothing', allClothing);
  const homeClothingValues = new Set(HOME_CLOTHING.map((item) => item.value));
  const leaked = options.filter((item) => homeClothingValues.has(item.value));
  assert.equal(leaked.length, 0);
});

test('bedroom_selfie exposes exactly 58 HOME_CLOTHING items', () => {
  const options = compatibleOptions('bedroom_selfie', 'clothing', []);
  assert.equal(options.length, HOME_CLOTHING.length);
  assert.equal(options.length, 58);
});

test('bedroom mirror and third-person scenes expose exactly 58 HOME_CLOTHING items', () => {
  for (const scene of ['bedroom_mirror_selfie', 'bedroom_third_person']) {
    const options = compatibleOptions(scene, 'clothing', []);
    assert.equal(options.length, HOME_CLOTHING.length, `${scene} clothing count changed`);
    assert.deepEqual(values(options), values(HOME_CLOTHING), `${scene} clothing catalog differs from HOME_CLOTHING`);
  }
});

test('non-bedroom scenes expose no tee-white / tee-black / shorts-* items', async () => {
  const allClothing = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  const forbidden = /^tee-|^shorts-|^set-|^pj-|^robe-|^lounge-|^nightthobe-/;
  for (const scene of ['office_selfie', 'cafe_selfie', 'front_selfie', 'outdoor_selfie', 'inside_car_selfie']) {
    const options = compatibleOptions(scene, 'clothing', allClothing);
    const leaked = options.filter((item) => forbidden.test(item.value));
    assert.equal(leaked.length, 0, `${scene} leaked: ${leaked.map((item) => item.value).join(', ')}`);
  }
});


test('clothingForScene returns the full 267-item catalog for office and bedroom scenes', () => {
  const all = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  for (const scene of ['office_selfie', 'bedroom_selfie']) {
    const options = clothingForScene(scene, CLOTHING_CATALOG);
    assert.equal(options.length, all.length);
    assert.equal(new Set(options.map((item) => item.value)).size, all.length);
  }
});

test('clothingForScene does not duplicate HOME_CLOTHING when base options already include it', () => {
  const all = [...CLOTHING_CATALOG, ...HOME_CLOTHING];
  const options = clothingForScene('front_selfie', all);
  assert.equal(options.length, 267);
  assert.equal(new Set(options.map((item) => item.value)).size, 267);
});

test('clothingSceneCoherence warns about bedroom clothing in office scene', () => {
  const warn = clothingSceneCoherence('tee-white', 'office_selfie');
  assert.ok(warn);
  assert.match(warn.warning, /غرفة نوم/i);
});

test('clothingSceneCoherence warns about thobe in bedroom scene', () => {
  const warn = clothingSceneCoherence('white_thobe', 'bedroom_selfie');
  assert.ok(warn);
  assert.match(warn.warning, /غرفة النوم/i);
});

test('clothingSceneCoherence returns null for compatible and automatic choices', () => {
  assert.equal(clothingSceneCoherence('white_thobe', 'front_selfie'), null);
  assert.equal(clothingSceneCoherence('', 'bedroom_selfie'), null);
});

test('clothing coherence warning is context-only and never a validation error', () => {
  const result = generateImagePrompt({ sceneType:'office_selfie', clothing:'tee-white' });
  assert.ok(result.config.context_warnings.some((warning) => /غرفة نوم/i.test(warning)));
  assert.equal(result.validation.errors.some((error) => /غرفة نوم|ملابس/i.test(error)), false);
  assert.equal(result.validation.warnings.some((warning) => /غرفة نوم|ملابس/i.test(warning)), false);
});

test('23 sections are preserved with persistent clothing warnings', () => {
  const result = generateImagePrompt({ sceneType:'bedroom_selfie', clothing:'white_thobe' });
  assert.equal(result.sections.length, 23);
  assert.equal(result.config.clothing, 'white_thobe');
  assert.ok(result.config.context_warnings.some((warning) => /غرفة النوم/i.test(warning)));
});
