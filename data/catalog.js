const freezeOptions = (items) => Object.freeze(items.map((item) => Object.freeze({ ...item })));

export const REFERENCE_ROLES = freezeOptions([
  { id: 'none', label: 'بدون استخدام مرجعي', prompt: 'do not use a reference image' },
  { id: 'identity-only', label: 'هوية الشخص فقط', prompt: 'identity only' },
  { id: 'identity-appearance', label: 'الهوية + المظهر', prompt: 'identity and visible appearance' },
  { id: 'full-visual', label: 'مرجع بصري كامل', prompt: 'broad visual reference' }
]);

export const CAPTURE_TYPES = freezeOptions([
  {
    id: 'front-selfie', label: 'سيلفي بالكاميرا الأمامية', prompt: 'subject-held smartphone front-camera selfie',
    focalRangeMm: [18, 35], distanceRangeCm: [25, 90], maxAbsYawDeg: 45, maxAbsPitchDeg: 30, maxAbsRollDeg: 12
  },
  {
    id: 'rear-camera', label: 'تصوير بالكاميرا الخلفية', prompt: 'smartphone rear-camera photograph',
    focalRangeMm: [13, 120], distanceRangeCm: [30, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 20
  },
  {
    id: 'third-person', label: 'تصوير شخص ثالث', prompt: 'third-person photograph taken by another person',
    focalRangeMm: [18, 120], distanceRangeCm: [50, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 20
  },
  {
    id: 'mirror-selfie', label: 'سيلفي مرآة', prompt: 'mirror selfie photographed with a smartphone',
    focalRangeMm: [18, 35], distanceRangeCm: [80, 500], maxAbsYawDeg: 60, maxAbsPitchDeg: 35, maxAbsRollDeg: 15
  },
  {
    id: 'candid', label: 'لقطة عفوية', prompt: 'candid spontaneous photograph',
    focalRangeMm: [20, 85], distanceRangeCm: [80, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 20
  },
  {
    id: 'cctv', label: 'كاميرا مراقبة', prompt: 'fixed CCTV-style surveillance-camera frame',
    focalRangeMm: [20, 120], distanceRangeCm: [200, 1000], maxAbsYawDeg: 90, maxAbsPitchDeg: 45, maxAbsRollDeg: 10
  }
]);

export const TIMES = freezeOptions([
  { id: 'morning', label: 'الصباح', prompt: 'morning' },
  { id: 'noon', label: 'الظهر', prompt: 'noon' },
  { id: 'afternoon', label: 'العصر', prompt: 'afternoon' },
  { id: 'sunset', label: 'وقت الغروب', prompt: 'sunset' },
  { id: 'evening', label: 'المساء', prompt: 'evening after sunset' },
  { id: 'night', label: 'الليل', prompt: 'night' }
]);

export const LOCATIONS = freezeOptions([
  { id: 'commercial-street', label: 'شارع تجاري سعودي عادي', prompt: 'an ordinary generic Saudi commercial street', environment: 'outdoor', parkable: true },
  { id: 'local-shops', label: 'منطقة محلات وخدمات', prompt: 'a generic Saudi local shops and services strip', environment: 'outdoor', parkable: true },
  { id: 'side-street', label: 'شارع فرعي هادئ', prompt: 'a quiet generic Saudi side street', environment: 'outdoor', parkable: true },
  { id: 'residential-street', label: 'شارع سكني', prompt: 'an ordinary generic Saudi residential street', environment: 'outdoor', parkable: true },
  { id: 'villa-neighborhood', label: 'حي فلل', prompt: 'a generic Saudi villa neighborhood', environment: 'outdoor', parkable: true },
  { id: 'villa-entrance', label: 'مدخل فيلا', prompt: 'a generic Saudi residential villa entrance', environment: 'semi-outdoor', parkable: true },
  { id: 'private-garage', label: 'كراج فيلا خاص', prompt: 'a private residential villa garage in Saudi Arabia', environment: 'semi-outdoor', parkable: true },
  { id: 'apartment-entry', label: 'مدخل عمارة سكنية', prompt: 'a generic Saudi apartment-building entrance', environment: 'semi-outdoor', parkable: true },
  { id: 'supermarket-parking', label: 'موقف سوبرماركت', prompt: 'a generic Saudi supermarket parking area', environment: 'outdoor', parkable: true },
  { id: 'restaurant-parking', label: 'موقف مطعم محلي', prompt: 'a generic local restaurant parking area in Saudi Arabia', environment: 'outdoor', parkable: true },
  { id: 'cafeteria-front', label: 'أمام كافتيريا شعبية', prompt: 'outside a modest generic Saudi roadside cafeteria', environment: 'semi-outdoor', parkable: true },
  { id: 'fuel-station', label: 'محطة وقود عامة', prompt: 'a generic Saudi fuel-station forecourt', environment: 'semi-outdoor', parkable: true },
  { id: 'mall-parking', label: 'موقف مجمع تجاري', prompt: 'a generic Saudi shopping-complex parking area', environment: 'outdoor', parkable: true },
  { id: 'office-parking', label: 'موقف مبنى مكاتب', prompt: 'a generic Saudi office-building parking area', environment: 'outdoor', parkable: true },
  { id: 'hospital-parking', label: 'موقف مستشفى', prompt: 'a generic Saudi hospital parking area', environment: 'outdoor', parkable: true },
  { id: 'public-parking', label: 'ساحة مواقف عامة', prompt: 'a generic public parking area in Saudi Arabia', environment: 'outdoor', parkable: true },
  { id: 'workshop-area', label: 'منطقة ورش', prompt: 'a generic Saudi light workshop area', environment: 'outdoor', parkable: true },
  { id: 'light-industrial', label: 'منطقة صناعية خفيفة', prompt: 'a generic Saudi light-industrial district', environment: 'outdoor', parkable: true },
  { id: 'developing-neighborhood', label: 'حي جديد تحت التطوير', prompt: 'a generic developing Saudi neighborhood', environment: 'outdoor', parkable: true },
  { id: 'city-edge', label: 'أطراف مدينة', prompt: 'a generic built-up area on the edge of a Saudi city', environment: 'outdoor', parkable: true },
  { id: 'interdistrict-road', label: 'طريق بين الأحياء', prompt: 'a generic Saudi road connecting residential districts', environment: 'outdoor', parkable: false },
  { id: 'highway-service-road', label: 'طريق خدمة', prompt: 'a generic Saudi highway service road', environment: 'outdoor', parkable: true },
  { id: 'highway', label: 'طريق سريع', prompt: 'a generic Saudi highway environment', environment: 'outdoor', parkable: false },
  { id: 'desert-road', label: 'طريق صحراوي', prompt: 'a generic Saudi desert road with a safe roadside stopping area', environment: 'outdoor', parkable: true },
  { id: 'road-rest-area', label: 'استراحة طريق', prompt: 'a generic Saudi roadside rest area', environment: 'outdoor', parkable: true },
  { id: 'seafront', label: 'واجهة بحرية عامة', prompt: 'a generic Saudi seafront area with no recognizable landmark', environment: 'outdoor', parkable: true },
  { id: 'modern-majlis', label: 'مجلس عربي حديث', prompt: 'a generic modern Saudi majlis interior', environment: 'indoor', parkable: false },
  { id: 'living-room', label: 'غرفة معيشة منزلية', prompt: 'a generic Saudi home living room', environment: 'indoor', parkable: false },
  { id: 'bedroom', label: 'غرفة نوم منزلية', prompt: 'a generic Saudi home bedroom', environment: 'indoor', parkable: false },
  { id: 'office-interior', label: 'مكتب عمل', prompt: 'a generic Saudi office interior', environment: 'indoor', parkable: false },
  { id: 'restaurant-interior', label: 'داخل مطعم محلي', prompt: 'inside a generic local restaurant in Saudi Arabia', environment: 'indoor', parkable: false },
  { id: 'cafe-interior', label: 'داخل مقهى محلي', prompt: 'inside a generic local cafe in Saudi Arabia', environment: 'indoor', parkable: false },
  { id: 'neighborhood-grocery', label: 'أمام بقالة حي', prompt: 'outside a generic Saudi neighborhood grocery', environment: 'semi-outdoor', parkable: true },
  { id: 'laundry-front', label: 'أمام مغسلة ملابس', prompt: 'outside a generic Saudi neighborhood laundry shop', environment: 'semi-outdoor', parkable: true },
  { id: 'barber-front', label: 'أمام حلاق محلي', prompt: 'outside a generic Saudi local barbershop', environment: 'semi-outdoor', parkable: true },
  { id: 'pharmacy-front', label: 'أمام صيدلية عامة', prompt: 'outside a generic Saudi pharmacy', environment: 'semi-outdoor', parkable: true },
  { id: 'bakery-front', label: 'أمام مخبز محلي', prompt: 'outside a generic Saudi local bakery', environment: 'semi-outdoor', parkable: true },
  { id: 'small-plaza', label: 'ساحة محلات صغيرة', prompt: 'a small generic Saudi neighborhood retail plaza', environment: 'outdoor', parkable: true },
  { id: 'apartment-parking', label: 'موقف عمارة سكنية', prompt: 'a generic Saudi apartment-building parking area', environment: 'outdoor', parkable: true },
  { id: 'villa-driveway', label: 'ممر سيارة أمام فيلا', prompt: 'a generic Saudi residential villa driveway', environment: 'outdoor', parkable: true },
  { id: 'school-area', label: 'منطقة مدارس بعد الدوام', prompt: 'a generic Saudi school-area street without identifiable signage', environment: 'outdoor', parkable: true },
  { id: 'clinic-parking', label: 'موقف عيادة', prompt: 'a generic Saudi neighborhood clinic parking area', environment: 'outdoor', parkable: true },
  { id: 'warehouse-street', label: 'شارع مستودعات خفيف', prompt: 'a generic Saudi light-warehouse street', environment: 'outdoor', parkable: true },
  { id: 'construction-edge', label: 'طرف منطقة بناء', prompt: 'the edge of a generic Saudi construction area', environment: 'outdoor', parkable: true },
  { id: 'date-shop-front', label: 'أمام محل تمور عام', prompt: 'outside a generic Saudi date shop', environment: 'semi-outdoor', parkable: true },
  { id: 'small-office-lobby', label: 'لوبي مكتب صغير', prompt: 'a generic small Saudi office lobby', environment: 'indoor', parkable: false },
  { id: 'building-corridor', label: 'ممر داخل مبنى', prompt: 'a generic indoor corridor in a Saudi building', environment: 'indoor', parkable: false },
  { id: 'home-entry-hall', label: 'مدخل منزل داخلي', prompt: 'a generic Saudi home entry hall', environment: 'indoor', parkable: false },
  { id: 'roof-terrace', label: 'سطح منزل بسيط', prompt: 'a generic Saudi residential roof terrace', environment: 'outdoor', parkable: false },
  { id: 'custom', label: 'مخصص', prompt: null, environment: 'unknown', parkable: null }
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
  { id: 'environmental-portrait', label: 'الشخص مع مساحة أكبر للبيئة', prompt: 'environmental portrait framing with substantial scene context', verticalCoverageCm: [220, 650] }
]);

export const POSES = freezeOptions([
  { id: 'natural-standing', label: 'واقف بشكل طبيعي', prompt: 'standing naturally', posture: 'standing' },
  { id: 'natural-seated', label: 'جالس بشكل طبيعي', prompt: 'seated naturally', posture: 'seated' },
  { id: 'walking', label: 'يمشي', prompt: 'walking naturally', posture: 'moving' },
  { id: 'casual-lean', label: 'متكئ بشكل عفوي', prompt: 'casually leaning while standing', posture: 'standing' },
  { id: 'waiting', label: 'واقف كأنه ينتظر', prompt: 'standing as if casually waiting', posture: 'standing' },
  { id: 'hands-relaxed', label: 'اليدان بوضع مريح', prompt: 'standing with relaxed body language and natural hand placement', posture: 'standing' },
  { id: 'one-hand-pocket', label: 'يد في الجيب', prompt: 'standing naturally with one hand in a pocket', posture: 'standing' },
  { id: 'both-hands-pockets', label: 'اليدان في الجيب', prompt: 'standing naturally with both hands in pockets', posture: 'standing' },
  { id: 'free-hand-hair', label: 'اليد الحرة قرب الشعر', prompt: 'relaxed standing pose with the free hand near the hair', posture: 'standing' },
  { id: 'arms-loose', label: 'الذراعان مرتخيتان', prompt: 'standing with both arms hanging naturally', posture: 'standing' },
  { id: 'turning-slightly', label: 'يلتفت قليلًا', prompt: 'standing while slightly turning the torso naturally', posture: 'standing' },
  { id: 'looking-away-pose', label: 'وقفة مع نظر بعيد', prompt: 'relaxed standing pose while looking slightly away', posture: 'standing' },
  { id: 'mid-step', label: 'خطوة أثناء المشي', prompt: 'natural mid-step walking pose', posture: 'moving' },
  { id: 'wall-lean', label: 'اتكاء خفيف على جدار', prompt: 'light natural lean against a wall', posture: 'standing' },
  { id: 'counter-lean', label: 'اتكاء على سطح قريب', prompt: 'casually leaning on a nearby surface', posture: 'standing' },
  { id: 'custom', label: 'مخصص', prompt: null, posture: 'unknown' }
]);

export const EXPRESSIONS = freezeOptions([
  { id: 'neutral', label: 'محايد وهادئ', prompt: 'neutral calm expression' },
  { id: 'small-smile', label: 'ابتسامة خفيفة مغلقة', prompt: 'very small closed-mouth smile with no teeth visible' },
  { id: 'focused', label: 'تركيز طبيعي', prompt: 'natural focused expression' },
  { id: 'thoughtful', label: 'شرود هادئ', prompt: 'quiet thoughtful expression' },
  { id: 'tired', label: 'تعب خفيف طبيعي', prompt: 'mild natural tiredness' }
]);

export const HAIRSTYLES = freezeOptions([
  { id: 'reference', label: 'كما في المرجع', prompt: 'same hairstyle as the reference image' },
  { id: 'short-natural', label: 'قصير طبيعي', prompt: 'short natural hair' },
  { id: 'textured-short', label: 'قصير بملمس واضح', prompt: 'short textured hair' },
  { id: 'side-sweep', label: 'تمشيط جانبي طبيعي', prompt: 'natural side-swept hair' },
  { id: 'french-crop', label: 'French crop', prompt: 'short natural French crop' },
  { id: 'crew-cut', label: 'Crew cut', prompt: 'clean natural crew cut' },
  { id: 'buzz-cut', label: 'Buzz cut', prompt: 'short natural buzz cut' },
  { id: 'short-wavy', label: 'متموج قصير', prompt: 'short naturally wavy hair' },
  { id: 'short-curly', label: 'كيرلي قصير', prompt: 'short naturally curly hair' },
  { id: 'soft-slick-back', label: 'مرفوع للخلف بخفة', prompt: 'softly swept-back hair without excessive volume' },
  { id: 'medium-layered', label: 'متوسط بطبقات طبيعية', prompt: 'medium-length naturally layered hair' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

export const BEARDS = freezeOptions([
  { id: 'reference', label: 'كما في المرجع', prompt: 'same beard and moustache pattern as the reference image' },
  { id: 'clean-shaven', label: 'حليق', prompt: 'clean-shaven face' },
  { id: 'light-stubble', label: 'لحية خفيفة جدًا', prompt: 'light natural stubble' },
  { id: 'medium-stubble', label: 'لحية خفيفة متوسطة', prompt: 'medium natural stubble' },
  { id: 'short-trimmed', label: 'لحية قصيرة مرتبة', prompt: 'short naturally trimmed beard' },
  { id: 'short-boxed', label: 'لحية قصيرة محددة', prompt: 'short boxed beard' },
  { id: 'full-short', label: 'لحية كاملة قصيرة', prompt: 'short full beard with natural density variation' },
  { id: 'moustache-only', label: 'شارب فقط', prompt: 'natural moustache only' },
  { id: 'goatee', label: 'سكسوكة خفيفة', prompt: 'natural goatee' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

export const GLASSES = freezeOptions([
  { id: 'reference', label: 'كما في المرجع', prompt: 'same glasses as the reference image' },
  { id: 'none', label: 'بدون نظارة', prompt: 'no glasses' },
  { id: 'black-rectangular', label: 'إطار أسود مستطيل', prompt: 'black full-rim rectangular glasses' },
  { id: 'thin-metal', label: 'إطار معدني نحيف', prompt: 'thin metal-frame glasses' },
  { id: 'clear-frame', label: 'إطار شفاف', prompt: 'clear-frame glasses' },
  { id: 'round-metal', label: 'إطار معدني دائري', prompt: 'round thin metal-frame glasses' },
  { id: 'dark-sunglasses', label: 'نظارة شمسية داكنة', prompt: 'dark sunglasses' },
  { id: 'custom', label: 'مخصص', prompt: null }
]);

const clothing = [
  ['black-tee','تيشيرت أسود سادة','a plain black cotton T-shirt'],['white-tee','تيشيرت أبيض سادة','a plain white cotton T-shirt'],['navy-tee','تيشيرت كحلي سادة','a plain navy cotton T-shirt'],['charcoal-tee','تيشيرت فحمي سادة','a plain charcoal cotton T-shirt'],['olive-tee','تيشيرت زيتوني سادة','a plain olive cotton T-shirt'],['beige-tee','تيشيرت بيج سادة','a plain beige cotton T-shirt'],['offwhite-tee','تيشيرت أوف وايت','an off-white heavyweight cotton T-shirt'],['brown-tee','تيشيرت بني هادئ','a plain muted brown cotton T-shirt'],['washed-black-tee','تيشيرت أسود مغسول','a washed black cotton T-shirt'],['long-sleeve-black-tee','تيشيرت أسود بأكمام طويلة','a plain black long-sleeve cotton T-shirt'],['long-sleeve-white-tee','تيشيرت أبيض بأكمام طويلة','a plain white long-sleeve cotton T-shirt'],
  ['navy-shirt','قميص كحلي','a plain navy shirt'],['light-blue-shirt','قميص أزرق فاتح','a light blue cotton shirt'],['white-shirt','قميص أبيض','a plain white cotton shirt'],['charcoal-shirt','قميص فحمي','a charcoal cotton shirt'],['black-shirt','قميص أسود','a plain black cotton shirt'],['beige-shirt','قميص بيج','a beige cotton shirt'],['olive-shirt','قميص زيتوني','an olive cotton shirt'],['sand-shirt','قميص رملي','a sand-colored cotton shirt'],['striped-blue-shirt','قميص أزرق مخطط هادئ','a subtle blue striped cotton shirt'],['striped-white-shirt','قميص أبيض بخطوط رفيعة','a white shirt with fine subtle stripes'],['denim-shirt','قميص دنيم أزرق','a blue denim shirt'],['linen-white-shirt','قميص كتان أبيض','a white linen shirt'],['linen-beige-shirt','قميص كتان بيج','a light beige linen shirt'],['linen-blue-shirt','قميص كتان أزرق فاتح','a light blue linen shirt'],['overshirt-sand','أوفرشيرت رملي','a sand-colored cotton overshirt'],['overshirt-olive','أوفرشيرت زيتوني','an olive cotton overshirt'],['overshirt-charcoal','أوفرشيرت فحمي','a charcoal cotton overshirt'],
  ['dark-polo','بولو داكن','a dark cotton polo shirt'],['navy-polo','بولو كحلي','a navy cotton pique polo shirt'],['black-polo','بولو أسود','a black cotton pique polo shirt'],['white-polo','بولو أبيض','a white cotton pique polo shirt'],['stone-polo','بولو حجري فاتح','a light stone-colored cotton polo shirt'],['olive-polo','بولو زيتوني','an olive cotton polo shirt'],['burgundy-polo','بولو عنابي','a burgundy cotton polo shirt'],['knit-polo-navy','بولو محبوك كحلي','a navy knitted polo shirt'],['knit-polo-cream','بولو محبوك كريمي','a cream knitted polo shirt'],
  ['grey-sweatshirt','سويت شيرت رمادي','a plain grey crewneck sweatshirt'],['charcoal-sweatshirt','سويت شيرت فحمي','a charcoal crewneck sweatshirt'],['navy-sweatshirt','سويت شيرت كحلي','a navy crewneck sweatshirt'],['black-hoodie','هودي أسود','a plain black hoodie'],['grey-hoodie','هودي رمادي','a plain grey hoodie'],['navy-hoodie','هودي كحلي','a plain navy hoodie'],['cream-knit','كنزة محبوكة كريمية','a cream knitted sweater'],['olive-knit','كنزة محبوكة زيتونية','an olive knitted sweater'],['charcoal-knit','كنزة محبوكة فحمية','a charcoal knitted sweater'],['black-turtleneck','ياقة عالية سوداء','a black turtleneck sweater'],['cream-turtleneck','ياقة عالية كريمية','a cream turtleneck sweater'],
  ['casual-jacket','جاكيت كاجوال بسيط','a simple casual jacket'],['black-bomber','جاكيت بومبر أسود','a matte black bomber jacket'],['olive-bomber','جاكيت بومبر زيتوني','an olive bomber jacket'],['brown-suede-jacket','جاكيت سويد بني','a dark brown suede jacket'],['brown-leather-jacket','جاكيت جلد بني','a dark brown matte leather jacket'],['black-leather-jacket','جاكيت جلد أسود','a matte black leather jacket'],['denim-jacket','جاكيت دنيم أزرق','a classic blue denim jacket'],['dark-denim-jacket','جاكيت دنيم داكن','a dark indigo denim jacket'],['field-jacket-olive','جاكيت ميداني زيتوني','an olive field jacket'],['lightweight-navy-jacket','جاكيت خفيف كحلي','a lightweight navy jacket'],['beige-trucker-jacket','جاكيت بيج قصير','a beige trucker-style jacket'],
  ['navy-blazer-white-tee','بليزر كحلي مع تيشيرت أبيض','a navy blazer over a plain white T-shirt'],['charcoal-blazer-black-tee','بليزر فحمي مع تيشيرت أسود','a charcoal blazer over a plain black T-shirt'],['navy-suit','بدلة كحلية مع قميص أبيض','a tailored navy suit with a white shirt'],['charcoal-suit','بدلة فحمية مع قميص أبيض','a tailored charcoal suit with a white shirt'],['light-grey-suit','بدلة رمادية فاتحة','a tailored light grey suit with a white shirt'],['beige-suit','بدلة بيج فاتحة','a tailored light beige suit with a white shirt'],['navy-suit-open-collar','بدلة كحلية بقميص مفتوح الياقة','a navy suit with an open-collar light shirt and no tie'],['charcoal-suit-black-shirt','بدلة فحمية مع قميص أسود','a charcoal suit with a plain black shirt'],['formal-shirt-trousers','قميص أبيض وبنطال رسمي داكن','a white dress shirt with dark tailored trousers'],['light-blue-shirt-navy-trousers','قميص أزرق فاتح وبنطال كحلي','a light blue shirt with deep navy tailored trousers'],
  ['white-thobe','ثوب سعودي أبيض','a clean white Saudi thobe'],['cream-thobe','ثوب سعودي كريمي','a cream Saudi thobe'],['navy-thobe','ثوب سعودي كحلي','a navy Saudi thobe'],['charcoal-thobe','ثوب سعودي فحمي','a charcoal Saudi thobe'],['light-grey-thobe','ثوب سعودي رمادي فاتح','a light grey Saudi thobe'],['beige-thobe','ثوب سعودي بيج','a beige Saudi thobe'],['white-thobe-red-shemagh','ثوب أبيض مع شماغ أحمر وعقال','a white Saudi thobe with a red-and-white shemagh and black agal'],['white-thobe-white-ghutra','ثوب أبيض مع غترة بيضاء وعقال','a white Saudi thobe with a white ghutra and black agal'],['cream-thobe-red-shemagh','ثوب كريمي مع شماغ أحمر وعقال','a cream Saudi thobe with a red-and-white shemagh and black agal'],['navy-thobe-red-shemagh','ثوب كحلي مع شماغ أحمر وعقال','a navy Saudi thobe with a red-and-white shemagh and black agal'],['white-thobe-black-bisht','ثوب أبيض مع بشت أسود','a white Saudi thobe with a black bisht'],['white-thobe-brown-bisht','ثوب أبيض مع بشت بني','a white Saudi thobe with a brown bisht'],['white-thobe-beige-bisht','ثوب أبيض مع بشت بيج','a white Saudi thobe with a light beige bisht'],
  ['summer-white-linen','قميص كتان أبيض وبنطال بيج','a white linen shirt with beige trousers'],['summer-blue-linen','قميص كتان أزرق وبنطال فاتح','a light blue linen shirt with light trousers'],['summer-beige-linen','قميص كتان بيج وبنطال أبيض مكسور','a beige linen shirt with off-white trousers'],['navy-shirt-black-trousers','قميص كحلي وبنطال أسود','a plain navy shirt with black trousers'],['black-shirt-charcoal-trousers','قميص أسود وبنطال فحمي','a plain black shirt with charcoal trousers'],['white-shirt-beige-trousers','قميص أبيض وبنطال بيج','a plain white shirt with beige trousers'],['blue-oxford-khaki','قميص أكسفورد أزرق وبنطال كاكي','a light blue Oxford shirt with khaki trousers'],['olive-overshirt-black-tee','أوفرشيرت زيتوني مع تيشيرت أسود','an olive overshirt over a plain black T-shirt'],['sand-overshirt-white-tee','أوفرشيرت رملي مع تيشيرت أبيض','a sand-colored overshirt over a plain white T-shirt'],['denim-shirt-white-tee','قميص دنيم مفتوح مع تيشيرت أبيض','an open blue denim shirt over a plain white T-shirt']
].map(([id,label,prompt]) => ({ id,label,prompt }));
export const CLOTHING = freezeOptions([...clothing, { id: 'custom', label: 'مخصص', prompt: null }]);

const ALL_TIMES = Object.freeze(['morning','noon','afternoon','sunset','evening','night']);
const DAY_TIMES = Object.freeze(['morning','noon','afternoon']);
const DAY_WITH_SUNSET = Object.freeze(['morning','noon','afternoon','sunset']);
const DARK_TIMES = Object.freeze(['sunset','evening','night']);

export const LIGHT_DIRECTIONS = freezeOptions([
  { id: 'front', label: 'أمامي', prompt: 'dominant light from near the camera axis' },
  { id: 'front-side', label: 'أمامي جانبي', prompt: 'dominant front-side light' },
  { id: 'side', label: 'جانبي', prompt: 'dominant side light' },
  { id: 'back-side', label: 'خلفي جانبي', prompt: 'dominant back-side light' },
  { id: 'overhead', label: 'علوي', prompt: 'dominant overhead light' },
  { id: 'mixed', label: 'مصادر مختلطة', prompt: 'multiple practical-light directions without a single dominant vector' }
]);

export const LIGHT_FALLOFFS = freezeOptions([
  { id: 'distant-uniform', label: 'مصدر بعيد شبه منتظم', prompt: 'effectively uniform illumination across the human-scale scene because the dominant source is distant' },
  { id: 'inverse-square-near', label: 'هبوط قوي لمصدر قريب', prompt: 'strong inverse-square-like falloff from a nearby source' },
  { id: 'distributed-soft', label: 'مصدر واسع موزع', prompt: 'broad distributed-source falloff with low local intensity change' },
  { id: 'mixed-local', label: 'مصادر عملية محلية متعددة', prompt: 'localized falloff around multiple practical light sources' }
]);

export const LIGHT_SOURCES = freezeOptions([
  { id: 'daylight', label: 'ضوء نهار طبيعي', prompt: 'direct or diffuse natural daylight', family: 'solar', times: DAY_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['front','front-side','side','back-side','overhead'], falloffs: ['distant-uniform','distributed-soft'] },
  { id: 'open-shade', label: 'ظل مفتوح نهاري', prompt: 'open-shade daylight', family: 'solar-indirect', times: DAY_WITH_SUNSET, environments: ['outdoor','semi-outdoor'], directions: ['front-side','side','mixed'], falloffs: ['distributed-soft','distant-uniform'] },
  { id: 'window-light', label: 'ضوء نهار من نافذة', prompt: 'daylight entering through a window', family: 'solar-indirect', times: DAY_WITH_SUNSET, environments: ['indoor'], directions: ['front','front-side','side','back-side'], falloffs: ['distributed-soft'] },
  { id: 'street-lights', label: 'إنارة شارع', prompt: 'ordinary street lighting', family: 'practical', times: DARK_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['overhead','mixed','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'parking-lights', label: 'إنارة موقف', prompt: 'ordinary parking-area lighting', family: 'practical', times: DARK_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['overhead','mixed','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'indoor-practical', label: 'إضاءة داخلية عملية', prompt: 'ordinary indoor practical lighting', family: 'practical', times: ALL_TIMES, environments: ['indoor','semi-outdoor'], directions: ['overhead','mixed','front','front-side','side'], falloffs: ['mixed-local','distributed-soft','inverse-square-near'] },
  { id: 'storefront-mixed', label: 'إضاءة محلات مختلطة', prompt: 'mixed light from nearby generic storefronts', family: 'practical', times: DARK_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['mixed','front-side','side'], falloffs: ['mixed-local'] },
  { id: 'phone-screen', label: 'ضوء شاشة الهاتف', prompt: 'phone-screen light as a weak nearby physical source', family: 'device', times: ALL_TIMES, environments: ['indoor','outdoor','semi-outdoor'], directions: ['front','front-side'], falloffs: ['inverse-square-near'], maxDistanceCm: 80 },
  { id: 'front-flash', label: 'فلاش الهاتف الأمامي', prompt: 'smartphone front-facing flash or screen-flash illumination', family: 'device', times: ALL_TIMES, environments: ['indoor','outdoor','semi-outdoor'], directions: ['front'], falloffs: ['inverse-square-near'], maxDistanceCm: 200 },
  { id: 'ceiling-downlight', label: 'إضاءة سقفية مباشرة', prompt: 'ordinary ceiling downlight', family: 'practical', times: ALL_TIMES, environments: ['indoor','semi-outdoor'], directions: ['overhead'], falloffs: ['inverse-square-near','mixed-local'] },
  { id: 'warm-room-light', label: 'إضاءة غرفة دافئة', prompt: 'warm indoor room practical lighting', family: 'practical', times: ALL_TIMES, environments: ['indoor'], directions: ['overhead','mixed','front','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'cool-room-light', label: 'إضاءة غرفة باردة', prompt: 'cool indoor room practical lighting', family: 'practical', times: ALL_TIMES, environments: ['indoor'], directions: ['overhead','mixed','front','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'shop-signage', label: 'إضاءة واجهات ومحلات', prompt: 'mixed light from nearby generic storefront signage and practicals', family: 'practical', times: DARK_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['mixed','front-side','side'], falloffs: ['mixed-local'] },
  { id: 'cafeteria-light', label: 'إضاءة كافتيريا', prompt: 'modest cafeteria practical lighting', family: 'practical', times: ALL_TIMES, environments: ['indoor','semi-outdoor'], directions: ['overhead','mixed','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'restaurant-light', label: 'إضاءة مطعم', prompt: 'ordinary restaurant practical lighting', family: 'practical', times: ALL_TIMES, environments: ['indoor'], directions: ['overhead','mixed','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'majlis-light', label: 'إضاءة مجلس', prompt: 'ordinary modern majlis practical lighting', family: 'practical', times: ALL_TIMES, environments: ['indoor'], directions: ['overhead','mixed','front-side','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'parking-pole-led', label: 'أعمدة LED في موقف', prompt: 'ordinary parking-pole LED lighting', family: 'practical', times: DARK_TIMES, environments: ['outdoor'], directions: ['overhead','mixed','side'], falloffs: ['mixed-local','distributed-soft'] },
  { id: 'security-light', label: 'كشاف أمني خارجي', prompt: 'ordinary exterior security light', family: 'practical', times: DARK_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['front','front-side','side','overhead'], falloffs: ['inverse-square-near','mixed-local'] },
  { id: 'soft-cloudy-daylight', label: 'نهار غائم ناعم', prompt: 'soft overcast daylight', family: 'solar-indirect', times: DAY_TIMES, environments: ['outdoor','semi-outdoor'], directions: ['mixed','front-side','side','overhead'], falloffs: ['distributed-soft','distant-uniform'] },
  { id: 'sunset-ambient', label: 'ضوء غروب طبيعي', prompt: 'natural low-angle sunset ambient light', family: 'solar', times: ['sunset'], environments: ['outdoor','semi-outdoor'], directions: ['front','front-side','side','back-side'], falloffs: ['distant-uniform','distributed-soft'] },
  { id: 'custom', label: 'مخصص', prompt: null, family: 'unknown', times: ALL_TIMES, environments: ['indoor','outdoor','semi-outdoor','unknown'], directions: ['front','front-side','side','back-side','overhead','mixed'], falloffs: ['distant-uniform','inverse-square-near','distributed-soft','mixed-local'] }
]);

export const EXPOSURE_OPTIONS = freezeOptions([
  { id: 'natural', label: 'طبيعي', prompt: 'natural exposure without artificial brightness recovery' },
  { id: 'slightly-dark', label: 'أغمق قليلًا', prompt: 'slightly dark exposure' },
  { id: 'slightly-bright', label: 'أفتح قليلًا', prompt: 'slightly bright exposure without clipping highlights' }
]);

export const HDR_OPTIONS = freezeOptions([
  { id: 'off', label: 'مغلق', prompt: 'HDR off' },
  { id: 'low', label: 'منخفض', prompt: 'low computational HDR' },
  { id: 'moderate', label: 'متوسط', prompt: 'moderate computational HDR without flattening local contrast' }
]);

export const WHITE_BALANCE_OPTIONS = freezeOptions([
  { id: 'neutral-small-error', label: 'محايد مع خطأ طبيعي بسيط', prompt: 'neutral white balance with a small natural error' },
  { id: 'slightly-warm', label: 'دافئ قليلًا', prompt: 'slightly warm white balance' },
  { id: 'slightly-cool', label: 'بارد قليلًا', prompt: 'slightly cool white balance' }
]);

export const ASPECT_RATIOS = freezeOptions([
  { id: '9:16', label: '9:16 عمودي', prompt: '9:16 vertical', width: 9, height: 16 },
  { id: '4:5', label: '4:5 عمودي', prompt: '4:5 vertical', width: 4, height: 5 },
  { id: '1:1', label: '1:1 مربع', prompt: '1:1 square', width: 1, height: 1 },
  { id: '16:9', label: '16:9 أفقي', prompt: '16:9 horizontal', width: 16, height: 9 },
  { id: '3:2', label: '3:2 أفقي', prompt: '3:2 horizontal', width: 3, height: 2 }
]);

export const PEOPLE_OPTIONS = freezeOptions([1,2,3,4,5].map((count) => ({ id: String(count), label: count === 1 ? 'شخص واحد' : count === 2 ? 'شخصان' : `${count} أشخاص`, prompt: count })));

export const VEHICLE_SCENES = freezeOptions([
  { id: 'none', label: 'بدون سيارة', prompt: null },
  {
    id: 'rrs-2017-white-interior', label: 'داخل رنج روفر سبورت 2017 بيضاء', prompt: 'inside a white 2017 Range Rover Sport L494',
    model: '2017 Range Rover Sport L494', exterior: 'white', posture: 'seated', stationary: true,
    cabin: 'Ivory perforated leather seats, dark polished wood trim, black-and-Ivory steering wheel, panoramic glass roof, cream headliner'
  }
]);

export const REALISM_MODULES = freezeOptions([
  { id: 'anatomy', label: 'التشريح', auto: 'Keep human anatomy believable and naturally proportioned.', strict: 'Strictly enforce correct human anatomy, joint orientation, limb proportions, facial structure, and natural asymmetry.' },
  { id: 'contact', label: 'التلامس والوزن', auto: 'Keep weight, support, and contact with surfaces physically plausible.', strict: 'Strictly enforce body weight, support, compression, gravity, and object-surface contact.' },
  { id: 'skin', label: 'البشرة والشعر', auto: 'Use believable skin, hair, and beard texture without plastic smoothing.', strict: 'Strictly preserve skin micro-texture, pores, fine hair, beard-density variation, and natural non-uniformity.' },
  { id: 'materials', label: 'الخامات', auto: 'Render materials with plausible texture and light response.', strict: 'Strictly enforce distinct optical behavior for fabric, leather, glass, metal, wood, paint, and skin.' },
  { id: 'reflections', label: 'الانعكاسات', auto: 'Keep reflections and highlights consistent with viewing geometry.', strict: 'Strictly enforce reflection geometry, highlight direction, occlusion, and surface roughness.' },
  { id: 'atmosphere', label: 'العمق الجوي', auto: 'Keep background depth and atmospheric separation believable.', strict: 'Strictly enforce atmospheric depth, distance contrast, haze, and scale cues without artificial blur.' },
  { id: 'motion', label: 'الحركة والغالق', auto: 'Keep motion and shutter behavior internally consistent.', strict: 'Strictly enforce compatible motion blur, camera shake, and static-object sharpness.' },
  { id: 'imperfections', label: 'عيوب الكاميرا الواقعية', auto: 'Allow restrained real-camera imperfections.', strict: 'Strictly preserve slight edge softness, mild sensor noise, small white-balance error, and realistic dynamic-range limits.' },
  { id: 'environment', label: 'تفاعل البيئة', auto: 'Keep people and objects naturally integrated with the environment.', strict: 'Strictly enforce plausible wind, gravity, dust, fabric movement, shadows, footprints, contact, and local activity.' },
  { id: 'geometry', label: 'هندسة الالتقاط', auto: 'Keep focal length, distance, framing, and camera rotation mutually plausible.', strict: 'Strictly enforce camera geometry and field-of-view consistency.' },
  { id: 'lighting', label: 'السببية الضوئية', auto: 'Keep physical light sources compatible with time, place, direction, and falloff.', strict: 'Strictly enforce physical light causality and reject impossible source-time-place combinations.' }
]);

export const MODULE_LEVELS = freezeOptions([
  { id: 'off', label: 'إيقاف', prompt: null },
  { id: 'auto', label: 'تلقائي', prompt: 'auto' },
  { id: 'strict', label: 'صارم', prompt: 'strict' }
]);

export const FIELD_SPECS = Object.freeze({
  age: Object.freeze({ unit: 'years', min: 1, max: 100, step: 1, default: 35 }),
  focalLength: Object.freeze({ unit: 'mm equivalent', min: 13, max: 120, step: 1, default: 24 }),
  distance: Object.freeze({ unit: 'cm', min: 20, max: 1000, step: 1, default: 50 }),
  yaw: Object.freeze({ unit: 'deg', min: -90, max: 90, step: 1, default: 0 }),
  pitch: Object.freeze({ unit: 'deg', min: -45, max: 45, step: 1, default: 0 }),
  roll: Object.freeze({ unit: 'deg', min: -20, max: 20, step: 1, default: 2 })
});

const defaultModules = Object.freeze(Object.fromEntries(REALISM_MODULES.map(({ id }) => [id, 'auto'])));

export const DEFAULT_STATE = Object.freeze({
  idea: '', referenceAttached: false, referenceRole: 'none', captureType: 'front-selfie', time: 'night',
  location: 'commercial-street', customLocation: '', vehicleScene: 'none', people: '1', ratio: '9:16',
  age: 35, pose: 'natural-standing', customPose: '', expression: 'neutral', clothing: 'black-tee', customClothing: '',
  hair: 'short-natural', customHair: '', beard: 'clean-shaven', customBeard: '', glasses: 'none', customGlasses: '',
  framing: 'chest-up', focalLength: 24, distance: 50, yaw: 0, pitch: 0, roll: 2,
  lightSource: 'street-lights', customLightSource: '', lightDirection: 'mixed', lightFalloff: 'mixed-local',
  exposure: 'natural', hdr: 'low', whiteBalance: 'neutral-small-error', modules: defaultModules, notes: ''
});

export const CATALOG = Object.freeze({
  referenceRole: REFERENCE_ROLES,
  captureType: CAPTURE_TYPES,
  time: TIMES,
  location: LOCATIONS,
  vehicleScene: VEHICLE_SCENES,
  people: PEOPLE_OPTIONS,
  ratio: ASPECT_RATIOS,
  pose: POSES,
  expression: EXPRESSIONS,
  clothing: CLOTHING,
  hair: HAIRSTYLES,
  beard: BEARDS,
  glasses: GLASSES,
  framing: FRAMINGS,
  lightSource: LIGHT_SOURCES,
  lightDirection: LIGHT_DIRECTIONS,
  lightFalloff: LIGHT_FALLOFFS,
  exposure: EXPOSURE_OPTIONS,
  hdr: HDR_OPTIONS,
  whiteBalance: WHITE_BALANCE_OPTIONS
});
