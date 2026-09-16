import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');

test('prompt studio application files exist', () => {
  for (const file of ['index.html', 'app.js', 'styles.css', 'core/prompt-optimizer.js', 'core/prompt-generator.js', 'core/scene-builder.js']) {
    assert.equal(exists(file), true, `missing ${file}`);
  }
});

test('interface exposes automatic generation and optimizer modes for ChatGPT Images', () => {
  const html = read('index.html');
  for (const token of ['ChatGPT Image Prompt Generator', 'CHATGPT IMAGES ONLY', 'توليد تلقائي', 'تحسين Prompt', 'promptOutput', 'sceneType', 'sceneLighting', 'identityReference']) {
    assert.equal(html.includes(token), true, `missing UI token: ${token}`);
  }
});

test('browser app imports both generator and optimizer engines', () => {
  const source = read('app.js');
  assert.equal(source.includes("./core/prompt-optimizer.js"), true);
  assert.equal(source.includes("./core/prompt-generator.js"), true);
  assert.equal(source.includes('generateImagePrompt'), true);
  assert.equal(source.includes('compilePrompt'), true);
});

test('auto mode is the default mode', () => {
  const source = read('app.js');
  assert.equal(source.includes("let currentMode = 'auto'"), true);
  assert.equal(source.includes("setMode('auto')"), true);
});
