const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL = 'qwen2.5vl:3b';

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null;
  const role = typeof message.role === 'string' ? message.role : '';
  const content = typeof message.content === 'string' ? message.content : '';
  if (!role || !content) return null;
  return { role, content };
}

export async function askLocalQwen(messages, options = {}) {
  const url = options.url || DEFAULT_OLLAMA_URL;
  const model = options.model || DEFAULT_MODEL;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 120000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: (messages || []).map(normalizeMessage).filter(Boolean),
        stream: false,
        options: {
          temperature: 0.1,
          seed: Number.isFinite(options.seed) ? Math.trunc(options.seed) : 42
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    const content = data?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Ollama returned an empty response');
    return content.trim();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Qwen request timed out');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function stripCodeFence(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function appendMissingClosers(candidate) {
  const stack = [];
  let inString = false;
  let escaped = false;

  for (const char of candidate) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char);
      continue;
    }

    if (char === '}' || char === ']') {
      const expected = char === '}' ? '{' : '[';
      if (stack.at(-1) !== expected) return candidate;
      stack.pop();
    }
  }

  if (inString || stack.length === 0) return candidate;

  let repaired = candidate;
  while (stack.length) {
    repaired += stack.pop() === '{' ? '}' : ']';
  }
  return repaired;
}

function parseCandidate(candidate) {
  try {
    return JSON.parse(candidate);
  } catch (originalError) {
    const repaired = appendMissingClosers(candidate);
    if (repaired === candidate) throw originalError;
    return JSON.parse(repaired);
  }
}

export function parseQwenJson(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Qwen returned no JSON');

  const clean = stripCodeFence(text);
  const candidates = [clean];
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');

  if (start >= 0) {
    candidates.push(end > start ? clean.slice(start, end + 1) : clean.slice(start));
  }

  let lastError = null;
  for (const candidate of [...new Set(candidates)]) {
    try {
      return parseCandidate(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  if (start < 0) throw new Error('Qwen response did not contain a JSON object');
  throw lastError || new Error('Qwen response did not contain valid JSON');
}

export const LOCAL_QWEN_CONFIG = Object.freeze({
  url: DEFAULT_OLLAMA_URL,
  model: DEFAULT_MODEL
});
