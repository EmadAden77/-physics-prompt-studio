// Master Realism Engine: workflow, conflict priorities and conditional scene modules.
// Loaded last to extend the existing generator without coupling modules to its core.

const REALISM_WORKFLOW = ['Parse request','Lock references','Build scene','Solve camera','Solve light','Solve physics','Select modules','Resolve conflicts','Forensic QA'];

const REALISM_PRIORITY_TIERS = [
  {name:'TIER 1 — HARD CONSTRAINTS',text:'Explicit user instructions, identity fidelity, reference roles, capture type and core scene meaning.'},
  {name:'TIER 2 — PHYSICAL WORLD',text:'Camera geometry, physical light causality, anatomy, gravity, contact, forces and occlusion.'},
  {name:'TIER 3 — CAMERA RESPONSE',text:'Exposure, sensor and lens behavior, depth of field, motion, reflections, white balance and noise.'},
  {name:'TIER 4 — OPTIONAL AESTHETICS',text:'Composition polish, stylization and decorative choices. Never override a higher tier.'}
];

const UNIVERSAL_REALISM_CORE = `UNIVERSAL REALISM CORE:
- Lock one physically possible capture type and one coherent 3D camera viewpoint.
- Treat a person reference as identity-only unless another role is explicitly assigned.
- Every visible effect follows CAUSE → INTERACTION → VISIBLE RESULT.
- Separate physical illumination from exposure and processing; processing cannot create light.
- Enforce valid anatomy, gravity, balance, contact compression and material response.
- Keep reflections, shadows, perspective, atmosphere and background in the same physical event.
- Match depth of field, noise, dynamic range, motion and imperfections to the camera class.
- Prefer causal realism over beautification, cinematic polish or generic AI perfection.`;

const REALISM_MODULES = {
  identity:{label:'Identity Lock',when:()=>true,prompt:'IDENTITY MODULE: preserve facial structure, head proportions, apparent age, asymmetry, skin, hairline, hair density, beard density and gaps. No beautification, de-aging or identity drift.'},
  selfie:{label:'Selfie Geometry',when:()=>true,prompt:'SELFIE MODULE: enforce reachable arm-length phone position, compatible shoulder/elbow/wrist mechanics, front-camera perspective and physically possible body visibility. Never convert this into a third-person photograph.'},
  vehicleExterior:{label:'Vehicle Exterior',when:c=>c.captureType==='exterior',prompt:'VEHICLE EXTERIOR MODULE: preserve coherent driver-side body, door hinges, wheels, ground contact, paint reflections and LHD orientation. No transparent panels, floating parts or dealership-ad geometry.'},
  vehicleInterior:{label:'Vehicle Interior',when:c=>c.captureType!=='exterior',prompt:'VEHICLE INTERIOR MODULE: lock driver/passenger relation, steering-wheel side, center console, doors, seats, pillars, dashboard and roof to one unmirrored LHD cabin geometry.'},
  lowLight:{label:'Low Light',when:c=>c.time==='night'||c.time==='dusk',prompt:'LOW-LIGHT MODULE: apply plausible sensor noise, shadow-detail loss, reduced micro-detail, restrained sharpening, limited dynamic range and supported motion softness. Never clean or relight deep shadows artificially.'},
  daylight:{label:'Daylight',when:c=>c.time==='day'||c.time==='golden',prompt:'DAYLIGHT MODULE: derive illumination from sun position, sky fill, surface orientation and real environmental bounce. Maintain one coherent sun direction and exposure response.'},
  practicalLight:{label:'Practical Light',when:c=>['practical','parking','quiet'].includes(c.lightingProfile),prompt:'PRACTICAL-LIGHT MODULE: every bright region, cast shadow and reflection must trace to a believable source with correct direction, occlusion, color and distance falloff.'},
  windowLight:{label:'Window Light',when:c=>c.lightingProfile==='window',prompt:'WINDOW-LIGHT MODULE: illumination follows window geometry, glass transmission, occlusion and gradual cross-cabin falloff; exposure may reveal signal but may not invent fill.'},
  multiPerson:{label:'Multi-person',when:c=>/people|persons|group|أشخاص|شخصين|مجموعة/i.test(c.notes||''),prompt:'MULTI-PERSON MODULE: give every person a distinct identity, anatomy, pose and clothing response; preserve correct occlusion and prohibit cloned faces or fused bodies.'}
};

function currentRealismContext(overrides={}){const value=id=>overrides[id]??document.getElementById(id)?.value??'';return {captureType:value('captureType'),time:value('time'),lightingProfile:value('lightingProfile'),seat:value('seat'),angle:value('angle'),pose:value('pose'),doorState:value('doorState'),exteriorPose:value('exteriorPose'),notes:value('notes')}}
function activeRealismModules(context=currentRealismContext()){return Object.entries(REALISM_MODULES).filter(([,m])=>m.when(context)).map(([id,m])=>({id,...m}))}
function realismConflictAudit(c=currentRealismContext()){const x=[];if(c.captureType!=='exterior'&&c.seat==='passenger'&&c.angle.startsWith('driver'))x.push('TIER 2: passenger seat conflicts with driver camera geometry.');if(c.captureType!=='exterior'&&c.seat.startsWith('rear')&&c.angle!=='rear-seat')x.push('TIER 2: rear seat requires rear-seat camera geometry.');if(c.captureType!=='exterior'&&c.seat==='driver'&&c.angle==='passenger-close')x.push('TIER 2: driver seat conflicts with passenger camera geometry.');if(c.captureType==='exterior'&&c.exteriorPose==='open-door'&&c.doorState==='closed')x.push('TIER 1: open-door pose conflicts with the selected closed-door state.');return x}

function realismEngineBlock(context=currentRealismContext()){
  const modules=activeRealismModules(context);
  return `MASTER REALISM ENGINE — ACTIVE CONFIGURATION

COMPACT EXECUTION WORKFLOW:
${REALISM_WORKFLOW.map((s,i)=>`${i+1}. ${s}`).join('\n')}

PRIORITY TIERS FOR CONFLICTING RULES:
${REALISM_PRIORITY_TIERS.map(t=>`${t.name}: ${t.text}`).join('\n')}

${UNIVERSAL_REALISM_CORE}

ACTIVE SCENE MODULES ONLY:
${modules.map(m=>m.prompt).join('\n')}

CONFLICT RESOLUTION: preserve the highest-priority constraint and adjust only the lower-priority result. Between explicit conflicts, prefer the more specific and physically defining instruction while preserving scene intent.

FINAL FORENSIC QA: verify capture type, camera reach and perspective, identity, light ownership and falloff, exposure, anatomy, contact, forces, materials, reflections, vehicle structure, background continuity and AI artifacts. Correct the cause before finalization.`
}

function renderRealismEngineUI(){const c=currentRealismContext(),modules=activeRealismModules(c),conflicts=realismConflictAudit(c),workflow=document.getElementById('workflowStrip'),chips=document.getElementById('activeModules'),tiers=document.getElementById('priorityTiers'),status=document.getElementById('engineStatus');if(!workflow||!chips||!tiers||!status)return;workflow.innerHTML=REALISM_WORKFLOW.map((s,i)=>`<li><span>${i+1}</span>${s}</li>`).join('');chips.innerHTML=modules.map(m=>`<span>${m.label}</span>`).join('');tiers.innerHTML=REALISM_PRIORITY_TIERS.map(t=>`<li><strong>${t.name}</strong><small>${t.text}</small></li>`).join('');status.textContent=conflicts.length?`${conflicts.length} تعارض`:'متسق';status.classList.toggle('has-conflict',Boolean(conflicts.length))}

const _chatgptPromptWithoutRealismEngine=chatgptPrompt;
chatgptPrompt=function(prompt,ctx={}){return `${_chatgptPromptWithoutRealismEngine(prompt,ctx)}\n\n${realismEngineBlock(currentRealismContext(ctx))}`};
const _buildExteriorAwareWithoutRealismEngine=buildExteriorAware;
buildExteriorAware=function(){const prompt=_buildExteriorAwareWithoutRealismEngine(),context=currentRealismContext();prompt.master_realism_engine={execution_workflow:REALISM_WORKFLOW,priority_tiers:REALISM_PRIORITY_TIERS,universal_core:UNIVERSAL_REALISM_CORE,active_modules:activeRealismModules(context).map(m=>({id:m.id,label:m.label,rules:m.prompt})),conflicts:realismConflictAudit(context),final_gate:'Run forensic QA and correct every critical causal inconsistency before finalization.'};return prompt};
const _renderWithoutRealismEngineUI=render;
render=function(){_renderWithoutRealismEngineUI();renderRealismEngineUI()};
document.querySelectorAll('select,input,textarea').forEach(el=>el.addEventListener('input',renderRealismEngineUI));
render();
