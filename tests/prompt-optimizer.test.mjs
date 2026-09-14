import test from 'node:test';
import assert from 'node:assert/strict';
import { compilePrompt, createLedger, sectionOrder, validatePacket } from '../core/prompt-optimizer.js';

test('preserves the original prompt byte-for-byte', () => {
  const source = 'Build the app.\n\nDo not change the public API.\nReturn JSON.';
  const packet = compilePrompt(source, { surface: 'codex' });
  assert.equal(packet.original_prompt, source);
});

test('creates all seven canonical section records in order', () => {
  const packet = compilePrompt('Build a calculator. Return JSON. Do not add dependencies. Verify the result.');
  assert.deepEqual(packet.sections.map((section) => section.name), sectionOrder());
});

test('maps detected must-preserve constraints exactly once', () => {
  const source = 'Build a calculator.\nDo not add dependencies.\nUse only browser APIs.';
  const packet = compilePrompt(source);
  assert.equal(packet.constraint_map.length, 2);
  assert.equal(new Set(packet.constraint_map.map((item) => item.source_text)).size, 2);
  for (const item of packet.constraint_map) {
    assert.ok(source.includes(item.source_text));
    assert.ok(packet.compiled_prompt.text.includes(item.target_text));
  }
});

test('treats deliverables and acceptance instructions as must-preserve', () => {
  const source = 'Build a calculator.\nReturn JSON only.\nVerify all tests pass before final output.';
  const packet = compilePrompt(source);
  assert.equal(packet.constraint_map.some((item) => item.source_text === 'Return JSON only.'), true);
  assert.equal(packet.constraint_map.some((item) => item.source_text.includes('Verify all tests pass')), true);
});

test('does not invent any authorization', () => {
  const packet = compilePrompt('Summarize this text locally.');
  assert.equal(packet.authority.local.state, 'not_established');
  assert.equal(packet.authority.external.state, 'not_established');
  assert.equal(packet.authority.scope_expansion.state, 'not_established');
});

test('records explicit external authorization only with source evidence', () => {
  const source = 'You are authorized to publish the generated report.';
  const packet = compilePrompt(source);
  assert.equal(packet.authority.external.state, 'explicitly_authorized');
  assert.equal(packet.authority.external.evidence.source_text, source);
  assert.equal(packet.authority.external.evidence.action_text, source);
});

test('valid packet reaches ready state', () => {
  const packet = compilePrompt('Create a short summary. Do not add facts. Return Markdown.');
  assert.equal(packet.status, 'ready');
  assert.equal(validatePacket(packet).valid, true);
  assert.equal(createLedger(packet).status, 'ready');
});

test('empty prompt is invalid', () => {
  const packet = compilePrompt('');
  assert.equal(packet.status, 'invalid');
  assert.equal(packet.validation.valid, false);
});
