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

test('clothing UI exposes the required unified catalog groups', async () => {
  const { CLOTHING_CATALOG } = await import('../core/scene-builder.js');
  const groups = [...new Set(CLOTHING_CATALOG.map((item) => item.group))];
  const requiredGroups = [
    'ثياب وتراث سعودي',
    'كاجوال',
    'بدلات رسمية كاملة',
    'أبيض وكحلي',
    'أزرق',
    'كحلي',
    'فحمي',
    'أسود',
    'بيج وكريمي',
    'زيتي',
    'ملون وبياقة',
    'كتان صيفي',
    'متعدد'
  ];
  for (const group of requiredGroups) {
    assert.ok(groups.includes(group), `Missing group: ${group}`);
  }
});

test('clothing UI exposes 209 items in general scenes', async () => {
  const { randomizationOptionsForScene } = await import('../app.js');
  const options = randomizationOptionsForScene('front_selfie');
  assert.equal(options.clothing.length, 209);
});


test('PR 14 clothing styling UI is category-driven rather than statically duplicated', async () => {
  const { clothingStylingOptionsForValue } = await import('../app.js');
  const shirt=clothingStylingOptionsForValue('look-01');
  const thobe=clothingStylingOptionsForValue('white_thobe');
  assert.equal(shirt.length,10);
  assert.equal(thobe.length,6);
  assert.equal(shirt.some((item)=>item.value==='french-tuck'),true);
  assert.equal(thobe.some((item)=>item.value==='sleeves-rolled'),true);
  const match=html.match(/<select id="clothingStyling">([\s\S]*?)<\/select>/);
  assert.ok(match);
  assert.deepEqual([...match[1].matchAll(/<option\s+value="([^"]*)"/g)].map((entry)=>entry[1]),['']);
});

test('PR 14 unsupported headwear-only styling reports no applicable options', async () => {
  const { clothingStylingOptionsForValue } = await import('../app.js');
  assert.deepEqual(clothingStylingOptionsForValue('red_shemagh_agal'),[]);
});
