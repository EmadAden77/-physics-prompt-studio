const GENERAL_LIGHTING = [
  'day_direct_sun','day_open_shade','day_overcast','day_window','golden_hour','blue_sky_noon',
  'night_led_street','night_parking_led','night_storefront','night_gas_station','night_corniche','night_desert_vehicle',
  'night_majlis_warm','night_cafe_mixed','night_office_led','night_home_warm','night_phone_screen'
];
const OUTDOOR_LIGHTING = [
  'day_direct_sun','day_open_shade','day_overcast','golden_hour','blue_sky_noon',
  'night_led_street','night_parking_led','night_storefront','night_gas_station','night_corniche','night_desert_vehicle'
];
const INDOOR_GENERAL_LIGHTING = ['day_window','night_majlis_warm','night_cafe_mixed','night_office_led','night_home_warm','night_phone_screen'];
const CAR_LIGHTING = ['car_daylight','night_car_practicals','night_car_screen_only','night_led_street','night_parking_led','night_gas_station'];
const FRONT_CAMERAS = ['xiaomi15_front','iphone15pm_front','generic_front'];
const SELFIE_FRAMING = ['close','chest_up','waist_up','three_quarter'];
const BASIC_SELFIE_ANGLES = [
  'eye_centered','eye_three_quarter_left','eye_three_quarter_right','slightly_high_center','slightly_high_three_quarter',
  'slightly_low_center','low_offcenter','high_offcenter','close_face','chest_up','waist_up'
];

const MAJLIS_LOCATIONS = ['modern_saudi_majlis','traditional_majlis','villa_living_room'];
const CAFE_LOCATIONS = ['saudi_cafe','specialty_coffee','casual_restaurant','hotel_lobby','mall_atrium'];
const OFFICE_LOCATIONS = ['saudi_office','real_estate_office'];
const CAR_LOCATIONS = [
  'villa_driveway','villa_garage','riyadh_residential','riyadh_business','jeddah_residential','jeddah_corniche','khobar_corniche',
  'dammam_street','taif_hills','abha_mountain_city','tabuk_outskirts','ordinary_saudi_street','night_parking','day_parking',
  'gas_station','storefront_street','desert_roadside','mountain_viewpoint'
];
const OUTDOOR_LOCATIONS = [
  'villa_driveway','rooftop_terrace','riyadh_residential','riyadh_business','jeddah_residential','jeddah_corniche','khobar_corniche',
  'dammam_street','makkah_residential','madinah_residential','taif_hills','abha_mountain_city','tabuk_outskirts','ordinary_saudi_street',
  'night_parking','day_parking','gas_station','storefront_street','boulevard_walkway','desert_roadside','desert_dunes','rocky_desert',
  'alula_valley','palm_farm','mountain_viewpoint','wadi','red_sea_beach','gulf_beach','public_park'
];
const WALKING_LOCATIONS = [
  'riyadh_residential','riyadh_business','jeddah_residential','jeddah_corniche','khobar_corniche','dammam_street','makkah_residential',
  'madinah_residential','taif_hills','abha_mountain_city','tabuk_outskirts','mall_atrium','airport_terminal','ordinary_saudi_street',
  'storefront_street','boulevard_walkway','desert_roadside','desert_dunes','rocky_desert','alula_valley','palm_farm','mountain_viewpoint',
  'wadi','red_sea_beach','gulf_beach','public_park','rooftop_terrace'
];
const SEATED_LOCATIONS = [
  'modern_saudi_majlis','traditional_majlis','villa_living_room','rooftop_terrace','saudi_cafe','specialty_coffee','casual_restaurant',
  'saudi_office','real_estate_office','hotel_lobby','mall_atrium','airport_terminal','public_park'
];
const MIRROR_LOCATIONS = ['villa_living_room','saudi_office','real_estate_office','hotel_lobby','mall_atrium','barbershop','gym'];

export const MIRROR_POSES = [
  { value:'mirror_standing_relaxed', label:'مرآة — واقف باسترخاء', prompt:'standing naturally for a mirror selfie with the phone-bearing arm positioned consistently with the reflected device and relaxed weight distribution' },
  { value:'mirror_one_hand_pocket', label:'مرآة — يد في الجيب', prompt:'standing for a mirror selfie with the free hand casually in a pocket, realistic cloth deformation, and coherent reflected hand placement' },
  { value:'mirror_adjust_clothing', label:'مرآة — تعديل الملابس', prompt:'gently adjusting clothing with the free hand during the mirror selfie, creating realistic contact folds while the phone remains visibly supported by the other hand' },
  { value:'mirror_seated', label:'مرآة — جالس', prompt:'seated naturally in front of a mirror with real seat support, coherent reflected body geometry, and the phone visibly held in the reflection' },
  { value:'mirror_full_length', label:'مرآة — جسم كامل', prompt:'standing at a physically plausible distance for a full-length mirror selfie with visible ground contact, phone reflection, and correct perspective convergence' }
];
export const MIRROR_ANGLES = [
  { value:'mirror_eye_level', label:'مرآة — مستوى العين', prompt:'mirror viewpoint composed around eye level with the reflected phone near face height and geometrically consistent reflection lines' },
  { value:'mirror_three_quarter', label:'مرآة — ثلاثة أرباع', prompt:'mild three-quarter body orientation toward the mirror while keeping the reflected phone, face, shoulders, and mirror plane geometrically coherent' },
  { value:'mirror_slight_high', label:'مرآة — أعلى قليلًا', prompt:'phone held slightly above eye level in the mirror with gentle downward pitch and physically consistent reflection geometry' },
  { value:'mirror_waist_up', label:'مرآة — حتى الخصر', prompt:'waist-up mirror composition with believable phone-to-mirror distance, natural body scale, and no duplicate viewpoints' },
  { value:'mirror_full_length', label:'مرآة — جسم كامل', prompt:'full-length mirror composition showing head-to-foot body scale, ground contact, phone reflection, and consistent mirror perspective' }
];
export const THIRD_PERSON_POSES = [
  { value:'third_standing_relaxed', label:'شخص ثالث — واقف طبيعي', prompt:'standing naturally for a third-person smartphone photograph with relaxed weight distribution, mild shoulder asymmetry, and hands resting naturally' },
  { value:'third_seated_relaxed', label:'شخص ثالث — جالس طبيعي', prompt:'seated naturally with correct support, pelvis and back contact, believable foot placement, and relaxed posture while another person takes the photograph' },
  { value:'third_walking_candid', label:'شخص ثالث — يمشي بعفوية', prompt:'walking naturally while photographed by another person, with coherent gait phase, body balance, and mild candid motion cues' },
  { value:'third_lean_wall', label:'شخص ثالث — ميل خفيف على جدار', prompt:'leaning lightly against a wall with visible contact physics, realistic weight transfer, and no staged fashion-pose exaggeration' },
  { value:'third_one_hand_pocket', label:'شخص ثالث — يد في الجيب', prompt:'standing naturally with one hand casually in a pocket, realistic cloth tension, and relaxed non-selfie body language' },
  { value:'third_interaction', label:'شخص ثالث — تفاعل طبيعي', prompt:'naturally interacting with a nearby context-appropriate object or surface while photographed by another person, preserving realistic hand contact and attention' }
];
export const THIRD_PERSON_ANGLES = [
  { value:'third_eye_level', label:'شخص ثالث — مستوى العين', prompt:'third-person smartphone camera at natural eye level with believable photographer distance and ordinary handheld composition' },
  { value:'third_three_quarter_left', label:'شخص ثالث — ثلاثة أرباع يسار', prompt:'third-person smartphone viewpoint from a mild left three-quarter angle with realistic perspective and human scale' },
  { value:'third_three_quarter_right', label:'شخص ثالث — ثلاثة أرباع يمين', prompt:'third-person smartphone viewpoint from a mild right three-quarter angle with realistic perspective and human scale' },
  { value:'third_slight_high', label:'شخص ثالث — أعلى قليلًا', prompt:'third-person smartphone camera slightly above eye level with gentle downward pitch and no artificial overhead look' },
  { value:'third_slight_low', label:'شخص ثالث — منخفض قليلًا', prompt:'third-person smartphone camera slightly below eye level with restrained upward pitch and no heroic cinematic distortion' },
  { value:'third_full_body_eye', label:'شخص ثالث — جسم كامل طبيعي', prompt:'third-person full-body smartphone framing from a natural standing photographer height with visible ground contact and correct body scale' },
  { value:'third_candid_side', label:'شخص ثالث — جانبي عفوي', prompt:'candid third-person side or oblique smartphone viewpoint with natural attention away from camera and believable environmental context' }
];

const PROFILES = {
  front_selfie: { pose:['standing_relaxed','standing_one_hand','walking_slow','seated_sofa','seated_chair','lean_wall','lean_counter','coffee_hand','adjust_clothing','hand_on_head','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES, lighting:GENERAL_LIGHTING, camera:FRONT_CAMERAS, framing:SELFIE_FRAMING },
  standing_selfie: { pose:['standing_relaxed','standing_one_hand','lean_wall','lean_counter','coffee_hand','adjust_clothing','hand_on_head','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES, lighting:GENERAL_LIGHTING, camera:FRONT_CAMERAS, framing:['chest_up','waist_up','three_quarter'] },
  seated_selfie: { location:SEATED_LOCATIONS, pose:['seated_sofa','seated_chair','coffee_hand','adjust_clothing','hand_on_head','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES.concat('seated_high_three_quarter'), lighting:INDOOR_GENERAL_LIGHTING.concat('day_open_shade'), camera:FRONT_CAMERAS, framing:['close','chest_up','waist_up','three_quarter'] },
  walking_selfie: { location:WALKING_LOCATIONS, pose:['walking_slow'], angle:['eye_centered','eye_three_quarter_left','eye_three_quarter_right','slightly_high_center','slightly_low_center','low_offcenter','high_offcenter','chest_up'], lighting:OUTDOOR_LIGHTING, camera:FRONT_CAMERAS, framing:['chest_up','waist_up'] },
  inside_car_selfie: { location:CAR_LOCATIONS, pose:['driver_seat','passenger_seat'], angle:['driver_eye_level','driver_slight_high','driver_low'], lighting:CAR_LIGHTING, camera:FRONT_CAMERAS, framing:['close','chest_up','waist_up'] },
  majlis_selfie: { location:MAJLIS_LOCATIONS, pose:['seated_sofa','seated_chair','standing_relaxed','standing_one_hand','coffee_hand','adjust_clothing','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES.concat('seated_high_three_quarter'), lighting:['day_window','night_majlis_warm','night_home_warm','night_phone_screen'], camera:FRONT_CAMERAS, framing:['chest_up','waist_up','three_quarter'] },
  cafe_selfie: { location:CAFE_LOCATIONS, pose:['seated_chair','standing_relaxed','standing_one_hand','lean_counter','coffee_hand','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES.concat('seated_high_three_quarter'), lighting:['day_window','night_cafe_mixed','night_phone_screen'], camera:FRONT_CAMERAS, framing:['close','chest_up','waist_up','three_quarter'] },
  office_selfie: { location:OFFICE_LOCATIONS, pose:['seated_chair','standing_relaxed','standing_one_hand','lean_counter','adjust_clothing','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES.concat('seated_high_three_quarter'), lighting:['day_window','night_office_led','night_phone_screen'], camera:FRONT_CAMERAS, framing:['close','chest_up','waist_up','three_quarter'] },
  outdoor_selfie: { location:OUTDOOR_LOCATIONS, pose:['standing_relaxed','standing_one_hand','walking_slow','lean_wall','door_open_car','coffee_hand','adjust_clothing','hand_on_head','one_hand_pocket','close_relaxed'], angle:BASIC_SELFIE_ANGLES.concat('doorway_three_quarter'), lighting:OUTDOOR_LIGHTING, camera:FRONT_CAMERAS, framing:['chest_up','waist_up','three_quarter'] },
  mirror_selfie: { location:MIRROR_LOCATIONS, poseCatalog:MIRROR_POSES, angleCatalog:MIRROR_ANGLES, lighting:['day_window','night_home_warm','night_cafe_mixed','night_office_led','night_phone_screen'], camera:['xiaomi15_front','iphone15pm_front','generic_front','smartphone_rear'], framing:['chest_up','waist_up','three_quarter','full_body'] },
  third_person_portrait: { poseCatalog:THIRD_PERSON_POSES, angleCatalog:THIRD_PERSON_ANGLES, lighting:GENERAL_LIGHTING, camera:['smartphone_rear'], framing:['close','chest_up','waist_up','three_quarter'] },
  full_body_third_person: { poseCatalog:THIRD_PERSON_POSES.filter((item)=>item.value!=='third_seated_relaxed'), angleCatalog:THIRD_PERSON_ANGLES.filter((item)=>['third_eye_level','third_three_quarter_left','third_three_quarter_right','third_slight_low','third_full_body_eye','third_candid_side'].includes(item.value)), lighting:GENERAL_LIGHTING, camera:['smartphone_rear'], framing:['full_body'] },
  candid_third_person: { poseCatalog:THIRD_PERSON_POSES, angleCatalog:THIRD_PERSON_ANGLES, lighting:GENERAL_LIGHTING, camera:['smartphone_rear'], framing:['chest_up','waist_up','three_quarter','full_body'] }
};

function filterValues(options, allowed) {
  if (!allowed) return [...options];
  const set = new Set(allowed);
  return options.filter((item)=>set.has(item.value));
}

export function compatibleOptions(sceneType, kind, baseOptions = []) {
  const profile = PROFILES[sceneType] || PROFILES.front_selfie;
  if (kind === 'pose' && profile.poseCatalog) return [...profile.poseCatalog];
  if (kind === 'angle' && profile.angleCatalog) return [...profile.angleCatalog];
  return filterValues(baseOptions, profile[kind]);
}

export function compatibilitySnapshot(sceneType, catalogs = {}) {
  return {
    location: compatibleOptions(sceneType, 'location', catalogs.location || []),
    clothing: compatibleOptions(sceneType, 'clothing', catalogs.clothing || []),
    pose: compatibleOptions(sceneType, 'pose', catalogs.pose || []),
    angle: compatibleOptions(sceneType, 'angle', catalogs.angle || []),
    lighting: compatibleOptions(sceneType, 'lighting', catalogs.lighting || []),
    camera: compatibleOptions(sceneType, 'camera', catalogs.camera || []),
    framing: compatibleOptions(sceneType, 'framing', catalogs.framing || [])
  };
}

export function recommendedDefaults(sceneType) {
  if (['third_person_portrait','full_body_third_person','candid_third_person'].includes(sceneType)) return { camera:'smartphone_rear', framing: sceneType === 'full_body_third_person' ? 'full_body' : 'chest_up' };
  if (sceneType === 'mirror_selfie') return { camera:'smartphone_rear', framing:'waist_up' };
  return { camera:'xiaomi15_front', framing:'chest_up' };
}

export function validateCompatibilityCatalogs(catalogs = {}) {
  const errors = [];
  const unused = {};
  const kinds = ['location','clothing','pose','angle','lighting','camera','framing'];
  const specialValues = {
    pose: new Set([...MIRROR_POSES, ...THIRD_PERSON_POSES].map((item) => item.value)),
    angle: new Set([...MIRROR_ANGLES, ...THIRD_PERSON_ANGLES].map((item) => item.value))
  };

  for (const [sceneType, profile] of Object.entries(PROFILES)) {
    for (const kind of kinds) {
      const explicit = profile[kind];
      if (!Array.isArray(explicit)) continue;
      const available = new Set((catalogs[kind] || []).map((item) => item.value));
      for (const value of specialValues[kind] || []) available.add(value);
      for (const value of explicit) if (!available.has(value)) errors.push(`${sceneType}.${kind} references missing value: ${value}`);
    }
  }

  for (const kind of kinds) {
    const items = catalogs[kind] || [];
    const used = new Set();
    const unrestricted = Object.values(PROFILES).some((profile) => !profile[kind] && !(kind === 'pose' && profile.poseCatalog) && !(kind === 'angle' && profile.angleCatalog));
    if (unrestricted) items.forEach((item) => used.add(item.value));
    for (const profile of Object.values(PROFILES)) {
      for (const value of profile[kind] || []) used.add(value);
      if (kind === 'pose') for (const item of profile.poseCatalog || []) used.add(item.value);
      if (kind === 'angle') for (const item of profile.angleCatalog || []) used.add(item.value);
    }
    unused[kind] = items.map((item) => item.value).filter((value) => !used.has(value));
  }

  return { valid: errors.length === 0, errors, unused };
}
