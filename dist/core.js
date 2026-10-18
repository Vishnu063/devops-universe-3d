export function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
export function initialProgress(){return {version:1,labs:{}};}
export function getRecord(progress,id){return progress.labs[id] || {visited:[],quiz:false,repaired:false};}
export function markVisited(progress,id,index){const record=getRecord(progress,id);return {...progress,labs:{...progress.labs,[id]:{...record,visited:[...new Set([...record.visited,index])]}}};}
export function markTask(progress,id,task){if(!['quiz','repaired'].includes(task))throw new Error('Unknown task');const record=getRecord(progress,id);return {...progress,labs:{...progress.labs,[id]:{...record,[task]:true}}};}
export function isComplete(progress,lab){const record=getRecord(progress,lab.id);return lab.steps.every((_,i)=>record.visited.includes(i)) && record.quiz && record.repaired;}
export function parseProgress(raw,labs){try{const p=JSON.parse(raw);if(p?.version!==1||!p.labs||typeof p.labs!=='object')return initialProgress();const clean=initialProgress();for(const lab of labs){const r=p.labs[lab.id];if(r && typeof r==='object')clean.labs[lab.id]={visited:[...new Set((Array.isArray(r.visited)?r.visited:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<lab.steps.length))],quiz:r.quiz===true,repaired:r.repaired===true};}return clean;}catch{return initialProgress();}}
export function matchingTopics(topics,query,area){const needle=query.trim().toLowerCase();return topics.filter(t=>(area==='all'||t.area===area)&&[t.title,t.area,t.purpose,t.flow,...t.skills,...t.tools,t.practice,t.pitfall].join(' ').toLowerCase().includes(needle));}
export function canAdvance(lab,index,failed){return index<lab.steps.length-1 && !(failed&&index>=lab.failure.at);}

export function resolveModel(search,labs){const id=new URLSearchParams(search).get("model");return labs.some(l=>l.id===id)?id:null;}
