import { buildRealismPacket, renderRealismGuidance } from './realistic-image-generator.js';
import { SAUDI_CULTURAL_DRESS_LOCK } from './scene-builder.js';
import { baseSceneTypeFor, sceneMeta } from './scene-type-expansion.js';

export const SCENE_TYPES = [
  { value: 'front_selfie', label: 'سيلفي عادي', capture: 'subject-held front-camera smartphone selfie', prompt: 'a casual subject-held front-camera smartphone selfie with physically feasible arm-reach geometry', framing: 'chest-up to mid-torso framing' },
  { value: 'standing_selfie', label: 'سيلفي واقف', capture: 'subject-held front-camera smartphone selfie', prompt: 'the subject standing naturally while taking the selfie himself', framing: 'upper-body to waist-up framing' },
  { value: 'seated_selfie', label: 'سيلفي جالس', capture: 'subject-held front-camera smartphone selfie', prompt: 'the subject seated naturally with real support, cushion or chair contact, and relaxed posture', framing: 'upper-body framing with enough context to prove the seated pose' },
  { value: 'walking_selfie', label: 'سيلفي أثناء المشي', capture: 'subject-held front-camera smartphone selfie', prompt: 'the subject walking slowly while holding the phone, with subtle gait asymmetry and mild handheld motion cues', framing: 'upper-body framing with believable walking displacement' },
  { value: 'inside_car_selfie', label: 'سيلفي داخل السيارة', capture: 'subject-held front-camera smartphone selfie', prompt: 'the subject seated naturally inside a stationary vehicle while taking the selfie himself', framing: 'driver/passenger-seat close framing with coherent cabin geometry' },
  { value: 'majlis_selfie', label: 'سيلفي مجلس', capture: 'subject-held front-camera smartphone selfie', prompt: 'a relaxed personal selfie inside a lived-in Saudi majlis, with ordinary hospitality context rather than staged luxury', framing: 'three-quarter seated or standing upper-body framing' },
  { value: 'cafe_selfie', label: 'سيلفي مقهى', capture: 'subject-held front-camera smartphone selfie', prompt: 'a casual personal selfie inside a real contemporary cafe with ordinary patrons and practical fixtures', framing: 'chest-up environmental selfie framing' },
  { value: 'office_selfie', label: 'سيلفي مكتب', capture: 'subject-held front-camera smartphone selfie', prompt: 'a casual personal selfie in a working office environment with ordinary desks, screens and practical lighting', framing: 'chest-up to waist-up framing' },
  { value: 'outdoor_selfie', label: 'سيلفي خارجي', capture: 'subject-held front-camera smartphone selfie', prompt: 'a casual outdoor selfie with physically coherent weather, background depth and ambient light', framing: 'upper-body environmental selfie framing' },
  { value: 'mirror_selfie', label: 'سيلفي مرآة', capture: 'mirror selfie using a smartphone visible in the reflection', prompt: 'a physically correct mirror selfie with the phone and hand visible in reflection and no impossible duplicate viewpoints', framing: 'mirror-composed upper-body or three-quarter framing' },
  { value: 'third_person_portrait', label: 'بورتريه شخص ثالث', capture: 'third-person smartphone photograph', prompt: 'a natural third-person smartphone portrait photographed by another person', framing: 'upper-body environmental portrait framing' },
  { value: 'full_body_third_person', label: 'جسم كامل — شخص ثالث', capture: 'third-person smartphone photograph', prompt: 'a full-body third-person smartphone photograph with correct foot-ground contact and human scale', framing: 'full-body framing with visible ground contact' },
  { value: 'candid_third_person', label: 'لقطة عفوية — شخص ثالث', capture: 'third-person candid smartphone photograph', prompt: 'a candid third-person smartphone photograph with an unposed moment and natural attention away from the camera when appropriate', framing: 'context-rich candid framing' }
];

export const CAMERA_PROFILES = [
  { value: 'xiaomi15_front', label: 'Xiaomi 15 Ultra — Front', prompt: 'Xiaomi 15 Ultra front camera with a natural wide selfie look, realistic arm-length perspective, broad smartphone focus, modest HDR, restrained sharpening, and natural low-light texture' },
  { value: 'iphone15pm_front', label: 'iPhone 15 Pro Max — Front', prompt: 'iPhone 15 Pro Max front camera with a natural wide selfie look, realistic computational exposure, broad smartphone focus, restrained sharpening and plausible low-light texture' },
  { value: 'generic_front', label: 'هاتف أمامي عام', prompt: 'modern smartphone front camera with realistic wide selfie perspective, arm-length geometry, broad focus and restrained computational processing' },
  { value: 'smartphone_rear', label: 'هاتف — كاميرا خلفية', prompt: 'modern smartphone rear camera with a natural wide perspective, broad environmental detail, restrained computational sharpening and no artificial DSLR look' }
];

export const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 عمودي', prompt: 'vertical 9:16 composition' },
  { value: '4:5', label: '4:5 عمودي', prompt: 'vertical 4:5 composition' },
  { value: '1:1', label: '1:1 مربع', prompt: 'square 1:1 composition' },
  { value: '16:9', label: '16:9 أفقي', prompt: 'horizontal 16:9 composition' }
];

export const EXPRESSIONS = [
  { value: 'neutral', label: 'محايد هادئ', prompt: 'calm neutral expression, relaxed eyes and a naturally closed mouth' },
  { value: 'subtle_smile', label: 'ابتسامة خفيفة', prompt: 'a very subtle natural closed-mouth smile without posing or beauty-ad energy' },
  { value: 'focused', label: 'تركيز طبيعي', prompt: 'a naturally focused expression with relaxed facial muscles and no exaggerated tension' },
  { value: 'candid', label: 'عفوي', prompt: 'a candid in-between expression with natural facial asymmetry and no forced smile' }
];

export const BACKGROUND_ACTIVITY = [
  { value: 'quiet', label: 'هادئ', prompt: 'quiet background with no background people; preserve only context-appropriate environmental detail and vehicles when physically appropriate' },
  { value: 'normal', label: 'طبيعي', prompt: 'ordinary background activity with 1-2 independently behaving background people where people are contextually appropriate, plus ordinary vehicles or objects when relevant' },
  { value: 'lively', label: 'حيوي', prompt: 'lively but believable background activity with 3-5 independently behaving background people where people are contextually appropriate, natural spacing, varied behavior and no duplicated people' }
];

export const REALISM_LEVELS = [
  { value: 'balanced', label: 'واقعية متوازنة', prompt: 'high photorealism with realistic anatomy, materials, lighting, environment and restrained smartphone processing' },
  { value: 'strict', label: 'واقعية صارمة', prompt: 'strict forensic photorealism prioritizing physical causality, anatomy, contact mechanics, optical plausibility, material response and environmental consistency over aesthetics' },
  { value: 'raw', label: 'هاتف خام / عفوي', prompt: 'raw casual smartphone realism with imperfect framing, mild sensor texture, limited dynamic range, subtle white-balance variation and no polished commercial finish' }
];

export const FRAMING_OPTIONS = [
  { value: 'close', label: 'قريب', prompt: 'close selfie/portrait framing while keeping facial perspective physically plausible' },
  { value: 'chest_up', label: 'من الصدر', prompt: 'chest-up framing' },
  { value: 'waist_up', label: 'من الخصر', prompt: 'waist-up framing' },
  { value: 'three_quarter', label: 'ثلاثة أرباع', prompt: 'three-quarter body framing' },
  { value: 'full_body', label: 'جسم كامل', prompt: 'full-body framing with visible, correct ground contact' }
];

const DEFAULTS = {
  sceneType: SCENE_TYPES[0],
  camera: CAMERA_PROFILES[0],
  aspectRatio: ASPECT_RATIOS[0],
  expression: EXPRESSIONS[0],
  background: BACKGROUND_ACTIVITY[1],
  realism: REALISM_LEVELS[1],
  framing: FRAMING_OPTIONS[1]
};

const CANONICAL_SECTIONS = [
  'GOAL',
  'ACTION-DRIVEN AUTHENTICITY',
  'CAPTURE TYPE LOCK — CRITICAL',
  'IDENTITY / SUBJECT',
  'SCENE',
  'OBSERVABLE BACKGROUND ELEMENTS',
  'CLOTHING',
  'CONTEXTUAL ACCESSORIES',
  'POSE & BODY MECHANICS',
  'CAMERA GEOMETRY',
  'PHYSICAL LIGHTING',
  'MIRROR RULES',
  'PRODUCT INTEGRATION',
  'PHYSICAL / MATERIAL REALISM',
  'SMARTPHONE IMAGE BEHAVIOR',
  'LENS_PHYSICS',
  'BIOLOGICAL_MICRO_REALISM',
  'CAMERA_METADATA_HINT',
  'AUTHENTIC IMPERFECTIONS',
  'CONTROLLED PHYSICAL IMPERFECTIONS',
  'USER CONSTRAINTS',
  'NEGATIVE CONSTRAINTS',
  'FINAL VERIFICATION'
];

const HAIR_STYLE_LOCK = 'Hair length, density, hairline shape, and hair thickness remain EXACTLY as in the reference image when a reference image is attached. Only the visible direction, part line, clumping, and strand orientation may change. Do not shorten, lengthen, thin, thicken, or recede the hairline. If no reference image is attached, keep the chosen baseline hair length and density stable and do not invent extra length or density solely to satisfy a hairstyle.';
const SAUDI_CONTEXT = /\b(saudi|saudi arabia|riyadh|jeddah|khobar|dammam|makkah|madinah|medina|taif|abha|tabuk|alula|qassim|hail|najran|jazan|arabian gulf|red sea)\b/i;

function clean(value) { return typeof value === 'string' ? value.trim() : ''; }
function getOption(options, value, fallback) { return options.find((item) => item.value === value) || fallback; }
function section(title, body) { const text = clean(body); return `[${title}]\n${text}`; }
function isSaudiContext(location) { return SAUDI_CONTEXT.test(clean(location)); }

function captureRules(sceneType) {
  const selfie = /selfie/i.test(sceneType.capture);
  const mirror = /mirror selfie/i.test(sceneType.capture);
  if (mirror) return 'Capture type is locked to a true mirror selfie. The phone must exist inside the mirror reflection, reflection geometry must be consistent, and the image must not silently become a direct front-camera selfie or a third-person photograph.';
  if (selfie) return 'Capture type is locked to a subject-held smartphone selfie. Camera position must remain reachable by the subject at ordinary arm length; shoulder, elbow, wrist, torso rotation and perspective must agree with the phone position. Never silently convert the shot into a third-person camera, floating camera, mirror shot or telephoto portrait.';
  return 'Capture type is locked to a third-person smartphone photograph. The subject is not holding the camera. Preserve a physically plausible photographer viewpoint, distance and perspective; do not introduce a selfie arm or mirror logic.';
}

function identityRules(enabled, hairStyle) {
  const base = enabled
    ? 'If a reference image is attached, use it strictly as the sole identity anchor. Preserve recognizable facial identity, skull and face proportions, natural asymmetry, skin tone, apparent age, hairline, visible hair density and texture, beard density and gaps, and moustache pattern. Do not copy the reference background, pose, clothing, lighting or framing unless separately requested. No beautification, face slimming, jaw sharpening, eye enlargement, de-aging, skin smoothing, symmetry correction, thicker hair or denser beard.'
    : 'No reference identity is required. Keep the subject anatomically natural and internally consistent across the image.';
  const style = hairStyle ? `Selected hair styling direction: ${hairStyle}.` : 'Hair styling direction: keep the visible hair naturally arranged unless a specific style is selected.';
  return `${base} ${style} ${HAIR_STYLE_LOCK}`;
}

function geometryRules(sceneType, camera, framing, angle, distance) {
  const distanceText = clean(distance) || (sceneType.capture.includes('selfie') ? 'natural arm-reach distance, approximately 40–60 cm unless the selected angle requires a minor physically plausible adjustment' : 'a natural third-person smartphone shooting distance appropriate to the framing');
  return `${camera.prompt}. ${sceneType.framing}. ${framing.prompt}. ${angle || 'Use a natural eye-level or slightly off-axis camera angle with mild handheld imperfection.'} Camera distance: ${distanceText}. Preserve realistic wide-angle perspective and human scale; no impossible camera placement, no DSLR compression and no fake optical bokeh.`;
}

function lightingRules(lighting, notes) {
  const selected = clean(lighting) || 'Use lighting appropriate to the chosen time and location, produced only by physically plausible visible or inferable sources.';
  const extra = clean(notes);
  return `${selected}${extra ? ` Additional lighting direction: ${extra}.` : ''} Physical illumination alone determines which surfaces receive light, shadow direction and softness, highlights, reflections, material brightness and local contrast. Exposure, ISO, HDR, tone mapping and noise reduction may only reveal or process captured signal; they must never create illumination that no physical source provides. Respect realistic falloff for nearby weak lights, occlusion, bounce light, practical fixture direction and realistic background falloff.`;
}

function physicalRealism(realism) {
  return `${realism.prompt}. Enforce correct human anatomy; realistic neck, shoulder, arm, hand and finger structure; natural weight distribution; correct support and contact deformation; coherent gravity; realistic cloth drape and seam tension; material-specific reflectance; grounded feet or body support; physically consistent reflections; plausible atmospheric depth; and scene-specific scale.`;
}

function smartphoneBehavior() {
  return 'The result must read as an ordinary real smartphone photograph, not a polished commercial portrait, CGI render or cinematic frame. Use broad smartphone focus, restrained computational sharpening, realistic local contrast, modest dynamic range, plausible white balance, subtle edge softness, mild sensor/noise-reduction texture in darker areas, and natural clipping of strong practical lights when appropriate.';
}

function lensPhysics() {
  return 'LENS PHYSICS (mandatory): Preserve mild lateral chromatic aberration on high-contrast edges, visible as faint color fringing near frame corners. Preserve mild vignetting consistent with a wide smartphone lens, corners 15-20% darker than center. Preserve 2-3% barrel distortion typical of a 23mm-equivalent smartphone wide-angle lens. Preserve natural lens flare and ghosting only when a bright source is in or near the frame. Do not add artificial or decorative lens effects.';
}

function biologicalMicroRealism() {
  return 'BIOLOGICAL MICRO-REALISM (mandatory, apply only where resolvable): Preserve visible skin pores with non-uniform spatial distribution. Preserve fine vellus facial hair where the visible cheek, temple or jaw region is close enough and lit enough to register such detail. Preserve 5-12 stray hairs near the silhouette or hairline of the visible hair mass. Preserve source-consistent corneal reflections showing the actual scene. Preserve slight natural asymmetry in eyebrows, eyelids and jawline. Preserve individual fabric fibers visible at realistic viewing distance. Do not beautify, smooth, symmetrize or sterilize. If a region is cropped, occluded, too dark, too soft, too distant or out of focus, do not invent micro-detail merely to satisfy this section.';
}

function cameraMetadataHint(camera) {
  if (camera.value === 'xiaomi15_front') return 'CAPTURE METADATA (for scene fidelity): Shot on Xiaomi 15 Ultra front camera, approximately 23mm equivalent, f/1.63-class smartphone capture behavior, ISO 800, 1/60s, handheld. File reference: IMG_20250915_143022.HEIC.';
  if (camera.value === 'iphone15pm_front') return 'CAPTURE METADATA (for scene fidelity): Shot on iPhone 15 Pro Max front camera with a natural wide selfie field of view, plausible automatic ISO and shutter behavior, handheld. Do not fabricate unsupported exact EXIF values.';
  if (camera.value === 'smartphone_rear') return 'CAPTURE METADATA (for scene fidelity): Shot on a modern smartphone rear camera with a natural wide field of view, plausible automatic ISO and shutter behavior, handheld. Do not fabricate unsupported exact EXIF values.';
  return 'CAPTURE METADATA (for scene fidelity): Shot on a modern smartphone front camera with a natural wide selfie field of view, plausible automatic ISO and shutter behavior, handheld. Do not fabricate unsupported exact EXIF values.';
}

function controlledCaptureImperfections() {
  return 'Allow capture-level imperfections only: tiny handheld roll, slight off-center crop, minor exposure or white-balance variation, subtle edge softness, restrained shadow sensor noise, and modest highlight clipping when caused by real practical lights. Do not duplicate biological, clothing, or environmental imperfections already specified elsewhere.';
}

function negatives(sceneType, saudiContext) {
  const captureNegative = sceneType.capture.includes('third-person')
    ? 'no selfie arm, no implied subject-held camera'
    : sceneType.capture.includes('mirror')
      ? 'no direct front-camera viewpoint outside the mirror, no duplicate phone or hands'
      : 'no third-person viewpoint, no floating external camera, no mirror unless explicitly selected';
  const saudiNegatives = saudiContext
    ? ', no uncovered female faces in Saudi scenes, no Western female clothing in Saudi scenes, no exposed women\'s hair in Saudi scenes'
    : '';
  return `Avoid: beauty filters, waxy or porcelain skin, face reconstruction, artificial symmetry, malformed hands, extra fingers, duplicated limbs, floating objects, impossible body support, incorrect contact shadows, melted textiles, repeated background people, cloned props, impossible reflections, invisible artificial key lights, fake rim lights, excessive HDR, aggressive orange-teal grading, fake DSLR bokeh, over-sharpening, oversaturated skin, sterile showroom staging, generic static posing, advertisement-style product placement, no artificial lens flare, no beauty filter, no plastic skin, no perfectly symmetric face, no missing corneal reflections, no uniform fabric without weave or fibers${saudiNegatives}, and ${captureNegative}.`;
}

function verification(sceneType, aspectRatio, realismGuidance) {
  return `Before finalizing, verify: capture type unmistakably matches “${sceneType.capture}”; the camera position is physically possible; anatomy and contacts are coherent; selected location, clothing, hair direction, pose, angle and lighting are visible and mutually compatible; lighting can be traced to plausible physical sources; materials respond differently according to their properties; background scale and requested activity level make sense; composition is ${aspectRatio.prompt}; and the realism checklist is satisfied: ${realismGuidance.consistency.replace(/^Before finalizing, verify:\s*/i, '')} If a secondary aesthetic choice conflicts with physical causality or capture geometry, preserve physical plausibility.`;
}

function stripNegatedBannedUses(text, term) {
  let index = 0;
  while ((index = text.indexOf(term, index)) !== -1) {
    const prefix = text.slice(Math.max(0, index - 40), index);
    if (!/(?:\bno\b|\bnot\b|\bwithout\b|\bavoid\b|\bdo not\b|\bnever\b)[^.!?\n]{0,28}$/i.test(prefix)) return true;
    index += term.length;
  }
  return false;
}

export function validateRealism(prompt) {
  const errors = [];
  const warnings = [];
  const lower = String(prompt || '').toLowerCase();

  const banned = [
    'perfect skin', 'flawless skin', 'smooth skin', 'airbrushed skin',
    'beauty filter', 'porcelain skin', 'waxy skin',
    'perfectly symmetric face', 'perfect symmetry',
    '8k hyperdetailed', 'ultra hd', 'masterpiece',
    'studio lighting', 'perfectly centered composition',
    'dslr bokeh', 'telephoto compression'
  ];

  const required = [
    { token: 'chromatic aberration', level: 'error' },
    { token: 'visible skin pores', level: 'error' },
    { token: 'corneal reflections', level: 'error' },
    { token: 'stray hairs', level: 'error' },
    { token: 'sensor noise', level: 'warning' },
    { token: 'contact shadow', level: 'warning' },
    { token: 'vignetting', level: 'warning' }
  ];

  for (const word of banned) {
    if (stripNegatedBannedUses(lower, word)) {
      errors.push({ code: 'BANNED_TERM', message: `Banned term found as a positive instruction: "${word}"`, severity: 'error' });
    }
  }

  for (const { token, level } of required) {
    if (!lower.includes(token)) {
      const entry = { code: 'MISSING_REALISM', message: `Missing realism token: "${token}"`, severity: level };
      if (level === 'error') errors.push(entry);
      else warnings.push(entry);
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings)
  });
}

export function generateImagePrompt(input = {}) {
  const requestedSceneType = clean(input.sceneType) || DEFAULTS.sceneType.value;
  const baseSceneType = baseSceneTypeFor(requestedSceneType);
  const sceneType = getOption(SCENE_TYPES, baseSceneType, DEFAULTS.sceneType);
  const extraScene = sceneMeta(requestedSceneType);
  const camera = getOption(CAMERA_PROFILES, input.camera, DEFAULTS.camera);
  const aspectRatio = getOption(ASPECT_RATIOS, input.aspectRatio, DEFAULTS.aspectRatio);
  const expression = getOption(EXPRESSIONS, input.expression, DEFAULTS.expression);
  const background = getOption(BACKGROUND_ACTIVITY, input.backgroundActivity, DEFAULTS.background);
  const realism = getOption(REALISM_LEVELS, input.realismLevel, DEFAULTS.realism);
  const framing = getOption(FRAMING_OPTIONS, input.framing, DEFAULTS.framing);

  const location = clean(input.location) || 'a generic, ordinary Saudi Arabian setting appropriate to the scene, without inventing a specific city or landmark';
  const clothing = clean(input.clothing) || 'realistic context-appropriate clothing with believable textile weight, seams, folds and material response';
  const hairStyle = clean(input.hairStyle);
  const pose = clean(input.pose) || sceneType.prompt;
  const angle = clean(input.angle);
  const lighting = clean(input.lighting);
  const description = clean(input.description) || clean(extraScene?.prompt);
  const customConstraints = clean(input.customConstraints);
  const identityEnabled = input.identityReference !== false;
  const saudiContext = isSaudiContext(location);

  const realismPacket = buildRealismPacket({
    sceneType: sceneType.value,
    captureType: sceneType.capture,
    location,
    clothing,
    hairStyle,
    expression: expression.prompt,
    angle,
    lighting,
    description,
    aspectRatio: aspectRatio.prompt,
    pose,
    backgroundActivity: background.value
  });
  const realismGuidance = renderRealismGuidance(realismPacket);

  const sceneCulturalRule = saudiContext ? ` ${SAUDI_CULTURAL_DRESS_LOCK}` : '';
  const userConstraintsText = customConstraints || 'No additional user constraints were provided.';

  const sections = [
    section('GOAL', `Generate ONE highly photorealistic ${aspectRatio.prompt} image. Capture type: ${sceneType.capture}. ${description ? `User scene intent: ${description}.` : 'Keep the moment natural, personal and unstaged.'} The result must look like a genuine smartphone photograph rather than advertising, polished commercial photography, CGI or AI-stylized imagery.`),
    section('ACTION-DRIVEN AUTHENTICITY', realismGuidance.action),
    section('CAPTURE TYPE LOCK — CRITICAL', captureRules(sceneType)),
    section('IDENTITY / SUBJECT', `${identityRules(identityEnabled, hairStyle)} Expression: ${expression.prompt}. ${realismPacket.subject.face}`),
    section('SCENE', `Location: ${location}. Background behavior: ${background.prompt}. Maintain believable architecture, furniture, roads, vehicles, landscape, circulation space, object scale and environmental depth appropriate to the selected location.${sceneCulturalRule}`),
    section('OBSERVABLE BACKGROUND ELEMENTS', realismGuidance.background),
    section('CLOTHING', `${clothing}. Preserve gravity-driven drape, realistic material thickness, seam tension, compression at body/contact points, and non-mirrored natural asymmetry.`),
    section('CONTEXTUAL ACCESSORIES', realismGuidance.accessories),
    section('POSE & BODY MECHANICS', `${pose}. Body mechanics must respect balance, support, joint limits, body weight, seat or ground contact, and natural asymmetric posture.`),
    section('CAMERA GEOMETRY', geometryRules(sceneType, camera, framing, angle, input.cameraDistance)),
    section('PHYSICAL LIGHTING', lightingRules(lighting, input.lightingNotes)),
    section('MIRROR RULES', realismGuidance.mirror),
    section('PRODUCT INTEGRATION', realismGuidance.product),
    section('PHYSICAL / MATERIAL REALISM', physicalRealism(realism)),
    section('SMARTPHONE IMAGE BEHAVIOR', smartphoneBehavior()),
    section('LENS_PHYSICS', lensPhysics()),
    section('BIOLOGICAL_MICRO_REALISM', biologicalMicroRealism()),
    section('CAMERA_METADATA_HINT', cameraMetadataHint(camera)),
    section('AUTHENTIC IMPERFECTIONS', realismGuidance.imperfections),
    section('CONTROLLED PHYSICAL IMPERFECTIONS', controlledCaptureImperfections()),
    section('USER CONSTRAINTS', userConstraintsText),
    section('NEGATIVE CONSTRAINTS', negatives(sceneType, saudiContext)),
    section('FINAL VERIFICATION', verification(sceneType, aspectRatio, realismGuidance))
  ];

  const prompt = sections.join('\n\n');
  const realismValidation = validateRealism(prompt);
  const validation = validateGeneratedPrompt(prompt, { sceneType, identityEnabled, realismPacket, saudiContext });

  if (realism.value === 'strict' && !realismValidation.valid) {
    validation.errors.push(...realismValidation.errors.map((e) => `[REALISM] ${e.message}`));
    validation.valid = validation.errors.length === 0;
  }

  return {
    schema_version: '2.2.0',
    mode: 'auto_generate',
    prompt,
    sections,
    realism_packet: realismPacket,
    config: {
      requested_scene_type: requestedSceneType,
      scene_type: sceneType.value,
      capture_type: sceneType.capture,
      camera: camera.value,
      aspect_ratio: aspectRatio.value,
      expression: expression.value,
      background_activity: background.value,
      realism_level: realism.value,
      framing: framing.value,
      identity_reference: identityEnabled,
      location,
      clothing,
      hair_style: hairStyle,
      pose,
      angle,
      lighting,
      lighting_notes: clean(input.lightingNotes),
      description,
      custom_constraints: customConstraints,
      saudi_context: saudiContext
    },
    validation,
    realism_validation: realismValidation
  };
}

function extractSectionBodies(prompt) {
  const bodies = new Map();
  const pattern = /^\[([^\]]+)\]\n([\s\S]*?)(?=\n\n\[[^\]]+\]\n|$)/gm;
  let match;
  while ((match = pattern.exec(prompt)) !== null) {
    const name = match[1];
    if (bodies.has(name)) bodies.set(name, null);
    else bodies.set(name, match[2]);
  }
  return bodies;
}

export function validateGeneratedPrompt(prompt, context = {}) {
  const errors = [];
  const warnings = [];
  const text = String(prompt || '');
  const sectionBodies = extractSectionBodies(text);
  const headings = [...text.matchAll(/^\[([^\]]+)\]$/gm)].map((match) => match[1]);

  if (headings.length !== CANONICAL_SECTIONS.length) {
    errors.push(`Expected exactly ${CANONICAL_SECTIONS.length} canonical sections, found ${headings.length}.`);
  }
  if (JSON.stringify(headings) !== JSON.stringify(CANONICAL_SECTIONS)) {
    errors.push('Canonical prompt sections are missing, duplicated, or out of order.');
  }
  for (const name of CANONICAL_SECTIONS) {
    if (!sectionBodies.has(name)) errors.push(`Missing required section: [${name}]`);
    else if (sectionBodies.get(name) === null) errors.push(`Duplicate required section: [${name}]`);
    else if (!clean(sectionBodies.get(name))) errors.push(`Required section is empty: [${name}]`);
  }

  const critical = [
    ['PHYSICAL LIGHTING', /Physical illumination/i, 'Physical illumination rule is missing from [PHYSICAL LIGHTING].'],
    ['PHYSICAL LIGHTING', /Exposure, ISO, HDR/i, 'Exposure/ISO/HDR separation rule is missing from [PHYSICAL LIGHTING].'],
    ['LENS_PHYSICS', /chromatic aberration/i, 'Chromatic aberration rule is missing from [LENS_PHYSICS].'],
    ['LENS_PHYSICS', /vignetting/i, 'Vignetting rule is missing from [LENS_PHYSICS].'],
    ['LENS_PHYSICS', /barrel distortion/i, 'Barrel-distortion rule is missing from [LENS_PHYSICS].'],
    ['BIOLOGICAL_MICRO_REALISM', /visible skin pores/i, 'Visible skin pores rule is missing from [BIOLOGICAL_MICRO_REALISM].'],
    ['BIOLOGICAL_MICRO_REALISM', /corneal reflections/i, 'Corneal reflections rule is missing from [BIOLOGICAL_MICRO_REALISM].'],
    ['BIOLOGICAL_MICRO_REALISM', /stray hairs/i, 'Stray hairs rule is missing from [BIOLOGICAL_MICRO_REALISM].'],
    ['IDENTITY / SUBJECT', /Hair length, density, hairline shape/i, 'Hair length/density/hairline lock is missing from [IDENTITY / SUBJECT].'],
    ['CAMERA METADATA HINT', /./, ''],
    ['CAMERA_METADATA_HINT', /CAPTURE METADATA/i, 'Capture metadata guidance is missing from [CAMERA_METADATA_HINT].'],
    ['NEGATIVE CONSTRAINTS', /Avoid:/i, 'Negative constraint language is missing from [NEGATIVE CONSTRAINTS].'],
    ['FINAL VERIFICATION', /Before finalizing/i, 'Final verification language is missing from [FINAL VERIFICATION].']
  ];
  for (const [name, pattern, message] of critical) {
    if (!message) continue;
    const body = sectionBodies.get(name) || '';
    if (!pattern.test(body)) errors.push(message);
  }

  if (context.saudiContext && !/CULTURAL CONTEXT — SAUDI/i.test(sectionBodies.get('SCENE') || '')) {
    errors.push('Saudi cultural dress rule is missing from [SCENE] for a Saudi context.');
  }
  if (!context.realismPacket?.subject || !context.realismPacket?.accessories || !context.realismPacket?.photography || !context.realismPacket?.background) {
    errors.push('Realistic Image Generator JSON structure is incomplete.');
  }
  if (context.sceneType?.capture?.includes('selfie') && !/reachable|arm-reach|arm length/i.test(text)) {
    warnings.push('Selfie prompt should explicitly preserve reachable camera geometry.');
  }
  return { valid: errors.length === 0, errors, warnings };
}
