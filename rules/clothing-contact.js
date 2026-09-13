(function(M){
  M.register({id:'clothing-contact',priority:M.levels.AESTHETIC,when:s=>Boolean(s.clothing),enforce:['Selected garment appears once and reacts to gravity, seated compression, body contact and fabric stiffness'],avoid:['duplicate garments','random decorative folds','material inconsistent with selected fabric'],reason:'a garment is selected'});
  M.register({id:'eyewear-position',priority:M.levels.AESTHETIC,when:s=>Boolean(s.glasses)&&s.glasses!=='none',enforce:['Use exactly one selected eyewear state and one physically supported contact position'],avoid:['glasses simultaneously on eyes and head','duplicated frames','floating eyewear'],reason:'eyewear is selected'});
})(window.MasterRules);
