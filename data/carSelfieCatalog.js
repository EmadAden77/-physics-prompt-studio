const freeze = (items) => Object.freeze(items.map((item) => Object.freeze({ ...item })));

export const XIAOMI_15_ULTRA_PROFILE = Object.freeze({
  id: 'xiaomi-15-ultra',
  label: 'Xiaomi 15 Ultra',
  rearLeica: true,
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
    main23: Object.freeze({ sensor: 'Sony LYT-900', megapixels: 50, focalLengthEqMm: 23, aperture: 1.63, ois: true, hdrEvClaim: 14 }),
    tele70: Object.freeze({ sensor: 'Sony IMX858', megapixels: 50, focalLengthEqMm: 70, aperture: 1.8, ois: true }),
    ultraTele100: Object.freeze({ sensor: 'Samsung HP9', megapixels: 200, focalLengthEqMm: 100, aperture: 2.6, ois: true })
  })
});

export const CAR_VEHICLE_PROFILES = freeze([
  { id: 'l494-2017-white', label: 'Range Rover Sport L494 2017 أبيض', prompt: 'a white 2017 Range Rover Sport L494 with a period-correct cabin; no newer-generation dashboard or steering design', cabinClass: 'luxury-suv', steering: 'left' },
  { id: 'luxury-suv-generic', label: 'SUV فاخرة عامة', prompt: 'a contemporary generic luxury SUV with physically plausible premium cabin materials', cabinClass: 'luxury-suv', steering: 'left' },
  { id: 'luxury-sedan-generic', label: 'سيدان فاخرة عامة', prompt: 'a contemporary generic luxury sedan with physically plausible premium cabin materials', cabinClass: 'luxury-sedan', steering: 'left' },
  { id: 'ordinary-suv', label: 'SUV عادية', prompt: 'an ordinary modern SUV cabin with realistic practical materials', cabinClass: 'ordinary', steering: 'left' },
  { id: 'ordinary-sedan', label: 'سيدان عادية', prompt: 'an ordinary modern sedan cabin with realistic practical materials', cabinClass: 'ordinary', steering: 'left' }
]);

export const CAR_STATES = freeze([
  { id: 'parked-off', label: 'متوقفة ومطفأة', prompt: 'parked and fully stationary with the vehicle off', moving: false },
  { id: 'parked-engine-on', label: 'متوقفة والمحرك يعمل', prompt: 'parked and fully stationary with the vehicle powered on', moving: false },
  { id: 'stopped-traffic', label: 'متوقفة مؤقتًا في زحام/إشارة', prompt: 'temporarily stopped with zero vehicle motion', moving: false },
  { id: 'moving', label: 'تسير على الطريق', prompt: 'moving normally on the road', moving: true }
]);

export const CAR_SEATS = freeze([
  { id: 'driver-left', label: 'السائق الأمامي الأيسر', prompt: 'the subject is physically seated in the front-left driver seat of a left-hand-drive vehicle', role: 'driver' },
  { id: 'front-passenger-right', label: 'الراكب الأمامي الأيمن', prompt: 'the subject is physically seated in the front-right passenger seat of a left-hand-drive vehicle', role: 'passenger' }
]);

export const CAR_CAPTURE_MODES = freeze([
  {
    id: 'handheld-front',
    label: 'سيلفي يدوي بالكاميرا الأمامية',
    prompt: 'genuine subject-held Xiaomi 15 Ultra front-camera selfie at natural arm reach',
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'],
    allowedCameraSides: ['front'],
    distanceRangeCm: [30, 50],
    maxAbsYawDeg: 35,
    maxAbsPitchDeg: 25,
    maxAbsRollDeg: 10,
    phoneHeld: true
  },
  {
    id: 'dashboard-fixed',
    label: 'الهاتف مثبت على لوحة القيادة',
    prompt: 'Xiaomi 15 Ultra fixed securely on a dashboard mount and aimed at the subject',
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'],
    allowedCameraSides: ['front', 'rear'],
    distanceRangeCm: [45, 125],
    maxAbsYawDeg: 45,
    maxAbsPitchDeg: 30,
    maxAbsRollDeg: 8,
    phoneHeld: false
  },
  {
    id: 'center-console-fixed',
    label: 'الهاتف مثبت قرب الكونسول',
    prompt: 'Xiaomi 15 Ultra fixed securely near the center console and aimed naturally toward the subject',
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'],
    allowedCameraSides: ['front', 'rear'],
    distanceRangeCm: [40, 110],
    maxAbsYawDeg: 50,
    maxAbsPitchDeg: 35,
    maxAbsRollDeg: 10,
    phoneHeld: false
  },
  {
    id: 'rearview-mirror',
    label: 'تصوير انعكاس المرآة الداخلية',
    prompt: 'Xiaomi 15 Ultra rear camera aimed at the interior rear-view mirror to photograph a physically valid reflected subject',
    allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'],
    allowedCameraSides: ['rear'],
    distanceRangeCm: [45, 140],
    maxAbsYawDeg: 35,
    maxAbsPitchDeg: 25,
    maxAbsRollDeg: 8,
    phoneHeld: true
  }
]);

export const CAR_CAMERA_LENSES = freeze([
  {
    id: 'front-21',
    label: 'الأمامية 21mm تقريبًا · 32MP · f/2.0',
    side: 'front',
    focalLengthEqMm: 21,
    aperture: 2.0,
    prompt: '32MP OmniVision OV32B front camera, approximately 21mm equivalent, f/2.0, fixed focus, EIS, HDR-capable; this is not a Leica rear lens',
    allowedCapture: ['handheld-front', 'dashboard-fixed', 'center-console-fixed'],
    fixedFocus: true,
    ois: false,
    eis: true
  },
  {
    id: 'rear-main-23',
    label: 'Leica الرئيسية 23mm · 50MP · f/1.63',
    side: 'rear',
    focalLengthEqMm: 23,
    aperture: 1.63,
    prompt: '50MP Leica 23mm main camera with Sony LYT-900 1-inch sensor, f/1.63 and OIS',
    allowedCapture: ['dashboard-fixed', 'center-console-fixed', 'rearview-mirror'],
    fixedFocus: false,
    ois: true,
    eis: true
  },
  {
    id: 'rear-tele-70',
    label: 'Leica المقربة 70mm · 50MP · f/1.8',
    side: 'rear',
    focalLengthEqMm: 70,
    aperture: 1.8,
    prompt: '50MP Leica 70mm floating telephoto with Sony IMX858, f/1.8 and OIS; use real telephoto perspective compression',
    allowedCapture: ['dashboard-fixed', 'center-console-fixed', 'rearview-mirror'],
    fixedFocus: false,
    ois: true,
    eis: true
  },
  {
    id: 'rear-ultratele-100',
    label: 'Leica المقربة 100mm · 200MP · f/2.6',
    side: 'rear',
    focalLengthEqMm: 100,
    aperture: 2.6,
    prompt: '200MP Leica 100mm ultra-telephoto with Samsung HP9, f/2.6 and OIS; use strong but physically correct telephoto compression',
    allowedCapture: ['dashboard-fixed', 'rearview-mirror'],
    fixedFocus: false,
    ois: true,
    eis: true
  }
]);

export const CAR_COLOR_PROFILES = freeze([
  {
    id: 'front-natural',
    label: 'Front Natural · معالجة أمامية طبيعية',
    prompt: 'natural Xiaomi front-camera color with restrained skin rendering and no Leica rear-camera look',
    allowedCameraSides: ['front']
  },
  {
    id: 'leica-authentic',
    label: 'Leica Authentic',
    prompt: 'Leica Authentic color rendering with restrained saturation, realistic contrast and natural skin tones',
    allowedCameraSides: ['rear']
  },
  {
    id: 'leica-vibrant',
    label: 'Leica Vibrant',
    prompt: 'Leica Vibrant color rendering with controlled extra saturation while preserving believable skin and source colors',
    allowedCameraSides: ['rear']
  }
]);

export const CAR_LOW_LIGHT_PROCESSING = freeze([
  {
    id: 'standard',
    label: 'قياسي · ضوضاء طبيعية',
    prompt: 'standard smartphone processing with realistic luminance/chroma noise in dark regions and no invented micro-detail',
    allowedCameraSides: ['front', 'rear'],
    allowedTimes: ['day', 'golden', 'night'],
    requiresStationary: false
  },
  {
    id: 'front-night-balanced',
    label: 'أمامي ليلي متوازن',
    prompt: 'front-camera low-light processing with conservative multi-frame denoising, retained pores and residual shadow noise; no fake relighting',
    allowedCameraSides: ['front'],
    allowedTimes: ['night'],
    requiresStationary: true
  },
  {
    id: 'rear-super-night-2',
    label: 'Rear Super Night 2.0 واقعي',
    prompt: 'rear-camera Super Night 2.0 style multi-frame processing with highlight protection, alignment limits and retained low-light texture',
    allowedCameraSides: ['rear'],
    allowedTimes: ['night'],
    requiresStationary: true
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
    prompt: 'an ordinary generic Saudi residential street with no named city or landmark',
    placeKind: 'outdoor-road',
    allowedVehicleStates: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'],
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze'],
    surface: 'worn asphalt with subtle aggregate, occasional hairline cracks and faded white edge markings where appropriate',
    curb: 'slightly raised concrete or stone curb with practical wear',
    vegetation: 'sparse date palms, sidr or ghaf trees placed plausibly for a residential street',
    people: 'few distant passers-by in thobes, abayas or ordinary modern clothing; strangers remain background-scale with no clearly identifiable faces'
  },
  {
    id: 'coastal-road',
    label: 'طريق ساحلي عام',
    prompt: 'a generic Saudi coastal road without any recognizable landmark or named city',
    placeKind: 'outdoor-road',
    allowedVehicleStates: ['parked-engine-on', 'stopped-traffic', 'moving'],
    allowedWeather: ['coastal-humid', 'dry-clear'],
    surface: 'dark asphalt with mild salt-weathering, realistic tire polish and faded white lane paint',
    curb: 'stone or concrete curb with slightly weathered edges',
    vegetation: 'occasional palms and salt-tolerant roadside planting',
    people: 'sparse distant pedestrians in locally plausible modest clothing, never posed for camera and never shown with clear stranger faces'
  },
  {
    id: 'desert-road',
    label: 'طريق صحراوي',
    prompt: 'a generic Saudi desert road with a safe roadside stopping area and no landmark',
    placeKind: 'outdoor-road',
    allowedVehicleStates: ['parked-off', 'parked-engine-on', 'moving'],
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze'],
    surface: 'sun-worn asphalt with dusty shoulders, faded white lines and fine grit near the road edge',
    curb: 'usually no urban curb; use compacted gravel shoulder or low concrete edge only where plausible',
    vegetation: 'very sparse ghaf, sidr or hardy desert shrubs; no lush impossible greenery',
    people: 'normally very few or no pedestrians; any distant person remains anonymous and background-scale'
  },
  {
    id: 'underground-parking',
    label: 'مواقف سيارات تحت الأرض',
    prompt: 'an ordinary underground parking area in Saudi Arabia with no named venue',
    placeKind: 'indoor-parking',
    allowedVehicleStates: ['parked-off', 'parked-engine-on', 'moving'],
    allowedWeather: ['indoor-controlled'],
    surface: 'sealed concrete floor with realistic tire marks, expansion joints and matte-to-satin patches',
    curb: 'painted concrete wheel stops and low structural edges',
    vegetation: 'none indoors',
    people: 'occasional distant users in ordinary local or modern clothing; no clear stranger faces'
  },
  {
    id: 'local-cafe-front',
    label: 'أمام مقهى محلي',
    prompt: 'outside a modest generic local cafe in Saudi Arabia with no readable brand or identifiable address',
    placeKind: 'semi-outdoor-stop',
    allowedVehicleStates: ['parked-off', 'parked-engine-on', 'stopped-traffic'],
    allowedWeather: ['dry-clear', 'light-dust', 'coastal-humid'],
    surface: 'ordinary asphalt parking apron with patched texture and faded stall markings',
    curb: 'slightly raised concrete or stone curb with practical scuffs',
    vegetation: 'small palms or hardy ornamental planting where physically plausible',
    people: 'a few distant customers or workers in thobes, abayas or modern clothing; faces remain soft, partial or turned away'
  },
  {
    id: 'commercial-district-evening',
    label: 'حي تجاري مساءً',
    prompt: 'an ordinary generic Saudi commercial district in the evening with no named shop, city or landmark',
    placeKind: 'outdoor-road',
    allowedVehicleStates: ['parked-engine-on', 'stopped-traffic', 'moving'],
    allowedWeather: ['dry-clear', 'light-dust', 'coastal-humid'],
    surface: 'traffic-worn asphalt with subtle repairs and faded white parking/lane markings',
    curb: 'raised concrete or stone curb with realistic dirt accumulation at the edge',
    vegetation: 'occasional palms, sidr or ghaf with practical municipal spacing',
    people: 'moderate background foot traffic in realistic local and modern clothing; protect privacy by keeping stranger faces unrecognizable'
  },
  {
    id: 'public-parking',
    label: 'ساحة مواقف عامة',
    prompt: 'a generic public parking area in Saudi Arabia with no named venue',
    placeKind: 'outdoor-parking',
    allowedVehicleStates: ['parked-off', 'parked-engine-on', 'moving'],
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze', 'coastal-humid'],
    surface: 'coarse asphalt with wheel wear, small cracks and faded white bay lines',
    curb: 'concrete wheel stops or slightly raised curbs with realistic edge wear',
    vegetation: 'sparse palms or hardy shade trees only where plausible',
    people: 'scattered distant users in local or modern clothing; no clearly readable faces or plates'
  },
  {
    id: 'villa-driveway',
    label: 'ممر سيارة أمام منزل',
    prompt: 'an ordinary generic Saudi residential driveway with no identifiable address',
    placeKind: 'semi-outdoor-stop',
    allowedVehicleStates: ['parked-off', 'parked-engine-on'],
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze', 'coastal-humid'],
    surface: 'interlocking stone or concrete pavers with tiny color variation, sand in joints and tire contact marks',
    curb: 'shallow driveway transition with slightly raised side curbs',
    vegetation: 'one or two palms, sidr or hardy garden plants, never excessive',
    people: 'normally no strangers close to the camera; any background person remains anonymous'
  },
  {
    id: 'highway-service-road',
    label: 'طريق خدمة',
    prompt: 'a generic Saudi highway service road with no city-defining skyline or landmark',
    placeKind: 'outdoor-road',
    allowedVehicleStates: ['stopped-traffic', 'moving'],
    allowedWeather: ['dry-clear', 'light-dust', 'hot-haze'],
    surface: 'coarse road asphalt with realistic aggregate and worn white markings',
    curb: 'low road edge, shoulder or service-road curb depending on the visible segment',
    vegetation: 'sparse desert planting, palms or hardy trees only where maintained',
    people: 'very limited pedestrian presence; distant figures stay non-identifiable'
  },
  {
    id: 'fuel-station',
    label: 'محطة وقود عامة',
    prompt: 'a generic Saudi fuel-station forecourt with no readable brand and no named location',
    placeKind: 'semi-outdoor-stop',
    allowedVehicleStates: ['parked-off', 'parked-engine-on', 'moving'],
    allowedWeather: ['dry-clear', 'light-dust', 'coastal-humid'],
    surface: 'sealed concrete or asphalt forecourt with subtle tire marks and cleaned spill discoloration',
    curb: 'low safety islands and concrete edges around pumps where visible',
    vegetation: 'minimal or no vegetation close to pumps',
    people: 'a few distant customers or attendants in locally plausible clothing; faces and plates remain unreadable'
  }
]);

export const CAR_WEATHER = freeze([
  { id: 'dry-clear', label: 'جاف وصحو', prompt: 'dry clear Saudi air with restrained atmospheric haze', compatiblePlaces: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'] },
  { id: 'light-dust', label: 'غبار خفيف', prompt: 'light suspended dust that gently lowers distant contrast without turning the scene orange or opaque', compatiblePlaces: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'] },
  { id: 'hot-haze', label: 'وهج حراري خفيف', prompt: 'strong sun with mild heat haze and dry high-contrast air', compatiblePlaces: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'] },
  { id: 'coastal-humid', label: 'رطوبة ساحلية خفيفة', prompt: 'mild coastal humidity with slightly softer distant contrast and realistic glass condensation risk only if temperatures support it', compatiblePlaces: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'] },
  { id: 'indoor-controlled', label: 'بيئة داخلية مضبوطة', prompt: 'indoor parking air with no outdoor weather effects inside the structure', compatiblePlaces: ['indoor-parking'] }
]);

export const CAR_FRAMINGS = freeze([
  { id: 'face-dominant', label: 'وجه قريب', prompt: 'close face-dominant framing' },
  { id: 'head-shoulders', label: 'رأس وكتف', prompt: 'head-and-shoulders framing' },
  { id: 'chest-up', label: 'من الصدر وفوق', prompt: 'chest-up framing' },
  { id: 'upper-torso-context', label: 'أعلى الجذع مع جزء واضح من المقصورة', prompt: 'head-and-upper-torso framing with enough cabin context to establish seating geometry' }
]);

export const CAR_EXPRESSIONS = freeze([
  { id: 'neutral', label: 'هادئ ومحايد', prompt: 'calm neutral expression with relaxed orbicularis oris, natural eyelid tension and small facial asymmetry', muscleRule: 'minimal facial-muscle activation' },
  { id: 'small-smile', label: 'ابتسامة بسيطة', prompt: 'very small natural closed-mouth smile driven mainly by mild zygomatic activation without stretched cheeks or exposed teeth', muscleRule: 'mild bilateral zygomatic activation' },
  { id: 'side-glance', label: 'نظرة جانبية طبيعية', prompt: 'brief natural side glance with eyes and slight head rotation aligned anatomically, no independent or cross-eyed gaze', muscleRule: 'coordinated ocular rotation with slight neck turn' },
  { id: 'focused', label: 'تركيز على الطريق', prompt: 'focused attentive expression with eyes directed to the road and relaxed jaw', muscleRule: 'attention without exaggerated brow contraction' },
  { id: 'mild-surprise', label: 'دهشة خفيفة', prompt: 'subtle mild surprise with a small eyebrow lift and slightly widened eyes, never cartoonish', muscleRule: 'light frontalis activation with restrained eyelid opening' },
  { id: 'tired-natural', label: 'إرهاق طبيعي خفيف', prompt: 'subtle natural tiredness with slightly heavier eyelids and normal skin texture, without sickly stylization', muscleRule: 'mild eyelid heaviness only' }
]);

export const FABRIC_LIBRARY = Object.freeze({
  'cotton-poplin': Object.freeze({ label: 'قطن بوبلين', roughness: 'matte to low-sheen', wrinkle: 'forms medium crisp folds at elbow, lap and seat-belt contact', light: 'diffuse reflection with very restrained highlights', compression: 'compresses visibly where torso meets seat and belt' }),
  'cotton-jersey': Object.freeze({ label: 'قطن جيرسي', roughness: 'soft matte', wrinkle: 'forms soft rounded folds and slight stretch lines', light: 'mostly diffuse absorption with weak broad highlights', compression: 'softly conforms to torso and seat contact' }),
  'linen': Object.freeze({ label: 'كتان', roughness: 'dry matte with visible weave', wrinkle: 'forms irregular sharper creases and keeps memory after compression', light: 'diffuse scattering with small thread-level highlights', compression: 'creases strongly at seated bends and belt contact' }),
  'wool-suiting': Object.freeze({ label: 'صوف بدلات', roughness: 'fine matte-to-satin weave', wrinkle: 'forms controlled drape with soft structured folds', light: 'low controlled sheen that follows weave direction', compression: 'jacket compresses at seatback and lapels deform naturally' }),
  'polyester-blend': Object.freeze({ label: 'خليط صناعي', roughness: 'slightly smoother than cotton', wrinkle: 'fewer but longer folds with some elastic recovery', light: 'slightly stronger broad specular response than cotton', compression: 'recovers shape more than linen after pressure' }),
  'crepe': Object.freeze({ label: 'كريب مطفي', roughness: 'fine matte pebbled surface', wrinkle: 'soft flowing folds with modest crease memory', light: 'absorbs most direct light with restrained thread highlights', compression: 'drapes over seat and gathers naturally at lap' }),
  'chiffon': Object.freeze({ label: 'شيفون', roughness: 'fine semi-translucent weave', wrinkle: 'lightweight layered folds with edge flutter only when airflow exists', light: 'soft transmission and low-intensity highlights without plastic shine', compression: 'layers flatten gently under contact' }),
  'leather': Object.freeze({ label: 'جلد', roughness: 'low-to-medium gloss depending wear', wrinkle: 'bends into broad creases rather than cloth wrinkles', light: 'angle-dependent specular highlights constrained by surface normals', compression: 'forms pressure creases and contact flattening' }),
  'fleece': Object.freeze({ label: 'فليس/سويت', roughness: 'soft high-roughness surface', wrinkle: 'thick rounded folds with volume retention', light: 'strong diffuse response with very weak specular peaks', compression: 'visibly compresses against seat and belt' }),
  'denim': Object.freeze({ label: 'دنيم', roughness: 'coarse matte twill', wrinkle: 'stiff folds at hips and knees with seam tension', light: 'directional weave highlights but overall matte', compression: 'holds shape with localized seat creases' })
});

export const CAR_CLOTHING = freeze([
  { id: 'white-thobe', label: 'ثوب أبيض', prompt: 'a plain realistic white Saudi thobe', fabric: 'cotton-poplin' },
  { id: 'cream-thobe', label: 'ثوب كريمي', prompt: 'a plain cream Saudi thobe', fabric: 'cotton-poplin' },
  { id: 'navy-thobe', label: 'ثوب كحلي', prompt: 'a plain dark navy thobe', fabric: 'polyester-blend' },
  { id: 'black-bisht', label: 'بشت أسود فوق ثوب', prompt: 'a restrained black bisht layered over a plain thobe with realistic edge trim', fabric: 'wool-suiting' },
  { id: 'brown-bisht', label: 'بشت بني فوق ثوب', prompt: 'a restrained brown bisht layered over a plain thobe', fabric: 'wool-suiting' },
  { id: 'navy-suit', label: 'بدلة كحلية', prompt: 'a navy tailored suit with a light shirt', fabric: 'wool-suiting' },
  { id: 'charcoal-suit', label: 'بدلة فحمية', prompt: 'a charcoal tailored suit with natural seated drape', fabric: 'wool-suiting' },
  { id: 'light-blue-shirt', label: 'قميص أزرق فاتح', prompt: 'a light blue casual button shirt', fabric: 'cotton-poplin' },
  { id: 'white-shirt', label: 'قميص أبيض', prompt: 'a plain white button shirt', fabric: 'cotton-poplin' },
  { id: 'linen-shirt', label: 'قميص كتان', prompt: 'a relaxed linen shirt', fabric: 'linen' },
  { id: 'navy-polo', label: 'بولو كحلي', prompt: 'a plain navy pique polo shirt', fabric: 'cotton-jersey' },
  { id: 'black-tshirt', label: 'تيشيرت أسود', prompt: 'a plain black T-shirt', fabric: 'cotton-jersey' },
  { id: 'white-tshirt', label: 'تيشيرت أبيض', prompt: 'a plain white T-shirt', fabric: 'cotton-jersey' },
  { id: 'denim-jeans-shirt', label: 'قميص كاجوال + جينز', prompt: 'a casual shirt with realistic blue denim jeans visible only if framing includes them', fabric: 'denim' },
  { id: 'grey-sweatshirt', label: 'سويت شيرت رمادي', prompt: 'a plain grey sweatshirt', fabric: 'fleece' },
  { id: 'black-hoodie', label: 'هودي أسود', prompt: 'a plain black hoodie with no logo', fabric: 'fleece' },
  { id: 'track-jacket', label: 'جاكيت رياضي', prompt: 'a simple modest sports track jacket with no prominent branding', fabric: 'polyester-blend' },
  { id: 'sports-cap-outfit', label: 'ملابس رياضية + كاب', prompt: 'a modest sports outfit with a plain cap', fabric: 'polyester-blend' },
  { id: 'black-abaya-hijab', label: 'عباءة سوداء + حجاب', prompt: 'a modest black abaya with a simple matching hijab', fabric: 'crepe' },
  { id: 'embroidered-abaya', label: 'عباءة مطرزة محتشمة', prompt: 'a modest dark abaya with restrained embroidery and a matching hijab', fabric: 'crepe' },
  { id: 'neutral-abaya-chiffon-hijab', label: 'عباءة محايدة + حجاب شيفون', prompt: 'a modest neutral-toned abaya with a layered chiffon hijab', fabric: 'chiffon' },
  { id: 'leather-jacket', label: 'جاكيت جلد بسيط', prompt: 'a simple dark leather jacket over modest casual clothing', fabric: 'leather' }
]);

export const CAR_HAIR_PROFILES = freeze([
  { id: 'reference-locked', label: 'تثبيت شعر المرجع', prompt: 'preserve the reference hairline, visible density, strand direction and natural asymmetry exactly', densityLock: true, airflowResponse: 'only visible loose strands may move' },
  { id: 'short-straight', label: 'قصير مستقيم', prompt: 'short naturally straight hair with stable density and individual strand breakup', densityLock: true, airflowResponse: 'minimal movement except tiny edge strands' },
  { id: 'short-wavy', label: 'قصير متموج', prompt: 'short naturally wavy hair with stable density and irregular strand grouping', densityLock: true, airflowResponse: 'small wave tips may shift under real airflow' },
  { id: 'medium-straight', label: 'متوسط مستقيم', prompt: 'medium-length straight hair with stable density and gravity-driven fall', densityLock: true, airflowResponse: 'outer strands may move modestly when airflow reaches them' },
  { id: 'medium-wavy', label: 'متوسط متموج', prompt: 'medium-length wavy hair with stable density, gravity and natural clumping', densityLock: true, airflowResponse: 'waves move as small grouped masses under real airflow' },
  { id: 'curly', label: 'مجعد طبيعي', prompt: 'naturally curly hair with stable curl density and non-uniform curl groups', densityLock: true, airflowResponse: 'curl groups respond elastically to real airflow without changing density' },
  { id: 'covered', label: 'مغطى بالحجاب/غطاء الرأس', prompt: 'hair is physically covered; do not invent visible extra hair beyond plausible edges', densityLock: true, airflowResponse: 'no visible hair motion except any explicitly exposed edge strands' }
]);

export const CAR_HAND_POSES = freeze([
  { id: 'phone-outside-frame', label: 'يد التصوير خارج الكادر', prompt: 'the phone-holding hand, wrist, forearm and elbow remain outside the visible crop; the other hand rests naturally', allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'], allowedCapture: ['handheld-front'] },
  { id: 'lap-relaxed', label: 'اليدان مرتاحتان قرب الحضن', prompt: 'hands rest naturally near the lap with believable elbow support and no floating wrists', allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'], allowedCapture: ['dashboard-fixed', 'center-console-fixed'] },
  { id: 'passenger-relaxed', label: 'يد الراكب مرتاحة طبيعيًا', prompt: 'the passenger keeps both hands naturally relaxed and physically supported, never touching the steering wheel', allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'], allowedCapture: ['dashboard-fixed', 'center-console-fixed'] },
  { id: 'mirror-phone-held', label: 'الهاتف موجه للمرآة والذراع مدعومة', prompt: 'the subject holds the phone in a physically reachable position aimed at the interior mirror; shoulder, elbow and wrist remain anatomically supported', allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic'], allowedCapture: ['rearview-mirror'] },
  { id: 'one-hand-wheel', label: 'يد على المقود ويد مرتاحة', prompt: 'one hand rests naturally on the steering wheel while the other remains physically supported', allowedMotion: ['parked-off', 'parked-engine-on', 'stopped-traffic', 'moving'], allowedCapture: ['dashboard-fixed', 'center-console-fixed'] },
  { id: 'both-hands-wheel', label: 'اليدان على المقود', prompt: 'both hands are naturally placed on the steering wheel with realistic shoulder, elbow and wrist geometry', allowedMotion: ['moving', 'parked-engine-on'], allowedCapture: ['dashboard-fixed'] }
]);

export const CAR_WINDOW_STATES = freeze([
  { id: 'closed', label: 'النوافذ مغلقة', prompt: 'all nearby windows closed; exterior wind cannot move the subject hair or clothing' },
  { id: 'slightly-open', label: 'نافذة مفتوحة قليلًا', prompt: 'one nearby side window slightly open, allowing weak localized airflow only' },
  { id: 'open', label: 'نافذة مفتوحة', prompt: 'one nearby side window open enough for real directional airflow to affect exposed loose hair and light fabric edges' }
]);

export const CAR_CLUTTER_ITEMS = Object.freeze({
  'coffee-cup': Object.freeze({ prompt: 'a takeaway coffee cup seated upright in a real cupholder', material: 'paper/plastic lid', physics: 'must remain supported by the cupholder; liquid surface responds to acceleration but never floats' }),
  'water-bottle': Object.freeze({ prompt: 'a partly filled transparent water bottle in a door pocket or cupholder', material: 'PET plastic and water', physics: 'water has a horizontal gravity level when stationary and sloshes only with acceleration' }),
  'shopping-bag': Object.freeze({ prompt: 'a soft shopping bag resting on the passenger footwell or seat', material: 'paper or thin plastic', physics: 'bag collapses and deforms under gravity and seat/floor contact' }),
  'papers': Object.freeze({ prompt: 'a few ordinary papers or receipts lying on a flat console area', material: 'paper', physics: 'paper lies flat or curls at edges; it may slide only under real acceleration or airflow' }),
  'charging-cable': Object.freeze({ prompt: 'a charging cable connected or resting naturally near the console', material: 'rubberized cable', physics: 'cable sags under gravity with continuous contact and no impossible floating loops' }),
  'sunglasses': Object.freeze({ prompt: 'a pair of sunglasses resting in a tray or console recess', material: 'plastic/metal/glass', physics: 'small hard object must contact a surface and cast/contact-shadow accordingly' }),
  'tissues': Object.freeze({ prompt: 'a small tissue pack placed on the console or door pocket', material: 'soft plastic/paper', physics: 'pack compresses slightly against supporting surfaces' }),
  'personal-pouch': Object.freeze({ prompt: 'a small personal pouch or wallet resting on a seat or console', material: 'fabric or leather', physics: 'object follows gravity, seat slope and contact compression' }),
  'keys': Object.freeze({ prompt: 'a small key set resting in a shallow tray', material: 'metal/plastic', physics: 'keys remain supported, show small localized reflections and may shift only with real acceleration' })
});

export const CAR_CLUTTER_LEVELS = freeze([
  { id: 'clean', label: 'نظيف تمامًا', itemIds: [], prompt: 'clean cabin with no loose personal clutter beyond built-in vehicle controls' },
  { id: 'minimal', label: 'شبه نظيف', itemIds: ['charging-cable'], prompt: 'almost clean cabin with one ordinary supported personal item' },
  { id: 'light', label: 'فوضى خفيفة', itemIds: ['water-bottle', 'charging-cable', 'tissues'], prompt: 'light believable everyday clutter, each item physically supported' },
  { id: 'moderate', label: 'فوضى متوسطة', itemIds: ['coffee-cup', 'water-bottle', 'shopping-bag', 'papers', 'charging-cable', 'sunglasses'], prompt: 'moderate everyday clutter distributed across plausible storage/contact surfaces' },
  { id: 'heavy', label: 'فوضى شديدة', itemIds: ['coffee-cup', 'water-bottle', 'shopping-bag', 'papers', 'charging-cable', 'sunglasses', 'tissues', 'personal-pouch', 'keys'], prompt: 'heavy but physically plausible lived-in clutter; nothing floats, intersects controls or blocks safe driver operation' }
]);

export const CAR_CABIN_MATERIALS = freeze([
  { id: 'ivory-leather-dark-wood', label: 'جلد عاجي + خشب داكن', prompt: 'Ivory perforated leather seats, dark polished wood trim, realistic stitching, pressure creases and low-gloss wear' },
  { id: 'black-leather-aluminum', label: 'جلد أسود + ألمنيوم', prompt: 'black leather seats with brushed aluminum trim, realistic grain and restrained reflections' },
  { id: 'beige-leather-matte', label: 'جلد بيج + تطعيم مطفي', prompt: 'beige leather seating with matte trim and realistic contact compression' },
  { id: 'fabric-practical', label: 'قماش عملي', prompt: 'ordinary woven fabric seats with practical plastic trim and believable texture variation' }
]);

export const CAR_CLUSTER_TYPES = freeze([
  { id: 'period-digital', label: 'عدادات رقمية مناسبة للفترة', prompt: 'period-correct digital instrument cluster with believable luminance and no futuristic graphics' },
  { id: 'modern-digital', label: 'عدادات رقمية حديثة', prompt: 'modern digital instrument cluster with physically plausible emissive brightness' },
  { id: 'analog-hybrid', label: 'عدادات تناظرية/رقمية', prompt: 'analog-hybrid instrument cluster with restrained backlighting' }
]);

export const CAR_ROOFS = freeze([
  { id: 'panoramic', label: 'سقف بانورامي', prompt: 'panoramic glass roof with reflections consistent with the exterior environment' },
  { id: 'solid-headliner', label: 'سقف داخلي عادي', prompt: 'solid fabric headliner with soft diffuse reflectance' }
]);

export const CAR_EXTERNAL_LIGHTING = freeze([
  {
    id: 'day-direct-sun',
    label: 'شمس مباشرة نهارًا',
    prompt: 'strong direct sun entering only through real glazing, with sky fill, hard-edged sun shadows and bright sky reflections on glass',
    allowedTimes: ['day'],
    allowedPlaceKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'hard-sun'
  },
  {
    id: 'day-hazy-sun',
    label: 'شمس قوية مع غبار/وهج خفيف',
    prompt: 'strong daylight softened slightly by dust or haze, still directionally consistent with the sun and sky',
    allowedTimes: ['day'],
    allowedPlaceKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'sun-plus-sky'
  },
  {
    id: 'golden-sun',
    label: 'ضوء غروب منخفض',
    prompt: 'low-angle warm sunlight entering through visible glazing with long directionally consistent shadows and sky reflections',
    allowedTimes: ['golden'],
    allowedPlaceKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'low-sun'
  },
  {
    id: 'night-led-street',
    label: 'LED شارع أبيض',
    prompt: 'white LED street lighting entering through windshield and side glass only from physically visible or plausible fixture directions',
    allowedTimes: ['night'],
    allowedPlaceKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'localized-led'
  },
  {
    id: 'night-sodium-street',
    label: 'إنارة شارع صوديوم دافئة',
    prompt: 'warm sodium-like street lighting entering through real windows with localized amber color cast and plausible falloff',
    allowedTimes: ['night'],
    allowedPlaceKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'localized-sodium'
  },
  {
    id: 'night-parking-led',
    label: 'إنارة مواقف LED',
    prompt: 'ordinary overhead or pole-mounted parking LED light reaching the cabin through actual windows with geometric occlusion by pillars and roof',
    allowedTimes: ['night'],
    allowedPlaceKinds: ['outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'parking-led'
  },
  {
    id: 'underground-led',
    label: 'إنارة مواقف داخلية',
    prompt: 'ceiling-mounted garage LED fixtures producing spatially repeated but individually plausible light pools and reflections',
    allowedTimes: ['day', 'golden', 'night'],
    allowedPlaceKinds: ['indoor-parking'],
    shadowFamily: 'overhead-garage-led'
  },
  {
    id: 'dark-road-ambient',
    label: 'طريق مظلم مع ضوء محيط ضعيف',
    prompt: 'very low exterior ambient light with no invented key light; only weak real spill and sky/background luminance enter the cabin',
    allowedTimes: ['night'],
    allowedPlaceKinds: ['outdoor-road', 'outdoor-parking', 'semi-outdoor-stop'],
    shadowFamily: 'low-ambient'
  }
]);

export const CAR_CABIN_EMITTERS = freeze([
  {
    id: 'dashboard-only',
    label: 'توهج العدادات فقط',
    prompt: 'weak localized instrument-cluster and dashboard emission',
    allowedTimes: ['night', 'golden'],
    falloff: 'local-fast'
  },
  {
    id: 'dashboard-phone',
    label: 'العدادات + شاشة الهاتف',
    prompt: 'weak localized dashboard emission plus a weak nearby phone-screen contribution where the screen physically faces the subject',
    allowedTimes: ['night'],
    falloff: 'local-fast',
    requiresPhoneFacingSubject: true
  },
  {
    id: 'phone-only',
    label: 'شاشة الهاتف فقط',
    prompt: 'weak phone-screen emission on only the nearest facial planes and upper torso',
    allowedTimes: ['night'],
    falloff: 'local-fast',
    requiresPhoneFacingSubject: true
  },
  {
    id: 'dome-light',
    label: 'لمبة السقف',
    prompt: 'real overhead dome light from the cabin fixture with inverse-distance falloff and occlusion by head/roof geometry',
    allowedTimes: ['night', 'golden'],
    falloff: 'local-medium'
  },
  {
    id: 'none',
    label: 'بدون مصدر داخلي إضافي',
    prompt: 'no additional cabin emitter beyond necessary instrument visibility',
    allowedTimes: ['day', 'golden', 'night'],
    falloff: 'none'
  }
]);

export const CAR_EXPOSURE = freeze([
  { id: 'natural', label: 'طبيعي', prompt: 'natural smartphone exposure with realistic cabin contrast and retained shadow noise' },
  { id: 'protect-displays', label: 'حماية الشاشات من الاحتراق', prompt: 'exposure biased to preserve display highlights while allowing darker cabin shadows' },
  { id: 'slightly-bright', label: 'أفتح قليلًا', prompt: 'slightly brighter exposure without inventing illumination on surfaces that received no light' }
]);

export const CAR_HDR = freeze([
  { id: 'off', label: 'HDR مغلق', prompt: 'HDR disabled; preserve the captured single-exposure contrast limits' },
  { id: 'auto-realistic', label: 'HDR تلقائي واقعي', prompt: 'realistic computational HDR that merges only captured signal, protects highlights and never relights unilluminated surfaces' },
  { id: 'mild', label: 'HDR خفيف', prompt: 'mild computational HDR with restrained local tone mapping and no haloing' }
]);

export const CAR_WB = freeze([
  { id: 'auto', label: 'Auto واقعي', prompt: 'realistic automatic white balance with residual mixed-light color casts' },
  { id: 'warm', label: 'دافئ قليلًا', prompt: 'slightly warm balance while preserving real source color differences' },
  { id: 'cool', label: 'بارد قليلًا', prompt: 'slightly cool balance while preserving actual source colors' }
]);

export const CAR_PHYSICS_MODES = freeze([
  { id: 'strict', label: 'صارم · يمنع التعارض', prompt: 'block physically inconsistent combinations' },
  { id: 'auto', label: 'تلقائي · ينبه ولا يمنع', prompt: 'report deterministic physical conflicts without blocking output' }
]);

export const CAR_DEFAULT_STATE = Object.freeze({
  initialRequest: '',
  referenceAttached: false,
  referenceRole: 'identity-only',
  vehicleProfile: 'l494-2017-white',
  vehicleState: 'parked-engine-on',
  seat: 'driver-left',
  captureMode: 'handheld-front',
  cameraLens: 'front-21',
  colorProfile: 'front-natural',
  lowLightProcessing: 'front-night-balanced',
  time: 'night',
  place: 'public-parking',
  weather: 'dry-clear',
  physicsMode: 'strict',
  apparentAge: 35,
  expression: 'neutral',
  clothing: 'navy-polo',
  hairProfile: 'reference-locked',
  handPose: 'phone-outside-frame',
  framing: 'chest-up',
  focalLength: 21,
  aperture: 2.0,
  distance: 45,
  yaw: 0,
  pitch: 0,
  roll: 2,
  cabinMaterial: 'ivory-leather-dark-wood',
  clusterType: 'period-digital',
  roofType: 'panoramic',
  windowState: 'closed',
  clutterLevel: 'light',
  externalLight: 'night-parking-led',
  cabinEmitter: 'dashboard-only',
  exposure: 'natural',
  hdr: 'auto-realistic',
  whiteBalance: 'auto',
  notes: ''
});

export const CAR_CATALOG = Object.freeze({
  vehicleProfile: CAR_VEHICLE_PROFILES,
  vehicleState: CAR_STATES,
  seat: CAR_SEATS,
  captureMode: CAR_CAPTURE_MODES,
  cameraLens: CAR_CAMERA_LENSES,
  colorProfile: CAR_COLOR_PROFILES,
  lowLightProcessing: CAR_LOW_LIGHT_PROCESSING,
  time: CAR_TIMES,
  place: CAR_PLACES,
  weather: CAR_WEATHER,
  physicsMode: CAR_PHYSICS_MODES,
  expression: CAR_EXPRESSIONS,
  clothing: CAR_CLOTHING,
  hairProfile: CAR_HAIR_PROFILES,
  handPose: CAR_HAND_POSES,
  framing: CAR_FRAMINGS,
  cabinMaterial: CAR_CABIN_MATERIALS,
  clusterType: CAR_CLUSTER_TYPES,
  roofType: CAR_ROOFS,
  windowState: CAR_WINDOW_STATES,
  clutterLevel: CAR_CLUTTER_LEVELS,
  externalLight: CAR_EXTERNAL_LIGHTING,
  cabinEmitter: CAR_CABIN_EMITTERS,
  exposure: CAR_EXPOSURE,
  hdr: CAR_HDR,
  whiteBalance: CAR_WB
});

const option = (field, id) => (CAR_CATALOG[field] || []).find((item) => item.id === id);
const hasAny = (text, terms) => terms.some((term) => text.includes(term));

export function getCameraOptic(id) {
  return CAR_CAMERA_LENSES.find((item) => item.id === id) || null;
}

export function getFabricProfile(clothingId) {
  const clothing = CAR_CLOTHING.find((item) => item.id === clothingId);
  return clothing ? FABRIC_LIBRARY[clothing.fabric] || null : null;
}

export function getClutterItems(levelId) {
  const level = CAR_CLUTTER_LEVELS.find((item) => item.id === levelId);
  return Object.freeze((level?.itemIds || []).map((id) => Object.freeze({ id, ...CAR_CLUTTER_ITEMS[id] })));
}

export function normalizeIntentText(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isCarOptionCompatible(field, id, state = CAR_DEFAULT_STATE) {
  const item = option(field, id);
  if (!item) return false;
  const vehicleState = state.vehicleState || CAR_DEFAULT_STATE.vehicleState;
  const captureMode = state.captureMode || CAR_DEFAULT_STATE.captureMode;
  const time = state.time || CAR_DEFAULT_STATE.time;
  const lens = getCameraOptic(state.cameraLens || CAR_DEFAULT_STATE.cameraLens);
  const place = option('place', state.place || CAR_DEFAULT_STATE.place);

  if (field === 'captureMode') {
    if (!item.allowedMotion.includes(vehicleState)) return false;
    if (lens && !item.allowedCameraSides.includes(lens.side)) return false;
  }
  if (field === 'cameraLens') {
    if (!item.allowedCapture.includes(captureMode)) return false;
  }
  if (field === 'colorProfile') {
    if (lens && !item.allowedCameraSides.includes(lens.side)) return false;
  }
  if (field === 'lowLightProcessing') {
    if (lens && !item.allowedCameraSides.includes(lens.side)) return false;
    if (!item.allowedTimes.includes(time)) return false;
    if (item.requiresStationary && vehicleState === 'moving') return false;
  }
  if (field === 'handPose') {
    if (!item.allowedMotion.includes(vehicleState) || !item.allowedCapture.includes(captureMode)) return false;
    const seat = option('seat', state.seat || CAR_DEFAULT_STATE.seat);
    if (item.id === 'passenger-relaxed' && seat?.role !== 'passenger') return false;
    if (['one-hand-wheel', 'both-hands-wheel'].includes(item.id) && seat?.role !== 'driver') return false;
  }
  if (field === 'place') {
    if (!item.allowedVehicleStates.includes(vehicleState)) return false;
  }
  if (field === 'weather') {
    if (place && !place.allowedWeather.includes(item.id)) return false;
    if (place && !item.compatiblePlaces.includes(place.placeKind)) return false;
  }
  if (field === 'externalLight') {
    if (!item.allowedTimes.includes(time)) return false;
    if (place && !item.allowedPlaceKinds.includes(place.placeKind)) return false;
  }
  if (field === 'cabinEmitter') {
    if (!item.allowedTimes.includes(time)) return false;
  }
  return true;
}

export function analyzeCarSelfieIntent(request = '') {
  const text = normalizeIntentText(request);
  const recommended = { ...CAR_DEFAULT_STATE };
  const tags = [];

  if (hasAny(text, ['ليل', 'ليلي', 'night'])) {
    recommended.time = 'night';
    tags.push('night');
  } else if (hasAny(text, ['غروب', 'golden', 'sunset'])) {
    recommended.time = 'golden';
    recommended.externalLight = 'golden-sun';
    recommended.cabinEmitter = 'none';
    tags.push('golden');
  } else if (hasAny(text, ['نهار', 'صباح', 'day', 'morning'])) {
    recommended.time = 'day';
    recommended.externalLight = 'day-direct-sun';
    recommended.cabinEmitter = 'none';
    recommended.lowLightProcessing = 'standard';
    tags.push('day');
  }

  if (hasAny(text, ['يسوق', 'قيادة', 'يمشي بالسيارة', 'moving', 'driving', 'drive'])) {
    recommended.vehicleState = 'moving';
    recommended.captureMode = 'dashboard-fixed';
    recommended.handPose = 'both-hands-wheel';
    recommended.place = 'highway-service-road';
    recommended.lowLightProcessing = 'standard';
    tags.push('moving');
  } else if (hasAny(text, ['متوقف', 'واقف', 'parked', 'stationary'])) {
    recommended.vehicleState = 'parked-engine-on';
    tags.push('parked');
  }

  if (hasAny(text, ['مرآة', 'المراية', 'mirror'])) {
    recommended.captureMode = 'rearview-mirror';
    recommended.vehicleState = 'parked-engine-on';
    recommended.handPose = 'mirror-phone-held';
    recommended.cameraLens = 'rear-main-23';
    recommended.colorProfile = 'leica-authentic';
    recommended.lowLightProcessing = recommended.time === 'night' ? 'rear-super-night-2' : 'standard';
    tags.push('mirror');
  } else if (hasAny(text, ['75mm', '75 مم', 'مقربة', 'telephoto', 'tele'])) {
    recommended.captureMode = 'dashboard-fixed';
    recommended.cameraLens = 'rear-tele-70';
    recommended.colorProfile = 'leica-authentic';
    recommended.lowLightProcessing = recommended.time === 'night' && recommended.vehicleState !== 'moving' ? 'rear-super-night-2' : 'standard';
    recommended.distance = 105;
    recommended.framing = 'face-dominant';
    tags.push('75→70-official');
  } else if (hasAny(text, ['100mm', '100 مم', 'ultra tele'])) {
    recommended.captureMode = 'dashboard-fixed';
    recommended.cameraLens = 'rear-ultratele-100';
    recommended.colorProfile = 'leica-authentic';
    recommended.lowLightProcessing = recommended.time === 'night' && recommended.vehicleState !== 'moving' ? 'rear-super-night-2' : 'standard';
    recommended.distance = 120;
    recommended.framing = 'face-dominant';
    tags.push('100mm');
  } else if (hasAny(text, ['23mm', '23 مم', 'leica', 'ليكا', 'rear camera', 'كاميرا خلفية'])) {
    recommended.captureMode = 'dashboard-fixed';
    recommended.cameraLens = 'rear-main-23';
    recommended.colorProfile = hasAny(text, ['vibrant', 'نابض']) ? 'leica-vibrant' : 'leica-authentic';
    recommended.lowLightProcessing = recommended.time === 'night' && recommended.vehicleState !== 'moving' ? 'rear-super-night-2' : 'standard';
    tags.push('rear-23');
  } else if (hasAny(text, ['كاميرا أمامية', 'front camera', 'سيلفي', 'selfie']) && recommended.vehicleState !== 'moving') {
    recommended.captureMode = 'handheld-front';
    recommended.cameraLens = 'front-21';
    recommended.colorProfile = 'front-natural';
    recommended.lowLightProcessing = recommended.time === 'night' ? 'front-night-balanced' : 'standard';
    recommended.handPose = 'phone-outside-frame';
    recommended.distance = 45;
    tags.push('front-selfie');
  }

  if (hasAny(text, ['vibrant', 'نابض'])) {
    if (recommended.cameraLens.startsWith('rear-')) recommended.colorProfile = 'leica-vibrant';
    tags.push('vibrant');
  } else if (hasAny(text, ['authentic', 'أوثنتك', 'اصيل', 'أصلي'])) {
    if (recommended.cameraLens.startsWith('rear-')) recommended.colorProfile = 'leica-authentic';
    tags.push('authentic');
  }

  if (hasAny(text, ['رنج', 'رينج', 'range rover', 'l494', '2017'])) {
    recommended.vehicleProfile = 'l494-2017-white';
    recommended.cabinMaterial = 'ivory-leather-dark-wood';
    recommended.clusterType = 'period-digital';
    tags.push('l494');
  }

  if (hasAny(text, ['ثوب أبيض', 'white thobe'])) {
    recommended.clothing = 'white-thobe';
    tags.push('white-thobe');
  } else if (hasAny(text, ['بدلة', 'suit'])) {
    recommended.clothing = 'navy-suit';
    tags.push('suit');
  } else if (hasAny(text, ['عباءة', 'abaya'])) {
    recommended.clothing = hasAny(text, ['مطرز', 'embroidered']) ? 'embroidered-abaya' : 'black-abaya-hijab';
    recommended.hairProfile = 'covered';
    tags.push('abaya');
  } else if (hasAny(text, ['تيشيرت أسود', 'black t-shirt', 'black tshirt'])) {
    recommended.clothing = 'black-tshirt';
    tags.push('black-tshirt');
  } else if (hasAny(text, ['كتان', 'linen'])) {
    recommended.clothing = 'linen-shirt';
    tags.push('linen');
  } else if (hasAny(text, ['سويت', 'sweatshirt'])) {
    recommended.clothing = 'grey-sweatshirt';
    tags.push('sweatshirt');
  }

  if (hasAny(text, ['بدون ابتسامة', 'محايد', 'neutral', 'no smile'])) {
    recommended.expression = 'neutral';
    tags.push('neutral');
  } else if (hasAny(text, ['ابتسامة بسيطة', 'small smile'])) {
    recommended.expression = 'small-smile';
    tags.push('small-smile');
  } else if (hasAny(text, ['نظرة جانبية', 'side glance'])) {
    recommended.expression = 'side-glance';
    tags.push('side-glance');
  } else if (hasAny(text, ['تركيز', 'focused'])) {
    recommended.expression = 'focused';
    tags.push('focused');
  } else if (hasAny(text, ['دهشة', 'surprise'])) {
    recommended.expression = 'mild-surprise';
    tags.push('mild-surprise');
  }

  if (hasAny(text, ['شارع سكني', 'residential'])) {
    recommended.place = 'quiet-residential-street';
    tags.push('residential');
  } else if (hasAny(text, ['ساحلي', 'coastal'])) {
    recommended.place = 'coastal-road';
    recommended.weather = 'coastal-humid';
    tags.push('coastal');
  } else if (hasAny(text, ['صحراوي', 'desert'])) {
    recommended.place = 'desert-road';
    recommended.weather = 'light-dust';
    tags.push('desert');
  } else if (hasAny(text, ['تحت الأرض', 'underground'])) {
    recommended.place = 'underground-parking';
    recommended.weather = 'indoor-controlled';
    recommended.externalLight = 'underground-led';
    tags.push('underground');
  } else if (hasAny(text, ['مقهى', 'كافيه', 'cafe'])) {
    recommended.place = 'local-cafe-front';
    tags.push('cafe');
  } else if (hasAny(text, ['تجاري', 'commercial'])) {
    recommended.place = 'commercial-district-evening';
    tags.push('commercial');
  } else if (hasAny(text, ['موقف', 'parking'])) {
    recommended.place = 'public-parking';
    tags.push('parking');
  }

  if (hasAny(text, ['غبار', 'dust'])) {
    recommended.weather = 'light-dust';
    tags.push('dust');
  } else if (hasAny(text, ['رطوبة', 'humid'])) {
    recommended.weather = 'coastal-humid';
    tags.push('humid');
  }

  if (hasAny(text, ['نافذة مفتوحة', 'window open'])) {
    recommended.windowState = 'open';
    tags.push('window-open');
  } else if (hasAny(text, ['نافذة مفتوحة قليل', 'slightly open'])) {
    recommended.windowState = 'slightly-open';
    tags.push('window-slight');
  }

  if (hasAny(text, ['نظيف تمام', 'clean cabin'])) {
    recommended.clutterLevel = 'clean';
    tags.push('clean');
  } else if (hasAny(text, ['فوضى شديدة', 'heavy clutter'])) {
    recommended.clutterLevel = 'heavy';
    tags.push('heavy-clutter');
  } else if (hasAny(text, ['فوضى', 'clutter'])) {
    recommended.clutterLevel = 'light';
    tags.push('light-clutter');
  }

  const lens = getCameraOptic(recommended.cameraLens);
  if (lens && !lens.allowedCapture.includes(recommended.captureMode)) {
    recommended.captureMode = lens.side === 'front' ? 'handheld-front' : 'dashboard-fixed';
  }
  if (recommended.vehicleState === 'moving') {
    recommended.captureMode = 'dashboard-fixed';
    recommended.handPose = 'both-hands-wheel';
    recommended.lowLightProcessing = 'standard';
    if (recommended.cameraLens === 'front-21') recommended.colorProfile = 'front-natural';
  }
  const place = option('place', recommended.place);
  if (place && !place.allowedVehicleStates.includes(recommended.vehicleState)) {
    recommended.place = recommended.vehicleState === 'moving' ? 'highway-service-road' : 'public-parking';
  }
  const finalPlace = option('place', recommended.place);
  if (finalPlace && !finalPlace.allowedWeather.includes(recommended.weather)) {
    recommended.weather = finalPlace.allowedWeather[0];
  }
  const ext = option('externalLight', recommended.externalLight);
  if (!ext || !ext.allowedTimes.includes(recommended.time) || (finalPlace && !ext.allowedPlaceKinds.includes(finalPlace.placeKind))) {
    if (finalPlace?.placeKind === 'indoor-parking') recommended.externalLight = 'underground-led';
    else if (recommended.time === 'day') recommended.externalLight = 'day-direct-sun';
    else if (recommended.time === 'golden') recommended.externalLight = 'golden-sun';
    else recommended.externalLight = finalPlace?.placeKind === 'outdoor-parking' ? 'night-parking-led' : 'night-led-street';
  }
  if (recommended.time === 'day') recommended.cabinEmitter = 'none';

  return Object.freeze({
    normalized: text,
    tags: Object.freeze([...tags]),
    recommended: Object.freeze({ ...recommended })
  });
}
