export const HAIRSTYLES = [
  ['reference', 'كما في المرجع إن وجد', 'same hairstyle as the reference if attached'],
  ['short-natural', 'قصير طبيعي', 'short natural hair'],
  ['textured-short', 'قصير بملمس واضح', 'short textured hair'],
  ['side-sweep', 'تمشيط جانبي طبيعي', 'natural side-swept hair'],
  ['french-crop', 'French crop', 'short natural French crop'],
  ['crew-cut', 'Crew cut', 'clean natural crew cut'],
  ['buzz-cut', 'Buzz cut', 'short natural buzz cut'],
  ['short-wavy', 'متموج قصير', 'short naturally wavy hair'],
  ['short-curly', 'كيرلي قصير', 'short natural curly hair'],
  ['soft-slick-back', 'مرفوع للخلف بخفة', 'softly swept-back hair without excessive volume'],
  ['medium-layered', 'متوسط بطبقات طبيعية', 'medium-length naturally layered hair'],
  ['custom', 'مخصص', 'custom hairstyle']
];

export const BEARDS = [
  ['reference', 'كما في المرجع إن وجد', 'same beard and moustache pattern as the reference if attached'],
  ['clean-shaven', 'حليق', 'clean-shaven face'],
  ['light-stubble', 'لحية خفيفة جدًا', 'light natural stubble'],
  ['medium-stubble', 'لحية خفيفة متوسطة', 'medium natural stubble'],
  ['short-trimmed', 'لحية قصيرة مرتبة', 'short naturally trimmed beard'],
  ['short-boxed', 'لحية قصيرة محددة', 'short boxed beard'],
  ['full-short', 'لحية كاملة قصيرة', 'short full beard with natural density variation'],
  ['moustache-only', 'شارب فقط', 'natural moustache only'],
  ['goatee', 'سكسوكة خفيفة', 'natural goatee'],
  ['custom', 'مخصص', 'custom beard style']
];

export const GLASSES_OPTIONS = [
  ['reference', 'كما في المرجع إن وجد', 'same glasses as the reference if present'],
  ['none', 'بدون نظارة', 'no glasses'],
  ['black-rectangular', 'إطار أسود مستطيل', 'black full-rim rectangular glasses'],
  ['thin-metal', 'إطار معدني نحيف', 'thin metal-frame glasses'],
  ['clear-frame', 'إطار شفاف', 'clear-frame glasses'],
  ['round-metal', 'إطار معدني دائري', 'round thin metal-frame glasses'],
  ['dark-sunglasses', 'نظارة شمسية داكنة', 'dark sunglasses'],
  ['custom', 'مخصص', 'custom glasses']
];

export const EXTRA_POSES = [
  ['one-hand-pocket', 'يد في الجيب', 'standing naturally with one hand in a pocket'],
  ['both-hands-pockets', 'اليدان في الجيب', 'standing naturally with both hands in pockets'],
  ['free-hand-hair', 'اليد الحرة قرب الشعر', 'relaxed pose with the free hand near the hair'],
  ['arms-loose', 'الذراعان مرتخيتان', 'standing with both arms hanging naturally'],
  ['turning-slightly', 'يلتفت قليلًا', 'slightly turning the torso naturally'],
  ['looking-away-pose', 'وقفة مع نظر بعيد', 'relaxed standing pose while looking slightly away'],
  ['mid-step', 'خطوة أثناء المشي', 'natural mid-step walking pose'],
  ['wall-lean', 'اتكاء خفيف على جدار', 'light natural lean against a wall'],
  ['counter-lean', 'اتكاء على سطح قريب', 'casually leaning on a nearby surface'],
  ['custom', 'مخصص', 'custom pose']
];

export const EXTRA_ANGLES = [
  ['near-profile-left', 'شبه بروفايل أيسر', 'near-left-profile angle'],
  ['near-profile-right', 'شبه بروفايل أيمن', 'near-right-profile angle'],
  ['high-left-diagonal', 'قطرية أعلى اليسار', 'high-left diagonal angle'],
  ['high-right-diagonal', 'قطرية أعلى اليمين', 'high-right diagonal angle'],
  ['low-left-diagonal', 'قطرية أسفل اليسار', 'low-left diagonal angle'],
  ['low-right-diagonal', 'قطرية أسفل اليمين', 'low-right diagonal angle'],
  ['slight-left-offset', 'انحراف بسيط لليسار', 'slight left camera offset'],
  ['slight-right-offset', 'انحراف بسيط لليمين', 'slight right camera offset'],
  ['custom', 'مخصص', 'custom camera angle']
];

export const EXTRA_FRAMINGS = [
  ['face-dominant', 'الوجه هو المسيطر', 'close face-dominant framing'],
  ['head-upper-torso', 'الرأس وأعلى الجذع', 'head-and-upper-torso framing'],
  ['waist-up', 'من الخصر وفوق', 'waist-up framing'],
  ['environmental-portrait', 'الشخص مع مساحة أكبر للبيئة', 'environmental portrait framing with more scene context'],
  ['custom', 'مخصص', 'custom framing']
];

export const EXTRA_LIGHT_SOURCES = [
  ['ceiling-downlight', 'إضاءة سقفية مباشرة', 'ordinary ceiling downlight'],
  ['warm-room-light', 'إضاءة غرفة دافئة', 'warm indoor room practical lighting'],
  ['cool-room-light', 'إضاءة غرفة باردة', 'cool indoor room practical lighting'],
  ['shop-signage', 'إضاءة واجهات ومحلات', 'mixed light from nearby generic storefronts'],
  ['cafeteria-light', 'إضاءة كافتيريا', 'modest cafeteria practical lighting'],
  ['restaurant-light', 'إضاءة مطعم', 'ordinary restaurant practical lighting'],
  ['majlis-light', 'إضاءة مجلس', 'ordinary modern majlis practical lighting'],
  ['parking-pole-led', 'أعمدة LED في موقف', 'ordinary parking-pole LED lighting'],
  ['security-light', 'كشاف أمني خارجي', 'ordinary exterior security light'],
  ['soft-cloudy-daylight', 'نهار غائم ناعم', 'soft overcast daylight'],
  ['sunset-ambient', 'ضوء غروب طبيعي', 'natural sunset ambient light'],
  ['custom', 'مخصص', 'custom physical light source']
];

export const EXTRA_LOCATIONS = [
  ['neighborhood-grocery', 'أمام بقالة حي', 'outside a generic Saudi neighborhood grocery'],
  ['laundry-front', 'أمام مغسلة ملابس', 'outside a generic Saudi neighborhood laundry shop'],
  ['barber-front', 'أمام حلاق محلي', 'outside a generic Saudi local barbershop'],
  ['pharmacy-front', 'أمام صيدلية عامة', 'outside a generic Saudi pharmacy'],
  ['bakery-front', 'أمام مخبز محلي', 'outside a generic Saudi local bakery'],
  ['small-plaza', 'ساحة محلات صغيرة', 'a small generic Saudi neighborhood retail plaza'],
  ['apartment-parking', 'موقف عمارة سكنية', 'a generic Saudi apartment-building parking area'],
  ['villa-driveway', 'ممر سيارة أمام فيلا', 'a generic Saudi residential villa driveway'],
  ['school-area', 'منطقة مدارس بعد الدوام', 'a generic Saudi school-area street without identifiable signage'],
  ['clinic-parking', 'موقف عيادة', 'a generic Saudi neighborhood clinic parking area'],
  ['warehouse-street', 'شارع مستودعات خفيف', 'a generic Saudi light-warehouse street'],
  ['construction-edge', 'طرف منطقة بناء', 'the edge of a generic Saudi construction area'],
  ['date-shop-front', 'أمام محل تمور عام', 'outside a generic Saudi date shop'],
  ['small-office-lobby', 'لوبي مكتب صغير', 'a generic small Saudi office lobby'],
  ['building-corridor', 'ممر داخل مبنى', 'a generic indoor corridor in a Saudi building'],
  ['home-entry-hall', 'مدخل منزل داخلي', 'a generic Saudi home entry hall'],
  ['roof-terrace', 'سطح منزل بسيط', 'a generic Saudi residential roof terrace'],
  ['custom', 'مخصص', 'a custom generic location in Saudi Arabia']
];
