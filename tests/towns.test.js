import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three-engine.js';
import {townProfiles} from '../dist/town-models.js';
import {worldNodes,worldFlows} from '../dist/world-data.js';
import {buildWorldObjects,KubernetesWorld} from '../dist/world-scene.js';
import {ancestors} from '../dist/world-core.js';

test('Every town has one connected profile in the same city, with scoped resources and valid example transports',()=>{
 const roots=worldNodes.filter(n=>n.district);assert.equal(roots.length,13);assert.equal(Object.keys(townProfiles).length,14);
 for(const root of roots){const p=townProfiles[root.id];assert.ok(p,root.id);assert.ok(p.nodeIds.includes(root.id));assert.ok(worldFlows[p.flowId].steps.length>0);assert.ok(p.nodeIds.length<worldNodes.length);for(const step of worldFlows[p.flowId].steps){assert.ok(p.nodeIds.includes(step.from));assert.ok(p.nodeIds.includes(step.to));}}
 for(const p of Object.values(townProfiles).filter(p=>p.id!=='cluster')){
  const exchanges=new Map();for(const s of worldFlows[p.flowId].steps){if(s.relation==='network'){assert.ok(s.transport);assert.ok(s.transport.serverPort>0&&s.transport.serverPort<65536);if(!exchanges.has(s.exchange))exchanges.set(s.exchange,[]);exchanges.get(s.exchange).push(s);}else{assert.equal(s.transport,null);assert.equal(s.exchange,null);assert.match(s.packet,/No transport port/);}}
  for(const pair of exchanges.values()){assert.equal(pair.length,2);const [a,b]=pair;assert.equal(a.phase,'request');assert.equal(b.phase,'response');assert.equal(a.from,b.to);assert.equal(a.to,b.from);assert.deepEqual(a.transport,b.transport);assert.equal(a.transport.initiator,a.from);}
 }
});

test('Transport boundaries teach the correct initiator without inventing network ports for local actions',()=>{
 const steps=id=>worldFlows[townProfiles[id].flowId].steps;
 assert.ok(steps('docker-district').some(s=>s.from==='docker-cli'&&s.to==='docker-engine'&&s.relation==='local'&&s.transport===null));
 assert.ok(steps('ansible-district').filter(s=>s.phase==='request').every(s=>s.from==='ansible'&&s.transport.serverPort===22));
 const scrape=steps('observe-district').find(s=>s.title==='Scrape metrics');assert.equal(scrape.from,'prometheus');assert.equal(scrape.to,'app-a');
 const dns=steps('network-district');assert.equal(dns[0].to,'public-dns');assert.equal(dns[1].to,'users');assert.equal(dns[2].from,'users');assert.equal(dns[2].to,'load-balancer');
 for(const s of dns.filter(s=>s.transport?.protocol.includes('HTTP')))assert.ok(!['public-dns','api','etcd'].includes(s.to));
 const cloud=steps('iac-district').find(s=>s.title==='Provider API operation');assert.equal(cloud.from,'tf-apply');assert.equal(cloud.to,'cloud-api');assert.equal(cloud.channel,'control');
 assert.equal(ancestors(worldNodes,'registry').find(n=>n.district).id,'docker-district');assert.equal(ancestors(worldNodes,'ansible').find(n=>n.district).id,'ansible-district');
});

test('Switching through all towns restores city positions and keeps all geometry finite',()=>{
 const built=buildWorldObjects(),original=new Map([...built.objects].map(([id,o])=>[id,o.getWorldPosition(new T.Vector3()).clone()]));
 const context={...built,routes:new T.Group(),particles:[],setDistrict(){},camera:new T.PerspectiveCamera(48,1.5,.03,800),controls:{target:new T.Vector3()},referenceMode:true,selected:'environment'};context.camera.position.set(200,180,200);
 for(const p of Object.values(townProfiles)){
  context.townProfile=p;context.selected=p.id;KubernetesWorld.prototype.setLearning.call(context,p.nodeIds,p.layout);KubernetesWorld.prototype.updateVisibility.call(context);KubernetesWorld.prototype.frameLearning.call(context);
  assert.ok(context.flight.to.toArray().every(Number.isFinite));assert.ok(context.flight.to.distanceTo(context.flight.target)<context.camera.far,p.id);
  for(const [id,pos]of Object.entries(p.layout||{}))assert.ok(built.objects.get(id).getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(...pos))<1e-7,id);
 }
 KubernetesWorld.prototype.setLearning.call(context,townProfiles.environment.nodeIds,null);for(const [id,pos]of original)assert.ok(built.objects.get(id).getWorldPosition(new T.Vector3()).distanceTo(pos)<1e-7,id);
 context.townProfile=townProfiles.environment;context.selected='environment';KubernetesWorld.prototype.updateVisibility.call(context);assert.ok(context.referenceOwn.has('git'));assert.ok(context.referenceOwn.has('docker-engine'));assert.ok(!context.referenceOwn.has('docker-health'));
 context.detail=true;KubernetesWorld.prototype.updateVisibility.call(context);assert.ok(context.referenceOwn.has('docker-health'));
});


test('Complete city framing keeps every town inside landscape and portrait camera views',()=>{
 const built=buildWorldObjects();
 for(const aspect of [2,1,.45]){
  const ctx={...built,camera:new T.PerspectiveCamera(48,aspect,.03,800),controls:{target:new T.Vector3()},learningIds:new Set(townProfiles.environment.nodeIds),townProfile:townProfiles.environment};
  KubernetesWorld.prototype.frameLearning.call(ctx);ctx.camera.position.copy(ctx.flight.to);ctx.camera.lookAt(ctx.flight.target);ctx.camera.updateMatrixWorld(true);
  for(const n of worldNodes.filter(n=>n.district)){
   const box=new T.Box3().setFromObject(built.objects.get(n.id));
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(ctx.camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1,n.id+' at '+aspect);}
  }
 }
});
