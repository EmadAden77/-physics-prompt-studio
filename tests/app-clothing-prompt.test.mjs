import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

test('clothing options keep catalog prompts and auto input resolves selected clothing by value', () => {
  assert.match(app, /option\.dataset\.prompt\s*=\s*item\.prompt\s*\|\|\s*''/);
  assert.match(app, /CLOTHING_PROMPT_BY_VALUE\s*=\s*new Map\([\s\S]*CATALOGS\.generalClothing[\s\S]*CATALOGS\.bedroomClothing/);
  assert.match(app, /selectedPrompt\(controls\.clothing,\s*CLOTHING_PROMPT_BY_VALUE\)/);
  assert.match(app, /clothing:\s*enrichClothingPrompt\(selectedClothingPrompt\(\)\)/);
});

test('general and bedroom clothing are separate derived catalog views', () => {
  assert.match(app, /generalClothing:\s*GENERAL_CLOTHING_OPTIONS/);
  assert.match(app, /bedroomClothing:\s*HOME_CLOTHING/);
  assert.match(app, /HOME_SCENE_TYPES\.includes\(sceneType\)\s*\?\s*CATALOGS\.bedroomClothing\s*:\s*CATALOGS\.generalClothing/);
  assert.doesNotMatch(app, /CLOTHING_UI_OPTIONS/);
  assert.doesNotMatch(app, /clothingForScene\(sceneType,\s*CATALOGS/);
});

test('clothing select is catalog-driven rather than duplicated as static HTML options', () => {
  const match = html.match(/<select id="sceneClothing">([\s\S]*?)<\/select>/);
  assert.ok(match, 'missing sceneClothing select');
  const values = [...match[1].matchAll(/<option\s+value="([^"]*)"/g)].map((entry) => entry[1]);
  assert.deepEqual(values, ['']);
});

test('clothing UI group order is base, formal suits, then formal looks', async () => {
  const { CLOTHING_OPTIONS } = await import('../core/scene-builder.js');
  const baseGroups = [...new Set(CLOTHING_OPTIONS.map((item) => item.group))];
  assert.deepEqual([...baseGroups, 'بدلات رسمية كاملة', 'أطقم كاملة (قميص + بنطال)'], [
    'ثياب وتراث سعودي',
    'كاجوال',
    'بدلات رسمية كاملة',
    'أطقم كاملة (قميص + بنطال)'
  ]);
});
