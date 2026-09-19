import { HOME_SCENE_TYPES, sceneMeta } from './scene-type-expansion.js';
import { enrichClothingPrompt } from './expanded-catalogs.js';

export const SAUDI_CULTURAL_DRESS_LOCK = 'CULTURAL CONTEXT — SAUDI: All women who appear in the frame must wear a plain black abaya. Adult women should also wear a black niqab covering everything except the eyes. Do not show exposed hair, uncovered female faces, or Western-style female clothing. Men may wear a white Saudi thobe, a bisht, or ordinary business attire (shirt and trousers). This rule applies to every Saudi location, indoor or outdoor, day or night.';
export const SAUDI_SIGNAGE_RULE = 'SIGNAGE REALISM: If any sign or text appears in the frame and is legible, the text must be short, generic Arabic words (such as بقالة، مطعم، مقهى، صيدلية، ماء، خبز) or a real Arabic brand name. English may appear only as a smaller secondary line. When text is not legible due to distance, angle, motion, or focus, the sign must genuinely be unreadable — not pseudo-Arabic, not gibberish Latin characters, and not a fictional script.';

const grouped = (rows) => rows.map(([group, value, label, prompt]) => ({ group, value, label, prompt }));
const simple = (rows) => rows.map(([value, label, prompt]) => ({ value, label, prompt }));

const formalLookGroup = (value) => {
  const match = /^look-(\d{2,3})$/.exec(value);
  const index = match ? Number(match[1]) : null;
  if (index !== null && index <= 10) return 'أبيض وكحلي';
  if (index !== null && index <= 25) return 'أزرق';
  if (index !== null && index <= 36) return 'كحلي';
  if (index !== null && index <= 49) return 'فحمي';
  if (index !== null && index <= 58) return 'أسود';
  if (index !== null && index <= 79) return 'بيج وكريمي';
  if (index !== null && index <= 89) return 'زيتي';
  if (index !== null && index <= 103) return 'ملون وبياقة';
  if (index !== null && index <= 116) return 'كتان صيفي';
  return 'متعدد';
};

const expandedClothing = (group, value, label, prompt) => ({
  group,
  value,
  label,
  prompt: enrichClothingPrompt(prompt)
});
const LOCATION_REALISM_SUFFIX = ' Keep the place ordinary, non-iconic, and non-identifiable. Preserve realistic scale, circulation space, surface wear, small maintenance imperfections, dust or use marks where plausible, non-uniform object placement, believable background occupancy, material-specific reflections, and no showroom-clean or staged advertising look.';

export const FURNITURE_GEOMETRY_RULES = Object.freeze({
  sofa: 'The sofa maintains a continuous structural frame with a single seat base, unified backrest, and clearly separated armrests on both sides. All legs or base contact the ground with realistic contact shadows. Cushions show weight-driven compression at contact points and gravity-driven fabric folds.',
  armchair: 'The armchair is a single-seat piece with a continuous frame, unified backrest, two armrests, and a seat base. It is not a sofa. All feet contact the ground with realistic shadows. Cushion compresses under body weight.',
  chair: 'The chair has four legs (or a continuous base) in contact with the ground, a seat, and a backrest. It is not part of another piece of furniture. Legs cast realistic contact shadows.',
  table: 'The table has a continuous top supported by legs or a base, all in contact with the ground. The top surface maintains physical continuity with no splitting or floating elements. Objects on the table rest with correct support and contact shadows.',
  desk: 'The desk has a flat working surface supported by legs or a base, with realistic desk-to-chair clearance and human scale. All supports contact the ground with coherent shadows.',
  bed: 'The bed has a continuous frame, a mattress with realistic compression under weight, a headboard connected to the frame, and legs or base in ground contact. Bedding shows gravity-driven wrinkles.',
  counter: 'The counter is a continuous solid structure with a top, front panel, and base in ground contact. No floating sections. Objects on the counter have correct support and shadows.',
  generic: 'All furniture maintains a coherent 3D structure: no morphing, no merging, no splitting, no floating pieces. All supports, legs, and bases contact the ground. Contact shadows are consistent with the light source direction. Surfaces show weight-driven compression at contact points.'
});

// FURNITURE_GEOMETRY_RULES describe furniture physics,
// not subject-support. They are applied when the furniture
// type is in scene regardless of subject pose.
// Explicit pose semantics also protect API callers whose scene context does not name the furniture type (for example bedroom-mirror-seated -> bed).
const POSE_FURNITURE_SEMANTICS = Object.freeze({
  bed:new Set(['bed-lying-back','bed-lying-side','bed-lying-stomach','bed-reclining-headboard','bed-propped-pillows','bed-lying-partial','bed-lying-diagonal','bed-lying-reading','bed-lying-back-knees-bent','bed-sitting-cross','bed-sitting-edge','bed-sitting-back-wall','bed-sitting-legs-extended','bed-sitting-hugging-pillow','bed-sitting-sideways','bedroom-laptop-bed','bedroom-cup-bed','bedroom-book-bed','bedroom-nightstand-reach','bedroom-mirror-seated']),
  armchair:new Set(['armchair-sit-lean-back','armchair-sit-corner','armchair-sit-one-knee','armchair-sit-crossed','armchair-sit-feet-floor','bedroom-laptop-armchair','bedroom-tea-armchair']),
  sofa:new Set(['seated_sofa']), chair:new Set(['seated_chair']), counter:new Set(['lean_counter']),
  none:new Set(['standing_relaxed','standing_one_hand','walking_slow','bedroom-stand-relaxed','bedroom-floor-cross','bedroom-floor-back-wall','bedroom-floor-knee-up'])
});
function furnitureSemanticForPose(poseValue){ return Object.entries(POSE_FURNITURE_SEMANTICS).find(([,poses])=>poses.has(poseValue))?.[0] || ''; }

export function getFurnitureGeometryForScene(sceneType, location = '', poseValue = '') {
  const semantic=furnitureSemanticForPose(poseValue);
  if(semantic==='none') return [FURNITURE_GEOMETRY_RULES.generic];
  // desk_work_selfie explicitly keeps desk geometry because the work surface is part of the subject action, not background furniture.
  if(semantic==='chair' && sceneType==='desk_work_selfie') return [FURNITURE_GEOMETRY_RULES.chair,FURNITURE_GEOMETRY_RULES.desk];
  if(semantic) return [FURNITURE_GEOMETRY_RULES[semantic]];
  // TODO-53-LOCATIONS: canonical locations with multi-match furniture rules remain a separate issue from pose-aware coupling.
  const context = `${sceneType} ${location}`.toLowerCase();
  const rules = [];

  if (/bed|bedroom|lying|reclining|night_bed/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.bed);
  if (/sofa|majlis|living_room|couch/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.sofa);
  if (/armchair/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.armchair);
  if (/chair|seated|barber|clinic|waiting|office/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.chair);
  if (/table|restaurant|dining|desk_work|meeting|cafe|coffee/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.table);
  if (/desk|office|workstation|admin|government/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.desk);
  if (/counter|cafe|coffee|reception|service/.test(context)) rules.push(FURNITURE_GEOMETRY_RULES.counter);

  if (rules.length === 0) rules.push(FURNITURE_GEOMETRY_RULES.generic);

  return rules;
}
const locationCatalog = (rows) => rows.map(([group, value, label, prompt, sceneTypes]) => ({
  group,
  value,
  label,
  prompt: `${prompt}.${LOCATION_REALISM_SUFFIX}`,
  sceneTypes: [...sceneTypes]
}));

export const LOCATION_CATALOG = locationCatalog([
['مجالس ومنازل','modern_saudi_majlis','مجلس سعودي حديث وأنيق','inside a modern, lived-in Saudi Arabian majlis with realistic seating, circulation space, hospitality details, and no palace-like exaggeration',['majlis_selfie','seated_selfie','front_selfie','third_person_portrait','full_body_third_person','candid_third_person','family_group_selfie']],
['مجالس ومنازل','traditional_majlis','مجلس سعودي تقليدي واقعي','inside a realistic traditional Saudi majlis with restrained heritage details, practical seating, and authentic lived-in proportions',['majlis_selfie','seated_selfie','front_selfie','third_person_portrait','full_body_third_person','candid_third_person','family_group_selfie']],
['مجالس ومنازل','villa_living_room','صالة فيلا سعودية حديثة','inside a contemporary Saudi residential villa living room with believable furniture scale, warm neutral materials, and ordinary domestic details',['front_selfie','seated_selfie','mirror_selfie','third_person_portrait','full_body_third_person','candid_third_person','family_group_selfie']],
['مجالس ومنازل','villa_driveway','مدخل فيلا سكنية','on the private driveway of a Saudi residential villa with realistic gate, boundary wall, paving, vehicle clearance, and ordinary neighborhood context',['standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','door_open_car_selfie','third_person_car_adjacent','car_group_selfie']],
['مجالس ومنازل','villa_garage','كراج خاص لفيلا','inside a private residential villa garage in Saudi Arabia, not a commercial parking garage, with practical lighting and believable household storage',['standing_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','door_open_car_selfie','third_person_car_adjacent','car_group_selfie']],
['مجالس ومنازل','rooftop_terrace','سطح / تراس منزل','on a residential rooftop terrace in Saudi Arabia with realistic parapets, utility elements, nearby roofs, and atmospheric depth',['standing_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','rooftop_terrace_selfie','outdoor_leaning_selfie','sparse_isolated_scene']],
['مدن وأحياء','riyadh_residential','حي سكني في الرياض','on an ordinary residential street in Riyadh with contemporary villas, boundary walls, parked cars, sidewalks, asphalt, and no iconic landmark',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','riyadh_business','منطقة أعمال حديثة في الرياض','in a modern Riyadh business district with plausible office buildings, street furniture, traffic spacing, and non-iconic urban background',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','jeddah_residential','حي سكني في جدة','on a believable residential street in Jeddah with local apartment and villa architecture, parked vehicles, warm coastal atmosphere, and no landmark',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','jeddah_corniche','كورنيش جدة','along a believable Jeddah corniche setting with waterfront promenade, practical lighting, paving, railings, distant city lights, and realistic sea atmosphere',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','beach_corniche_selfie','wind_interactive_outdoor_scene','rain_wet_surface_scene']],
['مدن وأحياء','khobar_corniche','كورنيش الخبر','along Al Khobar waterfront with a realistic corniche promenade, palm landscaping, railings, parking, and physically plausible Gulf humidity',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','beach_corniche_selfie','wind_interactive_outdoor_scene','rain_wet_surface_scene']],
['مدن وأحياء','dammam_street','شارع حضري في الدمام','on an ordinary urban street in Dammam with practical storefronts, asphalt, curb geometry, parked cars, and believable Gulf-region atmosphere',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','makkah_residential','حي سكني في مكة','in a non-iconic residential district in Makkah with ordinary local buildings, roads, parked vehicles, and no holy-site depiction',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','madinah_residential','حي سكني في المدينة','in a non-iconic residential district in Madinah with ordinary local architecture, roads, sidewalks, and no holy-site depiction',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','taif_hills','منطقة مرتفعة في الطائف','in a Taif hillside urban area with realistic elevation changes, retaining walls, local roads, cooler mountain atmosphere, and ordinary buildings',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','mountain_view_selfie','wind_interactive_outdoor_scene']],
['مدن وأحياء','abha_mountain_city','أبها الجبلية','in an Abha mountain-city setting with realistic slopes, regional vegetation, layered atmospheric depth, and ordinary urban architecture',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','mountain_view_selfie','wind_interactive_outdoor_scene']],
['مدن وأحياء','tabuk_outskirts','أطراف تبوك','on the outskirts of Tabuk with low-rise development, broad roads, dry terrain, and realistic northern Saudi atmosphere',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie']],
['ضيافة وأعمال','saudi_cafe','مقهى سعودي عادي','inside an ordinary contemporary Saudi cafe with practical ceiling lights, mixed seating, believable service details, and non-commercial candid atmosphere',['front_selfie','seated_selfie','cafe_selfie','third_person_portrait','full_body_third_person','candid_third_person','restaurant_table_selfie','restaurant_waiting_selfie','window_light_indoor_selfie']],
['ضيافة وأعمال','specialty_coffee','مقهى قهوة مختصة','inside a contemporary Saudi specialty coffee shop with realistic counter layout, tables, ceiling fixtures, patrons, and practical material reflections',['front_selfie','seated_selfie','cafe_selfie','third_person_portrait','full_body_third_person','candid_third_person','restaurant_table_selfie','restaurant_waiting_selfie','window_light_indoor_selfie']],
['ضيافة وأعمال','casual_restaurant','مطعم عائلي / كاجوال','inside a casual Saudi restaurant with believable table spacing, practical lights, restrained decor, and ordinary dinner occupancy',['front_selfie','seated_selfie','cafe_selfie','third_person_portrait','full_body_third_person','candid_third_person','restaurant_table_selfie','restaurant_waiting_selfie','third_person_dining_candid','family_group_selfie']],
['ضيافة وأعمال','saudi_office','مكتب سعودي حديث','inside an ordinary modern Saudi office with practical workstations, neutral finishes, realistic ceiling lighting, and lived-in work details',['front_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie','desk_work_selfie','window_light_indoor_selfie','mixed_practical_light_selfie']],
['ضيافة وأعمال','real_estate_office','مكتب عقاري','inside a realistic Saudi real-estate office with desks, chairs, files, screens, practical lighting, and no showroom-like staging',['front_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','window_light_indoor_selfie']],
['ضيافة وأعمال','hotel_lobby','لوبي فندق حديث','inside a contemporary Saudi hotel lobby with believable scale, guest circulation, practical fixtures, and restrained premium materials',['front_selfie','seated_selfie','walking_selfie','third_person_portrait','full_body_third_person','hotel_lobby_selfie']],
['ضيافة وأعمال','mall_atrium','مول تجاري','inside a Saudi shopping mall atrium with realistic storefront spacing, escalators or walkways, mixed practical lighting, and naturally distributed visitors',['front_selfie','walking_selfie','third_person_portrait','full_body_third_person','mall_selfie','mall_shopping_selfie','crowd_light_background_scene']],
['ضيافة وأعمال','barbershop','صالون حلاقة رجالي','inside an ordinary Saudi men’s barbershop with mirrors, chairs, counters, realistic ceiling lights, and naturally used work surfaces',['front_selfie','seated_selfie','mirror_selfie','third_person_portrait','full_body_third_person','barbershop_selfie']],
['ضيافة وأعمال','gym','نادي رياضي','inside a modern Saudi gym with correctly scaled exercise equipment, practical overhead lighting, rubber flooring, and believable occupancy',['front_selfie','standing_selfie','mirror_selfie','third_person_portrait','full_body_third_person','gym_workout_selfie','post_workout_selfie','product_integration_scene']],
['ضيافة وأعمال','airport_terminal','صالة مطار','inside a modern Saudi airport terminal with realistic wayfinding, seating, glazing, luggage behavior, and broad practical lighting',['front_selfie','seated_selfie','walking_selfie','third_person_portrait','full_body_third_person','airport_waiting_selfie','airport_walkway_selfie','crowd_light_background_scene']],
['تسوق','supermarket_aisle','ممر سوبرماركت','inside an ordinary Saudi supermarket aisle with correctly scaled shelving, mixed packaged goods, carts, floor reflections, imperfect product alignment, and broad practical ceiling lighting',['front_selfie','standing_selfie','walking_selfie','third_person_portrait','full_body_third_person','candid_third_person','supermarket_selfie']],
['تسوق','convenience_store','بقالة / متجر صغير','inside a neighborhood convenience store in Saudi Arabia with narrow aisles, refrigerated cases, counter clutter, stacked everyday goods, practical fluorescent light, and normal wear',['front_selfie','standing_selfie','third_person_portrait','full_body_third_person','supermarket_selfie']],
['تسوق','grocery_store','متجر بقالة','inside an ordinary Saudi grocery store with shelves, produce bins, price tags, and practical ceiling lighting',['front_selfie','standing_selfie','walking_selfie','third_person_portrait','full_body_third_person','supermarket_selfie']],
['شوارع ومواقف','ordinary_saudi_street','شارع سعودي عادي','on an ordinary Saudi street with correct asphalt, curbs, sidewalks, utility elements, parked vehicles, and non-iconic buildings',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','street_night_selfie','harsh_noon_outdoor_selfie','rain_wet_surface_scene']],
['شوارع ومواقف','night_parking','موقف سيارات ليلي','in an ordinary Saudi outdoor parking area at night with marked bays, asphalt texture, wheel stops where appropriate, and localized LED pools of light',['standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','parking_lot_night_selfie','third_person_car_adjacent','car_group_selfie']],
['شوارع ومواقف','day_parking','موقف سيارات نهاري','in an ordinary Saudi outdoor parking area in daylight with realistic painted markings, sun shadows, parked vehicles, and heat-haze where appropriate',['standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','door_open_car_selfie','third_person_car_adjacent','car_group_selfie','harsh_noon_outdoor_selfie']],
['شوارع ومواقف','gas_station','محطة وقود','at a modern Saudi fuel station with canopy lighting, pumps, lane markings, convenience-store context, and correct safety clearances',['standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','gas_station_selfie','door_open_car_selfie','third_person_car_adjacent','rain_wet_surface_scene']],
['شوارع ومواقف','storefront_street','شارع محلات','on a Saudi commercial street with ordinary storefronts, signage kept secondary, curb parking, pedestrians, and practical shop lighting',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie','mixed_practical_light_selfie','crowd_light_background_scene']],
['شوارع ومواقف','boulevard_walkway','ممشى حضري حديث','on a contemporary Saudi urban pedestrian boulevard with practical landscaping, paving, benches, storefront spill, and realistic crowd spacing',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','candid_third_person','outdoor_leaning_selfie','crowd_light_background_scene']],
['طبيعة ورحلات','desert_roadside','طريق صحراوي','at a safe stopping area beside a Saudi desert road with correct road shoulder geometry, dry terrain, atmospheric depth, and sparse practical infrastructure',['standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie','sparse_isolated_scene','harsh_noon_outdoor_selfie','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','desert_dunes','كثبان رملية','in Saudi sand dunes with physically consistent wind-shaped ripples, realistic footprints or tire traces if present, and atmospheric depth',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie','sparse_isolated_scene','harsh_noon_outdoor_selfie','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','rocky_desert','صحراء صخرية','in a rocky Saudi desert landscape with natural stone variation, dry ground, realistic horizon haze, and no fantasy formations',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie','sparse_isolated_scene','harsh_noon_outdoor_selfie','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','alula_valley','وادي صحراوي بطابع العلا','in an AlUla-region desert valley with sandstone formations, dry ground, realistic scale, atmospheric depth, and no invented monumental structures',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie','mountain_view_selfie','sparse_isolated_scene']],
['طبيعة ورحلات','palm_farm','مزرعة نخيل','inside a Saudi palm farm with realistic rows, irrigation traces, soil, natural shade breakup, and ordinary agricultural details',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','farm_palm_selfie','harsh_noon_outdoor_selfie','open_shade_outdoor_selfie']],
['طبيعة ورحلات','mountain_viewpoint','إطلالة جبلية','at a Saudi mountain viewpoint with safe barriers or natural stopping area, layered terrain, realistic haze, and wind interaction',['standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','mountain_view_selfie','wind_interactive_outdoor_scene','sparse_isolated_scene']],
['طبيعة ورحلات','wadi','وادي طبيعي','in a natural Saudi wadi with dry or seasonally textured ground, rock layers, sparse vegetation, and realistic topography',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie','sparse_isolated_scene','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','red_sea_beach','شاطئ البحر الأحمر','on a Saudi Red Sea beach with physically plausible shoreline, wet-sand reflectance, sea haze, wind, and ordinary recreational context',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','beach_corniche_selfie','wind_interactive_outdoor_scene','harsh_noon_outdoor_selfie','open_shade_outdoor_selfie']],
['طبيعة ورحلات','gulf_beach','شاطئ الخليج','on a Saudi Arabian Gulf beach with calm coastal water, humidity haze, realistic sand, shoreline reflections, and ordinary waterfront context',['standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','beach_corniche_selfie','wind_interactive_outdoor_scene','harsh_noon_outdoor_selfie','open_shade_outdoor_selfie']],
['طبيعة ورحلات','public_park','حديقة عامة','inside a Saudi public park with practical paths, benches, irrigation-aware landscaping, family-use context, and realistic lighting',['front_selfie','standing_selfie','seated_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','candid_third_person','family_group_selfie','crowd_light_background_scene']],
['مجالس ومنازل','saudi_bedroom_livedin','غرفة نوم سعودية واقعية','inside a lived-in Saudi bedroom with a normal bed, slightly imperfect bedding, two bedside tables (one on each side of the bed), chargers, curtains, wardrobe surfaces, a few personal items, and ordinary residential proportions',['front_selfie','standing_selfie','seated_selfie','mirror_selfie','third_person_portrait','full_body_third_person','candid_third_person','home_interior_casual_selfie','mirror_bedroom_selfie','reclining_bed_selfie','lying_bed_selfie','phone_screen_only_selfie']],
['مجالس ومنازل','apartment_living_room','صالة شقة سكنية','inside an ordinary Saudi apartment living room with realistically sized sofa seating, side tables, television wall, mixed household objects, slight furniture wear, and plausible circulation space',['front_selfie','standing_selfie','seated_selfie','mirror_selfie','third_person_portrait','full_body_third_person','candid_third_person','home_interior_casual_selfie','family_group_selfie']],
['مجالس ومنازل','family_dining_room','غرفة طعام منزلية','inside a Saudi family dining area with a practical dining table, mismatched small everyday items, chair spacing that allows movement, used table surfaces, and non-staged domestic context',['front_selfie','standing_selfie','seated_selfie','third_person_portrait','full_body_third_person','candid_third_person','family_group_selfie','third_person_dining_candid']],
['مجالس ومنازل','home_kitchen_breakfast','مطبخ منزلي وقت الفطور','inside a realistic Saudi home kitchen during an ordinary meal period, with countertops, cabinets, a few used cups or containers, practical appliances, subtle clutter, and believable working-space clearances',['front_selfie','standing_selfie','candid_third_person','home_kitchen_selfie','interaction_shot']],
['مجالس ومنازل','home_office_room','غرفة مكتب منزلية','inside a modest Saudi home office with a desk, monitor or laptop, cables, chair, papers, practical task lighting, and small signs of daily use rather than showroom organization',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','window_light_indoor_selfie']],
['مجالس ومنازل','villa_courtyard_night','حوش فيلا ليلي','inside a private Saudi villa courtyard at night with boundary walls, tiled paving, a closed gate, ordinary wall lamps, a few plants, minor dust, and realistic vehicle or walking clearance',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','candid_third_person','villa_courtyard_selfie','door_open_car_selfie','family_group_selfie']],
['مجالس ومنازل','apartment_corridor','ممر عمارة سكنية','inside a normal Saudi apartment-building corridor with painted walls, practical floor tiles, fire-safety details where appropriate, door spacing, ceiling lights, and slight scuffs from daily use',['front_selfie','standing_selfie','walking_selfie','third_person_portrait','full_body_third_person','corridor_hallway_selfie']],
['مجالس ومنازل','residential_elevator','مصعد سكني','inside an ordinary residential elevator in Saudi Arabia with metal or laminate wall panels, overhead practical light, control panel, slightly worn floor edges, and realistic confined-space reflections',['front_selfie','standing_selfie','mirror_selfie','third_person_portrait','full_body_third_person','direct_elevator_selfie','mirror_elevator_selfie']],
['مجالس ومنازل','residential_stairwell','درج عمارة سكنية','inside a practical Saudi residential stairwell with concrete or tiled steps, handrails, landings, utility lighting, wall scuffs, and believable depth between floors',['front_selfie','standing_selfie','walking_selfie','third_person_portrait','full_body_third_person','stairwell_selfie']],
['مجالس ومنازل','apartment_basement_parking','موقف عمارة سكنية','inside a residential apartment parking level in Saudi Arabia with concrete columns, painted bay lines, ceiling pipes or utilities, ordinary parked cars, dust near wall edges, and practical fluorescent or LED fixtures',['front_selfie','standing_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','door_open_car_selfie','third_person_car_adjacent','car_group_selfie']],
['ضيافة وأعمال','small_private_dining_room','غرفة طعام خاصة صغيرة','inside a small private dining room in a Saudi office or hospitality setting with a practical table, simple chairs, used serving items, ordinary ceiling lights, and restrained decor',['front_selfie','seated_selfie','third_person_portrait','full_body_third_person','candid_third_person','third_person_dining_candid']],
['ضيافة وأعمال','bakery_cafe','مخبز ومقهى محلي','inside a local Saudi bakery-cafe with a pastry display, paper cups, tray surfaces, practical counter equipment, mixed seating, crumb-level everyday mess, and ordinary customer flow',['front_selfie','standing_selfie','seated_selfie','cafe_selfie','third_person_portrait','full_body_third_person','restaurant_table_selfie','restaurant_waiting_selfie','crowd_light_background_scene']],
['ضيافة وأعمال','casual_grill_restaurant','مطعم شعبي حديث','inside an ordinary modern Saudi grill restaurant with practical tables, tissue boxes, serving trays, mixed wall finishes, realistic table spacing, and signs of normal service use',['front_selfie','seated_selfie','cafe_selfie','third_person_portrait','full_body_third_person','candid_third_person','restaurant_table_selfie','restaurant_waiting_selfie','third_person_dining_candid']],
['ضيافة وأعمال','food_court','فود كورت عادي','inside a Saudi mall food court with mixed tables and chairs, trays, queue lines, distant storefronts kept non-identifiable, ordinary families or individuals, and broad practical ceiling lighting',['front_selfie','standing_selfie','seated_selfie','walking_selfie','third_person_portrait','full_body_third_person','restaurant_table_selfie','restaurant_waiting_selfie','mall_selfie','mall_shopping_selfie','crowd_light_background_scene']],
['ضيافة وأعمال','coworking_space','مساحة عمل مشتركة','inside a Saudi coworking space with shared tables, laptops, charging cables, acoustic panels, mixed task chairs, practical lighting, and realistic occupancy rather than staged emptiness',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','window_light_indoor_selfie']],
['ضيافة وأعمال','office_break_room','استراحة موظفين','inside a small Saudi office break room with a counter, kettle or coffee machine, cups, refrigerator, simple seating, practical lighting, and everyday signs of use',['front_selfie','standing_selfie','seated_selfie','office_selfie','candid_third_person','mixed_practical_light_selfie','interaction_shot']],
['ضيافة وأعمال','office_corridor','ممر مكاتب','inside an ordinary Saudi office corridor with carpet or tile flooring, neutral partitions, doors, ceiling LEDs, minor wall wear, and realistic perspective depth',['front_selfie','standing_selfie','walking_selfie','office_selfie','third_person_portrait','full_body_third_person','corridor_hallway_selfie']],
['ضيافة وأعمال','meeting_room','غرفة اجتماعات عادية','inside a practical Saudi meeting room with a conference table, mixed chairs, screen, cables, notebooks, water bottles, restrained finishes, and normal workplace disorder',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie']],
['ضيافة وأعمال','clinic_waiting_room','صالة انتظار عيادة','inside an ordinary private clinic waiting area in Saudi Arabia with practical seating rows, reception cues, neutral walls, floor wear, ceiling lights, and sparse non-identifiable visitors',['front_selfie','standing_selfie','seated_selfie','third_person_portrait','full_body_third_person','clinic_waiting_selfie']],
['ضيافة وأعمال','library_reading_area','منطقة قراءة هادئة','inside a modern Saudi reading area with shelves, desks, task chairs, scattered books, charging points, broad practical light, and quiet realistic occupancy',['front_selfie','standing_selfie','seated_selfie','third_person_portrait','full_body_third_person']],
['ضيافة وأعمال','gym_locker_area','منطقة خزائن نادي رياضي','inside a Saudi gym locker area with lockers, benches, gym bags, water bottles, towels, rubber or tile flooring, practical ceiling light, and normal post-workout disorder',['front_selfie','standing_selfie','mirror_selfie','third_person_portrait','full_body_third_person','post_workout_selfie','mirror_gym_locker_selfie']],
['ضيافة وأعمال','gym_sink_mirror_area','مغاسل ومرآة النادي','inside a gym wash-and-mirror area with sinks, mirrors, dispensers, water spots, a few personal items, practical overhead lighting, and believable wet-surface reflections',['front_selfie','standing_selfie','mirror_selfie','gym_wash_area_selfie','mirror_bathroom_selfie','mirror_gym_locker_selfie']],
['ضيافة وأعمال','hotel_corridor','ممر فندق عادي','inside a contemporary Saudi hotel corridor with carpet, room doors, wall sconces or ceiling lights, service marks near skirting, and restrained non-iconic decor',['front_selfie','standing_selfie','walking_selfie','third_person_portrait','full_body_third_person','corridor_hallway_selfie']],
['ضيافة وأعمال','hotel_elevator_lobby','ردهة مصاعد فندق','inside a Saudi hotel elevator lobby with stone or tile flooring, metallic elevator doors, seating or console furniture, practical warm-neutral lighting, and ordinary guest circulation',['front_selfie','standing_selfie','mirror_selfie','third_person_portrait','full_body_third_person']],
['شوارع ومواقف','covered_parking_shade','موقف مظلل خارجي','under a common Saudi outdoor parking shade structure with steel posts, fabric or metal canopy, painted bays, sun-bleached asphalt, parked cars, tire marks, and hard daylight beyond the shade',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','door_open_car_selfie','third_person_car_adjacent','car_group_selfie']],
['شوارع ومواقف','office_basement_parking','موقف مبنى مكاتب','inside an office-building parking level in Saudi Arabia with concrete columns, numbered bays kept non-identifying, ventilation ducts, directional arrows, ordinary parked cars, and practical overhead LEDs',['front_selfie','standing_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','door_open_car_selfie','third_person_car_adjacent','car_group_selfie']],
['شوارع ومواقف','neighborhood_sidewalk','رصيف حي سكني','on an ordinary Saudi residential sidewalk beside boundary walls and villa gates, with curb cuts, utility covers, slightly dusty paving, parked vehicles, and uneven everyday maintenance',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','candid_third_person','street_night_selfie']],
['شوارع ومواقف','service_road','طريق خدمة حضري','beside an ordinary Saudi urban service road with asphalt patching, curbs, utility poles or boxes where plausible, modest traffic, parked cars, and mixed non-iconic low-rise buildings',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['شوارع ومواقف','small_commercial_parking','موقف محلات صغير','in a small neighborhood commercial parking area with faded bay paint, curb stops, mixed sedans and SUVs, storefront spill kept non-identifiable, small litter or dust accumulation, and practical lighting',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','parking_lot_night_selfie','door_open_car_selfie','third_person_car_adjacent']],
['شوارع ومواقف','residential_gate_side','بجانب بوابة منزل','beside a normal Saudi residential gate and boundary wall with realistic metalwork, wall texture, driveway slope, utility details, dust at ground level, and neighboring facades kept generic',['front_selfie','standing_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','outdoor_leaning_selfie']],
['شوارع ومواقف','neighborhood_mosque_parking','موقف مسجد حي غير مميز','in the parking area of a small ordinary neighborhood mosque with no identifiable architecture, simple paving, parked cars, shoe-area or entrance cues kept secondary, and no famous or holy-site depiction',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','mosque_parking_selfie']],
['شوارع ومواقف','roadside_rest_area','استراحة طريق عادية','at a modest Saudi roadside rest area with parking bays, curb edges, simple shelter or seating, vending or service cues, dust, highway-distance context, and no named branding',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','desert_stop_selfie']],
['شوارع ومواقف','carwash_waiting_area','منطقة انتظار مغسلة سيارات','at a normal Saudi car-wash waiting area with wet concrete patches, drainage channels, hoses or equipment in the distance, a few waiting cars, plastic or metal chairs, and practical work lighting',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','interaction_shot','third_person_car_adjacent']],
['شوارع ومواقف','coastal_residential_parking','موقف سكني ساحلي','in an ordinary coastal Saudi residential parking area with humidity haze, lightly dusty vehicles, pale paving or asphalt, simple apartment facades, sparse palms, and no waterfront landmark',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','parking_lot_night_selfie']],
['مدن وأحياء','qassim_residential','حي سكني في القصيم','on an ordinary Qassim residential street with low-rise homes, wide setbacks, boundary walls, dry landscaping, parked family vehicles, sun-faded surfaces, and broad road geometry',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','hail_neighborhood','حي سكني في حائل','on a normal residential street in Hail with low-rise compounds, dry northern atmosphere, practical road widths, dusty curb edges, parked cars, and non-iconic local architecture',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','najran_residential','حي سكني في نجران','on an ordinary Najran residential street with regionally plausible low-rise walls and buildings, dry ground tones, local road geometry, parked vehicles, and no heritage landmark emphasis',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','jazan_humid_street','شارع سكني في جازان','on a normal residential-commercial street in Jazan with humid coastal atmosphere, low-rise buildings, utility details, palms where plausible, parked vehicles, and heat-softened distance contrast',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','alahsa_residential','حي في الأحساء','on an ordinary Al Ahsa residential street with mixed villas and low-rise buildings, palms appearing only as normal landscaping, dusty curb edges, parked cars, and non-iconic local context',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['مدن وأحياء','yanbu_residential_coastal','حي سكني ساحلي في ينبع','on a normal residential street in Yanbu with broad roads, low-rise housing, coastal humidity, sparse planting, parked vehicles, and generic non-identifiable urban background',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','street_night_selfie']],
['طبيعة ورحلات','desert_campsite_simple','مخيم صحراوي بسيط','at a simple Saudi desert campsite with a practical fabric shade or modest tent, folding chairs, a cooler or kettle, tire tracks, disturbed sand, wind-shaped loose material, and no luxury-glamping styling',['front_selfie','standing_selfie','seated_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','candid_third_person','desert_stop_selfie','floor_seated_selfie','sparse_isolated_scene','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','farm_track','طريق مزرعة ترابي','on a narrow Saudi farm track with compacted soil, tire marks, irrigation edges, low vegetation or palms depending on region, utility pipes or fencing, and ordinary agricultural wear',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','farm_palm_selfie','harsh_noon_outdoor_selfie']],
['طبيعة ورحلات','mountain_road_pullout','توقف جانبي بطريق جبلي','at a safe pullout on a Saudi mountain road with guardrail or gravel edge where appropriate, layered slopes, road dust, wind exposure, distant haze, and no famous viewpoint',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','mountain_view_selfie','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','misty_mountain_street','شارع جبلي ضبابي','on an ordinary elevated Saudi mountain-town street in light mist with wet or darkened pavement where plausible, low visibility falloff, simple buildings, parked vehicles, and diffuse sky light',['front_selfie','standing_selfie','walking_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','mountain_view_selfie','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','coastal_beach_parking','موقف قريب من شاطئ عام','in a generic Saudi public-beach parking area with windblown fine sand at curb edges, ordinary parked vehicles, simple lighting or shade structures, sea haze in the distance, and no named waterfront landmark',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','third_person_portrait','full_body_third_person','beach_corniche_selfie','wind_interactive_outdoor_scene']],
['طبيعة ورحلات','wadi_picnic_edge','جلسة بسيطة عند وادٍ','near the edge of a natural Saudi wadi at a safe ordinary picnic spot with folding mats or chairs, layered rock and gravel, sparse vegetation, scattered natural debris, and realistic ground irregularity',['front_selfie','standing_selfie','seated_selfie','outdoor_selfie','third_person_portrait','full_body_third_person','candid_third_person','desert_stop_selfie','floor_seated_selfie','sparse_isolated_scene']],
['حكومي وإداري','government_office_hall','قاعة مكتب حكومي','inside an ordinary Saudi government office hall with practical desks or service zones, neutral finishes, realistic ceiling LEDs, modest public circulation, and no sensitive or identifiable operational details',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie','mixed_practical_light_selfie']],
['حكومي وإداري','administrative_reception','استقبال إداري','inside an ordinary Saudi administrative reception area with a practical reception desk, queue or visitor seating cues, ceiling LEDs, everyday surface wear, and no sensitive documents or identifiable signage',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie','interaction_shot']],
['حكومي وإداري','service_counter_area','منطقة كاونتر خدمات','inside a Saudi public-service counter area with correctly scaled counters, simple queue spacing, waiting chairs, practical ceiling lighting, and non-identifiable administrative context',['front_selfie','standing_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie','interaction_shot']],
['حكومي وإداري','public_waiting_area','صالة انتظار عامة','inside an ordinary Saudi public administrative waiting area with practical seating rows, service-counter cues in the distance, ceiling LEDs, realistic visitor spacing, and no sensitive operations',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie']],
['حكومي وإداري','municipal_office','مكتب بلدي','inside an ordinary Saudi municipal office with practical desks, workstations, visitor chairs, neutral partitions, ceiling LEDs, and no readable sensitive paperwork or restricted operational detail',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie','desk_work_selfie','window_light_indoor_selfie']],
['حكومي وإداري','government_corridor','ممر إداري حكومي','inside an ordinary Saudi government administrative corridor with office doors, neutral walls, practical flooring, ceiling LEDs, mild wear, and realistic perspective depth without restricted-area cues',['front_selfie','standing_selfie','walking_selfie','office_selfie','third_person_portrait','full_body_third_person','public_office_selfie','corridor_hallway_selfie']],
['مكاتب','open_plan_office','مكتب مفتوح','inside an ordinary Saudi open-plan office with shared workstations, monitors, task chairs, cables, neutral partitions, practical ceiling lighting, and believable everyday occupancy',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','window_light_indoor_selfie','mixed_practical_light_selfie']],
['مكاتب','meeting_room_glass','غرفة اجتماعات زجاجية','inside a practical glass-walled Saudi meeting room with a conference table, mixed chairs, screen, notebooks, realistic glazing reflections, ceiling LEDs, and ordinary workplace use',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','mixed_practical_light_selfie']],
['مكاتب','executive_office','مكتب إداري خاص','inside a restrained private Saudi administrative office with a practical desk, visitor chairs, storage, monitor, modest finishes, ordinary work items, and no luxury-showroom styling',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','window_light_indoor_selfie']],
['مكاتب','office_pantry','مطبخ مكتب صغير','inside a small Saudi office pantry with a counter, kettle or coffee machine, cups, compact refrigerator, simple storage, practical ceiling light, and everyday signs of use',['front_selfie','standing_selfie','seated_selfie','office_selfie','candid_third_person','mixed_practical_light_selfie','interaction_shot']],
['مكاتب','coworking_lounge','صالة عمل مشترك','inside a Saudi coworking lounge with shared tables, soft seating, laptops, charging cables, acoustic elements, practical lighting, and naturally distributed users rather than staged emptiness',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','window_light_indoor_selfie']],
['مكاتب','office_parking_outdoor','موقف مكتب خارجي','in an ordinary Saudi outdoor office parking area with marked bays, practical shade structures where plausible, parked employee vehicles, sun-bleached asphalt, curb edges, and generic office-building context',['front_selfie','standing_selfie','outdoor_selfie','inside_car_selfie','office_selfie','third_person_portrait','full_body_third_person','parking_lot_night_selfie','door_open_car_selfie','third_person_car_adjacent']],
['فنادق أعمال','hotel_business_center','مركز أعمال فندقي','inside a restrained Saudi hotel business center with practical desks, task chairs, computers or work surfaces, nearby circulation, neutral lighting, and ordinary guest-use details without luxury exaggeration',['front_selfie','standing_selfie','seated_selfie','office_selfie','third_person_portrait','full_body_third_person','desk_work_selfie','hotel_lobby_selfie','window_light_indoor_selfie']],
['عسكري — إعاشة','military_office_desk_meal','الأكل في مكتب عمل عسكري','inside a plain Saudi military administrative office during a meal break, with an ordinary work desk, food containers, a cup, a desktop computer showing only generic non-readable content, practical ceiling panel lighting, no sensitive documents or operational displays, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_command_desk_meal','الأكل على مكتب القيادة','inside a plain Saudi military command-office during a meal break, with a generic administrative desk, simple chairs, food containers, cups, blank or non-readable screens, practical ceiling lighting, no maps or operational material, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_operations_room_meal','الأكل في غرفة العمليات','inside a sanitized non-operational Saudi military operations-room setting during a meal break, with ordinary tables, chairs, food trays, blank or non-readable wall screens, practical ceiling lighting, no tactical maps or live operational data, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_break_room_meal','الأكل في غرفة الاستراحة العسكرية','inside a plain Saudi military break room during a meal, with simple tables, plastic or metal chairs, food containers, cups, a small refrigerator or kettle, practical ceiling lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_field_tent_meal','الأكل في الخيمة الميدانية','inside a plain Saudi military field tent during a meal break, with folding tables, simple chairs, food containers, water bottles, canvas walls, daylight or portable practical lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_meal_next_to_vehicle','الأكل بجانب آلية عسكرية','beside a generic unmarked Saudi military transport vehicle parked safely during a meal break, with folding chairs, a small table, food containers, water bottles, ordinary ground dust, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_camp_yard_meal','الأكل في ساحة المعسكر','in a plain Saudi military camp yard during a meal break, with folding tables, simple chairs, food trays, water coolers, paved or compacted dusty ground, shade structures where plausible, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_coffee_break','شرب القهوة العسكرية','during a plain Saudi military coffee break in an ordinary administrative or camp rest area, with a small Arabic coffee cup, thermos or dallah, dates, simple seating, practical ambient light, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person','military_coffee_selfie']],
['عسكري — إعاشة','military_dining_hall','قاعة الطعام العسكرية','inside an ordinary Saudi military dining hall during a meal service, with long communal tables, steel trays, plastic chairs, water jugs, food containers, practical fluorescent ceiling lighting, and a plain lived-in cafeteria atmosphere, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_barracks_canteen','مقصف الثكنة العسكرية','inside a plain Saudi military barracks canteen during a break, with simple tables, plastic chairs, a counter, cups, food trays, a vending machine, fluorescent ceiling lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_officers_mess','غرفة طعام الضباط','inside a plain Saudi officers mess dining room with wooden tables, upholstered chairs, water jugs, simple tableware, a small coffee station, warm practical ceiling lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person','military_coffee_selfie']],
['عسكري — إعاشة','military_field_kitchen','المطبخ الميداني','at a plain Saudi military field kitchen during a meal break, with portable cooking equipment, steel pots, food containers, a folding table, dust on the ground, portable lighting or daylight, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_outdoor_camp_table','طاولة طعام خارجية في المعسكر','at a plain outdoor Saudi military camp table during a meal, with a folding table, simple chairs, food trays, water bottles, dust on the paved or compacted ground, a shade structure or clear sky, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_admin_office_lunch','مكتب إداري عسكري وقت الغداء','inside a plain Saudi military administrative office during lunch break, with a wooden desk, food containers, a mug, generic non-sensitive papers stacked to one side, a desktop computer showing no readable operational content, practical ceiling panel lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_meeting_room_meal','قاعة اجتماعات عسكرية وقت الأكل','inside a plain Saudi military meeting room during a meal break, with a conference table, chairs, food trays, water bottles, a whiteboard with unreadable non-sensitive marks, practical ceiling lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_after_training_break','استراحة بعد التمرين الميداني','during a break after a plain Saudi military field training exercise, with folding chairs, a cooler or water tank, food containers, water bottles, dusty ground, daylight or portable lighting, no active training equipment in view, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_desert_camp_meal','استراحة في مخيم صحراوي عسكري','inside a plain Saudi military desert camp during a meal break, with canvas tents, folding tables, chairs, food containers, water bottles, dust on the ground, clear desert sky or shade, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_vehicle_hangar_meal','وجبة قرب حظيرة المركبات','in a plain Saudi military vehicle hangar during a meal break, with generic unmarked transport vehicles parked nearby, a folding table, chairs, food containers, cups, dust on the concrete floor, practical ceiling lighting, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']],
['عسكري — إعاشة','military_guard_tea_break','استراحة شاي أثناء الحراسة','during a plain Saudi military guard-shift tea break in a non-sensitive outdoor or semi-outdoor rest area, with a small folding table, a thermos, cups, dates on a small plate, simple chairs, daylight or sunset, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person','military_coffee_selfie']],
['عسكري — إعاشة','military_outdoor_chair_meal','طعام على كرسي خارجي في المخيم','at a plain outdoor Saudi military camp chair during a meal, with a folding chair, a small side table, food containers, water bottles, dust on the ground, shade from a tent or awning, daylight, and no emblems, insignia, weapons, or identifiable signage',['military_meal_selfie','military_meal_third_person']]
]);

export const SAUDI_LOCATIONS = LOCATION_CATALOG.map(({ group, value, label, prompt }) => ({ group, value, label, prompt }));

export const CLOTHING_OPTIONS = grouped([
['ثياب وتراث سعودي','white_thobe','ثوب أبيض سعودي','a plain well-fitted white Saudi thobe with realistic cotton-poplin weight, natural folds, seam tension, and no artificial gloss'],
['ثياب وتراث سعودي','navy_thobe','ثوب كحلي داكن','a refined dark navy Saudi thobe with matte woven fabric, visible textile detail in lit areas, and natural compression folds'],
['ثياب وتراث سعودي','charcoal_thobe','ثوب فحمي','a charcoal Saudi thobe with realistic medium-weight fabric, restrained highlights, and naturally asymmetric folds'],
['ثياب وتراث سعودي','beige_thobe','ثوب بيج / رملي','a light beige Saudi thobe with realistic woven texture, soft drape, and practical warm-neutral tone'],
['ثياب وتراث سعودي','olive_thobe','ثوب زيتي هادئ','a muted olive Saudi thobe with matte textile response, natural sleeve creasing, and believable body compression'],
['ثياب وتراث سعودي','winter_thobe','ثوب شتوي ثقيل','a heavier winter Saudi thobe with denser fabric weight, broader folds, subdued sheen, and realistic gravity-driven drape'],
['ثياب وتراث سعودي','red_shemagh_agal','شماغ أحمر وأبيض مع عقال','a traditional red-and-white Saudi shemagh with a realistic black agal, natural woven thickness, gravity-driven asymmetric folds, and no turban-like wrapping'],
['ثياب وتراث سعودي','white_ghutra_agal','غترة بيضاء مع عقال','a traditional white Saudi ghutra with a realistic black agal, soft woven translucency, subtle asymmetry, and physically correct crown contact'],
['ثياب وتراث سعودي','red_shemagh_no_agal','شماغ أحمر بدون عقال','a red-and-white Saudi shemagh worn casually without an agal, with realistic woven folds and gravity-driven drape'],
['ثياب وتراث سعودي','white_ghutra_no_agal','غترة بيضاء بدون عقال','a white Saudi ghutra worn casually without an agal, with natural folds, soft fabric thickness, and realistic shoulder contact'],
['ثياب وتراث سعودي','bisht_thobe','ثوب مع بشت','a clean Saudi thobe worn with a lightweight formal bisht, with realistic shoulder support, long gravity-driven folds, subtle trim, restrained sheen, and natural sleeve openings'],
['ثياب وتراث سعودي','black_abaya','عباءة سوداء','a plain black abaya in matte medium-weight fabric with realistic shoulder drape, sleeve folds, hem weight, restrained highlights, and ordinary non-fashion-catalog styling'],
['ثياب وتراث سعودي','embroidered_abaya','عباءة سوداء بتطريز هادئ','a black abaya with restrained black-on-black embroidery, matte fabric response, realistic seam weight, gravity-driven folds, and no glossy ornamental exaggeration'],
['ثياب وتراث سعودي','abaya_hijab','عباءة سوداء مع حجاب','a plain black abaya with a black hijab, realistic layered fabric thickness, natural head-and-shoulder contact, matte textile response, and ordinary everyday drape'],
['كاجوال','black_tshirt','تيشيرت أسود سادة','a plain black crew-neck cotton T-shirt with matte jersey texture, body-conforming tension, and rounded natural folds'],
['كاجوال','white_tshirt','تيشيرت أبيض سادة','a plain white crew-neck cotton T-shirt with realistic jersey texture, soft folds, seam tension, and natural translucency control'],
['كاجوال','navy_tshirt','تيشيرت كحلي سادة','a plain navy cotton T-shirt with matte fabric response, natural shoulder drape, and realistic torso folds'],
['كاجوال','grey_tshirt','تيشيرت رمادي','a plain heather-grey cotton T-shirt with subtle knit variation, soft diffuse response, and believable folds'],
['كاجوال','navy_polo','بولو كحلي','a plain navy pique polo shirt with realistic knit texture, collar structure, small body folds, and restrained highlights'],
['كاجوال','white_polo','بولو أبيض','a plain white pique polo shirt with realistic knit texture, collar shape, seam tension, and natural folding'],
['كاجوال','charcoal_polo','بولو فحمي','a charcoal pique polo shirt with matte textile response, realistic collar behavior, and relaxed torso folds'],
['كاجوال','hoodie','هودي بسيط','a plain casual hoodie with medium-weight fleece, realistic hood volume, cuff compression, and gravity-driven folds'],
['كاجوال','crewneck_sweatshirt','سويت شيرت بدون قبعة','a plain crew-neck sweatshirt with medium-weight cotton fleece, ribbed cuffs, natural torso volume, and soft folds'],
['كاجوال','denim_jacket','جاكيت دنيم','a simple denim jacket with realistic structured cotton weave, seam stiffness, layered folds, and restrained worn texture'],
['كاجوال','light_jacket','جاكيت خفيف','a simple lightweight casual jacket with realistic shell fabric, zipper structure, cuff tension, and natural folds']
]);

export const CLOTHING_STYLING = Object.freeze([
  { value: 'default', label: 'افتراضي', prompt: '', applicableTo: ['all'] },
  { value: 'top-buttons-open', label: 'مفتوح من الأعلى', prompt: 'Top 2-3 buttons unbuttoned, revealing collarbone shadow. Fabric stretched across the chest with natural tension lines.', applicableTo: ['buttoned-top'] },
  { value: 'sleeves-rolled', label: 'مطوي الأكمام', prompt: 'Sleeves neatly rolled up to the elbows, creating tight folded fabric tension at the biceps.', applicableTo: ['sleeved'] },
  { value: 'untucked', label: 'غير مدخل', prompt: 'Shirt hem untucked, resting naturally over the hips with gravity-driven folds and asymmetric wrinkles.', applicableTo: ['tuckable-top'] },
  { value: 'french-tuck', label: 'مدخل من الأمام فقط', prompt: 'Shirt front hem tucked into the waistband, back hem left untucked. Fabric gathers naturally at the waist.', applicableTo: ['tuckable-top-with-pants'] },
  { value: 'fully-open', label: 'مفتوح بالكامل', prompt: 'Outer layer fully unbuttoned or unzipped, worn open with panels hanging loosely with gravity-driven folds. Inner layer visible beneath.', applicableTo: ['layered-top'] }
]);

export const HAND_INTERACTIONS = Object.freeze([
  { value: 'none', label: 'لا يوجد', prompt: '', applicableTo: ['all'] },
  { value: 'adjust-collar', label: 'تعديل الياقة', prompt: 'Fingers hooked inside the collar, pulling it slightly away from the neck. Fabric stretches across the chest.', applicableTo: ['collared'] },
  { value: 'roll-sleeve', label: 'رفع الكم', prompt: 'One hand pulling the short sleeve up towards the shoulder, compressing the fabric at the bicep.', applicableTo: ['short-sleeve'] },
  { value: 'wipe-sweat', label: 'مسح العرق', prompt: 'One hand holding a white towel wiping the forehead, while the other hand naturally rests at the side or adjusts clothing. Natural asymmetric posture.', applicableTo: ['all'] },
  { value: 'pocket-hands', label: 'وضع اليد في الجيب', prompt: 'Both hands inserted into the side pockets of the lower garment. The fabric stretches taut across the pelvis with natural compression at the pocket seams.', applicableTo: ['pocketed'] },
  { value: 'adjust-waistband', label: 'تعديل الخصر', prompt: 'One hand pulling the waistband of the lower garment up, which slightly lifts the bottom of the upper garment. Natural compression of the fabric at the hips.', applicableTo: ['waistband'] }
]);


export const HAND_PROPS = Object.freeze([
  { value:'macbook-pro-16', label:'MacBook Pro 16', group:'أجهزة', prompt:'a 16-inch MacBook Pro held with both hands, screen partially visible, aluminum body with realistic reflections, grip tension on fingers', weight:'heavy', grip:'two-hands', categories:['tech'], sceneTypes:['office_selfie','desk_work_selfie','cafe_selfie','restaurant_table_selfie','bedroom_selfie'], locations:['saudi_office','real_estate_office','open_plan_office','executive_office','meeting_room','meeting_room_glass','coworking_space','coworking_lounge','home_office_room','saudi_cafe','specialty_coffee','hotel_business_center'] },
  { value:'macbook-air-15', label:'MacBook Air 15', group:'أجهزة', prompt:'a 15-inch MacBook Air held with both hands, thin aluminum body, subtle wedge shape', weight:'heavy', grip:'two-hands', categories:['tech'], sceneTypes:['office_selfie','desk_work_selfie','cafe_selfie','restaurant_table_selfie'], locations:['saudi_office','real_estate_office','open_plan_office','executive_office','meeting_room','meeting_room_glass','coworking_space','coworking_lounge','saudi_cafe','specialty_coffee','hotel_business_center'] },
  { value:'ipad-pro-13', label:'iPad Pro 13', group:'أجهزة', prompt:'a 13-inch iPad Pro held with both hands or one hand on the edge, thin tablet body, screen facing slightly toward the subject', weight:'medium', grip:'one-or-two-hands', categories:['tech'], sceneTypes:['office_selfie','desk_work_selfie','cafe_selfie','restaurant_table_selfie','bedroom_selfie','home_interior_casual_selfie'], locations:['saudi_office','real_estate_office','open_plan_office','executive_office','coworking_space','coworking_lounge','saudi_cafe','specialty_coffee','saudi_bedroom_livedin','home_office_room'] },
  { value:'ipad-mini', label:'iPad Mini', group:'أجهزة', prompt:'an iPad Mini held in one hand, small tablet body, thumb resting on the bezel', weight:'light', grip:'one-hand', categories:['tech'], sceneTypes:['cafe_selfie','office_selfie','bedroom_selfie','outdoor_selfie','desk_work_selfie','restaurant_table_selfie','rooftop_terrace_selfie'], locations:['saudi_cafe','specialty_coffee','saudi_office','real_estate_office','saudi_bedroom_livedin','home_office_room','rooftop_terrace'] },
  { value:'iphone-15-pro-black', label:'iPhone 15 Pro — أسود', group:'أجهزة', prompt:'a black iPhone 15 Pro held in one hand, titanium finish with subtle reflections, thumb on the screen', weight:'light', grip:'one-hand', categories:['tech'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'iphone-15-pro-titanium', label:'iPhone 15 Pro — تيتانيوم', group:'أجهزة', prompt:'a natural titanium iPhone 15 Pro held in one hand, brushed metal finish', weight:'light', grip:'one-hand', categories:['tech'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'iphone-15-pro-blue', label:'iPhone 15 Pro — أزرق', group:'أجهزة', prompt:'a blue titanium iPhone 15 Pro held in one hand', weight:'light', grip:'one-hand', categories:['tech'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'galaxy-s24-ultra', label:'Galaxy S24 Ultra', group:'أجهزة', prompt:'a Samsung Galaxy S24 Ultra held in one hand, large screen with subtle bezel reflections', weight:'light', grip:'one-hand', categories:['tech'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'nintendo-switch', label:'Nintendo Switch', group:'أجهزة', prompt:'a Nintendo Switch held with both hands or one hand on the side, screen facing slightly away', weight:'medium', grip:'one-or-two-hands', categories:['tech'], sceneTypes:['cafe_selfie','bedroom_selfie','home_interior_casual_selfie','restaurant_table_selfie'], locations:['saudi_cafe','specialty_coffee','saudi_bedroom_livedin','villa_living_room','apartment_living_room'] },
  { value:'kindle-paperwhite', label:'Kindle Paperwhite', group:'أجهزة', prompt:'a Kindle Paperwhite held in one hand, matte e-ink screen, thumb on the bezel', weight:'light', grip:'one-hand', categories:['tech','book'], sceneTypes:['bedroom_selfie','cafe_selfie','outdoor_selfie','restaurant_table_selfie','rooftop_terrace_selfie'], locations:['saudi_bedroom_livedin','saudi_cafe','specialty_coffee','library_reading_area','public_park','rooftop_terrace'] },
  { value:'airpods-case', label:'علبة AirPods', group:'أجهزة', prompt:'a small white AirPods case held in one hand, glossy plastic with finger contact', weight:'light', grip:'one-hand', categories:['tech'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'airpods-max', label:'AirPods Max', group:'أجهزة', prompt:'over-ear AirPods Max headphones, one hand holding them by the headband, aluminum ear cups', weight:'medium', grip:'one-hand', categories:['tech'], sceneTypes:['cafe_selfie','office_selfie','bedroom_selfie','outdoor_selfie','desk_work_selfie','rooftop_terrace_selfie'], locations:['saudi_cafe','specialty_coffee','saudi_office','real_estate_office','saudi_bedroom_livedin','public_park','rooftop_terrace'] },

  { value:'arabic-coffee-finjan', label:'فنجان قهوة عربية', group:'مشروبات', prompt:'a small handleless Arabic coffee finjan held by the rim in one hand, thin porcelain, subtle steam if hot', weight:'light', grip:'one-hand', categories:['drink-saudi'], sceneTypes:['majlis_selfie','cafe_selfie','majlis_standing_selfie','majlis_seated_selfie','restaurant_table_selfie'], locations:['modern_saudi_majlis','traditional_majlis','saudi_cafe','specialty_coffee'] },
  { value:'arabic-dallah-cup', label:'كأس قهوة عربية مع دلة', group:'مشروبات', prompt:'a small Arabic coffee cup in one hand, with a brass dallah visible nearby in the background', weight:'light', grip:'one-hand', categories:['drink-saudi'], sceneTypes:['majlis_selfie','cafe_selfie','majlis_standing_selfie','majlis_seated_selfie'], locations:['modern_saudi_majlis','traditional_majlis','saudi_cafe','specialty_coffee'] },
  { value:'tea-glass-arabic', label:'كأس شاي عربي', group:'مشروبات', prompt:'a small Arabic tea glass with visible dark tea, thin glass, held carefully in one hand', weight:'light', grip:'one-hand', categories:['drink-saudi'], sceneTypes:['majlis_selfie','cafe_selfie','office_selfie','outdoor_selfie','majlis_standing_selfie','majlis_seated_selfie','restaurant_table_selfie','desk_work_selfie'], locations:['modern_saudi_majlis','traditional_majlis','saudi_cafe','specialty_coffee','saudi_office','real_estate_office','rooftop_terrace','villa_courtyard_night'] },
  { value:'moroccan-tea-glass', label:'كأس شاي مغربي', group:'مشروبات', prompt:'a tall decorative Moroccan tea glass with mint leaves, held in one hand', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['cafe_selfie','home_interior_casual_selfie','restaurant_table_selfie'], locations:['saudi_cafe','specialty_coffee','villa_living_room','apartment_living_room'] },
  { value:'cappuccino-cup', label:'فنجان كابتشينو', group:'مشروبات', prompt:'a white ceramic cappuccino cup with saucer held in one hand, foam visible from a slight angle', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['cafe_selfie','office_selfie','home_interior_casual_selfie','restaurant_table_selfie','restaurant_waiting_selfie','desk_work_selfie'], locations:['saudi_cafe','specialty_coffee','bakery_cafe','saudi_office','real_estate_office','office_break_room','villa_living_room','apartment_living_room'] },
  { value:'espresso-cup', label:'فنجان إسبريسو', group:'مشروبات', prompt:'a small espresso cup held between thumb and index finger, dark espresso visible', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['cafe_selfie','office_selfie','restaurant_table_selfie','desk_work_selfie'], locations:['saudi_cafe','specialty_coffee','bakery_cafe','saudi_office','real_estate_office','office_break_room'] },
  { value:'iced-coffee-cup', label:'كوب قهوة مثلجة', group:'مشروبات', prompt:'a tall clear plastic iced coffee cup with visible ice cubes and straw, condensation on the outside, held in one hand', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['cafe_selfie','outdoor_selfie','mall_selfie','restaurant_table_selfie','mall_shopping_selfie','street_night_selfie'], locations:['saudi_cafe','specialty_coffee','bakery_cafe','mall_atrium','boulevard_walkway','storefront_street'] },
  { value:'water-bottle-plastic', label:'قارورة ماء بلاستيكية', group:'مشروبات', prompt:'a clear plastic water bottle held in one hand, cap on, condensation beads on the surface', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['gym_workout_selfie','post_workout_selfie','gym_wash_area_selfie','outdoor_selfie','inside_car_selfie','office_selfie','walking_selfie','airport_walkway_selfie'], locations:['gym','gym_locker_area','gym_sink_mirror_area','saudi_office','open_plan_office','night_parking','day_parking','desert_roadside','public_park'] },
  { value:'water-bottle-metal', label:'قارورة ماء معدنية', group:'مشروبات', prompt:'a brushed stainless steel water bottle held in one hand, matte finish, subtle condensation at the base', weight:'medium', grip:'one-hand', categories:['drink'], sceneTypes:['gym_workout_selfie','post_workout_selfie','gym_wash_area_selfie','outdoor_selfie','office_selfie','walking_selfie'], locations:['gym','gym_locker_area','gym_sink_mirror_area','saudi_office','open_plan_office','desert_roadside','public_park'] },
  { value:'energy-drink-can', label:'علبة مشروب طاقة', group:'مشروبات', prompt:'a metallic energy drink can held in one hand, condensation, blue or red branding', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['gym_workout_selfie','post_workout_selfie','office_selfie','inside_car_selfie','desk_work_selfie'], locations:['gym','gym_locker_area','saudi_office','open_plan_office','night_parking','day_parking'] },
  { value:'thermos', label:'ترمس', group:'مشروبات', prompt:'a small stainless steel thermos held in one hand, matte metal finish', weight:'medium', grip:'one-hand', categories:['drink'], sceneTypes:['outdoor_selfie','desert_stop_selfie','inside_car_selfie','rooftop_terrace_selfie','military_coffee_selfie'], locations:['desert_roadside','desert_dunes','rocky_desert','desert_campsite_simple','roadside_rest_area','night_parking','day_parking','rooftop_terrace'] },
  { value:'smoothie-cup', label:'كوب سموذي', group:'مشروبات', prompt:'a clear plastic smoothie cup with visible layered colors, straw inserted, held in one hand', weight:'light', grip:'one-hand', categories:['drink'], sceneTypes:['cafe_selfie','gym_workout_selfie','post_workout_selfie','mall_selfie','mall_shopping_selfie'], locations:['saudi_cafe','specialty_coffee','gym','mall_atrium','food_court'] },

  { value:'date-arb', label:'تمر', group:'طعام', prompt:'a single date held between thumb and index finger, matte skin with slight oil sheen', weight:'light', grip:'one-hand', categories:['food-saudi'], sceneTypes:['majlis_selfie','home_interior_casual_selfie','office_selfie','cafe_selfie','majlis_seated_selfie','restaurant_table_selfie'], locations:['modern_saudi_majlis','traditional_majlis','villa_living_room','apartment_living_room','saudi_office','saudi_cafe','specialty_coffee'] },
  { value:'apple-red', label:'تفاحة حمراء', group:'طعام', prompt:'a red apple held in one hand, natural specular highlight, subtle stem visible', weight:'light', grip:'one-hand', categories:['food'], sceneTypes:['home_interior_casual_selfie','office_selfie','outdoor_selfie','gym_workout_selfie','post_workout_selfie'], locations:['villa_living_room','apartment_living_room','saudi_office','open_plan_office','public_park','gym'] },
  { value:'sandwich-half', label:'نصف ساندويتش', group:'طعام', prompt:'half a sandwich held in one hand, bread texture visible, filling slightly exposed', weight:'light', grip:'one-hand', categories:['food'], sceneTypes:['office_selfie','home_interior_casual_selfie','cafe_selfie','restaurant_table_selfie','desk_work_selfie'], locations:['saudi_office','real_estate_office','office_break_room','villa_living_room','apartment_living_room','saudi_cafe','specialty_coffee'] },
  { value:'croissant', label:'كرواسون', group:'طعام', prompt:'a croissant held in one hand, flaky layered crust with visible texture', weight:'light', grip:'one-hand', categories:['food'], sceneTypes:['cafe_selfie','office_selfie','home_interior_casual_selfie','restaurant_table_selfie'], locations:['saudi_cafe','specialty_coffee','bakery_cafe','saudi_office','office_break_room','villa_living_room'] },
  { value:'protein-bar', label:'بروتين بار', group:'طعام', prompt:'a wrapped protein bar held in one hand, matte packaging with subtle wrinkle', weight:'light', grip:'one-hand', categories:['food'], sceneTypes:['gym_workout_selfie','post_workout_selfie','office_selfie','outdoor_selfie'], locations:['gym','gym_locker_area','saudi_office','public_park','desert_roadside'] },
  { value:'chocolate-bar', label:'قطعة شوكولاتة', group:'طعام', prompt:'a wrapped chocolate bar held in one hand, glossy packaging, minimal folds', weight:'light', grip:'one-hand', categories:['food'], sceneTypes:['home_interior_casual_selfie','cafe_selfie','office_selfie','restaurant_table_selfie'], locations:['villa_living_room','apartment_living_room','saudi_cafe','specialty_coffee','saudi_office'] },
  { value:'dates-bowl', label:'طبق تمر صغير', group:'طعام', prompt:'a small ceramic bowl of dates held carefully with one hand, dates visible from above', weight:'light', grip:'one-hand', categories:['food-saudi'], sceneTypes:['majlis_selfie','home_interior_casual_selfie','majlis_seated_selfie'], locations:['modern_saudi_majlis','traditional_majlis','villa_living_room','apartment_living_room'] },
  { value:'cupcake', label:'كب كيك', group:'طعام', prompt:'a small cupcake held in one hand, frosting visible on top, paper liner', weight:'light', grip:'one-hand', categories:['food'], sceneTypes:['cafe_selfie','office_selfie','home_interior_casual_selfie','restaurant_table_selfie'], locations:['saudi_cafe','specialty_coffee','bakery_cafe','saudi_office','villa_living_room'] },

  { value:'book-paperback', label:'كتاب غلاف ورقي', group:'كتب', prompt:'a paperback book held in one hand or both hands, spine visible, slight crease in the cover', weight:'light', grip:'one-or-two-hands', categories:['book'], sceneTypes:['bedroom_selfie','cafe_selfie','home_interior_casual_selfie','outdoor_selfie','office_selfie','restaurant_table_selfie'], locations:['saudi_bedroom_livedin','saudi_cafe','specialty_coffee','villa_living_room','library_reading_area','public_park','saudi_office'] },
  { value:'book-hardcover', label:'كتاب غلاف مقوى', group:'كتب', prompt:'a hardcover book held with both hands, dust jacket, sharp corners', weight:'medium', grip:'two-hands', categories:['book'], sceneTypes:['bedroom_selfie','home_interior_casual_selfie','office_selfie'], locations:['saudi_bedroom_livedin','villa_living_room','library_reading_area','home_office_room','saudi_office'] },
  { value:'notebook-moleskine', label:'دفتر Moleskine', group:'كتب', prompt:'a black Moleskine notebook held in one hand, elastic band visible', weight:'light', grip:'one-hand', categories:['stationery'], sceneTypes:['cafe_selfie','office_selfie','home_interior_casual_selfie','desk_work_selfie'], locations:['saudi_cafe','specialty_coffee','saudi_office','real_estate_office','home_office_room','coworking_space'] },
  { value:'magazine', label:'مجلة', group:'كتب', prompt:'a rolled magazine held loosely in one hand, glossy cover with slight bend', weight:'light', grip:'one-hand', categories:['book'], sceneTypes:['home_interior_casual_selfie','cafe_selfie','outdoor_selfie','restaurant_table_selfie'], locations:['villa_living_room','apartment_living_room','saudi_cafe','specialty_coffee','public_park'] },
  { value:'pen-fountain', label:'قلم حبر', group:'كتب', prompt:'a fountain pen held between fingers, nib visible, metallic finish', weight:'light', grip:'one-hand', categories:['stationery'], sceneTypes:['office_selfie','cafe_selfie','home_interior_casual_selfie','desk_work_selfie'], locations:['saudi_office','real_estate_office','open_plan_office','saudi_cafe','specialty_coffee','home_office_room'] },
  { value:'pencil', label:'قلم رصاص', group:'كتب', prompt:'a wooden pencil held between fingers, sharpened tip, subtle wood grain', weight:'light', grip:'one-hand', categories:['stationery'], sceneTypes:['office_selfie','home_interior_casual_selfie','desk_work_selfie'], locations:['saudi_office','real_estate_office','home_office_room'] },
  { value:'sketchbook', label:'دفتر رسم', group:'كتب', prompt:'a sketchbook held open in one hand, visible pencil drawings on the current page', weight:'light', grip:'one-hand', categories:['stationery'], sceneTypes:['cafe_selfie','home_interior_casual_selfie','outdoor_selfie','restaurant_table_selfie'], locations:['saudi_cafe','specialty_coffee','villa_living_room','public_park','rooftop_terrace'] },
  { value:'newspaper', label:'صحيفة', group:'كتب', prompt:'a folded newspaper held with one hand, visible Arabic headline typography', weight:'light', grip:'one-hand', categories:['book'], sceneTypes:['home_interior_casual_selfie','cafe_selfie','majlis_selfie','majlis_seated_selfie'], locations:['villa_living_room','apartment_living_room','saudi_cafe','modern_saudi_majlis','traditional_majlis'] },

  { value:'car-keys-fob', label:'مفتاح سيارة', group:'مفاتيح', prompt:'a car key fob with remote buttons held in one hand, small metallic keychain attached', weight:'light', grip:'one-hand', categories:['keys'], sceneTypes:['inside_car_selfie','door_open_car_selfie','outdoor_selfie','parking_lot_night_selfie','third_person_car_adjacent'], locations:['night_parking','day_parking','villa_driveway','villa_garage','office_parking_outdoor','small_commercial_parking'] },
  { value:'keychain-leather', label:'سلسلة مفاتيح جلدية', group:'مفاتيح', prompt:'a leather keychain with multiple keys held in one hand', weight:'light', grip:'one-hand', categories:['keys'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'wallet-leather', label:'محفظة جلدية', group:'مفاتيح', prompt:'a brown leather wallet held in one hand, visible stitching and card slot', weight:'light', grip:'one-hand', categories:['wallet'], sceneTypes:['*'], locations:[], excludedSceneTypes:['mosque_parking_selfie'], excludedLocations:['neighborhood_mosque_parking'] },
  { value:'card-credit', label:'بطاقة بنكية', group:'مفاتيح', prompt:'a plain bank card held between thumb and index finger, embossed numbers unreadable', weight:'light', grip:'one-hand', categories:['wallet'], sceneTypes:['cafe_selfie','office_selfie','mall_selfie','restaurant_table_selfie','mall_shopping_selfie'], locations:['saudi_cafe','specialty_coffee','saudi_office','real_estate_office','mall_atrium','food_court'] },
  { value:'sunglasses-folded', label:'نظارة شمسية مطوية', group:'مفاتيح', prompt:'folded sunglasses held in one hand, dark lenses catching a subtle reflection', weight:'light', grip:'one-hand', categories:['accessory'], sceneTypes:['outdoor_selfie','inside_car_selfie','cafe_selfie','beach_corniche_selfie','desert_stop_selfie'], locations:['saudi_cafe','specialty_coffee','night_parking','day_parking','red_sea_beach','gulf_beach','desert_roadside','jeddah_corniche','khobar_corniche'] },
  { value:'watch-luxury', label:'ساعة فاخرة', group:'مفاتيح', prompt:'a luxury watch held in one hand, metallic bracelet folded over fingers', weight:'light', grip:'one-hand', categories:['accessory'], sceneTypes:['office_selfie','cafe_selfie','desk_work_selfie'], locations:['saudi_office','real_estate_office','executive_office','saudi_cafe','specialty_coffee'] },
  { value:'rosary-beads', label:'سبحة', group:'مفاتيح', prompt:'a wooden rosary held loosely in one hand, beads visible with subtle wear', weight:'light', grip:'one-hand', categories:['cultural-saudi'], sceneTypes:['majlis_selfie','home_interior_casual_selfie','mosque_parking_selfie','majlis_standing_selfie','majlis_seated_selfie'], locations:['modern_saudi_majlis','traditional_majlis','villa_living_room','apartment_living_room','neighborhood_mosque_parking'] },

  { value:'backpack-shoulder', label:'حقيبة ظهر على كتف واحد', group:'حقائب', prompt:'a backpack worn on one shoulder, one hand holding the strap', weight:'medium', grip:'one-hand-on-strap', categories:['bag'], sceneTypes:['outdoor_selfie','walking_selfie','office_selfie','airport_walkway_selfie','mall_selfie'], locations:['airport_terminal','saudi_office','open_plan_office','ordinary_saudi_street','public_park','mall_atrium'] },
  { value:'laptop-bag', label:'حقيبة لابتوب', group:'حقائب', prompt:'a laptop messenger bag worn over one shoulder, hand on the strap, bag sagging with weight', weight:'medium', grip:'one-hand-on-strap', categories:['bag'], sceneTypes:['office_selfie','cafe_selfie','outdoor_selfie','desk_work_selfie','airport_walkway_selfie'], locations:['saudi_office','real_estate_office','open_plan_office','saudi_cafe','specialty_coffee','airport_terminal','office_parking_outdoor'] },
  { value:'shoulder-bag-leather', label:'حقيبة كتف جلدية', group:'حقائب', prompt:'a leather shoulder bag hanging at the side, one hand on the strap', weight:'medium', grip:'one-hand-on-strap', categories:['bag'], sceneTypes:['cafe_selfie','mall_selfie','office_selfie','mall_shopping_selfie','walking_selfie'], locations:['saudi_cafe','specialty_coffee','mall_atrium','saudi_office','real_estate_office'] },
  { value:'shopping-bag', label:'كيس تسوق', group:'حقائب', prompt:'a shopping bag held by its handles in one hand, slightly stretched from weight', weight:'light', grip:'one-hand', categories:['bag'], sceneTypes:['supermarket_selfie','mall_selfie','mall_shopping_selfie','outdoor_selfie','walking_selfie'], locations:['supermarket_aisle','convenience_store','grocery_store','mall_atrium','storefront_street','small_commercial_parking'] },
  { value:'coffee-tray', label:'صينية قهوة', group:'حقائب', prompt:'a small tray with two coffee cups held with both hands, balanced carefully', weight:'medium', grip:'two-hands', categories:['drink'], sceneTypes:['office_selfie','cafe_selfie','desk_work_selfie'], locations:['saudi_office','office_break_room','saudi_cafe','specialty_coffee','bakery_cafe'] }
]);

export const POSE_HAND_USAGE = Object.freeze({
  standing_relaxed:0, standing_one_hand:0, walking_slow:0, holding_basket:1,
  seated_sofa:0, seated_chair:0, lean_wall:0, lean_counter:0, driver_seat:0, passenger_seat:0,
  door_open_car:0, coffee_hand:1, adjust_clothing:1, hand_on_head:1, one_hand_pocket:1, close_relaxed:0,
  'bed-lying-back':0, 'bed-lying-side':1, 'bed-lying-stomach':1, 'bed-reclining-headboard':0,
  'bed-propped-pillows':0, 'bed-lying-partial':1, 'bed-lying-diagonal':1, 'bed-lying-reading':1,
  'bed-lying-back-knees-bent':0, 'bed-sitting-cross':0, 'bed-sitting-edge':0, 'bed-sitting-back-wall':0,
  'bed-sitting-legs-extended':0, 'bed-sitting-hugging-pillow':1, 'bed-sitting-sideways':0,
  'armchair-sit-lean-back':0, 'armchair-sit-corner':0, 'armchair-sit-one-knee':0, 'armchair-sit-crossed':0,
  'armchair-sit-feet-floor':0, 'bedroom-stand-relaxed':0, 'bedroom-stand-one-hand':0,
  'bedroom-stand-lean-wardrobe':0, 'bedroom-stand-lean-wall':0, 'bedroom-stand-near-bed':0,
  'bedroom-stand-window':0, 'bedroom-laptop-bed':0, 'bedroom-laptop-armchair':1, 'bedroom-cup-bed':1,
  'bedroom-tea-armchair':1, 'bedroom-book-bed':1, 'bedroom-phone-only':0, 'bedroom-floor-cross':0,
  'bedroom-floor-back-wall':0, 'bedroom-floor-knee-up':0, 'bedroom-curtain-touch':1,
  'bedroom-nightstand-reach':1, 'bedroom-mirror-stand-relaxed':0, 'bedroom-mirror-adjust':1,
  'bedroom-mirror-seated':0,
  // Mirror poses mirror bedroom-mirror equivalents
  // but use underscore keys.
  mirror_standing_relaxed:0, mirror_one_hand_pocket:1, mirror_adjust_clothing:1, mirror_seated:0, mirror_full_length:0
});

const HAND_INTERACTION_HAND_USAGE = Object.freeze({
  none:0, 'adjust-collar':1, 'roll-sleeve':1, 'wipe-sweat':1, 'pocket-hands':2, 'adjust-waistband':1
});

// TODO-MULTI-FLEXIBLE: The current 2-hand cap prevents
// two flexible props from being accepted together. If hand
// capacity ever expands (e.g., additional support sources),
// ensure each accepted flexible prop emits its own clause.
// Current logic handles this correctly, but the invariant
// should be re-verified.
export function getPropHandUsage(propOrGrip, availableHands = 1) {
  const grip = typeof propOrGrip === 'string' && HAND_PROPS.some((prop) => prop.value === propOrGrip)
    ? HAND_PROPS.find((prop) => prop.value === propOrGrip)?.grip
    : typeof propOrGrip === 'string' ? propOrGrip : propOrGrip?.grip;
  if (grip === 'two-hands') return 2; if (grip === 'one-or-two-hands') return availableHands >= 2 ? 2 : 1;
  if (grip === 'one-hand' || grip === 'one-hand-on-strap') return 1;
  return 0;
}

export function getHandBudgetForScene(captureType) {
  const capture = String(captureType || '').toLowerCase();
  if (/third-person/.test(capture)) return 2;
  if (/mirror/.test(capture)) return 1;
  if (/selfie/.test(capture)) return 1;
  return 1;
}

function resolvePropLocationValue(location) {
  const raw = String(location || '').trim();
  if (!raw) return '';
  const byValue = LOCATION_CATALOG.find((item) => item.value === raw);
  if (byValue) return byValue.value;
  const byPrompt = LOCATION_CATALOG.find((item) => item.prompt === raw);
  return byPrompt?.value || raw;
}

function propMatchesContext(prop, sceneType, location) {
  const scene = String(sceneType || '').trim();
  const locationValue = resolvePropLocationValue(location);
  if (prop.excludedSceneTypes?.includes(scene)) return false;
  if (locationValue && prop.excludedLocations?.includes(locationValue)) return false;
  const sceneMatch = prop.sceneTypes?.includes('*') || prop.sceneTypes?.includes(scene);
  const locationMatch = Boolean(locationValue && prop.locations?.includes(locationValue));
  return Boolean(sceneMatch || locationMatch);
}

export function getRemainingHands(sceneType, captureType, primaryProp = 'none', pose = '', handInteraction = 'none') {
  const captureHands = getHandBudgetForScene(captureType);
  const poseHandUsage = POSE_HAND_USAGE[pose] || 0;
  const interactionHandUsage = HAND_INTERACTION_HAND_USAGE[handInteraction] || 0;
  const availableHands = Math.max(0, captureHands - poseHandUsage - interactionHandUsage), primaryPropUsage = primaryProp && primaryProp !== 'none' ? getPropHandUsage(primaryProp, availableHands) : 0;
  return Math.max(0, availableHands - primaryPropUsage);
}

export function getAvailableProps(sceneType, captureType, location = '', pose = '', handInteraction = 'none') {
  const remaining = getRemainingHands(sceneType, captureType, 'none', pose, handInteraction);
  if (remaining <= 0) return [];
  return HAND_PROPS.filter((prop) => getPropHandUsage(prop, remaining) <= remaining && propMatchesContext(prop, sceneType, location));
}

export const FORMAL_SUITS = [
  { group:'كلاسيكي', value:'suit-navy-white', label:'بدلة كحلية + قميص أبيض', prompt:'a navy two-piece suit with a crisp white dress shirt, wool-blend texture, natural lapel roll, sleeve break, trouser crease, restrained sheen' },
  { group:'كلاسيكي', value:'suit-navy-lightblue', label:'بدلة كحلية + قميص أزرق فاتح', prompt:'a navy two-piece suit with a light-blue dress shirt, wool-blend texture, matte trouser drape' },
  { group:'كلاسيكي', value:'suit-charcoal-white', label:'بدلة فحمية + قميص أبيض', prompt:'a charcoal two-piece suit with a white dress shirt, visible wool weave, structured lapel roll' },
  { group:'كلاسيكي', value:'suit-charcoal-lightblue', label:'بدلة فحمية + قميص أزرق فاتح', prompt:'a charcoal two-piece suit with a light-blue dress shirt, restrained matte finish' },
  { group:'كلاسيكي', value:'suit-black-white', label:'بدلة سوداء + قميص أبيض', prompt:'a black two-piece suit with a white dress shirt, high contrast, natural fabric folds' },
  { group:'كلاسيكي', value:'suit-black-black', label:'بدلة سوداء + قميص أسود', prompt:'a black two-piece suit with a black dress shirt, monochromatic, matte texture' },
  { group:'كلاسيكي', value:'suit-grey-light', label:'بدلة رمادية فاتحة + قميص أبيض', prompt:'a light-grey two-piece suit with a white dress shirt, cool palette, wool-blend texture' },
  { group:'كلاسيكي', value:'suit-grey-mid', label:'بدلة رمادية متوسطة + قميص أبيض', prompt:'a mid-grey two-piece suit with a white dress shirt, balanced neutral palette' },
  { group:'أعمال', value:'suit-navy-pinstripe', label:'بدلة كحلية مخطط رفيع + قميص أبيض', prompt:'a navy pinstripe two-piece suit with a white shirt, subtle white lines, tailored structure' },
  { group:'أعمال', value:'suit-charcoal-pinstripe', label:'بدلة فحمية مخطط رفيع + قميص أبيض', prompt:'a charcoal pinstripe two-piece suit with a white shirt, refined business silhouette' },
  { group:'أعمال', value:'suit-grey-check', label:'بدلة رمادية كاروهات خفيفة + قميص أبيض', prompt:'a light-grey suit with subtle windowpane check pattern, white shirt, wool-blend' },
  { group:'أعمال', value:'suit-blue-dark', label:'بدلة زرقاء داكنة + قميص أزرق فاتح', prompt:'a deep blue two-piece suit with a light-blue shirt, cool professional palette' },
  { group:'أعمال', value:'suit-brown-tobacco', label:'بدلة بنية تبغي + قميص كريمي', prompt:'a tobacco-brown two-piece suit with a cream shirt, warm office palette' },
  { group:'أعمال', value:'suit-olive', label:'بدلة زيتية + قميص بيج', prompt:'an olive two-piece suit with a beige shirt, muted professional palette' },
  { group:'أعراس', value:'suit-navy-velvet', label:'بدلة كحلية + بليزر مخملي', prompt:'a navy two-piece suit with a matching velvet blazer, white shirt, subtle velvet sheen on highlight-facing surfaces' },
  { group:'أعراس', value:'suit-charcoal-velvet', label:'بدلة فحمية + بليزر مخملي', prompt:'a charcoal suit with a matching velvet blazer, white shirt, rich fabric depth' },
  { group:'أعراس', value:'suit-burgundy-dark', label:'بدلة عنابية داكنة + قميص كريمي', prompt:'a deep burgundy two-piece suit with a cream shirt, warm celebration palette' },
  { group:'أعراس', value:'suit-cream-white', label:'بدلة كريمية + قميص أبيض', prompt:'a cream two-piece suit with a white shirt, warm light palette, restrained sheen' },
  { group:'أعراس', value:'suit-beige-light', label:'بدلة بيج فاتحة + قميص بيج', prompt:'a light beige two-piece suit with a matching beige shirt, tonal warm palette' },
  { group:'أعراس', value:'suit-grey-dark-midshirt', label:'بدلة رمادية داكنة + قميص رمادي متوسط', prompt:'a dark grey two-piece suit with a mid-grey shirt, monochromatic sophisticated' },
  { group:'ترابي', value:'suit-olive-dark', label:'بدلة زيتية داكنة + قميص بيج', prompt:'a dark olive two-piece suit with a beige shirt, muted earth palette' },
  { group:'ترابي', value:'suit-brown-dark', label:'بدلة بنية داكنة + قميص كريمي', prompt:'a dark brown two-piece suit with a cream shirt, deep warm palette' },
  { group:'ترابي', value:'suit-brown-tobacco-light', label:'بدلة بنية تبغي فاتحة + قميص بيج', prompt:'a light tobacco two-piece suit with a beige shirt, warm earth pairing' },
  { group:'ترابي', value:'suit-grey-earthy', label:'بدلة رمادية ترابية + قميص بيج', prompt:'an earthy grey two-piece suit with a beige shirt, muted natural palette' },
  { group:'ترابي', value:'suit-burgundy-classic', label:'بدلة عنابية + قميص أبيض', prompt:'a burgundy two-piece suit with a white shirt, rich deep palette' },
  { group:'بليزر', value:'blazer-navy-grey', label:'بليزر كحلي + بنطال رمادي فاتح', prompt:'a navy blazer with light-grey tailored trousers, smart-casual tailoring, natural lapel roll' },
  { group:'بليزر', value:'blazer-charcoal-navy', label:'بليزر فحمي + بنطال كحلي', prompt:'a charcoal blazer with navy tailored trousers, refined business-casual' },
  { group:'بليزر', value:'blazer-beige-tobacco', label:'بليزر بيج + بنطال بني تبغي', prompt:'a beige blazer with tobacco-brown trousers, warm earth-tone pairing' },
  { group:'بليزر', value:'blazer-grey-light-charcoal', label:'بليزر رمادي فاتح + بنطال فحمي', prompt:'a light-grey blazer with charcoal trousers, cool tonal contrast' },
  { group:'بليزر', value:'blazer-brown-cream', label:'بليزر بني داكن + بنطال كريمي', prompt:'a dark brown blazer with cream trousers, warm elegant pairing' }
];

export const FORMAL_LOOKS = simple([
['look-01','قميص أبيض + بنطال كحلي','a crisp white oxford cotton shirt with navy tailored wool-blend trousers, visible basket weave, matte trouser drape'],
['look-02','قميص أبيض + بنطال فحمي','a white oxford cotton shirt with charcoal tailored trousers, natural cotton wrinkles'],
['look-03','قميص أبيض + بنطال أسود','a white oxford cotton shirt with black tailored trousers, restrained contrast'],
['look-04','قميص أبيض + بنطال رمادي فاتح','a white oxford cotton shirt with light-grey tailored trousers'],
['look-05','قميص أبيض + بنطال رمادي متوسط','a white oxford cotton shirt with mid-grey tailored trousers'],
['look-06','قميص أبيض + بنطال كريمي','a white oxford cotton shirt with cream tailored trousers'],
['look-07','قميص أبيض + بنطال بيج','a white oxford cotton shirt with beige tailored trousers'],
['look-08','قميص أبيض + بنطال بني تبغي','a white oxford shirt with tobacco-brown tailored trousers'],
['look-09','قميص أبيض + بنطال كاكي','a white oxford cotton shirt with khaki cotton-twill trousers'],
['look-10','قميص أبيض + بنطال زيتي','a white oxford cotton shirt with olive cotton-twill trousers'],
['look-11','قميص أزرق فاتح + بنطال كحلي','a light-blue oxford cotton shirt with navy tailored trousers, visible basket weave'],
['look-12','قميص أزرق فاتح + بنطال فحمي','a light-blue oxford cotton shirt with charcoal tailored trousers'],
['look-13','قميص أزرق فاتح + بنطال أسود','a light-blue oxford cotton shirt with black tailored trousers'],
['look-14','قميص أزرق فاتح + بنطال رمادي فاتح','a light-blue oxford shirt with light-grey tailored trousers'],
['look-15','قميص أزرق فاتح + بنطال رمادي متوسط','a light-blue oxford shirt with mid-grey tailored trousers'],
['look-16','قميص أزرق فاتح + بنطال كريمي','a light-blue oxford shirt with cream tailored trousers'],
['look-17','قميص أزرق فاتح + بنطال بيج','a light-blue oxford shirt with beige tailored trousers'],
['look-18','قميص أزرق فاتح + بنطال بني تبغي','a light-blue oxford shirt with tobacco-brown tailored trousers'],
['look-19','قميص أزرق فاتح + بنطال كاكي','a light-blue oxford shirt with khaki chinos'],
['look-20','قميص أزرق فاتح + بنطال زيتي','a light-blue oxford shirt with olive chinos'],
['look-21','قميص أزرق فاتح + بنطال كحلي مخطط','a light-blue oxford shirt with navy pinstripe trousers'],
['look-22','قميص كحلي مخطط + بنطال فحمي','a navy pinstripe shirt with charcoal tailored trousers'],
['look-23','قميص كحلي مخطط + بنطال رمادي فاتح','a navy pinstripe shirt with light-grey tailored trousers'],
['look-24','قميص كحلي مخطط + بنطال بني تبغي','a navy pinstripe shirt with tobacco-brown tailored trousers'],
['look-25','قميص كحلي مخطط + بنطال كحلي','a navy pinstripe shirt with navy tailored trousers'],
['look-26','قميص كحلي + بنطال رمادي فاتح','a navy dress shirt with light-grey tailored trousers'],
['look-27','قميص كحلي + بنطال رمادي متوسط','a navy dress shirt with mid-grey tailored trousers'],
['look-28','قميص كحلي + بنطال كريمي','a navy dress shirt with cream tailored trousers'],
['look-29','قميص كحلي + بنطال بيج','a navy dress shirt with beige tailored trousers'],
['look-30','قميص كحلي + بنطال فحمي','a navy dress shirt with charcoal tailored trousers'],
['look-31','قميص كحلي + بنطال أسود','a navy dress shirt with black tailored trousers'],
['look-32','قميص كحلي + بنطال بني تبغي','a navy dress shirt with tobacco-brown tailored trousers'],
['look-33','قميص كحلي + بنطال كاكي','a navy dress shirt with khaki chinos'],
['look-34','قميص كحلي + بنطال زيتي','a navy dress shirt with olive chinos'],
['look-35','قميص كحلي بياقة دائرية + بنطال رمادي فاتح','a navy band-collar shirt with light-grey tailored trousers'],
['look-36','قميص كحلي بياقة دائرية + بنطال فحمي','a navy band-collar shirt with charcoal tailored trousers'],
['look-37','قميص فحمي + بنطال كحلي','a charcoal dress shirt with navy tailored trousers'],
['look-38','قميص فحمي + بنطال أسود','a charcoal dress shirt with black tailored trousers'],
['look-39','قميص فحمي + بنطال رمادي فاتح','a charcoal dress shirt with light-grey tailored trousers'],
['look-40','قميص فحمي + بنطال رمادي متوسط','a charcoal dress shirt with mid-grey tailored trousers'],
['look-41','قميص فحمي + بنطال كريمي','a charcoal dress shirt with cream tailored trousers'],
['look-42','قميص فحمي + بنطال بيج','a charcoal dress shirt with beige tailored trousers'],
['look-43','قميص فحمي + بنطال بني تبغي','a charcoal dress shirt with tobacco-brown tailored trousers'],
['look-44','قميص رمادي متوسط + بنطال كحلي','a mid-grey dress shirt with navy tailored trousers'],
['look-45','قميص رمادي متوسط + بنطال فحمي','a mid-grey dress shirt with charcoal tailored trousers'],
['look-46','قميص رمادي متوسط + بنطال أسود','a mid-grey dress shirt with black tailored trousers'],
['look-47','قميص رمادي متوسط + بنطال بني تبغي','a mid-grey dress shirt with tobacco-brown tailored trousers'],
['look-48','قميص رمادي فاتح + بنطال كحلي','a light-grey dress shirt with navy tailored trousers'],
['look-49','قميص رمادي فاتح + بنطال فحمي','a light-grey dress shirt with charcoal tailored trousers'],
['look-50','قميص أسود + بنطال أسود','a black dress shirt with black tailored trousers, matte finish'],
['look-51','قميص أسود + بنطال فحمي','a black dress shirt with charcoal tailored trousers'],
['look-52','قميص أسود + بنطال رمادي متوسط','a black dress shirt with mid-grey tailored trousers'],
['look-53','قميص أسود + بنطال رمادي فاتح','a black dress shirt with light-grey tailored trousers'],
['look-54','قميص أسود + بنطال كحلي','a black dress shirt with navy tailored trousers'],
['look-55','قميص أسود + بنطال كريمي','a black dress shirt with cream tailored trousers'],
['look-56','قميص أسود + بنطال بيج','a black dress shirt with beige tailored trousers'],
['look-57','قميص أسود + بنطال كاكي','a black dress shirt with khaki chinos'],
['look-58','قميص أسود + بنطال زيتي','a black dress shirt with olive chinos'],
['look-59','قميص بيج + بنطال بني تبغي','a beige dress shirt with tobacco-brown tailored trousers'],
['look-60','قميص بيج + بنطال كحلي','a beige dress shirt with navy tailored trousers'],
['look-61','قميص بيج + بنطال فحمي','a beige dress shirt with charcoal tailored trousers'],
['look-62','قميص بيج + بنطال كريمي','a beige dress shirt with cream tailored trousers'],
['look-63','قميص بيج + بنطال كاكي','a beige dress shirt with khaki chinos'],
['look-64','قميص بيج + بنطال زيتي','a beige dress shirt with olive chinos'],
['look-65','قميص بيج + بنطال رمادي فاتح','a beige dress shirt with light-grey tailored trousers'],
['look-66','قميص بيج + بنطال رمادي متوسط','a beige dress shirt with mid-grey tailored trousers'],
['look-67','قميص بيج + بنطال بني غامق','a beige dress shirt with dark-brown tailored trousers'],
['look-68','قميص كريمي + بنطال بني تبغي','a cream dress shirt with tobacco-brown tailored trousers'],
['look-69','قميص كريمي + بنطال كحلي','a cream dress shirt with navy tailored trousers'],
['look-70','قميص كريمي + بنطال فحمي','a cream dress shirt with charcoal tailored trousers'],
['look-71','قميص كريمي + بنطال بيج','a cream dress shirt with beige tailored trousers'],
['look-72','قميص كريمي + بنطال بني غامق','a cream dress shirt with dark-brown tailored trousers'],
['look-73','قميص كريمي + بنطال كاكي','a cream dress shirt with khaki chinos'],
['look-74','قميص بني تبغي + بنطال كريمي','a tobacco-brown dress shirt with cream tailored trousers'],
['look-75','قميص بني تبغي + بنطال بيج','a tobacco-brown dress shirt with beige tailored trousers'],
['look-76','قميص بني تبغي + بنطال كحلي','a tobacco-brown dress shirt with navy tailored trousers'],
['look-77','قميص بني تبغي + بنطال فحمي','a tobacco-brown dress shirt with charcoal tailored trousers'],
['look-78','قميص بني غامق + بنطال بيج','a dark-brown dress shirt with beige tailored trousers'],
['look-79','قميص بني غامق + بنطال كريمي','a dark-brown dress shirt with cream tailored trousers'],
['look-80','قميص زيتي + بنطال بني تبغي','an olive dress shirt with tobacco-brown tailored trousers'],
['look-81','قميص زيتي + بنطال كحلي','an olive dress shirt with navy tailored trousers'],
['look-82','قميص زيتي + بنطال كريمي','an olive dress shirt with cream tailored trousers'],
['look-83','قميص زيتي + بنطال بيج','an olive dress shirt with beige tailored trousers'],
['look-84','قميص زيتي + بنطال كاكي','an olive dress shirt with khaki chinos'],
['look-85','قميص زيتي + بنطال فحمي','an olive dress shirt with charcoal tailored trousers'],
['look-86','قميص أخضر مريمي + بنطال كحلي','a sage-green oxford shirt with navy tailored trousers'],
['look-87','قميص أخضر مريمي + بنطال فحمي','a sage-green oxford shirt with charcoal tailored trousers'],
['look-88','قميص أخضر مريمي + بنطال كريمي','a sage-green oxford shirt with cream tailored trousers'],
['look-89','قميص أخضر مريمي + بنطال بني تبغي','a sage-green oxford shirt with tobacco-brown tailored trousers'],
['look-90','قميص عنابي + بنطال كحلي','a burgundy dress shirt with navy tailored trousers'],
['look-91','قميص عنابي + بنطال فحمي','a burgundy dress shirt with charcoal tailored trousers'],
['look-92','قميص عنابي + بنطال أسود','a burgundy dress shirt with black tailored trousers'],
['look-93','قميص عنابي + بنطال رمادي متوسط','a burgundy dress shirt with mid-grey tailored trousers'],
['look-94','قميص عنابي + بنطال بني تبغي','a burgundy dress shirt with tobacco-brown tailored trousers'],
['look-95','قميص وردي فاتح + بنطال رمادي متوسط','a pale pink oxford shirt with mid-grey tailored trousers'],
['look-96','قميص وردي فاتح + بنطال فحمي','a pale pink oxford shirt with charcoal tailored trousers'],
['look-97','قميص وردي فاتح + بنطال بيج','a pale pink oxford shirt with beige chinos'],
['look-98','قميص وردي فاتح + بنطال كحلي','a pale pink oxford shirt with navy tailored trousers'],
['look-99','قميص وردي فاتح + بنطال كاكي','a pale pink oxford shirt with khaki chinos'],
['look-100','قميص بياقة صينية أبيض + بنطال كحلي','a white mandarin-collar shirt with navy tailored trousers'],
['look-101','قميص بياقة صينية بيج + بنطال كحلي','a beige mandarin-collar shirt with navy tailored trousers'],
['look-102','قميص بياقة صينية عنابي + بنطال كحلي','a burgundy mandarin-collar shirt with navy tailored trousers'],
['look-103','قميص بياقة دائرية رمادي + بنطال أسود','a grey band-collar shirt with black tailored trousers'],
['look-104','قميص كتان أبيض + بنطال بيج','a white linen shirt with beige trousers, summer pairing'],
['look-105','قميص كتان أبيض + بنطال كحلي','a white linen shirt with navy tailored trousers'],
['look-106','قميص كتان أزرق فاتح + بنطال بيج','a light-blue linen shirt with beige trousers'],
['look-107','قميص كتان أزرق فاتح + بنطال كحلي','a light-blue linen shirt with navy tailored trousers'],
['look-108','قميص كتان بيج + بنطال كحلي','a beige linen shirt with navy tailored trousers'],
['look-109','قميص كتان بيج + بنطال بني تبغي','a beige linen shirt with tobacco-brown tailored trousers'],
['look-110','قميص كتان كريمي + بنطال كحلي','a cream linen shirt with navy tailored trousers'],
['look-111','قميص كتان كحلي + بنطال بيج','a navy linen shirt with beige trousers'],
['look-112','قميص كتان كحلي + بنطال كريمي','a navy linen shirt with cream trousers'],
['look-113','قميص كتان رملي + بنطال كحلي','a sand linen shirt with navy tailored trousers'],
['look-114','قميص كتان رملي + بنطال زيتي','a sand linen shirt with olive chinos'],
['look-115','قميص كتان رملي + بنطال بيج','a sand linen shirt with beige trousers'],
['look-116','قميص كتان رملي + بنطال بني تبغي','a sand linen shirt with tobacco-brown tailored trousers'],
['look-117','قميص فحمي + بنطال بني غامق','a charcoal dress shirt with dark-brown tailored trousers'],
['look-118','قميص كحلي + بنطال بني غامق','a navy dress shirt with dark-brown tailored trousers'],
['look-119','قميص أزرق فاتح + بنطال بني غامق','a light-blue oxford shirt with dark-brown tailored trousers'],
['look-120','قميص بيج + بنطال بني فاتح','a beige dress shirt with light-brown tailored trousers'],
['look-beige-white','قميص بيج + بنطال أبيض','a beige linen-blend shirt with white tailored trousers, warm light palette, natural slub texture and matte white trouser drape'],
['look-steelblue-khaki','قميص أزرق فولاذي + بنطال كاكي','a steel-blue dress shirt with khaki cotton-twill trousers, cool formal-casual pairing with matte finish']
]).map((item) => ({ ...item, group: formalLookGroup(item.value) }));

const EXTRA_DEDUPED = [
  expandedClothing('ثياب وتراث سعودي', 'offwhite_thobe', 'ثوب أوف وايت', 'an off-white Saudi thobe in medium-light cotton poplin with slight tonal warmth, crisp collar structure, natural vertical drape, and soft compression creases at the elbows and seat'),
  expandedClothing('ثياب وتراث سعودي', 'skyblue_thobe', 'ثوب أزرق سماوي هادئ', 'a muted sky-blue Saudi thobe in matte woven cotton blend with realistic collar stiffness, soft body drape, restrained highlights, and natural sleeve folding'),
  expandedClothing('ثياب وتراث سعودي', 'stone_thobe', 'ثوب حجري فاتح', 'a light stone-grey Saudi thobe in breathable woven fabric with subtle texture, medium-soft drape, small cuff creases, and realistic body contact'),
  expandedClothing('ثياب وتراث سعودي', 'darkgreen_thobe', 'ثوب أخضر داكن', 'a dark muted green Saudi thobe in medium-weight matte fabric with deep but not crushed shadow detail, broad gravity folds, and natural tension around shoulders and elbows'),
  expandedClothing('ثياب وتراث سعودي', 'brown_winter_thobe', 'ثوب شتوي بني', 'a warm brown winter Saudi thobe in heavier brushed woven fabric with increased thickness, broader folds, slower drape, soft surface nap, and restrained low-gloss highlights'),
  expandedClothing('ثياب وتراث سعودي', 'grey_winter_thobe', 'ثوب شتوي رمادي', 'a medium-grey winter thobe in dense woven fabric with believable weight, thicker collar and cuff structure, broad seated folds, and subtle wool-like surface texture'),
  expandedClothing('ثياب وتراث سعودي', 'white_thobe_red_shemagh', 'ثوب أبيض + شماغ أحمر وعقال', 'a plain white Saudi thobe paired with a red-and-white shemagh and one realistic black agal; the thobe keeps crisp cotton-poplin structure while the shemagh shows woven thickness, gravity-driven asymmetry, crown contact, and natural shoulder folds'),
  expandedClothing('ثياب وتراث سعودي', 'white_thobe_white_ghutra', 'ثوب أبيض + غترة بيضاء وعقال', 'a white Saudi thobe paired with a white ghutra and one black agal; preserve subtle fabric separation between thobe and ghutra, natural translucency only at thin ghutra edges, and physically correct head-and-shoulder contact'),
  expandedClothing('ثياب وتراث سعودي', 'navy_thobe_red_shemagh', 'ثوب كحلي + شماغ أحمر وعقال', 'a dark navy Saudi thobe paired with a red-and-white shemagh and one black agal, with matte thobe fabric, realistic color contrast, asymmetric shemagh drape, and no ceremonial over-styling'),
  expandedClothing('كاجوال', 'lightblue_oxford_beige_chinos', 'قميص أكسفورد أزرق + تشينو بيج', 'a light-blue Oxford shirt with beige chinos; the shirt has visible basket-weave texture, collar and placket structure, small elbow and waist creases, while the chinos have matte twill texture and realistic knee and hip folding'),
  expandedClothing('كاجوال', 'beige_linen_shirt_offwhite_trousers', 'قميص كتان بيج + بنطال فاتح', 'a beige linen shirt with off-white trousers; the linen shows irregular slub texture, breathable soft wrinkling, slightly crushed folds at elbows and waist, while the trousers keep heavier structured drape'),
  expandedClothing('كاجوال', 'black_overshirt_grey_tshirt', 'أوفرشيرت أسود + تيشيرت رمادي', 'a black cotton-twill overshirt worn open over a grey crew-neck T-shirt, with distinct material behavior between structured overshirt panels and softer jersey underneath, plus realistic layered folds'),
  expandedClothing('كاجوال', 'denim_overshirt_white_tshirt', 'أوفرشيرت دنيم + تيشيرت أبيض', 'a mid-weight denim overshirt over a plain white T-shirt, with visible denim weave, seam bulk, elbow creasing, slightly firmer drape, and soft jersey tension underneath'),
  expandedClothing('كاجوال', 'charcoal_hoodie_joggers', 'هودي فحمي + جوغر', 'a charcoal cotton-fleece hoodie with matching or black joggers, showing thick ribbed cuffs, hood weight, rounded fleece folds, pocket sag, knee bunching, and realistic seated compression'),
  expandedClothing('كاجوال', 'navy_crewneck_jeans', 'سويت شيرت كحلي + جينز', 'a navy crew-neck sweatshirt with dark straight-fit jeans, with soft fleece-body folds, ribbed collar and cuffs, denim stiffness at knees and hips, and natural contrast between the two fabrics'),
  expandedClothing('كاجوال', 'olive_field_jacket_tshirt', 'جاكيت ميداني زيتي + تيشيرت', 'a lightweight olive field jacket over a plain T-shirt, with structured pocket flaps, zipper and seam tension, mild sleeve crumpling, matte synthetic-cotton response, and softer jersey underneath'),
  expandedClothing('كاجوال', 'black_bomber_tshirt', 'بومبر أسود + تيشيرت', 'a black lightweight bomber jacket over a plain T-shirt, with realistic rib-knit collar and cuffs, slight nylon sheen only on highlight-facing folds, zipper weight, and natural puffing around elbows and waist'),
  expandedClothing('كاجوال', 'sand_knit_sweater_dark_trousers', 'كنزة رملية + بنطال داكن', 'a sand-colored fine-knit sweater with dark trousers, showing visible knit structure, soft shoulder drape, subtle elbow stretching, gentle hem compression, and heavier trouser folds'),
  expandedClothing('كاجوال', 'navy_henley_chinos', 'هنلي كحلي + تشينو', 'a navy cotton Henley shirt with neutral chinos, with soft jersey texture, realistic button-placket structure, torso tension, elbow creases, and matte twill trousers'),
  expandedClothing('كاجوال', 'black_gym_tshirt_shorts', 'تيشيرت رياضي أسود + شورت', 'a black moisture-wicking gym T-shirt with athletic shorts, with thin technical-knit texture, slight sweat-darkening only where plausible, body-conforming tension without painted-on tightness, and lightweight shorts with movement folds'),
  expandedClothing('كاجوال', 'navy_gym_tshirt_joggers', 'تيشيرت رياضي كحلي + جوغر', 'a navy performance T-shirt with charcoal joggers, with breathable knit texture, mild post-workout dampness where plausible, natural shoulder and torso stretch, and soft jogger folds at hips and knees'),
  expandedClothing('كاجوال', 'grey_training_top_black_pants', 'بلوزة تدريب رمادية + بنطال أسود', 'a heather-grey athletic training top with black tapered pants, with subtle technical-fabric grain, realistic moisture response, seam tension around shoulders, and non-glossy stretch fabric at the legs'),
  expandedClothing('كاجوال', 'lightweight_track_jacket', 'جاكيت رياضي خفيف', 'a lightweight matte track jacket over a simple athletic shirt with tapered training pants, showing thin-shell folds, zipper behavior, cuff compression, and restrained synthetic highlights rather than plastic shine'),
  expandedClothing('كاجوال', 'navy_blazer_blue_shirt', 'بليزر كحلي + قميص أزرق فاتح', 'a navy single-breasted blazer over a light-blue shirt with neutral trousers, with realistic wool-blend grain, lapel roll, shoulder structure, elbow bends, shirt collar interaction, and natural jacket opening around the seated or standing torso'),
  expandedClothing('كاجوال', 'charcoal_blazer_white_tshirt', 'بليزر فحمي + تيشيرت أبيض', 'a charcoal blazer over a plain white T-shirt, combining structured jacket shoulders and lapels with softer jersey underneath, realistic sleeve creases, and no editorial-fashion stiffness'),
  expandedClothing('كاجوال', 'beige_overshirt_black_tshirt', 'أوفرشيرت بيج + تيشيرت أسود', 'a beige structured overshirt over a plain black T-shirt with dark trousers, with visible cotton-twill grain, pocket structure, layered hem behavior, realistic elbow folds, and matte color response'),
  expandedClothing('كاجوال', 'navy_polo_beige_chinos', 'بولو كحلي + تشينو بيج', 'a navy pique polo with beige chinos, showing true pique knit texture, collar shape, sleeve hem tension, small torso folds, matte twill trousers, and realistic seated or walking creasing'),
  expandedClothing('كاجوال', 'white_polo_olive_chinos', 'بولو أبيض + تشينو زيتي', 'a white pique polo with muted olive chinos, with visible knit texture, controlled brightness, realistic collar stiffness, natural waist folds, and heavier chino drape at the legs'),
  expandedClothing('كاجوال', 'dark_brown_blazer_cream_shirt', 'بليزر بني داكن + قميص كريمي', 'a dark-brown textured blazer with a cream shirt and dark trousers, with visible woven jacket grain, realistic lapel and pocket structure, shirt softness, and modest everyday formal wear rather than luxury-ad styling'),
  expandedClothing('كاجوال', 'quilted_vest_knit', 'فيست مبطن + كنزة', 'a lightweight quilted vest over a fine-knit sweater with dark trousers, showing realistic stitched baffles, restrained synthetic highlights, knit compression under the vest, and natural bulk around the torso'),
  expandedClothing('كاجوال', 'charcoal_wool_jacket', 'جاكيت صوفي فحمي', 'a charcoal wool-blend casual jacket over a plain shirt or knit top, with soft brushed texture, structured collar, heavier sleeve folds, realistic button or zipper pull, and no polished catalog finish'),
  expandedClothing('كاجوال', 'sand_light_jacket', 'جاكيت خفيف رملي', 'a sand-colored lightweight jacket over a dark T-shirt with neutral trousers, with matte woven shell, realistic zipper and pocket construction, natural elbow creasing, and weather-appropriate layering')
];

const CLOTHING_PROMPT_OVERRIDES = new Map([
  ['bisht_thobe', enrichClothingPrompt('a clean Saudi thobe with a lightweight formal bisht worn naturally over the shoulders; the bisht hangs with long gravity-driven folds, subtle edge trim, limited sheen, realistic sleeve openings, and no costume-like stiffness')],
  ['suit-navy-lightblue', enrichClothingPrompt('a navy two-piece suit with a light-blue dress shirt, with realistic wool-blend texture, proper lapel roll, shoulder structure, sleeve break, trouser crease and seat compression, and no glossy showroom fabric')],
  ['suit-charcoal-white', enrichClothingPrompt('a charcoal suit with a white dress shirt, preserving subtle wool weave, natural jacket drape, lapel shadow, shirt cuff interaction, trouser break, and realistic wrinkles from sitting or arm movement')],
  ['look-02', enrichClothingPrompt('a white Oxford shirt with charcoal trousers, with realistic cotton weave, slight translucency control in bright light, natural sleeve creases, trouser break and seat compression, and restrained formal-casual structure')]
]);

const FORMAL_SUIT_VALUES = new Set(FORMAL_SUITS.map((item) => item.value));
const FORMAL_LOOK_VALUES = new Set(FORMAL_LOOKS.map((item) => item.value));

const GARMENT_TAG_PROFILES = Object.freeze({
  thobe: Object.freeze(['buttoned-top', 'collared', 'long-garment']),
  thobeHeadwear: Object.freeze(['buttoned-top', 'collared', 'long-garment', 'headwear']),
  abaya: Object.freeze(['long-garment', 'no-collar']),
  headwear: Object.freeze(['headwear']),
  tshirt: Object.freeze(['tuckable-top', 'sleeved', 'short-sleeve', 'no-collar']),
  polo: Object.freeze(['buttoned-top', 'sleeved', 'short-sleeve', 'collared', 'tuckable-top']),
  softLongSleeve: Object.freeze(['sleeved', 'no-collar']),
  formalLook: Object.freeze(['buttoned-top', 'sleeved', 'collared', 'tuckable-top', 'tuckable-top-with-pants', 'waistband', 'pocketed']),
  formalSuit: Object.freeze(['layered-top', 'buttoned-top', 'sleeved', 'collared', 'tuckable-top-with-pants', 'waistband', 'pocketed']),
  layeredSleevedCollared: Object.freeze(['layered-top', 'sleeved', 'collared']),
  layeredCollared: Object.freeze(['layered-top', 'collared']),
  layeredNoCollar: Object.freeze(['layered-top', 'no-collar']),
  layeredBottom: Object.freeze(['layered-top', 'waistband', 'pocketed']),
  softTopBottom: Object.freeze(['sleeved', 'no-collar', 'waistband', 'pocketed']),
  tshirtShorts: Object.freeze(['tuckable-top', 'sleeved', 'short-sleeve', 'no-collar', 'waistband', 'pocketed']),
  tshirtPants: Object.freeze(['tuckable-top', 'sleeved', 'short-sleeve', 'no-collar', 'tuckable-top-with-pants', 'waistband', 'pocketed']),
  trainingTopPants: Object.freeze(['tuckable-top', 'sleeved', 'no-collar', 'tuckable-top-with-pants', 'waistband', 'pocketed']),
  overshirtNoBottom: Object.freeze(['layered-top', 'buttoned-top', 'sleeved', 'collared', 'tuckable-top']),
  overshirtBottom: Object.freeze(['layered-top', 'buttoned-top', 'sleeved', 'collared', 'tuckable-top', 'tuckable-top-with-pants', 'waistband', 'pocketed']),
  poloPants: Object.freeze(['buttoned-top', 'sleeved', 'short-sleeve', 'collared', 'tuckable-top', 'tuckable-top-with-pants', 'waistband', 'pocketed']),
  vestKnitBottom: Object.freeze(['layered-top', 'no-collar', 'waistband', 'pocketed']),
  bottom: Object.freeze(['waistband', 'pocketed']),
  pajama: Object.freeze(['sleeved', 'waistband']),
  nightThobe: Object.freeze(['long-garment', 'no-collar']),
  robe: Object.freeze(['sleeved', 'long-garment', 'no-collar'])
});

const garmentTagEntries = (values, tags) => values.map((value) => [value, tags]);

const GENERAL_GARMENT_TAGS_BY_VALUE = new Map([
  ...garmentTagEntries(['white_thobe','navy_thobe','charcoal_thobe','beige_thobe','olive_thobe','winter_thobe','bisht_thobe','offwhite_thobe','skyblue_thobe','stone_thobe','darkgreen_thobe','brown_winter_thobe','grey_winter_thobe'], GARMENT_TAG_PROFILES.thobe),
  ...garmentTagEntries(['white_thobe_red_shemagh','white_thobe_white_ghutra','navy_thobe_red_shemagh'], GARMENT_TAG_PROFILES.thobeHeadwear),
  ...garmentTagEntries(['black_abaya','embroidered_abaya','abaya_hijab'], GARMENT_TAG_PROFILES.abaya),
  ...garmentTagEntries(['red_shemagh_agal','white_ghutra_agal','red_shemagh_no_agal','white_ghutra_no_agal'], GARMENT_TAG_PROFILES.headwear),
  ...garmentTagEntries(['black_tshirt','white_tshirt','navy_tshirt','grey_tshirt'], GARMENT_TAG_PROFILES.tshirt),
  ...garmentTagEntries(['navy_polo','white_polo','charcoal_polo'], GARMENT_TAG_PROFILES.polo),
  ...garmentTagEntries(['hoodie','crewneck_sweatshirt'], GARMENT_TAG_PROFILES.softLongSleeve),
  ...garmentTagEntries(['denim_jacket','olive_field_jacket_tshirt','charcoal_blazer_white_tshirt','charcoal_wool_jacket'], GARMENT_TAG_PROFILES.layeredSleevedCollared),
  ...garmentTagEntries(['light_jacket'], GARMENT_TAG_PROFILES.layeredCollared),
  ...garmentTagEntries(['black_bomber_tshirt'], GARMENT_TAG_PROFILES.layeredNoCollar),
  ...garmentTagEntries(['lightweight_track_jacket','sand_light_jacket'], GARMENT_TAG_PROFILES.layeredBottom),
  ...garmentTagEntries(['charcoal_hoodie_joggers','navy_crewneck_jeans','sand_knit_sweater_dark_trousers'], GARMENT_TAG_PROFILES.softTopBottom),
  ...garmentTagEntries(['black_overshirt_grey_tshirt','denim_overshirt_white_tshirt'], GARMENT_TAG_PROFILES.overshirtNoBottom),
  ...garmentTagEntries(['black_gym_tshirt_shorts'], GARMENT_TAG_PROFILES.tshirtShorts),
  ...garmentTagEntries(['navy_gym_tshirt_joggers'], GARMENT_TAG_PROFILES.tshirtPants),
  ...garmentTagEntries(['grey_training_top_black_pants'], GARMENT_TAG_PROFILES.trainingTopPants),
  ...garmentTagEntries(['beige_overshirt_black_tshirt'], GARMENT_TAG_PROFILES.overshirtBottom),
  ...garmentTagEntries(['navy_polo_beige_chinos','white_polo_olive_chinos'], GARMENT_TAG_PROFILES.poloPants),
  ...garmentTagEntries(['quilted_vest_knit'], GARMENT_TAG_PROFILES.vestKnitBottom),
  ...garmentTagEntries(['lightblue_oxford_beige_chinos','beige_linen_shirt_offwhite_trousers','navy_henley_chinos'], GARMENT_TAG_PROFILES.formalLook),
  ...garmentTagEntries(['navy_blazer_blue_shirt','dark_brown_blazer_cream_shirt'], GARMENT_TAG_PROFILES.formalSuit)
]);

function garmentTagsForCatalogItem(item) {
  if (FORMAL_SUIT_VALUES.has(item.value)) return [...GARMENT_TAG_PROFILES.formalSuit];
  if (FORMAL_LOOK_VALUES.has(item.value)) return [...GARMENT_TAG_PROFILES.formalLook];
  const tags = GENERAL_GARMENT_TAGS_BY_VALUE.get(item.value);
  if (!tags?.length) throw new Error(`Missing garmentTags for CLOTHING_CATALOG item: ${item.value}`);
  return [...tags];
}

function garmentTagsForHomeItem(item) {
  if (item.group === 'تيشيرت') return [...GARMENT_TAG_PROFILES.tshirt];
  if (item.group === 'شورت' || item.group === 'بنطال بيت') return [...GARMENT_TAG_PROFILES.bottom];
  if (item.group === 'طقم تيشيرت + شورت') return [...GARMENT_TAG_PROFILES.tshirtShorts];
  if (item.group === 'بيجاما') return [...GARMENT_TAG_PROFILES.pajama];
  if (item.group === 'ثوب نوم') return [...GARMENT_TAG_PROFILES.nightThobe];
  if (item.group === 'روب') return [...GARMENT_TAG_PROFILES.robe];
  throw new Error(`Missing garmentTags for HOME_CLOTHING item: ${item.value}`);
}

const normalizeClothingCatalogItem = (item) => ({
  ...item,
  group: FORMAL_SUIT_VALUES.has(item.value) ? 'بدلات رسمية كاملة' : item.group,
  prompt: CLOTHING_PROMPT_OVERRIDES.get(item.value) || item.prompt,
  garmentTags: garmentTagsForCatalogItem(item)
});

export const CLOTHING_CATALOG = [
  ...CLOTHING_OPTIONS,
  ...FORMAL_SUITS,
  ...FORMAL_LOOKS,
  ...EXTRA_DEDUPED
].map(normalizeClothingCatalogItem);

export const BEDROOM_ANCHOR = Object.freeze({
  room: 'A single fixed master bedroom, roughly 4m x 5m, with cream-painted walls, a large window with beige curtains on the RIGHT wall, a wooden door on the LEFT wall, and warm wooden flooring. This layout is locked and identical in every image.',
  bed: 'A queen-size bed with a dark wooden frame and a beige tufted headboard, positioned against the BACK wall, centered, with two matching nightstands total, one on each side of the bed, one on the left and one on the right. The bed is always in the same position.',
  wardrobe: 'A tall wooden wardrobe with three doors, positioned on the LEFT wall near the door, always in the same position.',
  mirror: 'A full-length framed mirror attached to the wardrobe door, always visible when the camera faces the wardrobe side.',
  armchair: 'A single upholstered armchair in the far RIGHT corner near the window, with a folded throw blanket on its backrest. It is a chair, not a sofa — no more than one adult can sit in it.',
  nightstand: 'Two matching wooden nightstands on either side of the bed, each with a small lamp and one or two personal items.',
  window: 'A large window on the RIGHT wall with beige curtains, always at the same position.',
  rug: 'A rectangular rug (beige or grey) partially under the bed, extending toward the center of the room.',
  fixed_layout_rule: 'IMPORTANT: This is a locked room layout. In every image, regardless of the pose, angle, or lighting, the bed is in the same position against the back wall, the wardrobe is on the left wall, the window is on the right wall, the armchair is in the far right corner, the mirror is on the wardrobe door, and the rug is partially under the bed. Do not move, add, remove, or duplicate any of these pieces. Do not change the wall colors, the flooring, or the curtain color. Do not add any new furniture.'
});

export const BEDROOM_CLUTTER_LEVELS = Object.freeze({
  clean: 'A neatly made bed with straight sheets, minimal items, no visible clutter.',
  minimal: 'Slightly rumpled bedding, one folded towel on the armchair, a single mug on the nightstand.',
  light: 'Slightly rumpled bedding, a charging cable on the nightstand, one mug, one open book, a folded throw on the armchair.',
  moderate: 'Rumpled bedding, scattered pillows, a couple of mugs, an open book, folded clothes on the armchair, a phone charger on the floor, headphones on the nightstand.',
  heavy: 'Heavily rumpled bedding, scattered pillows and blankets on the floor, clothes draped over the armchair, two mugs, plates, an open book, tangled chargers, headphones, a backpack on the floor, and visible personal items everywhere.'
});

export const HOME_CLOTHING = [
{ group:'تيشيرت', value:'tee-white', label:'تيشيرت غرفة نوم أبيض', prompt:'a plain white cotton crew-neck t-shirt with visible jersey knit texture, natural body-conforming tension, and soft rounded folds' },
{ group:'تيشيرت', value:'tee-black', label:'تيشيرت غرفة نوم أسود', prompt:'a plain black cotton crew-neck t-shirt with matte jersey texture, deep shadow absorption, and natural folds' },
{ group:'تيشيرت', value:'tee-navy', label:'تيشيرت غرفة نوم كحلي', prompt:'a plain navy cotton t-shirt with matte finish and natural body folds' },
{ group:'تيشيرت', value:'tee-grey', label:'تيشيرت غرفة نوم رمادي', prompt:'a plain grey cotton t-shirt with heather knit variation and soft folds' },
{ group:'تيشيرت', value:'tee-charcoal', label:'تيشيرت غرفة نوم فحمي', prompt:'a plain charcoal cotton t-shirt with matte knit texture and natural drape' },
{ group:'تيشيرت', value:'tee-olive', label:'تيشيرت غرفة نوم زيتي', prompt:'a plain olive cotton t-shirt with muted earth tone and natural folds' },
{ group:'تيشيرت', value:'tee-beige', label:'تيشيرت غرفة نوم بيج', prompt:'a plain beige cotton t-shirt with warm neutral tone and natural knit texture' },
{ group:'تيشيرت', value:'tee-cream', label:'تيشيرت غرفة نوم كريمي', prompt:'a plain cream cotton t-shirt with warm light tone and soft folds' },
{ group:'تيشيرت', value:'tee-burgundy', label:'تيشيرت غرفة نوم عنابي', prompt:'a plain burgundy cotton t-shirt with deep warm tone and matte texture' },
{ group:'تيشيرت', value:'tee-lightblue', label:'تيشيرت غرفة نوم أزرق فاتح', prompt:'a plain light blue cotton t-shirt with cool tone and natural knit texture' },
{ group:'تيشيرت', value:'tee-skyblue', label:'تيشيرت غرفة نوم سماوي', prompt:'a plain sky blue cotton t-shirt with fresh cool tone' },
{ group:'تيشيرت', value:'tee-sage', label:'تيشيرت غرفة نوم أخضر مريمي', prompt:'a plain sage green cotton t-shirt with muted tone' },
{ group:'تيشيرت', value:'tee-dustypink', label:'تيشيرت غرفة نوم وردي ترابي', prompt:'a plain dusty pink cotton t-shirt with muted warm tone' },
{ group:'تيشيرت', value:'tee-mustard', label:'تيشيرت غرفة نوم خردلي', prompt:'a plain mustard yellow cotton t-shirt with warm mid-tone' },
{ group:'تيشيرت', value:'tee-brown', label:'تيشيرت غرفة نوم بني', prompt:'a plain brown cotton t-shirt with warm earth tone' },
{ group:'شورت', value:'shorts-black', label:'شورت أسود', prompt:'plain black cotton lounge shorts with visible woven or jersey texture, natural waistband compression, and soft fabric draping over the thighs' },
{ group:'شورت', value:'shorts-navy', label:'شورت كحلي', prompt:'plain navy cotton lounge shorts with matte finish' },
{ group:'شورت', value:'shorts-grey', label:'شورت رمادي', prompt:'plain grey cotton lounge shorts with heather texture' },
{ group:'شورت', value:'shorts-charcoal', label:'شورت فحمي', prompt:'plain charcoal cotton lounge shorts with matte texture' },
{ group:'شورت', value:'shorts-white', label:'شورت أبيض', prompt:'plain white cotton lounge shorts with bright clean tone' },
{ group:'شورت', value:'shorts-beige', label:'شورت بيج', prompt:'plain beige cotton lounge shorts with warm neutral tone' },
{ group:'شورت', value:'shorts-olive', label:'شورت زيتي', prompt:'plain olive cotton lounge shorts with muted earth tone' },
{ group:'شورت', value:'shorts-burgundy', label:'شورت عنابي', prompt:'plain burgundy cotton lounge shorts with deep warm tone' },
{ group:'شورت', value:'shorts-lightblue', label:'شورت أزرق فاتح', prompt:'plain light blue cotton lounge shorts with cool tone' },
{ group:'شورت', value:'shorts-sage', label:'شورت أخضر مريمي', prompt:'plain sage green cotton lounge shorts with muted tone' },
{ group:'شورت', value:'shorts-brown', label:'شورت بني', prompt:'plain brown cotton lounge shorts with warm earth tone' },
{ group:'شورت', value:'shorts-stripe', label:'شورت مخطط', prompt:'yarn-dyed striped cotton lounge shorts in navy and white with visible weave pattern' },
{ group:'طقم تيشيرت + شورت', value:'set-white-black', label:'تيشيرت أبيض + شورت أسود', prompt:'a plain white cotton t-shirt paired with black cotton lounge shorts, natural contrast and comfortable fit' },
{ group:'طقم تيشيرت + شورت', value:'set-navy-white', label:'تيشيرت كحلي + شورت أبيض', prompt:'a plain navy t-shirt with white lounge shorts, cool-tone pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-grey-navy', label:'تيشيرت رمادي + شورت كحلي', prompt:'a grey t-shirt with navy lounge shorts, neutral cool pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-black-grey', label:'تيشيرت أسود + شورت رمادي', prompt:'a black t-shirt with grey lounge shorts, dark neutral pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-olive-beige', label:'تيشيرت زيتي + شورت بيج', prompt:'an olive t-shirt with beige lounge shorts, earth-tone pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-burgundy-black', label:'تيشيرت عنابي + شورت أسود', prompt:'a burgundy t-shirt with black lounge shorts, warm-dark pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-lightblue-grey', label:'تيشيرت أزرق فاتح + شورت رمادي', prompt:'a light blue t-shirt with grey lounge shorts, cool neutral pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-cream-brown', label:'تيشيرت كريمي + شورت بني', prompt:'a cream t-shirt with brown lounge shorts, warm earth pairing' },
{ group:'طقم تيشيرت + شورت', value:'set-charcoal-beige', label:'تيشيرت فحمي + شورت بيج', prompt:'a charcoal t-shirt with beige lounge shorts, dark-warm contrast' },
{ group:'طقم تيشيرت + شورت', value:'set-sage-cream', label:'تيشيرت أخضر مريمي + شورت كريمي', prompt:'a sage t-shirt with cream lounge shorts, muted natural pairing' },
{ group:'بيجاما', value:'pj-navy', label:'بيجاما كحلية', prompt:'a navy cotton pajama set with long-sleeve shirt and matching long pants, visible weave, natural waist compression, and soft wear creases' },
{ group:'بيجاما', value:'pj-grey', label:'بيجاما رمادية', prompt:'a grey cotton pajama set with matte finish and soft folds' },
{ group:'بيجاما', value:'pj-black', label:'بيجاما سوداء', prompt:'a black cotton pajama set with matte deep tone and natural wear creases' },
{ group:'بيجاما', value:'pj-white', label:'بيجاما بيضاء', prompt:'a white cotton pajama set with visible weave and light comfort folds' },
{ group:'بيجاما', value:'pj-striped-blue', label:'بيجاما مخططة أزرق', prompt:'a blue-and-white striped cotton pajama set with visible yarn-dyed pattern and natural creases' },
{ group:'بيجاما', value:'pj-striped-grey', label:'بيجاما مخططة رمادي', prompt:'a grey-and-white striped cotton pajama set with visible pattern' },
{ group:'بيجاما', value:'pj-burgundy', label:'بيجاما عنابية', prompt:'a burgundy cotton pajama set with deep warm tone and matte finish' },
{ group:'بيجاما', value:'pj-silk-charcoal', label:'بيجاما حريرية فحمية', prompt:'a charcoal silk pajama set with subtle sheen on highlight-facing folds and soft drape' },
{ group:'ثوب نوم', value:'nightthobe-white', label:'ثوب نوم أبيض', prompt:'a white cotton night thobe with visible weave, soft body drape, and natural creases from sleep' },
{ group:'ثوب نوم', value:'nightthobe-grey', label:'ثوب نوم رمادي', prompt:'a grey cotton night thobe with natural drape' },
{ group:'ثوب نوم', value:'nightthobe-navy', label:'ثوب نوم كحلي', prompt:'a navy cotton night thobe with matte texture and comfort creases' },
{ group:'ثوب نوم', value:'nightthobe-beige', label:'ثوب نوم بيج', prompt:'a beige cotton night thobe with warm neutral tone' },
{ group:'روب', value:'robe-navy', label:'روب حمام كحلي', prompt:'a navy bathrobe with visible terry texture, soft belt at the waist, and natural drape' },
{ group:'روب', value:'robe-cream', label:'روب حمام كريمي', prompt:'a cream bathrobe with soft terry texture and visible belt' },
{ group:'روب', value:'robe-grey', label:'روب حمام رمادي', prompt:'a grey bathrobe with waffle texture and natural drape' },
{ group:'روب', value:'robe-white', label:'روب حمام أبيض', prompt:'a white bathrobe with cotton terry texture, clean tone, and natural drape' },
{ group:'بنطال بيت', value:'lounge-navy', label:'بنطال بيت كحلي', prompt:'a navy cotton lounge pants with soft jersey texture, ribbed ankle cuffs, and natural knee bunching' },
{ group:'بنطال بيت', value:'lounge-grey', label:'بنطال بيت رمادي', prompt:'grey cotton lounge pants with heather texture and natural folds' },
{ group:'بنطال بيت', value:'lounge-black', label:'بنطال بيت أسود', prompt:'black cotton lounge pants with matte finish and natural folds' },
{ group:'بنطال بيت', value:'lounge-charcoal', label:'بنطال بيت فحمي', prompt:'charcoal cotton joggers with visible texture and ribbed cuffs' },
{ group:'بنطال بيت', value:'lounge-beige', label:'بنطال بيت بيج', prompt:'beige cotton lounge pants with warm neutral tone' }
].map((item) => ({ ...item, garmentTags: garmentTagsForHomeItem(item) }));

export const BEDROOM_POSES = [
{ group:'استلقاء على السرير', value:'bed-lying-back', label:'مستلقٍ على ظهره على السرير', prompt:'lying flat on his back on the bed, head on the pillow, arm holding the phone above the face, mattress compression visible under shoulders and hips', cameraHint:'front camera held directly above the face, lens pointing downward, arm extended' },
{ group:'استلقاء على السرير', value:'bed-lying-side', label:'مستلقٍ على جانبه على السرير', prompt:'lying on his side on the bed, one arm bent under the pillow, natural body curve following the mattress, visible bedding wrinkles', cameraHint:'front camera held beside the face at mattress level, lens roughly parallel to the mattress, one arm extended forward, slight roll' },
{ group:'استلقاء على السرير', value:'bed-lying-stomach', label:'مستلقٍ على بطنه', prompt:'lying on his stomach on the bed, elbows propped, chest slightly lifted, natural lower-back curve, feet up behind', cameraHint:'front camera held slightly above the pillow, lens pointing downward and back at the face, elbows propped' },
{ group:'استلقاء على السرير', value:'bed-reclining-headboard', label:'مستند على رأس السرير', prompt:'reclining against the headboard, torso at 45 degrees, pillow compressed behind the back, legs extended forward', cameraHint:'front camera held at chest height while reclining, slight upward pitch from below the chin, headboard visible behind' },
{ group:'استلقاء على السرير', value:'bed-propped-pillows', label:'مستند على عدة وسائد', prompt:'propped up on two or three pillows against the headboard, natural torso angle, shoulders relaxed', cameraHint:'front camera held at chest height against the pillows, subject looking slightly downward toward the lens' },
{ group:'استلقاء على السرير', value:'bed-lying-partial', label:'مستلقٍ نصف استلقاء', prompt:'half-lying on the bed with one leg bent and foot on the mattress, upper body slightly raised on elbows', cameraHint:'front camera held at chest height while half-lying, slight downward pitch' },
{ group:'استلقاء على السرير', value:'bed-lying-diagonal', label:'مستلقٍ بشكل مائل', prompt:'lying diagonally across the bed, one arm over the edge, natural weight distribution', cameraHint:'front camera held above the shoulder while lying diagonally, downward pitch' },
{ group:'استلقاء على السرير', value:'bed-lying-reading', label:'مستلقٍ يقرأ كتابًا', prompt:'lying on the bed holding an open book in one hand, phone in the other for the selfie, natural relaxation', cameraHint:'front camera held slightly above the face while lying on the back, phone-bearing arm extended within reach and the book held in the free hand' },
{ group:'استلقاء على السرير', value:'bed-lying-back-knees-bent', label:'مستلقٍ على الظهر والركبتان مثنيتان', prompt:'lying on his back with both knees comfortably bent and feet resting on the mattress, head supported by a pillow and phone held within arm reach', cameraHint:'front camera held directly above the face while lying on the back, lens pointing downward, bent knees remaining lower in the frame' },
{ group:'جلوس على السرير', value:'bed-sitting-cross', label:'جالس مربع على السرير', prompt:'sitting cross-legged on the bed with visible mattress compression, phone held at arm length', cameraHint:'front camera at eye level while sitting cross-legged' },
{ group:'جلوس على السرير', value:'bed-sitting-edge', label:'جالس على حافة السرير', prompt:'seated on the edge of the bed, feet on the floor, slight forward lean, natural weight on hips', cameraHint:'front camera at eye level while seated on the bed edge' },
{ group:'جلوس على السرير', value:'bed-sitting-back-wall', label:'جالس مستند على الحائط', prompt:'sitting on the bed with back supported against the wall, one knee raised, phone held naturally', cameraHint:'front camera at eye level against the wall' },
{ group:'جلوس على السرير', value:'bed-sitting-legs-extended', label:'جالس ومدد ساقيه', prompt:'seated on the bed with legs extended forward, back slightly reclined, phone at arm length', cameraHint:'front camera at eye level with legs extended forward' },
{ group:'جلوس على السرير', value:'bed-sitting-hugging-pillow', label:'جالس يحتضن وسادة', prompt:'sitting on the bed hugging a pillow against the chest, natural relaxed posture', cameraHint:'front camera at eye level, pillow visible in the frame lower area' },
{ group:'جلوس على السرير', value:'bed-sitting-sideways', label:'جالس جانبيًا على السرير', prompt:'sitting sideways on the bed edge with both feet grounded, torso mildly rotated toward the phone and visible mattress compression under the hips', cameraHint:'front camera at eye level while seated sideways on the bed edge' },
{ group:'جلوس على الكرسي المفرد', value:'armchair-sit-lean-back', label:'متكئ على الكرسي المفرد', prompt:'seated in the bedroom armchair with back against the backrest, legs relaxed, natural cushion compression', cameraHint:'front camera at eye level while leaning back in the armchair' },
{ group:'جلوس على الكرسي المفرد', value:'armchair-sit-corner', label:'في زاوية الكرسي المفرد', prompt:'seated in the bedroom armchair with elbow resting on the armrest, natural asymmetric posture', cameraHint:'front camera at eye level in the armchair corner' },
{ group:'جلوس على الكرسي المفرد', value:'armchair-sit-one-knee', label:'على الكرسي المفرد بركبة مرفوعة', prompt:'seated in the bedroom armchair with one knee raised, foot planted, casual relaxed posture', cameraHint:'front camera at eye level with one knee raised' },
{ group:'جلوس على الكرسي المفرد', value:'armchair-sit-crossed', label:'جالس مربع على الكرسي المفرد', prompt:'sitting cross-legged in the bedroom armchair, natural weight distribution', cameraHint:'front camera at eye level while sitting cross-legged in the armchair' },
{ group:'جلوس على الكرسي المفرد', value:'armchair-sit-feet-floor', label:'جالس على الكرسي والقدمان على الأرض', prompt:'seated fully inside the bedroom armchair with both feet planted on the floor, pelvis supported by the cushion and phone held within comfortable arm reach', cameraHint:'front camera at eye level while seated fully in the armchair with both feet on the floor' },
{ group:'وقوف', value:'bedroom-stand-relaxed', label:'واقف باسترخاء', prompt:'standing naturally in the bedroom with relaxed weight distribution, mild shoulder asymmetry', cameraHint:'front camera at eye level, natural selfie angle' },
{ group:'وقوف', value:'bedroom-stand-one-hand', label:'واقف ويده الحرة مرتاحة', prompt:'standing with one hand resting naturally near the hip or pocket', cameraHint:'front camera at eye level' },
{ group:'وقوف', value:'bedroom-stand-lean-wardrobe', label:'متكئ على الخزانة', prompt:'leaning lightly against the wardrobe with visible shoulder contact and natural weight transfer', cameraHint:'front camera at eye level, wardrobe visible behind' },
{ group:'وقوف', value:'bedroom-stand-lean-wall', label:'متكئ على الحائط', prompt:'leaning lightly against the bedroom wall with visible contact physics', cameraHint:'front camera at eye level, wall visible behind' },
{ group:'وقوف', value:'bedroom-stand-near-bed', label:'واقف بجانب السرير', prompt:'standing near the edge of the bed, phone held at arm length', cameraHint:'front camera at eye level, bed visible behind' },
{ group:'وقوف', value:'bedroom-stand-window', label:'واقف عند النافذة', prompt:'standing near the bedroom window with natural daylight from the side', cameraHint:'front camera at eye level, window light from one side' },
{ group:'ماسك لابتوب', value:'bedroom-laptop-bed', label:'لابتوب على السرير', prompt:'seated on the bed with a laptop resting on the bed in front, phone held for the selfie, natural relaxed posture', cameraHint:'front camera held at chest height while seated on the bed, laptop visible in the lower frame' },
{ group:'ماسك لابتوب', value:'bedroom-laptop-armchair', label:'لابتوب على الحضن في الكرسي المفرد', prompt:'seated in the bedroom armchair with a laptop on the lap, phone held in the other hand', cameraHint:'front camera at chest height, laptop on lap visible in the lower frame' },
{ group:'ماسك شيء', value:'bedroom-cup-bed', label:'ماسك كوب قهوة على السرير', prompt:'seated on the bed holding a small cup of coffee in one hand and the phone in the other, natural relaxed posture', cameraHint:'front camera at eye level while seated on the bed, cup visible in one hand' },
{ group:'ماسك شيء', value:'bedroom-tea-armchair', label:'ماسك كوب شاي على الكرسي المفرد', prompt:'seated in the bedroom armchair holding a small cup of tea, phone held in the other hand', cameraHint:'front camera at eye level in the armchair, cup visible' },
{ group:'ماسك شيء', value:'bedroom-book-bed', label:'ماسك كتابًا على السرير', prompt:'seated on the bed holding an open book in one hand, phone in the other', cameraHint:'front camera at eye level while seated on the bed, book visible' },
{ group:'ماسك شيء', value:'bedroom-phone-only', label:'ماسك الهاتف فقط', prompt:'holding only the phone with the other hand resting naturally on the thigh or side', cameraHint:'front camera at eye level, free hand resting naturally' },
{ group:'أرضية', value:'bedroom-floor-cross', label:'جالس مربع على الأرض', prompt:'sitting cross-legged on the bedroom rug with natural hip and knee placement', cameraHint:'front camera at chest height while seated cross-legged on the floor' },
{ group:'أرضية', value:'bedroom-floor-back-wall', label:'جالس مسند على الجدار', prompt:'seated on the bedroom floor with back supported against the wall, one leg bent and one straight', cameraHint:'front camera at chest height against the wall' },
{ group:'أرضية', value:'bedroom-floor-knee-up', label:'على الأرض بركبة مرفوعة', prompt:'seated on the bedroom floor with one knee raised and the arm resting on it', cameraHint:'front camera at chest height while seated on the floor' },
{ group:'تفاعل مع الغرفة', value:'bedroom-curtain-touch', label:'واقف يلمس طرف الستارة', prompt:'standing beside the fixed right-side window while lightly holding the edge of the beige curtain with the free hand, without moving the curtain rail or changing the room layout', cameraHint:'front camera at eye level beside the window, curtain and side light visible without changing the locked room layout' },
{ group:'تفاعل مع الغرفة', value:'bedroom-nightstand-reach', label:'يمد يده نحو الكومدينو', prompt:'seated at the bed edge while the free hand reaches naturally toward the adjacent fixed nightstand, keeping body weight supported by the mattress and the phone-bearing arm independent', cameraHint:'front camera at eye level while seated on the bed edge, adjacent nightstand visible in the lower side of frame' },
{ group:'مرآة', value:'bedroom-mirror-stand-relaxed', label:'أمام المرآة واقف', prompt:'standing naturally in front of the bedroom mirror, phone visible in reflection', cameraHint:'mirror-view camera at eye level, phone visible in reflection' },
{ group:'مرآة', value:'bedroom-mirror-adjust', label:'أمام المرآة يعدل ملابسه', prompt:'adjusting clothing in front of the bedroom mirror, phone in the other hand', cameraHint:'mirror-view camera at eye level, phone visible in reflection' },
{ group:'مرآة', value:'bedroom-mirror-seated', label:'أمام المرآة جالس', prompt:'seated in front of the bedroom mirror on the bed edge, phone visible in reflection', cameraHint:'mirror-view camera at eye level while seated, phone visible in reflection' }
];

export const SELFIE_POSES = simple([
['standing_relaxed','واقف باسترخاء','standing naturally with relaxed weight distribution, mild shoulder asymmetry, and no rigid portrait pose'],
['standing_one_hand','واقف واليد الحرة مرتاحة','standing naturally while the free hand rests casually near the thigh, pocket area, or torso without deliberate posing'],
['walking_slow','يمشي ببطء','walking slowly while taking the selfie, with subtle gait asymmetry and mild motion consistency appropriate to the shutter'],
['holding_basket','يمسك سلة تسوق','holding a supermarket shopping basket naturally in the free hand with correct grip, wrist angle, arm load, and gravity while keeping the phone-bearing arm independent'],
['seated_sofa','جالس على كنبة / مجلس','seated comfortably with realistic pelvis support, cushion compression, mild torso rotation, and anatomically coherent thighs and knees'],
['seated_chair','جالس على كرسي','seated naturally on a chair with correct hip support, back contact where applicable, feet placement, and relaxed torso posture'],
['lean_wall','ميل خفيف على جدار','leaning lightly against a wall with visible contact physics, subtle shoulder tilt, and realistic body weight transfer'],
['lean_counter','ميل خفيف على طاولة / كاونتر','leaning lightly against a counter or table with correct forearm or hip contact and believable body support'],
['driver_seat','جالس في مقعد السائق','seated naturally in the driver seat of a stationary vehicle, with correct seat compression, steering-wheel relationship, and cabin geometry'],
['passenger_seat','جالس في مقعد الراكب','seated naturally in the front passenger seat of a stationary vehicle with correct cabin orientation and seat contact'],
['door_open_car','واقف بجانب باب سيارة مفتوح','standing beside an open vehicle door while personally holding the phone, with correct door clearance, body-car contact spacing, and selfie reach'],
['coffee_hand','يمسك كوب قهوة باليد الحرة','holding a small coffee cup naturally in the free hand with correct finger contact, wrist angle, and gravity'],
['adjust_clothing','يعدّل الملابس باليد الحرة','gently adjusting a small section of clothing with the free hand, creating realistic fabric tension and contact folds'],
['hand_on_head','اليد الحرة على الرأس','placing the free hand naturally on the head with anatomically correct elbow elevation, wrist orientation, and hair or headwear contact'],
['one_hand_pocket','اليد الحرة في الجيب','placing the free hand casually in a pocket with realistic elbow angle, cloth tension, and pocket deformation'],
['close_relaxed','وقفة قريبة وعفوية','a close relaxed selfie pose with natural neck, shoulder, and upper-torso asymmetry and no influencer-style posing']
]);

export const SELFIE_ANGLES = simple([
['eye_centered','مستوى العين — أمامي','front camera at approximately eye level, yaw 0°, pitch 0°, with a tiny natural handheld roll'],
['eye_three_quarter_left','ثلاثة أرباع من اليسار','front camera slightly lateral for a mild three-quarter selfie from the left side, preserving realistic arm reach and perspective asymmetry'],
['eye_three_quarter_right','ثلاثة أرباع من اليمين','front camera slightly lateral for a mild three-quarter selfie from the right side, preserving realistic arm reach and perspective asymmetry'],
['slightly_high_center','أعلى من العين قليلًا — أمامي','front camera only slightly above eye level with a gentle downward pitch, not overhead, with physically plausible arm reach'],
['slightly_high_three_quarter','أعلى قليلًا — ثلاثة أرباع','front camera slightly above eye level and mildly lateral, producing a realistic elevated three-quarter selfie without giant-head distortion'],
['slightly_low_center','أخفض قليلًا — أمامي','front camera slightly below eye level with a gentle upward pitch and realistic lower-angle smartphone perspective'],
['low_offcenter','زاوية منخفضة خارج المركز','front camera modestly below eye level and off-center, with plausible wrist position, shoulder displacement, and no extreme distortion'],
['high_offcenter','زاوية مرتفعة خارج المركز','front camera modestly above eye level and off-center, with slight downward pitch, diagonal background depth, and real arm-length geometry'],
['close_face','قريب — وجه وكتفان','close arm-length front-camera framing focused on head and shoulders with realistic wide-angle facial perspective and no telephoto compression'],
['chest_up','من الصدر للأعلى','front-camera chest-up framing at realistic arm distance with broad smartphone depth of field and natural shoulder perspective'],
['waist_up','حتى الخصر إن أمكن','front-camera framing extending toward the waist only as far as natural arm reach allows; do not move the camera unrealistically far away'],
['seated_high_three_quarter','جالس — مرتفعة ثلاثة أرباع','slightly elevated three-quarter front-camera angle while seated, revealing some torso, seating contact, and nearby environment without overhead geometry'],
['driver_eye_level','داخل السيارة — مستوى العين','driver-held front-camera selfie at eye level inside a stationary vehicle with correct left/right cabin geometry and steering-wheel perspective'],
['driver_slight_high','داخل السيارة — أعلى قليلًا','driver-held front-camera selfie slightly above eye level with gentle downward pitch and physically plausible reach inside the cabin'],
['driver_low','داخل السيارة — منخفضة قليلًا','driver-held front-camera selfie slightly below eye level with mild upward pitch, preserving dashboard and steering-wheel geometry'],
['doorway_three_quarter','بجانب السيارة — ثلاثة أرباع','subject-held front-camera three-quarter angle beside a vehicle, keeping the open or closed door geometry and arm reach physically coherent']
]);

export const LIGHTING_PROFILES = grouped([
['نهاري','day_direct_sun','شمس نهارية مباشرة','direct daytime sunlight from the actual sun direction, hard-to-moderate cast shadows, realistic sky fill, physically consistent highlights, and no exposure setting creating new light'],
['نهاري','day_open_shade','ظل مفتوح نهاري','open shade lit primarily by skylight and reflected environmental light, with soft directional modeling, lower contrast than direct sun, and no invisible fill light'],
['نهاري','day_overcast','سماء غائمة','overcast daylight from a broad sky source, very soft shadows, restrained specular contrast, and physically plausible ambient directionality'],
['نهاري','day_window','ضوء نافذة نهاري','daylight entering through a real window or opening, stronger near the opening and naturally falling off into the room, with plausible wall and floor bounce'],
['نهاري','golden_hour','الساعة الذهبية','low-angle warm sunlight near golden hour with long coherent shadows, warm direct light, cooler sky fill, and realistic atmospheric depth'],
['نهاري','blue_sky_noon','ظهر مشمس قوي','strong high-elevation midday sun with short hard shadows, bright sky fill, realistic heat contrast, and restrained smartphone highlight clipping'],
['نهاري','car_daylight','داخل سيارة نهارًا','daylight entering a stationary car through real glazing, directional window light, dashboard and seat bounce, strong exterior/interior dynamic-range difference, and no artificial cabin key light'],
['تسوق','supermarket_fluorescent','سوبرماركت – فلورسنت','broad ceiling fluorescent lighting typical of Saudi supermarkets, with mild color cast, shelf reflections, and even illumination'],
['تسوق','retail_ceiling_led','متجر – LED سقفي','uniform ceiling LED lighting typical of retail stores, with mild falloff and shelf reflections'],
['تسوق','mixed_retail','متجر – مختلط','mixed retail lighting: ceiling fluorescent plus cooler refrigerated cabinet glow plus warm accent near the entrance'],
['ليلي خارجي','night_led_street','إنارة شارع LED','night scene illuminated only by physically plausible LED street fixtures, localized pools of light, realistic falloff with distance, coherent cast shadows, and dark zones between fixtures'],
['ليلي خارجي','night_parking_led','إنارة موقف سيارات LED','outdoor parking at night lit by practical pole or canopy LEDs with localized pools, inverse-distance falloff, asphalt reflections, and realistic shadow noise'],
['ليلي خارجي','night_storefront','ضوء واجهات محلات','night scene lit by real storefront interiors, signs, and nearby street fixtures, with colored spill only where geometry permits and naturally darker distant areas'],
['ليلي خارجي','night_gas_station','إضاءة محطة وقود','night scene under a real fuel-station canopy with bright overhead practical fixtures, sharp local falloff beyond the canopy, vehicle reflections, and darker surroundings'],
['ليلي خارجي','night_corniche','كورنيش ليلي','night waterfront illumination from real promenade poles and nearby buildings, localized reflections on paving or water, humidity haze, and physically plausible distance falloff'],
['ليلي خارجي','night_desert_vehicle','صحراء ليلية + إنارة سيارة','night desert scene illuminated only by physically present vehicle lamps or nearby practical sources, steep falloff into darkness, limited background visibility, and no artificial moonlike fill unless specified'],
['ليلي داخلي','night_majlis_warm','مجلس — سبوتات دافئة','warm practical ceiling spotlights and fixtures inside the majlis, downward causal light, soft wall bounce, believable facial shadows, and gradual falloff into deeper room areas'],
['ليلي داخلي','night_cafe_mixed','مقهى — إضاءة مختلطة','mixed cafe practical lighting from visible or plausible ceiling LEDs and warm lamps, subtle color-temperature variation, coherent shadows, and no cinematic invisible key light'],
['ليلي داخلي','night_office_led','مكتب — LED أبيض','ordinary office ceiling LED illumination with broad downward light, realistic screen contribution only at close range, restrained shadow contrast, and no studio fill'],
['ليلي داخلي','night_home_warm','منزل — إضاءة دافئة','warm residential practical lighting from ceiling and lamp fixtures, realistic wall bounce, local light falloff, and naturally darker corners'],
['ليلي داخلي','night_phone_screen','شاشة الهاتف كمصدر قريب ضعيف','very weak near-field light from the phone screen only, strongest on the closest facial planes, rapid falloff after the upper chest, deep lower-torso shadow, and no exposure/HDR creating physical illumination'],
['ليلي داخلي','night_car_practicals','داخل سيارة ليلًا — إنارة محيطية واقعية','stationary car interior at night lit by real exterior street or parking fixtures plus restrained dashboard/screen emission, correct glazing reflections, and steep falloff into unlit cabin areas'],
['ليلي داخلي','night_car_screen_only','داخل سيارة — شاشة فقط تقريبًا','very low-light stationary car interior dominated by dashboard or phone-screen emission at close range, rapid falloff across torso and cabin, deep shadows, sensor noise, and no invented fill'],
['ليلي داخلي','screen_flash_only','سطوع شاشة الهاتف فقط','pitch-dark bedroom where the phone screen (facing the subject) is the ONLY light source. Cool bluish-white light on the face, rapid falloff into deep shadow behind the subject. Visible phone edges catching the light. No ambient room light.'],
['ليلي داخلي','phone_led_flash_only','فلاش LED فقط','pitch-dark bedroom with the phone rear LED flash as the ONLY light source. Harsh direct frontal light, deep sharp drop-off into shadow behind the subject, visible flash falloff on nearby surfaces. No ambient room light. Acceptable slight overexposure on the face.'],
['ليلي داخلي','low_key_bedroom','غرفة معتمة تقريبًا','near-dark bedroom with only a very faint practical source. Most of the frame is in deep shadow with visible sensor noise. No fill light.']
]);

export const HAIR_STYLES = [
{ group:'ممشط للخلف', value:'hair-back-natural', label:'ممشط للخلف طبيعي', prompt:'hair deliberately combed BACKWARD from the forehead, away from the face, hairline fully visible. Natural clumping only in the back section. No strands fall onto the forehead.' },
{ group:'ممشط للخلف', value:'hair-back-lifted', label:'ممشط للخلف مع رفع خفيف', prompt:'hair combed BACKWARD from the forehead with a slight natural lift at the crown. Hairline visible. Direction is clearly backward. No forward-falling strands.' },
{ group:'ممشط للخلف', value:'hair-slicked-back', label:'Slicked back (مبلل)', prompt:'hair wet and slicked BACKWARD from the forehead, visible clumping from moisture, slight sheen. Every visible strand points backward. Hairline fully visible.' },
{ group:'ممشط للخلف', value:'hair-back-separated', label:'ممشط للخلف مع انفصال طبيعي', prompt:'hair firmly combed BACKWARD from the forehead with the front section pushed away from the face. Visible directional flow toward the back. Only the back section shows soft clumping. The hairline remains fully visible. Absolutely no strands fall forward or cover the forehead.' },
{ group:'ممشط للخلف', value:'hair-back-loose-ends', label:'ممشط للخلف مع أطراف مرتخية', prompt:'hair combed BACKWARD from the forehead with only 2-3 strands falling near the ears or temples. The main mass points backward. Hairline visible.' },
{ group:'ممشط للأمام', value:'hair-forward-natural', label:'ممشط للأمام طبيعي', prompt:'hair combed FORWARD onto the forehead with visible individual strands. Direction is clearly forward. Natural finish.' },
{ group:'ممشط للأمام', value:'hair-forward-quiff', label:'ممشط للأمام مع رفع أمامي', prompt:'hair brushed FORWARD with a raised front quiff at the forehead. The front section lifts up. No product shine.' },
{ group:'ممشط للأمام', value:'hair-forward-peak', label:'ممشط للأمام بقمة مرتفعة', prompt:'hair brushed FORWARD with a higher peak at the front. Strands flow from the crown toward the forehead.' },
{ group:'ممشط للأمام', value:'hair-forward-side-loose', label:'ممشط للأمام مع خصلات جانبية مرتخية', prompt:'hair brushed FORWARD with a few strands falling naturally at the temples. Front direction preserved.' },
{ group:'ممشط للأمام', value:'hair-forward-partial-forehead', label:'ممشط للأمام نصف منسدل', prompt:'hair brushed FORWARD covering part of the forehead. Direction is forward.' },
{ group:'جانبي', value:'hair-side-part-left', label:'فرق جانبي يسار', prompt:'hair parted on the LEFT side of the head (subject’s left). Clear visible parting line. Hair falls naturally on both sides of the part, away from the part line. No forward-falling strands.' },
{ group:'جانبي', value:'hair-side-part-right', label:'فرق جانبي يمين', prompt:'hair parted on the RIGHT side of the head (subject’s right). Clear visible parting line. Hair falls naturally away from the part line. No forward-falling strands.' },
{ group:'جانبي', value:'hair-deep-side-part', label:'فرق جانبي عميق', prompt:'hair parted DEEPLY on one side, visible scalp along the parting line. Hair falls naturally to both sides away from the line.' },
{ group:'جانبي', value:'hair-side-part-lift', label:'فرق جانبي مع رفع خفيف', prompt:'hair parted on one side with a slight lift above the forehead. Direction is lateral, not forward.' },
{ group:'جانبي', value:'hair-side-part-separated', label:'فرق جانبي + انفصال طبيعي', prompt:'hair parted on one side with soft natural clumping on each side. Clear parting line.' },
{ group:'وسط', value:'hair-center-part-classic', label:'فرق من الوسط كلاسيكي', prompt:'hair parted down the CENTER of the head. Clean visible parting line. Hair falls symmetrically to both sides away from the line.' },
{ group:'وسط', value:'hair-center-part-natural', label:'فرق من الوسط مع انفصال طبيعي', prompt:'hair parted near the CENTER with visible strand separation on both sides. Clear center parting.' },
{ group:'وسط', value:'hair-center-off', label:'فرق من الوسط غير مضبوط', prompt:'hair parted slightly off-center. Visible parting line but not perfectly central.' },
{ group:'وسط', value:'hair-center-loose', label:'فرق من الوسط مع خصلات مرتخية', prompt:'hair parted at the CENTER with a few loose strands falling near the face.' },
{ group:'غير مرتب', value:'hair-messy-natural', label:'messy طبيعي', prompt:'hair left completely unstyled. Strands fall in random directions. No fixed direction, no combing, natural soft volume. Do not push the hair backward or forward.' },
{ group:'غير مرتب', value:'hair-messy-lift', label:'messy مع رفع خفيف', prompt:'messy hair with a slight lift at the crown. Random direction, no combing.' },
{ group:'غير مرتب', value:'hair-tousled', label:'tousled طبيعي', prompt:'hair softly tousled as if after a long day. Random soft direction, natural clumping.' },
{ group:'غير مرتب', value:'hair-wind-light', label:'غير مرتب بعد هواء خفيف', prompt:'hair slightly displaced by a light breeze, asymmetric but natural.' },
{ group:'مبلل', value:'hair-damp-post-wudu', label:'مبلل بعد الوضوء', prompt:'hair slightly damp with visible clumping from moisture, darker at the roots. Natural fall direction without a strong comb.' },
{ group:'مبلل', value:'hair-damp-clumped', label:'مبلل مع clumping واضح', prompt:'hair wet with clear clumping, individual strand groups visible, natural moisture sheen.' },
{ group:'مبلل', value:'hair-damp-slicked', label:'مبلل + ممشط للخلف', prompt:'hair wet and combed BACKWARD from the forehead. Visible clumping, slight sheen. All strands point backward.' },
{ group:'مربوط', value:'hair-tied-back', label:'مربوط للخلف', prompt:'hair gathered and tied BACKWARD at the back of the head. Strands pulled away from the face. Tie point visible.' },
{ group:'مربوط', value:'hair-half-tied', label:'نصف مربوط', prompt:'top section of hair tied backward at the crown, lower section falls naturally below.' },
{ group:'مربوط', value:'hair-under-cap', label:'مغطى بطاقية صغيرة', prompt:'hair fully covered by a small traditional cap. No visible strands outside the cap.' },
{ group:'مربوط', value:'hair-loose-natural', label:'مرتخي طبيعي', prompt:'hair worn completely loose with no product, no combing, no fixed direction. Natural fall.' }
];

function clean(value) { return typeof value === 'string' ? value.trim() : ''; }
export function normalizeSceneContext(scene = {}) {
  const entries = [
    ['location','Location',clean(scene.location)],['clothing','Clothing',clean(scene.clothing)],['pose','Selfie pose',clean(scene.pose)],['angle','Selfie camera angle',clean(scene.angle)],['lighting','Physical lighting',clean(scene.lighting)],['lighting_notes','Additional lighting notes',clean(scene.lighting_notes)]
  ].filter(([, , value]) => value);
  return Object.fromEntries(entries.map(([key,label,value]) => [key,{label,value}]));
}
export function renderSceneContext(sceneContext = {}) {
  const entries = Object.values(sceneContext);
  if (!entries.length) return '';
  return ['Structured scene controls explicitly selected by the user:',...entries.map((entry)=>`- ${entry.label}: ${entry.value}`),'Treat these controls as explicit scene requirements. Do not override them with aesthetic preferences.'].join('\n');
}
export function sceneConstraintItems(sceneContext = {}) {
  return Object.entries(sceneContext).map(([key,entry],index)=>({id:`scene_constraint_${index+1}`,source_kind:'scene_control',source_key:key,source_text:entry.value,mapping:'semantic',target_section:'relevant_context',target_text:entry.value}));
}