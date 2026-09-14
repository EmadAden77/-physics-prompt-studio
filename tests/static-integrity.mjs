import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const required = [
  'index.html','app.js','styles.css','car-selfie.html','car-selfie.js','car-selfie.css',
  'data/catalog.js','data/presets.js','data/carSelfieCommonCatalog.js','data/carSelfieInsideCatalog.js','data/carSelfieOutsideCatalog.js',
  'core/state.js','core/geometry.js','core/validation.js','core/compiler.js','core/carSelfieValidation.js',
  'core/carSelfieInsideValidation.js','core/carSelfieOutsideValidation.js','core/carSelfieCompiler.js','core/carSelfieInsideCompiler.js','core/carSelfieOutsideCompiler.js',
  'core/carSelfieEngineeringSpec.js','core/carSelfieMinimalPrompt.js','core/carSelfieAcceptance.js'
];
for (const file of required) assert.ok(exists(file), `missing ${file}`);
assert.equal(exists('data/carSelfieCatalog.js'), false, 'legacy mixed carSelfieCatalog.js must be deleted');

const mainFiles = ['app.js','data/catalog.js','data/presets.js','core/state.js','core/validation.js','core/compiler.js'];
const forbiddenMain = [/vehicleScene/,/rrs-2017/,/Range Rover/,/L494/,/steering wheel/i,/dashboard glow/i,/المشهد داخل السيارة/,/داخل رنج روفر/];
for (const file of mainFiles) for (const pattern of forbiddenMain) assert.ok(!pattern.test(read(file)), `${file} leaked car instruction: ${pattern}`);

const index = read('index.html');
const carPage = read('car-selfie.html');
const carApp = read('car-selfie.js');
const insideCatalog = read('data/carSelfieInsideCatalog.js');
const outsideCatalog = read('data/carSelfieOutsideCatalog.js');
const insideCompiler = read('core/carSelfieInsideCompiler.js');
const outsideCompiler = read('core/carSelfieOutsideCompiler.js');
const minimalPrompt = read('core/carSelfieMinimalPrompt.js');
const engineeringSpec = read('core/carSelfieEngineeringSpec.js');
const acceptance = read('core/carSelfieAcceptance.js');

assert.match(index, /href="car-selfie\.html"/);
assert.match(carPage, /data-mode-select="inside"/);
assert.match(carPage, /data-mode-select="outside"/);
assert.match(carPage, /data-mode-only="inside"/);
assert.match(carPage, /data-mode-only="outside"/);
assert.match(carPage, /geometryPreview/);
assert.match(carPage, /data-step="1"/);
assert.match(carPage, /data-step="6"/);
assert.match(carPage, /فيزياء نسيج الملابس/);
assert.match(carPage, /فيزياء الشعر/);
assert.match(carPage, /الفوضى داخل السيارة/);
assert.match(carPage, /id="promptMode"/);
assert.match(carPage, /data-view="compact"/);
assert.match(carPage, /data-view="detailed"/);
assert.match(carPage, /data-view="engineering"/);
assert.match(carPage, /data-view="acceptance"/);
assert.match(carPage, /قائمة التحقق البصري/);
assert.match(carPage, /id="acceptanceChecklist"/);
assert.match(carPage, /id="acceptanceReportButton"/);
assert.ok(!carPage.includes('src="app.js"'));
assert.match(carPage, /src="car-selfie\.js"/);

assert.match(carApp, /carSelfieEngineeringSpec/);
assert.match(carApp, /carSelfieMinimalPrompt/);
assert.match(carApp, /carSelfieAcceptance/);
assert.ok(!carApp.includes('option.disabled'));
assert.ok(!carApp.includes('option.hidden'));
assert.match(carApp, /detectCarModeFromIntent/);
assert.match(carApp, /initialRequest.*addEventListener\('input'/s);

assert.match(minimalPrompt, /250-word budget/);
assert.match(minimalPrompt, /VISUAL ANCHOR:/);
assert.match(minimalPrompt, /driver's door window with exterior street view appears on the RIGHT half of the frame/);
assert.match(engineeringSpec, /camera_position/);
assert.match(engineeringSpec, /steering_wheel_visibility/);
assert.match(engineeringSpec, /window_view/);
assert.match(engineeringSpec, /subject_seat_anchors/);
assert.match(engineeringSpec, /model_delivery:\s*false/);
assert.match(acceptance, /نافذة السائق/);
assert.match(acceptance, /حافة المقود/);
assert.match(acceptance, /تقرير|ACCEPT|REJECT/);

assert.ok(!insideCatalog.includes('standingPose'), 'inside catalog leaked outside standing pose');
assert.ok(!insideCatalog.includes('paintCondition'), 'inside catalog leaked exterior paint field');
assert.ok(!outsideCatalog.includes('clutterLevel'), 'outside catalog leaked cabin clutter');
assert.ok(!outsideCatalog.includes('cabinEmitter'), 'outside catalog leaked cabin emitter');
assert.ok(!outsideCatalog.includes("seat:"), 'outside catalog leaked seat state');
assert.ok(!insideCompiler.includes('compileOutside'));
assert.ok(!outsideCompiler.includes('compileInside'));
assert.ok(!insideCompiler.includes('PAINT & BODY PHYSICS'));
assert.ok(!outsideCompiler.includes('INTERIOR CLUTTER'));

const commonCatalog = read('data/carSelfieCommonCatalog.js');
assert.match(commonCatalog, /focalLengthEqMm:\s*21/);
assert.match(commonCatalog, /focalLengthEqMm:\s*23/);
assert.match(commonCatalog, /focalLengthEqMm:\s*70/);
assert.ok(!/focalLengthEqMm:\s*75/.test(commonCatalog), 'invented 75mm optic leaked into common catalog');
assert.match(commonCatalog, /Leica Authentic/);
assert.match(commonCatalog, /densityLock:\s*true/);

const deterministicFiles = [
  'data/catalog.js','data/presets.js','data/carSelfieCommonCatalog.js','data/carSelfieInsideCatalog.js','data/carSelfieOutsideCatalog.js',
  'core/state.js','core/geometry.js','core/validation.js','core/compiler.js','core/carSelfieValidation.js',
  'core/carSelfieInsideValidation.js','core/carSelfieOutsideValidation.js','core/carSelfieCompiler.js','core/carSelfieInsideCompiler.js','core/carSelfieOutsideCompiler.js',
  'core/carSelfieEngineeringSpec.js','core/carSelfieMinimalPrompt.js','core/carSelfieAcceptance.js'
];
for (const file of deterministicFiles) {
  const text = read(file);
  assert.ok(!text.includes('Math.random'), `${file} contains randomness`);
  assert.ok(!text.includes('Date.now'), `${file} contains time nondeterminism`);
  assert.ok(!/TODO|FIXME/.test(text), `${file} contains unfinished TODO/FIXME`);
}

console.log('Static integrity OK: V8 three-layer car architecture isolated, deterministic, and model-facing prompt separated from engineering/acceptance layers.');
