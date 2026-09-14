const SECTION_ORDER = [
  'outcome',
  'relevant_context',
  'must_preserve_constraints',
  'evidence_and_success',
  'output_contract',
  'task_shape_routing',
  'final_verification'
];

const LABELS = {
  outcome: 'Outcome',
  relevant_context: 'Relevant context',
  must_preserve_constraints: 'Must-preserve constraints',
  evidence_and_success: 'Evidence and success',
  output_contract: 'Output contract',
  task_shape_routing: 'Task-shape routing',
  final_verification: 'Final verification'
};

const PATTERNS = {
  output: /(output|format|deliverable|return|respond|answer|json|table|markdown|code block|صيغة|تنسيق|المخرجات|أرجع|أرسل|اعرض|اكتب\s+النتيجة)/i,
  success: /(success|acceptance|evidence|verify|validation|done when|must pass|نجاح|تحقق|اختبار|قبول|يعتبر.*ناجح|تأكد)/i,
  routing: /(if .* then|otherwise|when .* use|route|workflow|phase|first .* then|إذا .* ف|وإلا|عند .* استخدم|المرحلة|أولاً|أولًا.*ثم)/i,
  context: /(context|background|existing|current|repository|repo|project|audience|location|time|السياق|الخلفية|المشروع|المستودع|الحالي|الجمهور|الموقع|الوقت)/i,
  constraint: /(must|must not|do not|don't|never|only|exactly|required|preserve|keep|without|لا\s|يجب|ممنوع|فقط|حصراً|حصرًا|بالضبط|حافظ|احتفظ|بدون|لا تغيّر|لا تغير)/i,
  verification: /(before final|final check|double-check|recheck|before returning|قبل الإرسال|قبل النهائي|مراجعة نهائية|راجع .* قبل|تحقق .* قبل)/i,
  deadline: /(deadline|due|by \w+day|by \d|before \d|within \d|موعد|موعد نهائي|قبل يوم|قبل تاريخ|خلال \d|بحلول)/i,
  source: /(source|citation|cite|reference|from the attached|from this file|مصدر|مصادر|مرجع|مراجع|استشهد|الملف المرفق)/i,
  safety: /(safety|safe|privacy|secret|credential|password|token|pii|خصوصية|سري|سرية|كلمة مرور|بيانات حساسة|مفتاح api)/i,
  scope: /(scope|in scope|out of scope|only change|only edit|do not touch|النطاق|ضمن النطاق|خارج النطاق|عدّل فقط|عدل فقط|لا تلمس)/i,
  approval: /(you may|authorized|approved|permission|go ahead|ابدأ|مصرح|مخوّل|مخول|موافق|لك الصلاحية|نفّذ|نفذ)/i,
  externalAction: /(send|publish|post|deploy|merge|push|delete|remove|email|message|purchase|book|create account|invite|share|نشر|أرسل|ارسل|ادمج|ادفع|احذف|أنشئ حساب|احجز|شارك|ادعُ)/i,
  localAction: /(edit|modify|write file|create file|run test|build|refactor|change code|عدّل|عدل|غيّر|غير|اكتب ملف|أنشئ ملف|شغل الاختبارات|شغّل الاختبارات|ابن|ابني|أعد الهيكلة)/i,
  scopeExpansion: /(and anything else|as needed|whatever else|use your judgment to add|expand scope|أي شيء آخر|ما تراه مناسباً|ما تراه مناسبًا|وسع النطاق|أضف ما يلزم)/i
};

function normalizeNewlines(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n');
}

function splitBlocks(prompt) {
  const normalized = normalizeNewlines(prompt);
  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .flatMap((paragraph) => {
      const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean);
      return lines.length <= 1 ? [paragraph.trim()].filter(Boolean) : lines;
    })
    .filter(Boolean);

  return paragraphs.map((text, index) => ({ id: `b${index + 1}`, text, index }));
}

function sentenceWeight(text) {
  const imperative = /^(create|build|write|make|generate|analyze|summarize|review|fix|implement|design|help|أريد|ابن|ابني|أنشئ|اكتب|حلل|راجع|صمم|نفّذ|نفذ|حوّل|حول)/i.test(text);
  return (imperative ? 5 : 0) + Math.min(text.length / 120, 3);
}

function classifyBlock(block, index) {
  const text = block.text;
  if (PATTERNS.verification.test(text)) return 'final_verification';
  if (PATTERNS.output.test(text)) return 'output_contract';
  if (PATTERNS.success.test(text)) return 'evidence_and_success';
  if (PATTERNS.routing.test(text)) return 'task_shape_routing';
  if (PATTERNS.constraint.test(text) || PATTERNS.safety.test(text) || PATTERNS.scope.test(text)) return 'must_preserve_constraints';
  if (PATTERNS.context.test(text)) return 'relevant_context';
  if (index === 0 || sentenceWeight(text) >= 5) return 'outcome';
  return 'relevant_context';
}

function chooseOutcome(blocks) {
  if (!blocks.length) return null;
  return [...blocks].sort((a, b) => sentenceWeight(b.text) - sentenceWeight(a.text))[0];
}

function uniqueByText(blocks) {
  const seen = new Set();
  return blocks.filter((block) => {
    const key = block.text.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSections(blocks) {
  const grouped = Object.fromEntries(SECTION_ORDER.map((name) => [name, []]));
  const outcomeBlock = chooseOutcome(blocks);

  for (const block of blocks) {
    const target = block.id === outcomeBlock?.id ? 'outcome' : classifyBlock(block, block.index);
    grouped[target].push(block);
  }

  for (const key of SECTION_ORDER) grouped[key] = uniqueByText(grouped[key]);
  return grouped;
}

function makeSectionRecord(name, blocks) {
  if (!blocks.length) {
    return {
      name,
      label: LABELS[name],
      included: false,
      reason: `No material ${LABELS[name].toLowerCase()} content detected in the source prompt.`,
      text: ''
    };
  }

  return {
    name,
    label: LABELS[name],
    included: true,
    reason: null,
    text: blocks.map((block) => block.text).join('\n')
  };
}

function isMustPreserve(text) {
  return [
    PATTERNS.constraint,
    PATTERNS.output,
    PATTERNS.success,
    PATTERNS.verification,
    PATTERNS.routing,
    PATTERNS.deadline,
    PATTERNS.source,
    PATTERNS.safety,
    PATTERNS.scope,
    PATTERNS.approval
  ].some((pattern) => pattern.test(text));
}

function locateTargetSection(block, grouped) {
  return SECTION_ORDER.find((name) => grouped[name].some((candidate) => candidate.id === block.id)) ?? 'relevant_context';
}

function buildConstraintMap(blocks, grouped) {
  const material = uniqueByText(blocks.filter((block) => isMustPreserve(block.text)));
  return material.map((block, index) => ({
    id: `constraint_${index + 1}`,
    source_block_id: block.id,
    source_text: block.text,
    mapping: 'verbatim',
    target_section: locateTargetSection(block, grouped),
    target_text: block.text
  }));
}

function findEvidence(prompt, actionPattern) {
  const lines = normalizeNewlines(prompt).split('\n').map((line) => line.trim()).filter(Boolean);
  const matches = lines.filter((line) => PATTERNS.approval.test(line) && actionPattern.test(line));
  return matches.length === 1 ? matches[0] : null;
}

function buildAuthority(prompt) {
  const localEvidence = findEvidence(prompt, PATTERNS.localAction);
  const externalEvidence = findEvidence(prompt, PATTERNS.externalAction);
  const scopeEvidence = findEvidence(prompt, PATTERNS.scopeExpansion);

  const record = (evidence) => evidence
    ? { state: 'explicitly_authorized', evidence: { source_text: evidence, action_text: evidence } }
    : { state: 'not_established', evidence: null };

  return {
    local: record(localEvidence),
    external: record(externalEvidence),
    scope_expansion: record(scopeEvidence)
  };
}

function renderCompiledPrompt(sectionRecords) {
  return sectionRecords
    .filter((section) => section.included)
    .map((section) => `${section.label.toUpperCase()}\n${section.text}`)
    .join('\n\n');
}

function detectScopeDrift(prompt, sectionRecords) {
  const compiled = renderCompiledPrompt(sectionRecords);
  const issues = [];

  for (const word of ['persona', 'phase', 'tool', 'delegate', 'chain-of-thought', 'think harder']) {
    if (!prompt.toLowerCase().includes(word) && compiled.toLowerCase().includes(word)) {
      issues.push(`Compiler introduced unsupported concept: ${word}`);
    }
  }

  return issues;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (true) {
    const index = haystack.indexOf(needle, offset);
    if (index === -1) return count;
    count += 1;
    offset = index + needle.length;
  }
}

function validateAuthority(packet, errors) {
  for (const [kind, record] of Object.entries(packet.authority ?? {})) {
    if (!['allowed', 'explicitly_authorized'].includes(record.state)) continue;
    if (!record.evidence) {
      errors.push(`Authority ${kind} is ${record.state} without evidence.`);
      continue;
    }
    const { source_text: sourceText, action_text: actionText } = record.evidence;
    if (countOccurrences(packet.original_prompt, sourceText) !== 1) {
      errors.push(`Authority ${kind} source_text must occur exactly once in original_prompt.`);
    }
    if (countOccurrences(sourceText, actionText) !== 1) {
      errors.push(`Authority ${kind} action_text must occur exactly once inside source_text.`);
    }
  }
}

export function validatePacket(packet) {
  const errors = [];
  const warnings = [];

  if (!packet.original_prompt?.length) errors.push('Original prompt is empty.');
  if (packet.sections?.[0]?.name !== 'outcome') errors.push('Outcome must be the first canonical section.');
  if (!packet.sections?.find((section) => section.name === 'outcome' && section.included)) {
    errors.push('An included outcome section is required.');
  }

  const ids = new Set();
  const sourceMappings = new Set();
  for (const item of packet.constraint_map ?? []) {
    if (ids.has(item.id)) errors.push(`Duplicate constraint id: ${item.id}`);
    ids.add(item.id);
    if (sourceMappings.has(item.source_text)) errors.push(`Constraint mapped more than once: ${item.source_text}`);
    sourceMappings.add(item.source_text);
    if (!packet.original_prompt.includes(item.source_text)) {
      errors.push(`Constraint source text not found in original prompt: ${item.id}`);
    }
    if (!packet.compiled_prompt?.text.includes(item.target_text)) {
      errors.push(`Constraint target text missing from compiled prompt: ${item.id}`);
    }
  }

  const actualNames = packet.sections?.map((section) => section.name) ?? [];
  if (JSON.stringify(SECTION_ORDER) !== JSON.stringify(actualNames)) {
    errors.push('Canonical sections are missing or out of order.');
  }

  validateAuthority(packet, errors);

  if (packet.scope_drift?.length) warnings.push(...packet.scope_drift);
  if ((packet.constraint_map?.length ?? 0) === 0) {
    warnings.push('No explicit must-preserve constraints were detected. Review the source before relying on the brief.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function compilePrompt(sourcePrompt, options = {}) {
  const originalPrompt = String(sourcePrompt ?? '');
  const surface = ['codex', 'chatgpt', 'openai_api', 'other', 'unknown'].includes(options.surface)
    ? options.surface
    : 'unknown';
  const blocks = splitBlocks(originalPrompt);
  const grouped = buildSections(blocks);
  const sections = SECTION_ORDER.map((name) => makeSectionRecord(name, grouped[name]));
  const constraintMap = buildConstraintMap(blocks, grouped);
  const authority = buildAuthority(originalPrompt);
  const compiledText = renderCompiledPrompt(sections);
  const scopeDrift = detectScopeDrift(originalPrompt, sections);

  const packet = {
    schema_version: '1.0.0',
    status: 'draft',
    target_surface: surface,
    original_prompt: originalPrompt,
    sections,
    must_preserve_constraints: constraintMap.map((item) => item.id),
    constraint_map: constraintMap,
    authority,
    scope_drift: scopeDrift,
    assumptions: [],
    unresolved_decisions: [],
    compiled_prompt: { text: compiledText },
    validation: null
  };

  const validation = validatePacket(packet);
  packet.validation = validation;
  packet.status = validation.valid ? 'ready' : 'invalid';
  return packet;
}

export function createLedger(packet) {
  return {
    status: packet.status,
    target_surface: packet.target_surface,
    constraints: packet.constraint_map.map((item) => ({
      id: item.id,
      mapping: item.mapping,
      target_section: item.target_section,
      text: item.source_text
    })),
    assumptions: packet.assumptions,
    unresolved_decisions: packet.unresolved_decisions,
    scope_drift: packet.scope_drift,
    authority: packet.authority,
    validation: packet.validation
  };
}

export function sectionOrder() {
  return [...SECTION_ORDER];
}
