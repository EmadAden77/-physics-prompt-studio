import test from 'node:test';
import assert from 'node:assert/strict';
import { INSIDE_DEFAULT_STATE } from '../data/carSelfieInsideCatalog.js';
import { OUTSIDE_DEFAULT_STATE } from '../data/carSelfieOutsideCatalog.js';
import { normalizeCarState } from '../core/carSelfieValidation.js';
import { compileCarSelfieDetailed, compileCarSelfieNegative } from '../core/carSelfieCompiler.js';

const inside = (patch = {}) => normalizeCarState({ ...structuredClone(INSIDE_DEFAULT_STATE), ...patch, mode: 'inside' });
const outside = (patch = {}) => normalizeCarState({ ...structuredClone(OUTSIDE_DEFAULT_STATE), ...patch, mode: 'outside' });

test('driver-seat inside output always carries final-image LHD visual anchor', () => {
  const out = compileCarSelfieDetailed(inside({ seat: 'driver-left' }));
  assert.match(out, /LHD VISUAL ANCHOR \(mandatory, non-negotiable\)/);
  assert.match(out, /driver-side window\/door with exterior view MUST appear on the RIGHT side of the frame/i);
  assert.match(out, /center console, passenger area, and interior structure MUST appear on the LEFT side of the frame/i);
  assert.match(out, /steering wheel rim or the top of the instrument cluster MUST be partially visible at the bottom-left/i);
  assert.match(out, /image is WRONG and must be regenerated/i);
});

test('hard acceptance criteria are present in both active modes', () => {
  for (const state of [inside(), outside()]) {
    const out = compileCarSelfieDetailed(state);
    assert.match(out, /HARD ACCEPTANCE CRITERIA \(image FAILS if any is violated\)/);
    assert.match(out, /visible pores, fine vellus hair/i);
    assert.match(out, /2-4 physically plausible stray hairs/i);
    assert.match(out, /Camera tilt must be 1-3 degrees off-perfect-level/i);
    assert.match(out, /No brand text, logo, or readable signage/i);
    assert.match(out, /subject not dead-center/i);
  }
});

test('inside negative prompt contains new LHD and anti-AI rejection rules', () => {
  const neg = compileCarSelfieNegative(inside());
  for (const token of [
    'no passenger-seat selfie when driver seat is specified',
    'no window on the left side of frame in driver-seat selfie',
    'no mirrored LHD cabin',
    'no missing steering wheel hint in driver seat context',
    'no passenger-side seat positioning',
    'no brand logos',
    'no readable text on any object',
    'no perfectly centered composition',
    'no perfectly level camera',
    'no airbrushed skin',
    'no helmet-like glossy hair',
    'no perfectly symmetric face'
  ]) assert.ok(neg.toLowerCase().includes(token.toLowerCase()), `missing negative rule: ${token}`);
});

test('Saudi street visual signature appears only when an exterior side window is open', () => {
  const open = compileCarSelfieDetailed(inside({ place: 'desert-road', windowState: 'driver-cracked' }));
  assert.match(open, /SAUDI STREET VISUAL SIGNATURE \(visible through window\)/);
  assert.match(open, /oil stains, aggregate grain, and faded white line remnants/i);
  assert.match(open, /date palm trunk silhouettes or ghaf\/sidr foliage/i);
  assert.match(open, /visible fixture housing on a pole/i);
  assert.match(open, /low-rise Saudi urban structures or open desert edge/i);

  const closed = compileCarSelfieDetailed(inside({ place: 'desert-road', windowState: 'closed' }));
  assert.doesNotMatch(closed, /SAUDI STREET VISUAL SIGNATURE/);
});

test('moderate clutter carries a strict two-item visibility budget', () => {
  const out = compileCarSelfieDetailed(inside({ clutterLevel: 'moderate' }));
  assert.match(out, /CLUTTER VISIBILITY BUDGET/);
  assert.match(out, /At most 2 clutter items may be clearly visible/i);
  assert.match(out, /remaining clutter items exist in the cabin but must be out of frame or in deep background/i);
  assert.match(out, /No clutter item may be a branded product with visible logo or text/i);
});

test('active modes remain semantically isolated after V7.1 constraints', () => {
  const inOut = compileCarSelfieDetailed(inside());
  assert.doesNotMatch(inOut, /STANDING POSE:|PAINT & BODY PHYSICS:/);

  const outOut = compileCarSelfieDetailed(outside());
  assert.doesNotMatch(outOut, /VEHICLE & SEATING:|INTERIOR CLUTTER:|LHD VISUAL ANCHOR/);
});

test('V7.1 output remains deterministic', () => {
  const state = inside({ place: 'desert-road', windowState: 'driver-cracked', clutterLevel: 'moderate' });
  assert.equal(compileCarSelfieDetailed(state), compileCarSelfieDetailed(state));
  assert.equal(compileCarSelfieNegative(state), compileCarSelfieNegative(state));
});
