(function(g){
  const M=g.MasterRules,$=id=>document.getElementById(id);
  function state(overrides={}){const value=id=>overrides[id]??$(id)?.value??'';const capture=value('captureType');return {capture,scene:capture==='interior'?'inside-car':'outside-car',seat:value('seat'),role:value('seat'),time:value('time'),lighting:value('lightingProfile'),place:value('place'),clothing:value('clothing'),glasses:value('glasses'),age:value('age'),identityReference:Boolean($('referenceImage')?.files?.length),windowAvailable:capture==='interior',exteriorControlsActive:capture==='interior'&&['exteriorPose','exteriorFraming','doorState'].some(id=>!$(id)?.disabled),directSun:false,hiddenCamera:false,fullDashboard:false,glassesOnEyes:false,glassesOnHead:false};}
  chatgptPrompt=function(prompt,ctx={}){return M.compile(prompt,state(ctx))};
  const previousBuild=buildExteriorAware;
  buildExteriorAware=function(){const prompt=previousBuild(),audit=M.evaluate(state());prompt.master_rules_v4={active_rules:audit.active.map(r=>({id:r.id,priority:r.priority,reason:r.reason})),conflicts:audit.conflicts,confidence:audit.results,visible_only:true};return prompt};
  const previousDoctor=promptDoctor;
  promptDoctor=function(){const result=previousDoctor(),audit=M.evaluate(state());result.ruleAudit=audit.results;result.verified.push(`V4: فُحصت ${audit.active.length} قواعد نشطة داخليًا؛ لا تُضاف تقارير المحرك إلى البرومبت.`);audit.conflicts.forEach(c=>result.verified.push(`${c.id}: صُحح تلقائيًا لصالح ${c.winner}`));return result};
  const previousRender=render;
  render=function(){syncCaptureControls();previousRender();if(outputMode==='gemini'){const prompt=buildExteriorAware();$('output').textContent=JSON.stringify(M.compileJson(prompt,state()),null,2)}};
  render();
})(window);
