const freezeOptions = (items) => Object.freeze(items.map((item) => Object.freeze({ ...item })));

export const REFERENCE_ROLES = freezeOptions([
  { id: 'none', label: 'بدون مرجع', prompt: 'do not use a reference image' },
  { id: 'identity-only', label: 'هوية الشخص فقط', prompt: 'use the attached reference only for identity; preserve facial identity and apparent age without copying pose, clothing, background or lighting' },
  { id: 'identity-appearance', label: 'الهوية + المظهر', prompt: 'use the attached reference for identity and visible appearance only; do not inherit background or camera geometry' },
  { id: 'full-visual', label: 'مرجع بصري واسع', prompt: 'use the attached image as a broad visual reference while obeying all explicit structured constraints' }
]);

export const CAPTURE_TYPES = freezeOptions([
  { id: 'front-selfie', label: 'سيلفي بالكاميرا الأمامية', prompt: 'subject-held smartphone front-camera selfie', focalRangeMm: [18, 35], distanceRangeCm: [25, 90], maxAbsYawDeg: 45, maxAbsPitchDeg: 30, maxAbsRollDeg: 12 },
  { id: 'rear-camera', label: 'كاميرا هاتف خلفية', prompt: 'smartphone rear-camera photograph', focalRangeMm: [13, 120], distanceRangeCm: [30, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 20 },
  { id: 'third-person', label: 'تصوير شخص ثالث', prompt: 'third-person photograph taken by another person', focalRangeMm: [18, 120], distanceRangeCm: [50, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 20 },
  { id: 'mirror-selfie', label: 'سيلفي مرآة', prompt: 'mirror selfie photographed with a smartphone', focalRangeMm: [18, 35], distanceRangeCm: [70, 500], maxAbsYawDeg: 60, maxAbsPitchDeg: 35, maxAbsRollDeg: 15 },
  { id: 'candid', label: 'لقطة عفوية', prompt: 'candid spontaneous photograph', focalRangeMm: [20, 85], distanceRangeCm: [80, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 20 },
  { id: 'cctv', label: 'كاميرا مراقبة ثابتة', prompt: 'fixed CCTV-style surveillance-camera frame', focalRangeMm: [20, 120], distanceRangeCm: [200, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 10 }
]);

export const TIMES = freezeOptions([
  { id: 'morning', label: 'الصباح', prompt: 'morning' },
  { id: 'noon', label: 'الظهر', prompt: 'noon' },
  { id: 'afternoon', label: 'العصر', prompt: 'afternoon' },
  { id: 'sunset', label: 'الغروب', prompt: 'sunset' },
  { id: 'evening', label: 'المساء بعد الغروب', prompt: 'evening after sunset' },
  { id: 'night', label: 'الليل', prompt: 'night' }
]);

export const LOCATIONS = freezeOptions([
  { id: 'commercial-street', label: 'شارع تجاري سعودي عادي', prompt: 'an ordinary generic Saudi commercial street', environment: 'outdoor' },
  { id: 'side-street', label: 'شارع فرعي هادئ', prompt: 'a quiet generic Saudi side street', environment: 'outdoor' },
  { id: 'residential-street', label: 'شارع سكني', prompt: 'an ordinary generic Saudi residential street', environment: 'outdoor' },
  { id: 'villa-neighborhood', label: 'حي فلل', prompt: 'a generic Saudi villa neighborhood', environment: 'outdoor' },
  { id: 'villa-entrance', label: 'مدخل فيلا', prompt: 'a generic Saudi residential villa entrance', environment: 'semi-outdoor' },
  { id: 'cafeteria-front', label: 'أمام كافتيريا شعبية', prompt: 'outside a modest generic Saudi roadside cafeteria', environment: 'semi-outdoor' },
  { id: 'local-shops', label: 'منطقة محلات وخدمات', prompt: 'a generic Saudi local shops and services strip', environment: 'outdoor' },
  { id: 'seafront', label: 'واجهة بحرية عامة', prompt: 'a generic Saudi seafront area with no recognizable landmark', environment: 'outdoor' },
  { id: 'desert-edge', label: 'طرف صحراء قريب من العمران', prompt: 'a generic Saudi desert-edge environment near ordinary development', environment: 'outdoor' },
  { id: 'roof-terrace', label: 'سطح منزل بسيط', prompt: 'a generic Saudi residential roof terrace', environment: 'outdoor' },
  { id: 'modern-majlis', label: 'مجلس عربي حديث', prompt: 'a generic modern Saudi majlis interior', environment: 'indoor' },
  { id: 'living-room', label: 'غرفة معيشة منزلية', prompt: 'a generic Saudi home living room', environment: 'indoor' },
  { id: 'bedroom', label: 'غرفة نوم منزلية', prompt: 'a generic Saudi home bedroom', environment: 'indoor' },
  { id: 'office-interior', label: 'مكتب عمل', prompt: 'a generic Saudi office interior', environment: 'indoor' },
  { id: 'restaurant-interior', label: 'داخل مطعم محلي', prompt: 'inside a generic local restaurant in Saudi Arabia', environment: 'indoor' },
  { id: 'cafe-interior', label: 'داخل مقهى محلي', prompt: 'inside a generic local cafe in Saudi Arabia', environment: 'indoor' },
  { id: 'small-office-lobby', label: 'لوبي مكتب صغير', prompt: 'a generic small Saudi office lobby', environment: 'indoor' },
  { id: 'building-corridor', label: 'ممر داخل مبنى', prompt: 'a generic indoor corridor in a Saudi building', environment: 'indoor' },
  { id: 'home-entry-hall', label: 'مدخل منزل داخلي', prompt: 'a generic Saudi home entry hall', environment: 'indoor' },
  { id: 'garden-courtyard', label: 'فناء أو حديقة منزلية', prompt: 'a generic Saudi residential courtyard garden', environment: 'semi-outdoor' },
  { id: 'custom', label: 'مخصص', prompt: null, environment: 'unknown' }
]);

export const RATIOS = freezeOptions([
  { id: '9:16', label: '9:16 عمودي', prompt: '9:16 vertical' },
  { id: '4:5', label: '4:5 عمودي', prompt: '4:5 vertical' },
  { id: '1:1', label: '1:1 مربع', prompt: '1:1 square' },
  { id: '3:2', label: '3:2 أفقي', prompt: '3:2 landscape' },
  { id: '16:9', label: '16:9 أفقي', prompt: '16:9 landscape' }
]);

export const FRAMINGS = freezeOptions([
  { id: 'face-dominant', label: 'الوجه هو المسيطر', prompt: 'close face-dominant framing', verticalCoverageCm: [25, 55] },
  { id: 'close-head-shoulders', label: 'رأس وكتف', prompt: 'close head-and-shoulders framing', verticalCoverageCm: [35, 70] },
  { id: 'chest-up', label: 'من الصدر وفوق', prompt: 'chest-up framing', verticalCoverageCm: [50, 105] },
  { id: 'head-upper-torso', label: 'الرأس وأعلى الجذع', prompt: 'head-and-upper-torso framing', verticalCoverageCm: [60, 125] },
  { id: 'half-body', label: 'نصف جسم', prompt: 'half-body framing', verticalCoverageCm: [80, 175] },
  { id: 'waist-up', label: 'من الخصر وفوق', prompt: 'waist-up framing', verticalCoverageCm: [95, 190] },
  { id: 'three-quarter-body', label: 'ثلاثة أرباع الجسم', prompt: 'three-quarter-body framing', verticalCoverageCm: [125, 220] },
  { id: 'full-body', label: 'كامل الجسم', prompt: 'full-body framing', verticalCoverageCm: [165, 300] },
  { id: 'environmental-portrait', label: 'بورتريه بيئي واسع', prompt: 'environmental portrait framing with substantial scene context', verticalCoverageCm: [220, 650] }
]);

export const POSES = freezeOptions([
  { id: 'natural-standing', label: 'واقف بشكل طبيعي', prompt: 'standing naturally', posture: 'standing' },
  { id: 'natural-seated', label: 'جالس بشكل طبيعي', prompt: 'seated naturally', posture: 'seated' },
  { id: 'walking', label: 'يمشي', prompt: 'walking naturally', posture: 'moving' },
  { id: 'casual-lean', label: 'متكئ بشكل عفوي', prompt: 'casually leaning', posture: 'standing' },
  { id: 'waiting', label: 'واقف كأنه ينتظر', prompt: 'standing as if casually waiting', posture: 'standing' },
  { id: 'one-hand-pocket', label: 'يد واحدة في الجيب', prompt: 'standing naturally with one hand in a pocket', posture: 'standing' },
  { id: 'arms-relaxed', label: 'الذراعان مرتاحان', prompt: 'relaxed posture with naturally placed arms and hands', posture: 'either' },
  { id: 'custom', label: 'مخصص', prompt: null, posture: 'unknown' }
]);

export const EXPRESSIONS = freezeOptions([
  { id: 'neutral', label: 'هادئ ومحايد', prompt: 'calm neutral expression with a relaxed closed mouth' },
  { id: 'small-smile', label: 'ابتسامة بسيطة بدون أسنان', prompt: 'a very small natural closed-mouth smile' },
  { id: 'focused', label: 'مركز وهادئ', prompt: 'a focused calm expression' },
  { id: 'thoughtful', label: 'متأمل', prompt: 'a natural thoughtful expression' },
  { id: 'candid-surprise', label: 'مفاجأة خفيفة عفوية', prompt: 'a subtle candid moment of mild surprise' }
]);

export const HAIR = freezeOptions([
  { id: 'reference', label: 'نفس المرجع', prompt: 'preserve the hairstyle and hairline from the identity reference if attached' },
  { id: 'short-textured', label: 'قصير بتكتشر طبيعي', prompt: 'short naturally textured hair' },
  { id: 'side-swept', label: 'مسرح للجانب', prompt: 'natural side-swept hair' },
  { id: 'short-wavy', label: 'قصير متموج', prompt: 'short naturally wavy hair' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

export const BEARDS = freezeOptions([
  { id: 'reference', label: 'نفس المرجع', prompt: 'preserve the beard and moustache pattern from the identity reference if attached, including natural density gaps' },
  { id: 'clean-shaven', label: 'حليق', prompt: 'clean-shaven face' },
  { id: 'short-beard', label: 'لحية قصيرة طبيعية', prompt: 'short natural beard with non-uniform density' },
  { id: 'stubble', label: 'ذقن خفيف', prompt: 'natural short stubble' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

export const GLASSES = freezeOptions([
  { id: 'reference', label: 'نفس المرجع', prompt: 'preserve the same eyeglasses from the identity reference if present' },
  { id: 'none', label: 'بدون نظارة', prompt: 'no eyeglasses' },
  { id: 'black-rectangular', label: 'إطار أسود مستطيل', prompt: 'black full-rim rectangular eyeglasses' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

export const CLOTHING = freezeOptions([
  { id: 'white-thobe', label: 'ثوب أبيض', prompt: 'a realistic plain white Saudi thobe' },
  { id: 'navy-thobe', label: 'ثوب كحلي', prompt: 'a realistic plain navy Saudi thobe' },
  { id: 'black-tshirt', label: 'تيشيرت أسود سادة', prompt: 'a plain black cotton T-shirt' },
  { id: 'white-tshirt', label: 'تيشيرت أبيض سادة', prompt: 'a plain white cotton T-shirt' },
  { id: 'navy-shirt', label: 'قميص كحلي', prompt: 'a plain navy casual shirt' },
  { id: 'light-blue-shirt', label: 'قميص أزرق فاتح', prompt: 'a light-blue cotton poplin shirt' },
  { id: 'linen-shirt', label: 'قميص كتان', prompt: 'a natural linen shirt with realistic wrinkles' },
  { id: 'polo', label: 'بولو سادة', prompt: 'a plain pique polo shirt' },
  { id: 'navy-suit', label: 'بدلة كحلية بدون ربطة', prompt: 'a navy suit with an open-collar light shirt and no tie' },
  { id: 'sweatshirt', label: 'سويت شيرت', prompt: 'a plain casual sweatshirt' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

export const LIGHT_SOURCES = freezeOptions([
  { id: 'window-daylight', label: 'ضوء نهار من نافذة/فتحة', prompt: 'natural daylight entering through real openings', allowedTimes: ['morning','noon','afternoon'], allowedEnvironments: ['indoor','semi-outdoor'], directions: ['front','side','back-side'], falloffs: ['broad','mixed-local'] },
  { id: 'open-sky-daylight', label: 'ضوء نهار خارجي', prompt: 'natural outdoor daylight from the open sky and sun appropriate to the stated time', allowedTimes: ['morning','noon','afternoon'], allowedEnvironments: ['outdoor','semi-outdoor'], directions: ['front','side','back-side','top-side'], falloffs: ['broad'] },
  { id: 'sunset-sky', label: 'ضوء غروب', prompt: 'physical sunset sky light with directional low-angle sunlight only where visible', allowedTimes: ['sunset'], allowedEnvironments: ['outdoor','semi-outdoor'], directions: ['front','side','back-side'], falloffs: ['broad'] },
  { id: 'room-ceiling', label: 'إنارة سقف منزلية', prompt: 'ordinary practical ceiling lighting from visible or plausible fixtures', allowedTimes: ['morning','noon','afternoon','sunset','evening','night'], allowedEnvironments: ['indoor'], directions: ['top','top-side','mixed'], falloffs: ['broad','mixed-local'] },
  { id: 'warm-lamp', label: 'مصباح داخلي دافئ', prompt: 'a nearby warm practical lamp acting as a local physical light source', allowedTimes: ['sunset','evening','night'], allowedEnvironments: ['indoor'], directions: ['side','front-side'], falloffs: ['local-fast'] },
  { id: 'street-lights', label: 'إنارة شارع ليلية', prompt: 'ordinary street lighting from physically located lamps', allowedTimes: ['evening','night'], allowedEnvironments: ['outdoor','semi-outdoor'], directions: ['top-side','side','mixed'], falloffs: ['mixed-local'] },
  { id: 'storefront-spill', label: 'تسرب ضوء واجهة محل', prompt: 'localized spill from a real nearby storefront or doorway', allowedTimes: ['evening','night'], allowedEnvironments: ['outdoor','semi-outdoor'], directions: ['side','front-side'], falloffs: ['local-fast','mixed-local'] },
  { id: 'phone-screen', label: 'ضوء شاشة هاتف ضعيف', prompt: 'weak nearby phone-screen emission as a local light source', allowedTimes: ['evening','night'], allowedEnvironments: ['indoor','outdoor','semi-outdoor'], directions: ['front-low'], falloffs: ['local-fast'] },
  { id: 'ambient-night', label: 'إضاءة ليلية محيطية', prompt: 'low-level physically plausible ambient night illumination from distant practical sources', allowedTimes: ['evening','night'], allowedEnvironments: ['outdoor','semi-outdoor'], directions: ['mixed'], falloffs: ['mixed-local'] },
  { id: 'custom', label: 'مخصص', prompt: null, allowedTimes: null, allowedEnvironments: null, directions: null, falloffs: null }
]);

export const LIGHT_DIRECTIONS = freezeOptions([
  { id: 'front', label: 'أمامي', prompt: 'predominantly frontal' },
  { id: 'front-side', label: 'أمامي جانبي', prompt: 'front-side' },
  { id: 'side', label: 'جانبي', prompt: 'side-lit' },
  { id: 'back-side', label: 'خلفي جانبي', prompt: 'back-side' },
  { id: 'top', label: 'علوي', prompt: 'overhead' },
  { id: 'top-side', label: 'علوي جانبي', prompt: 'top-side' },
  { id: 'front-low', label: 'أمامي منخفض', prompt: 'low frontal' },
  { id: 'mixed', label: 'مختلط منطقي', prompt: 'mixed from the stated practical sources' }
]);

export const LIGHT_FALLOFF = freezeOptions([
  { id: 'broad', label: 'واسع وبطيء', prompt: 'broad illumination with gradual distance falloff' },
  { id: 'mixed-local', label: 'مزيج محيطي ومحلي', prompt: 'mixed ambient and local falloff with believable distance loss' },
  { id: 'local-fast', label: 'محلي سريع', prompt: 'strong inverse-distance falloff; nearby surfaces receive most of the light and distant surfaces become progressively darker' }
]);

export const EXPOSURE = freezeOptions([
  { id: 'natural', label: 'طبيعي', prompt: 'natural exposure with protected highlights and believable shadow noise' },
  { id: 'slightly-dark', label: 'أغمق قليلًا', prompt: 'slightly dark exposure while preserving source-driven lighting relationships' },
  { id: 'slightly-bright', label: 'أفتح قليلًا', prompt: 'slightly brighter exposure without inventing illumination on unlit surfaces' }
]);

export const HDR = freezeOptions([
  { id: 'off', label: 'بدون HDR واضح', prompt: 'no obvious HDR look; limited realistic phone dynamic range' },
  { id: 'mild', label: 'HDR خفيف', prompt: 'mild computational HDR only to recover captured signal, never to create light' }
]);

export const WHITE_BALANCE = freezeOptions([
  { id: 'auto-realistic', label: 'Auto واقعي', prompt: 'realistic automatic white balance with mild residual color cast' },
  { id: 'warm', label: 'دافئ قليلًا', prompt: 'slightly warm white balance while retaining source colors' },
  { id: 'cool', label: 'بارد قليلًا', prompt: 'slightly cool white balance while retaining source colors' }
]);

export const MODULE_LEVELS = freezeOptions([
  { id: 'off', label: 'إيقاف' },
  { id: 'auto', label: 'تلقائي' },
  { id: 'strict', label: 'صارم' }
]);

export const REALISM_MODULES = Object.freeze([
  { id: 'identity', label: 'Identity Lock', prompt: 'preserve identity geometry, apparent age, natural asymmetry, skin tone, hairline and facial-hair density; no beautification, de-aging or face reshaping' },
  { id: 'camera', label: 'Camera Geometry', prompt: 'respect the stated focal length, subject distance, yaw, pitch, roll and framing as the camera-geometry authority' },
  { id: 'lighting', label: 'Physical Light Causality', prompt: 'only physical sources may illuminate surfaces; exposure, ISO, HDR and computational processing cannot create light that did not reach the sensor' },
  { id: 'anatomy', label: 'Human Anatomy', prompt: 'correct anatomy, joint ranges, hand structure, contact points and perspective-consistent body proportions' },
  { id: 'materials', label: 'Material Physics', prompt: 'use material-specific roughness, reflectance, translucency, fabric folds and contact compression' },
  { id: 'environment', label: 'Environmental Logic', prompt: 'maintain gravity, wind response, contact shadows, spatial continuity, atmospheric depth and background logic' },
  { id: 'imperfections', label: 'Controlled Imperfection', prompt: 'retain realistic sensor noise, slight edge softness, imperfect white balance, subtle lens distortion and non-uniform micro-detail without cinematic grading' }
]);

export const FIELD_SPECS = Object.freeze({
  age: { min: 1, max: 100, unit: 'years' },
  focalLength: { min: 13, max: 120, unit: 'mm equivalent' },
  distance: { min: 20, max: 1000, unit: 'cm' },
  yaw: { min: -90, max: 90, unit: 'deg' },
  pitch: { min: -45, max: 45, unit: 'deg' },
  roll: { min: -20, max: 20, unit: 'deg' }
});

export const DEFAULT_STATE = Object.freeze({
  idea: '', referenceRole: 'none', referenceAttached: false,
  captureType: 'front-selfie', time: 'night', location: 'commercial-street', customLocation: '', people: '1', ratio: '9:16',
  age: 35, pose: 'natural-standing', customPose: '', expression: 'neutral', hair: 'reference', customHair: '', beard: 'reference', customBeard: '', glasses: 'reference', customGlasses: '', clothing: 'navy-shirt', customClothing: '',
  framing: 'chest-up', focalLength: 24, distance: 50, yaw: 0, pitch: 0, roll: 2,
  lightSource: 'street-lights', customLightSource: '', lightDirection: 'top-side', lightFalloff: 'mixed-local', exposure: 'natural', hdr: 'mild', whiteBalance: 'auto-realistic',
  modules: { identity: 'strict', camera: 'strict', lighting: 'strict', anatomy: 'auto', materials: 'auto', environment: 'auto', imperfections: 'auto' },
  notes: ''
});

export const CATALOG = Object.freeze({
  referenceRole: REFERENCE_ROLES, captureType: CAPTURE_TYPES, time: TIMES, location: LOCATIONS, ratio: RATIOS,
  framing: FRAMINGS, pose: POSES, expression: EXPRESSIONS, hair: HAIR, beard: BEARDS, glasses: GLASSES, clothing: CLOTHING,
  lightSource: LIGHT_SOURCES, lightDirection: LIGHT_DIRECTIONS, lightFalloff: LIGHT_FALLOFF, exposure: EXPOSURE, hdr: HDR, whiteBalance: WHITE_BALANCE
});
