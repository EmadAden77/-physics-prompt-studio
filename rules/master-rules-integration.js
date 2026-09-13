(function(g){
  const M=g.MasterRules,$=id=>document.getElementById(id);
  function state(overrides={}){const value=id=>overrides[id]??$(id)?.value??'';const capture=value('captureType');return {capture,scene:capture==='interior'?'inside-car':'outside-car',seat:value('seat'),role:value('seat'),time:value('time'),lighting:value('lightingProfile'),place:value('place'),clothing:value('clothing'),glasses:value('glasses'),identityReference:Boolean($('referenceImage')?.files?.length),windowAvailable:capture==='interior',exteriorControlsActive:capture==='interior'&&['exteriorPose','exteriorFraming','doorState'].some(id=>!$(id)?.disabled),directSun:false,hiddenCamera:false,fullDashboard:false,glassesOnEyes:false,glassesOnHead:false};}
  const previousChatgpt=chatgptPrompt;
  chatgptPrompt=function(prompt,ctx={}){const s=state(ctx);return `${M.output(s)}\n\n${M.cleanPrompt(previousChatgpt(prompt,ctx),s)}`};
  const previousBuild=buildExteriorAware;
  buildExteriorAware=function(){const prompt=previousBuild(),audit=M.evaluate(state());prompt.master_rules_v4={active_rules:audit.active.map(r=>({id:r.id,priority:r.priority,reason:r.reason})),conflicts:audit.conflicts,confidence:audit.results,visible_only:true};return prompt};
  const previousDoctor=promptDoctor;
  promptDoctor=function(){const result=previousDoctor(),audit=M.evaluate(state());result.ruleAudit=audit.results;result.verified.push(...audit.results.filter(x=>x.status==='enforced').map(x=>`${x.rule}: مفعل بثقة ${x.confidence}`));audit.conflicts.forEach(c=>result.verified.push(`${c.id}: صُحح تلقائيًا لصالح ${c.winner}`));return result};
  const previousRender=render;
  render=function(){syncCaptureControls();previousRender()};
  render();
})(window);
