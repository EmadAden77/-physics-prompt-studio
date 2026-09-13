// Mandatory Saudi physical-context layer. Loaded before the realism/output guards.
const SAUDI_PLACE_REALITY = {
  street:['patched urban asphalt with faded lane and parking marks','mixed-height concrete curb, tiled shopfront pavement, driveways and utility covers','short stops, delivery movement, uneven parking and purposeful pedestrians'],
  mall:['broad maintained asphalt with tire wear at turns and parking bays','accessible ramps, wheel stops, shaded entrances and continuous pedestrian routes','family arrivals, carts, taxis and cars searching for spaces'],
  villa:['residential asphalt with repaired service cuts and fine windblown dust at edges','villa boundary wall, vehicle gate, lowered curb and locally paved sidewalk','residents, parked household cars and restrained neighborhood movement'],
  garage:['clean but used private paving with tire marks near the gate','threshold drain, ramp transition and wall/door contact geometry','private household activity only; no invented public crowd'],
  quiet:['locally worn residential asphalt with patched utilities','variable sidewalks, driveway cuts, trees, meters and boundary walls','sparse residents, parked cars and occasional delivery or child movement'],
  'gas-station':['fuel-resistant forecourt concrete with darker tire paths and small service stains','pump islands, protective bollards, canopy columns and shop threshold','refueling, payment and shop visits with safe vehicle circulation'],
  cafeteria:['used roadside asphalt and informal short-stay parking','narrow tiled frontage, curb cuts and delivery access','customers collecting orders, delivery riders and brief double-parking only where plausible'],
  restaurant:['marked but imperfect parking surface with repeated tire wear','entrance pavement, accessibility ramp and service-side access','arrivals, takeaway collection and small groups moving toward the entrance'],
  supermarket:['busy parking asphalt with faded bays and cart-wheel wear','ramps, storefront paving, bollards and trolley route','shoppers, carts, loading activity and vehicles entering or leaving spaces'],
  mosque:['maintained neighborhood asphalt with orderly but locally imperfect parking','paved approach, shoe/entrance zone, ramps and boundary edge','activity follows prayer time; never create a permanent decorative crowd'],
  corniche:['sun- and salt-weathered roadway with marked parking','wide promenade paving, curb, barriers, seating and drainage','walkers, families, cyclists and parked cars proportional to time and weather'],
  'desert-road':['coarse highway asphalt with repaired seams, shoulder dust and tire wear','graded shoulder, reflectors, signs and occasional barrier where terrain requires','sparse traffic at credible spacing; no urban crowd or automatic sandstorm'],
  'rest-area':['used access asphalt with turning wear and mixed parking surfaces','curbs, shop or prayer access, bins and service edge','travelers resting, refueling or buying supplies with varied vehicles'],
  hospital:['heavily used but maintained access road with marked drop-off','accessible ramps, bollards, ambulance route and pedestrian crossing','patients, staff, visitors and taxis following entrance functions'],
  'airport-road':['higher-standard multilane asphalt with lane wear and repaired joints','engineered median, barrier, lighting and controlled shoulders','directional traffic with realistic spacing and no pedestrians on fast lanes'],
  office:['maintained commercial asphalt with daily parking wear','formal pavement, ramps, planted edge and service entrance','employees, visitors, ride-hailing and deliveries according to work hours']
};

const SAUDI_TIME_REALITY = {
  morning:'morning sun is low and directional; commute, school and opening activity is plausible',
  noon:'high sun produces shorter harder shadows, bright exposed paving and heat-dependent reduced pedestrian activity',
  afternoon:'lower warm-side sunlight lengthens shadows; errands, school/work return and rising local activity are plausible',
  day:'derive sun height, sky fill and activity from an ordinary Saudi daytime without cinematic grading',
  night:'use only real lamps, storefronts, vehicles and signs; keep unlit zones dark with device-appropriate noise'
};

function saudiPhysicalReality(place,time){
  const p=SAUDI_PLACE_REALITY[place]||SAUDI_PLACE_REALITY.street;
  const t=SAUDI_TIME_REALITY[time]||SAUDI_TIME_REALITY.day;
  return `SAUDI PHYSICAL REALITY — MANDATORY:
- Place identity: a functioning, contemporary Saudi location, not a generic Gulf backdrop or sterile showroom set.
- Ground: ${p[0]}.
- Curbs, pavement and access: ${p[1]}. All levels, ramps, drains, thresholds and tire/foot contact must connect physically.
- Contextual life: ${p[2]}. ${t}.
- REAL DISORDER, RESTRAINED AND CAUSAL: allow uneven parking, faded paint, isolated asphalt patches, repair seams, dust accumulation at edges, minor surface variation and small practical misalignments only where use, weather or maintenance explains them.
- Do not create decorative chaos: no carpet of litter, exaggerated decay, invented poverty, broken infrastructure, random crowds, impossible traffic or automatic sandstorm unless explicitly requested.
- Road physics: vehicles obey lane direction, turning radius, parking geometry, scale, tire contact and cast shadows; no duplicated cars or floating wheels.
- Human physics: people have independent identities, purposeful behavior, correct scale, foot contact, spacing and occlusion; nobody poses toward the selfie without a reason.
- Depth hierarchy: near evidence is readable, midground selective, distant people/signs/vehicles softer and less detailed. Arabic/English text may exist naturally but remains too small to read unless exact text is requested.`;
}

const _chatgptPromptWithoutSaudiScene=chatgptPrompt;
chatgptPrompt=function(prompt,ctx={}){const get=id=>ctx[id]??document.getElementById(id)?.value;return `${_chatgptPromptWithoutSaudiScene(prompt,ctx)}\n\n${saudiPhysicalReality(get('place'),get('time'))}`};

const _buildExteriorAwareWithoutSaudiScene=buildExteriorAware;
buildExteriorAware=function(){const prompt=_buildExteriorAwareWithoutSaudiScene();prompt.saudi_physical_reality=saudiPhysicalReality(document.getElementById('place')?.value,document.getElementById('time')?.value);return prompt};

const _promptDoctorWithoutSaudiScene=promptDoctor;
promptDoctor=function(){const result=_promptDoctorWithoutSaudiScene();if(result&&Array.isArray(result.verified)){result.verified.push('تم تفعيل فيزياء الشارع والرصيف والأسفلت السعودية حسب المكان والوقت.','الفوضى الواقعية سببية ومحدودة وليست قمامة أو ازدحامًا زخرفيًا.')}return result};
