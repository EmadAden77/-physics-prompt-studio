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
  externalAction: /(send|publish|post|deploy|merge|push|delete|remove|email|message|purchase|book|create account|invite|share|نشر|أرسل|ارسل|ادمج|ادفع|احذف|أنشئ حساب|احجز|شارك|ادعُ)/i,
  scopeExpansion: /(and anything else|as needed|whatever else|use your judgment to add|expand scope|أي شيء آخر|ما تراه مناسباً|ما تراه مناسبًا|وسع النطاق|أضف ما يلزم)/i,
  approval: /(you may|authorized|approved|permission|go ahead|ابدأ|مصرح|مخوّل|مخول|موافق|لك الصلاحية|نفّذ)/i
};

function normalizeNewlines(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n');
}

function compactWhitespace(value) {
  return value.replace(/[ \t]+/g, ' ').trim();
}

function splitBlocks(prompt) {
  const normalized = normalizeNewlines(prompt);
  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .flatMap((paragraph) => {
      const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.length <= 1) return [paragraph.trim()].filter(Boolean);
      return lines;
    })
    .map(compactWhitespace)
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
  if (PATTERNS.constraint.test(text)) return 'must_preserve_constraints';
  if (PATTERNS.context.test(text)) return 'relevant_context';
  if (index === 0 || sentenceWeight(text) >= 5) return 'outcome';
  return 'relevant_context';
}

function chooseOutcome(blocks) {
  if (!blocks.length) return null;
  const ranked = [...blocks].sort((a, b) => sentenceWeight(b.text) - sentenceWeight(a.text));
  return ranked[0];
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

  const text = blocks.map((b) => b.text).join('\n');
  return { name, label: LABELS[name], included: true, reason: null, text };
}

function buildConstraintMap(grouped) {
  return grouped.must_preserve_constraints.map((block, index) => ({
    id: `constraint_${index + 1}`,
    source_block_id: block.id,
    source_text: block.text,
    mapping: 'verbatim',
    target_section: 'must_preserve_constraints',
    target_text: block.text
  }));
}

function findEvidence(prompt, regex) {
  const normalized = normalizeNewlines(prompt);
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  const matches = lines.filter((line) => regex.test(line));
  return matches.length === 1 ? matches[0] : null;
}

function buildAuthority(prompt) {
  const externalEvidence = findEvidence(prompt, new RegExp(`(?=.*${PATTERNS.externalAction.source})(?=.*${PATTERNS.approval.source}).+`, 'i'));
  const scopeEvidence = findEvidence(prompt, new RegExp(`(?=.*${PATTERNS.scopeExpansion.source})(?=.*${PATTERNS.approval.source}).+`, 'i'));

  return {
    local: {
      state: 'allowed',
      evidence: {
        source_text: prompt,
        action_text: 'Compile the supplied prompt locally without executing it.'
      }
    },
    external: externalEvidence
      ? {
          state: 'explicitly_authorized',
          evidence: { source_text: externalEvidence, action_text: externalEvidence }
        }
      : { state: 'not_established', evidence: null },
    scope_expansion: scopeEvidence
      ? {
          state: 'explicitly_authorized',
          evidence: { source_text: scopeEvidence, action_text: scopeEvidence }
        }
      : { state: 'not_established', evidence: null }
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

export function validatePacket(packet) {
  const errors = [];
  const warnings = [];

  if (!packet.original_prompt?.length) errors.push('Original prompt is empty.');
  if (packet.sections?.[0]?.name !== 'outcome') errors.push('Outcome must be the first canonical section.');
  if (!packet.sections?.find((section) => section.name === 'outcome' && section.included)) {
    errors.push('An included outcome section is required.');
  }

  const ids = new Set();
  for (const item of packet.constraint_map ?? []) {
    if (ids.has(item.id)) errors.push(`Duplicate constraint id: ${item.id}`);
    ids.add(item.id);
    if (!packet.original_prompt.includes(item.source_text)) {
      errors.push(`Constraint source text not found in original prompt: ${item.id}`);
    }
    if (!packet.compiled_prompt?.text.includes(item.target_text)) {
      errors.push(`Constraint target text missing from compiled prompt: ${item.id}`);
    }
  }

  const requiredNames = SECTION_ORDER;
  const actualNames = packet.sections?.map((section) => section.name) ?? [];
  if (JSON.stringify(requiredNames) !== JSON.stringify(actualNames)) {
    errors.push('Canonical sections are missing or out of order.');
  }

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
  const constraintMap = buildConstraintMap(grouped);
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
