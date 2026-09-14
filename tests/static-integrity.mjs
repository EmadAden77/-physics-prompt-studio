import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const required = [
  'index.html','app.js','styles.css','car-selfie.html','car-selfie.js','car-selfie.css',
  'data/catalog.js','data/presets.js','data/carSelfieCatalog.js','core/state.js','core/geometry.js',
  'core/validation.js','core/compiler.js','core/carSelfieValidation.js','core/carSelfieCompiler.js'
];
for (const file of required) assert.ok(exists(file), `missing ${file}`);

const mainFiles = ['app.js','data/catalog.js','data/presets.js','core/state.js','core/validation.js','core/compiler.js'];
const forbidden = [/vehicleScene/,/rrs-2017/,/Range Rover/,/L494/,/steering wheel/i,/dashboard glow/i,/المشهد داخل السيارة/,/داخل رنج روفر/];
for (const file of mainFiles) for (const pattern of forbidden) assert.ok(!pattern.test(read(file)), `${file} leaked car instruction: ${pattern}`);

const index = read('index.html');
const carPage = read('car-selfie.html');
const app = read('app.js');
const carApp = read('car-selfie.js');
assert.match(index, /href="car-selfie\.html"/);
assert.match(index, /src="app\.js"/);
assert.ok(!index.includes('src="car-selfie.js"'));
assert.match(carPage, /src="car-selfie\.js"/);
assert.ok(!carPage.includes('src="app.js"'));
assert.ok(!app.includes('carSelfieCatalog') && !app.includes('carSelfieCompiler'));
assert.ok(carApp.includes('carSelfieCatalog') && carApp.includes('carSelfieCompiler'));

for (const id of ['place','weather','cameraLens','colorProfile','lowLightProcessing','hairProfile','windowState','clutterLevel','externalLight','cabinEmitter','focalLength','aperture']) {
  assert.match(carPage, new RegExp(`id="${id}"`), `car-selfie.html missing ${id}`);
  assert.ok(carApp.includes(id), `car-selfie.js does not wire ${id}`);
}
assert.match(carPage, /XIAOMI 15 ULTRA LOCK/);
assert.match(carPage, /الفوضى داخل السيارة/);
assert.match(carPage, /الأماكن/);

const carCatalog = read('data/carSelfieCatalog.js');
assert.match(carCatalog, /focalLengthEqMm: 23/);
assert.match(carCatalog, /focalLengthEqMm: 70/);
assert.ok(!/focalLengthEqMm:\s*75/.test(carCatalog), 'invented 75mm optic leaked into catalog');
assert.match(carCatalog, /Leica Authentic/);
assert.match(carCatalog, /HAIR|densityLock|hairline/i);

for (const file of ['data/catalog.js','data/presets.js','data/carSelfieCatalog.js','core/state.js','core/geometry.js','core/validation.js','core/compiler.js','core/carSelfieValidation.js','core/carSelfieCompiler.js']) {
  const text = read(file);
  assert.ok(!text.includes('Math.random'), `${file} contains randomness`);
  assert.ok(!text.includes('Date.now'), `${file} contains time nondeterminism`);
}

console.log('Static integrity OK: isolated pages, deterministic domains, Xiaomi/places/clutter fields wired, no car logic leaked into main core.');
