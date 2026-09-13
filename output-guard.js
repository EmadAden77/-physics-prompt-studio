// High-priority visual guard: keeps visible constraints ahead of descriptive detail.
function hardOutputGuard(prompt,ctx={}){
  const get=id=>ctx[id]??document.getElementById(id)?.value;
  const interior=get('captureType')!=='exterior';
  const visibleElements=(prompt.background?.elements||[]).join('; ');
  return `HARD OUTPUT LOCK — VERIFY BEFORE ALL DESCRIPTIVE DETAIL:
1. CAPTURE: genuine subject-held Xiaomi 15 Ultra front-camera selfie, never a third-person portrait.
2. FRAMING: ${interior?'head through upper torso only. Do not show waist, belt, lap, thighs or knees':'use only the selected exterior selfie framing at physically reachable arm distance'}.
3. SELFIE ARM: phone, holding hand, wrist, forearm and elbow remain outside the crop. Never show a long diagonal arm along the frame edge.
4. EXPRESSION: ${prompt.subject.expression}. This is a hard facial-state lock; do not replace it with a direct-to-camera smile.
5. HAIR: ${prompt.subject.hair} Do not add curl, height, volume or density beyond the identity reference.
6. ${interior&&get('seat')==='driver'?"DRIVER-SEAT PROOF: Saudi LHD vehicle. Subject must occupy the physical front-left seat on the steering-column and pedal axis. Driver door beside his anatomical LEFT shoulder; center console beside his RIGHT thigh; empty passenger seat beyond the console. Show a small, unmistakable steering-rim segment directly ahead of his torso at the bottom edge, but crop the hub and spokes. Never infer the seat from viewer-left/viewer-right and never place him in the front-right passenger seat":interior?'PASSENGER/REAR SEAT PROOF: preserve the selected seat using door, console, headrest and steering-column topology; never relocate the steering column':'VEHICLE: keep the parked vehicle secondary to the face and preserve correct ground contact'}.
7. LIGHT: use one coherent afternoon/day/night source direction visible in both exterior and face shading. No unexplained frontal fill; cabin shade must remain darker than sunlit exterior surfaces.
8. TEXT AND BRANDING: all distant signs, fuel-station branding, plates, pump labels and storefront text must be soft and unreadable. Do not generate a clear Aramco or other company logo.
9. VISIBLE SCENE EVIDENCE: ${visibleElements||'only contextually necessary objects'}. Keep background secondary and depth-appropriate.
10. MATERIAL: honor the selected garment fabric. Cotton poplin must look tightly woven, smooth-matte and lightly creased, never loose slubby linen.
11. OCCUPANCY QA: before finalizing, trace one physical chain: subject pelvis → driver-seat cushion → steering column ahead → pedals below; subject LEFT shoulder → driver door; subject RIGHT thigh → center console → empty passenger seat. If this chain fails, reject and rebuild the cabin.
12. SAUDI PLACE QA: reject sterile showroom streets and generic Gulf scenery. Asphalt, curbs, pavement, access, drainage, dust, repairs, parking, traffic and people must match the selected Saudi place and time. Use restrained disorder with a physical or social cause; never add random trash, exaggerated decay or decorative chaos.

If any later instruction competes with this lock, this lock wins.`;
}

const _chatgptPromptWithoutOutputGuard=chatgptPrompt;
chatgptPrompt=function(prompt,ctx={}){return `${hardOutputGuard(prompt,ctx)}\n\n${_chatgptPromptWithoutOutputGuard(prompt,ctx)}`};

const _buildExteriorAwareWithoutOutputGuard=buildExteriorAware;
buildExteriorAware=function(){const prompt=_buildExteriorAwareWithoutOutputGuard();prompt.hard_output_guard=hardOutputGuard(prompt);return prompt};

if(typeof render==='function')render();
