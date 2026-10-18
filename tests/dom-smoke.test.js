// A minimal DOM fixture for behavioral smoke checks, not browser layout verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {labs} from '../dist/data.js';
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
const nav=['lab','library','path'].map(page=>{const b=new Element('button');b.dataset.page=page;return b;});
const documentMock=Object.assign(new EventTarget(),{hidden:false,body:new Element('body'),createElement:tag=>new Element(tag),createTextNode:s=>s,getElementById:id=>elements.get(id),querySelectorAll:()=>nav});
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
  assert.equal($('progress-count').textContent,'8 / 8');
  const saved=parseProgress(storage.get('devops-universe-progress-v1'),labs);assert.ok(labs.every(l=>isComplete(saved,l)));
  nav[1].click();assert.equal($('page-library').hidden,false);assert.equal($('library-grid').children.length,30);
  $('search').value='terraform';$('search').dispatchEvent(new Event('input'));assert.ok($('library-grid').children.length>0);
  $('search').value='no-such-topic-999';$('search').dispatchEvent(new Event('input'));assert.equal($('empty-results').hidden,false);
  $('search').value='';$('category-filter').value='Security';$('category-filter').dispatchEvent(new Event('change'));assert.equal($('library-grid').children.length,3);
  nav[2].click();assert.equal($('path-list').children.length,8);
  $('reset-progress').click();assert.equal($('progress-count').textContent,'8 / 8');
  $('reset-progress').click();assert.equal($('progress-count').textContent,'0 / 8');
});

test('Canvas renderer draws all labs and both views without non-finite drawing coordinates',async()=>{
  const {ArchitectureModel}=await import('../dist/model.js');const canvas=new Element('canvas');const labels=new Element();let calls=0;
  canvas.getContext=()=>new Proxy({measureText:t=>({width:t.length*5})},{get:(o,k)=>o[k]??((...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),`${String(k)} received non-finite coordinate`);calls++;})});
  const model=new ArchitectureModel(canvas,labels,()=>{});
  for(const lab of labs){model.setLab(lab);for(const width of [320,700,1200]){model.width=width;for(const mode of ['2d','3d']){model.setMode(mode);for(let step=0;step<lab.steps.length;step++){model.update({step,selected:lab.nodes[0].id,playing:true,failed:step===lab.failure.at});model.draw(1000);}}}}
  assert.ok(calls>1000);
});
