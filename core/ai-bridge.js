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
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 45000;
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
        format: 'json',
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

export function parseQwenJson(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Qwen returned no JSON');
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('Qwen response did not contain a JSON object');
    return JSON.parse(text.slice(start, end + 1));
  }
}

export const LOCAL_QWEN_CONFIG = Object.freeze({
  url: DEFAULT_OLLAMA_URL,
  model: DEFAULT_MODEL
});
