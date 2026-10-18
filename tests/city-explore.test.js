import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three-engine.js';
import {courses} from '../dist/curriculum.js';
import {worldNodes,worldFlows,beginnerProfiles} from '../dist/world-data.js';
import {topicLandmarks,hiddenTopics,emptyCityProgress,parseCityProgress,discoverTopics,learningOrder,scanTopicNodes} from '../dist/city-explore.js';
import {buildWorldObjects,KubernetesWorld} from '../dist/world-scene.js';

test('Every course has a unique discovery landmark and a bounded beginner view with truthful relationships',()=>{
 assert.equal(Object.keys(topicLandmarks).length,30);assert.equal(new Set(Object.values(topicLandmarks)).size,30);
 const order=learningOrder(courses);for(const c of courses){assert.ok(worldNodes.some(n=>n.id===topicLandmarks[c.id]));const p=beginnerProfiles[c.id];assert.ok(p.nodeIds.length>=3&&p.nodeIds.length<=4,c.id);assert.ok(p.nodeIds.includes(topicLandmarks[c.id]));for(const prereq of c.prerequisites)assert.ok(order.findIndex(c=>c.id===prereq)<order.findIndex(x=>x.id===c.id));const steps=worldFlows[p.flowId].steps;assert.ok(steps.length);for(const s of steps){assert.ok(p.nodeIds.includes(s.from));assert.ok(p.nodeIds.includes(s.to));if(s.transport)assert.ok(steps.some(other=>other.from===s.to&&other.to===s.from&&other.exchange===s.exchange));}}
});

test('Discovery saves unique seen topics without granting reading, practice or mastery',()=>{
 const original=emptyCityProgress(),a=discoverTopics(original,[topicLandmarks.observability,topicLandmarks.git]);assert.deepEqual(original.discovered,[]);assert.deepEqual(new Set(a.newIds),new Set(['observability','git']));assert.equal(discoverTopics(a.state,Object.values(topicLandmarks)).state.discovered.length,30);assert.equal(discoverTopics(a.state,[topicLandmarks.git]).newIds.length,0);assert.ok(!('courses' in a.state));assert.ok(!('practice' in a.state));assert.ok(!('mastered' in a.state));
 const far=scanTopicNodes(0,worldNodes),all=scanTopicNodes(1,worldNodes);assert.ok(far.length<all.length);assert.equal(all.length,30);assert.equal(new Set(all).size,30);
});

test('City storage rejects forged topics and stale positions, clamps valid steps and tolerates corruption',()=>{
 assert.deepEqual(parseCityProgress('invalid',courses,worldNodes,worldFlows),emptyCityProgress());const p=parseCityProgress(JSON.stringify({version:1,discovered:['git','git','fake'],lastConcept:'fake',view:'2d',started:true,towns:{'git-district':{flowId:'town-git-district',step:99999,selected:'fake'},fake:{flowId:'traffic',step:0},cluster:{flowId:'unknown',step:0}}}),courses,worldNodes,worldFlows);assert.deepEqual(p.discovered,['git']);assert.equal(p.lastConcept,'practices');assert.equal(p.view,'2d');assert.equal(p.started,true);assert.equal(p.towns['git-district'].step,worldFlows['town-git-district'].steps.length-1);assert.equal(p.towns['git-district'].selected,'git-district');assert.ok(!p.towns.fake&&!p.towns.cluster);
});

test('Actual scene discovery darkens selected hidden landmarks, lights discoveries and restores teaching visibility',()=>{
 const built=buildWorldObjects(),ctx={...built,scene:new T.Scene(),updateFocusMaterials:KubernetesWorld.prototype.updateFocusMaterials};
 const spec={landmarks:topicLandmarks,hiddenTopics,discovered:[],enabled:true};KubernetesWorld.prototype.setTopicDiscovery.call(ctx,spec);assert.equal(ctx.topicBeacons.length,30);assert.ok(ctx.hiddenDiscoveryNodes.has('prometheus'));const mesh=built.meshes.find(m=>m.userData.nodeId==='prometheus');assert.equal(mesh.material.opacity,.025);
 KubernetesWorld.prototype.setTopicDiscovery.call(ctx,{...spec,discovered:['observability']});assert.ok(!ctx.hiddenDiscoveryNodes.has('prometheus'));assert.equal(mesh.material.emissive.getHex(),0xffa54b);assert.equal(ctx.topicBeacons.find(b=>b.userData.topic==='observability').material,ctx.topicBeaconMaterials.found);
 KubernetesWorld.prototype.setTopicDiscovery.call(ctx,{...spec,enabled:false});assert.equal(ctx.topicBeaconGroup.visible,false);assert.equal(ctx.hiddenDiscoveryNodes.size,0);assert.equal(mesh.material,mesh.userData.dimOriginal);
});
