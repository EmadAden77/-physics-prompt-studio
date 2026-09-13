(function(M){
  const checks=[
    {id:'driver-passenger-conflict',priority:100,when:s=>s.seat==='driver'&&s.role==='passenger',winner:'driver-seat-lhd',fix:'role=driver'},
    {id:'night-sun-conflict',priority:100,when:s=>s.time==='night'&&s.directSun,winner:'night-light-lock',fix:'directSun=false'},
    {id:'selfie-hidden-camera-conflict',priority:100,when:s=>s.hiddenCamera,winner:'selfie-geometry',fix:'hiddenCamera=false'},
    {id:'interior-exterior-controls',priority:100,when:s=>s.capture==='interior'&&s.exteriorControlsActive,winner:'interior-visible-only',fix:'disable exterior controls'},
    {id:'exterior-dashboard-conflict',priority:80,when:s=>s.capture==='exterior'&&s.fullDashboard,winner:'exterior-visible-only',fix:'fullDashboard=false'},
    {id:'double-eyewear-conflict',priority:80,when:s=>s.glassesOnEyes&&s.glassesOnHead,winner:'eyewear-position',fix:'keep selected eyewear position only'},
    {id:'window-source-conflict',priority:80,when:s=>s.lighting==='window'&&!s.windowAvailable,winner:'physical-light-causality',fix:'use physically available source'}
  ];
  M.evaluate=function(state){
    const active=M.rules.filter(r=>r.when(state)).sort((a,b)=>b.priority-a.priority);
    const conflicts=checks.filter(c=>c.when(state)).map(c=>({...c,status:'corrected',confidence:1}));
    const results=M.rules.map(rule=>({rule:rule.id,status:active.includes(rule)?'enforced':'not-applicable',confidence:active.includes(rule)?1:.98,reason:active.includes(rule)?rule.reason:'scene condition does not apply'}));
    conflicts.forEach(c=>results.push({rule:c.id,status:'corrected',confidence:c.confidence,reason:`${c.winner} won; ${c.fix}`}));
    return {active,conflicts,results};
  };
})(window.MasterRules);
