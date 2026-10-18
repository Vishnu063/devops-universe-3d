import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three-engine.js';
import {parseComfort,defaultComfort,nextCityHint} from '../dist/interface-comfort.js';
import {buildWorldObjects,KubernetesWorld} from '../dist/world-scene.js';
import {townProfiles} from '../dist/town-models.js';
import {worldNodes} from '../dist/world-data.js';

test('Comfort preferences preserve the system motion default and reject unsupported stored settings',()=>{
 assert.deepEqual(parseComfort('bad',true),defaultComfort(true));assert.equal(parseComfort('{"version":1,"quality":"ultra","reducedMotion":"false"}',true).quality,'normal');assert.equal(parseComfort('{"version":1,"quality":"low","reducedMotion":false,"introSeen":true}',true).reducedMotion,false);assert.equal(parseComfort('{"version":1,"introSeen":true}').introSeen,true);assert.match(nextCityHint([]),/Start scan/);assert.match(nextCityHint(['git']),/Security/);assert.match(nextCityHint(Array(30).fill('git')),/All topics found/);
});

test('Low quality reduces distant scene details and pixel ratio without changing the underlying model',()=>{
 const built=buildWorldObjects(),ctx={...built,townProfile:townProfiles.environment,referenceMode:true,learningIds:new Set(worldNodes.map(n=>n.id)),selected:'environment',camera:new T.PerspectiveCamera(48,1.5,.03,800),renderer:{setPixelRatio(v){this.ratio=v;}},controls:{},resize(){},flowId:'town-environment',setFlow(){this.rebuilt=true;}};ctx.camera.position.set(200,180,200);KubernetesWorld.prototype.updateVisibility.call(ctx);const before=ctx.referenceOwn.size;KubernetesWorld.prototype.setComfort.call(ctx,{quality:'low',reducedMotion:true});KubernetesWorld.prototype.updateVisibility.call(ctx);assert.ok(ctx.referenceOwn.size<before);assert.ok(ctx.renderer.ratio<=.85);assert.equal(ctx.reduced,true);assert.equal(ctx.controls.enableDamping,false);assert.equal(built.objects.size,190);ctx.builderMode=true;ctx.rebuilt=false;KubernetesWorld.prototype.setComfort.call(ctx,{quality:'normal',reducedMotion:false});assert.equal(ctx.rebuilt,false);assert.equal(ctx.lowQuality,false);
});
