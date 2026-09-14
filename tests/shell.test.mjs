import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');

test('prompt optimizer application files exist', () => {
  for (const file of ['index.html', 'app.js', 'styles.css', 'core/prompt-optimizer.js']) {
    assert.equal(exists(file), true, `missing ${file}`);
  }
});

test('interface exposes optimizer outputs', () => {
  const html = read('index.html');
  for (const token of ['Prompt Optimizer', 'Compiled Prompt', 'Ledger', 'JSON Packet', 'statusBadge']) {
    assert.equal(html.includes(token), true, `missing UI token: ${token}`);
  }
});

test('browser app imports the local optimizer engine', () => {
  const source = read('app.js');
  assert.equal(source.includes("./core/prompt-optimizer.js"), true);
  assert.equal(source.includes('compilePrompt'), true);
});
