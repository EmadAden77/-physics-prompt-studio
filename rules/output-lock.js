(function(M){
  const uniqueLines=text=>{const seen=new Set();return String(text).split('\n').filter(line=>{const key=line.trim().toLowerCase();if(!key)return true;if(seen.has(key))return false;seen.add(key);return true}).join('\n').replace(/\n{3,}/g,'\n\n').trim()};
  M.cleanPrompt=function(text,state){let clean=uniqueLines(text);if(state.capture==='interior')clean=clean.replace(/EXTERIOR SELFIE MAP:[\s\S]*?(?=\n\n|$)/g,'');return uniqueLines(clean)};
  M.visibleClothing=function(description,state){
    if(state.capture!=='interior')return description;
    const upper=String(description)
      .replace(/\s+(?:with|and)\s+(?:tailored\s+)?(?:deep\s+|dark\s+|light\s+)?(?:black|beige|navy|charcoal|grey|gray|brown)?\s*(?:cotton\s+)?(?:chino\s+trousers|chinos|trousers|pants|jeans)[^;,.]*/gi,'')
      .replace(/;?\s*[^.;]*(?:belt|waist|lap compression)[^.;]*/gi,'')
      .replace(/\s{2,}/g,' ').replace(/\s+([,;.])/g,'$1').trim();
    return `${upper} Only the upper garment is visible; do not reveal or infer trousers, belt, waist or lap.`;
  };
  M.output=function(state){
    const audit=M.evaluate(state),must=[...new Set(audit.active.flatMap(r=>r.enforce||[]))],avoid=[...new Set(audit.active.flatMap(r=>r.avoid||[]))];
    const report=audit.conflicts.length?audit.conflicts.map(c=>`- ${c.id}: corrected; ${c.winner} won; ${c.fix}`).join('\n'):'- No unresolved rule conflicts.';
    return `MASTER RULES ENGINE V4 — AUTHORITATIVE OUTPUT LOCK\n\nMUST:\n${must.map(x=>`- ${x}`).join('\n')}\n\nAVOID:\n${avoid.map(x=>`- ${x}`).join('\n')}\n\nCONFLICT RESOLUTION:\n${report}\n\nCONFIDENCE AUDIT:\n${audit.results.filter(x=>x.status!=='not-applicable').map(x=>`- ${x.rule}: ${x.status}; confidence ${x.confidence}; ${x.reason}`).join('\n')}\n\nVISIBLE-ONLY FINAL GATE:\nInclude only details that can physically enter the selected camera frame or causally affect visible light, contact, reflection, motion or context. Lower-priority aesthetic detail never overrides a critical or physical rule.`;
  };
  M.compile=function(prompt,state){
    const night=state.time==='night';
    const times={morning:'MORNING ONLY: low directional morning sun and broad sky fill',noon:'NOON ONLY: high sun, short grounded shadows and bright exposed pavement',afternoon:'AFTERNOON ONLY: lower lateral sun and longer shadows',day:'DAYTIME ONLY: one plausible daytime sun direction and sky fill',night:'NIGHT ONLY: absolutely no sun, daylight, blue daytime sky, sunbeams or sunlit surfaces'};
    const places={street:'an ordinary functioning Saudi commercial street',mall:'a Saudi shopping-complex parking area',villa:'a Saudi residential villa entrance',garage:'a private Saudi villa garage',quiet:'a quiet Saudi residential street','gas-station':'a functioning Saudi fuel-station forecourt',cafeteria:'a modest Saudi roadside cafeteria',restaurant:'a Saudi restaurant parking area',supermarket:'a Saudi supermarket parking area',mosque:'a Saudi neighborhood mosque approach',corniche:'a Saudi waterfront corniche','desert-road':'a Saudi desert road','rest-area':'a Saudi roadside rest area',hospital:'a Saudi hospital drop-off area','airport-road':'a Saudi airport road',office:'a Saudi office-building parking area'};
    const seat={
      driver:'Physical FRONT-LEFT DRIVER SEAT in a Saudi LHD vehicle. The subject is on the driver axis, not the passenger axis. The steering column and instrument cluster remain ahead of the driver; the center console leads toward the empty passenger seat on the RIGHT side of the final image.',
      passenger:'Physical FRONT-RIGHT PASSENGER SEAT; center console at anatomical LEFT and passenger door at anatomical RIGHT; steering column remains across the console on vehicle left.',
      'rear-left':'Physical rear-left seat behind the driver, with correct front-seat occlusion.',
      'rear-right':'Physical rear-right seat behind the passenger, with correct front-seat occlusion.'
    };
    const nightSources={street:'street lamps and open-shop practicals',mall:'parking poles and entrance fixtures',villa:'wall-mounted villa and gate fixtures',garage:'the selected garage fixture and limited exterior spill',quiet:'sparse residential wall and street fixtures','gas-station':'canopy fixtures, pump lights and convenience-store practicals',cafeteria:'service-window and storefront fixtures',restaurant:'storefront, entrance and parking fixtures',supermarket:'entrance, storefront and parking fixtures',mosque:'architectural and approach fixtures appropriate to prayer-time activity',corniche:'promenade and roadway fixtures','desert-road':'vehicle lamps and sparse road infrastructure only','rest-area':'service-building and parking fixtures',hospital:'entrance, drop-off and parking fixtures','airport-road':'roadway and vehicle lighting only',office:'entrance, facade and parking fixtures'};
    const light=night?`Illumination comes only from visible ${nightSources[state.place]||nightSources.street}. Each source has localized color, reach, shadow direction, occlusion and falloff. The cabin is dimmer than the exterior; phone exposure may reveal noisy existing signal but cannot create fill light.`:'Window transmission, cabin occlusion and surface orientation determine the selected daytime light; exposure cannot invent illumination.';
    const spatial=state.capture==='interior'&&state.seat==='driver'&&M.LHDSpatialAnchorSystem
      ?M.LHDSpatialAnchorSystem.driverSelfie('detailed')
      :'';
    const vehicle=state.capture==='interior'
      ?`Parked 2017 Range Rover Sport Autobiography Dynamic L494, authentic restrained Ebony/Ivory cabin. ${seat[state.seat]||seat.driver} Include only frame-visible evidence: Ivory perforated leather, dark veneer/door trim, matte headliner and panoramic roof according to the selected angle.`
      :'Beside a parked Fuji White 2017 Range Rover Sport Autobiography Dynamic L494. Show only the physically visible driver-side bodywork, true tire contact, grounded shadow and angle-correct reflections.';
    const framing=state.capture==='interior'?'Close head-and-upper-torso framing only; crop before waist, belt, lap and thighs. The phone-holding hand, wrist, forearm and elbow stay fully outside frame.':'Physically reachable arm-length exterior selfie framing; the person remains primary and the full vehicle is not forced into view.';
    const place=places[state.place]||places.street;
    const cameraSolutions={'driver-close':'phone distance 48–55 cm, near eye level, yaw 8–15°, pitch −2–0°, roll 1–2°','driver-low':'phone distance 46–52 cm, only slightly below eye level, pitch +3–5°, roll 1–2°','driver-side':'phone distance 48–58 cm, three-quarter yaw 15–24°, pitch −2–1°, roll 1–2°','driver-roof':'phone distance 46–54 cm, modest upward framing without widening below the upper torso','passenger-close':'phone distance 48–56 cm at eye level from the physical passenger position','rear-seat':'phone distance 45–55 cm at eye level with correct front-seat occlusion'};
    const cameraGeometry=cameraSolutions[state.angle]||cameraSolutions['driver-close'];
    const clothing=M.visibleClothing(prompt.subject.clothing,state);
    const extra=prompt.additional_instruction&&prompt.additional_instruction!=='None.'?prompt.additional_instruction:'None';
    const reference=prompt.reference_image||'Attach one image as the only identity reference.';
    const strictNegatives=state.capture==='interior'&&state.seat==='driver'&&M.LHDSpatialAnchorSystem
      ?M.LHDSpatialAnchorSystem.negatives.map(x=>`- ${x}`).join('\n')
      :'- Do not violate the selected physical seat topology.';
    return `GENERATE ONE PHOTOREALISTIC IMAGE — ALL CONSTRAINTS BELOW ARE MANDATORY

CRITICAL LOCKS:
- ${times[state.time]||times.day}.
- Expression must remain exactly: ${prompt.subject.expression} Do not substitute a broad smile; if the expression says closed mouth or no teeth, ZERO teeth may be visible.
- ${framing}
- Genuine subject-held Xiaomi 15 Ultra FRONT-CAMERA selfie, never a third-person photograph.

${spatial?`LHD SPATIAL ANCHOR SYSTEM — HIGHEST PRIORITY:\n${spatial}\n\n`:''}REFERENCE AND IDENTITY:
${reference}
Use it as IDENTITY REFERENCE ONLY. Preserve facial structure, head shape, apparent age, natural asymmetry, skin tone, eyes, brows, nose, lips, jaw, chin, ears, hairline, visible hair density, beard density and beard gaps. Do not copy its clothing, pose, background or lighting. No beautification, de-aging, face slimming, eye enlargement, skin smoothing or invented facial detail.

SCENE AND VEHICLE:
A ${state.age||35}-year-old man takes a spontaneous selfie. ${vehicle}
The vehicle is parked and not moving.

APPEARANCE:
Hair: ${prompt.subject.hair}
Clothing: ${clothing} Fabric folds come only from gravity, posture, contact and material stiffness.
Eyewear: ${prompt.subject.eyewear} Use exactly one eyewear state; never duplicate glasses or place them simultaneously on the eyes and head.

CAMERA AND COMPOSITION:
Xiaomi 15 Ultra front camera, approximately 21mm-equivalent, ${cameraGeometry}, ${prompt.photography.aspect_ratio}. ${String(prompt.photography.angle).replace(/[.\s]+$/,'')}. Keep the face primary and crop before the waist. For a driver selfie, the small lower-left steering-rim cue is mandatory and must remain subordinate to the face. No fisheye distortion, oversized nose, stretched jaw, portrait-mode cutout, DSLR bokeh, studio polish or oversized foreground steering wheel.

PHYSICAL LIGHTING — ${state.time.toUpperCase()}:
${light}
Do not mix time states. ${night?'Reject and regenerate any result containing daylight, direct sunlight, a daytime sky or sunlit pavement.':'Reject any night-only lighting cues that contradict the selected daytime.'}

SAUDI ENVIRONMENT:
Through only physically available windows or exterior framing, show ${place}. Asphalt/concrete, curbs, drainage, access, tire contact, dust and restrained wear must match the place. People and vehicles perform purposeful time-appropriate actions with correct scale, spacing, occlusion and shadows. No cloned crowd, repeated cars, decorative trash, exaggerated decay or sterile showroom perfection. All branding, plates, pump labels and storefront text stay distant, soft and unreadable; do not render a legible Aramco logo.

STRICT LHD NEGATIVES:
${strictNegatives}

SENSOR AND MATERIAL REALISM:
One camera pipeline governs face, hair, clothing, leather, glass and background. ${night?'Use plausible low-light luminance/chroma noise, modest shadow-detail loss, restrained denoising and imperfect white balance.':'Use restrained phone processing and natural highlight rolloff.'} Materials retain distinct roughness and reflections. No HDR-created light, cinematic fill, fake rim light, waxy skin, CGI gloss or uniform sharpness.

USER-SPECIFIED DETAIL:
${extra}

FINAL REJECTION GATE:
Reject and rebuild if any of these occur: wrong time of day; visible teeth contrary to the chosen expression; waist or belt visible in an interior close selfie; steering wheel absent from a driver selfie; steering wheel on the right; empty passenger seat not on the right; horizontal mirror/flip; RHD topology; subject placed in front-right passenger seat; duplicated steering wheel; dashboard axis inconsistent with the driver; visible selfie arm; legible brand/logo; invented light; duplicated glasses; malformed hands; floating objects; inconsistent shadows or reflections.`;
  };
})(window.MasterRules);
