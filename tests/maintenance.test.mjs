import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', '.vercel', 'coverage']);

function projectFiles(directory = ROOT) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...projectFiles(full));
    else files.push(full);
  }
  return files;
}

function projectPath(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

test('all local HTML assets and navigation targets resolve to real files', () => {
  for (const relativeHtml of ['index.html', 'car-selfie.html']) {
    const htmlFile = path.join(ROOT, relativeHtml);
    const html = fs.readFileSync(htmlFile, 'utf8');
    const references = [...html.matchAll(/\b(?:src|href)=["']([^"'#?]+)["']/gi)].map((match) => match[1]);
    assert.ok(references.length > 0, `${relativeHtml} has no local references to validate`);
    for (const reference of references) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) continue;
      const resolved = path.resolve(path.dirname(htmlFile), reference);
      assert.ok(fs.existsSync(resolved), `${relativeHtml} references missing local file ${reference}`);
    }
  }
});

test('all relative production ESM imports resolve to real files', () => {
  const productionModules = projectFiles().filter((file) => file.endsWith('.js') && !projectPath(file).startsWith('tests/'));
  assert.ok(productionModules.length > 0);
  for (const file of productionModules) {
    const source = fs.readFileSync(file, 'utf8');
    const importPattern = /\bfrom\s*["'](\.[^"']+)["']|\bimport\s*["'](\.[^"']+)["']/g;
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1] || match[2];
      const resolved = path.resolve(path.dirname(file), specifier);
      assert.ok(fs.existsSync(resolved), `${projectPath(file)} imports missing module ${specifier}`);
    }
  }
});

test('repository ignores transient local and deployment artifacts', () => {
  const ignored = new Set(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/).filter(Boolean));
  for (const required of ['node_modules/', '.vercel/', 'coverage/', '*.log', '.DS_Store', 'Thumbs.db']) {
    assert.ok(ignored.has(required), `.gitignore missing ${required}`);
  }
});

test('Vercel applies the baseline safe response headers to every route', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rule = config.headers?.find((item) => item.source === '/(.*)');
  assert.ok(rule, 'vercel.json is missing the global header rule');
  const headers = Object.fromEntries(rule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['referrer-policy'], 'no-referrer');
  assert.equal(headers['permissions-policy'], 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
});
