(function(M){
  const uniqueLines=text=>{const seen=new Set();return String(text).split('\n').filter(line=>{const key=line.trim().toLowerCase();if(!key)return true;if(seen.has(key))return false;seen.add(key);return true}).join('\n').replace(/\n{3,}/g,'\n\n').trim()};
  M.cleanPrompt=function(text,state){let clean=uniqueLines(text);if(state.capture==='interior')clean=clean.replace(/EXTERIOR SELFIE MAP:[\s\S]*?(?=\n\n|$)/g,'');return uniqueLines(clean)};
  M.output=function(state){
    const audit=M.evaluate(state),must=[...new Set(audit.active.flatMap(r=>r.enforce||[]))],avoid=[...new Set(audit.active.flatMap(r=>r.avoid||[]))];
    const report=audit.conflicts.length?audit.conflicts.map(c=>`- ${c.id}: corrected; ${c.winner} won; ${c.fix}`).join('\n'):'- No unresolved rule conflicts.';
    return `MASTER RULES ENGINE V4 — AUTHORITATIVE OUTPUT LOCK\n\nMUST:\n${must.map(x=>`- ${x}`).join('\n')}\n\nAVOID:\n${avoid.map(x=>`- ${x}`).join('\n')}\n\nCONFLICT RESOLUTION:\n${report}\n\nCONFIDENCE AUDIT:\n${audit.results.filter(x=>x.status!=='not-applicable').map(x=>`- ${x.rule}: ${x.status}; confidence ${x.confidence}; ${x.reason}`).join('\n')}\n\nVISIBLE-ONLY FINAL GATE:\nInclude only details that can physically enter the selected camera frame or causally affect visible light, contact, reflection, motion or context. Lower-priority aesthetic detail never overrides a critical or physical rule.`;
  };
})(window.MasterRules);
