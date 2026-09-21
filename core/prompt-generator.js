import { buildRealismPacket, renderRealismGuidance } from './realistic-image-generator.js';
import { baseSceneTypeFor, sceneMeta } from './scene-type-expansion.js';
import { clothingSceneCoherence, resolveContextAwareConstraints, getPoseCameraHint } from './scene-compatibility.js';
import { BEDROOM_ANCHOR, MAJLIS_ANCHOR, LAPTOP_SCENE_CONTEXTS, LAPTOP_SCENE_SEATED_POSES, BEDROOM_CLUTTER_LEVELS, BEDROOM_POSES, SELFIE_POSES, SAUDI_CULTURAL_DRESS_LOCK, SAUDI_SIGNAGE_RULE, CLOTHING_STYLING, HAND_INTERACTIONS, CLOTHING_CATALOG, HOME_CLOTHING, getFurnitureGeometryForScene, getAvailableProps, getRemainingHands, getPropHandUsage } from './scene-builder.js';
import { resolveCameraAngle } from './camera-angle-resolver.js';

export const SCENE_TYPES = [
  { value:'front_selfie', label:'سيلفي عادي', capture:'subject-held front-camera smartphone selfie', prompt:'a casual subject-held front-camera smartphone selfie with physically feasible arm-reach geometry', framing:'chest-up to mid-torso framing' },
  { value:'standing_selfie', label:'سيلفي واقف', capture:'subject-held front-camera smartphone selfie', prompt:'the subject standing naturally while taking the selfie himself', framing:'upper-body to waist-up framing' },
  { value:'seated_selfie', label:'سيلفي جالس', capture:'subject-held front-camera smartphone selfie', prompt:'the subject seated naturally with real support, cushion or chair contact, and relaxed posture', framing:'upper-body framing with enough context to prove the seated pose' },
  { value:'walking_selfie', label:'سيلفي أثناء المشي', capture:'subject-held front-camera smartphone selfie', prompt:'the subject walking slowly while holding the phone, with subtle gait asymmetry and mild handheld motion cues', framing:'upper-body framing with believable walking displacement' },
  { value:'inside_car_selfie', label:'سيلفي داخل السيارة', capture:'subject-held front-camera smartphone selfie', prompt:'the subject seated naturally inside a stationary vehicle while taking the selfie himself', framing:'driver/passenger-seat close framing with coherent cabin geometry' },
  { value:'majlis_selfie', label:'سيلفي مجلس', capture:'subject-held front-camera smartphone selfie', prompt:'a relaxed personal selfie inside a lived-in Saudi majlis, with ordinary hospitality context rather than staged luxury', framing:'three-quarter seated or standing upper-body framing' },
  { value:'cafe_selfie', label:'سيلفي مقهى', capture:'subject-held front-camera smartphone selfie', prompt:'a casual personal selfie inside a real contemporary cafe with ordinary patrons and practical fixtures', framing:'chest-up environmental selfie framing' },
  { value:'office_selfie', label:'سيلفي مكتب', capture:'subject-held front-camera smartphone selfie', prompt:'a casual personal selfie in a working office environment with ordinary desks, screens and practical lighting', framing:'chest-up to waist-up framing' },
  { value:'outdoor_selfie', label:'سيلفي خارجي', capture:'subject-held front-camera smartphone selfie', prompt:'a casual outdoor selfie with physically coherent weather, background depth and ambient light', framing:'upper-body environmental selfie framing' },
  { value:'mirror_selfie', label:'سيلفي مرآة', capture:'mirror selfie using a smartphone visible in the reflection', prompt:'a physically correct mirror selfie with the phone and hand visible in reflection and no impossible duplicate viewpoints', framing:'mirror-composed upper-body or three-quarter framing' },
  { value:'third_person_portrait', label:'بورتريه شخص ثالث', capture:'third-person smartphone photograph', prompt:'a natural third-person smartphone portrait photographed by another person', framing:'upper-body environmental portrait framing' },
  { value:'full_body_third_person', label:'جسم كامل — شخص ثالث', capture:'third-person smartphone photograph', prompt:'a full-body third-person smartphone photograph with correct foot-ground contact and human scale', framing:'full-body framing with visible ground contact' },
  { value:'candid_third_person', label:'لقطة عفوية — شخص ثالث', capture:'third-person candid smartphone photograph', prompt:'a candid third-person smartphone photograph with an unposed moment and natural attention away from the camera when appropriate', framing:'context-rich candid framing' }
];

export const CAMERA_PROFILES = [
  { value:'xiaomi15_front', label:'Xiaomi 15 Ultra — Front', prompt:'Xiaomi 15 Ultra front camera with a natural wide selfie look, realistic arm-length perspective, broad smartphone focus, modest HDR, restrained sharpening, and natural low-light texture' },
  { value:'iphone15pm_front', label:'iPhone 15 Pro Max — Front', prompt:'iPhone 15 Pro Max front camera with a natural wide selfie look, realistic computational exposure, broad smartphone focus, restrained sharpening and plausible low-light texture' },
  { value:'generic_front', label:'هاتف أمامي عام', prompt:'modern smartphone front camera with realistic wide selfie perspective, arm-length geometry, broad focus and restrained computational processing' },
  { value:'smartphone_rear', label:'هاتف — كاميرا خلفية', prompt:'modern smartphone rear camera with a natural wide perspective, broad environmental detail, restrained computational sharpening and no artificial DSLR look' }
];
export const ASPECT_RATIOS = [
  { value:'9:16', label:'9:16 عمودي', prompt:'vertical 9:16 composition' }, { value:'4:5', label:'4:5 عمودي', prompt:'vertical 4:5 composition' },
  { value:'1:1', label:'1:1 مربع', prompt:'square 1:1 composition' }, { value:'16:9', label:'16:9 أفقي', prompt:'horizontal 16:9 composition' }
];
export const EXPRESSIONS = [
  { value:'neutral-calm', label:'هدوء تام', prompt:'a calm neutral face with low orbicularis oris activity, lips resting together naturally, soft eyelids, relaxed cheeks, and no deliberate smile' },
  { value:'neutral-composed', label:'هدوء مع تعبير محكم', prompt:'a composed neutral face with minimal frontalis activity, level brows, relaxed orbicularis oris around the lips, and steady eyelids' },
  { value:'neutral-attentive', label:'انتباه محايد', prompt:'an attentive neutral expression with mild levator palpebrae activity, slightly more open eyelids, relaxed lips, and level brows' },
  { value:'neutral-thoughtful', label:'تأمل هادئ', prompt:'a mildly thoughtful neutral expression with low corrugator supercilii activity, subtly drawn brows, relaxed lips, and soft eyelids' },
  { value:'neutral-relaxed', label:'ارتخاء طبيعي', prompt:'a naturally relaxed face with minimal orbicularis oris tension, loosely resting lips, relaxed eyelids, soft cheeks, and an unstrained jaw' },
  { value:'smile-subtle', label:'ابتسامة خفيفة جدًا', prompt:'a very small closed-mouth smile with low zygomaticus major activity, gently lifted lip corners, relaxed orbicularis oculi, and calm cheeks' },
  { value:'smile-warm', label:'ابتسامة دافئة', prompt:'a warm closed-mouth smile with mild zygomaticus major activation, subtle orbicularis oculi engagement near the eyes, softly lifted cheeks, and relaxed lips' },
  { value:'smile-genuine', label:'ابتسامة صادقة (Duchenne)', prompt:'a genuine Duchenne smile with moderate zygomaticus major activation and clear orbicularis oculi engagement, lifted cheeks, narrowed lower eyelids, and a naturally closed mouth' },
  { value:'smile-soft', label:'ابتسامة ناعمة', prompt:'a soft closed-mouth smile with low zygomaticus minor and zygomaticus major activity, gently raised lip corners, relaxed eyelids, and soft cheeks' },
  { value:'smile-half', label:'نصف ابتسامة', prompt:'a restrained half smile with low zygomaticus major and risorius activity, one lip corner slightly higher than the other, mild cheek lift, and deliberate natural asymmetry' },
  { value:'focused-mild', label:'تركيز خفيف', prompt:'a mildly focused expression with low frontalis activity, steady brows, relaxed lips, slightly narrowed eyelids, and gentle jaw tone' },
  { value:'focused-deep', label:'تركيز عميق', prompt:'a deeply focused expression with moderate corrugator supercilii activity, slightly drawn brows, steady eyelids, closed relaxed lips, and controlled jaw tension' },
  { value:'thoughtful-upward', label:'تأمل بنظرة أعلى', prompt:'a thoughtful upward gaze with mild levator palpebrae activity, slightly raised upper eyelids, relaxed brows, closed lips, and soft cheeks' },
  { value:'contemplative', label:'تفكر هادئ', prompt:'a contemplative expression with low orbicularis oculi activity, relaxed eyelids, still lips, softened cheeks, and a quiet jaw' },
  { value:'curious', label:'فضول', prompt:'a curious expression with mild frontalis activity, slightly raised brows, attentive eyelids, relaxed lips, and soft cheeks' },
  { value:'mild-surprise', label:'دهشة خفيفة', prompt:'a mildly surprised expression with low frontalis activation, gently elevated brows, slightly widened eyelids, relaxed lips, and a softly released jaw' },
  { value:'mild-concern', label:'قلق خفيف', prompt:'a mildly concerned expression with low corrugator supercilii and frontalis activity, inner brows slightly raised, soft eyelids, closed lips, and light tension around the chin' },
  { value:'mild-doubt', label:'شك خفيف', prompt:'a mildly doubtful expression with low frontalis and corrugator supercilii activity, one brow slightly higher than the other, closed lips, restrained cheek movement, and natural asymmetry' },
  { value:'candid-mid-reaction', label:'رد فعل عفوي', prompt:'a candid mid-reaction with low risorius and orbicularis oris activity, lips shifting slightly off-center, one cheek fractionally more engaged, alert eyelids, and natural asymmetry' },
  { value:'laughing-soft', label:'ضحكة هادئة', prompt:'a soft laugh with moderate zygomaticus major and orbicularis oculi activation, lifted cheeks, smiling eyelids, parted lips, and only a small natural glimpse of teeth' },
  { value:'speaking-natural', label:'منتصف الكلام', prompt:'a natural mid-speech expression with mild orbicularis oris activity, lips parted in a plausible speech shape, relaxed cheeks, steady brows, and open attentive eyelids' },
  { value:'tired-end-of-day', label:'إرهاق نهاية اليوم', prompt:'subtle end-of-day fatigue with low levator palpebrae activity, slightly lowered upper eyelids, relaxed brows, softly closed lips, and gentle cheek heaviness' },
  { value:'content-satisfied', label:'رضا', prompt:'a quietly satisfied expression with low zygomaticus major activity, softly lifted lip corners, relaxed eyelids, calm cheeks, and a closed mouth' },
  { value:'reflective', label:'استغراق', prompt:'a reflective expression with low orbicularis oculi activity, gaze slightly downward through relaxed eyelids, still lips, soft cheeks, and a loose jaw' },
  { value:'quiet-confidence', label:'ثقة هادئة', prompt:'quiet confidence with mild frontalis stabilization, steady brows, relaxed eyelids, closed neutral lips, softly set cheeks, and a calm jaw' }
];
export const BACKGROUND_ACTIVITY = [
  { value:'quiet', label:'هادئ', prompt:'quiet background with no background people; preserve only context-appropriate environmental detail and vehicles when physically appropriate' },
  { value:'normal', label:'طبيعي', prompt:'ordinary background activity with 1-2 independently behaving background people where people are contextually appropriate, plus ordinary vehicles or objects when relevant' },
  { value:'lively', label:'حيوي', prompt:'lively but believable background activity with 5 to 7 independently behaving background people where people are contextually appropriate, natural spacing, varied behavior and no duplicated people' }
];
export const REALISM_LEVELS = [
  { value:'balanced', label:'واقعية متوازنة', prompt:'high photorealism with realistic anatomy, materials, lighting, environment and restrained smartphone processing' },
  { value:'strict', label:'واقعية صارمة', prompt:'strict forensic photorealism prioritizing physical causality, anatomy, contact mechanics, optical plausibility, material response and environmental consistency over aesthetics' },
  { value:'raw', label:'هاتف خام / عفوي', prompt:'raw casual smartphone realism with imperfect framing, mild sensor texture, limited dynamic range, subtle white-balance variation and no polished commercial finish' }
];
export const FRAMING_OPTIONS = [
  { value:'close', label:'قريب', prompt:'close selfie/portrait framing while keeping facial perspective physically plausible' },
  { value:'chest_up', label:'من الصدر', prompt:'chest-up framing' }, { value:'waist_up', label:'من الخصر', prompt:'waist-up framing' },
  { value:'three_quarter', label:'ثلاثة أرباع', prompt:'three-quarter body framing' }, { value:'full_body', label:'جسم كامل', prompt:'full-body framing with visible, correct ground contact' }
];

const DEFAULTS = { sceneType:SCENE_TYPES[0], camera:CAMERA_PROFILES[0], aspectRatio:ASPECT_RATIOS[0], expression:EXPRESSIONS[0], background:BACKGROUND_ACTIVITY[1], realism:REALISM_LEVELS[1], framing:FRAMING_OPTIONS[1] };
const ALL_CLOTHING = Object.freeze([...CLOTHING_CATALOG, ...HOME_CLOTHING]);
const CLOTHING_BY_VALUE = new Map(ALL_CLOTHING.map((item) => [item.value, item]));
const CLOTHING_STYLING_SCENE_TYPES = new Set([
  'front_selfie','standing_selfie','seated_selfie','walking_selfie',
  'office_selfie','cafe_selfie','majlis_selfie','outdoor_selfie',
  'inside_car_selfie','military_meal_selfie',
  'bedroom_selfie','bedroom_third_person',
  'third_person_portrait','full_body_third_person','candid_third_person'
]);
const CANONICAL_SECTIONS = ['GOAL','ACTION-DRIVEN AUTHENTICITY','CAPTURE TYPE LOCK — CRITICAL','IDENTITY / SUBJECT','SCENE','SAUDI CULTURAL DRESS','OBSERVABLE BACKGROUND ELEMENTS','CLOTHING','CONTEXTUAL ACCESSORIES','POSE & BODY MECHANICS','CAMERA GEOMETRY','PHYSICAL LIGHTING','MIRROR RULES','PRODUCT INTEGRATION','PHYSICAL / MATERIAL REALISM','SMARTPHONE IMAGE BEHAVIOR','LENS_PHYSICS','BIOLOGICAL_MICRO_REALISM','CAMERA_METADATA_HINT','AUTHENTIC IMPERFECTIONS','USER CONSTRAINTS','NEGATIVE CONSTRAINTS','FINAL VERIFICATION'];
const HAIR_LOCK = 'Hair length, density, and hair thickness remain as in the reference image when a reference image is attached. The DIRECTION and strand flow must follow the selected hairstyle direction and override the reference\'s default direction. Preserve the underlying hairline shape while allowing selected forward-falling strands to cover it naturally. Do not shorten, lengthen, thin, thicken, or recede the hairline. If no reference image is attached, keep the chosen baseline hair length and density stable and do not invent extra length or density solely to satisfy a hairstyle.';
function resolveHairDirection(hair='') {
  const text=clean(hair).toLowerCase();
  if(!text) return 'neutral';
  if(/\bmessy\b|\brandom\b|\bunstyled\b|\btousled\b|\bbreeze\b|no fixed direction/.test(text)) return 'messy';
  if(/\bbackward\b|slicked back|tied backward|pulled away from the face/.test(text)) return 'backward';
  if(/\bcenter\b|off-center/.test(text)) return 'center';
  if(/\bside\b|\blateral\b|subject[’']s left|subject[’']s right|parted deeply on one side|parted on one side/.test(text)) return 'side';
  if(/\bforward\b|toward the forehead|onto the forehead/.test(text)) return 'forward';
  return 'neutral';
}
const HAIR_DIRECTION_LOCKS=Object.freeze({
  backward:'Selected direction is BACKWARD. The dominant visible flow must run from the forehead toward the back of the head. No strands may fall forward onto the forehead. Hairline must remain fully visible.',
  forward:'Selected direction is FORWARD. Visible strands must flow toward and onto the forehead. The front section must visibly droop or fall forward so that several strands rest on or over the upper forehead. The hairline must be at least partially covered by these forward-falling strands. Do not sweep the front hair backward.',
  side:'Selected direction is SIDE-PARTED. The selected side parting line must be clearly visible and the hair must flow naturally away from that line. Do not replace the selected side part with a backward sweep.',
  center:'Selected direction is CENTER-PARTED. A visible center or explicitly off-center parting line must remain clear, with hair flowing to both sides. Do not replace the selected center structure with a backward sweep.',
  messy:'Selected direction is MESSY. Preserve visibly disordered, non-uniform strand flow. Do not convert it into a clean, uniformly combed arrangement.'
});
const HAIR_DIRECTION_NEGATIVES=Object.freeze({
  backward:'forward-combed front hair, strands falling forward onto the forehead',
  forward:'backward-swept front hair, fully exposed forehead caused by a backward sweep',
  side:'backward sweep that erases or overrides the selected side parting line',
  center:'backward sweep that erases or overrides the selected center parting line',
  messy:'uniformly slicked or cleanly combed hair that removes the selected disorder'
});
function hairDirectionLock(hair){
  const rule=HAIR_DIRECTION_LOCKS[resolveHairDirection(hair)];
  return `HAIR DIRECTION LOCK: ${rule || 'Keep visible hair naturally arranged without inventing a directional style.'}`;
}
function hairDirectionNegatives(hair){ return HAIR_DIRECTION_NEGATIVES[resolveHairDirection(hair)] || ''; }

function carSeatRole(requestedSceneType='', poseValue='') {
  const requested=clean(requestedSceneType);
  const pose=clean(poseValue);
  if(requested==='inside_car_driver_selfie') return 'driver';
  if(requested==='inside_car_passenger_selfie') return 'passenger';
  if(requested!=='inside_car_selfie') return '';
  return pose==='driver_seat' ? 'driver' : 'passenger';
}

function normalizeInsideCarCameraGeometry(cameraText,requestedSceneType,poseValue) {
  const role=carSeatRole(requestedSceneType,poseValue);
  if(!role) return cameraText;
  let text=clean(cameraText);
  if(role==='driver'){
    text=text.replace(/\bsubject-held\b/gi,'driver-held');
    return /\bdriver-held\b/i.test(text) ? text : `driver-held front-camera selfie from the driver seat. ${text}`.trim();
  }
  text=text
    .replace(/\bdriver-held\b/gi,'subject-held')
    .replace(/steering-wheel perspective/gi,'passenger-side cabin perspective')
    .replace(/dashboard and steering-wheel geometry/gi,'dashboard, glazing, and passenger-side cabin geometry');
  return /\bsubject-held\b/i.test(text) ? text : `subject-held front-camera selfie from the front passenger seat. ${text}`.trim();
}

const SAUDI_CONTEXT = /(?:^|[^a-z])(saudi(?: arabia)?|riyadh|jeddah|khobar|dammam|makkah|madinah|medina|taif|abha|tabuk|alula|qassim|hail|najran|jazan|alahsa|al ahsa|yanbu|arabian gulf|red sea)(?:$|[^a-z])/i;
// TODO(location-classification): refine Saudi context detection
// to prefer structured location values over broad regex matching.
const CAPTURE_IMPERFECTIONS = 'Allow capture-level imperfections only: tiny handheld roll, slight off-center crop, minor exposure or white-balance variation, subtle edge softness, restrained shadow sensor noise, and modest highlight clipping when caused by real practical lights.';
const BACKGROUND_HUMAN_INTEGRITY_RULE = 'Background humans must have distinct identities, intact anatomy with correctly formed limbs and hands, perspective-consistent scale relative to camera distance, real ground contact, correct occlusion by foreground objects, and independent silhouettes. No fused bodies, no cloned faces, no deformed background hands.';
const POSE_HAND_USAGE_FALLBACK = new Set([...SELFIE_POSES, ...BEDROOM_POSES].map((item) => item.value));

function clean(value){ return typeof value === 'string' ? value.trim() : ''; }
function normalizedClothingDescriptor(value) {
  return clean(value).replace(/(?:\.\.\.|…)+$/u, '').trim().toLowerCase();
}
function resolveClothingItem(input) {
  const explicitValue = clean(input.clothingValue);
  if (explicitValue && CLOTHING_BY_VALUE.has(explicitValue)) return CLOTHING_BY_VALUE.get(explicitValue);
  const raw = clean(input.clothing);
  if (!raw) return null;
  if (CLOTHING_BY_VALUE.has(raw)) return CLOTHING_BY_VALUE.get(raw);
  const probe = normalizedClothingDescriptor(raw);
  let best = null;
  let bestScore = -1;
  for (const item of ALL_CLOTHING) {
    const itemPrompt = normalizedClothingDescriptor(item.prompt);
    if (!itemPrompt) continue;
    if (itemPrompt === probe || itemPrompt.startsWith(probe) || probe.startsWith(itemPrompt)) {
      const score = Math.min(itemPrompt.length, probe.length);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
  }
  return best;
}
function optionAppliesToGarment(option, garmentTags) {
  const applicableTo = option?.applicableTo || [];
  return applicableTo.includes('all') || applicableTo.some((tag) => garmentTags.has(tag));
}
function pick(options,value,fallback){ return options.find((item)=>item.value===value) || fallback; }
function section(title,body){ return `[${title}]\n${clean(body)}`; }
function isSaudi(location){ return SAUDI_CONTEXT.test(clean(location)); }
function captureDeviceRule(capture=''){
  const value=clean(capture).toLowerCase();
  if(value.includes('mirror')) return 'smartphone visible in the mirror reflection';
  if(value.includes('third-person')) return 'none held by the subject; photographed by another person';
  if(value.includes('selfie')) return 'smartphone held in the subject\'s hand';
  return 'no camera device held by the subject unless explicitly required by the scene';
}
function captureRules(scene){
  if (/mirror selfie/i.test(scene.capture)) return 'Capture type is locked to a true mirror selfie. The phone must exist inside the mirror reflection, reflection geometry must be consistent, and the image must not silently become a direct front-camera selfie or a third-person photograph.';
  if (/selfie/i.test(scene.capture)) return 'Capture type is locked to a subject-held smartphone selfie. Camera position must remain reachable by the subject at ordinary arm length; shoulder, elbow, wrist, torso rotation and perspective must agree with the phone position. Never silently convert the shot into a third-person camera, floating camera, mirror shot or telephoto portrait.';
  return 'Capture type is locked to a third-person smartphone photograph. The subject is not holding the camera. Preserve a physically plausible photographer viewpoint, distance and perspective; do not introduce a selfie arm or mirror logic.';
}
function identityRules(enabled,hair){
  const identity = enabled ? 'If a reference image is attached, use it strictly as the sole identity anchor. Preserve recognizable facial identity, skull and face proportions, natural asymmetry, skin tone, apparent age, hairline, visible hair density and texture, beard density and gaps, and moustache pattern. Do not copy the reference background, pose, clothing, lighting or framing unless separately requested. No beautification, face slimming, jaw sharpening, eye enlargement, de-aging, skin smoothing, symmetry correction, thicker hair or denser beard.' : 'No reference identity is required. Keep the subject anatomically natural and internally consistent across the image.';
  const selectedHair=clean(hair).replace(/\.+$/u,'');
  const hairDirection = selectedHair ? `Selected hair styling direction: ${selectedHair}. ${hairDirectionLock(selectedHair)}` : 'Hair styling direction: keep the visible hair naturally arranged unless a specific style is selected.';
  return `${identity} ${hairDirection} ${HAIR_LOCK}`;
}
function geometryRules(scene,camera,framing,angle,distance,hasExplicitFraming){
  const d = clean(distance) || (scene.capture.includes('selfie') ? 'natural arm-reach distance, approximately 40–60 cm unless the selected angle requires a minor physically plausible adjustment' : 'a natural third-person smartphone shooting distance appropriate to the framing');
  return `${camera.prompt}. ${hasExplicitFraming ? framing.prompt : scene.framing}. ${angle || 'Use a natural eye-level or slightly off-axis camera angle.'} Camera distance: ${d}. Preserve realistic wide-angle perspective and human scale; no impossible camera placement.`;
}
export function resolveLensPhysics({ scene = '', captureType = '', camera = '', framing = '', cameraDistance = '' } = {}) {
  const sceneValue = clean(typeof scene === 'string' ? scene : scene?.value).toLowerCase();
  const capture = clean(captureType || (typeof scene === 'object' ? scene?.capture : '')).toLowerCase();
  const cameraValue = clean(typeof camera === 'string' ? camera : camera?.value).toLowerCase();
  const frame = clean(typeof framing === 'string' ? framing : framing?.value).toLowerCase();
  const distance = clean(cameraDistance).toLowerCase();
  const mirror = capture.includes('mirror') || sceneValue.includes('mirror');
  const thirdPerson = capture.includes('third-person');
  if (cameraValue === 'xiaomi15_front') {
    return 'LENS PHYSICS (mandatory): Use the Xiaomi 15 Ultra front-camera optical profile: approximately 21mm-equivalent field of view (~90° diagonal). Preserve only mild residual optical imperfections that would plausibly remain after normal smartphone computational correction; do not force decorative barrel distortion, chromatic aberration, or vignetting.';
  }
  const nearThirdPerson = thirdPerson && /(?:close|near|\b0\.\d+\s*m\b|\b1(?:\.\d+)?\s*m\b)/.test(distance);
  // Fallback profile is reserved for unknown or forward-compatible camera values.
  let focal = 24, fov = 84, distortion = '1.5-2.5%', vignette = '8-12%';
  if (thirdPerson) {
    [focal, fov, distortion, vignette] = nearThirdPerson ? [26, 80, '1-1.5%', '6-10%'] : [28, 75, '0.5-1%', '4-8%'];
  } else if (cameraValue === 'iphone15pm_front' || cameraValue === 'generic_front') {
    [focal, fov, distortion, vignette] = [24, 84, '1.5-2.5%', '8-12%'];
  } else if (cameraValue === 'smartphone_rear') {
    [focal, fov, distortion, vignette] = [26, 80, '1-1.5%', '6-10%'];
  }
  const edge = frame === 'close' ? 'Close framing may crop some outer-edge falloff, so keep visible vignetting near the low end of that range.' : frame === 'full_body' ? 'Full-body framing retains more of the image circle, so keep the full natural edge falloff visible without exaggeration.' : 'Keep edge falloff gradual and non-decorative.';
  const flare = thirdPerson ? 'Keep lens flare and ghosting minimal and only when a bright source is actually in or near the frame.' : mirror ? 'Allow only restrained off-axis lens flare and ghosting when a bright source is actually in or near the frame.' : 'Preserve natural lens flare and ghosting only when a bright source is actually in or near the frame.';
  return `LENS PHYSICS (mandatory): Use an approximately ${focal}mm-equivalent smartphone field of view (~${fov}° diagonal). Preserve mild lateral chromatic aberration on high-contrast edges near frame corners. Preserve approximately ${distortion} barrel distortion appropriate to this optical profile. Preserve mild vignetting with roughly ${vignette} corner falloff relative to center. ${edge} ${flare} Do not add artificial or decorative lens effects.`;
}

function backgroundRules(background,contextual,saudi){
  if (contextual.privateContext || background.value === 'quiet') return 'no background people; no other people appear in this frame. Preserve only context-appropriate environmental detail and ordinary objects.';
  if (background.value === 'normal') return 'ordinary background activity with 1-2 independently behaving background people where people are contextually appropriate, kept secondary to the subject.';
  if (saudi) return 'lively but believable background activity with 5 to 7 background people: men in white thobes, women in plain black abayas with black niqabs covering everything except the eyes, and one person holding a shopping bag. Their actions are varied and independent: walking, standing, and one person at a counter where a counter physically exists. Keep natural spacing and no duplicated identities.';
  return 'lively but believable background activity with 5 to 7 independently behaving background people, with varied natural actions such as walking and standing and one person interacting with a context-appropriate counter or fixture where present.';
}
function backgroundElements(background,contextual,saudi){
  if (contextual.privateContext || background.value === 'quiet') return ['context-appropriate furniture, fixtures or environmental objects in believable scale', 'no other people appear in this frame'];
  if (background.value === 'normal') return ['context-appropriate environmental objects and circulation space', '1-2 independently behaving background people kept secondary to the subject'];
  return saudi
    ? ['context-appropriate environmental objects and circulation space', '5 to 7 distinct background people with natural spacing: men in white thobes and women in plain black abayas with black niqabs', 'varied independent actions including walking, standing, and one person holding a shopping bag; use a counter interaction only where a counter physically exists']
    : ['context-appropriate environmental objects and circulation space', '5 to 7 distinct independently behaving background people with natural spacing and varied walking, standing, or fixture interaction'];
}
function lightingRules(lighting,notes,realismLevel){
  const selected = clean(lighting) || 'Use lighting appropriate to the chosen time and location, produced only by physically plausible visible or inferable sources.';
  const exclusivePhoneLight = /no other light sources visible in frame/i.test(selected);
  const note = clean(notes) && !exclusivePhoneLight ? ` Additional lighting direction: ${clean(notes)}.` : '';
  const raw = realismLevel === 'raw' ? ' Deliberately underexposed in midtones and shadows. Accept visible noise in shadow regions. Do not lift shadows with HDR. Slight motion blur from handheld capture is acceptable. White balance may be slightly off-neutral.' : '';
  return `${selected}${note} Physical illumination alone determines which surfaces receive light, shadow direction and softness, highlights, reflections, material brightness and local contrast. Exposure, ISO, HDR, tone mapping and noise reduction may only reveal or process captured signal; they must never create illumination that no physical source provides. Respect realistic falloff for nearby weak lights, occlusion, bounce light, practical fixture direction and realistic background falloff.${raw}`;
}
const METADATA_EXPOSURE=Object.freeze({
  midday:'approx. ISO 50-100, approx. 1/500-1/1000s',golden:'approx. ISO 100-200, approx. 1/250-1/500s',soft_day:'approx. ISO 100-250, approx. 1/125-1/250s',window_day:'approx. ISO 100-320, approx. 1/100-1/200s',
  warm_indoor:'approx. ISO 400-800, approx. 1/60-1/100s',bright_indoor:'approx. ISO 200-500, approx. 1/100-1/125s',night:'approx. ISO 800-1600, approx. 1/30-1/60s',very_low:'approx. ISO 1600-3200, approx. 1/15-1/30s',flash:'approx. ISO 100-400, approx. 1/60-1/120s',
  indoor:'approx. ISO 200-800, approx. 1/60-1/125s',unknown:'plausible automatic ISO and shutter behavior appropriate to the available light; no exact EXIF values are asserted'
});
// At any future lighting profile addition, update this mapping.
const LIGHTING_METADATA_CLASS=Object.freeze({
  day_direct_sun:'midday',day_open_shade:'soft_day',day_overcast:'soft_day',day_window:'window_day',golden_hour:'golden',blue_sky_noon:'midday',car_daylight:'window_day',
  supermarket_fluorescent:'bright_indoor',retail_ceiling_led:'bright_indoor',mixed_retail:'bright_indoor',night_led_street:'night',night_parking_led:'night',night_storefront:'night',night_gas_station:'night',night_corniche:'night',night_desert_vehicle:'night',
  night_majlis_warm:'warm_indoor',night_cafe_mixed:'warm_indoor',night_office_led:'bright_indoor',night_home_warm:'warm_indoor',night_phone_screen:'very_low',night_car_practicals:'night',night_car_screen_only:'very_low',screen_flash_only:'very_low',phone_led_flash_only:'flash',low_key_bedroom:'very_low'
});
function fallbackMetadataClass(lighting){
  const text=clean(lighting).toLowerCase();
  if(['phone screen','screen only','screen-only'].some((term)=>text.includes(term))) return 'very_low';
  if(['night','pitch-dark','near-dark'].some((term)=>text.includes(term))) return 'night';
  if(['direct daytime sunlight','direct sun','midday sun','high-elevation midday'].some((term)=>text.includes(term))) return 'midday';
  if(['indoor','window','ceiling','lamp','fluorescent','office','retail'].some((term)=>text.includes(term))) return 'indoor';
  return 'unknown';
}
function resolveCameraMetadata(camera,lighting,lightingValue=''){
  if(camera.value==='xiaomi15_front') return 'CAPTURE METADATA (for scene fidelity): Shot on the Xiaomi 15 Ultra front camera: 32MP front-camera behavior, approximately 21mm equivalent, f/2.0, ~90° FOV, handheld with automatic smartphone exposure appropriate to the actual available light.';
  const canonical=clean(lightingValue), exposure=METADATA_EXPOSURE[canonical ? (LIGHTING_METADATA_CLASS[canonical] || 'unknown') : fallbackMetadataClass(lighting)];
  const capture=camera.value==='iphone15pm_front' ? 'Shot on iPhone 15 Pro Max front camera with a natural wide selfie field of view' : camera.value==='smartphone_rear' ? 'Shot on a modern smartphone rear camera with a natural wide field of view' : 'Shot on a modern smartphone front camera with a natural wide selfie field of view';
  return `CAPTURE METADATA (for scene fidelity): ${capture}, ${exposure}, handheld.`;
}
function negatives(scene,hair,majlisUpholsteryScope = false){
  const capture = scene.capture.includes('third-person') ? 'selfie arm, implied subject-held camera' : scene.capture.includes('mirror') ? 'direct front-camera viewpoint outside the mirror, duplicate phone or hands' : 'third-person viewpoint, floating external camera, mirror capture unless explicitly selected';
  const majlisUpholstery = majlisUpholsteryScope
    ? 'tufted upholstery, button-tufted cushions, quilted fabric, patterned upholstery, contrasting cushion fabrics, nail-head trim, decorative piping on seating, visible buttons on back cushions, dotted upholstery, speckled fabric, checkered weave, grid-textured cushions, knitted-appearance upholstery, visible weft or thread pattern on seating, contrasting-thread weave, slub-like texture on sofa fabric, visible linen grain on upholstery, '
    : '';
  const hairExclusions=hairDirectionNegatives(hair);
  const forwardHairRequirement=resolveHairDirection(hair)==='forward' ? ' REQUIRED: forward-falling front strands visibly resting on the upper forehead.' : '';
  return `Avoid: plastic skin, waxy or porcelain skin, face reconstruction, artificial symmetry, malformed hands, extra fingers, duplicated limbs, floating objects, impossible body support, incorrect contact shadows, melted textiles, melted fabric, floating clothes, deformed abs, impossible anatomy, morphing sofa, split furniture, merged furniture, disconnected armrest, two sofas merged, ${majlisUpholstery}furniture with disconnected legs, furniture floating above the ground, repeated background people, cloned props, impossible reflections, invisible artificial key lights, fake rim lights, excessive HDR, aggressive orange-teal grading, DSLR-style bokeh, over-sharpening, oversaturated skin, sterile showroom staging, generic static posing, advertisement-style product placement, artificial lens flare, beauty filtering, symmetric face, missing corneal reflections, deformed background people, fused background bodies, cloned background faces, floating background people, mis-scaled background humans, background people without ground contact, gibberish text, pseudo-Arabic script, garbled signs, English-only signage in Saudi scenes, fictional characters on signs${hairExclusions ? `, ${hairExclusions}` : ''}.${forwardHairRequirement} Capture-specific exclusions: ${capture}.`;
}
function verification(scene,ratio,guidance,hair){
  const hairCheck=resolveHairDirection(hair)==='neutral'
    ? 'hair remains naturally arranged without an invented directional lock'
    : 'the selected hair direction is unmistakably visible; no strands contradict the selected direction; stray hairs (if visible) respect the selected direction';
  return `Before finalizing, verify: capture type unmistakably matches “${scene.capture}”; the camera position is physically possible; anatomy and contacts are coherent; selected location and clothing are visible and mutually compatible; ${hairCheck}; selected pose, angle and lighting are visible and mutually compatible; lighting can be traced to plausible physical sources; materials respond differently according to their properties; background scale and requested activity level make sense; composition is ${ratio.prompt}; and the realism checklist is satisfied: ${guidance.consistency.replace(/^Before finalizing, verify:\s*/i,'')} If a secondary aesthetic choice conflicts with physical causality or capture geometry, preserve physical plausibility.`;
}

function splitIntoClauses(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+|\n\n(?=\[)|\n(?=\[)/g)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function hasPositiveUse(text, term) {
  const clauses = splitIntoClauses(text);
  const negationPattern = /\b(no|not|without|avoid|do not|don't|never|none)\b/i;
  for (const clause of clauses) {
    if (!clause.toLowerCase().includes(term.toLowerCase())) continue;
    if (negationPattern.test(clause)) continue;
    return true;
  }
  return false;
}
export function validateRealism(prompt){
  const errors=[], warnings=[];
  const lower=String(prompt||'').toLowerCase();
  const positiveScope=lower.replace(/\[negative constraints\][\s\S]*?(?=\n\n\[[^\]]+\]|$)/g,'');
  const banned=['perfect skin','flawless skin','smooth skin','airbrushed skin','beauty filter','porcelain skin','waxy skin','perfectly symmetric face','perfect symmetry','8k hyperdetailed','ultra hd','masterpiece','studio lighting','perfectly centered composition','dslr bokeh','telephoto compression'];
  const required=[['chromatic aberration','error'],['visible skin pores','error'],['corneal reflections','error'],['stray hairs','error'],['sensor noise','warning'],['contact shadow','warning'],['vignetting','warning']];
  for(const word of banned) if(hasPositiveUse(positiveScope,word)) errors.push({code:'BANNED_TERM',message:`Banned term found as a positive instruction: "${word}"`,severity:'error'});
  for(const [token,level] of required){ if(lower.includes(token)) continue; const entry={code:'MISSING_REALISM',message:`Missing realism token: "${token}"`,severity:level}; (level==='error'?errors:warnings).push(entry); }
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),warnings:Object.freeze(warnings)});
}

export function generateImagePrompt(input={}){
  const requested=clean(input.sceneType)||DEFAULTS.sceneType.value;
  const scene=pick(SCENE_TYPES,baseSceneTypeFor(requested),DEFAULTS.sceneType);
  const extra=sceneMeta(requested);
  const captureDefaultCamera=scene.capture.includes('third-person') ? CAMERA_PROFILES.find((item)=>item.value==='smartphone_rear') : DEFAULTS.camera;
  const camera=pick(CAMERA_PROFILES,input.camera,captureDefaultCamera||DEFAULTS.camera);
  const ratio=pick(ASPECT_RATIOS,input.aspectRatio,DEFAULTS.aspectRatio);
  const expression=pick(EXPRESSIONS,input.expression,DEFAULTS.expression);
  const realism=pick(REALISM_LEVELS,input.realismLevel,DEFAULTS.realism);
  const framing=pick(FRAMING_OPTIONS,input.framing,DEFAULTS.framing);
  const hasExplicitFraming=FRAMING_OPTIONS.some((item)=>item.value===input.framing);
  const location=clean(input.location)||'a generic, ordinary Saudi Arabian setting appropriate to the scene, without inventing a specific city or landmark';
  const clothing=clean(input.clothing)||'realistic context-appropriate clothing with believable textile weight, seams, folds and material response';
  const clothingItem=resolveClothingItem(input);
  const clothingWarning=clothingSceneCoherence(clothingItem?.value || clean(input.clothingValue), requested);
  const garmentTags=new Set(clothingItem?.garmentTags || []);
  const clothingStylingOptions=clothingItem?.category ? (CLOTHING_STYLING[clothingItem.category] || []) : [];
  const clothingStylingFallback=clothingStylingOptions.find((item)=>item.value==='default') || clothingStylingOptions[0];
  const clothingStyling=pick(clothingStylingOptions,input.clothingStyling,clothingStylingFallback);
  const handInteraction=pick(HAND_INTERACTIONS,input.handInteraction,HAND_INTERACTIONS[0]);
  const stylingSceneSupported=CLOTHING_STYLING_SCENE_TYPES.has(requested) && requested!=='supermarket_selfie';
  const clothingStylingPrompt=stylingSceneSupported && clothingStyling && optionAppliesToGarment(clothingStyling,garmentTags) ? clothingStyling.prompt : '';
  const handInteractionPrompt=optionAppliesToGarment(handInteraction,garmentTags) ? handInteraction.prompt : '';
  const hair=clean(input.hairStyle), poseInput=clean(input.pose), angleInput=clean(input.angle);
  const bedroomPoseCameraEnabled=requested==='bedroom_selfie' || requested==='bedroom_mirror_selfie';
  const selectedBedroomPose=bedroomPoseCameraEnabled
    ? BEDROOM_POSES.find((item)=>item.value===poseInput || item.prompt===poseInput)
    : undefined;
  const selectedGeneralPose=!bedroomPoseCameraEnabled
    ? SELFIE_POSES.find((item)=>item.value===poseInput || item.prompt===poseInput)
    : undefined;
  const pose=selectedBedroomPose?.prompt || selectedGeneralPose?.prompt || poseInput;
  const poseValue=clean(input.poseValue) || selectedBedroomPose?.value || selectedGeneralPose?.value || (POSE_HAND_USAGE_FALLBACK.has(poseInput) ? poseInput : '');
  const poseHint=bedroomPoseCameraEnabled ? getPoseCameraHint(poseInput || pose) : null;
  const angleLockedByPose=bedroomPoseCameraEnabled && Boolean(poseHint);
  const rawCameraGeometryText=resolveCameraAngle({
    sceneType:scene.value,
    requestedSceneType:requested,
    captureType:scene.capture,
    pose:poseInput || pose,
    angle:angleInput,
    seed:input.seed,
    time:input.time
  });
  const cameraGeometryText=normalizeInsideCarCameraGeometry(rawCameraGeometryText,requested,poseValue);
  const contextual=resolveContextAwareConstraints({
    sceneType:scene.value,
    requestedSceneType:requested,
    location,
    backgroundActivity:clean(input.backgroundActivity)||DEFAULTS.background.value,
    lighting:clean(input.lighting)
  });
  const background=pick(BACKGROUND_ACTIVITY,contextual.backgroundActivity,DEFAULTS.background);
  const lighting=contextual.lighting;
  const description=clean(input.description)||clean(extra?.prompt), custom=clean(input.customConstraints), identity=input.identityReference!==false, saudi=isSaudi(location);
  const propLocation=clean(input.locationValue) || clean(input.location);
  const effectiveHandInteraction=handInteractionPrompt ? handInteraction.value : 'none';
  const availableProps=getAvailableProps(requested,scene.capture,propLocation,poseValue,effectiveHandInteraction);
  const heldProp=availableProps.find((prop)=>prop.value===clean(input.heldProp));
  const remainingAfterPrimary=getRemainingHands(requested,scene.capture,heldProp?.value || 'none',poseValue,effectiveHandInteraction);
  const secondaryCandidate=availableProps.find((prop)=>prop.value===clean(input.secondaryProp) && prop.value!==heldProp?.value);
  const secondaryProp=secondaryCandidate && secondaryCandidate.grip!=='two-hands' && getPropHandUsage(secondaryCandidate,remainingAfterPrimary)<=remainingAfterPrimary
    ? secondaryCandidate
    : undefined;
  const propPrompt=(prop,hands)=>{
    if(!prop) return 'none';
    if(prop.grip!=='one-or-two-hands') return prop.prompt;
    return `${prop.prompt}. Ignore the hand-count alternatives in the prop description: for this capture, use exactly ${hands>=2?'two hands':'one hand'}`;
  };
  const heldPropHands=getPropHandUsage(
    heldProp,
    getRemainingHands(requested,scene.capture,'none',poseValue,effectiveHandInteraction)
  );
  const secondaryPropHands=getPropHandUsage(secondaryProp,remainingAfterPrimary);
  const packet=buildRealismPacket({
    sceneType:scene.value,requestedSceneType:requested,captureType:scene.capture,location,clothing,hairStyle:hair,expression:expression.prompt,angle:cameraGeometryText,lighting,description,
    aspectRatio:ratio.prompt,pose,poseValue,backgroundActivity:background.value,backgroundElements:backgroundElements(background,contextual,saudi),
    heldProp:propPrompt(heldProp,heldPropHands),
    secondaryProp:propPrompt(secondaryProp,secondaryPropHands)
  });
  packet.accessories.device=captureDeviceRule(scene.capture);
  const guidance=renderRealismGuidance(packet);
  const hasBackgroundPeople=packet.background.elements.some((item)=>/background people/i.test(item));
  const backgroundText=hasBackgroundPeople ? `${guidance.background}\n${BACKGROUND_HUMAN_INTEGRITY_RULE}` : guidance.background;
  const actionText=guidance.action.replace(/\s+The subject must look occupied by a real moment, not frozen into a generic pose\.$/,'');
  const productText=/^No product is featured\./i.test(guidance.product) ? 'No product is featured.' : guidance.product;
  const captureLower=scene.capture.toLowerCase();
  const mirrorSection=/mirror selfie/i.test(captureLower)
    ? guidance.mirror
    : 'Mirror rules: not applicable.';

  let sceneText=`Location: ${location}. Maintain believable architecture, furniture, roads, vehicles, landscape, circulation space, object scale and environmental depth appropriate to the selected location.`;
  if(requested.startsWith('bedroom_')){
    const anchorText=[
      `ROOM ANCHOR (locked layout): ${BEDROOM_ANCHOR.room}`,
      `BED: ${BEDROOM_ANCHOR.bed}`,
      `WARDROBE: ${BEDROOM_ANCHOR.wardrobe}`,
      `MIRROR: ${BEDROOM_ANCHOR.mirror}`,
      `DRESSER: ${BEDROOM_ANCHOR.dresser}`,
      `NIGHTSTAND: ${BEDROOM_ANCHOR.nightstand}`,
      `CURTAINS / BACK WALL: ${BEDROOM_ANCHOR.curtains}`,
      `RUG: ${BEDROOM_ANCHOR.rug}`,
      BEDROOM_ANCHOR.fixed_layout_rule
    ].join(' ');
    const clutter=BEDROOM_CLUTTER_LEVELS[input.clutterLevel] || BEDROOM_CLUTTER_LEVELS.moderate;
    sceneText=`${sceneText} ${anchorText} ROOM CLUTTER: ${clutter}`;
  }
  // Canonical location values take precedence; free-text location matching
  // supports direct API callers. Explicit traditional identifiers always
  // suppress the fixed modern-majlis anchor.
  const majlisLocationValue=clean(input.locationValue);
  const majlisLocation=clean(input.location);
  const isTraditionalMajlis=/traditional/i.test(majlisLocationValue) || /traditional/i.test(majlisLocation);
  const isModernMajlisLocation=majlisLocationValue==='modern_saudi_majlis' || majlisLocation==='modern_saudi_majlis' || /modern.*saudi.*majlis/i.test(majlisLocation);
  const isDefaultModernMajlis=requested.startsWith('majlis_') && !majlisLocationValue && !majlisLocation;
  const modernMajlisAnchorEnabled=!isTraditionalMajlis && (isModernMajlisLocation || isDefaultModernMajlis);
  const seatedMajlisSubject=/seated/i.test(requested) || /seated|sitting/i.test(poseValue);
  if(modernMajlisAnchorEnabled){
    const majlisAnchorText=[`MAJLIS ANCHOR (locked layout): ${MAJLIS_ANCHOR.room}`,`MAIN SOFA: ${MAJLIS_ANCHOR.main_sofa} ${MAJLIS_ANCHOR.main_sofa_geometry}`,`SIDE SOFAS: ${MAJLIS_ANCHOR.side_sofas}`,`COFFEE TABLE: ${MAJLIS_ANCHOR.coffee_table}`,`RUG: ${MAJLIS_ANCHOR.rug}`,`TV UNIT: ${MAJLIS_ANCHOR.tv_unit}`,`DECOR: ${MAJLIS_ANCHOR.decor}`,MAJLIS_ANCHOR.fixed_layout_rule].join(' ');
    sceneText=`${sceneText} ${majlisAnchorText}`;
    if(seatedMajlisSubject) sceneText=`${sceneText} CRITICAL SUBJECT POSITION LOCK: The subject is seated on the CENTER seat of the long run of the main RIGHT-wall L-shaped sectional, never on either LEFT-wall single-seat sofa and never on the projecting return. The pelvis is centered over one seat cushion with localized compression directly beneath body weight.`;
  }
  const laptopSceneContextKey=requested.startsWith('bedroom_') ? 'bedroom_seated' : requested.startsWith('majlis_') ? 'majlis_seated' : requested.startsWith('office_') ? 'office_seated' : '';
  const requestedMacBookHeld=/^macbook-/i.test(clean(input.heldProp));
  const autoLaptopContext=laptopSceneContextKey && LAPTOP_SCENE_SEATED_POSES.has(poseValue) && !requestedMacBookHeld && !/^bedroom-laptop-/i.test(poseValue)
    ? LAPTOP_SCENE_CONTEXTS[laptopSceneContextKey] : '';
  if(autoLaptopContext) sceneText=`${sceneText} SCENE-SUPPORTED MACBOOK: ${autoLaptopContext}`;

  const furnitureRules=getFurnitureGeometryForScene(requested,location,poseValue);
  const furnitureText=furnitureRules.length ? `FURNITURE GEOMETRY: ${furnitureRules.join(' ')}` : '';
  sceneText=`${sceneText} ${furnitureText}`.trim();
  const effectiveFraming=modernMajlisAnchorEnabled && seatedMajlisSubject && framing.value==='chest_up'
    ? { ...framing, prompt:'close head-and-upper-chest framing, never wider than mid-chest; the face remains the dominant visual subject while enough immediate environment remains visible to establish that the subject is seated indoors' }
    : framing;

  const poseText=pose ? `${pose}. ` : '';
  const poseModifiers=[clothingStylingPrompt,handInteractionPrompt].filter(Boolean).join(' ');
  const resolvedCarSeatRole=carSeatRole(requested,poseValue);
  const carSeatPositionLock=resolvedCarSeatRole==='passenger'
    ? 'SUBJECT POSITION LOCK: The subject occupies the front passenger seat on the RIGHT side of this left-hand-drive Saudi-spec vehicle. The steering wheel must NOT be within the subject\'s reachable arm span. There is no steering wheel in front of the subject. The center console is to the subject\'s left, and the driver seat is farther to the subject\'s left. Do not place the subject in the driver position.'
    : resolvedCarSeatRole==='driver'
      ? 'SUBJECT POSITION LOCK: The subject occupies the driver seat on the LEFT side of this left-hand-drive Saudi-spec vehicle. The steering wheel is directly in front of the subject at the correct distance and angle. The center console is to the subject\'s right.'
      : '';
  const poseBody=`${poseText}Body mechanics must respect balance, support, joint limits, body weight, seat or ground contact, and natural asymmetric posture.${poseModifiers ? ` ${poseModifiers}` : ''}${carSeatPositionLock ? ` ${carSeatPositionLock}` : ''}`;
  const sections=[
    section('GOAL',`Generate ONE highly photorealistic ${ratio.prompt} image. ${description?`User scene intent: ${description}. `:''}The result must look like a genuine smartphone photograph rather than advertising, polished commercial photography, CGI or AI-stylized imagery.`),
    section('ACTION-DRIVEN AUTHENTICITY',actionText), section('CAPTURE TYPE LOCK — CRITICAL',captureRules(scene)),
    section('IDENTITY / SUBJECT',`${identityRules(identity,hair)} Expression: ${expression.prompt}. ${packet.subject.face}`),
    section('SCENE',sceneText),
    section('SAUDI CULTURAL DRESS',saudi?`${SAUDI_CULTURAL_DRESS_LOCK} ${SAUDI_SIGNAGE_RULE}`:'Not applicable: the selected scene is outside Saudi context.'),
    section('OBSERVABLE BACKGROUND ELEMENTS',backgroundText),
    section('CLOTHING',clothing),
    section('CONTEXTUAL ACCESSORIES',guidance.accessories), section('POSE & BODY MECHANICS',poseBody),
    section('CAMERA GEOMETRY',geometryRules(scene,camera,effectiveFraming,cameraGeometryText,input.cameraDistance,hasExplicitFraming)), section('PHYSICAL LIGHTING',lightingRules(lighting,input.lightingNotes,realism.value)),
    section('MIRROR RULES',mirrorSection), section('PRODUCT INTEGRATION',productText),
    section('PHYSICAL / MATERIAL REALISM',`${realism.prompt}. Enforce correct human anatomy; realistic neck, shoulder, arm, hand and finger structure; natural weight distribution; correct support and contact deformation; coherent gravity; realistic cloth drape and seam tension; material-specific reflectance; physically consistent reflections; and scene-specific scale.`),
    section('SMARTPHONE IMAGE BEHAVIOR','Use broad smartphone focus, restrained computational sharpening, realistic local contrast, modest dynamic range, plausible white balance, mild sensor/noise-reduction texture in darker areas, and natural clipping of strong practical lights when appropriate.'),
    section('LENS_PHYSICS',resolveLensPhysics({ scene:requested, captureType:scene.capture, camera, framing, cameraDistance:input.cameraDistance })),
    section('BIOLOGICAL_MICRO_REALISM','BIOLOGICAL MICRO-REALISM (mandatory, apply only where resolvable): Preserve visible skin pores with non-uniform spatial distribution. Preserve fine vellus facial hair where the visible cheek, temple or jaw region is close enough and lit enough to register such detail. Preserve a small number of naturally stray hairs ONLY in directions consistent with the selected hairstyle direction. Do not place stray hairs contradicting the selected direction. Preserve source-consistent corneal reflections showing the actual scene. Preserve slight natural asymmetry in eyebrows, eyelids and jawline. Preserve individual CLOTHING fibers only where genuinely resolvable at the captured distance. Do not force visible fibers, thread grids, slub texture, or weave patterns onto smooth upholstery or other materials whose surface specification explicitly forbids visible weave. Do not beautify, smooth, symmetrize or sterilize. If a region is cropped, occluded, too dark, too soft, too distant or out of focus, do not invent micro-detail merely to satisfy this section.'),
    section('CAMERA_METADATA_HINT',resolveCameraMetadata(camera,lighting,input.lightingValue)),
    section('AUTHENTIC IMPERFECTIONS',`${guidance.imperfections}\n${CAPTURE_IMPERFECTIONS}`),
    section('USER CONSTRAINTS',custom||'None.'), section('NEGATIVE CONSTRAINTS',negatives(scene,hair,modernMajlisAnchorEnabled)), section('FINAL VERIFICATION',verification(scene,ratio,guidance,hair))
  ];
  const prompt=sections.join('\n\n'), realismCheck=validateRealism(prompt), validation=validateGeneratedPrompt(prompt,{sceneType:scene,realismPacket:packet,saudiContext:saudi});
  validation.warnings.push(...contextual.warnings);
  const contextWarnings=[...contextual.warnings];
  if(clothingWarning) contextWarnings.push(clothingWarning.warning);
  if(realism.value==='strict'&&!realismCheck.valid){ validation.errors.push(...realismCheck.errors.map((e)=>`[REALISM] ${e.message}`)); validation.valid=false; }
  return {
    schema_version:'2.3.0',mode:'auto_generate',prompt,sections,realism_packet:packet,
    config:{
      requested_scene_type:requested,scene_type:scene.value,capture_type:scene.capture,camera:camera.value,aspect_ratio:ratio.value,expression:expression.value,
      background_activity:background.value,background_activity_allowed:[...contextual.backgroundActivityAllowed],realism_level:realism.value,framing:framing.value,
      identity_reference:identity,location,clothing,hair_style:hair,pose,pose_value:poseValue,held_prop:heldProp?.value || 'none',secondary_prop:secondaryProp?.value || 'none',angle:cameraGeometryText,angle_locked_by_pose:angleLockedByPose,lighting,lighting_notes:clean(input.lightingNotes),description,custom_constraints:custom,
      saudi_context:saudi,context_warnings:contextWarnings
    },validation,realism_validation:realismCheck
  };
}

function bodies(prompt){ const map=new Map(); const re=/^\[([^\]]+)\]\n([\s\S]*?)(?=\n\n\[[^\]]+\]\n|$)/gm; let m; while((m=re.exec(prompt))){ map.set(m[1],map.has(m[1])?null:m[2]); } return map; }
export function validateGeneratedPrompt(prompt,context={}){
  const errors=[],warnings=[],text=String(prompt||''),map=bodies(text),heads=[...text.matchAll(/^\[([^\]]+)\]$/gm)].map((m)=>m[1]);
  if(heads.length!==23) errors.push(`Expected exactly 23 canonical sections, found ${heads.length}.`);
  if(JSON.stringify(heads)!==JSON.stringify(CANONICAL_SECTIONS)) errors.push('Canonical prompt sections are missing, duplicated, or out of order.');
  for(const name of CANONICAL_SECTIONS){ if(!map.has(name)) errors.push(`Missing required section: [${name}]`); else if(map.get(name)===null) errors.push(`Duplicate required section: [${name}]`); else if(!clean(map.get(name))) errors.push(`Required section is empty: [${name}]`); }
  const checks=[['PHYSICAL LIGHTING',/Physical illumination/i,'Physical illumination rule is missing from [PHYSICAL LIGHTING].'],['PHYSICAL LIGHTING',/Exposure, ISO, HDR/i,'Exposure/ISO/HDR separation rule is missing from [PHYSICAL LIGHTING].'],['LENS_PHYSICS',/chromatic aberration/i,'Chromatic aberration rule is missing from [LENS_PHYSICS].'],['LENS_PHYSICS',/vignetting/i,'Vignetting rule is missing from [LENS_PHYSICS].'],['LENS_PHYSICS',/barrel distortion/i,'Barrel-distortion rule is missing from [LENS_PHYSICS].'],['BIOLOGICAL_MICRO_REALISM',/visible skin pores/i,'Visible skin pores rule is missing from [BIOLOGICAL_MICRO_REALISM].'],['BIOLOGICAL_MICRO_REALISM',/corneal reflections/i,'Corneal reflections rule is missing from [BIOLOGICAL_MICRO_REALISM].'],['BIOLOGICAL_MICRO_REALISM',/stray hairs/i,'Stray hairs rule is missing from [BIOLOGICAL_MICRO_REALISM].'],['IDENTITY / SUBJECT',/Hair length, density, and hair thickness remain as in the reference image/i,'Hair length/density/direction lock is missing from [IDENTITY / SUBJECT].'],['CAMERA_METADATA_HINT',/CAPTURE METADATA/i,'Capture metadata guidance is missing from [CAMERA_METADATA_HINT].'],['FINAL VERIFICATION',/Before finalizing/i,'Final verification language is missing from [FINAL VERIFICATION].']];
  for(const [name,re,msg] of checks) if(!re.test(map.get(name)||'')) errors.push(msg);
  const negativeBody=map.get('NEGATIVE CONSTRAINTS')||'';
  if(!/\bAvoid\b/i.test(negativeBody)) errors.push('Negative constraint language must include "Avoid" in [NEGATIVE CONSTRAINTS].');
  if(context.saudiContext&&!/CULTURAL CONTEXT — SAUDI/i.test(map.get('SAUDI CULTURAL DRESS')||'')) errors.push('Saudi cultural dress rule is missing from [SAUDI CULTURAL DRESS] for a Saudi context.');
  if(!context.realismPacket?.subject||!context.realismPacket?.accessories||!context.realismPacket?.photography||!context.realismPacket?.background) errors.push('Realistic Image Generator JSON structure is incomplete.');
  if(context.sceneType?.capture?.includes('selfie')&&!/reachable|arm-reach|arm length/i.test(text)) warnings.push('Selfie prompt should explicitly preserve reachable camera geometry.');
  return {valid:errors.length===0,errors,warnings};
}
