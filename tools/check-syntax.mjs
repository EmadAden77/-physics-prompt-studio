import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', '.vercel', 'coverage']);

function collectJavaScriptFiles(directory = '.') {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectJavaScriptFiles(file));
    else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(file);
  }
  return files;
}

const files = collectJavaScriptFiles().sort();
if (!files.length) throw new Error('No JavaScript modules found for syntax validation.');

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Syntax OK: ${files.length} JavaScript modules`);
