import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compilePrompt, targetSurface } from '../core/prompt-optimizer.js';
import { generateImagePrompt } from '../core/prompt-generator.js';

const html = fs.readFileSync('index.html', 'utf8');

test('main interface exposes ChatGPT Images as the only product target', () => {
  assert.match(html, /CHATGPT IMAGES ONLY/i);
  assert.match(html, /id="surface"[^>]*value="chatgpt"/i);
  assert.doesNotMatch(html, /<option[^>]+value="codex"/i);
  assert.doesNotMatch(html, /<option[^>]+value="openai_api"/i);
  assert.doesNotMatch(html, /<option[^>]+value="other"/i);
  assert.doesNotMatch(html, />Codex</i);
  assert.doesNotMatch(html, />OpenAI API</i);
});

test('optimizer cannot be redirected away from ChatGPT', () => {
  assert.equal(targetSurface(), 'chatgpt');
  for (const requested of ['codex', 'openai_api', 'other', 'unknown', 'midjourney']) {
    const packet = compilePrompt('Generate a realistic smartphone image.', { surface: requested });
    assert.equal(packet.target_surface, 'chatgpt');
  }
});

test('generated image prompt stays natural-language and free of platform-specific flag syntax', () => {
  const result = generateImagePrompt({ sceneType: 'front_selfie' });
  assert.equal(result.validation.valid, true);
  assert.doesNotMatch(result.prompt, /--ar\b|--stylize\b|--v\b|<lora:|\bCFG\s*scale\b|\bsampler\s*:/i);
});
