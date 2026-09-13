import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const textExtensions = new Set(['.js', '.mjs', '.html', '.css', '.md', '.json', '.yml', '.yaml']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root).filter((file) => textExtensions.has(path.extname(file)));
assert.ok(files.length > 0, 'repository should contain text source files');

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /^(<<<<<<<|=======|>>>>>>>)/m, `unresolved Git conflict marker in ${path.relative(root, file)}`);
}

const indexPath = path.join(root, 'index.html');
const appPath = path.join(root, 'app.js');
const index = fs.readFileSync(indexPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'index.html must not contain duplicate IDs');

const requiredIds = [
  'preset', 'applyPreset', 'resetAll', 'promptForm', 'idea', 'referenceImage', 'uploadZone', 'fileStatus',
  'referenceRole', 'captureType', 'time', 'locationSearch', 'location', 'customLocationWrap', 'customLocation',
  'vehicleScene', 'people', 'ratio', 'age', 'pose', 'customPoseWrap', 'customPose', 'expression', 'hair',
  'customHairWrap', 'customHair', 'beard', 'customBeardWrap', 'customBeard', 'glasses', 'customGlassesWrap',
  'customGlasses', 'clothingSearch', 'clothing', 'customClothingWrap', 'customClothing', 'angle',
  'customAngleWrap', 'customAngle', 'framing', 'customFramingWrap', 'customFraming', 'focalLength', 'distance',
  'yaw', 'pitch', 'roll', 'lightSource', 'customLightSourceWrap', 'customLightSource', 'lightDirection',
  'lightFalloff', 'exposure', 'hdr', 'whiteBalance', 'realismModules', 'notes', 'warnings', 'output',
  'warningCount', 'checklist', 'copy'
];

for (const id of requiredIds) {
  assert.ok(ids.includes(id), `required DOM id is missing: ${id}`);
}

assert.doesNotMatch(app, /ensureVehicleControl/, 'vehicle control should be declared in static HTML, not injected dynamically');
assert.match(index, /id="vehicleScene"/, 'vehicle selector must be present in index.html');
assert.match(app, /referenceRole:\s*'none'/, 'optional reference should default to none');

const moduleFiles = files.filter((file) => ['.js', '.mjs'].includes(path.extname(file)));
for (const file of moduleFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const specifier = match[1];
    const resolved = path.resolve(path.dirname(file), specifier);
    assert.ok(fs.existsSync(resolved), `broken relative import in ${path.relative(root, file)}: ${specifier}`);
  }
}

const scriptMatch = index.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
assert.ok(scriptMatch, 'index.html must load the application script');
assert.ok(fs.existsSync(path.join(root, scriptMatch[1])), `missing script referenced by index.html: ${scriptMatch[1]}`);

const stylesheetMatches = [...index.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)];
for (const match of stylesheetMatches) {
  if (/^https?:\/\//.test(match[1])) continue;
  assert.ok(fs.existsSync(path.join(root, match[1])), `missing stylesheet referenced by index.html: ${match[1]}`);
}

console.log('static-integrity: ok');
