import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../dist/vendor/three-engine.js';
import {worldNodes,worldFlows,worldFailures,worldScope} from '../dist/world-data.js';
import {ancestors,worldPosition,searchWorld,detailVisible,canStepWorld,clampPolar,validateWorld} from '../dist/world-core.js';
import {buildWorldObjects,KubernetesWorld} from '../dist/world-scene.js';

test('The city has 190 unique modeled elements, 32 small features and valid flows/failures',()=>{assert.equal(worldNodes.length,190);assert.equal(worldNodes.filter(n=>n.minor).length,32);assert.equal(validateWorld(worldNodes,worldFlows,worldFailures),true);assert.equal(Object.values(worldFlows).reduce((n,f)=>n+f.steps.length,0),323);for(const n of worldNodes)for(const k of ['purpose','input','output','notes'])assert.ok(n[k],`${n.id}: ${k}`);assert.ok(worldScope.notIncluded.length);});
test('Ancestry and world positions reflect environment, cluster, node, Pod and feature layers',()=>{assert.deepEqual(ancestors(worldNodes,'readiness').map(n=>n.id),['environment','cluster','worker-a','pod-a','readiness']);assert.deepEqual(ancestors(worldNodes,'app-a').map(n=>n.id),['environment','cluster','worker-a','pod-a','app-a']);const normal=worldPosition(worldNodes,'readiness'),exploded=worldPosition(worldNodes,'readiness',true);assert.ok(exploded[1]>normal[1]);assert.equal(normal[0],exploded[0]);assert.throws(()=>worldPosition(worldNodes,'missing'));});
test('Tiny details reveal with proximity, explicit detail toggle or selection without expanding their geometry',()=>{const n=worldNodes.find(n=>n.id==='readiness');assert.equal(detailVisible(n,40,'cluster'),false);assert.equal(detailVisible(n,3,'cluster'),true);assert.equal(detailVisible(n,40,'readiness'),true);assert.equal(detailVisible(n,40,'cluster',true),true);assert.deepEqual(n.size,[.32,.16,.32]);assert.ok(searchWorld(worldNodes,'READINESS').some(n=>n.id==='readiness'));assert.ok(searchWorld(worldNodes,'RBAC').some(n=>n.id==='rbac'));});
test('User traffic has a DNS return and excludes control-plane HTTP forwarding',()=>{const steps=worldFlows.traffic.steps;assert.equal(steps[0].to,'public-dns');assert.equal(steps[1].to,'users');assert.equal(steps.at(-1).to,'users');for(const s of steps){assert.ok(!['api','etcd','scheduler','controllers'].includes(s.from));assert.ok(!['api','etcd','scheduler','controllers'].includes(s.to));}assert.ok(steps.some(s=>s.kind==='Logical routing'));});
test('Every failure gates the affected flow at its checkpoint and clears on repair',()=>{for(const [id,f]of Object.entries(worldFailures)){const flow={...worldFlows[f.flow],id:f.flow};assert.equal(canStepWorld(flow,f.blockedStep,id,worldFailures),false);if(f.blockedStep<flow.steps.length-1)assert.equal(canStepWorld(flow,f.blockedStep,null,worldFailures),true);assert.ok(f.correct>=0&&f.correct<f.options.length);}});
test('Real Three.js geometry matches the declared hierarchy and has finite bounding volumes',()=>{const built=buildWorldObjects();assert.equal(built.objects.size,worldNodes.length);assert.ok(built.meshes.length>100);for(const n of worldNodes){const obj=built.objects.get(n.id);const actual=obj.getWorldPosition(new THREE.Vector3()).toArray();const expected=worldPosition(worldNodes,n.id);actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-7));}for(const mesh of built.meshes){mesh.geometry.computeBoundingSphere();assert.ok(Number.isFinite(mesh.geometry.boundingSphere.radius));assert.ok(mesh.userData.nodeId);}const feature=built.objects.get('readiness');assert.ok(new THREE.Box3().setFromObject(feature).getSize(new THREE.Vector3()).length()<1);});
test('Vertical and horizontal camera controls transform a real perspective camera with safe polar limits',()=>{const context={camera:new THREE.PerspectiveCamera(48,1,.03,500),controls:{target:new THREE.Vector3(),update(){}},dirty:false};context.camera.position.set(8,6,9);const before=context.camera.position.clone();KubernetesWorld.prototype.orbit.call(context,0,-.3);assert.notEqual(context.camera.position.y,before.y);const tilted=context.camera.position.clone();KubernetesWorld.prototype.orbit.call(context,.3,0);assert.notEqual(context.camera.position.x,tilted.x);for(let i=0;i<80;i++)KubernetesWorld.prototype.orbit.call(context,0,1);assert.ok(context.camera.position.toArray().every(Number.isFinite));assert.equal(clampPolar(-100),.08);assert.ok(clampPolar(100)<Math.PI);const distance=context.camera.position.length();KubernetesWorld.prototype.zoom.call(context,.5);assert.ok(context.camera.position.length()<distance);});
test('World UI selectors exist, engine is local and graphics loading remains lazy',()=>{const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));const js=readFileSync(new URL('../dist/world-ui.js',import.meta.url),'utf8');for(const match of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),match[1]);assert.ok(js.includes("import('./world-scene.js')"));assert.ok(readFileSync(new URL('../dist/vendor/THREE-LICENSE.txt',import.meta.url),'utf8').includes('MIT'));assert.equal(THREE.REVISION,'186');});

test('The radial scan discovers nearer objects first and reaches every modeled element',()=>{
 const built=buildWorldObjects(),events=[];
 const context={...built,reduced:false,scanStart:0,scanPlane:{visible:false,scale:new THREE.Vector3()},discovered:new Set(),scanMarks:new Map(worldNodes.filter(n=>n.id!=='environment').map(n=>[n.id,{material:{opacity:0}}])),callbacks:{onScanProgress:e=>events.push(e),onScanComplete:()=>events.push('done')}};
 KubernetesWorld.prototype.updateScan.call(context,0);const first=context.discovered.size;
 KubernetesWorld.prototype.updateScan.call(context,2000);assert.ok(context.discovered.size>first);assert.ok(!context.discovered.has('cloud-api'));
 KubernetesWorld.prototype.updateScan.call(context,6500);assert.equal(context.discovered.size,worldNodes.length-1);assert.equal(events.at(-1),'done');assert.equal(context.scanPlane.visible,false);
 context.scanStart=10000;context.discovered.clear();context.reduced=true;KubernetesWorld.prototype.updateScan.call(context,10000);assert.equal(context.discovered.size,worldNodes.length-1);assert.equal(context.scanPlane.visible,false);
});

test('Networking journeys keep DNS answers and application responses separate from control APIs',()=>{
 const s=worldFlows['city-network'].steps;assert.equal(s[1].to,'users');assert.equal(s.at(-1).to,'users');for(const step of s)assert.ok(!['api','etcd','scheduler','controllers'].includes(step.to));
 const infrastructure=worldFlows['city-iac'].steps;assert.ok(infrastructure.find(s=>s.from==='tf-apply'&&s.to==='cloud-api').kind.includes('HTTPS'));
 assert.ok(worldFlows['city-observe'].steps.some(s=>s.from==='prometheus'&&s.to==='app-a'));
 assert.ok(worldFlows['city-observe'].steps.some(s=>s.from==='app-a'&&s.to==='prometheus'));
});

test('AWS and Git have inspectable components and accurate separate learning journeys',()=>{
 for(const id of ['aws-vpc','aws-route53','aws-alb','aws-eks','aws-ecr','aws-s3','aws-rds','aws-cloudwatch','aws-secrets','aws-sg','aws-nat'])assert.ok(ancestors(worldNodes,id).some(n=>n.id==='cloud-district'));
 for(const id of ['git','git-working','git-index','git-commit','git-branch','git-fetch','git-merge','git-tag','git-revert','git-ignore'])assert.ok(ancestors(worldNodes,id).some(n=>n.id==='git-district'));
 const aws=worldFlows['city-aws'].steps;assert.equal(aws[0].to,'aws-route53');assert.equal(aws[1].to,'users');assert.ok(aws.some(s=>s.from==='aws-alb'&&s.to==='aws-eks'));assert.ok(!aws.some(s=>s.to==='api'));
 assert.match(worldNodes.find(n=>n.id==='git-fetch').notes,/does not by itself merge/);
});

test('Focused Kubernetes lessons keep unrelated meshes hidden and distinguish logical arrows from network traffic',async()=>{
 const {k8sLessons,lessonVisibleIds}=await import('../dist/k8s-learning.js');
 for(const lesson of k8sLessons){const ids=lessonVisibleIds(worldNodes,lesson.nodes);assert.ok(ids.has('environment'));for(const step of lesson.steps){assert.ok(lesson.nodes.includes(step.from));assert.ok(lesson.nodes.includes(step.to));assert.ok(step.relation);}}
 const built=buildWorldObjects(),context={...built,selected:'worker-a',detail:false,camera:new THREE.PerspectiveCamera(48,1,.03,800),routes:new THREE.Group(),particles:[new THREE.Mesh(new THREE.SphereGeometry(.1),new THREE.MeshBasicMaterial())],setDistrict:KubernetesWorld.prototype.setDistrict,setFlow:KubernetesWorld.prototype.setFlow,clearRoutes:KubernetesWorld.prototype.clearRoutes};context.camera.position.set(12,14,16);
 KubernetesWorld.prototype.setLearning.call(context,k8sLessons[0].nodes);KubernetesWorld.prototype.updateVisibility.call(context);
 const visible=id=>KubernetesWorld.prototype.objectVisible.call(context,built.objects.get(id));
 for(const id of ['worker-a','pod-a','app-a'])assert.equal(visible(id),true);
 for(const id of ['worker-b','sidecar-a','api','git','aws-alb','readiness'])assert.equal(visible(id),false,id);
 KubernetesWorld.prototype.setFlow.call(context,'learn-k8s-inside',0,null);assert.equal(context.particles[0].visible,false);assert.ok(context.routes.children.some(o=>o.isLineSegments));
 KubernetesWorld.prototype.setFlow.call(context,'learn-k8s-request',0,null);assert.equal(context.particles[0].visible,true);
 KubernetesWorld.prototype.setLearning.call(context,null);KubernetesWorld.prototype.updateVisibility.call(context);assert.equal(visible('git'),true);
});


test('Compact Kubernetes layouts move the chosen components and restore original city coordinates',async()=>{
 const {learningLayouts,k8sLessons}=await import('../dist/k8s-learning.js');const built=buildWorldObjects();const context={...built,routes:new THREE.Group(),particles:[],setDistrict:KubernetesWorld.prototype.setDistrict};
 const original=built.objects.get('worker-a').getWorldPosition(new THREE.Vector3()).clone();KubernetesWorld.prototype.setLearning.call(context,k8sLessons[0].nodes,learningLayouts.inside);assert.deepEqual(built.objects.get('worker-a').getWorldPosition(new THREE.Vector3()).toArray(),[0,.7,0]);
 for(const lesson of k8sLessons)KubernetesWorld.prototype.setLearning.call(context,lesson.nodes,learningLayouts[lesson.id]);
 KubernetesWorld.prototype.setLearning.call(context,null);const restored=built.objects.get('worker-a').getWorldPosition(new THREE.Vector3());assert.ok(restored.distanceTo(original)<1e-8);assert.equal(built.objects.get('pod-a').parent,built.objects.get('worker-a'));
});

test('Reference Kubernetes model has directed image transfers and separated traffic/control relationships',async()=>{
 const {modelContext,modelLayout}=await import('../dist/k8s-model.js');const steps=worldFlows['k8s-model'].steps;
 assert.ok(steps.some(s=>s.from==='ci'&&s.to==='registry'&&s.title==='Push image'));
 assert.ok(steps.some(s=>s.from==='worker-a'&&s.to==='registry'&&s.title==='Pull request'));
 assert.ok(steps.some(s=>s.from==='registry'&&s.to==='worker-a'&&s.title==='Image layers'));
 for(const step of steps.filter(s=>s.channel==='traffic'))assert.ok(!['api','control-plane','scheduler','etcd'].includes(step.to));
 const built=buildWorldObjects(),camera=new THREE.PerspectiveCamera(48,1.5,.03,800);camera.position.set(50,45,50);
 const context={...built,camera,selected:'cluster',referenceMode:true,setDistrict(){},routes:new THREE.Group(),particles:[],callbacks:{},labelLayer:{append(){}},connectionLabels:[],drawReferenceConnections:KubernetesWorld.prototype.drawReferenceConnections,clearRoutes:KubernetesWorld.prototype.clearRoutes,setFlow:KubernetesWorld.prototype.setFlow};
 const ids=[...worldNodes.filter(n=>ancestors(worldNodes,n.id).some(a=>a.id==='cluster')).map(n=>n.id),...modelContext];KubernetesWorld.prototype.setLearning.call(context,ids,modelLayout);KubernetesWorld.prototype.updateVisibility.call(context);
 assert.ok(context.referenceOwn.has('control-plane'));assert.ok(!context.referenceOwn.has('api'));assert.ok(!context.referenceOwn.has('readiness'));assert.ok(!context.referenceOwn.has('environment'));
 assert.equal(built.objects.get('worker-c').parent,built.objects.get('cluster'));
 const saved=globalThis.document;globalThis.document={createElement:()=>({style:{},setAttribute(){},addEventListener(){},remove(){}})};
 try{context.connectionChannel='images';context.setFlow('k8s-model',0,null);assert.equal(context.referenceCurves.length,3);assert.equal(context.connectionLabels.length,3);assert.equal(context.referenceTraffic.length,3);assert.ok(context.routes.children.length>3);for(const item of context.referenceCurves)assert.ok(item.curve.getPoint(.5).toArray().every(Number.isFinite));context.connectionChannel='control';context.setFlow('k8s-model',5,null);assert.equal(context.referenceTraffic.length,0);assert.ok(context.routes.children.some(o=>o.isLineSegments));}finally{globalThis.document=saved;}
});
