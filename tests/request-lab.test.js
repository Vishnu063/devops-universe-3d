import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three-engine.js';
import {worldNodes,worldFlows} from '../dist/world-data.js';
import {requestFlowId,requestProfile,requestSteps,requestBoundaries,requestEvidence,requestQuestions,requestFaults,createRequestState,moveRequest,injectRequest,repairRequest,verifyRequest,observeRequest,answerRequest,boundaryPath,transportDetails} from '../dist/request-lab.js';
import {coverageFor,coverageTowns} from '../dist/coverage.js';
import {buildWorldObjects,KubernetesWorld} from '../dist/world-scene.js';

test('The complete request keeps DNS, three transport exchanges and logical backend selection distinct',()=>{
 assert.equal(worldFlows[requestFlowId].steps,requestSteps);assert.equal(requestSteps.length,9);const groups=new Map();
 for(const s of requestSteps){assert.ok(requestProfile.nodeIds.includes(s.from));assert.ok(requestProfile.nodeIds.includes(s.to));assert.ok(!['api','scheduler','etcd'].includes(s.to));if(s.exchange){if(!groups.has(s.exchange))groups.set(s.exchange,[]);groups.get(s.exchange).push(s);}else{assert.equal(s.relation,'configuration');assert.equal(s.transport,null);}}
 for(const [key,pair]of groups){assert.equal(pair.length,2,key);const [a,b]=pair;assert.equal(a.from,b.to);assert.equal(a.to,b.from);assert.equal(a.phase,'request');assert.equal(b.phase,'response');assert.deepEqual(a.transport,b.transport);assert.equal(a.transport.initiator,a.from);}
 assert.equal(groups.get('edge')[0].transport.serverPort,80);assert.equal(groups.get('app')[0].transport.serverPort,8080);assert.equal(groups.get('public')[0].transport.serverPort,443);assert.equal(requestSteps[1].to,'users');assert.equal(requestSteps[2].from,'users');
 assert.match(transportDetails(requestSteps[4],worldNodes),/No network initiator/);assert.match(transportDetails({relation:'network',packet:'abbreviated'},worldNodes),/metadata is not recorded/);
});

test('Every fault gates jumps, rejects unrelated fixes and requires verification after the matching change',()=>{
 for(const [id,f]of Object.entries(requestFaults)){
  const healthy=createRequestState(),broken=injectRequest(healthy,id);assert.equal(healthy.fault,null);assert.equal(moveRequest(broken,999).step,f.stop);assert.equal(verifyRequest(broken).fault,id);assert.match(observeRequest(broken).status,/Blocked/);
  const wrong=Object.values(requestFaults).find(x=>x.action!==f.action).action;assert.equal(repairRequest(broken,wrong).corrected,false);
  const changed=repairRequest(broken,f.action);assert.equal(changed.corrected,true);assert.equal(changed.fault,id);assert.equal(moveRequest(changed,999).step,f.stop);assert.match(observeRequest(changed).status,/verification pending/);
  const verified=verifyRequest(changed);assert.equal(verified.fault,null);assert.equal(verified.verified,true);assert.equal(moveRequest(verified,999).step,8);assert.match(verified.feedback,/does not verify a real cluster/);assert.equal(verified.history.length,3);
 }
 assert.equal(injectRequest(createRequestState(),'unknown').fault,null);assert.equal(moveRequest(createRequestState(),-4).step,0);
});

test('Evidence and predictions are scoped to the same sample app, with honest per-town coverage',()=>{
 assert.equal(requestQuestions.length,requestSteps.length);for(let i=0;i<requestQuestions.length;i++){assert.equal(answerRequest(i,requestQuestions[i][2]).correct,true);assert.equal(answerRequest(i,(requestQuestions[i][2]+1)%3).correct,false);}
 for(const id of ['users','public-dns','load-balancer','ingress','service','pod-a','app-a']){const e=requestEvidence[id];assert.ok(e.command&&e.config&&e.output);assert.match(e.output,/SIMULATED/);}
 assert.match(requestEvidence.service.config,/selector: \{app: web\}/);assert.match(requestEvidence.ingress.config,/number: 80/);assert.match(requestEvidence['app-a'].config,/8080/);
 assert.match(boundaryPath(worldNodes,'app-a'),/Kubernetes cluster.*Worker node A.*Application Pod A.*App container A/);assert.match(boundaryPath(worldNodes,'load-balancer'),/Outside Kubernetes/);
 assert.equal(coverageTowns().length,13);for(const id of coverageTowns()){const rows=coverageFor(id,worldNodes);assert.ok(rows.some(r=>r.modeled&&r.explained));assert.ok(rows.some(r=>!r.modeled&&!r.explained&&r.planned));if(id!=='cluster')assert.ok(rows.every(r=>!r.interactive));}assert.ok(coverageFor('cluster',worldNodes).some(r=>r.interactive));
});

test('Real request-layout geometry dims unrelated components, draws only the active path and restores materials',()=>{
 const built=buildWorldObjects();const ctx={...built,scene:new T.Scene(),routes:new T.Group(),particles:[new T.Mesh(new T.SphereGeometry(.1),new T.MeshBasicMaterial())],labelLayer:{append(){}},callbacks:{},connectionLabels:[],townProfile:requestProfile,referenceMode:true,teaching:true,selected:'users',flowId:requestFlowId,index:0,setDistrict(){},setFlow:KubernetesWorld.prototype.setFlow,clearRoutes:KubernetesWorld.prototype.clearRoutes,drawReferenceConnections:KubernetesWorld.prototype.drawReferenceConnections,updateFocusMaterials:KubernetesWorld.prototype.updateFocusMaterials};
 const saved=globalThis.document;globalThis.document={createElement:()=>({style:{},setAttribute(){},addEventListener(){},remove(){}})};
 try{
  KubernetesWorld.prototype.setLearning.call(ctx,requestProfile.nodeIds,requestProfile.layout);KubernetesWorld.prototype.setFocusFlow.call(ctx,true);assert.equal(ctx.referenceCurves.length,1);assert.equal(ctx.connectionLabels.length,1);assert.equal(ctx.packetLabel.textContent,'DNS query');
  const inactive=built.meshes.find(m=>m.userData.nodeId==='api'),active=built.meshes.find(m=>m.userData.nodeId==='users');assert.equal(inactive.material.opacity,.16);assert.equal(active.material,active.userData.dimOriginal);
  ctx.setFlow(requestFlowId,5,{flow:requestFlowId,node:'network-policy',blockedStep:5});assert.equal(ctx.particles[0].visible,false);assert.match(ctx.packetLabel.textContent,/Blocked/);
  KubernetesWorld.prototype.setBoundaries.call(ctx,requestBoundaries);assert.equal(ctx.boundaryGroup.children.length,6);assert.equal(ctx.boundaryLabels.length,6);for(const mesh of ctx.boundaryGroup.children){mesh.geometry.computeBoundingSphere();assert.ok(Number.isFinite(mesh.geometry.boundingSphere.radius));}
  for(const [id,point]of Object.entries(requestProfile.layout))assert.ok(ctx.objects.get(id).getWorldPosition(new T.Vector3()).distanceTo(new T.Vector3(...point))<1e-7);
  KubernetesWorld.prototype.setBoundaries.call(ctx,[]);assert.equal(ctx.boundaryGroup.children.length,0);KubernetesWorld.prototype.setFocusFlow.call(ctx,false);assert.equal(inactive.material,inactive.userData.dimOriginal);
 }finally{globalThis.document=saved;}
});
