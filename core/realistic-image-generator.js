const DEFAULT_MIRROR_RULE = 'not_applicable';

const SCENARIO_PROFILES = {
  gym: {
    template: 'Gym/Fitness Selfie',
    action: 'capture a brief post-workout moment while naturally recovering, adjusting gear, or holding a water bottle rather than posing for an advertisement',
    accessories: { headwear: 'none unless explicitly requested', jewelry: 'minimal or none; no luxury jewelry', device: 'smartphone plus an optional fitness tracker', prop: 'water bottle or gym towel only when it fits the action' },
    imperfections: ['slight sweat sheen', 'subtle flushed cheeks', 'small clothing creases from movement'],
    background: ['exercise equipment in believable scale', 'rubber flooring', 'practical ceiling lights', 'ordinary gym users or personal items when appropriate']
  },
  mirror: {
    template: 'Mirror Selfie',
    action: 'capture a quick candid mirror moment while checking the outfit or getting ready, with natural body asymmetry and no staged fashion-ad pose',
    accessories: { headwear: 'match the selected clothing and setting', jewelry: 'minimal everyday jewelry only if contextually appropriate', device: 'smartphone visible in the mirror reflection', prop: 'ordinary nearby personal item only when natural' },
    imperfections: ['slight mirror smudges or tiny surface marks', 'minor clothing wrinkles', 'slightly imperfect framing'],
    background: ['mirror edges or frame', 'ordinary bedroom or bathroom items', 'realistic furniture or counter surfaces', 'subtle lived-in clutter']
  },
  car: {
    template: 'Car Selfie',
    action: 'capture a close personal selfie while seated naturally in a stationary car, with relaxed posture and a small everyday gesture rather than a rigid pose',
    accessories: { headwear: 'match the selected clothing naturally', jewelry: 'minimal everyday accessories only', device: 'smartphone held in the subject\'s hand', prop: 'none by default; small everyday item only if requested' },
    imperfections: ['slight window reflections', 'minor fabric creasing from the seat', 'subtle cabin shadow noise', 'small handheld framing error'],
    background: ['seat upholstery', 'door trim and window glass', 'a small dashboard or steering-wheel cue when physically visible', 'ordinary exterior parking or street context']
  },
  third_person_car_exterior: {
    template: 'Third-Person Photo Beside a Parked Car',
    action: 'capture a natural third-person photograph of the subject standing beside a parked vehicle, with relaxed weight distribution and natural hand placement',
    accessories: { headwear: 'match the selected clothing and outdoor setting', jewelry: 'minimal everyday accessories only', device: 'none held by the subject; photographed by another person', prop: 'the parked vehicle is environmental context, not a hero product' },
    imperfections: [
      'sun-lit hard shadow on the ground beside the subject when direct daylight is selected',
      'minor posture asymmetry',
      'small framing imperfection',
      'ordinary parking lot wear, painted markings, oil spot texture'
    ],
    background: [
      'a parked vehicle beside the subject with correct body-to-car spacing',
      'realistic asphalt or paving with painted parking markings',
      'ordinary neighboring parked vehicles where contextually appropriate',
      'physically plausible outdoor depth and daylight or practical-light behavior'
    ]
  },
  outdoor: {
    template: 'Street/Outdoor Photo',
    action: 'capture a natural walking, pausing, or lightly leaning moment with real environmental interaction instead of a static portrait pose',
    accessories: { headwear: 'match weather and clothing only', jewelry: 'minimal everyday accessories', device: 'smartphone appropriate to the selected capture type', prop: 'none unless it belongs to the activity' },
    imperfections: ['light wind effect on clothing when plausible', 'minor posture asymmetry', 'small framing imperfection', 'ordinary environmental wear or dust'],
    background: ['realistic pavement or ground texture', 'ordinary Saudi buildings or landscape', 'parked vehicles or sparse pedestrians when appropriate', 'physically plausible sky and depth']
  },
  lifestyle: {
    template: 'Lifestyle Smartphone Photo',
    action: 'capture a real in-between moment while sitting, standing, talking, waiting, drinking, or moving naturally in the chosen setting rather than posing for a staged photograph',
    accessories: { headwear: 'context-appropriate only', jewelry: 'minimal everyday accessories', device: 'smartphone appropriate to the selected capture type', prop: 'only a naturally used object that belongs to the activity' },
    imperfections: ['minor garment wrinkles', 'small posture asymmetry', 'ordinary background clutter or wear'],
    background: ['context-appropriate furniture or fixtures', 'ordinary personal or work items', 'realistic circulation space', 'small lived-in details rather than showroom styling']
  }
};

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function detectScenario(input = {}) {
  const sceneType = clean(input.sceneType).toLowerCase();
  const requestedSceneType = clean(input.requestedSceneType).toLowerCase();
  const capture = clean(input.captureType).toLowerCase();
  const explicitSceneType = `${sceneType} ${requestedSceneType}`;
  const haystack = [sceneType, requestedSceneType, input.location, input.description, input.pose].map(clean).join(' ').toLowerCase();

  if (/mirror selfie/i.test(capture)) return 'mirror';
  if (/inside_car_selfie|car_group_selfie/.test(explicitSceneType)) return 'car';

  if (/third-person/i.test(capture)) {
    if (/third_person_car_adjacent/.test(explicitSceneType)) return 'third_person_car_exterior';
    const explicitOutdoor = /outdoor|street|parking|driveway|desert|beach|corniche|road/.test(explicitSceneType);
    if (explicitOutdoor) return 'lifestyle';
    const carContext = /car|vehicle|driver|passenger|سيارة|مركبة|مقعد السائق/.test(haystack);
    return carContext ? 'third_person_car_exterior' : 'lifestyle';
  }

  if (/gym|fitness|workout|نادي|تمرين/.test(explicitSceneType)) return 'gym';
  if (/mirror_selfie/i.test(explicitSceneType)) return 'mirror';
  if (/outdoor_selfie|walking_selfie|street|parking|driveway|desert|beach|corniche|road/.test(explicitSceneType)) return 'outdoor';

  if (/gym|fitness|workout|نادي|تمرين/.test(haystack)) return 'gym';

  const carContext = /car|vehicle|driver|passenger|سيارة|مركبة|مقعد السائق/.test(haystack);
  if (carContext) return 'car';

  if (/outdoor|street|walking|desert|beach|corniche|park|parking|driveway|road|شارع|خارجي|مشي|صحراء|شاطئ|كورنيش|حديقة|موقف/.test(haystack)) return 'outdoor';

  return 'lifestyle';
}

function mirrorRuleFor(scenario) {
  if (scenario !== 'mirror') return DEFAULT_MIRROR_RULE;
  return 'true mirror selfie: preserve physically coherent reflection geometry and phone/hand placement. Any intentional readable text on clothing should appear forward and legible in the final delivered image; achieve this through final image orientation only, never by inventing impossible reflection geometry.';
}

function deviceForCapture(input, scenario) {
  const capture = clean(input.captureType).toLowerCase();
  if (scenario === 'mirror' || /mirror/.test(capture)) return 'smartphone visible in the mirror reflection';
  if (/third-person/.test(capture)) return 'none held by the subject; photographed by another person';
  if (/selfie/.test(capture)) return 'smartphone held in the subject\'s hand';
  return 'no camera device held by the subject unless explicitly required by the scene';
}

function simpleCameraLanguage(input, scenario) {
  const capture = clean(input.captureType).toLowerCase();
  if (scenario === 'mirror') return 'smartphone mirror selfie with natural room light and ordinary handheld framing';
  if (/third-person/.test(capture)) return 'natural smartphone photo taken by another person with simple everyday framing';
  return 'smartphone front camera with natural arm-length perspective and ordinary handheld framing';
}

function productIntegrationRule(description) {
  const text = clean(description);
  if (!text) return 'No product is featured. Do not invent a hero product or advertisement-style placement.';
  return 'If the user explicitly mentions a product or prop, integrate it as something naturally used in the activity. Never turn it into a posed display, isolated hero object, or advertisement unless explicitly requested.';
}

function backgroundElementsFor(profile, activity) {
  const peoplePattern = /\b(users?|people|pedestrians?|visitors?|patrons?|famil(?:y|ies)|individuals?|crowd)\b/i;
  const base = profile.background.filter((item) => !peoplePattern.test(item));
  if (activity === 'quiet') return base;
  if (activity === 'lively') return [...base, '3-5 independently behaving background people when people are contextually appropriate, with natural spacing and no duplicated identities'];
  return [...base, '1-2 independently behaving background people when people are contextually appropriate, kept secondary to the subject'];
}

function contextualChecklist(scenario, backgroundActivity) {
  return [
    'accessories match the setting and activity',
    'clothing fits the scenario and body movement',
    `background occupancy matches the selected ${backgroundActivity} activity level`,
    'background elements are observable and contextually plausible',
    'expression matches the action rather than a generic pose',
    scenario === 'mirror' ? 'mirror_rules are explicitly present and reflection geometry remains coherent' : 'mirror_rules are marked not_applicable',
    'imperfections remain subtle and believable',
    'any product or prop is integrated naturally rather than displayed',
    'camera language stays simple while physical geometry remains plausible',
    'the scene is action-driven rather than static'
  ];
}

// mirror_one_hand_pocket & third_one_hand_pocket
// are treated as standing because their names carry
// standing context. The general one_hand_pocket lacks such context and intentionally falls back to profile.
// TODO-SCENE-CAR-STATIONARY: Move stationary-vehicle context into [SCENE] for inside-car scenes, then drop stationary-car wording from driver/passenger ACTION.
const POSE_ACTION_SEMANTICS = Object.freeze({
  standing:{ action:'stand naturally with relaxed weight distribution', poses:new Set(['standing_relaxed','standing_one_hand','standing_arms_crossed','standing_hands_in_pockets','standing_looking_away','standing_stretching','standing_hand_on_hip','standing_hands_clasped_front','standing_thumb_in_pocket','standing_hand_on_neck','standing_neutral_at_side','door_open_car','bedroom-stand-relaxed','bedroom-stand-one-hand','bedroom-stand-near-bed','bedroom-stand-curtains','bedroom-stand-window','bedroom-phone-only','bedroom-curtain-touch','bedroom-mirror-stand-relaxed','mirror_standing_relaxed','mirror_one_hand_pocket','mirror_full_length','third_standing_relaxed','third_one_hand_pocket']) },
  seated:{ action:'remain naturally seated with a relaxed posture', poses:new Set(['seated_sofa','seated_chair','seated_legs_crossed','seated_elbow_on_table','seated_leaning_forward','seated_reading_posture','seated_hands_on_lap','seated_hand_on_knee','bed-sitting-cross','bed-sitting-edge','bed-sitting-back-wall','bed-sitting-legs-extended','bed-sitting-hugging-pillow','bed-sitting-sideways','armchair-sit-lean-back','armchair-sit-corner','armchair-sit-one-knee','armchair-sit-crossed','armchair-sit-feet-floor','bedroom-laptop-bed','bedroom-laptop-armchair','bedroom-cup-bed','bedroom-tea-armchair','bedroom-book-bed','bedroom-floor-cross','bedroom-floor-back-wall','bedroom-floor-knee-up','bedroom-nightstand-reach','bedroom-mirror-seated','mirror_seated','third_seated_relaxed']) },
  walking:{ action:'walk naturally through a real gait phase', poses:new Set(['walking_slow','walking_looking_back','third_walking_candid']) },
  leaning:{ action:'lean lightly to one side with natural weight transfer', poses:new Set(['lean_wall','lean_counter','lean_railing','leaning_against_wall','bedroom-stand-lean-wardrobe','bedroom-stand-lean-wall','third_lean_wall']) },
  adjusting_clothing:{ action:'gently adjust a small section of clothing', poses:new Set(['adjust_clothing','bedroom-mirror-adjust','mirror_adjust_clothing']) },
  driver:{ action:'remain naturally positioned as the driver in a stationary car', poses:new Set(['driver_seat']) },
  passenger:{ action:'remain naturally positioned as the front passenger in a stationary car', poses:new Set(['passenger_seat']) },
  lying:{ action:'lie naturally with a relaxed posture', poses:new Set(['bed-lying-back','bed-lying-side','bed-lying-stomach','bed-lying-partial','bed-lying-diagonal','bed-lying-reading','bed-lying-back-knees-bent']) }
});

function deriveActionFromPose({ pose = '', poseValue = '', scene = '', captureType = '' } = {}) {
  const value=clean(poseValue) || clean(pose);
  const entry=Object.values(POSE_ACTION_SEMANTICS).find((item)=>item.poses.has(value));
  if(!entry) return '';
  const context=`${clean(scene)} ${clean(captureType)}`.toLowerCase();
  const modifier=context.includes('third-person') ? 'while another person photographs the subject' : context.includes('mirror') ? 'while taking the mirror selfie' : 'while taking the selfie';
  return `${entry.action} ${modifier}`;
}

export function buildRealismPacket(input = {}) {
  const scenario = detectScenario(input);
  const profile = SCENARIO_PROFILES[scenario];
  const mirrorRules = mirrorRuleFor(scenario);
  const clothing = clean(input.clothing) || 'context-appropriate clothing with natural folds and believable wear';
  const expression = clean(input.expression) || 'a natural expression that matches the ongoing action';
  const setting = clean(input.location) || 'an ordinary, non-iconic Saudi setting appropriate to the activity';
  const lighting = clean(input.lighting) || 'simple natural or practical light appropriate to the setting';
  const heldPropText = clean(input.heldProp) && clean(input.heldProp) !== 'none' ? clean(input.heldProp) : null;
  const secondaryPropText = clean(input.secondaryProp) && clean(input.secondaryProp) !== 'none' ? clean(input.secondaryProp) : null;
  // Priority: explicit action > pose-derived > profile fallback.
  // UI currently never passes input.action; direct API callers may.
  const poseDerivedAction=deriveActionFromPose({ pose:input.pose, poseValue:input.poseValue, scene:input.requestedSceneType || input.sceneType, captureType:input.captureType });
  let action = clean(input.action) || poseDerivedAction || profile.action;

  if (heldPropText) {
    action = action
      .replace(/\s*,?\s*holding a water bottle\s*/gi, ' ')
      .replace(/\s*,?\s*or gym towel\s*/gi, ' ')
      .replace(/\s*,?\s*adjusting gear\s*/gi, ' ')
      .replace(/\s*,\s*,+/g, ',')
      .replace(/\s*,?\s*or\s+rather\b/gi, ' rather')
      .replace(/\s+/g, ' ')
      .trim();
    if (!action.endsWith('.') && !action.endsWith(';')) action += '.';
  }

  let accessoriesProp = heldPropText || profile.accessories.prop;
  if (heldPropText) {
    accessoriesProp += '. The object is held with correct grip tension, natural wrist angle, and visible contact shadows between fingers and object.';
  }
  if (secondaryPropText) {
    accessoriesProp += ` ${secondaryPropText}. Both objects are held simultaneously with realistic weight distribution and no hand deformation.`;
  }
  const backgroundActivity = ['quiet', 'normal', 'lively'].includes(input.backgroundActivity) ? input.backgroundActivity : 'normal';
  const backgroundElements = Array.isArray(input.backgroundElements) && input.backgroundElements.length
    ? input.backgroundElements.map(clean).filter(Boolean)
    : backgroundElementsFor(profile, backgroundActivity);
  const selectedHairStyle = clean(input.hairStyle);

  return {
    methodology: 'REALISTIC IMAGE GENERATOR',
    template_type: profile.template,
    action,
    subject: {
      description: 'adult subject captured in a real moment with natural posture and contextual behavior',
      mirror_rules: mirrorRules,
      age: clean(input.age) || 'preserve the apparent age from the identity reference when provided; otherwise keep a realistic adult age',
      expression,
      hair: selectedHairStyle
        ? `apply only this visible hair direction/style while preserving reference-consistent hairline, length, density and texture: ${selectedHairStyle}`
        : 'preserve reference hairline, length, density and texture when a reference is provided; otherwise keep realistic stable hair characteristics',
      clothing,
      face: 'preserve natural asymmetry, pores, under-eye texture, uneven pigmentation and identity-defining details; no beauty retouching'
    },
    accessories: { ...profile.accessories, prop: accessoriesProp, device: deviceForCapture(input, scenario) },
    photography: {
      camera_style: simpleCameraLanguage(input, scenario),
      angle: clean(input.angle) || 'natural eye-level or mildly off-axis angle appropriate to the action',
      shot_type: clean(input.shotType) || profile.template,
      aspect_ratio: clean(input.aspectRatio) || '9:16 vertical',
      texture: 'authentic smartphone texture with restrained processing, small imperfections and no polished commercial finish'
    },
    background: {
      setting,
      activity: backgroundActivity,
      wall_color: clean(input.wallColor) || 'context-dependent; do not invent a decorative wall color if the scene does not require one',
      elements: backgroundElements,
      atmosphere: 'lived-in, ordinary, contextually coherent and not staged',
      lighting
    },
    imperfections: [...profile.imperfections],
    product_integration: productIntegrationRule(input.description),
    contextual_consistency_checklist: contextualChecklist(scenario, backgroundActivity)
  };
}

export function renderRealismGuidance(packet) {
  const background = packet.background.elements.map((item) => `- ${item}`).join('\n');
  const imperfections = packet.imperfections.map((item) => `- ${item}`).join('\n');
  const action = /[.;!?]$/.test(packet.action) ? packet.action : `${packet.action}.`;
  const accessories = Object.entries(packet.accessories)
    .filter(([key, value]) => key !== 'device' || !/none held by the subject; photographed by another person/i.test(value))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
  return {
    action: `Complete scene action: ${action} The subject must look occupied by a real moment, not frozen into a generic pose.`,
    accessories: `Keep every accessory consistent with the activity and setting:\n${accessories}`,
    background: `Observable background elements:\n${background}\nAtmosphere: ${packet.background.atmosphere}. Background activity: ${packet.background.activity}.`,
    imperfections: `Use subtle authentic contextual imperfections only:\n${imperfections}`,
    mirror: packet.subject.mirror_rules === DEFAULT_MIRROR_RULE
      ? 'Mirror rules: not applicable for this capture type.'
      : `Mirror rules: ${packet.subject.mirror_rules}`,
    product: packet.product_integration,
    consistency: `Before finalizing, verify: ${packet.contextual_consistency_checklist.join('; ')}.`
  };
}
