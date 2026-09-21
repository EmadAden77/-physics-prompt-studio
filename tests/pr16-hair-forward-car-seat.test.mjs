import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImagePrompt } from '../core/prompt-generator.js';

function section(prompt, name, nextName) {
  return prompt.split(`[${name}]\n`)[1].split(`\n\n[${nextName}]\n`)[0];
}

test('PR 16 forward hair lock requires visible droop and forehead coverage', () => {
  const result=generateImagePrompt({ hairStyle:'hair combed FORWARD onto the forehead with visible individual strands.' });
  const identity=section(result.prompt,'IDENTITY / SUBJECT','SCENE');
  assert.match(identity,/ONLY the front section changes direction so strands fall forward onto the upper forehead/i);
  assert.match(identity,/hairline must be at least partially covered/i);
});

test('PR 16 forward hair negatives contain the explicit REQUIRED reinforcement', () => {
  const result=generateImagePrompt({ hairStyle:'hair combed FORWARD onto the forehead with visible individual strands.' });
  const negatives=section(result.prompt,'NEGATIVE CONSTRAINTS','FINAL VERIFICATION');
  assert.match(negatives,/REQUIRED: forward-falling front strands visibly resting on the upper forehead/i);
});

test('PR 16 identity hair lock lets selected direction override reference direction without EXACTLY', () => {
  const result=generateImagePrompt({ hairStyle:'hair combed FORWARD onto the forehead with visible individual strands.' });
  const identity=section(result.prompt,'IDENTITY / SUBJECT','SCENE');
  assert.match(identity,/DIRECTION and strand flow must follow the selected hairstyle direction and override the reference's default direction/i);
  assert.doesNotMatch(identity,/Hair length, density[^.]*EXACTLY/i);
});

test('PR 16 passenger selfie locks subject to the right front passenger seat in Saudi LHD geometry', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_passenger_selfie', poseValue:'passenger_seat' });
  const pose=section(result.prompt,'POSE & BODY MECHANICS','CAMERA GEOMETRY');
  assert.match(pose,/SUBJECT POSITION LOCK/i);
  assert.match(pose,/front passenger seat on the RIGHT side.*left-hand-drive Saudi-spec vehicle/i);
  assert.match(pose,/There is no steering wheel in front of the subject/i);
  assert.match(pose,/center console is to the subject's left.*driver seat is farther to the subject's left/i);
});

test('PR 16 driver selfie locks subject to the left driver seat in Saudi LHD geometry', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_driver_selfie', poseValue:'driver_seat' });
  const pose=section(result.prompt,'POSE & BODY MECHANICS','CAMERA GEOMETRY');
  assert.match(pose,/SUBJECT POSITION LOCK/i);
  assert.match(pose,/driver seat on the LEFT side.*left-hand-drive Saudi-spec vehicle/i);
  assert.match(pose,/steering wheel is directly in front of the subject/i);
  assert.match(pose,/center console is to the subject's right/i);
});

test('PR 16 forward hair and both car-seat scenes preserve the canonical 23-section invariant', () => {
  const cases=[
    { hairStyle:'hair combed FORWARD onto the forehead with visible individual strands.' },
    { sceneType:'inside_car_passenger_selfie', poseValue:'passenger_seat' },
    { sceneType:'inside_car_driver_selfie', poseValue:'driver_seat' }
  ];
  for(const input of cases){
    const result=generateImagePrompt(input);
    assert.equal(result.sections.length,23,JSON.stringify(input));
    assert.equal(result.validation.valid,true,`${JSON.stringify(input)}: ${result.validation.errors.join(' | ')}`);
  }
});

test('PR 16 base inside-car selfie defaults to the RIGHT front passenger seat when poseValue is empty', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_selfie', poseValue:'' });
  const pose=section(result.prompt,'POSE & BODY MECHANICS','CAMERA GEOMETRY');
  assert.match(pose,/SUBJECT POSITION LOCK/i);
  assert.match(pose,/front passenger seat on the RIGHT side/i);
  assert.match(pose,/There is no steering wheel in front of the subject/i);
});

test('PR 16 base inside-car selfie keeps an explicit passenger pose on the RIGHT', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_selfie', poseValue:'passenger_seat', pose:'passenger_seat' });
  const pose=section(result.prompt,'POSE & BODY MECHANICS','CAMERA GEOMETRY');
  assert.match(pose,/SUBJECT POSITION LOCK/i);
  assert.match(pose,/front passenger seat on the RIGHT side/i);
  assert.match(pose,/center console is to the subject's left/i);
});

test('PR 16 base inside-car selfie keeps an explicit driver pose on the LEFT', () => {
  const result=generateImagePrompt({ sceneType:'inside_car_selfie', poseValue:'driver_seat', pose:'driver_seat' });
  const pose=section(result.prompt,'POSE & BODY MECHANICS','CAMERA GEOMETRY');
  assert.match(pose,/SUBJECT POSITION LOCK/i);
  assert.match(pose,/driver seat on the LEFT side/i);
  assert.match(pose,/center console is to the subject's right/i);
});

test('PR 16 base inside-car camera geometry is subject-held by default and driver-held only for driver_seat', () => {
  const passenger=generateImagePrompt({ sceneType:'inside_car_selfie', poseValue:'', angle:'driver_eye_level' });
  const driver=generateImagePrompt({ sceneType:'inside_car_selfie', poseValue:'driver_seat', pose:'driver_seat', angle:'driver_eye_level' });
  const passengerCamera=section(passenger.prompt,'CAMERA GEOMETRY','PHYSICAL LIGHTING');
  const driverCamera=section(driver.prompt,'CAMERA GEOMETRY','PHYSICAL LIGHTING');
  assert.match(passengerCamera,/subject-held front-camera selfie/i);
  assert.doesNotMatch(passengerCamera,/driver-held/i);
  assert.doesNotMatch(passengerCamera,/steering-wheel perspective/i);
  assert.match(driverCamera,/driver-held front-camera selfie/i);
});
