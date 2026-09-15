import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

test('clothing options keep catalog prompts and auto input resolves selected clothing by value', () => {
  assert.match(app, /option\.dataset\.prompt\s*=\s*item\.prompt\s*\|\|\s*''/);
  assert.match(app, /CLOTHING_PROMPT_BY_VALUE\s*=\s*new Map\(CATALOGS\.clothing/);
  assert.match(app, /selectedPrompt\(controls\.clothing,\s*CLOTHING_PROMPT_BY_VALUE\)/);
  assert.match(app, /clothing:\s*enrichClothingPrompt\(selectedClothingPrompt\(\)\)/);
});

test('clothing select is catalog-driven rather than duplicated as static HTML options', () => {
  const match = html.match(/<select id="sceneClothing">([\s\S]*?)<\/select>/);
  assert.ok(match, 'missing sceneClothing select');
  const values = [...match[1].matchAll(/<option\s+value="([^"]*)"/g)].map((entry) => entry[1]);
  assert.deepEqual(values, ['']);
});
