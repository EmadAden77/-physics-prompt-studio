const freeze = (items) => Object.freeze(items.map((item) => Object.freeze({ ...item })));

export const CAR_MODES = freeze([
  { id: 'inside', label: 'تصوير سيلفي داخل السيارة' },
  { id: 'outside', label: 'تصوير سيلفي بالخارج بجانب السيارة' }
]);

export const XIAOMI_15_ULTRA_PROFILE = Object.freeze({
  id: 'xiaomi-15-ultra',
  label: 'Xiaomi 15 Ultra',
  front: Object.freeze({
    sensor: 'OmniVision OV32B',
    megapixels: 32,
    focalLengthEqMm: 21,
    aperture: 2.0,
    focus: 'fixed',
    ois: false,
    eis: true,
    hdrPhoto: true
  }),
  rear: Object.freeze({
    main23: Object.freeze({ focalLengthEqMm: 23, aperture: 1.63, megapixels: 50, ois: true }),
    tele70: Object.freeze({ focalLengthEqMm: 70, aperture: 1.8, megapixels: 50, ois: true }),
    ultraTele100: Object.freeze({ focalLengthEqMm: 100, aperture: 2.6, megapixels: 200, ois: true })
  })
});

export const CAR_VEHICLES = freeze([
  {
    id: 'l494-2017-white',
    label: 'Range Rover Sport L494 2017 أبيض',
    insidePrompt: 'a white 2017 Range Rover Sport L494 with a period-correct Ebony/Ivory cabin, no newer-generation dashboard or steering design',
    outsidePrompt: 'a white 2017 Range Rover Sport L494 parked and stationary, with period-correct exterior proportions, dark wheels, real tire contact and no newer-generation body design',
    steering: 'left'
  },
  {
    id: 'luxury-suv-generic',
    label: 'SUV فاخرة عامة',
    insidePrompt: 'a contemporary generic luxury SUV with physically plausible premium cabin materials',
    outsidePrompt: 'a contemporary generic luxury SUV parked and stationary with realistic paint, glass, tires and wheel geometry',
    steering: 'left'
  },
  {
    id: 'ordinary-suv',
    label: 'SUV عادية',
    insidePrompt: 'an ordinary modern SUV cabin with realistic practical materials',
    outsidePrompt: 'an ordinary modern SUV parked and stationary with believable body panels, paint reflections and tire contact',
    steering: 'left'
  },
  {
    id: 'ordinary-sedan',
    label: 'سيدان عادية',
    insidePrompt: 'an ordinary modern sedan cabin with realistic practical materials',
    outsidePrompt: 'an ordinary modern sedan parked and stationary with coherent body geometry, glass and wheels',
    steering: 'left'
  }
]);

export const CAR_CAMERA_LENSES = freeze([
  {
    id: 'front-21',
    label: 'الأمامية 21mm تقريبًا · 32MP · f/2.0',
    side: 'front',
    focalLengthEqMm: 21,
    aperture: 2.0,
    prompt: 'Xiaomi 15 Ultra 32MP OV32B front camera, approximately 21mm equivalent, f/2.0, fixed focus, EIS and realistic front-camera HDR; never treat it as a Leica rear lens'
  },
  {
    id: 'rear-main-23',
    label: 'Leica الرئيسية 23mm · 50MP · f/1.63',
    side: 'rear',
    focalLengthEqMm: 23,
    aperture: 1.63,
    prompt: 'Xiaomi 15 Ultra Leica 23mm main rear camera, 50MP, f/1.63 and OIS'
  },
  {
    id: 'rear-tele-70',
    label: 'Leica المقربة 70mm · 50MP · f/1.8',
    side: 'rear',
    focalLengthEqMm: 70,
    aperture: 1.8,
    prompt: 'Xiaomi 15 Ultra Leica 70mm floating telephoto, 50MP, f/1.8 and OIS, with physically correct telephoto compression'
  }
]);

export const CAR_COLOR_PROFILES = freeze([
  {
    id: 'front-natural',
    label: 'Xiaomi Front Natural',
    cameraSides: ['front'],
    prompt: 'natural Xiaomi front-camera color with restrained skin rendering, realistic mixed-light color and no fake Leica styling'
  },
  {
    id: 'front-balanced',
    label: 'Xiaomi Front Balanced',
    cameraSides: ['front'],
    prompt: 'balanced Xiaomi front-camera computational color with moderate contrast and natural skin, avoiding oversaturation'
  },
  {
    id: 'leica-authentic',
    label: 'Leica Authentic',
    cameraSides: ['rear'],
    prompt: 'Leica Authentic rendering with restrained saturation, realistic contrast and natural source colors'
  },
  {
    id: 'leica-vibrant',
    label: 'Leica Vibrant',
    cameraSides: ['rear'],
    prompt: 'Leica Vibrant rendering with controlled extra saturation while preserving believable skin and environment colors'
  }
]);

export const CAR_LOW_LIGHT_PROCESSING = freeze([
  {
    id: 'standard',
    label: 'قياسي · ضوضاء طبيعية',
    cameraSides: ['front', 'rear'],
    allowedTimes: ['day', 'golden', 'night'],
    stationaryOnly: false,
    prompt: 'standard smartphone processing with realistic luminance/chroma noise in dark regions, mild edge softness and no invented micro-detail'
  },
  {
    id: 'front-night-balanced',
    label: 'أمامي ليلي متوازن',
    cameraSides: ['front'],
    allowedTimes: ['night'],
    stationaryOnly: true,
    prompt: 'conservative Xiaomi front-camera multi-frame low-light processing with retained pores, realistic shadow noise and no synthetic relighting'
  },
  {
    id: 'rear-night-balanced',
    label: 'خلفي ليلي متوازن',
    cameraSides: ['rear'],
    allowedTimes: ['night'],
    stationaryOnly: true,
    prompt: 'rear-camera low-light multi-frame processing with highlight protection, alignment limits and retained texture'
  }
]);

export const CAR_TIMES = freeze([
  { id: 'day', label: 'نهار', prompt: 'daytime' },
  { id: 'golden', label: 'قرب الغروب', prompt: 'late-afternoon or golden-hour daylight' },
  { id: 'night', label: 'ليل', prompt: 'night' }
]);

export const CAR_PLACES = freeze([
  {
    id: 'quiet-residential-street',
    label: 'شارع سكني هادئ',
    kind: 'outdoor-road',
    prompt: 'an ordinary generic Saudi residential street with no named city, famous building or landmark',
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze'],
    surface: 'worn asphalt with visible aggregate, occasional hairline cracks and faded white edge or parking markings where appropriate',
    curb: 'slightly raised concrete or stone curb with practical wear',
    vegetation: 'sparse date palms, sidr or ghaf trees placed plausibly',
    people: 'few distant passers-by in thobes, abayas or ordinary modern clothing; stranger faces stay soft, partial, turned away or too small to identify'
  },
  {
    id: 'coastal-road',
    label: 'طريق ساحلي عام',
    kind: 'outdoor-road',
    prompt: 'a generic Saudi coastal road without a named city or recognizable landmark',
    allowedWeather: ['coastal-humid', 'dry-clear'],
    surface: 'dark asphalt with mild salt-weathering, realistic tire polish and faded white road paint',
    curb: 'stone or concrete curb with weathered edges',
    vegetation: 'occasional palms and salt-tolerant roadside planting',
    people: 'sparse distant pedestrians in modest local or modern clothing; no clear stranger faces'
  },
  {
    id: 'desert-road',
    label: 'طريق صحراوي',
    kind: 'outdoor-road',
    prompt: 'a generic Saudi desert road with a safe roadside stopping area and no landmark',
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze'],
    surface: 'sun-worn asphalt with dusty shoulders, faded white lines and fine grit near the road edge',
    curb: 'compacted gravel shoulder or low concrete edge only where plausible',
    vegetation: 'very sparse ghaf, sidr or hardy desert shrubs; no lush impossible greenery',
    people: 'normally very few or no pedestrians; any distant person stays anonymous and background-scale'
  },
  {
    id: 'underground-parking',
    label: 'مواقف سيارات تحت الأرض',
    kind: 'indoor-parking',
    prompt: 'an ordinary underground parking area in Saudi Arabia with no named venue',
    allowedWeather: ['indoor-controlled'],
    surface: 'sealed concrete floor with tire marks, expansion joints and realistic matte-to-satin wear',
    curb: 'painted concrete wheel stops and structural edges',
    vegetation: 'none indoors',
    people: 'occasional distant users in ordinary local or modern clothing; no identifiable stranger faces'
  },
  {
    id: 'local-cafe-front',
    label: 'أمام مقهى محلي',
    kind: 'semi-outdoor-stop',
    prompt: 'outside a modest generic local cafe in Saudi Arabia with no readable brand or identifiable address',
    allowedWeather: ['dry-clear', 'light-dust', 'coastal-humid'],
    surface: 'ordinary asphalt parking apron with patched texture and faded stall markings',
    curb: 'slightly raised concrete or stone curb with practical scuffs',
    vegetation: 'small palms or hardy ornamental planting where plausible',
    people: 'a few distant customers or workers in thobes, abayas or modern clothing; faces remain soft, partial or turned away'
  },
  {
    id: 'commercial-evening',
    label: 'حي تجاري مساءً',
    kind: 'outdoor-road',
    prompt: 'an ordinary generic Saudi commercial area in the evening with no named shop, city or landmark',
    allowedWeather: ['dry-clear', 'light-dust', 'coastal-humid'],
    surface: 'traffic-worn asphalt with subtle repairs and faded white parking or lane markings',
    curb: 'raised concrete or stone curb with realistic dirt accumulation at the edge',
    vegetation: 'occasional palms, sidr or ghaf with practical municipal spacing',
    people: 'moderate background foot traffic in realistic local and modern clothing, always privacy-preserving'
  },
  {
    id: 'public-parking',
    label: 'ساحة مواقف عامة',
    kind: 'outdoor-parking',
    prompt: 'an ordinary generic public parking area in Saudi Arabia with no landmark or named venue',
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze', 'coastal-humid'],
    surface: 'parking asphalt with aggregate, tire wear, faint oil marks and faded white bay lines',
    curb: 'concrete wheel stops or low curbs with wear',
    vegetation: 'occasional palms, sidr or ghaf depending on the site',
    people: 'sparse distant users in ordinary local or modern clothing; no identifiable stranger faces'
  },
  {
    id: 'villa-driveway',
    label: 'ممر سيارة أمام منزل',
    kind: 'semi-outdoor-stop',
    prompt: 'an ordinary generic residential driveway in Saudi Arabia with no identifiable address or landmark',
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze'],
    surface: 'interlocking pavers, concrete or clean driveway asphalt with realistic joints and dust',
    curb: 'driveway edge or slightly raised curb with believable transitions',
    vegetation: 'one or two palms or hardy residential plants where plausible',
    people: 'normally no unrelated strangers; any distant person remains anonymous'
  }
]);

export const CAR_WEATHER = freeze([
  { id: 'dry-clear', label: 'جاف وصافٍ', placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'dry clear air with ordinary atmospheric perspective and no artificial haze' },
  { id: 'light-dust', label: 'غبار خفيف', placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'light suspended dust reducing distant contrast slightly without turning the scene into a sandstorm' },
  { id: 'hot-haze', label: 'وهج حراري خفيف', placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'subtle hot-air haze visible mainly at distance and near sun-heated surfaces' },
  { id: 'coastal-humid', label: 'رطوبة ساحلية', placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'humid coastal air with slightly reduced distant contrast and realistic specular softness' },
  { id: 'indoor-controlled', label: 'داخلي ثابت', placeKinds: ['indoor-parking'], prompt: 'indoor controlled air with no outdoor weather effects inside the garage' }
]);

export const EXTERNAL_LIGHTING = freeze([
  { id: 'day-direct-sun', label: 'شمس مباشرة', allowedTimes: ['day'], placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'strong direct sun plus sky fill, hard-edged sun shadows, realistic specular highlights and sky reflections; no second shadow direction without a second real source' },
  { id: 'day-hazy-sun', label: 'شمس مع غبار/وهج خفيف', allowedTimes: ['day'], placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'strong daylight softened slightly by dust or haze while preserving one coherent solar direction' },
  { id: 'golden-sun', label: 'ضوء غروب منخفض', allowedTimes: ['golden'], placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'low-angle warm sunlight with long directionally consistent shadows and realistic sky reflections' },
  { id: 'night-led-street', label: 'LED شارع أبيض', allowedTimes: ['night'], placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'white LED street lighting from physically plausible fixture directions with local falloff and coherent shadows' },
  { id: 'night-sodium-street', label: 'إنارة شارع دافئة', allowedTimes: ['night'], placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'warm sodium-like street lighting from plausible poles with localized amber casts and realistic falloff' },
  { id: 'night-parking-led', label: 'إنارة مواقف LED', allowedTimes: ['night'], placeKinds: ['outdoor-parking', 'semi-outdoor-stop'], prompt: 'ordinary parking LED fixtures producing localized pools of light and physically coherent reflections' },
  { id: 'underground-led', label: 'إنارة مواقف داخلية', allowedTimes: ['day', 'golden', 'night'], placeKinds: ['indoor-parking'], prompt: 'ceiling-mounted garage LED fixtures producing repeated but individually plausible light pools and reflections' },
  { id: 'night-signage-spill', label: 'تسرب ضوء لافتة محلية', allowedTimes: ['night'], placeKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'], prompt: 'weak localized sign or storefront spill from an off-camera but spatially plausible source; it may tint nearby surfaces but cannot overpower the scene without sufficient intensity' }
]);

export const CLOTHING = freeze([
  { id: 'white-thobe', label: 'ثوب أبيض', fabrics: ['cotton-poplin', 'poly-cotton'], prompt: 'a plain white Saudi thobe' },
  { id: 'navy-thobe', label: 'ثوب كحلي', fabrics: ['cotton-poplin', 'poly-cotton'], prompt: 'a plain navy Saudi thobe' },
  { id: 'bisht-thobe', label: 'ثوب مع بشت', fabrics: ['wool-blend'], prompt: 'a Saudi thobe with a traditional bisht, draping naturally under gravity' },
  { id: 'navy-suit', label: 'بدلة كحلية', fabrics: ['wool-blend', 'synthetic-tailoring'], prompt: 'a navy tailored suit with an open-collar light shirt' },
  { id: 'white-shirt', label: 'قميص أبيض', fabrics: ['cotton-poplin', 'linen'], prompt: 'a plain white shirt' },
  { id: 'light-blue-shirt', label: 'قميص أزرق فاتح', fabrics: ['cotton-poplin', 'linen'], prompt: 'a light-blue casual shirt' },
  { id: 'black-tshirt', label: 'تيشيرت أسود', fabrics: ['cotton-jersey'], prompt: 'a plain black T-shirt' },
  { id: 'navy-tshirt', label: 'تيشيرت كحلي', fabrics: ['cotton-jersey'], prompt: 'a plain navy T-shirt' },
  { id: 'polo', label: 'بولو', fabrics: ['pique-cotton', 'synthetic-sport'], prompt: 'a plain pique polo shirt' },
  { id: 'linen-shirt', label: 'قميص كتان', fabrics: ['linen'], prompt: 'a plain linen shirt' },
  { id: 'denim-casual', label: 'قميص/بنطال جينز كاجوال', fabrics: ['denim'], prompt: 'a casual denim-based outfit with realistic denim structure' },
  { id: 'sweatshirt', label: 'سويت شيرت', fabrics: ['fleece-cotton'], prompt: 'a plain sweatshirt' },
  { id: 'sport-cap', label: 'ملابس رياضية مع كاب', fabrics: ['synthetic-sport'], prompt: 'modest casual sportswear with a simple cap' },
  { id: 'black-abaya', label: 'عباءة سوداء', fabrics: ['abaya-crepe', 'matte-synthetic'], prompt: 'a modest black abaya with physically plausible drape' },
  { id: 'embroidered-abaya', label: 'عباءة مطرزة', fabrics: ['abaya-crepe'], prompt: 'a modest embroidered abaya with restrained embroidery highlights' },
  { id: 'abaya-hijab', label: 'عباءة مع حجاب', fabrics: ['abaya-crepe', 'matte-synthetic'], prompt: 'a modest abaya with a naturally draped hijab' }
]);

export const FABRICS = freeze([
  { id: 'cotton-poplin', label: 'قطن بوبلين', sheen: ['matte', 'soft'], wrinkles: ['light', 'natural'], prompt: 'cotton poplin with low diffuse reflectance, crisp but small folds, seam tension and realistic seat/body compression' },
  { id: 'poly-cotton', label: 'قطن مخلوط', sheen: ['matte', 'soft'], wrinkles: ['light', 'natural'], prompt: 'poly-cotton with slightly smoother highlights than pure cotton and moderate crease recovery' },
  { id: 'cotton-jersey', label: 'قطن جيرسي', sheen: ['matte'], wrinkles: ['natural', 'relaxed'], prompt: 'cotton jersey with soft diffuse response, rounded stretch folds and body-conforming tension' },
  { id: 'pique-cotton', label: 'قطن بيكيه', sheen: ['matte'], wrinkles: ['light', 'natural'], prompt: 'pique cotton with visible micro-knit texture and restrained diffuse highlights' },
  { id: 'linen', label: 'كتان', sheen: ['matte'], wrinkles: ['natural', 'pronounced'], prompt: 'linen with dry low-sheen fibers, irregular slub texture and naturally persistent wrinkles' },
  { id: 'wool-blend', label: 'صوف/خليط رسمي', sheen: ['matte', 'soft'], wrinkles: ['light', 'natural'], prompt: 'tailoring wool blend with controlled low sheen, structured folds and gravity-driven drape' },
  { id: 'synthetic-tailoring', label: 'قماش بدلات صناعي', sheen: ['soft'], wrinkles: ['light'], prompt: 'synthetic tailoring fabric with subtle directional sheen and reduced wrinkling' },
  { id: 'denim', label: 'دينم', sheen: ['matte'], wrinkles: ['natural', 'pronounced'], prompt: 'denim with visible twill structure, stiff fold memory, seam bunching and matte indigo response' },
  { id: 'fleece-cotton', label: 'فليس/قطن', sheen: ['matte'], wrinkles: ['relaxed', 'natural'], prompt: 'fleece cotton with soft matte surface, thicker rounded folds and compression at contact points' },
  { id: 'synthetic-sport', label: 'رياضي صناعي', sheen: ['soft', 'technical'], wrinkles: ['light', 'relaxed'], prompt: 'technical sports fabric with fine synthetic weave, controlled specular response and flexible folds' },
  { id: 'abaya-crepe', label: 'كريب عباءة', sheen: ['matte', 'soft'], wrinkles: ['relaxed', 'natural'], prompt: 'abaya crepe with flowing gravity-driven folds, restrained sheen and dense drape' },
  { id: 'matte-synthetic', label: 'صناعي مطفي', sheen: ['matte'], wrinkles: ['relaxed'], prompt: 'matte synthetic fabric with soft drape and low specular response' }
]);

export const FABRIC_SHEEN = freeze([
  { id: 'matte', label: 'مطفي', prompt: 'matte low-specular fabric response' },
  { id: 'soft', label: 'لمعان خفيف', prompt: 'soft broad fabric highlights with no plastic gloss' },
  { id: 'technical', label: 'لمعان تقني خفيف', prompt: 'controlled narrow synthetic highlights appropriate to technical fabric' }
]);

export const WRINKLES = freeze([
  { id: 'light', label: 'تجاعيد خفيفة', prompt: 'light localized folds at elbows, waist, shoulder and contact points' },
  { id: 'natural', label: 'تجاعيد طبيعية', prompt: 'natural gravity and joint-driven wrinkles with no random painted creases' },
  { id: 'relaxed', label: 'طيات رخوة', prompt: 'soft relaxed folds with gentle compression' },
  { id: 'pronounced', label: 'تجاعيد واضحة واقعية', prompt: 'pronounced but structurally plausible folds following material stiffness and body motion' }
]);

export const HAIR_PROFILES = freeze([
  { id: 'reference-locked', label: 'مطابق للمرجع · كثافة ثابتة', densityLock: true, prompt: 'preserve the reference hairline, density, visible gaps and strand distribution exactly; angle or lighting may reveal hair differently but never change density' },
  { id: 'short-textured', label: 'قصير بتكسچر طبيعي', densityLock: true, prompt: 'short textured hair with fixed density and plausible individual strand clumping' },
  { id: 'side-swept', label: 'مسرّح جانبيًا', densityLock: true, prompt: 'natural side-swept hair with fixed density and realistic strand direction' },
  { id: 'covered', label: 'مغطى بغطاء رأس', densityLock: true, prompt: 'hair is covered; do not invent exposed density or hair strands outside the physically visible area' }
]);

export const HAIR_MOTION = freeze([
  { id: 'still', label: 'ثابت طبيعيًا', modes: ['inside', 'outside'], prompt: 'hair remains naturally settled with only tiny strand irregularity' },
  { id: 'cabin-airflow', label: 'هواء مكيف خفيف', modes: ['inside'], prompt: 'very subtle cabin-airflow movement affecting only light loose strands; no windblown hair inside a closed cabin' },
  { id: 'light-breeze', label: 'نسمة خارجية خفيفة', modes: ['outside'], prompt: 'light outdoor breeze moves only loose strands in one coherent direction' },
  { id: 'moderate-breeze', label: 'هواء خارجي متوسط', modes: ['outside'], prompt: 'moderate outdoor breeze produces directional strand motion while preserving hair density and hairstyle structure' }
]);

export const HAIR_SPECULAR = freeze([
  { id: 'natural-low', label: 'انعكاس منخفض طبيعي', prompt: 'low natural hair specular response with strand-scale highlights only where the real light angle supports them' },
  { id: 'natural-medium', label: 'انعكاس متوسط طبيعي', prompt: 'moderate hair sheen with anisotropic strand highlights following source direction, never helmet-like gloss' }
]);

export const EXPRESSIONS = freeze([
  { id: 'neutral', label: 'هادئ ومحايد', prompt: 'calm neutral expression with relaxed orbicularis oris and natural facial asymmetry' },
  { id: 'small-smile', label: 'ابتسامة بسيطة', prompt: 'very small closed-mouth smile driven by subtle zygomatic activation, with proportional cheek and eye changes' },
  { id: 'focused', label: 'مركز', prompt: 'focused attentive expression with slight brow engagement and natural eyelid tension' },
  { id: 'side-glance', label: 'نظرة جانبية', prompt: 'natural side glance produced by coherent eye rotation and minimal head/neck compensation' },
  { id: 'mild-surprise', label: 'دهشة خفيفة', prompt: 'mild surprise with small brow elevation and slightly widened eyes, no exaggerated uncanny expression' }
]);

export const SKIN_DETAIL = freeze([
  { id: 'natural-pores', label: 'مسام طبيعية', prompt: 'natural pores, fine vellus hair, small tonal variation and realistic subsurface response; no waxy smoothing' },
  { id: 'fine-lines', label: 'مسام + خطوط دقيقة', prompt: 'natural pores plus fine age-appropriate lines around eyes and expression zones, without artificial sharpening' }
]);

export const GAZE_TARGETS = freeze([
  { id: 'camera', label: 'ينظر للكاميرا', modes: ['inside', 'outside'], prompt: 'eyes converge naturally toward the camera position' },
  { id: 'road', label: 'ينظر للطريق', modes: ['inside'], prompt: 'gaze remains naturally oriented toward the road ahead' },
  { id: 'car', label: 'ينظر للسيارة', modes: ['outside'], prompt: 'gaze turns naturally toward the nearby vehicle with matching head/neck rotation' }
]);

export const PHYSICS_MODES = freeze([
  { id: 'strict', label: 'صارم · يمنع التعارض', prompt: 'block physically inconsistent combinations' },
  { id: 'auto', label: 'تلقائي · ينبه فقط', prompt: 'report deterministic physical conflicts without blocking output' }
]);

export const EXPOSURE = freeze([
  { id: 'natural', label: 'طبيعي', prompt: 'natural smartphone exposure with realistic contrast and shadow noise' },
  { id: 'protect-highlights', label: 'حماية الهايلايت', prompt: 'exposure biased to preserve bright sky, lights, displays and paint highlights while accepting darker shadows' },
  { id: 'slightly-bright', label: 'أفتح قليلًا', prompt: 'slightly brighter exposure without inventing illumination on surfaces that received no light' }
]);

export const HDR = freeze([
  { id: 'off', label: 'HDR مغلق', prompt: 'HDR disabled; preserve realistic single-exposure contrast limits' },
  { id: 'auto-realistic', label: 'HDR تلقائي واقعي', prompt: 'realistic computational HDR that merges only captured signal, protects highlights and never relights unilluminated surfaces' },
  { id: 'mild', label: 'HDR خفيف', prompt: 'mild computational HDR with restrained local tone mapping and no halos' }
]);

export const WHITE_BALANCE = freeze([
  { id: 'auto', label: 'Auto واقعي', prompt: 'realistic automatic white balance with residual mixed-light color casts' },
  { id: 'warm', label: 'دافئ قليلًا', prompt: 'slightly warm balance while preserving real source color differences' },
  { id: 'cool', label: 'بارد قليلًا', prompt: 'slightly cool balance while preserving real source colors' }
]);

export const COMMON_CATALOG = Object.freeze({
  mode: CAR_MODES,
  vehicleProfile: CAR_VEHICLES,
  cameraLens: CAR_CAMERA_LENSES,
  colorProfile: CAR_COLOR_PROFILES,
  lowLightProcessing: CAR_LOW_LIGHT_PROCESSING,
  time: CAR_TIMES,
  place: CAR_PLACES,
  weather: CAR_WEATHER,
  externalLight: EXTERNAL_LIGHTING,
  clothing: CLOTHING,
  fabricType: FABRICS,
  fabricSheen: FABRIC_SHEEN,
  wrinkleProfile: WRINKLES,
  hairProfile: HAIR_PROFILES,
  hairMotion: HAIR_MOTION,
  hairSpecular: HAIR_SPECULAR,
  expression: EXPRESSIONS,
  skinDetail: SKIN_DETAIL,
  gazeTarget: GAZE_TARGETS,
  physicsMode: PHYSICS_MODES,
  exposure: EXPOSURE,
  hdr: HDR,
  whiteBalance: WHITE_BALANCE
});

export const commonOption = (field, id) => (COMMON_CATALOG[field] || []).find((item) => item.id === id) || null;
export const getCameraOptic = (id) => commonOption('cameraLens', id);
export const getVehicle = (id) => commonOption('vehicleProfile', id);
export const getClothing = (id) => commonOption('clothing', id);
export const getFabric = (id) => commonOption('fabricType', id);

export function normalizeIntentText(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

export function detectCarModeFromIntent(request = '', fallback = 'inside') {
  const text = normalizeIntentText(request);
  const outsideTerms = ['خارج السيارة', 'بجانب السيارة', 'جنب السيارة', 'واقف بجانب', 'واقف عند السيارة', 'متكئ على السيارة', 'يفتح الباب الخلفي', 'outside', 'beside the car'];
  const insideTerms = ['داخل السيارة', 'داخل المقصورة', 'مقعد السائق', 'مقعد الراكب', 'العدادات', 'inside the car', 'cabin selfie'];
  if (outsideTerms.some((term) => text.includes(term))) return 'outside';
  if (insideTerms.some((term) => text.includes(term))) return 'inside';
  return fallback === 'outside' ? 'outside' : 'inside';
}

export function commonCompatibility(field, id, state) {
  const item = commonOption(field, id);
  if (!item) return false;
  const lens = getCameraOptic(state.cameraLens);
  const place = commonOption('place', state.place);
  const fabric = getFabric(state.fabricType);

  if (field === 'colorProfile' && lens && !item.cameraSides.includes(lens.side)) return false;
  if (field === 'lowLightProcessing') {
    if (lens && !item.cameraSides.includes(lens.side)) return false;
    if (!item.allowedTimes.includes(state.time)) return false;
    if (item.stationaryOnly && state.motion === 'moving') return false;
  }
  if (field === 'weather') {
    if (place && !place.allowedWeather.includes(item.id)) return false;
    if (place && !item.placeKinds.includes(place.kind)) return false;
  }
  if (field === 'externalLight') {
    if (!item.allowedTimes.includes(state.time)) return false;
    if (place && !item.placeKinds.includes(place.kind)) return false;
  }
  if (field === 'fabricType') {
    const clothing = getClothing(state.clothing);
    if (clothing && !clothing.fabrics.includes(item.id)) return false;
  }
  if (field === 'fabricSheen' && fabric && !fabric.sheen.includes(item.id)) return false;
  if (field === 'wrinkleProfile' && fabric && !fabric.wrinkles.includes(item.id)) return false;
  if (field === 'hairMotion' && !item.modes.includes(state.mode)) return false;
  if (field === 'gazeTarget' && !item.modes.includes(state.mode)) return false;
  return true;
}

export function applyCommonIntent(request, state) {
  const text = normalizeIntentText(request);
  const next = { ...state };
  const tags = [];

  if (/(ليل|ليلي|night)/.test(text)) { next.time = 'night'; tags.push('night'); }
  else if (/(غروب|sunset|golden)/.test(text)) { next.time = 'golden'; tags.push('golden'); }
  else if (/(نهار|صباح|day|morning)/.test(text)) { next.time = 'day'; tags.push('day'); }

  if (/(مقهى|كافيه|cafe)/.test(text)) { next.place = 'local-cafe-front'; tags.push('cafe'); }
  else if (/(ساحل|ساحلي|coastal)/.test(text)) { next.place = 'coastal-road'; tags.push('coastal'); }
  else if (/(صحرا|desert)/.test(text)) { next.place = 'desert-road'; tags.push('desert'); }
  else if (/(مواقف تحت|underground)/.test(text)) { next.place = 'underground-parking'; tags.push('underground'); }
  else if (/(سكني|residential)/.test(text)) { next.place = 'quiet-residential-street'; tags.push('residential'); }
  else if (/(تجاري|commercial)/.test(text)) { next.place = 'commercial-evening'; tags.push('commercial'); }
  else if (/(فيلا|منزل|driveway)/.test(text)) { next.place = 'villa-driveway'; tags.push('driveway'); }

  if (/(غبار|dust)/.test(text)) next.weather = 'light-dust';
  else if (/(رطوب|humid)/.test(text)) next.weather = 'coastal-humid';
  else if (/(حراري|haze)/.test(text)) next.weather = 'hot-haze';

  if (/(ثوب أبيض|white thobe)/.test(text)) next.clothing = 'white-thobe';
  else if (/(ثوب كحلي|navy thobe)/.test(text)) next.clothing = 'navy-thobe';
  else if (/(بشت|bisht)/.test(text)) next.clothing = 'bisht-thobe';
  else if (/(بدلة|suit)/.test(text)) next.clothing = 'navy-suit';
  else if (/(تيشيرت أسود|black t-?shirt)/.test(text)) next.clothing = 'black-tshirt';
  else if (/(تيشيرت كحلي|navy t-?shirt)/.test(text)) next.clothing = 'navy-tshirt';
  else if (/(كتان|linen)/.test(text)) next.clothing = 'linen-shirt';
  else if (/(عباءة|abaya)/.test(text) && /(حجاب|hijab)/.test(text)) next.clothing = 'abaya-hijab';
  else if (/(عباءة|abaya)/.test(text)) next.clothing = 'black-abaya';
  else if (/(سويت|sweatshirt)/.test(text)) next.clothing = 'sweatshirt';

  if (/(بدون ابتسامة|محايد|neutral)/.test(text)) next.expression = 'neutral';
  else if (/(ابتسامة بسيطة|ابتسامة خفيفة|small smile)/.test(text)) next.expression = 'small-smile';
  else if (/(دهشة|surprise)/.test(text)) next.expression = 'mild-surprise';
  else if (/(نظرة جانبية|side glance)/.test(text)) next.expression = 'side-glance';

  if (/(70\s*mm|75\s*mm|مقربة|telephoto)/.test(text)) {
    next.cameraLens = 'rear-tele-70';
    next.colorProfile = 'leica-authentic';
    tags.push('70mm');
  } else if (/(23\s*mm|leica main)/.test(text)) {
    next.cameraLens = 'rear-main-23';
    next.colorProfile = 'leica-authentic';
    tags.push('23mm');
  }

  return Object.freeze({ next, tags: Object.freeze(tags), normalized: text });
}

export function normalizeCommonDerivedState(state) {
  const next = { ...state };
  const lens = getCameraOptic(next.cameraLens);
  if (lens) {
    next.focalLength = lens.focalLengthEqMm;
    next.aperture = lens.aperture;
  }
  const clothing = getClothing(next.clothing);
  if (clothing && !clothing.fabrics.includes(next.fabricType)) next.fabricType = clothing.fabrics[0];
  const fabric = getFabric(next.fabricType);
  if (fabric) {
    if (!fabric.sheen.includes(next.fabricSheen)) next.fabricSheen = fabric.sheen[0];
    if (!fabric.wrinkles.includes(next.wrinkleProfile)) next.wrinkleProfile = fabric.wrinkles[0];
  }
  const place = commonOption('place', next.place);
  if (place && !place.allowedWeather.includes(next.weather)) next.weather = place.allowedWeather[0];
  const ext = commonOption('externalLight', next.externalLight);
  if (!ext || !ext.allowedTimes.includes(next.time) || (place && !ext.placeKinds.includes(place.kind))) {
    if (place?.kind === 'indoor-parking') next.externalLight = 'underground-led';
    else if (next.time === 'day') next.externalLight = next.weather === 'light-dust' ? 'day-hazy-sun' : 'day-direct-sun';
    else if (next.time === 'golden') next.externalLight = 'golden-sun';
    else next.externalLight = place?.kind === 'outdoor-parking' ? 'night-parking-led' : 'night-led-street';
  }
  const color = commonOption('colorProfile', next.colorProfile);
  if (lens && color && !color.cameraSides.includes(lens.side)) next.colorProfile = lens.side === 'front' ? 'front-natural' : 'leica-authentic';
  const low = commonOption('lowLightProcessing', next.lowLightProcessing);
  if (!low || (lens && !low.cameraSides.includes(lens.side)) || !low.allowedTimes.includes(next.time)) {
    next.lowLightProcessing = next.time === 'night' ? (lens?.side === 'front' ? 'front-night-balanced' : 'rear-night-balanced') : 'standard';
  }
  return Object.freeze(next);
}