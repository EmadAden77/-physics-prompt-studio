// 2017 Range Rover Sport Autobiography Dynamic (L494) — Canonical LHD Interior Lock
// Loaded after app.js. This layer replaces ambiguous seat inference with final-frame spatial anchors.

const L494_LHD_SPATIAL_LOCK = `LHD SPATIAL ANCHOR LOCK — 2017 RANGE ROVER SPORT AUTOBIOGRAPHY DYNAMIC (L494), SAUDI LHD:
- FINAL GENERATED IMAGE coordinates are authoritative. Do not reason from a mirrored phone preview.
- The subject occupies the physical FRONT-LEFT DRIVER SEAT. Never place the driver in the front-right passenger seat.
- The driver holds the selfie camera in his LEFT hand at normal arm reach. The phone, hand, wrist, forearm and elbow remain outside the crop.
- FORCED FRAME ORDER, LEFT TO RIGHT: driver-side door/window at image LEFT -> subject on driver axis -> small steering-rim segment in the LOWER-LEFT quadrant -> instrument cluster behind/above the steering axis -> center stack/console toward image RIGHT -> EMPTY front passenger seat on image RIGHT -> passenger-side door/window at far RIGHT if visible.
- The steering cue is mandatory, small and unmistakable. Keep the hub and most spokes cropped so it proves driver occupancy without becoming a large foreground object.
- Dashboard logic: driver instrument cluster on the driver/left axis; central infotainment and controls to its right; glovebox/passenger dashboard further right in front of the empty passenger seat.
- Driver-side mirror, if visible, remains attached to driver door/window geometry on image LEFT. Never duplicate or relocate mirrors.
- NO steering wheel on the right. NO RHD layout. NO horizontal mirror/flip. NO reversed cabin. NO duplicate steering wheel. NO center-mounted wheel. NO passenger-seat-as-driver substitution.
- Reproduce only cabin components actually visible from the selected selfie viewpoint: Ivory perforated Semi-Aniline leather, Ebony upper trim, dark Grand Black Veneer, restrained satin metal and physically correct panoramic roof.
- The steering wheel is the period-correct L494 multifunction sport wheel, never a newer two-spoke wheel.
- Materials respond independently: soft leather compression, dark directional veneer reflections, matte headliner, controlled satin-metal highlights and angle-correct glass reflections.
- If the left-to-right frame order is reversed, reject the result and rebuild the cabin from scratch.`;

function canonicalL494SeatTopology(seat){
  if(seat==='driver') return L494_LHD_SPATIAL_LOCK;
  if(seat==='passenger') return `CANONICAL SAUDI LHD PASSENGER TOPOLOGY: subject is in the physical FRONT-RIGHT PASSENGER SEAT. Center console is to the subject's left; passenger door/window is to the subject's right. The steering column, instrument cluster and pedals remain across the console in the physical front-left driver position. Never move the steering wheel in front of the passenger.`;
  if(seat==='rear-left') return `CANONICAL REAR-LEFT TOPOLOGY: subject is behind the physical front-left driver seat. The driver steering column remains at the vehicle front-left position and the front driver headrest/seat may occlude it naturally.`;
  return `CANONICAL REAR-RIGHT TOPOLOGY: subject is behind the physical front-right passenger seat. The steering column remains at the vehicle front-left position across the cabin.`;
}

// Replace app.js seat topology at runtime so Raw/JSON output cannot keep the old mirrored-preview allowance.
if(typeof seatTopology==='function'){
  seatTopology = canonicalL494SeatTopology;
}

if(typeof geometry==='function'){
  geometry = function(seat,angle){
    const common='True-to-life Xiaomi 15 Ultra FRONT-CAMERA selfie only. Final-image coordinates are authoritative; never mirror or horizontally flip the cabin. The phone is held at plausible arm reach and the phone-holding limb stays outside the crop.';
    const topology=canonicalL494SeatTopology(seat);
    if(seat==='driver'&&angle==='driver-low') return `${common} ${topology} Camera is in the driver's LEFT hand, 46–52 cm away, slightly below eye level, pitch +3–5°, roll 1–2°. Preserve the mandatory small lower-left steering-rim cue.`;
    if(seat==='driver'&&angle==='driver-side') return `${common} ${topology} Camera is in the driver's LEFT hand, 48–58 cm away, three-quarter yaw 15–24°, pitch −2–1°, roll 1–2°. Preserve the mandatory small lower-left steering-rim cue.`;
    if(seat==='driver'&&angle==='driver-roof') return `${common} ${topology} Camera is in the driver's LEFT hand, 46–54 cm away with modest upward framing. Preserve the mandatory small lower-left steering-rim cue while the panoramic roof enters the upper frame.`;
    if(seat==='driver') return `${common} ${topology} Camera is in the driver's LEFT hand, 48–55 cm away, near eye level, yaw 8–15°, pitch −2–0°, roll 1–2°. Preserve the mandatory small lower-left steering-rim cue.`;
    return `${common} ${topology}`;
  };
}

function l494InteriorEnabled(ctx = {}) {
  const captureType = ctx.captureType ?? document.getElementById('captureType')?.value;
  return captureType !== 'exterior';
}

// Add the canonical lock to the shared internal scene object.
const _buildExteriorAwareWithoutInteriorMasterLock = buildExteriorAware;
buildExteriorAware = function () {
  const prompt = _buildExteriorAwareWithoutInteriorMasterLock();
  if (l494InteriorEnabled()) {
    prompt.interior_master_lock = L494_LHD_SPATIAL_LOCK;
    if ((document.getElementById('seat')?.value || 'driver') === 'driver') {
      prompt.vehicle_physics = L494_LHD_SPATIAL_LOCK;
    }
  }
  return prompt;
};

// Inject the same lock into legacy text output paths. The Master Rules compiler loaded later remains authoritative.
const _chatgptPromptWithoutInteriorMasterLock = chatgptPrompt;
chatgptPrompt = function (prompt, ctx = {}) {
  let text = _chatgptPromptWithoutInteriorMasterLock(prompt, ctx);
  if (!l494InteriorEnabled(ctx)) return text;
  return `${L494_LHD_SPATIAL_LOCK}\n\n${text}`;
};

if (typeof render === 'function') render();
