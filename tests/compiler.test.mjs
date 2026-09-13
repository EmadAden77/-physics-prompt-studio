import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, REALISM_MODULES } from '../data/catalog.js';
import { compileDetailed, compileConcise, compileNegative, compileJson } from '../core/compiler.js';

const state = (patch = {}) => ({ ...DEFAULT_STATE, ...patch, modules: { ...DEFAULT_STATE.modules, ...(patch.modules || {}) } });

test('same state always produces byte-identical outputs', () => {
  const sample = state({ idea: 'a calm portrait in a generic Saudi setting' });
  for (const compiler of [compileDetailed, compileConcise, compileNegative, compileJson]) {
    assert.equal(compiler(sample), compiler(sample));
  }
});

test('detailed output makes numeric geometry authoritative', () => {
  const output = compileDetailed(state());
  assert.match(output, /24mm equivalent focal length/);
  assert.match(output, /distance 50cm/);
  assert.match(output, /yaw 0°; pitch 0°; roll 2°/);
  assert.match(output, /Numeric geometry is authoritative/);
});

test('JSON output carries explicit units and approximate field coverage', () => {
  const json = JSON.parse(compileJson(state()));
  assert.deepEqual(json.capture.focal_length, { value: 24, unit: 'mm equivalent' });
  assert.deepEqual(json.capture.optical_distance, { value: 50, unit: 'cm' });
  assert.equal(json.status.blocked, false);
  assert.ok(json.capture.approximate_field_coverage.height.value > 0);
});

test('strict mode blocks prompt generation on physical error', () => {
  const strictModules = Object.fromEntries(REALISM_MODULES.map(({ id }) => [id, id === 'lighting' ? 'strict' : 'auto']));
  const sample = state({ time: 'night', lightSource: 'daylight', lightDirection: 'side', lightFalloff: 'distant-uniform', modules: strictModules });
  assert.match(compileDetailed(sample), /^OUTPUT BLOCKED BY STRICT REALISM/);
  assert.match(compileConcise(sample), /^OUTPUT BLOCKED BY STRICT REALISM/);
  assert.match(compileNegative(sample), /^OUTPUT BLOCKED BY STRICT REALISM/);
  assert.equal(JSON.parse(compileJson(sample)).status.blocked, true);
});

test('auto mode keeps Conflict Checker advisory', () => {
  const sample = state({ time: 'night', lightSource: 'daylight', lightDirection: 'side', lightFalloff: 'distant-uniform' });
  assert.doesNotMatch(compileDetailed(sample), /^OUTPUT BLOCKED/);
});

test('vehicle prompt remains period-specific and stationary', () => {
  const sample = state({ vehicleScene: 'rrs-2017-white-interior', location: 'public-parking', pose: 'natural-seated', lightSource: 'parking-lights', lightDirection: 'mixed', lightFalloff: 'mixed-local' });
  const output = compileDetailed(sample);
  assert.match(output, /2017 Range Rover Sport L494/);
  assert.match(output, /Ivory perforated leather seats/);
  assert.match(output, /parked and stationary/);
  assert.match(compileNegative(sample), /newer Range Rover interior/);
});

test('realism modules are emitted in catalog order, never object insertion order', () => {
  const reversed = Object.fromEntries([...REALISM_MODULES].reverse().map(({ id }) => [id, 'auto']));
  const output = compileDetailed(state({ modules: reversed }));
  assert.ok(output.indexOf('Keep human anatomy') < output.indexOf('Keep physical light sources'));
});

test('public compilers validate input shape', () => {
  assert.throws(() => compileDetailed(null), TypeError);
  assert.throws(() => compileJson([]), TypeError);
});
