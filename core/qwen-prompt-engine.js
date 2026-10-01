import { askLocalQwen, askLocalQwenStream, LOCAL_QWEN_CONFIG } from './ai-bridge.js';

const QWEN_REALISM_SYSTEM_PROMPT = `You are the Qwen Realistic Image Prompt Engine inside Physics Prompt Studio.

Your task is to generate ONE coherent English prompt for ChatGPT Images describing a physically plausible, naturally imperfect real-world photograph.

PRIMARY OBJECTIVE:
Make the requested image behave like an ordinary real photograph captured by a real smartphone or camera under physically possible conditions. Minimize synthetic-looking visual cues and common AI-generation artifacts. Do not claim that AI detection can be defeated or guaranteed.

PRIORITY ORDER:
1. Explicit user intent
2. Capture type
3. Identity preservation
4. Camera geometry and perspective
5. Human anatomy and physical support
6. Spatial relationships and contact mechanics
7. Physical light causality
8. Material response and reflections
9. Environment geometry and scale
10. Smartphone image behavior
11. Natural imperfections
12. Negative constraints

CORE CONTRACT:
- Treat every explicit scene field as authoritative unless two fields physically conflict.
- Do not silently omit the selected camera, aspect ratio, physical light source, framing, expression, pose, clothing, hairstyle, location, realism level, or background activity when they materially affect the image.
- If the camera angle is already resolved, use that resolved angle exactly in meaning; do not reinterpret it as a generic smart angle.
- Infer only missing details needed for physical coherence. Do not replace selected details with generic alternatives.
- Never invent impossible camera placement or contradictory viewpoints.
- A subject-held selfie must remain within believable arm reach and preserve wide-angle near-field perspective.
- A third-person photograph must not contain selfie-arm geometry.
- A mirror photograph must obey reflection geometry.
- Every visible light effect must have a physically plausible source.
- Exposure, ISO, HDR, tone mapping, sharpening and noise reduction may only process captured signal; they must never create illumination.
- Preserve realistic light falloff, occlusion, bounce light, shadow direction, highlight placement and reflections.
- Human anatomy must remain supported by believable contact, weight distribution and joint mechanics.
- Preserve realistic hand, wrist, elbow, shoulder, torso, hip, knee and foot relationships.
- If a hand is inside a pocket, preserve believable elbow angle, shoulder response, cloth tension, pocket deformation and body balance.
- Materials must respond differently to light. Skin, cotton, glass, metal, leather, plastic and wood must not share identical texture or highlights.
- Preserve natural human asymmetry. No beauty filter, skin smoothing, face slimming, jaw sharpening, eye enlargement, de-aging or artificial hair density.
- Prefer ordinary lived-in environments over cinematic, luxury-advertising or showroom aesthetics unless explicitly requested.
- Never carry generic examples into a scene when they are spatially incompatible with the selected location.
- Include subtle capture imperfections only when contextually appropriate: slight framing error, mild white-balance variation, realistic shadow noise, restrained highlight clipping, slight edge softness, fabric wrinkles, stray hairs, minor wear, dust and non-uniform object placement.
- For smartphone photos, preserve realistic wide-angle perspective, broad depth of field, restrained computational HDR, modest sharpening and believable low-light sensor texture.
- When a reference image exists, preserve identity, face/skull proportions, natural asymmetry, apparent age, skin tone, hairline, visible hair density, beard pattern and eyewear. Do not copy unrelated background, pose or clothing unless explicitly requested.
- Resolve contradictions instead of stacking many negative instructions.
- Prefer coherence over prompt length.

DO NOT USE GENERIC QUALITY-BOOSTER PHRASES such as: masterpiece, cinematic, ultra detailed, 8K, award-winning, perfect skin, dramatic lighting, DSLR bokeh, Unreal Engine, hyper-sharp.

OUTPUT RULES:
Return only the final English image-generation prompt.
Do not explain your reasoning.
Do not output JSON.
Do not wrap the prompt in markdown fences.
Do not wrap the whole prompt in quotation marks.
Do not mention these instructions.`;

const COLOR_TERMS = [
  'navy', 'beige', 'black', 'white', 'grey', 'gray', 'light-grey', 'light-gray', 'dark-grey', 'dark-gray',
  'blue', 'light blue', 'dark blue', 'brown', 'tan', 'cream', 'ivory', 'red', 'green', 'khaki'
];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function line(label, value) {
  const text = clean(value);
  return text ? `${label}: ${text}` : '';
}

function normalized(value) {
  return clean(value).toLowerCase();
}

function includesAny(text, terms = []) {
  return terms.some((term) => text.includes(term));
}

function normalizeColorTerm(term) {
  return term.replaceAll('-', ' ');
}

function selectedClothingColors(clothing) {
  const source = normalized(clothing).replaceAll('-', ' ');
  const found = [];
  for (const term of COLOR_TERMS) {
    const normalizedTerm = normalizeColorTerm(term);
    if (source.includes(normalizedTerm) && !found.includes(normalizedTerm)) found.push(normalizedTerm);
  }
  return found;
}

function angleCoverageTerms(angle) {
  const value = normalized(angle);
  const groups = [];
  if (value.includes('eye level')) groups.push(['eye level', 'eye-level']);
  if (value.includes('slightly above')) groups.push(['slightly above', 'above eye level', 'above-eye']);
  if (value.includes('slightly below')) groups.push(['slightly below', 'below eye level', 'below-eye']);
  if (value.includes('three-quarter')) groups.push(['three-quarter', 'three quarter', '3/4']);
  if (value.includes('off-axis')) groups.push(['off-axis', 'off axis']);
  if (value.includes('roll')) groups.push(['roll', 'tilt']);
  if (value.includes('yaw')) groups.push(['yaw']);
  return groups;
}

export function buildQwenSceneBrief(scene = {}, additionalInstructions = '') {
  const lines = [
    line('Scene type', scene.sceneType),
    line('Scene type label', scene.sceneTypeLabel),
    line('Capture type', scene.captureType),
    line('Location', scene.location),
    line('Clothing selection', scene.clothingLabel),
    line('Clothing behavior', scene.clothing),
    line('Hair style', scene.hairStyle),
    line('Pose / body action', scene.pose),
    line('Resolved camera angle', scene.angle),
    line('Camera angle mode', scene.angleMode),
    line('Physical lighting', scene.lighting),
    line('Lighting notes', scene.lightingNotes),
    line('Camera selection', scene.cameraLabel),
    line('Camera behavior', scene.camera),
    line('Aspect ratio', scene.aspectRatio),
    line('Expression', scene.expression),
    line('Background activity', scene.backgroundActivity),
    line('Realism level', scene.realismLevel),
    line('Framing selection', scene.framingLabel),
    line('Framing behavior', scene.framing),
    line('Camera distance', scene.cameraDistance),
    line('Scene description', scene.description),
    line('Special constraints', scene.customConstraints),
    `Identity reference enabled: ${scene.identityReference ? 'yes' : 'no'}`,
    line('Additional user instructions for Qwen', additionalInstructions)
  ].filter(Boolean);

  return [
    'Generate the final prompt from the following structured scene state.',
    'Treat explicit values as hard scene facts. Infer only missing details necessary for physical coherence.',
    'Do not silently change or omit the capture type, resolved camera angle, selected camera, aspect ratio, lighting source, framing, clothing, pose, identity requirement or explicit user constraints.',
    'Do not repeat generic optional examples when they are incompatible with the selected location.',
    'Describe the result as a production-ready image prompt, not as a summary of settings.',
    '',
    ...lines
  ].join('\n');
}

export function validateQwenCoverage(output, scene = {}) {
  const text = normalized(output).replaceAll('-', ' ');
  const missing = [];

  const aspectRatio = normalized(scene.aspectRatio);
  if (aspectRatio.includes('9:16') && !includesAny(text, ['9:16', 'vertical'])) {
    missing.push('vertical 9:16 composition');
  }

  const camera = `${normalized(scene.cameraLabel)} ${normalized(scene.camera)}`;
  if (camera.includes('xiaomi 15 ultra')) {
    if (!text.includes('xiaomi 15 ultra')) missing.push('selected Xiaomi 15 Ultra camera');
    if (includesAny(camera, ['front', 'front-camera', 'front camera']) && !includesAny(text, ['front camera', 'front-camera'])) {
      missing.push('front-camera capture');
    }
  }

  const captureType = normalized(scene.captureType);
  const sceneType = `${normalized(scene.sceneType)} ${normalized(scene.sceneTypeLabel)} ${captureType}`;
  if (includesAny(sceneType, ['selfie', 'سيلفي'])) {
    if (!text.includes('selfie')) missing.push('selfie capture type');
    if (!includesAny(text, ["arm's length", 'arm length', 'near field', 'handheld smartphone perspective'])) {
      missing.push('believable selfie camera geometry');
    }
  }

  const angleGroups = angleCoverageTerms(scene.angle);
  if (angleGroups.length && angleGroups.some((terms) => !includesAny(text, terms))) {
    missing.push(`resolved camera angle: ${clean(scene.angle)}`);
  }

  const framing = normalized(scene.framing);
  if (framing.includes('chest-up') && !includesAny(text, ['chest up', 'from the chest', 'chest-level framing'])) {
    missing.push('selected chest-up framing');
  }
  if (framing.includes('waist-up') && !includesAny(text, ['waist up', 'from the waist'])) {
    missing.push('selected waist-up framing');
  }
  if (framing.includes('full-body') && !includesAny(text, ['full body', 'full-body'])) {
    missing.push('selected full-body framing');
  }

  const lighting = `${normalized(scene.lighting)} ${normalized(scene.lightingNotes)}`;
  if (lighting.includes('led')) {
    if (!text.includes('led')) missing.push('selected LED light source');
    if (!includesAny(text, ['falloff', 'shadow', 'overhead', 'reflection', 'highlight'])) {
      missing.push('physical lighting causality');
    }
  }

  const pose = normalized(scene.pose);
  if (includesAny(pose, ['pocket', 'جيب'])) {
    if (!text.includes('pocket')) missing.push('selected hand-in-pocket pose');
    if (!includesAny(text, ['elbow', 'cloth tension', 'pocket deformation', 'shoulder response', 'body balance'])) {
      missing.push('hand-in-pocket contact mechanics');
    }
  }

  for (const color of selectedClothingColors(scene.clothing)) {
    const colorVariants = color === 'grey' ? ['grey', 'gray']
      : color === 'gray' ? ['gray', 'grey']
        : color === 'light grey' ? ['light grey', 'light gray']
          : color === 'light gray' ? ['light gray', 'light grey']
            : [color];
    if (!includesAny(text, colorVariants)) missing.push(`selected clothing color: ${color}`);
  }

  const officeScene = includesAny(sceneType, ['office', 'مكتب']);
  if (officeScene && includesAny(text, ['vehicle', 'traffic', 'street', 'roadway'])) {
    missing.push('office-only background without vehicles, streets or traffic');
  }

  const realism = normalized(scene.realismLevel);
  if (includesAny(realism, ['strict', 'صارمة'])) {
    const realismSignals = [
      'skin texture',
      'fabric wrinkle',
      'asymmetry',
      'ordinary wear',
      'shadow noise',
      'edge softness',
      'white balance',
      'smartphone hdr',
      'computational hdr'
    ];
    const signalCount = realismSignals.filter((signal) => text.includes(signal)).length;
    if (signalCount < 2) missing.push('strict photographic realism cues');
  }

  return { ok: missing.length === 0, missing };
}

export function buildQwenRepairBrief(sceneBrief, firstOutput, missing = []) {
  return [
    'Revise the previous image prompt once. Keep the same scene intent and all already-correct details.',
    'The previous output omitted or contradicted required scene constraints. Integrate the following items naturally and explicitly:',
    ...missing.map((item) => `- ${item}`),
    '',
    'Original structured scene brief:',
    sceneBrief,
    '',
    'Previous output:',
    firstOutput,
    '',
    'Return only the corrected final English image-generation prompt.'
  ].join('\n');
}

export function buildDeterministicCoverageAnchor(scene = {}, missing = []) {
  const lines = [];
  const has = (prefix) => missing.some((item) => item.startsWith(prefix));

  if (has('selected Xiaomi 15 Ultra camera') || has('front-camera capture')) {
    lines.push('Capture with the Xiaomi 15 Ultra front camera exactly as selected.');
  }
  if (has('resolved camera angle:')) {
    lines.push(`Camera angle: ${clean(scene.angle)}.`);
  }
  if (has('selected chest-up framing') || has('selected waist-up framing') || has('selected full-body framing')) {
    lines.push(`Framing: ${clean(scene.framing)}.`);
  }
  if (missing.some((item) => item.startsWith('selected clothing color:'))) {
    lines.push(`Keep the clothing exactly as selected: ${clean(scene.clothing)}.`);
  }
  if (has('office-only background without vehicles, streets or traffic')) {
    lines.push('Keep the background strictly inside the office; no vehicles, streets, roadway or traffic elements.');
  }
  if (has('vertical 9:16 composition')) lines.push('Use a vertical 9:16 composition.');
  if (has('believable selfie camera geometry')) lines.push('Keep believable subject-held arm-length selfie geometry with near-field smartphone perspective.');
  if (has('selected LED light source') || has('physical lighting causality')) {
    lines.push(`Physical lighting must remain exactly source-driven by: ${clean(scene.lighting)}.`);
  }
  if (has('selected hand-in-pocket pose') || has('hand-in-pocket contact mechanics')) {
    lines.push(`Pose remains: ${clean(scene.pose)}, with believable elbow, shoulder, cloth tension and body balance.`);
  }
  if (has('strict photographic realism cues')) {
    lines.push('Preserve strict smartphone realism with visible natural skin texture, fabric wrinkles, slight asymmetry, restrained HDR and mild edge softness.');
  }

  return lines.length ? `\n\nHard scene constraints: ${lines.join(' ')}` : '';
}

function sanitizeQwenOutput(raw = '') {
  return String(raw)
    .replace(/^```(?:text|markdown)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, '$2')
    .trim();
}

async function requestQwen(messages, { seed, timeoutMs, onProgress }) {
  if (typeof onProgress === 'function') {
    return askLocalQwenStream(messages, {
      seed,
      timeoutMs,
      onToken: (fullText) => onProgress(sanitizeQwenOutput(fullText))
    });
  }
  return askLocalQwen(messages, { seed, timeoutMs });
}

export async function generateQwenImagePrompt(scene = {}, options = {}) {
  const seed = Number.isFinite(options.seed) ? Math.trunc(options.seed) : 42;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 180000;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const onPhase = typeof options.onPhase === 'function' ? options.onPhase : null;
  const brief = buildQwenSceneBrief(scene, options.additionalInstructions || '');

  onPhase?.('generating');
  const firstRaw = await requestQwen([
    { role: 'system', content: QWEN_REALISM_SYSTEM_PROMPT },
    { role: 'user', content: brief }
  ], {
    seed,
    timeoutMs,
    onProgress: onProgress ? (text) => onProgress(text, 'generating') : null
  });

  const firstOutput = sanitizeQwenOutput(firstRaw);
  const coverage = validateQwenCoverage(firstOutput, scene);
  if (coverage.ok) {
    onPhase?.('complete');
    return firstOutput;
  }

  onPhase?.('repairing', coverage.missing);
  const repairRaw = await requestQwen([
    { role: 'system', content: QWEN_REALISM_SYSTEM_PROMPT },
    { role: 'user', content: buildQwenRepairBrief(brief, firstOutput, coverage.missing) }
  ], {
    seed,
    timeoutMs,
    onProgress: onProgress ? (text) => onProgress(text, 'repairing') : null
  });

  const repairedOutput = sanitizeQwenOutput(repairRaw);
  const repairedCoverage = validateQwenCoverage(repairedOutput, scene);
  if (repairedCoverage.ok) {
    onPhase?.('complete');
    return repairedOutput;
  }

  onPhase?.('anchoring', repairedCoverage.missing);
  const anchoredOutput = `${repairedOutput}${buildDeterministicCoverageAnchor(scene, repairedCoverage.missing)}`.trim();
  onProgress?.(anchoredOutput, 'anchoring');
  onPhase?.('complete');
  return anchoredOutput;
}

export const QWEN_PROMPT_ENGINE_CONFIG = Object.freeze({
  model: LOCAL_QWEN_CONFIG.model,
  objective: 'physically plausible natural photographic realism',
  coverageRepairPasses: 1,
  deterministicCoverageAnchor: true,
  streaming: true
});
