// A minimal DOM fixture for behavioral smoke checks, not browser layout verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {labs} from '../dist/data.js';
import {courses} from '../dist/curriculum.js';
import {parseLearning,courseCheckpoint} from '../dist/learning-core.js';
import {projects} from '../dist/projects.js';
import {parseProgress,isComplete} from '../dist/core.js';
class Element extends EventTarget {
  constructor(tag='div'){super();this.tagName=tag;this.children=[];this.attributes={};this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.value='';this._text='';this.className='';this.classList={add:(...s)=>{this.className=[...new Set([...this.className.split(' '),...s])].join(' ');},remove:s=>{this.className=this.className.split(' ').filter(x=>x!==s).join(' ');},toggle:(s,on)=>{if(on===undefined)on=!this.className.split(' ').includes(s);on?this.classList.add(s):this.classList.remove(s);return on;}};}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];this._text='';}
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this._text+this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
  setAttribute(k,v){this.attributes[k]=String(v);}
  querySelectorAll(tag){return this.children.flatMap(c=>typeof c==='string'?[]:[...(c.tagName===tag?[c]:[]),...c.querySelectorAll(tag)]);}
  click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}
  focus(){} scrollIntoView(){} remove(){} setPointerCapture(){}
  getContext(){return new Proxy({measureText:t=>({width:t.length*5})},{get:(o,k)=>o[k]??(()=>{})});}
}
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const elements=new Map([...html.matchAll(/<([\w-]+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)].map(m=>{const e=new Element(m[1]);e.id=m[3];e.hidden=/\bhidden\b/.test(m[2]);return [m[3],e];}));
const nav=['lab','library','path','study','projects'].map(page=>{const b=new Element('button');b.dataset.page=page;return b;});
const documentMock=Object.assign(new EventTarget(),{hidden:false,body:new Element('body'),createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),createTextNode:s=>s,getElementById:id=>elements.get(id),querySelectorAll:selector=>selector==='[data-page]'?nav:[]});
const storage=new Map();
Object.assign(globalThis,{document:documentMock,window:globalThis,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},matchMedia:()=>({matches:false}),ResizeObserver:class{constructor(cb){this.cb=cb;}observe(){this.cb([{contentRect:{width:700,height:420}}]);}},devicePixelRatio:1,requestAnimationFrame:()=>0,scrollTo:()=>{}});
const $=id=>elements.get(id);
$('speed').value='4000';$('category-filter').value='all';
await import('../dist/app.js');

test('A learner can finish every model, recover failures, search the library and reset progress',()=>{
  assert.equal($('lab-title').textContent,labs[0].title);
  assert.equal($('node-labels').children.length,labs[0].nodes.length);
  for(let i=0;i<labs.length;i++){
    $('lab-list').children[i].click();
    assert.equal($('lab-title').textContent,labs[i].title);
    $('node-labels').children[1].click();assert.equal($('node-title').textContent,labs[i].nodes[1].title);
    $('view-2d').click();assert.equal($('rotate-left').disabled,true);
    $('view-3d').click();assert.equal($('rotate-left').disabled,false);
    $('reset-view').click();$('zoom-in').click();$('zoom-out').click();
    // Read every step, then return to the affected point through failure injection.
    for(let s=1;s<labs[i].steps.length;s++)$('next').click();
    assert.match($('step-label').textContent,new RegExp(`Step ${labs[i].steps.length} of`));
    $('inject').click();assert.equal($('failure-panel').hidden,false);assert.equal($('next').disabled,true);
    assert.ok($('failure-evidence').textContent.includes(labs[i].failure.evidence));
    const wrong=(labs[i].failure.correct+1)%labs[i].failure.options.length;
    $('fix-options').children[wrong].click();assert.match($('fix-feedback').textContent,/try another action/);
    // Jumping via the step navigator cannot bypass the unresolved failure.
    $('step-dots').children.at(-1).click();assert.equal($('step-label').textContent,`Step ${labs[i].failure.at+1} of ${labs[i].steps.length}`);
    $('fix-options').children[labs[i].failure.correct].click();assert.match($('fix-feedback').textContent,/Recovered/);
    $('quiz-options').children[(labs[i].quiz.correct+1)%labs[i].quiz.options.length].click();assert.match($('quiz-feedback').textContent,/Try again/);
    $('quiz-options').children[labs[i].quiz.correct].click();assert.match($('quiz-feedback').textContent,/Correct/);
  }
  assert.equal($('progress-count').textContent,'12 / 12');
  const saved=parseProgress(storage.get('devops-universe-progress-v1'),labs);assert.ok(labs.every(l=>isComplete(saved,l)));
  nav[1].click();assert.equal($('page-library').hidden,false);assert.equal($('library-grid').children.length,30);
  $('search').value='terraform';$('search').dispatchEvent(new Event('input'));assert.ok($('library-grid').children.length>0);
  $('search').value='no-such-topic-999';$('search').dispatchEvent(new Event('input'));assert.equal($('empty-results').hidden,false);
  $('search').value='';$('category-filter').value='Security';$('category-filter').dispatchEvent(new Event('change'));assert.equal($('library-grid').children.length,3);
  nav[2].click();assert.equal($('path-list').children.length,12);
  $('reset-progress').click();assert.equal($('progress-count').textContent,'12 / 12');
  $('reset-progress').click();assert.equal($('progress-count').textContent,'0 / 12');
});

test('Canvas renderer draws all labs and both views without non-finite drawing coordinates',async()=>{
  const {ArchitectureModel}=await import('../dist/model.js');const canvas=new Element('canvas');const labels=new Element();let calls=0;
  canvas.getContext=()=>new Proxy({measureText:t=>({width:t.length*5})},{get:(o,k)=>o[k]??((...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),`${String(k)} received non-finite coordinate`);calls++;})});
  const model=new ArchitectureModel(canvas,labels,()=>{});
  for(const lab of labs){model.setLab(lab);for(const width of [320,700,1200]){model.width=width;for(const mode of ['2d','3d']){model.setMode(mode);for(let step=0;step<lab.steps.length;step++){model.update({step,selected:lab.nodes[0].id,playing:true,failed:step===lab.failure.at});model.draw(1000);}}}}
  assert.ok(calls>1000);
});


test('Topic selection, staged lessons, practice evidence and assessments work across all courses',()=>{
  nav[3].click();assert.equal($('page-study').hidden,false);assert.equal($('course-select').children.length,30);
  assert.equal($('course-results').children.length,30);assert.equal($('roadmap-list').children.length,30);
  for(const course of courses){
    $('course-select').value=course.id;$('course-select').dispatchEvent(new Event('change'));
    assert.equal($('course-name').textContent,course.title);assert.equal($('practical-tasks').children.length,course.lab.tasks.length);
    $('course-lessons').children[2].click();assert.match($('reading-progress').textContent,/0 of 3/);
    for(let i=0;i<3;i++){$('course-lessons').children[i].click();$('mark-read').click();}
    assert.match($('reading-progress').textContent,/3 of 3/);
    $('practice-evidence').value='not enough';$('practice-confirm').checked=true;$('save-practice').click();
    assert.match($('practice-feedback').textContent,/at least 80/);
    $('practice-evidence').value='I ran the described disposable exercise, recorded the actual result, checked the intended outcome, and noted that this does not prove production readiness.';
    $('save-practice').click();assert.match($('practice-feedback').textContent,/self-reported/);
    for(let i=0;i<course.questions.length;i++){const wrong=(course.questions[i].correct+1)%course.questions[i].options.length;$('course-questions').children[i].querySelectorAll('button')[wrong].click();assert.match($('assessment-summary').textContent,/Review/);$('course-questions').children[i].querySelectorAll('button')[course.questions[i].correct].click();}
    assert.match($('assessment-summary').textContent,/2\/2 correct/);
  }
  const saved=parseLearning(storage.get('devops-universe-courses-v1'),courses,projects);assert.ok(courses.every(c=>courseCheckpoint(saved,c)));
  $('course-search').value='terraform';$('course-search').dispatchEvent(new Event('input'));assert.ok($('course-results').children.length>0);
  $('course-search').value='no-such-topic';$('course-search').dispatchEvent(new Event('input'));assert.equal($('course-no-results').hidden,false);
  $('network-scenario').value='alb-app';$('network-scenario').dispatchEvent(new Event('change'));$('network-rule').checked=false;$('evaluate-network').click();assert.match($('network-decision').textContent,/BLOCKED/);
  $('network-rule').checked=true;$('evaluate-network').click();assert.match($('network-decision').textContent,/passes these checks/);
  nav[4].click();assert.equal($('project-list').children.length,3);
});

test('Clickable model connections select the active directed step without treating empty space as a link',async()=>{
  const {ArchitectureModel}=await import('../dist/model.js');const canvas=new Element('canvas'),labels=new Element();const selected=[];const model=new ArchitectureModel(canvas,labels,()=>{},index=>selected.push(index));model.setLab(labs[0]);model.step=0;const s=labs[0].steps[0],a=labs[0].nodes.find(n=>n.id===s.from),b=labs[0].nodes.find(n=>n.id===s.to);const p=model.project(a.x,.08,a.z),q=model.project(b.x,.08,b.z);model.selectConnection((p.x+q.x)/2,(p.y+q.y)/2);assert.deepEqual(selected,[0]);model.selectConnection(-500,-500);assert.deepEqual(selected,[0]);
});

test('All-progress reset clears courses as well as architecture completion',()=>{
  nav[2].click();$('reset-progress').click();$('reset-progress').click();
  const clean=parseLearning(storage.get('devops-universe-courses-v1'),courses,projects);assert.equal(Object.keys(clean.courses).length,0);assert.equal(Object.keys(clean.projects).length,0);assert.match($('reading-progress').textContent,/0 of 3/);
});


test('Isometric asset styles cover all models and partial playback updates preserve a drawable scene',async()=>{
 const {ArchitectureModel}=await import('../dist/model.js');const {assetKind,assetKinds}=await import('../dist/model-assets.js');
 const canvas=new Element('canvas'),labels=new Element(),model=new ArchitectureModel(canvas,labels,()=>{});
 for(const lab of labs){model.setLab(lab);for(const node of lab.nodes)assert.ok(assetKinds.includes(assetKind(lab,node)));model.update({step:1,selected:lab.nodes[0].id,playing:true,failed:false});model.update({playing:false});assert.equal(model.step,1);assert.equal(model.selected,lab.nodes[0].id);model.setFocus(true);model.draw(800);model.setFocus(false);model.draw(800);}
 assert.equal(assetKind(labs[0],labs[0].nodes.find(n=>n.id==='browser')),'workstation');
 assert.equal(assetKind(labs[0],labs[0].nodes.find(n=>n.id==='db')),'database');
 $('focus-step').click();assert.equal($('focus-step').attributes['aria-pressed'],'true');$('focus-step').click();assert.equal($('focus-step').attributes['aria-pressed'],'false');
 $('expand-model').click();assert.equal($('expand-model').attributes['aria-expanded'],'true');$('expand-model').click();assert.equal($('expand-model').attributes['aria-expanded'],'false');
});

test('The world text explorer selects tiny features, shows ancestry and explains all simulated repairs without WebGL',async()=>{
 const {worldNodes,worldFlows,worldFailures}=await import('../dist/world-data.js');
 assert.ok($('world-tree').children.length>30);assert.equal($('world-flow').value,'town-environment');assert.equal($('k8s-lesson').value,'');$('k8s-city').click();assert.equal($('world-tree').children.length,worldNodes.length);
 $('world-search').value='readiness';$('world-search').dispatchEvent(new Event('input'));
 assert.ok($('world-tree').children.length>0);const row=$('world-tree').children.find(b=>b.textContent.includes('Readiness probe'));row.click();assert.equal($('world-node-title').textContent,'Readiness probe');assert.ok($('world-breadcrumb').textContent.includes('Application Pod A'));
 $('world-parent').click();assert.equal($('world-node-title').textContent,'Application Pod A');
 for(const [id,failure]of Object.entries(worldFailures)){$('world-failure').value=id;$('world-inject').click();assert.equal($('world-next').disabled,true);assert.equal($('world-flow').disabled,true);$('world-step-list').children.at(-1).querySelectorAll('button')[0].click();assert.match($('world-step-counter').textContent,new RegExp(`Step ${failure.blockedStep+1} of`));const wrong=(failure.correct+1)%failure.options.length;$('world-repair-options').children[wrong].click();assert.match($('world-repair-feedback').textContent,/Try another/);$('world-repair-options').children[failure.correct].click();assert.match($('world-repair-feedback').textContent,/Recovered in this simulation/);assert.equal($('world-flow').disabled,false);}
 for(const id of Object.keys(worldFlows)){$('world-flow').value=id;$('world-flow').dispatchEvent(new Event('change'));for(let i=1;i<worldFlows[id].steps.length;i++)$('world-next').click();assert.equal($('world-next').disabled,true);}
 $('world-help').click();assert.equal($('world-help-panel').hidden,false);$('world-expand').click();assert.equal($('world-expand').attributes['aria-expanded'],'true');$('world-expand').click();
});

test('City topic isolation, teaching HUD, replay and links to every course work without WebGL',async()=>{
 const {worldNodes}=await import('../dist/world-data.js');
 $('world-search').value='';$('world-search').dispatchEvent(new Event('input'));
 const covered=new Set();
 for(const district of worldNodes.filter(n=>n.district)){
  $('city-district').value=district.id;$('city-district').dispatchEvent(new Event('change'));
  assert.ok(worldNodes.some(n=>n.label===$('world-node-title').textContent));assert.equal($('city-district').value,district.id);
  assert.ok($('world-tree').children.length>1);assert.ok($('world-tree').children.length<worldNodes.length);
  for(const b of $('city-lessons').children)covered.add(b.textContent.split(' →')[0]);
 }
 assert.equal(covered.size,30);
 $('world-city').click();assert.equal($('city-district').value,'all');assert.equal($('world-tree').children.length,worldNodes.length);
 $('city-flow-select').value='city-network';$('city-flow-select').dispatchEvent(new Event('change'));
 assert.match($('city-step-title').textContent,/address/);$('city-forward').click();assert.match($('city-step-count').textContent,/Step 2 of/);
 $('city-restart').click();assert.match($('city-step-count').textContent,/Step 1 of/);$('city-inspect').click();assert.equal($('world-node-title').textContent,'Public DNS');
 $('city-back').click();assert.match($('city-step-count').textContent,/Step 1 of/);
 $('city-district').value='observe-district';$('city-district').dispatchEvent(new Event('change'));
 const lesson=$('city-lessons').children.find(b=>b.textContent.startsWith('Observability'));lesson.click();assert.equal($('course-name').textContent,'Observability');
});

test('Full screen supports native entry/exit and page fallback with Escape cleanup',async()=>{
 const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
 const viewport=$('city-viewport');documentMock.body.style.overflow='auto';
 viewport.requestFullscreen=async()=>{documentMock.fullscreenElement=viewport;documentMock.dispatchEvent(new Event('fullscreenchange'));};
 documentMock.exitFullscreen=async()=>{documentMock.fullscreenElement=null;documentMock.dispatchEvent(new Event('fullscreenchange'));};
 $('city-fullscreen').click();await settle();assert.equal(documentMock.fullscreenElement,viewport);assert.equal($('city-fullscreen').attributes['aria-pressed'],'true');
 $('city-fullscreen').click();await settle();assert.equal(documentMock.fullscreenElement,null);assert.equal($('city-fullscreen').attributes['aria-pressed'],'false');
 viewport.requestFullscreen=async()=>{throw new Error('Unsupported / blocked');};
 $('city-fullscreen').click();await settle();assert.ok(viewport.className.includes('viewport-fullscreen'));assert.equal(documentMock.body.style.overflow,'hidden');
 const escape=new Event('keydown');escape.key='Escape';documentMock.dispatchEvent(escape);assert.ok(!viewport.className.includes('viewport-fullscreen'));assert.equal(documentMock.body.style.overflow,'auto');
 delete viewport.requestFullscreen;delete documentMock.exitFullscreen;
 assert.match(html,/<details\b[^>]*id="city-guide"[^>]*>/);assert.doesNotMatch(html.match(/<details\b[^>]*id="city-guide"[^>]*>/)[0],/\bopen\b/);
});

test('Watch-first Kubernetes lessons isolate concepts, preserve context across steps and keep practice optional',async()=>{
 const {k8sLessons}=await import('../dist/k8s-learning.js');
 for(let i=0;i<k8sLessons.length;i++){
  $('k8s-lesson').value=String(i);$('k8s-lesson').dispatchEvent(new Event('change'));
  const lesson=k8sLessons[i];assert.equal($('world-tree').children.length,lesson.nodes.length);assert.equal($('k8s-goal').textContent,lesson.goal);assert.equal($('k8s-step-strip').hidden,false);
  assert.ok($('world-flow').children.every(o=>o.value.startsWith('learn-k8s-')||['k8s-model','learn-request-complete','traffic','delivery','networking','operations'].includes(o.value)));
  for(let s=1;s<lesson.steps.length;s++){$('k8s-next-step').click();assert.equal($('world-tree').children.length,lesson.nodes.length);assert.equal($('city-district').value,'cluster');}
  assert.equal($('k8s-next-step').disabled,true);assert.equal($('k8s-strip-title').textContent,lesson.steps.at(-1).title);
  const wrong=(lesson.correct+1)%lesson.options.length;$('k8s-answers').children[wrong].click();assert.match($('k8s-answer-feedback').textContent,/Try again/);$('k8s-answers').children[lesson.correct].click();assert.match($('k8s-answer-feedback').textContent,/Correct/);
 }
 $('k8s-lesson').value='0';$('k8s-lesson').dispatchEvent(new Event('change'));$('k8s-next-lesson').click();assert.equal($('k8s-lesson').value,'1');
 $('k8s-town').click();assert.equal($('k8s-step-strip').hidden,true);assert.ok($('world-tree').children.length>12);assert.ok(!$('world-tree').textContent.includes('Amazon EC2'));
 $('k8s-city').click();assert.equal($('world-tree').children.length,190);
 $('k8s-lesson').value='0';$('k8s-lesson').dispatchEvent(new Event('change'));const app=$('world-tree').children.find(b=>b.textContent.includes('App container A'));app.click();assert.match($('k8s-yaml').textContent,/containerPort: 8080/);assert.match($('k8s-example-logs').textContent,/Example log/);
});

test('The same Kubernetes workspace opens the complete model with folded explanations and optional panels',()=>{
 $('k8s-town').click();assert.equal($('world-flow').value,'k8s-model');assert.ok($('world-workspace').className.includes('k8s-reference'));assert.equal($('k8s-step-strip').hidden,true);
 $('k8s-components').click();assert.ok($('world-workspace').className.includes('components-open'));$('k8s-components').click();assert.ok(!$('world-workspace').className.includes('components-open'));
 $('k8s-animate').click();assert.equal($('k8s-animate').attributes['aria-pressed'],'false');$('k8s-animate').click();assert.equal($('k8s-animate').attributes['aria-pressed'],'true');
 assert.ok($('world-tree').textContent.includes('Worker node C'));assert.ok($('world-tree').textContent.includes('Container registry'));assert.ok(!$('world-tree').textContent.includes('Amazon EC2'));
 assert.match(html,/<details class="world-flow-panel" id="world-flow-details">/);assert.equal([...html.matchAll(/id="world-canvas"/g)].length,1);
});

test('Each new town opens its model in the same workspace and city steps preserve city context',async()=>{
 const {townProfiles}=await import('../dist/town-models.js');const {worldFlows}=await import('../dist/world-data.js');
 for(const p of Object.values(townProfiles).filter(p=>p.id!=='environment')){
  $('city-topic-select').value=p.id;$('city-topic-select').dispatchEvent(new Event('change'));
  assert.equal($('world-flow').value,p.flowId);assert.equal($('world-town-title').textContent,p.label);assert.equal($('city-district').value,p.id);assert.equal($('world-tree').children.length,p.nodeIds.length);
  $('world-home').click();assert.equal($('city-district').value,p.id);
 }
 $('world-city').click();const p=townProfiles.environment;assert.equal($('world-flow').value,p.flowId);
 for(let i=1;i<worldFlows[p.flowId].steps.length;i++){$('world-next').click();assert.equal($('world-flow').value,p.flowId);assert.equal($('city-topic-select').value,'all');assert.match($('world-step-counter').textContent,new RegExp(`Step ${i+1} of`));}
 $('world-tree').children.find(b=>b.textContent.includes('Docker & registry')).click();assert.equal($('world-flow').value,townProfiles['docker-district'].flowId);
});

test('The request lab teaches each boundary, gates all three failures and restores the existing town view',async()=>{
 const {requestFaults,requestQuestions}=await import('../dist/request-lab.js');
 $('teach-start').click();assert.equal($('world-flow').value,'learn-request-complete');assert.equal($('teach-controls').hidden,false);assert.equal($('teach-panel').hidden,false);assert.equal($('k8s-connections').disabled,true);assert.match($('teach-title').textContent,/application address/);assert.match($('teach-transport').textContent,/server port 53/);
 $('teach-answers').children[requestQuestions[0][2]].click();assert.match($('teach-answer-feedback').textContent,/Correct/);$('teach-next').click();assert.match($('teach-title').textContent,/DNS answer/);$('teach-next').click();assert.match($('teach-transport').textContent,/server port 443/);
 for(const [id,f]of Object.entries(requestFaults)){
  $('teach-fault').value=id;$('teach-break').click();assert.equal($('teach-next').disabled,true);assert.equal($('teach-play').disabled,true);assert.match($('teach-health').textContent,/Blocked/);assert.equal($('teach-verify').disabled,true);const blocked=$('world-step-counter').textContent;
  $('world-step-list').children.at(-1).querySelectorAll('button')[0].click();assert.equal($('world-step-counter').textContent,blocked);assert.match($('teach-output').textContent,/SIMULATED/);
  if(id==='selector')assert.match($('teach-config').textContent,/app: store/);if(id==='env')assert.match($('teach-config').textContent,/reference is absent/);if(id==='policy')assert.match($('teach-config').textContent,/ingress: \[\]/);
  $('teach-repair').value=Object.values(requestFaults).find(x=>x.action!==f.action).action;$('teach-apply').click();assert.match($('teach-repair-feedback').textContent,/does not address/);assert.equal($('teach-verify').disabled,true);
  $('teach-repair').value=f.action;$('teach-apply').click();assert.equal($('teach-next').disabled,true);assert.equal($('teach-verify').disabled,false);assert.match($('teach-health').textContent,/verification pending/);$('teach-verify').click();assert.equal($('teach-next').disabled,false);assert.match($('teach-repair-feedback').textContent,/verification passed/);assert.ok($('teach-timeline').children.length>=3);
 }
 for(let i=0;i<9;i++)$('teach-next').click();assert.equal($('teach-next').disabled,true);assert.match($('teach-title').textContent,/encrypted client response/);assert.match($('teach-boundary-note').textContent,/Outside Kubernetes/);
 $('teach-exit').click();assert.equal($('teach-controls').hidden,true);assert.equal($('world-flow').value,'k8s-model');assert.equal($('k8s-connections').disabled,false);
 $('coverage-town').value='docker-district';$('coverage-town').dispatchEvent(new Event('change'));assert.match($('coverage-rows').textContent,/Not yet/);$('coverage-rows').children[0].querySelectorAll('button')[0].click();assert.equal($('city-district').value,'docker-district');
 assert.equal([...html.matchAll(/id="world-canvas"/g)].length,1);
});

test('City exploration, inline lessons and a no-WebGL scan save discoveries independently from study completion',async()=>{
 const {resetCityExploration,cityProgressReport}=await import('../dist/world-ui.js');const {learningProgressReport}=await import('../dist/study.js');resetCityExploration();$('city-explore').click();$('world-view-2d').click();assert.equal($('world-2d').hidden,false);assert.equal($('world-canvas').hidden,true);assert.ok($('world-2d').querySelectorAll('svg').length===1);assert.equal($('city-topic-catalog').children.length,30);
 const before=JSON.stringify(learningProgressReport());$('city-reduced-motion').checked=true;$('city-reduced-motion').dispatchEvent(new Event('change'));$('world-scan').click();$('city-reduced-motion').checked=false;$('city-reduced-motion').dispatchEvent(new Event('change'));assert.equal(cityProgressReport().discovered.length,30);assert.match($('topic-discovered-count').textContent,/30 \/ 30/);assert.equal(JSON.stringify(learningProgressReport()),before);assert.equal($('world-scan').disabled,false);
 $('city-topic-search').value='Prometheus';$('city-topic-search').dispatchEvent(new Event('input'));assert.ok($('city-topic-catalog').children.length>0);$('city-topic-catalog').children[0].click();assert.equal($('city-discovery-card').hidden,false);assert.equal($('city-discovery-lessons').children.length,2);assert.ok($('city-discovery-tasks').children.length>0);assert.match($('city-discovery-failure').textContent,/Evidence:/);assert.match($('city-discovery-title').textContent,/Prometheus/);$('city-topic-search').value='';$('city-topic-search').dispatchEvent(new Event('input'));
});

test('Beginner concepts follow prerequisites, resume the last concept and preserve a town step across navigation',async()=>{
 const {learningOrder}=await import('../dist/city-explore.js');const {beginnerProfiles}=await import('../dist/world-data.js');const {cityProgressReport}=await import('../dist/world-ui.js');const order=learningOrder(courses);$('city-begin').click();
 for(let i=0;i<order.length;i++){const p=beginnerProfiles[order[i].id];assert.equal($('world-flow').value,p.flowId);assert.equal($('world-tree').children.length,p.nodeIds.length);assert.match($('beginner-count').textContent,new RegExp(`Concept ${i+1} / 30`));if(i<order.length-1)$('beginner-next').click();}
 assert.equal($('beginner-next').disabled,true);const last=cityProgressReport().lastConcept;$('city-explore').click();$('city-resume').click();assert.equal($('world-flow').value,'beginner-'+last);$('world-back').click();assert.equal($('world-flow').value,'town-environment');
 $('city-topic-select').value='git-district';$('city-topic-select').dispatchEvent(new Event('change'));$('world-step-list').children[0].querySelectorAll('button')[0].click();$('world-next').click();const step=$('world-step-counter').textContent;$('city-explore').click();$('city-topic-select').value='git-district';$('city-topic-select').dispatchEvent(new Event('change'));assert.equal($('world-step-counter').textContent,step);assert.equal($('beginner-bar').hidden,true);
 const svg=$('world-2d').querySelectorAll('svg')[0],targets=svg.querySelectorAll('g');assert.ok(targets.length>1);const key=new Event('keydown');key.key='Enter';targets[0].dispatchEvent(key);assert.ok($('world-node-title').textContent);
});

test('Back preserves a blocked request exercise and the discovery card belongs to the full-screen viewport',()=>{
 $('teach-start').click();$('teach-fault').value='selector';$('teach-break').click();assert.equal($('teach-next').disabled,true);$('city-explore').click();$('world-back').click();assert.equal($('world-flow').value,'learn-request-complete');assert.match($('teach-health').textContent,/Blocked/);assert.equal($('teach-next').disabled,true);assert.match($('world-2d').textContent,/No successful application response/);$('teach-exit').click();
 const viewportStart=html.indexOf('id="city-viewport"'),card=html.indexOf('id="city-discovery-card"'),error=html.indexOf('id="world-error"');assert.ok(viewportStart<card&&card<error);assert.equal([...html.matchAll(/id="world-canvas"/g)].length,1);
});

test('Learners can build, break, repair, export and import their own network in the same workspace',()=>{
 $('world-view-2d').click();$('network-build').click();assert.equal($('network-panel').hidden,false);assert.match($('world-town-title').textContent,/Build my network/);$('net-template').click();$('net-run').click();assert.match($('net-result').textContent,/CHECKS PASSED/);assert.ok($('net-trace-steps').children.length>=4);$('net-next').click();assert.match($('net-step').textContent,/2\//);
 $('net-devices').value='n2';$('net-devices').dispatchEvent(new Event('change'));$('net-rules').value='';$('net-apply').click();$('net-run').click();assert.match($('net-result').textContent,/BLOCK/);assert.match($('net-result').textContent,/Default-deny/);$('net-rules').value='TCP 8080 10.0.1.0/24';$('net-apply').click();$('net-run').click();assert.match($('net-result').textContent,/CHECKS PASSED/);
 $('net-export').click();const exported=$('net-json').value;assert.equal(JSON.parse(exported).nodes.length,3);$('net-empty').click();assert.match($('net-node-count').textContent,/0\/24/);$('net-json').value=exported;$('net-import').click();assert.match($('net-node-count').textContent,/3\/24/);$('net-json').value='bad json';$('net-import').click();assert.match($('net-message').textContent,/Import rejected/);assert.match($('net-node-count').textContent,/3\/24/);
 $('net-add-kind').value='database';$('net-add').click();assert.match($('net-node-count').textContent,/4\/24/);$('net-undo').click();assert.match($('net-node-count').textContent,/3\/24/);$('net-template-proxy').click();$('net-run').click();assert.match($('net-result').textContent,/CHECKS PASSED/);assert.ok($('net-trace-steps').textContent.includes('separate backend'));
 $('net-close').click();assert.equal($('network-panel').hidden,true);assert.ok(!$('world-workspace').className.includes('builder-mode'));assert.equal([...html.matchAll(/id="world-canvas"/g)].length,1);
});

test('The scan-first menu, one-time hint, beginner-first card and display controls work without WebGL',async()=>{
 const {setWorldActive}=await import('../dist/world-ui.js');setWorldActive(true);await new Promise(r=>setTimeout(r,0));$('city-intro-dismiss').click();assert.equal($('city-intro').hidden,true);setWorldActive(false);setWorldActive(true);await new Promise(r=>setTimeout(r,0));assert.equal($('city-intro').hidden,true);
 assert.match(html,/>Start scan<\/button>/);assert.match(html,/<details class="world-menu" id="world-menu"><summary>Menu<\/summary>/);assert.doesNotMatch(html.match(/<details class="world-menu"[^>]*>/)[0],/\bopen\b/);assert.match(html,/<summary>Advanced<\/summary>/);assert.equal($('world-loading').hidden,true);
 $('city-quality').value='low';$('city-quality').dispatchEvent(new Event('change'));$('city-reduced-motion').checked=true;$('city-reduced-motion').dispatchEvent(new Event('change'));assert.ok(documentMock.body.className.includes('reduce-motion'));const prefs=JSON.parse(storage.get('devops-interface-comfort-v1'));assert.equal(prefs.quality,'low');assert.equal(prefs.reducedMotion,true);assert.equal(prefs.introSeen,true);
 $('city-topic-search').value='Prometheus';$('city-topic-search').dispatchEvent(new Event('input'));$('city-topic-catalog').children[0].click();const lessons=$('city-discovery-lessons');assert.equal(lessons.children.length,2);assert.equal(lessons.children[0].tagName,'section');assert.match(lessons.children[0].textContent,/Start here/);assert.equal(lessons.children[1].tagName,'details');assert.match(lessons.children[1].textContent,/Go deeper/);assert.match($('city-next-hint').textContent,/All topics|Security|Pick|Start/);$('city-about-open').click();assert.equal($('city-about').open,true);$('city-quality').value='normal';$('city-quality').dispatchEvent(new Event('change'));$('city-reduced-motion').checked=false;$('city-reduced-motion').dispatchEvent(new Event('change'));
});
