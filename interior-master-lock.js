// 2017 Range Rover Sport Autobiography Dynamic (L494) — Interior Master Lock
// Loaded after app.js so the existing generator stays modular and easy to roll back.

const L494_INTERIOR_MASTER_LOCK = `INTERIOR MASTER LOCK — 2017 LAND ROVER RANGE ROVER SPORT AUTOBIOGRAPHY DYNAMIC (L494), LEFT-HAND DRIVE.

CABIN ARCHITECTURE: Preserve the authentic 2017 L494 dashboard, center-console, door-panel, seat, roof and control architecture. Do not modernize, facelift, simplify or substitute a newer Range Rover, Range Rover Sport, Velar, Defender, Discovery or generic luxury-SUV cabin.

COLOR AND UPHOLSTERY: premium two-tone Ebony/Ivory specification. Front and rear seating surfaces are ultra-soft Ivory perforated Semi-Aniline leather with restrained Autobiography stitching, natural grain, seams and physically plausible compression. Upper dashboard and upper door sections are premium Ebony leather with precise double stitching. Keep the cabin materially two-tone: no all-black or all-beige substitution.

FRONT SEATS: substantial period-correct Autobiography luxury-seat geometry visually consistent with 22-way electric adjustment, memory, heating, ventilation and front massage. These are functional authenticity cues, not reasons to invent visible controls. Leather must remain soft, matte-to-satin and naturally creased, never plastic-white, glossy or over-quilted.

HEADLINER: full premium Alston Suedecloth / Alcantara-like headliner with a soft matte light response.

VENEER: authentic Grand Black Veneer across the center console and appropriate door trim. It is extremely dark polished natural veneer with restrained reflective depth, visibly different from piano-black plastic. No bright walnut, orange or reddish wood.

STEERING WHEEL: authentic period-correct L494 Autobiography Dynamic multifunction sport steering wheel in contrasting Ebony/Ivory leather, with restrained satin-metallic detailing and Satin Chrome / Noble Plated paddle shifters behind it. Heated-wheel functionality is implicit only. Never substitute a newer two-spoke Range Rover wheel, Tesla-style wheel or later touch-control wheel.

METAL DETAILS: restrained satin-finished premium metal, including plausible paddle shifters, machined aluminum sport pedals, premium door hardware and illuminated aluminum Autobiography sill plates only where naturally visible. No excessive chrome glare.

CENTER CONSOLE: authentic 2017 L494 center-console architecture with Grand Black Veneer and restrained metallic details. In LHD geometry it is immediately to the driver's RIGHT and physically separates the driver and passenger seats. The integrated refrigerated cooler inside the center armrest remains closed unless explicitly requested.

INFOTAINMENT: period-correct 2017 InControl Touch Pro, approximately 10.2-inch wide touchscreen integrated into the dashboard. It must not float like a tablet. No Touch Pro Duo, Pivi Pro, giant tablet, vertical Tesla-style display or later-generation dashboard.

INSTRUMENTS: authentic approximately 12.3-inch fully digital Interactive Driver Display directly behind the steering wheel on the driver's axis. Graphics and brightness are restrained and period-appropriate, never futuristic.

AUDIO: premium Meridian Surround Sound character consistent with the high-specification 825-watt / 19-speaker system including subwoofer. Visible speaker grilles stay naturally integrated into the doors; do not exaggerate logos or invent decorative speaker arrays.

PANORAMIC ROOF: authentic full sliding panoramic glass roof with electrically operated matching sunblind. Preserve real L494 roof geometry. Glass may carry subtle physically plausible exterior reflections; never turn it into an uninterrupted glass dome.

CLIMATE AND COMFORT: four-zone automatic climate-control architecture, configurable ambient lighting, soft-close doors and acoustic/heat-insulating laminated glazing. Ambient lighting is subtle and trim-integrated, never RGB gaming strips or aftermarket neon.

MATERIAL PHYSICS: Ivory Semi-Aniline leather = soft diffuse reflection, fine grain, stitching and compression. Ebony leather = deeper low-gloss response and visible stitching. Grand Black Veneer = dark polished directional reflections with natural depth. Alston Suedecloth = matte light absorption. Satin metal = controlled directional highlights. Panoramic glass = realistic transparency and environmental reflections. Digital displays = limited luminance and believable black levels. Never give every material the same glossy CGI response.

AGE / USE REALISM: depict a premium, well-maintained 2017 vehicle photographed in 2026, not a factory configurator render. Allow only extremely subtle normal-use evidence where visible: gentle leather compression, tiny natural creases, faint fingerprints on glossy veneer/screens, minute dust in difficult seams and slight variation in surface reflectivity. No dirt, neglect, damage or artificial aging.

HARD CABIN CONSTRAINTS: authentic 2017 L494 only; no newer-generation Range Rover interior; no Touch Pro Duo; no Pivi Pro; no giant floating display; no modern two-spoke wheel; no generic SUV cabin; no mirrored LHD geometry; no passenger-side steering wheel; no artificial white plastic leather; no excessive RGB lighting; no bright brown veneer; no futuristic instrument graphics; no showroom-CGI perfection; no impossible reflections; no duplicated controls, vents, screens, seats or steering-wheel elements.`;

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
