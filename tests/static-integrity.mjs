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
const unfinishedPattern = new RegExp(`\\b(?:${['TO' + 'DO', 'FIX' + 'ME', 'HA' + 'CK'].join('|')})\\b`);
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /^(<<<<<<<|=======|>>>>>>>)/m, `unresolved Git conflict marker in ${path.relative(root, file)}`);
  assert.doesNotMatch(source, unfinishedPattern, `unfinished marker in ${path.relative(root, file)}`);
}

assert.equal(fs.existsSync(path.join(root, 'data/extensions.js')), false, 'extensions.js must stay removed: catalog.js is the single source of truth');

for (const relative of ['core/compiler.js','core/state.js','core/geometry.js','core/validation.js','data/catalog.js','data/presets.js']) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  assert.doesNotMatch(source, /Math\.random|Date\.now|new Date\s*\(|crypto\.random|setInterval|setTimeout/, `non-deterministic API in ${relative}`);
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'index.html must not contain duplicate IDs');
assert.doesNotMatch(index, /fonts\.googleapis|fonts\.gstatic|<script[^>]+https?:\/\//, 'runtime UI must not depend on external font/script assets');
assert.doesNotMatch(index, /id="angle"|id="customAngle"/, 'textual camera angle controls must remain removed');
assert.match(index, /id="yaw"/);
assert.match(index, /id="pitch"/);
assert.match(index, /id="roll"/);
assert.match(app, /physics-prompt-studio-v4/, 'state storage must use the deterministic schema version');

const requiredIds = [
  'preset','applyPreset','resetAll','promptForm','idea','referenceImage','uploadZone','fileStatus','referenceRole',
  'captureType','time','locationSearch','location','customLocationWrap','customLocation','vehicleScene','people','ratio',
  'age','pose','customPoseWrap','customPose','expression','hair','customHairWrap','customHair','beard','customBeardWrap',
  'customBeard','glasses','customGlassesWrap','customGlasses','clothingSearch','clothing','customClothingWrap','customClothing',
  'framing','focalLength','distance','yaw','pitch','roll','lightSource','customLightSourceWrap','customLightSource',
  'lightDirection','lightFalloff','exposure','hdr','whiteBalance','realismModules','notes','warnings','liveState','output',
  'warningCount','checklist','copy'
];
for (const id of requiredIds) assert.ok(ids.includes(id), `required DOM id is missing: ${id}`);

for (const file of files.filter((file) => ['.js','.mjs'].includes(path.extname(file)))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const resolved = path.resolve(path.dirname(file), match[1]);
    assert.ok(fs.existsSync(resolved), `broken relative import in ${path.relative(root, file)}: ${match[1]}`);
  }
}

console.log('static-integrity: ok');
