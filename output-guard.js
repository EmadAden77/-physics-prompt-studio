// High-priority visual guard: visible constraints win before descriptive detail.
function hardOutputGuard(prompt,ctx={}){
  const get=id=>ctx[id]??document.getElementById(id)?.value;
  const interior=get('captureType')!=='exterior';
  const driver=interior&&get('seat')==='driver';
  const selectedTime=get('time');
  const lightLock=selectedTime==='night'
    ?'NIGHT ONLY: no sun, daylight, blue daytime sky or sunlit surfaces anywhere. Use only visible station, street, storefront and vehicle practical lights with localized reach, occlusion and falloff; the cabin remains darker and noisier than the lit exterior.'
    :`${String(selectedTime||'day').toUpperCase()} ONLY: derive one coherent sun direction and sky fill from this selected time; do not mix it with night lighting.`;
  const visibleElements=(prompt.background?.elements||[]).join('; ');
  const driverSpatial=`FINAL-IMAGE LHD MAP: driver-side door/window at image LEFT -> subject in physical front-left driver seat -> small unmistakable steering-rim segment in LOWER-LEFT -> instrument cluster on the same driver axis -> center stack/console toward image RIGHT -> EMPTY front passenger seat on image RIGHT -> passenger-side door/window at far RIGHT if visible. The selfie camera is held in the driver's LEFT hand at normal arm reach; phone and holding limb remain outside crop. NO steering wheel on the right, NO RHD, NO horizontal mirror/flip, NO reversed cabin, NO duplicate wheel, NO passenger-seat-as-driver substitution.`;
  return `HARD OUTPUT LOCK — VERIFY BEFORE ALL DESCRIPTIVE DETAIL:
1. CAPTURE: genuine subject-held Xiaomi 15 Ultra front-camera selfie, never a third-person portrait.
2. FRAMING: ${interior?'head through upper torso only. Do not show waist, belt, lap, thighs or knees':'use only the selected exterior selfie framing at physically reachable arm distance'}.
3. SELFIE ARM: phone, holding hand, wrist, forearm and elbow remain outside the crop. Never show a long diagonal arm along the frame edge.
4. EXPRESSION: ${prompt.subject.expression}. This is a hard facial-state lock; do not replace it with a direct-to-camera smile.
5. HAIR: ${prompt.subject.hair} Do not add curl, height, volume or density beyond the identity reference.
6. ${driver?driverSpatial:interior?'PASSENGER/REAR SEAT PROOF: preserve the selected seat using door, console, headrest and steering-column topology; never relocate the steering column':'VEHICLE: keep the parked vehicle secondary to the face and preserve correct ground contact'}
7. LIGHT: ${lightLock}
8. TEXT AND BRANDING: all distant signs, fuel-station branding, plates, pump labels and storefront text must be soft and unreadable. Do not generate a clear Aramco or other company logo.
9. VISIBLE SCENE EVIDENCE: ${visibleElements||'only contextually necessary objects'}. Keep background secondary and depth-appropriate.
10. MATERIAL: honor the selected garment fabric. Cotton poplin must look tightly woven, smooth-matte and lightly creased, never loose slubby linen.
11. OCCUPANCY QA: ${driver?'trace final-image LEFT -> driver door/window -> subject/front-left driver axis -> lower-left steering cue -> center console -> empty passenger seat RIGHT. If the order reverses or the wheel appears on the right, reject and rebuild':'validate the selected physical seat against door, console, headrest and steering-column topology'}.
12. SAUDI PLACE QA: reject sterile showroom streets and generic Gulf scenery. Asphalt, curbs, pavement, access, drainage, dust, repairs, parking, traffic and people must match the selected Saudi place and time. Use restrained disorder with a physical or social cause; never add random trash, exaggerated decay or decorative chaos.

If any later instruction competes with this lock, this lock wins.`;
}

const _chatgptPromptWithoutOutputGuard=chatgptPrompt;
chatgptPrompt=function(prompt,ctx={}){return `${hardOutputGuard(prompt,ctx)}\n\n${_chatgptPromptWithoutOutputGuard(prompt,ctx)}`};

const _buildExteriorAwareWithoutOutputGuard=buildExteriorAware;
buildExteriorAware=function(){
  const prompt=_buildExteriorAwareWithoutOutputGuard();
  const seat=document.getElementById('seat')?.value;
  const capture=document.getElementById('captureType')?.value;
  if(capture!=='exterior'&&seat==='driver'&&typeof L494_LHD_SPATIAL_LOCK!=='undefined'){
    prompt.vehicle_physics=L494_LHD_SPATIAL_LOCK;
    if(prompt.subject) prompt.subject.mirror_rules='NO horizontal mirroring or flipping. Final-image LHD spatial anchors are authoritative.';
  }
  prompt.hard_output_guard=hardOutputGuard(prompt);
  return prompt;
};

if(typeof render==='function')render();
