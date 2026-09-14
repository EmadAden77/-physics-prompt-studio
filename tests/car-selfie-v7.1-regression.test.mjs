import test from 'node:test';
import assert from 'node:assert/strict';
import { INSIDE_DEFAULT_STATE } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE } from '../data/carSelfieOutsideCatalog.js';
import { normalizeCarState } from '../core/carSelfieValidation.js';
import {
  compileCarSelfieDetailed,
  compileCarSelfieNegative,
  compileCarSelfieTechnicalSpec
} from '../core/carSelfieCompiler.js';
import { NEGATIVE_LIST } from '../core/carSelfieNarrativeCompiler.js';

const inside = (patch = {}) => normalizeCarState({ ...structuredClone(INSIDE_DEFAULT_STATE), ...patch, mode: 'inside' });
const outside = (patch = {}) => normalizeCarState({ ...structuredClone(OUTSIDE_DEFAULT_STATE), ...patch, mode: 'outside' });

test('legacy technical output retains V7.1 driver-seat LHD visual anchor', () => {
  const out = compileCarSelfieTechnicalSpec(inside({ seat: 'driver-left' }));
  assert.match(out, /LHD VISUAL ANCHOR \(mandatory, non-negotiable\)/);
  assert.match(out, /driver-side window\/door with exterior view MUST appear on the RIGHT side of the frame/i);
  assert.match(out, /center console, passenger area, and interior structure MUST appear on the LEFT side of the frame/i);
  assert.match(out, /steering wheel rim or the top of the instrument cluster MUST be partially visible at the bottom-left/i);
  assert.match(out, /image is WRONG and must be regenerated/i);
});

test('legacy technical output retains hard acceptance criteria', () => {
  for (const state of [inside(), outside()]) {
    const out = compileCarSelfieTechnicalSpec(state);
    assert.match(out, /HARD ACCEPTANCE CRITERIA \(image FAILS if any is violated\)/);
    assert.match(out, /visible pores, fine vellus hair/i);
    assert.match(out, /2-4 physically plausible stray hairs/i);
    assert.match(out, /No brand text, logo, or readable signage/i);
  }
});

test('V9 negative prompt is the unified compact list', () => {
  assert.equal(compileCarSelfieNegative(inside()), NEGATIVE_LIST);
  assert.equal(compileCarSelfieNegative(outside()), NEGATIVE_LIST);
  for (const token of [
    'no CGI',
    'no plastic skin',
    'no brand logos',
    'no readable text',
    'no mirrored cabin',
    'no window on the wrong side',
    'no missing steering wheel hint',
    'no floating objects',
    'no impossibly symmetric face',
    'no perfectly centered composition',
    'no perfectly level camera'
  ]) assert.ok(NEGATIVE_LIST.toLowerCase().includes(token.toLowerCase()), `missing V9 negative rule: ${token}`);
});

test('legacy Saudi street visual signature remains available for technical comparison', () => {
  const open = compileCarSelfieTechnicalSpec(inside({ place: 'desert-road', windowState: 'driver-cracked' }));
  assert.match(open, /SAUDI STREET VISUAL SIGNATURE \(visible through window\)/);
  assert.match(open, /oil stains, aggregate grain, and faded white line remnants/i);
  assert.match(open, /date palm trunk silhouettes or ghaf\/sidr foliage/i);
  assert.match(open, /visible fixture housing on a pole/i);

  const closed = compileCarSelfieTechnicalSpec(inside({ place: 'desert-road', windowState: 'closed' }));
  assert.doesNotMatch(closed, /SAUDI STREET VISUAL SIGNATURE/);
});

test('legacy moderate clutter retains the strict two-item visibility budget', () => {
  const out = compileCarSelfieTechnicalSpec(inside({ clutterLevel: 'moderate' }));
  assert.match(out, /CLUTTER VISIBILITY BUDGET/);
  assert.match(out, /At most 2 clutter items may be clearly visible/i);
  assert.match(out, /remaining clutter items exist in the cabin but must be out of frame or in deep background/i);
});

test('legacy active modes remain semantically isolated', () => {
  const inOut = compileCarSelfieTechnicalSpec(inside());
  assert.doesNotMatch(inOut, /STANDING POSE:|PAINT & BODY PHYSICS:/);

  const outOut = compileCarSelfieTechnicalSpec(outside());
  assert.doesNotMatch(outOut, /VEHICLE & SEATING:|INTERIOR CLUTTER:|LHD VISUAL ANCHOR/);
});

test('V9 narrative and legacy outputs are both deterministic', () => {
  const state = inside({ place: 'desert-road', windowState: 'driver-cracked', clutterLevel: 'moderate' });
  assert.equal(compileCarSelfieDetailed(state), compileCarSelfieDetailed(state));
  assert.equal(compileCarSelfieTechnicalSpec(state), compileCarSelfieTechnicalSpec(state));
  assert.equal(compileCarSelfieNegative(state), compileCarSelfieNegative(state));
});
