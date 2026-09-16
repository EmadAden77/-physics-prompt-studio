const CLOTHING_REALISM_SUFFIX = ' Preserve textile-specific weight, thickness, weave, seam construction, gravity-driven drape, compression at shoulders/elbows/waist/seat, realistic stretch only where the fabric allows it, small asymmetric wrinkles, restrained highlights, and no plastic-like smoothness or fashion-catalog perfection.';

function clothing(group, value, label, prompt) {
  return { group, value, label, prompt: `${prompt}.${CLOTHING_REALISM_SUFFIX}` };
}

export const EXTRA_CLOTHING_OPTIONS = [
  clothing('ثياب سعودية', 'offwhite_thobe', 'ثوب أوف وايت', 'an off-white Saudi thobe in medium-light cotton poplin with slight tonal warmth, crisp collar structure, natural vertical drape, and soft compression creases at the elbows and seat'),
  clothing('ثياب سعودية', 'skyblue_thobe', 'ثوب أزرق سماوي هادئ', 'a muted sky-blue Saudi thobe in matte woven cotton blend with realistic collar stiffness, soft body drape, restrained highlights, and natural sleeve folding'),
  clothing('ثياب سعودية', 'stone_thobe', 'ثوب حجري فاتح', 'a light stone-grey Saudi thobe in breathable woven fabric with subtle texture, medium-soft drape, small cuff creases, and realistic body contact'),
  clothing('ثياب سعودية', 'darkgreen_thobe', 'ثوب أخضر داكن', 'a dark muted green Saudi thobe in medium-weight matte fabric with deep but not crushed shadow detail, broad gravity folds, and natural tension around shoulders and elbows'),
  clothing('ثياب سعودية', 'brown_winter_thobe', 'ثوب شتوي بني', 'a warm brown winter Saudi thobe in heavier brushed woven fabric with increased thickness, broader folds, slower drape, soft surface nap, and restrained low-gloss highlights'),
  clothing('ثياب سعودية', 'grey_winter_thobe', 'ثوب شتوي رمادي', 'a medium-grey winter thobe in dense woven fabric with believable weight, thicker collar and cuff structure, broad seated folds, and subtle wool-like surface texture'),
  clothing('ثياب سعودية', 'white_thobe_red_shemagh', 'ثوب أبيض + شماغ أحمر وعقال', 'a plain white Saudi thobe paired with a red-and-white shemagh and one realistic black agal; the thobe keeps crisp cotton-poplin structure while the shemagh shows woven thickness, gravity-driven asymmetry, crown contact, and natural shoulder folds'),
  clothing('ثياب سعودية', 'white_thobe_white_ghutra', 'ثوب أبيض + غترة بيضاء وعقال', 'a white Saudi thobe paired with a white ghutra and one black agal; preserve subtle fabric separation between thobe and ghutra, natural translucency only at thin ghutra edges, and physically correct head-and-shoulder contact'),
  clothing('ثياب سعودية', 'navy_thobe_red_shemagh', 'ثوب كحلي + شماغ أحمر وعقال', 'a dark navy Saudi thobe paired with a red-and-white shemagh and one black agal, with matte thobe fabric, realistic color contrast, asymmetric shemagh drape, and no ceremonial over-styling'),
  clothing('ثياب سعودية', 'formal_bisht_thobe', 'ثوب رسمي + بشت خفيف', 'a clean Saudi thobe with a lightweight formal bisht worn naturally over the shoulders; the bisht hangs with long gravity-driven folds, subtle edge trim, limited sheen, realistic sleeve openings, and no costume-like stiffness'),

  clothing('كاجوال', 'lightblue_oxford_beige_chinos', 'قميص أكسفورد أزرق + تشينو بيج', 'a light-blue Oxford shirt with beige chinos; the shirt has visible basket-weave texture, collar and placket structure, small elbow and waist creases, while the chinos have matte twill texture and realistic knee and hip folding'),
  clothing('كاجوال', 'white_oxford_charcoal_trousers', 'قميص أبيض + بنطال فحمي', 'a white Oxford shirt with charcoal trousers, with realistic cotton weave, slight translucency control in bright light, natural sleeve creases, trouser break and seat compression, and restrained formal-casual structure'),
  clothing('كاجوال', 'beige_linen_shirt_offwhite_trousers', 'قميص كتان بيج + بنطال فاتح', 'a beige linen shirt with off-white trousers; the linen shows irregular slub texture, breathable soft wrinkling, slightly crushed folds at elbows and waist, while the trousers keep heavier structured drape'),
  clothing('كاجوال', 'black_overshirt_grey_tshirt', 'أوفرشيرت أسود + تيشيرت رمادي', 'a black cotton-twill overshirt worn open over a grey crew-neck T-shirt, with distinct material behavior between structured overshirt panels and softer jersey underneath, plus realistic layered folds'),
  clothing('كاجوال', 'denim_overshirt_white_tshirt', 'أوفرشيرت دنيم + تيشيرت أبيض', 'a mid-weight denim overshirt over a plain white T-shirt, with visible denim weave, seam bulk, elbow creasing, slightly firmer drape, and soft jersey tension underneath'),
  clothing('كاجوال', 'charcoal_hoodie_joggers', 'هودي فحمي + جوغر', 'a charcoal cotton-fleece hoodie with matching or black joggers, showing thick ribbed cuffs, hood weight, rounded fleece folds, pocket sag, knee bunching, and realistic seated compression'),
  clothing('كاجوال', 'navy_crewneck_jeans', 'سويت شيرت كحلي + جينز', 'a navy crew-neck sweatshirt with dark straight-fit jeans, with soft fleece-body folds, ribbed collar and cuffs, denim stiffness at knees and hips, and natural contrast between the two fabrics'),
  clothing('كاجوال', 'olive_field_jacket_tshirt', 'جاكيت ميداني زيتي + تيشيرت', 'a lightweight olive field jacket over a plain T-shirt, with structured pocket flaps, zipper and seam tension, mild sleeve crumpling, matte synthetic-cotton response, and softer jersey underneath'),
  clothing('كاجوال', 'black_bomber_tshirt', 'بومبر أسود + تيشيرت', 'a black lightweight bomber jacket over a plain T-shirt, with realistic rib-knit collar and cuffs, slight nylon sheen only on highlight-facing folds, zipper weight, and natural puffing around elbows and waist'),
  clothing('كاجوال', 'sand_knit_sweater_dark_trousers', 'كنزة رملية + بنطال داكن', 'a sand-colored fine-knit sweater with dark trousers, showing visible knit structure, soft shoulder drape, subtle elbow stretching, gentle hem compression, and heavier trouser folds'),
  clothing('كاجوال', 'navy_henley_chinos', 'هنلي كحلي + تشينو', 'a navy cotton Henley shirt with neutral chinos, with soft jersey texture, realistic button-placket structure, torso tension, elbow creases, and matte twill trousers'),

  clothing('رياضي', 'black_gym_tshirt_shorts', 'تيشيرت رياضي أسود + شورت', 'a black moisture-wicking gym T-shirt with athletic shorts, with thin technical-knit texture, slight sweat-darkening only where plausible, body-conforming tension without painted-on tightness, and lightweight shorts with movement folds'),
  clothing('رياضي', 'navy_gym_tshirt_joggers', 'تيشيرت رياضي كحلي + جوغر', 'a navy performance T-shirt with charcoal joggers, with breathable knit texture, mild post-workout dampness where plausible, natural shoulder and torso stretch, and soft jogger folds at hips and knees'),
  clothing('رياضي', 'grey_training_top_black_pants', 'بلوزة تدريب رمادية + بنطال أسود', 'a heather-grey athletic training top with black tapered pants, with subtle technical-fabric grain, realistic moisture response, seam tension around shoulders, and non-glossy stretch fabric at the legs'),
  clothing('رياضي', 'lightweight_track_jacket', 'جاكيت رياضي خفيف', 'a lightweight matte track jacket over a simple athletic shirt with tapered training pants, showing thin-shell folds, zipper behavior, cuff compression, and restrained synthetic highlights rather than plastic shine'),

  clothing('سمارت كاجوال', 'navy_blazer_blue_shirt', 'بليزر كحلي + قميص أزرق فاتح', 'a navy single-breasted blazer over a light-blue shirt with neutral trousers, with realistic wool-blend grain, lapel roll, shoulder structure, elbow bends, shirt collar interaction, and natural jacket opening around the seated or standing torso'),
  clothing('سمارت كاجوال', 'charcoal_blazer_white_tshirt', 'بليزر فحمي + تيشيرت أبيض', 'a charcoal blazer over a plain white T-shirt, combining structured jacket shoulders and lapels with softer jersey underneath, realistic sleeve creases, and no editorial-fashion stiffness'),
  clothing('سمارت كاجوال', 'beige_overshirt_black_tshirt', 'أوفرشيرت بيج + تيشيرت أسود', 'a beige structured overshirt over a plain black T-shirt with dark trousers, with visible cotton-twill grain, pocket structure, layered hem behavior, realistic elbow folds, and matte color response'),
  clothing('سمارت كاجوال', 'navy_polo_beige_chinos', 'بولو كحلي + تشينو بيج', 'a navy pique polo with beige chinos, showing true pique knit texture, collar shape, sleeve hem tension, small torso folds, matte twill trousers, and realistic seated or walking creasing'),
  clothing('سمارت كاجوال', 'white_polo_olive_chinos', 'بولو أبيض + تشينو زيتي', 'a white pique polo with muted olive chinos, with visible knit texture, controlled brightness, realistic collar stiffness, natural waist folds, and heavier chino drape at the legs'),

  clothing('رسمي', 'navy_suit_lightblue_shirt', 'بدلة كحلية + قميص أزرق', 'a navy two-piece suit with a light-blue dress shirt, with realistic wool-blend texture, proper lapel roll, shoulder structure, sleeve break, trouser crease and seat compression, and no glossy showroom fabric'),
  clothing('رسمي', 'charcoal_suit_white_shirt', 'بدلة فحمية + قميص أبيض', 'a charcoal suit with a white dress shirt, preserving subtle wool weave, natural jacket drape, lapel shadow, shirt cuff interaction, trouser break, and realistic wrinkles from sitting or arm movement'),
  clothing('رسمي', 'dark_brown_blazer_cream_shirt', 'بليزر بني داكن + قميص كريمي', 'a dark-brown textured blazer with a cream shirt and dark trousers, with visible woven jacket grain, realistic lapel and pocket structure, shirt softness, and modest everyday formal wear rather than luxury-ad styling'),

  clothing('شتوي', 'quilted_vest_knit', 'فيست مبطن + كنزة', 'a lightweight quilted vest over a fine-knit sweater with dark trousers, showing realistic stitched baffles, restrained synthetic highlights, knit compression under the vest, and natural bulk around the torso'),
  clothing('شتوي', 'charcoal_wool_jacket', 'جاكيت صوفي فحمي', 'a charcoal wool-blend casual jacket over a plain shirt or knit top, with soft brushed texture, structured collar, heavier sleeve folds, realistic button or zipper pull, and no polished catalog finish'),
  clothing('شتوي', 'sand_light_jacket', 'جاكيت خفيف رملي', 'a sand-colored lightweight jacket over a dark T-shirt with neutral trousers, with matte woven shell, realistic zipper and pocket construction, natural elbow creasing, and weather-appropriate layering')
];

export function enrichClothingPrompt(prompt = '') {
  const text = typeof prompt === 'string' ? prompt.trim() : '';
  if (!text) return text;
  return text.includes('textile-specific weight, thickness, weave') ? text : `${text}.${CLOTHING_REALISM_SUFFIX}`;
}
