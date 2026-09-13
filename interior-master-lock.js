// 2017 Range Rover Sport Autobiography Dynamic (L494) — Interior Master Lock
// Loaded after app.js so the existing generator stays modular and easy to roll back.

const L494_INTERIOR_MASTER_LOCK = `VISIBLE CABIN LOCK — 2017 RANGE ROVER SPORT AUTOBIOGRAPHY DYNAMIC (L494), LHD:
- Reproduce only cabin components actually visible from the selected selfie viewpoint; do not force hidden equipment into frame.
- Maintain one authentic 2017 L494 cabin: Ivory perforated Semi-Aniline leather seats, Ebony upper trim, dark Grand Black Veneer, restrained satin metal and a physically correct panoramic roof.
- The steering wheel is the period-correct L494 multifunction sport wheel, never a newer two-spoke wheel. It must remain normal in scale and perspective.
- DRIVER-SEAT PROOF: in Saudi Arabia this vehicle is LEFT-HAND DRIVE. The driver occupies the physical front-left seat on the same longitudinal axis as the steering column, instrument cluster and pedals. The driver door is beside his anatomical LEFT shoulder; the center console is beside his RIGHT thigh; the empty passenger seat is beyond the console on vehicle RIGHT.
- SELFIE WHEEL CUE: show a small but unmistakable steering-rim segment aligned directly ahead of the driver's torso at the bottom edge. Keep the hub, lower spokes and pedals cropped; do not erase every steering cue, because the frame must prove driver occupancy.
- Do not infer driver position from viewer-left/viewer-right or a mirrored selfie preview. Validate the physical chain: pelvis → driver seat → steering column → pedals; left shoulder → driver door; right thigh → center console → passenger seat. Never swap seats, relocate the steering column or put the subject in the front-right passenger seat.
- If naturally visible, use the integrated 2017 InControl Touch Pro screen and period-correct dashboard; never add a floating tablet, Touch Pro Duo, Pivi Pro or generic luxury-SUV controls.
- Materials respond independently: soft leather compression, dark directional veneer reflections, matte headliner, controlled satin-metal highlights and angle-correct glass reflections.
- Show subtle normal use appropriate to a well-maintained 2017 vehicle: gentle seat creases and slight surface variation, not showroom CGI perfection.
- No melted controls, warped door trim, duplicate seats, impossible roof geometry, bright walnut, plastic-white leather or random luxury details.`;

function l494InteriorEnabled(ctx = {}) {
  const captureType = ctx.captureType ?? document.getElementById('captureType')?.value;
  return captureType !== 'exterior';
}

// Add the master lock to the structured object used by Gemini JSON and the shared generator.
const _buildExteriorAwareWithoutInteriorMasterLock = buildExteriorAware;
buildExteriorAware = function () {
  const prompt = _buildExteriorAwareWithoutInteriorMasterLock();
  if (l494InteriorEnabled()) prompt.interior_master_lock = L494_INTERIOR_MASTER_LOCK;
  return prompt;
};

// Inject the same lock into ChatGPT text output, including generated variations.
const _chatgptPromptWithoutInteriorMasterLock = chatgptPrompt;
chatgptPrompt = function (prompt, ctx = {}) {
  let text = _chatgptPromptWithoutInteriorMasterLock(prompt, ctx);
  if (!l494InteriorEnabled(ctx)) return text;
  const anchor = `Vehicle orientation: ${prompt.vehicle_physics}`;
  const insertion = `${anchor}\n\n${L494_INTERIOR_MASTER_LOCK}`;
  return text.includes(anchor) ? text.replace(anchor, insertion) : `${text}\n\n${L494_INTERIOR_MASTER_LOCK}`;
};

// Refresh once after the extension is loaded so the visible output immediately contains the lock.
if (typeof render === 'function') render();
