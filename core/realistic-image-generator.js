const DEFAULT_MIRROR_RULE = 'not_applicable';

const SCENARIO_PROFILES = {
  gym: {
    template: 'Gym/Fitness Selfie',
    action: 'capture a brief post-workout moment while naturally recovering, adjusting gear, or holding a water bottle rather than posing for an advertisement',
    accessories: { headwear: 'none unless explicitly requested', jewelry: 'minimal or none; no luxury jewelry', device: 'smartphone plus an optional fitness tracker', prop: 'water bottle or gym towel only when it fits the action' },
    imperfections: ['slight sweat sheen', 'subtle flushed cheeks', 'a few loose hair strands or flyaways', 'small clothing creases from movement'],
    background: ['exercise equipment in believable scale', 'rubber flooring', 'practical ceiling lights', 'ordinary gym users or personal items when appropriate']
  },
  mirror: {
    template: 'Mirror Selfie',
    action: 'capture a quick candid mirror moment while checking the outfit or getting ready, with natural body asymmetry and no staged fashion-ad pose',
    accessories: { headwear: 'match the selected clothing and setting', jewelry: 'minimal everyday jewelry only if contextually appropriate', device: 'smartphone visible in the mirror reflection', prop: 'ordinary nearby personal item only when natural' },
    imperfections: ['slight mirror smudges or tiny surface marks', 'a few loose hair strands', 'minor clothing wrinkles', 'slightly imperfect framing'],
    background: ['mirror edges or frame', 'ordinary bedroom or bathroom items', 'realistic furniture or counter surfaces', 'subtle lived-in clutter']
  },
  car: {
    template: 'Car Selfie',
    action: 'capture a close personal selfie while seated naturally in a stationary car, with relaxed posture and a small everyday gesture rather than a rigid pose',
    accessories: { headwear: 'match the selected clothing naturally', jewelry: 'minimal everyday accessories only', device: 'smartphone front camera', prop: 'none by default; small everyday item only if requested' },
    imperfections: ['slight window reflections', 'minor fabric creasing from the seat', 'subtle cabin shadow noise', 'small handheld framing error'],
    background: ['seat upholstery', 'door trim and window glass', 'a small dashboard or steering-wheel cue when physically visible', 'ordinary exterior parking or street context']
  },
  outdoor: {
    template: 'Street/Outdoor Photo',
    action: 'capture a natural walking, pausing, or lightly leaning moment with real environmental interaction instead of a static portrait pose',
    accessories: { headwear: 'match weather and clothing only', jewelry: 'minimal everyday accessories', device: 'smartphone appropriate to the selected capture type', prop: 'none unless it belongs to the activity' },
    imperfections: ['light wind effect on hair or clothing when plausible', 'minor posture asymmetry', 'small framing imperfection', 'ordinary environmental wear or dust'],
    background: ['realistic pavement or ground texture', 'ordinary Saudi buildings or landscape', 'parked vehicles or sparse pedestrians when appropriate', 'physically plausible sky and depth']
  },
  lifestyle: {
    template: 'Lifestyle Smartphone Photo',
    action: 'capture a real in-between moment while sitting, standing, talking, waiting, drinking, or moving naturally in the chosen setting rather than posing for a staged photograph',
    accessories: { headwear: 'context-appropriate only', jewelry: 'minimal everyday accessories', device: 'smartphone appropriate to the selected capture type', prop: 'only a naturally used object that belongs to the activity' },
    imperfections: ['a few loose hair strands when visible', 'minor garment wrinkles', 'small posture asymmetry', 'ordinary background clutter or wear'],
    background: ['context-appropriate furniture or fixtures', 'ordinary personal or work items', 'realistic circulation space', 'small lived-in details rather than showroom styling']
  }
};

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function detectScenario(input = {}) {
  const sceneType = clean(input.sceneType).toLowerCase();
  const haystack = [sceneType, input.location, input.description, input.pose].map(clean).join(' ').toLowerCase();
  if (/gym|fitness|workout|نادي|تمرين/.test(haystack)) return 'gym';
  if (/mirror|مرآة/.test(haystack)) return 'mirror';
  if (/car|vehicle|driver|passenger|سيارة|مقعد السائق/.test(haystack)) return 'car';
  if (/outdoor|street|walking|desert|beach|corniche|park|road|شارع|خارجي|مشي|صحراء|شاطئ|كورنيش|حديقة/.test(haystack)) return 'outdoor';
  return 'lifestyle';
}

function mirrorRuleFor(scenario) {
  if (scenario !== 'mirror') return DEFAULT_MIRROR_RULE;
  return 'true mirror selfie: preserve physically coherent reflection geometry and phone/hand placement. Any intentional readable text on clothing should appear forward and legible in the final delivered image; achieve this through final image orientation only, never by inventing impossible reflection geometry.';
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

function contextualChecklist(profile, scenario) {
  return [
    'accessories match the setting and activity',
    'clothing fits the scenario and body movement',
    'background elements are observable and contextually plausible',
    'expression matches the action rather than a generic pose',
    scenario === 'mirror' ? 'mirror_rules are explicitly present and reflection geometry remains coherent' : 'mirror_rules are marked not_applicable',
    'imperfections remain subtle and believable',
    'any product or prop is integrated naturally rather than displayed',
    'camera language stays simple while physical geometry remains plausible',
    'the scene is action-driven rather than static'
  ];
}

export function buildRealismPacket(input = {}) {
  const scenario = detectScenario(input);
  const profile = SCENARIO_PROFILES[scenario];
  const mirrorRules = mirrorRuleFor(scenario);
  const clothing = clean(input.clothing) || 'context-appropriate clothing with natural folds and believable wear';
  const expression = clean(input.expression) || 'a natural expression that matches the ongoing action';
  const setting = clean(input.location) || 'an ordinary, non-iconic Saudi setting appropriate to the activity';
  const lighting = clean(input.lighting) || 'simple natural or practical light appropriate to the setting';
  const action = clean(input.action) || profile.action;
  const backgroundElements = Array.isArray(input.backgroundElements) && input.backgroundElements.length
    ? input.backgroundElements.map(clean).filter(Boolean)
    : [...profile.background];

  return {
    methodology: 'REALISTIC IMAGE GENERATOR',
    template_type: profile.template,
    action,
    subject: {
      description: 'adult subject captured in a real moment with natural posture and contextual behavior',
      mirror_rules: mirrorRules,
      age: clean(input.age) || 'preserve the apparent age from the identity reference when provided; otherwise keep a realistic adult age',
      expression,
      hair: 'preserve reference hairline, density, texture and natural stray hairs when a reference is provided; otherwise use realistic non-perfect hair',
      clothing,
      face: 'preserve natural asymmetry, pores, under-eye texture, uneven pigmentation and identity-defining details; no beauty retouching'
    },
    accessories: { ...profile.accessories },
    photography: {
      camera_style: simpleCameraLanguage(input, scenario),
      angle: clean(input.angle) || 'natural eye-level or mildly off-axis angle appropriate to the action',
      shot_type: clean(input.shotType) || profile.template,
      aspect_ratio: clean(input.aspectRatio) || '9:16 vertical',
      texture: 'authentic smartphone texture with restrained processing, small imperfections and no polished commercial finish'
    },
    background: {
      setting,
      wall_color: clean(input.wallColor) || 'context-dependent; do not invent a decorative wall color if the scene does not require one',
      elements: backgroundElements,
      atmosphere: 'lived-in, ordinary, contextually coherent and not staged',
      lighting
    },
    imperfections: [...profile.imperfections],
    product_integration: productIntegrationRule(input.description),
    contextual_consistency_checklist: contextualChecklist(profile, scenario)
  };
}

export function renderRealismGuidance(packet) {
  const background = packet.background.elements.map((item) => `- ${item}`).join('\n');
  const imperfections = packet.imperfections.map((item) => `- ${item}`).join('\n');
  const accessories = Object.entries(packet.accessories).map(([key, value]) => `- ${key}: ${value}`).join('\n');
  return {
    action: `Complete scene action: ${packet.action}. The subject must look occupied by a real moment, not frozen into a generic pose.`,
    accessories: `Keep every accessory consistent with the activity and setting:\n${accessories}`,
    background: `Observable background elements:\n${background}\nAtmosphere: ${packet.background.atmosphere}.`,
    imperfections: `Use subtle authentic imperfections only:\n${imperfections}`,
    mirror: packet.subject.mirror_rules === DEFAULT_MIRROR_RULE
      ? 'Mirror rules: not applicable for this capture type.'
      : `Mirror rules: ${packet.subject.mirror_rules}`,
    product: packet.product_integration,
    consistency: `Before finalizing, verify: ${packet.contextual_consistency_checklist.join('; ')}.`
  };
}
