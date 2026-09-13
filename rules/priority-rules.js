(function(g){
  const M=g.MasterRules=g.MasterRules||{};
  M.levels=Object.freeze({CRITICAL:100,PHYSICAL:80,SCENE:60,AESTHETIC:40});
  M.rules=M.rules||[];
  M.register=rule=>M.rules.push(Object.freeze({...rule}));
})(window);
